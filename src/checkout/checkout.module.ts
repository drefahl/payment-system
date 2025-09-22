import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { Checkout } from './entities/checkout.entity';
import { CheckoutItem } from './entities/checkout-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Checkout, CheckoutItem, Product, User])],
  providers: [CheckoutService],
  controllers: [CheckoutController],
  exports: [CheckoutService],
})
export class CheckoutModule {}
