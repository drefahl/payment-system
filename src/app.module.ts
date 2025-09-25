import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getConfigModuleOptions } from './config/env.config';
import { getDatabaseConfig } from './config/database.config';
import { getBullMQConfig } from './config/bullmq.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot(getConfigModuleOptions()),
    getDatabaseConfig(),
    getBullMQConfig(),
    UsersModule,
    AuthModule,
    ProductsModule,
    CheckoutModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
