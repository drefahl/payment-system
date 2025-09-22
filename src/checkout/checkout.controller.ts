import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateCheckoutDto } from './dto/update-checkout.dto';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('checkout')
@Controller('checkout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@UseInterceptors(ClassSerializerInterceptor)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new checkout',
    description: 'Creates a new checkout with the specified items and calculates the total amount',
  })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Checkout created successfully',
    type: CheckoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input, insufficient stock, or invalid UUIDs',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User or product not found',
  })
  async create(@Body() createCheckoutDto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
    return this.checkoutService.create(createCheckoutDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all checkouts',
    description: 'Retrieves a paginated list of all checkouts with their items',
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
    description: 'Checkouts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        checkouts: {
          type: 'array',
          items: { $ref: '#/components/schemas/CheckoutResponseDto' },
        },
        total: { type: 'number', example: 50 },
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
  ): Promise<{ checkouts: CheckoutResponseDto[]; total: number; page: number; limit: number }> {
    return this.checkoutService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get checkout by ID',
    description: 'Retrieves a specific checkout by its ID with all items and product details',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Checkout UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout found successfully',
    type: CheckoutResponseDto,
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
    description: 'Checkout not found',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CheckoutResponseDto> {
    return this.checkoutService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get checkouts by user ID',
    description: 'Retrieves all checkouts for a specific user with pagination',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
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
    description: 'User checkouts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        checkouts: {
          type: 'array',
          items: { $ref: '#/components/schemas/CheckoutResponseDto' },
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<{ checkouts: CheckoutResponseDto[]; total: number; page: number; limit: number }> {
    return this.checkoutService.findByUser(userId, page, limit);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update checkout',
    description: 'Updates a checkout. If items are updated, the total amount is recalculated.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Checkout UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateCheckoutDto })
  @ApiResponse({
    status: 200,
    description: 'Checkout updated successfully',
    type: CheckoutResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input or UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Checkout or product not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCheckoutDto: UpdateCheckoutDto,
  ): Promise<CheckoutResponseDto> {
    return this.checkoutService.update(id, updateCheckoutDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete checkout',
    description: 'Deletes a checkout and all its associated items',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Checkout UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Checkout deleted successfully',
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
    description: 'Checkout not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.checkoutService.remove(id);
  }
}
