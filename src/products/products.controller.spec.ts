import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TestDatabaseModule } from './test/test-database.module';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';

describe('ProductsController (Integration)', () => {
  let controller: ProductsController;
  let service: ProductsService;
  let repository: Repository<Product>;
  let module: TestingModule;

  const mockJwtAuthGuard: CanActivate = {
    canActivate: jest.fn(() => true),
  };

  const createProductDto: CreateProductDto = {
    name: 'Test Product',
    sku: 'TEST-001',
    description: 'A product for testing',
    price: 100,
    stock: 10,
    category: 'testing',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      controllers: [ProductsController],
      providers: [ProductsService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));

    await repository.clear();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const result = await controller.create(createProductDto);
      expect(result).toBeDefined();
      expect(result.name).toBe(createProductDto.name);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      await service.create(createProductDto);
      const result = await controller.findAll();
      expect(result.products).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const created = await service.create(createProductDto);
      const found = await controller.findOne(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const created = await service.create(createProductDto);
      const updateDto: UpdateProductDto = { name: 'Updated Name' };
      const updated = await controller.update(created.id, updateDto);
      expect(updated.name).toBe('Updated Name');
    });
  });

  describe('remove', () => {
    it('should remove a product successfully', async () => {
      const created = await service.create(createProductDto);
      const result = await controller.remove(created.id);
      expect(result).toBeUndefined();
    });
  });
});
