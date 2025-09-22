import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Checkout } from '../entities/checkout.entity';
import { CheckoutItem } from '../entities/checkout-item.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.test',
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5433'),
      username: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres123',
      database: process.env.DATABASE_NAME || 'payment_system_test',
      synchronize: true,
      dropSchema: true,
      logging: false,
      entities: [Checkout, CheckoutItem, Product, User],
    }),
    TypeOrmModule.forFeature([Checkout, CheckoutItem, Product, User]),
  ],
  exports: [TypeOrmModule],
})
export class TestDatabaseModule {}
