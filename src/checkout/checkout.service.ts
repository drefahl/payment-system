import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkout } from './entities/checkout.entity';
import { CheckoutItem } from './entities/checkout-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { isValidUUID } from '../common/utils/uuid.util';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    @InjectRepository(CheckoutItem)
    private readonly checkoutItemRepository: Repository<CheckoutItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCheckoutDto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    const { userId, items } = createCheckoutDto;

    if (!isValidUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let totalAmount = 0;
    const checkoutItems: Partial<CheckoutItem>[] = [];

    for (const item of items) {
      if (!isValidUUID(item.productId)) {
        throw new BadRequestException(`Invalid product ID format: ${item.productId}`);
      }

      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`,
        );
      }

      const subtotal = Number(product.price) * item.quantity;
      totalAmount += subtotal;

      checkoutItems.push({
        productId: item.productId,
        quantity: item.quantity,
        subtotal,
      });
    }

    const checkout = this.checkoutRepository.create({
      userId,
      totalAmount,
    });

    const savedCheckout = await this.checkoutRepository.save(checkout);

    for (const item of checkoutItems) {
      const checkoutItem = this.checkoutItemRepository.create({
        ...item,
        checkoutId: savedCheckout.id,
      });
      await this.checkoutItemRepository.save(checkoutItem);
    }

    return this.findOne(savedCheckout.id);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ checkouts: CheckoutResponseDto[]; total: number; page: number; limit: number }> {
    const query = this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    query.orderBy('checkout.createdAt', 'DESC');

    const [checkouts, total] = await query.getManyAndCount();

    return {
      checkouts: checkouts.map(checkout => new CheckoutResponseDto(checkout)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<CheckoutResponseDto> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid checkout ID format');
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    if (!checkout) {
      throw new NotFoundException(`Checkout with ID ${id} not found`);
    }

    return new CheckoutResponseDto(checkout);
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ checkouts: CheckoutResponseDto[]; total: number; page: number; limit: number }> {
    if (!isValidUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const query = this.checkoutRepository
      .createQueryBuilder('checkout')
      .leftJoinAndSelect('checkout.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('checkout.userId = :userId', { userId });

    const offset = (page - 1) * limit;
    query.skip(offset).take(limit);

    query.orderBy('checkout.createdAt', 'DESC');

    const [checkouts, total] = await query.getManyAndCount();

    return {
      checkouts: checkouts.map(checkout => new CheckoutResponseDto(checkout)),
      total,
      page,
      limit,
    };
  }

  async update(id: string, updateCheckoutDto: UpdateCheckoutDto): Promise<CheckoutResponseDto> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid checkout ID format');
    }

    const checkout = await this.checkoutRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!checkout) {
      throw new NotFoundException(`Checkout with ID ${id} not found`);
    }

    if (updateCheckoutDto.items) {
      await this.checkoutItemRepository.delete({ checkoutId: id });

      let totalAmount = 0;
      for (const item of updateCheckoutDto.items) {
        if (!isValidUUID(item.productId)) {
          throw new BadRequestException(`Invalid product ID format: ${item.productId}`);
        }

        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        const subtotal = Number(product.price) * item.quantity;
        totalAmount += subtotal;

        const checkoutItem = this.checkoutItemRepository.create({
          checkoutId: id,
          productId: item.productId,
          quantity: item.quantity,
          subtotal,
        });
        await this.checkoutItemRepository.save(checkoutItem);
      }

      const updateData: Partial<Checkout> = { totalAmount };
      await this.checkoutRepository.update(id, updateData);
    } else {
      const { items: _, ...updateData } = updateCheckoutDto;
      await this.checkoutRepository.update(id, updateData);
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    if (!isValidUUID(id)) {
      throw new BadRequestException('Invalid checkout ID format');
    }

    const checkout = await this.checkoutRepository.findOne({ where: { id } });

    if (!checkout) {
      throw new NotFoundException(`Checkout with ID ${id} not found`);
    }

    await this.checkoutItemRepository.delete({ checkoutId: id });
    await this.checkoutRepository.delete(id);
  }
}
