import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Payment, PaymentStatus } from './entities/payment.entity';

export interface PaymentJobData {
  paymentId: string;
  amount: number;
  method: string;
  transactionId?: string;
  retryCount?: number;
}

export interface NotificationJobData {
  type: 'payment-success' | 'payment-failure';
  paymentId: string;
  email?: string;
  amount?: number;
}

@Processor('payment-processing')
@Injectable()
export class PaymentProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentProcessor.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    super();
  }

  async process(job: Job<PaymentJobData | NotificationJobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'process-payment':
        return this.processPayment(job as Job<PaymentJobData>);
      case 'send-notification':
        return this.sendNotification(job as Job<NotificationJobData>);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error.message);
  }

  async processPayment(job: Job<PaymentJobData>): Promise<any> {
    const { paymentId, amount, method, transactionId, retryCount = 0 } = job.data;

    this.logger.log(`Processing payment ${paymentId} with amount ${amount} via ${method} (attempt ${retryCount + 1})`);

    try {
      // Update progress to 10%
      await job.updateProgress(10);

      // Update status to processing
      await this.paymentRepository.update(paymentId, {
        status: PaymentStatus.PROCESSING,
      });

      await job.updateProgress(30);

      // Validate payment data
      this.validatePaymentData(job.data);
      await job.updateProgress(50);

      // Simulate payment processing time (1-3 seconds)
      const processingTime = Math.floor(Math.random() * 2000) + 1000;
      await new Promise(resolve => setTimeout(resolve, processingTime));

      await job.updateProgress(80);

      // Simulate payment success/failure (90% success rate)
      const isSuccessful = Math.random() > 0.1;

      if (isSuccessful) {
        const result = await this.handleSuccessfulPayment(paymentId, transactionId);
        await job.updateProgress(100);
        this.logger.log(`Payment ${paymentId} processed successfully`);

        return {
          success: true,
          paymentId,
          transactionId: result.transactionId,
          processedAt: result.processedAt,
        };
      } else {
        await this.handleFailedPayment(paymentId, 'Payment declined by gateway');
        this.logger.warn(`Payment ${paymentId} failed`);

        return {
          success: false,
          paymentId,
          reason: 'Payment declined by gateway',
        };
      }
    } catch (error) {
      this.logger.error(`Error processing payment ${paymentId}:`, error);
      await this.handleFailedPayment(paymentId, 'Internal processing error');
      throw error;
    }
  }

  async sendNotification(job: Job<NotificationJobData>): Promise<any> {
    const { type, paymentId } = job.data;

    this.logger.log(`Sending ${type} notification for payment ${paymentId}`);

    try {
      await job.updateProgress(25);

      // Simulate notification sending
      await new Promise(resolve => setTimeout(resolve, 500));

      await job.updateProgress(75);

      // Here you would integrate with email service, SMS, push notifications, etc.
      switch (type) {
        case 'payment-success':
          this.logger.log(`Success notification sent for payment ${paymentId}`);
          break;
        case 'payment-failure':
          this.logger.log(`Failure notification sent for payment ${paymentId}`);
          break;
      }

      await job.updateProgress(100);

      return {
        success: true,
        type,
        paymentId,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send notification for payment ${paymentId}:`, error);
      throw error;
    }
  }

  private validatePaymentData(data: PaymentJobData): void {
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!data.method) {
      throw new Error('Payment method is required');
    }

    if (!data.paymentId) {
      throw new Error('Payment ID is required');
    }

    // Additional validations...
  }

  private async handleSuccessfulPayment(
    paymentId: string,
    transactionId?: string,
  ): Promise<{
    transactionId: string;
    processedAt: Date;
  }> {
    const processedAt = new Date();
    const finalTransactionId = transactionId || `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const updateData: Partial<Payment> = {
      status: PaymentStatus.COMPLETED,
      processedAt,
      gatewayResponse: 'Payment processed successfully',
      transactionId: finalTransactionId,
    };

    await this.paymentRepository.update(paymentId, updateData);

    return {
      transactionId: finalTransactionId,
      processedAt,
    };
  }

  private async handleFailedPayment(paymentId: string, reason: string): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.FAILED,
      processedAt: new Date(),
      failureReason: reason,
      gatewayResponse: 'Payment processing failed',
    });
  }
}
