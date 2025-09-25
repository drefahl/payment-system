import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { Checkout } from './entities/checkout.entity';
import { CheckoutItem } from './entities/checkout-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { TestDatabaseModule } from './test/test-database.module';
import * as bcrypt from 'bcrypt';

describe('CheckoutService (Integration)', () => {
  let service: CheckoutService;
  let checkoutRepository: Repository<Checkout>;
  let checkoutItemRepository: Repository<CheckoutItem>;
  let productRepository: Repository<Product>;
  let userRepository: Repository<User>;
  let module: TestingModule;

  let testUser: User;
  let testProduct1: Product;
  let testProduct2: Product;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      providers: [CheckoutService],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    checkoutRepository = module.get<Repository<Checkout>>(getRepositoryToken(Checkout));
    checkoutItemRepository = module.get<Repository<CheckoutItem>>(getRepositoryToken(CheckoutItem));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Clear all repositories
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

    testProduct1 = await productRepository.save({
      name: 'Test Product 1',
      description: 'Test Description 1',
      price: 10.99,
      category: 'Electronics',
      stock: 100,
    });

    testProduct2 = await productRepository.save({
      name: 'Test Product 2',
      description: 'Test Description 2',
      price: 25.5,
      category: 'Books',
      stock: 50,
    });
  });

  afterEach(async () => {
    await checkoutItemRepository.clear().catch(() => {});
    await checkoutRepository.clear().catch(() => {});
    await productRepository.clear().catch(() => {});
    await userRepository.clear().catch(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(checkoutRepository).toBeDefined();
    expect(checkoutItemRepository).toBeDefined();
    expect(productRepository).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe('create', () => {
    const createCheckoutDto: CreateCheckoutDto = {
      userId: '',
      items: [
        { productId: '', quantity: 2 },
        { productId: '', quantity: 1 },
      ],
    };

    beforeEach(() => {
      createCheckoutDto.userId = testUser.id;
      createCheckoutDto.items[0].productId = testProduct1.id;
      createCheckoutDto.items[1].productId = testProduct2.id;
    });

    it('should create a checkout successfully', async () => {
      const result = await service.create(createCheckoutDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUser.id);
      expect(result.items).toHaveLength(2);
      expect(Number(result.totalAmount)).toBeCloseTo(10.99 * 2 + 25.5 * 1, 2); // 47.48
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      // Verify items
      expect(result.items[0].productId).toBe(testProduct1.id);
      expect(result.items[0].quantity).toBe(2);
      expect(Number(result.items[0].subtotal)).toBeCloseTo(10.99 * 2, 2);

      expect(result.items[1].productId).toBe(testProduct2.id);
      expect(result.items[1].quantity).toBe(1);
      expect(Number(result.items[1].subtotal)).toBeCloseTo(25.5 * 1, 2);

      // Verify database
      const savedCheckout = await checkoutRepository.findOne({
        where: { id: result.id },
        relations: ['items'],
      });
      expect(savedCheckout).toBeDefined();
      expect(savedCheckout?.items).toHaveLength(2);
    });

    it('should throw BadRequestException for invalid user ID format', async () => {
      const invalidDto = { ...createCheckoutDto, userId: 'invalid-uuid' };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const invalidDto = { ...createCheckoutDto, userId: '550e8400-e29b-41d4-a716-446655440000' };

      await expect(service.create(invalidDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid product ID format', async () => {
      const invalidDto = {
        ...createCheckoutDto,
        items: [{ productId: 'invalid-uuid', quantity: 1 }],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      const invalidDto = {
        ...createCheckoutDto,
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
      };

      await expect(service.create(invalidDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const insufficientDto = {
        ...createCheckoutDto,
        items: [{ productId: testProduct1.id, quantity: 200 }], // More than stock (100)
      };

      await expect(service.create(insufficientDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test checkouts
      await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct1.id, quantity: 1 }],
      });
      await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct2.id, quantity: 2 }],
      });
    });

    it('should return paginated checkouts', async () => {
      const result = await service.findAll(1, 10);

      expect(result).toBeDefined();
      expect(result.checkouts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.checkouts[0].items).toBeDefined();
    });

    it('should handle pagination correctly', async () => {
      const result = await service.findAll(1, 1);

      expect(result.checkouts).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should return empty array when no checkouts exist', async () => {
      // Delete all checkout items and checkouts
      const allCheckouts = await checkoutRepository.find();
      const allItems = await checkoutItemRepository.find();

      if (allItems.length > 0) {
        await checkoutItemRepository.remove(allItems);
      }
      if (allCheckouts.length > 0) {
        await checkoutRepository.remove(allCheckouts);
      }

      const result = await service.findAll();
      expect(result.checkouts).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    let testCheckout: { id: string };

    beforeEach(async () => {
      testCheckout = await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct1.id, quantity: 2 }],
      });
    });

    it('should return a checkout by id with relations', async () => {
      const result = await service.findOne(testCheckout.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(testCheckout.id);
      expect(result.userId).toBe(testUser.id);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(testProduct1.id);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if checkout not found', async () => {
      await expect(service.findOne('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUser', () => {
    beforeEach(async () => {
      // Create checkouts for test user
      await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct1.id, quantity: 1 }],
      });
      await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct2.id, quantity: 2 }],
      });

      // Create another user and checkout
      const otherUser = await userRepository.save({
        name: 'Other User',
        email: 'other@example.com',
        password: await bcrypt.hash('password123', 10),
      });
      await service.create({
        userId: otherUser.id,
        items: [{ productId: testProduct1.id, quantity: 1 }],
      });
    });

    it('should return checkouts for specific user only', async () => {
      const result = await service.findByUser(testUser.id, 1, 10);

      expect(result).toBeDefined();
      expect(result.checkouts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.checkouts.every(checkout => checkout.userId === testUser.id)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const result = await service.findByUser(testUser.id, 1, 1);

      expect(result.checkouts).toHaveLength(1);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should throw BadRequestException for invalid user ID format', async () => {
      await expect(service.findByUser('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should return empty array for user with no checkouts', async () => {
      const newUser = await userRepository.save({
        name: 'New User',
        email: 'new@example.com',
        password: await bcrypt.hash('password123', 10),
      });

      const result = await service.findByUser(newUser.id);
      expect(result.checkouts).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('update', () => {
    let testCheckout: { id: string; totalAmount: number };

    beforeEach(async () => {
      testCheckout = await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct1.id, quantity: 1 }],
      });
    });

    it('should update checkout items successfully', async () => {
      const updateDto: UpdateCheckoutDto = {
        items: [{ productId: testProduct2.id, quantity: 3 }],
      };

      const result = await service.update(testCheckout.id, updateDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(testProduct2.id);
      expect(result.items[0].quantity).toBe(3);
      expect(Number(result.totalAmount)).toBe(25.5 * 3); // 76.5

      // Verify old items were removed
      const oldItems = await checkoutItemRepository.find({
        where: { checkoutId: testCheckout.id, productId: testProduct1.id },
      });
      expect(oldItems).toHaveLength(0);
    });

    it('should update without changing items', async () => {
      const updateDto: UpdateCheckoutDto = {};

      const result = await service.update(testCheckout.id, updateDto);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(testProduct1.id);
      expect(result.totalAmount).toBe(testCheckout.totalAmount);
    });

    it('should throw BadRequestException for invalid checkout ID format', async () => {
      const updateDto: UpdateCheckoutDto = { items: [] };

      await expect(service.update('invalid-uuid', updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if checkout not found', async () => {
      const updateDto: UpdateCheckoutDto = { items: [] };

      await expect(service.update('550e8400-e29b-41d4-a716-446655440000', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-existent product in update', async () => {
      const updateDto: UpdateCheckoutDto = {
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
      };

      await expect(service.update(testCheckout.id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    let testCheckout: { id: string };

    beforeEach(async () => {
      testCheckout = await service.create({
        userId: testUser.id,
        items: [{ productId: testProduct1.id, quantity: 1 }],
      });
    });

    it('should remove a checkout and its items successfully', async () => {
      await service.remove(testCheckout.id);

      // Verify checkout was deleted
      const deletedCheckout = await checkoutRepository.findOne({
        where: { id: testCheckout.id },
      });
      expect(deletedCheckout).toBeNull();

      // Verify items were deleted
      const deletedItems = await checkoutItemRepository.find({
        where: { checkoutId: testCheckout.id },
      });
      expect(deletedItems).toHaveLength(0);
    });

    it('should throw BadRequestException for invalid ID format', async () => {
      await expect(service.remove('invalid-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if checkout not found', async () => {
      await expect(service.remove('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(NotFoundException);
    });
  });
});
