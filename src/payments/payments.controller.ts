import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentStatusResponseDto } from './dto/payment-status-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(ClassSerializerInterceptor)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new payment',
    description: 'Creates a new payment for a checkout and queues it for async processing',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment created and queued for processing',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input, checkout not found, or payment already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Checkout not found',
  })
  async create(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description: 'Retrieves a paginated list of all payments',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        payments: {
          type: 'array',
          items: { $ref: '#/components/schemas/PaymentResponseDto' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{ payments: PaymentResponseDto[]; total: number; page: number; limit: number }> {
    return this.paymentsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieves a specific payment by its ID with all details',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment found successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponseDto> {
    return this.paymentsService.findOne(id);
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get payment status',
    description: 'Retrieves the current status of a payment for quick status checks',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved successfully',
    type: PaymentStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getStatus(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentStatusResponseDto> {
    return this.paymentsService.getStatus(id);
  }

  @Get('checkout/:checkoutId')
  @ApiOperation({
    summary: 'Get payment by checkout ID',
    description: 'Retrieves the payment associated with a specific checkout',
  })
  @ApiParam({
    name: 'checkoutId',
    type: 'string',
    description: 'Checkout UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment found for checkout',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'No payment found for checkout',
  })
  async findByCheckout(@Param('checkoutId', ParseUUIDPipe) checkoutId: string): Promise<PaymentResponseDto | null> {
    return this.paymentsService.findByCheckout(checkoutId);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel payment',
    description: 'Cancels a pending payment. Only pending payments can be cancelled.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment cancelled successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format or payment cannot be cancelled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async cancelPayment(@Param('id', ParseUUIDPipe) id: string): Promise<PaymentResponseDto> {
    return this.paymentsService.cancelPayment(id);
  }

  // BullMQ Queue Management Endpoints

  @Post('priority')
  @ApiOperation({
    summary: 'Create payment with priority',
    description: 'Creates a payment with specific priority (lower numbers = higher priority)',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiQuery({
    name: 'priority',
    type: 'number',
    description: 'Job priority (lower numbers = higher priority)',
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Payment created with priority',
    type: PaymentResponseDto,
  })
  async createPaymentWithPriority(
    @Body() createPaymentDto: CreatePaymentDto,
    @Query('priority', new ParseIntPipe({ optional: true })) priority: number = 0,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.processPaymentWithPriority(createPaymentDto, priority);
  }

  @Post('delayed')
  @ApiOperation({
    summary: 'Create delayed payment',
    description: 'Creates a payment to be processed after a specific delay',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiQuery({
    name: 'delay',
    type: 'number',
    description: 'Delay in milliseconds before processing',
    example: 30000,
  })
  @ApiResponse({
    status: 201,
    description: 'Payment created with delay',
    type: PaymentResponseDto,
  })
  async createDelayedPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Query('delay', ParseIntPipe) delay: number,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.processPaymentWithDelay(createPaymentDto, delay);
  }

  @Patch(':id/retry')
  @ApiOperation({
    summary: 'Retry failed payment',
    description: 'Retries a failed payment by adding it back to the processing queue',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Payment UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment queued for retry',
  })
  async retryPayment(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.paymentsService.retryFailedPayment(id);
    return { message: 'Payment queued for retry' };
  }

  @Post(':id/notify')
  @ApiOperation({
    summary: 'Send payment notification',
    description: 'Sends a notification for a payment',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Payment UUID',
  })
  @ApiQuery({
    name: 'type',
    enum: ['success', 'failure'],
    description: 'Notification type',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification queued successfully',
  })
  async sendNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type: 'success' | 'failure',
  ): Promise<{ message: string }> {
    await this.paymentsService.sendPaymentNotification(id, type);
    return { message: 'Notification queued successfully' };
  }

  @Get('queue/status')
  @ApiOperation({
    summary: 'Get queue status',
    description: 'Returns the current status of the payment processing queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status information',
    schema: {
      type: 'object',
      properties: {
        waiting: { type: 'number', description: 'Number of jobs waiting' },
        active: { type: 'number', description: 'Number of jobs being processed' },
        completed: { type: 'number', description: 'Number of completed jobs' },
        failed: { type: 'number', description: 'Number of failed jobs' },
        delayed: { type: 'number', description: 'Number of delayed jobs' },
      },
    },
  })
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return this.paymentsService.getQueueStatus();
  }

  @Post('queue/pause')
  @ApiOperation({
    summary: 'Pause payment queue',
    description: 'Pauses the payment processing queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue paused successfully',
  })
  async pauseQueue(): Promise<{ message: string }> {
    await this.paymentsService.pauseQueue();
    return { message: 'Payment queue paused' };
  }

  @Post('queue/resume')
  @ApiOperation({
    summary: 'Resume payment queue',
    description: 'Resumes the paused payment processing queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue resumed successfully',
  })
  async resumeQueue(): Promise<{ message: string }> {
    await this.paymentsService.resumeQueue();
    return { message: 'Payment queue resumed' };
  }

  @Post('queue/clean')
  @ApiOperation({
    summary: 'Clean payment queue',
    description: 'Removes old completed and failed jobs from the queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue cleaned successfully',
  })
  async cleanQueue(): Promise<{ message: string }> {
    await this.paymentsService.cleanQueue();
    return { message: 'Payment queue cleaned' };
  }
}
