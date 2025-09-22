import { ApiProperty } from '@nestjs/swagger';

export class CheckoutItemResponseDto {
  @ApiProperty({
    description: 'ID único do item do checkout (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID único do checkout (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  checkoutId: string;

  @ApiProperty({
    description: 'ID único do produto (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto no checkout',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Subtotal do item (quantidade x preço unitário)',
    example: 199.98,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Data de criação do item',
    example: '2023-10-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do item',
    example: '2023-10-01T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(checkoutItem: any) {
    Object.assign(this, checkoutItem);
  }
}

export class CheckoutResponseDto {
  @ApiProperty({
    description: 'ID único do checkout (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Lista de itens do checkout',
    type: [CheckoutItemResponseDto],
  })
  items: CheckoutItemResponseDto[];

  @ApiProperty({
    description: 'Valor total do checkout',
    example: 399.96,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Data de criação do checkout',
    example: '2023-10-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização do checkout',
    example: '2023-10-01T12:00:00.000Z',
  })
  updatedAt: Date;

  constructor(checkout: any) {
    Object.assign(this, checkout);
    if (checkout.items) {
      this.items = checkout.items.map(item => new CheckoutItemResponseDto(item));
    }
  }
}
