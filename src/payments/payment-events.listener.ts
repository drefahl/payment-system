import { QueueEventsHost, QueueEventsListener, OnQueueEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@QueueEventsListener('payment-processing')
export class PaymentEventsListener extends QueueEventsHost {
  private readonly logger = new Logger(PaymentEventsListener.name);

  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    this.logger.log(`Payment job ${job.jobId} is now active`);
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; returnvalue: string }) {
    this.logger.log(`Payment job ${job.jobId} completed successfully`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = JSON.parse(job.returnvalue);
      if (result.success) {
        this.logger.log(
          `Payment ${result.paymentId} processed successfully with transaction ID: ${result.transactionId}`,
        );
      } else {
        this.logger.warn(`Payment ${result.paymentId} failed: ${result.reason}`);
      }
    } catch {
      this.logger.debug(`Could not parse job result: ${job.returnvalue}`);
    }
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string }) {
    this.logger.error(`Payment job ${job.jobId} failed: ${job.failedReason}`);
  }

  @OnQueueEvent('progress')
  onProgress(job: { jobId: string; data: number }) {
    this.logger.debug(`Payment job ${job.jobId} progress: ${job.data}%`);
  }

  @OnQueueEvent('waiting')
  onWaiting(job: { jobId: string }) {
    this.logger.log(`Payment job ${job.jobId} is waiting to be processed`);
  }

  @OnQueueEvent('delayed')
  onDelayed(job: { jobId: string; delay: number }) {
    this.logger.log(`Payment job ${job.jobId} is delayed by ${job.delay}ms`);
  }

  @OnQueueEvent('removed')
  onRemoved(job: { jobId: string }) {
    this.logger.log(`Payment job ${job.jobId} was removed from the queue`);
  }

  @OnQueueEvent('stalled')
  onStalled(job: { jobId: string }) {
    this.logger.warn(`Payment job ${job.jobId} has stalled`);
  }
}
