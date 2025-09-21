import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  /**
   * ID único do produto
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID único do produto (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  /**
   * Nome do produto
   * @example "Smartphone Samsung Galaxy S23"
   */
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Smartphone Samsung Galaxy S23',
  })
  name: string;

  /**
   * Descrição do produto
   * @example "Smartphone com 128GB de armazenamento, câmera tripla de 50MP e tela de 6.1 polegadas"
   */
  @ApiPropertyOptional({
    description: 'Descrição detalhada do produto',
    example: 'Smartphone com 128GB de armazenamento, câmera tripla de 50MP e tela de 6.1 polegadas',
  })
  description?: string;

  /**
   * Preço do produto
   * @example 2599.99
   */
  @ApiProperty({
    description: 'Preço do produto em reais',
    example: 2599.99,
  })
  price: number;

  /**
   * Categoria do produto
   * @example "Eletrônicos"
   */
  @ApiProperty({
    description: 'Categoria do produto',
    example: 'Eletrônicos',
  })
  category: string;

  /**
   * Quantidade em estoque
   * @example 50
   */
  @ApiProperty({
    description: 'Quantidade disponível em estoque',
    example: 50,
  })
  stock: number;

  /**
   * Status de ativação do produto
   * @example true
   */
  @ApiProperty({
    description: 'Indica se o produto está ativo para venda',
    example: true,
  })
  isActive: boolean;

  /**
   * URL da imagem do produto
   * @example "https://example.com/images/galaxy-s23.jpg"
   */
  @ApiPropertyOptional({
    description: 'URL da imagem principal do produto',
    example: 'https://example.com/images/galaxy-s23.jpg',
  })
  imageUrl?: string;

  /**
   * SKU do produto
   * @example "SAMG-S23-128-BLK"
   */
  @ApiPropertyOptional({
    description: 'Código SKU único do produto',
    example: 'SAMG-S23-128-BLK',
  })
  sku?: string;

  /**
   * Data de criação
   * @example "2023-09-21T18:00:00.000Z"
   */
  @ApiProperty({
    description: 'Data de criação do produto',
    example: '2023-09-21T18:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Data de última atualização
   * @example "2023-09-21T18:00:00.000Z"
   */
  @ApiProperty({
    description: 'Data da última atualização do produto',
    example: '2023-09-21T18:00:00.000Z',
  })
  updatedAt: Date;
}
