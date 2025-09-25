import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '../entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID único do pagamento (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID único do checkout (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  checkoutId: string;

  @ApiProperty({
    description: 'Valor do pagamento',
    example: 299.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Status atual do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Método de pagamento utilizado',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'ID da transação do gateway',
    example: 'txn_123456789',
  })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Resposta do gateway de pagamento',
    example: 'Payment processed successfully',
  })
  gatewayResponse?: string;

  @ApiPropertyOptional({
    description: 'Motivo da falha no pagamento',
    example: 'Insufficient funds',
  })
  failureReason?: string;

  @ApiPropertyOptional({
    description: 'Data de processamento do pagamento',
    example: '2023-10-01T12:00:00.000Z',
  })
  processedAt?: Date;

  @ApiProperty({
    description: 'Data de criação do pagamento',
    example: '2023-10-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2023-10-01T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(payment: any) {
    Object.assign(this, payment);
  }
}
