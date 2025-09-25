import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { Checkout } from '../checkout/entities/checkout.entity';
import { CheckoutItem } from '../checkout/entities/checkout-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TestDatabaseModule } from './test/test-database.module';
import * as bcrypt from 'bcrypt';

// Mock Queue
const mockQueue = {
  add: jest.fn().mockResolvedValue({ id: '123' }),
  getWaiting: jest.fn().mockResolvedValue([]),
  getActive: jest.fn().mockResolvedValue([]),
  getCompleted: jest.fn().mockResolvedValue([]),
  getFailed: jest.fn().mockResolvedValue([]),
  getDelayed: jest.fn().mockResolvedValue([]),
  pause: jest.fn().mockResolvedValue(undefined),
  resume: jest.fn().mockResolvedValue(undefined),
  clean: jest.fn().mockResolvedValue(undefined),
};

describe('PaymentsService (Integration)', () => {
  let service: PaymentsService;
  let paymentRepository: Repository<Payment>;
  let checkoutRepository: Repository<Checkout>;
  let checkoutItemRepository: Repository<CheckoutItem>;
  let productRepository: Repository<Product>;
  let userRepository: Repository<User>;
  let paymentQueue: Queue;
  let module: TestingModule;

  let testUser: User;
  let testProduct: Product;
  let testCheckout: Checkout;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      providers: [
        PaymentsService,
        {
          provide: getQueueToken('payment-processing'),
          useValue: mockQueue,
        },
        {
          provide: getQueueToken('payment-notifications'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get<Repository<Payment>>(getRepositoryToken(Payment));
    checkoutRepository = module.get<Repository<Checkout>>(getRepositoryToken(Checkout));
    checkoutItemRepository = module.get<Repository<CheckoutItem>>(getRepositoryToken(CheckoutItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    paymentQueue = module.get<Queue>(getQueueToken('payment-processing'));

    // Clear all repositories
    await paymentRepository.clear().catch(() => {});
    await checkoutItemRepository.clear().catch(() => {});
    await checkoutRepository.clear().catch(() => {});
    await productRepository.clear().catch(() => {});
    await userRepository.clear().catch(() => {});

    // Create test data
    testUser = await userRepository.save({
      name: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });

    testProduct = await productRepository.save({
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'Electronics',
      stock: 10,
    });

    testCheckout = await checkoutRepository.save({
      userId: testUser.id,
      totalAmount: 199.98,
    });

    await checkoutItemRepository.save({
      checkoutId: testCheckout.id,
      productId: testProduct.id,
      quantity: 2,
      subtotal: 199.98,
    });

    // Clear mock calls
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await paymentRepository.clear().catch(() => {});
    await checkoutItemRepository.clear().catch(() => {});
    await checkoutRepository.clear().catch(() => {});
    await productRepository.clear().catch(() => {});
    await userRepository.clear().catch(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(paymentRepository).toBeDefined();
    expect(checkoutRepository).toBeDefined();
    expect(paymentQueue).toBeDefined();
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      checkoutId: '',
      method: PaymentMethod.CREDIT_CARD,
      transactionId: 'txn_123456',
    };

    beforeEach(() => {
      createPaymentDto.checkoutId = testCheckout.id;
    });

    it('should create a payment successfully', async () => {
      const result = await service.create(createPaymentDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.checkoutId).toBe(testCheckout.id);
      expect(result.method).toBe(PaymentMethod.CREDIT_CARD);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(Number(result.amount)).toBeCloseTo(199.98, 2);
      expect(result.transactionId).toBe('txn_123456');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify payment was saved to database
      const savedPayment = await paymentRepository.findOne({
        where: { checkoutId: testCheckout.id },
      });
      expect(savedPayment).toBeDefined();
      expect(savedPayment?.status).toBe(PaymentStatus.PENDING);

      // Verify queue job was added
      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-payment',
        {
          paymentId: result.id,
          amount: 199.98,
          method: PaymentMethod.CREDIT_CARD,
          transactionId: 'txn_123456',
        },
        {
          delay: 1000,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      );
    });

    it('should create payment without transactionId', async () => {
      const dtoWithoutTransaction = {
        checkoutId: testCheckout.id,
        method: PaymentMethod.PIX,
      };

      const result = await service.create(dtoWithoutTransaction);

      expect(result.method).toBe(PaymentMethod.PIX);
      expect(result.transactionId).toBeNull();
    });

    it('should throw BadRequestException for invalid checkout ID format', async () => {
      const invalidDto = { ...createPaymentDto, checkoutId: 'invalid-uuid' };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent checkout', async () => {
      const invalidDto = { ...createPaymentDto, checkoutId: '550e8400-e29b-41d4-a716-446655440000' };

      await expect(service.create(invalidDto)).rejects.toThrow(NotFoundException);
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment already exists for checkout', async () => {
      // Create first payment
      await service.create(createPaymentDto);

      // Try to create second payment for same checkout
      await expect(service.create(createPaymentDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test payments
      await service.create({
        checkoutId: testCheckout.id,
        method: PaymentMethod.CREDIT_CARD,
        transactionId: 'txn_1',
      });

      // Create another checkout and payment
      const secondCheckout = await checkoutRepository.save({
        userId: testUser.id,
        totalAmount: 49.99,
      });

      await service.create({
        checkoutId: secondCheckout.id,
        method: PaymentMethod.PIX,
      });
    });

    it('should return paginated payments', async () => {
      const result = await service.findAll(1, 10);

      expect(result).toBeDefined();
      expect(result.payments).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.payments[0]).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const result = await service.findAll(1, 1);

      expect(result.payments).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should return empty array when no payments exist', async () => {
      // Clear all payments
      const allPayments = await paymentRepository.find();
      if (allPayments.length > 0) {
        await paymentRepository.remove(allPayments);
      }

      const result = await service.findAll();
      expect(result.payments).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createdPayment = await service.create({
        checkoutId: testCheckout.id,
        method: PaymentMethod.DEBIT_CARD,
        transactionId: 'txn_findone',
      });

      testPayment = (await paymentRepository.findOne({
        where: { id: createdPayment.id },
      })) as Payment;
    });

    it('should return a payment by id with relations', async () => {
      const result = await service.findOne(testPayment.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPayment.id);
      expect(result.checkoutId).toBe(testCheckout.id);
      expect(result.method).toBe(PaymentMethod.DEBIT_CARD);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      await expect(service.findOne('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatus', () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createdPayment = await service.create({
        checkoutId: testCheckout.id,
        method: PaymentMethod.BANK_TRANSFER,
      });

      testPayment = (await paymentRepository.findOne({
        where: { id: createdPayment.id },
      })) as Payment;
    });

    it('should return payment status', async () => {
      const result = await service.getStatus(testPayment.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPayment.id);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.updatedAt).toBeDefined();
      expect(result.failureReason).toBeNull();
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.getStatus('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      await expect(service.getStatus('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCheckout', () => {
    it('should return payment by checkout id', async () => {
      const createdPayment = await service.create({
        checkoutId: testCheckout.id,
        method: PaymentMethod.CREDIT_CARD,
      });

      const result = await service.findByCheckout(testCheckout.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(createdPayment.id);
      expect(result?.checkoutId).toBe(testCheckout.id);
    });

    it('should return null if no payment found for checkout', async () => {
      const anotherCheckout = await checkoutRepository.save({
        userId: testUser.id,
        totalAmount: 25.0,
      });

      const result = await service.findByCheckout(anotherCheckout.id);
      expect(result).toBeNull();
    });

    it('should throw BadRequestException for invalid checkout ID format', async () => {
      await expect(service.findByCheckout('invalid-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelPayment', () => {
    let testPayment: Payment;

    beforeEach(async () => {
      const createdPayment = await service.create({
        checkoutId: testCheckout.id,
        method: PaymentMethod.CREDIT_CARD,
      });

      testPayment = (await paymentRepository.findOne({
        where: { id: createdPayment.id },
      })) as Payment;
    });

    it('should cancel a pending payment successfully', async () => {
      const result = await service.cancelPayment(testPayment.id);

      expect(result.id).toBe(testPayment.id);
      expect(result.status).toBe(PaymentStatus.CANCELLED);
      expect(result.failureReason).toBe('Payment cancelled by user');
      expect(result.processedAt).toBeDefined();

      // Verify in database
      const updatedPayment = await paymentRepository.findOne({
        where: { id: testPayment.id },
      });
      expect(updatedPayment?.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.cancelPayment('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      await expect(service.cancelPayment('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment is not pending', async () => {
      // Update payment to completed status
      await paymentRepository.update(testPayment.id, {
        status: PaymentStatus.COMPLETED,
      });

      await expect(service.cancelPayment(testPayment.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('BullMQ Queue Methods', () => {
    let testPaymentForQueue: Payment;

    beforeEach(async () => {
      jest.clearAllMocks();

      // Create a test payment for queue operations
      testPaymentForQueue = await paymentRepository.save({
        checkoutId: testCheckout.id,
        amount: testCheckout.totalAmount,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        transactionId: 'txn_queue_test',
      });
    });

    describe('processPaymentWithPriority', () => {
      it('should create payment with priority', async () => {
        // Create a new checkout for this test
        const priorityCheckout = await checkoutRepository.save({
          userId: testUser.id,
          totalAmount: 299.99,
          status: 'pending',
        });

        const createPaymentDto: CreatePaymentDto = {
          checkoutId: priorityCheckout.id,
          method: PaymentMethod.CREDIT_CARD,
          transactionId: 'txn_priority_123',
        };

        const result = await service.processPaymentWithPriority(createPaymentDto, 1);

        expect(result.id).toBeDefined();
        expect(result.status).toBe(PaymentStatus.PENDING);

        // Verify priority queue job was added
        expect(mockQueue.add).toHaveBeenNthCalledWith(
          2, // Second call (first is from regular create)
          'process-payment',
          {
            paymentId: result.id,
            amount: result.amount,
            method: result.method,
            transactionId: result.transactionId,
          },
          {
            priority: 1,
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
      });
    });

    describe('processPaymentWithDelay', () => {
      it('should create payment with delay', async () => {
        // Create a new checkout for this test
        const delayedCheckout = await checkoutRepository.save({
          userId: testUser.id,
          totalAmount: 399.99,
          status: 'pending',
        });

        const createPaymentDto: CreatePaymentDto = {
          checkoutId: delayedCheckout.id,
          method: PaymentMethod.PIX,
          transactionId: 'txn_delayed_123',
        };

        const result = await service.processPaymentWithDelay(createPaymentDto, 30000);

        expect(result.id).toBeDefined();
        expect(result.status).toBe(PaymentStatus.PENDING);

        // Verify delayed queue job was added
        expect(mockQueue.add).toHaveBeenNthCalledWith(
          2, // Second call
          'process-payment',
          {
            paymentId: result.id,
            amount: result.amount,
            method: result.method,
            transactionId: result.transactionId,
          },
          {
            delay: 30000,
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
      });
    });

    describe('retryFailedPayment', () => {
      it('should retry a failed payment', async () => {
        // Set payment to failed status
        await paymentRepository.update(testPaymentForQueue.id, {
          status: PaymentStatus.FAILED,
          failureReason: 'Gateway timeout',
        });

        await service.retryFailedPayment(testPaymentForQueue.id);

        // Verify payment status was reset
        const updatedPayment = await paymentRepository.findOne({
          where: { id: testPaymentForQueue.id },
        });
        expect(updatedPayment?.status).toBe(PaymentStatus.PENDING);
        expect(updatedPayment?.failureReason).toBeNull();

        // Verify retry job was added
        expect(mockQueue.add).toHaveBeenCalledWith(
          'process-payment',
          {
            paymentId: testPaymentForQueue.id,
            amount: testPaymentForQueue.amount,
            method: testPaymentForQueue.method,
            transactionId: testPaymentForQueue.transactionId,
            retryCount: 1,
          },
          {
            delay: 5000,
            attempts: 2,
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
      });

      it('should throw BadRequestException if payment is not failed', async () => {
        await expect(service.retryFailedPayment(testPaymentForQueue.id)).rejects.toThrow(BadRequestException);
      });

      it('should throw NotFoundException if payment not found', async () => {
        await expect(service.retryFailedPayment('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('getQueueStatus', () => {
      it('should return queue status', async () => {
        const status = await service.getQueueStatus();

        expect(status).toEqual({
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        });

        expect(mockQueue.getWaiting).toHaveBeenCalled();
        expect(mockQueue.getActive).toHaveBeenCalled();
        expect(mockQueue.getCompleted).toHaveBeenCalled();
        expect(mockQueue.getFailed).toHaveBeenCalled();
        expect(mockQueue.getDelayed).toHaveBeenCalled();
      });
    });

    describe('pauseQueue', () => {
      it('should pause the queue', async () => {
        await service.pauseQueue();
        expect(mockQueue.pause).toHaveBeenCalled();
      });
    });

    describe('resumeQueue', () => {
      it('should resume the queue', async () => {
        await service.resumeQueue();
        expect(mockQueue.resume).toHaveBeenCalled();
      });
    });

    describe('cleanQueue', () => {
      it('should clean the queue', async () => {
        await service.cleanQueue();
        expect(mockQueue.clean).toHaveBeenCalledTimes(2);
        expect(mockQueue.clean).toHaveBeenNthCalledWith(1, 0, 100, 'completed');
        expect(mockQueue.clean).toHaveBeenNthCalledWith(2, 0, 100, 'failed');
      });
    });

    describe('sendPaymentNotification', () => {
      it('should send success notification', async () => {
        await service.sendPaymentNotification(testPaymentForQueue.id, 'success');

        expect(mockQueue.add).toHaveBeenCalledWith(
          'send-notification',
          {
            type: 'payment-success',
            paymentId: testPaymentForQueue.id,
            email: 'user@example.com',
            amount: Number(testPaymentForQueue.amount),
          },
          {
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
      });

      it('should send failure notification', async () => {
        await service.sendPaymentNotification(testPaymentForQueue.id, 'failure');

        expect(mockQueue.add).toHaveBeenCalledWith(
          'send-notification',
          {
            type: 'payment-failure',
            paymentId: testPaymentForQueue.id,
            email: 'user@example.com',
            amount: Number(testPaymentForQueue.amount),
          },
          {
            removeOnComplete: 50,
            removeOnFail: 100,
          },
        );
      });

      it('should throw NotFoundException if payment not found', async () => {
        await expect(
          service.sendPaymentNotification('550e8400-e29b-41d4-a716-446655440000', 'success'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
