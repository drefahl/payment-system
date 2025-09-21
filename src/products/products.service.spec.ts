import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TestDatabaseModule } from './test/test-database.module';

describe('ProductsService (Integration)', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let module: TestingModule;

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
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));

    await repository.clear().catch(() => {});
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const result = await service.create(createProductDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createProductDto.name);
      expect(result.sku).toBe(createProductDto.sku);
      expect(result.price).toBe(createProductDto.price);

      const savedProduct = await repository.findOne({ where: { sku: createProductDto.sku } });
      expect(savedProduct).toBeDefined();
    });

    it('should throw BadRequestException if SKU already exists', async () => {
      await service.create(createProductDto);
      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      for (let i = 0; i < 15; i++) {
        await service.create({ ...createProductDto, name: `Product ${i}`, sku: `SKU-${i}` });
      }

      const result = await service.findAll(undefined, undefined, undefined, 1, 10);
      expect(result.products).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const created = await service.create(createProductDto);
      const found = await service.findOne(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should throw NotFoundException if product not found', async () => {
      await expect(service.findOne('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySku', () => {
    it('should return a product by sku', async () => {
      const created = await service.create(createProductDto);
      const found = await service.findBySku(created.sku ?? '');
      expect(found).toBeDefined();
      expect(found.sku).toBe(created.sku);
    });

    it('should throw NotFoundException if product not found', async () => {
      await expect(service.findBySku('non-existent-sku')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const created = await service.create(createProductDto);
      const updateDto: UpdateProductDto = { name: 'Updated Name' };
      const updated = await service.update(created.id, updateDto);
      expect(updated.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if product not found', async () => {
      await expect(service.update('00000000-0000-0000-0000-000000000000', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStock', () => {
    it('should increase stock', async () => {
      const created = await service.create(createProductDto);
      const updated = await service.updateStock(created.id, 5);
      expect(updated.stock).toBe(15);
    });

    it('should decrease stock', async () => {
      const created = await service.create(createProductDto);
      const updated = await service.updateStock(created.id, -5);
      expect(updated.stock).toBe(5);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      const created = await service.create(createProductDto);
      await expect(service.updateStock(created.id, -15)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const created = await service.create(createProductDto);
      await service.remove(created.id);
      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if product not found', async () => {
      await expect(service.remove('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should toggle isActive status', async () => {
      const created = await service.create(createProductDto);
      expect(created.isActive).toBe(true);
      const toggled = await service.toggleActive(created.id);
      expect(toggled.isActive).toBe(false);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      await service.create({ ...createProductDto, category: 'cat1', sku: 'SKU1' });
      await service.create({ ...createProductDto, category: 'cat2', sku: 'SKU2' });
      const found = await service.findByCategory('cat1');
      expect(found).toHaveLength(1);
      expect(found[0].category).toBe('cat1');
    });
  });

  describe('findLowStock', () => {
    it('should return products with low stock', async () => {
      await service.create({ ...createProductDto, stock: 5, sku: 'SKU1' });
      await service.create({ ...createProductDto, stock: 15, sku: 'SKU2' });
      const found = await service.findLowStock(10);
      expect(found).toHaveLength(1);
      expect(found[0].stock).toBe(5);
    });
  });
});
