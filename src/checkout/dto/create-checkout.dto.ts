import { IsUUID, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutItemDto {
  @ApiProperty({
    description: 'ID único do produto (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantidade do produto no checkout',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'ID único do usuário (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Lista de itens do checkout',
    type: [CreateCheckoutItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCheckoutItemDto)
  items: CreateCheckoutItemDto[];
}
