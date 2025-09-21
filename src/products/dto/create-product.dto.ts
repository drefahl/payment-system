import { IsString, IsNumber, IsOptional, IsBoolean, MaxLength, MinLength, Min, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  /**
   * Nome do produto
   * @example "Smartphone Samsung Galaxy S23"
   */
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Smartphone Samsung Galaxy S23',
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  /**
   * Descrição detalhada do produto
   * @example "Smartphone com 128GB de armazenamento, câmera tripla de 50MP e tela de 6.1 polegadas"
   */
  @ApiPropertyOptional({
    description: 'Descrição detalhada do produto',
    example: 'Smartphone com 128GB de armazenamento, câmera tripla de 50MP e tela de 6.1 polegadas',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Preço do produto
   * @example 2599.99
   */
  @ApiProperty({
    description: 'Preço do produto em reais',
    example: 2599.99,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  /**
   * Categoria do produto
   * @example "Eletrônicos"
   */
  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Eletrônicos',
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  /**
   * Quantidade em estoque
   * @example 50
   */
  @ApiPropertyOptional({
    description: 'Quantidade disponível em estoque',
    example: 50,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  /**
   * Se o produto está ativo
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Indica se o produto está ativo para venda',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /**
   * URL da imagem do produto
   * @example "https://example.com/images/galaxy-s23.jpg"
   */
  @ApiPropertyOptional({
    description: 'URL da imagem principal do produto',
    example: 'https://example.com/images/galaxy-s23.jpg',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  imageUrl?: string;

  /**
   * SKU (Stock Keeping Unit) do produto
   * @example "SAMG-S23-128-BLK"
   */
  @ApiPropertyOptional({
    description: 'Código SKU único do produto',
    example: 'SAMG-S23-128-BLK',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;
}
