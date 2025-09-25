import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { Payment } from '../entities/payment.entity';
import { Checkout } from '../../checkout/entities/checkout.entity';
import { CheckoutItem } from '../../checkout/entities/checkout-item.entity';
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
      entities: [Payment, Checkout, CheckoutItem, Product, User],
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
    TypeOrmModule.forFeature([Payment, Checkout, CheckoutItem, Product, User]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        db: 1, // Use different DB for tests
      },
    }),
    BullModule.registerQueue({
      name: 'payment-processing',
    }),
    BullModule.registerQueue({
      name: 'payment-notifications',
    }),
  ],
  exports: [TypeOrmModule, BullModule],
})
export class TestDatabaseModule {}
