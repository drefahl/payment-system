import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentProcessor } from './payment.processor';
import { PaymentEventsListener } from './payment-events.listener';
import { Payment } from './entities/payment.entity';
import { Checkout } from '../checkout/entities/checkout.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Checkout]),
    BullModule.registerQueue({
      name: 'payment-processing',
    }),
    BullModule.registerQueue({
      name: 'payment-notifications',
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentProcessor, PaymentEventsListener],
  exports: [PaymentsService],
})
export class PaymentsModule {}
