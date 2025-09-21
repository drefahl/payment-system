import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    // Verificar se já existe produto com o mesmo SKU
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new BadRequestException(`Product with SKU ${createProductDto.sku} already exists`);
    }

    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    return this.mapToResponseDto(savedProduct);
  }

  async findAll(
    category?: string,
    search?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ products: ProductResponseDto[]; total: number; page: number; limit: number }> {
    const query = this.productRepository.createQueryBuilder('product');

    // Filtros opcionais
    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    if (search) {
      query.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive });
    }

    // Paginação
    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    // Ordenação por data de criação (mais recentes primeiro)
    query.orderBy('product.createdAt', 'DESC');

    const [products, total] = await query.getManyAndCount();

    return {
      products: products.map(product => this.mapToResponseDto(product)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async findBySku(sku: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { sku },
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return this.mapToResponseDto(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Se estiver atualizando o SKU, verificar se não existe outro produto com o mesmo SKU
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct) {
        throw new BadRequestException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    // Atualizar campos
    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    return this.mapToResponseDto(updatedProduct);
  }

  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Current stock: ${product.stock}, requested: ${Math.abs(quantity)}`,
      );
    }

    product.stock = newStock;
    const updatedProduct = await this.productRepository.save(product);

    return this.mapToResponseDto(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async toggleActive(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    product.isActive = !product.isActive;
    const updatedProduct = await this.productRepository.save(product);

    return this.mapToResponseDto(updatedProduct);
  }

  async findByCategory(category: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        category,
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });

    return products.map(product => this.mapToResponseDto(product));
  }

  async findLowStock(threshold: number = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        isActive: true,
      },
      order: { stock: 'ASC' },
    });

    const lowStockProducts = products.filter(product => product.stock <= threshold);
    return lowStockProducts.map(product => this.mapToResponseDto(product));
  }

  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price.toString()),
      category: product.category,
      stock: product.stock,
      isActive: product.isActive,
      imageUrl: product.imageUrl,
      sku: product.sku,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
