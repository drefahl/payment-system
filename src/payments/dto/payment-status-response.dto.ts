import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment.entity';

export class PaymentStatusResponseDto {
  @ApiProperty({
    description: 'ID único do pagamento (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Status atual do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PROCESSING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Data da última atualização do status',
    example: '2023-10-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Motivo da falha no pagamento',
    example: 'Insufficient funds',
    required: false,
  })
  failureReason?: string;

  constructor(payment: any) {
    this.id = payment.id;
    this.status = payment.status;
    this.updatedAt = payment.updatedAt;
    this.failureReason = payment.failureReason;
  }
}
