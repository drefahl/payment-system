import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Checkout } from '../checkout/entities/checkout.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentStatusResponseDto } from './dto/payment-status-response.dto';
import { PaymentJobData, NotificationJobData } from './payment.processor';
import { isValidUUID } from '../common/utils/uuid.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    @InjectQueue('payment-processing')
    private readonly paymentQueue: Queue,
    @InjectQueue('payment-notifications')
    private readonly notificationQueue: Queue,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const { checkoutId, method, transactionId } = createPaymentDto;

    // Validate UUID
    if (!isValidUUID(checkoutId)) {
      throw new BadRequestException('Invalid checkout ID format');
    }

    // Verify checkout exists and get amount
    const checkout = await this.checkoutRepository.findOne({
      where: { id: checkoutId },
    });

    if (!checkout) {
      throw new NotFoundException(`Checkout with ID ${checkoutId} not found`);
    }

    // Check if payment already exists for this checkout
    const existingPayment = await this.paymentRepository.findOne({
      where: { checkoutId },
    });

    if (existingPayment) {
      throw new BadRequestException(`Payment already exists for checkout ${checkoutId}`);
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      checkoutId,
      amount: checkout.totalAmount,
      method,
      status: PaymentStatus.PENDING,
      transactionId,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Add job to queue for processing
    const jobData: PaymentJobData = {
      paymentId: savedPayment.id,
      amount: Number(checkout.totalAmount),
      method,
      transactionId,
    };

    await this.paymentQueue.add('process-payment', jobData, {
      delay: 1000, // Start processing after 1 second
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50, // Keep last 50 completed jobs
      removeOnFail: 100, // Keep last 100 failed jobs
    });

    return new PaymentResponseDto(savedPayment);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ payments: PaymentResponseDto[]; total: number; page: number; limit: number }> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.checkout', 'checkout');

    // Paginação
    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    // Ordenação por data de criação (mais recentes primeiro)
    query.orderBy('payment.createdAt', 'DESC');

    const [payments, total] = await query.getManyAndCount();

    return {
      payments: payments.map(payment => new PaymentResponseDto(payment)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PaymentResponseDto> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['checkout'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return new PaymentResponseDto(payment);
  }

  async getStatus(id: string): Promise<PaymentStatusResponseDto> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id },
      select: ['id', 'status', 'updatedAt', 'failureReason'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return new PaymentStatusResponseDto(payment);
  }

  async findByCheckout(checkoutId: string): Promise<PaymentResponseDto | null> {
    if (!isValidUUID(checkoutId)) {
      throw new BadRequestException('Invalid checkout ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { checkoutId },
      relations: ['checkout'],
    });

    return payment ? new PaymentResponseDto(payment) : null;
  }

  async cancelPayment(id: string): Promise<PaymentResponseDto> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel payment with status ${payment.status}. Only pending payments can be cancelled.`,
      );
    }

    await this.paymentRepository.update(id, {
      status: PaymentStatus.CANCELLED,
      failureReason: 'Payment cancelled by user',
      processedAt: new Date(),
    });

    const updatedPayment = await this.findOne(id);
    return updatedPayment;
  }

  // BullMQ Queue Management Methods

  async processPaymentWithPriority(
    createPaymentDto: CreatePaymentDto,
    priority: number = 0,
  ): Promise<PaymentResponseDto> {
    const paymentResponse = await this.create(createPaymentDto);

    // Add a high priority job
    const jobData: PaymentJobData = {
      paymentId: paymentResponse.id,
      amount: paymentResponse.amount,
      method: paymentResponse.method,
      transactionId: paymentResponse.transactionId,
    };

    await this.paymentQueue.add('process-payment', jobData, {
      priority, // Lower numbers = higher priority
      removeOnComplete: 50,
      removeOnFail: 100,
    });

    return paymentResponse;
  }

  async processPaymentWithDelay(createPaymentDto: CreatePaymentDto, delayMs: number): Promise<PaymentResponseDto> {
    const paymentResponse = await this.create(createPaymentDto);

    const jobData: PaymentJobData = {
      paymentId: paymentResponse.id,
      amount: paymentResponse.amount,
      method: paymentResponse.method,
      transactionId: paymentResponse.transactionId,
    };

    await this.paymentQueue.add('process-payment', jobData, {
      delay: delayMs,
      removeOnComplete: 50,
      removeOnFail: 100,
    });

    return paymentResponse;
  }

  async retryFailedPayment(paymentId: string): Promise<void> {
    if (!isValidUUID(paymentId)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.FAILED) {
      throw new BadRequestException('Only failed payments can be retried');
    }

    // Reset payment status to pending and clear failure reason
    const paymentToUpdate = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (paymentToUpdate) {
      paymentToUpdate.status = PaymentStatus.PENDING;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      paymentToUpdate.failureReason = null as any; // Clear the failure reason
      await this.paymentRepository.save(paymentToUpdate);
    }

    // Add retry job to queue
    const jobData: PaymentJobData = {
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId,
      retryCount: 1,
    };

    await this.paymentQueue.add('process-payment', jobData, {
      delay: 5000, // Wait 5 seconds before retry
      attempts: 2, // Fewer attempts for retry
      removeOnComplete: 50,
      removeOnFail: 100,
    });
  }

  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.paymentQueue.getWaiting(),
      this.paymentQueue.getActive(),
      this.paymentQueue.getCompleted(),
      this.paymentQueue.getFailed(),
      this.paymentQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.paymentQueue.pause();
  }

  async resumeQueue(): Promise<void> {
    await this.paymentQueue.resume();
  }

  async cleanQueue(): Promise<void> {
    await this.paymentQueue.clean(0, 100, 'completed');
    await this.paymentQueue.clean(0, 100, 'failed');
  }

  async sendPaymentNotification(paymentId: string, type: 'success' | 'failure'): Promise<void> {
    if (!isValidUUID(paymentId)) {
      throw new BadRequestException('Invalid payment ID format');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['checkout'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const notificationData: NotificationJobData = {
      type: type === 'success' ? 'payment-success' : 'payment-failure',
      paymentId,
      email: 'user@example.com', // In real app, get from user/checkout
      amount: payment.amount,
    };

    await this.notificationQueue.add('send-notification', notificationData, {
      removeOnComplete: 50,
      removeOnFail: 100,
    });
  }
}
