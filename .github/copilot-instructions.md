# Payment System - AI Coding Agent Instructions

## Architecture Overview

This is a NestJS-based payment system API with modular architecture:

- **Framework**: NestJS 11.x with TypeScript
- **Database**: TypeORM with PostgreSQL (dev/prod) / SQLite (tests)
- **Auth**: JWT + Passport with bcrypt password hashing
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI with comprehensive annotations
- **Testing**: Jest with integration tests using real databases

## Module Structure

Each feature module follows this pattern (`src/{module}/`):

- `{module}.module.ts` - Module definition with imports/exports
- `{module}.controller.ts` - REST endpoints with Swagger decorators
- `{module}.service.ts` - Business logic with repository injection
- `entities/` - TypeORM entities with UUID primary keys
- `dto/` - Request/response DTOs with validation
- `test/` - Integration tests with dedicated database modules

## Key Patterns & Conventions

### Entities

- Use UUID primary keys: `@PrimaryGeneratedColumn('uuid')`
- Include timestamps: `@CreateDateColumn()`, `@UpdateDateColumn()`
- Soft deletes: `@DeleteDateColumn()` for products/users
- Table naming: `@Entity('table_name')` (snake_case)

### DTOs

- Request DTOs: `Create{Entity}Dto`, `Update{Entity}Dto`
- Response DTOs: `{Entity}ResponseDto` (excludes sensitive fields)
- Validation: class-validator decorators (`@IsString()`, `@IsEmail()`, etc.)
- Swagger: `@ApiProperty()` with examples and descriptions

### Services

- Repository injection: `@InjectRepository(Entity) private repo: Repository<Entity>`
- Error handling: `ConflictException`, `NotFoundException`
- Password hashing: `bcrypt.hash(password, 10)`
- UUID validation: `isValidUUID(id)` utility function

### Controllers

- Full Swagger annotations: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
- Guards: `@UseGuards(JwtAuthGuard)` for protected routes
- Serialization: `@UseInterceptors(ClassSerializerInterceptor)`
- Bearer auth: `@ApiBearerAuth('JWT-auth')`

### Authentication

- JWT payload interface: `{ email: string; sub: string; name: string }`
- Strategies: `LocalStrategy` (email/password), `JwtStrategy` (token validation)
- Guards: `JwtAuthGuard` for route protection

## Development Workflow

### Environment Setup

```bash
# Start infrastructure
docker-compose up -d

# Install dependencies
pnpm install

# Development server (loads .env.development)
pnpm run start:dev

# Tests (loads .env.test, uses SQLite)
pnpm run test
```

### Configuration Loading Priority

1. `.env.{NODE_ENV}` (environment-specific)
2. `.env.local` (personal overrides)
3. `.env` (fallback)

### Database Configuration

- **Development**: PostgreSQL with `synchronize: true`
- **Tests**: PostgreSQL with `dropSchema: true` per test
- **Entities**: Auto-loaded from `**/*.entity{.ts,.js}`

### Testing

- Integration tests with real database connections
- `TestDatabaseModule` with schema dropping between tests
- Repository clearing in `beforeEach`/`afterEach`

## Code Quality

### ESLint + Prettier

- Single quotes, trailing commas, 120 char width
- TypeScript strict mode with some relaxed rules
- Prettier integrated into ESLint

### NestJS CLI

- Swagger plugin enabled for automatic DTO generation
- `dtoFileNameSuffix: [".dto.ts", ".entity.ts"]`

## Common Implementation Patterns

### Creating a New Module

1. Generate with `nest g module {name}`
2. Add entity with UUID primary key and timestamps
3. Create DTOs with validation and Swagger annotations
4. Implement service with repository operations
5. Add controller with full Swagger documentation
6. Create integration tests with TestDatabaseModule

### Adding Authentication to Routes

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
@ApiBearerAuth('JWT-auth')
getProfile(@Request() req) {
  return this.service.findOne(req.user.id);
}
```

### Response Transformation

```typescript
export class EntityResponseDto {
  constructor(entity: Entity) {
    Object.assign(this, entity);
    // Exclude sensitive fields manually
  }
}
```

### Error Handling

```typescript
if (!entity) {
  throw new NotFoundException('Entity not found');
}
if (conflict) {
  throw new ConflictException('Email already exists');
}
```

## Key Files to Reference

- `src/config/database.config.ts` - Database setup patterns
- `src/config/env.config.ts` - Environment loading precedence
- `src/users/` - Complete CRUD module example
- `src/auth/` - Authentication implementation
- `src/common/utils/uuid.util.ts` - Validation utilities
- `docker-compose.yml` - Infrastructure setup
- `eslint.config.mjs` - Code quality configuration
