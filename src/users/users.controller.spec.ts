import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TestDatabaseModule } from './test/test-database.module';

describe('UsersController (Integration)', () => {
  let controller: UsersController;
  let service: UsersService;
  let repository: Repository<User>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(async () => {
    await repository.clear();
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createUserDto.name);
      expect(result.email).toBe(createUserDto.email);
      expect('password' in result).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no users exist', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });

    it('should return all users', async () => {
      await service.create({ name: 'User 1', email: 'user1@example.com', password: 'password1' });
      await service.create({ name: 'User 2', email: 'user2@example.com', password: 'password2' });

      const result = await controller.findAll();

      expect(result).toHaveLength(2);

      expect('password' in result[0]).toBe(false);
      expect('password' in result[1]).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const createdUser = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.findOne(createdUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.name).toBe('Test User');
      expect('password' in result).toBe(false);
    });

    it('should handle non-existent user', async () => {
      await expect(controller.findOne('non-existent-id')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const createdUser = await service.create({
        name: 'Original Name',
        email: 'test@example.com',
        password: 'password123',
      });

      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const result = await controller.update(createdUser.id, updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe(createdUser.email);
      expect('password' in result).toBe(false);
    });

    it('should handle non-existent user', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      await expect(controller.update('non-existent-id', updateUserDto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const createdUser = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await controller.remove(createdUser.id);
      expect(result).toBeUndefined();

      await expect(service.findOne(createdUser.id)).rejects.toThrow();
    });

    it('should handle non-existent user', async () => {
      await expect(controller.remove('non-existent-id')).rejects.toThrow();
    });
  });

  describe('Full Integration Flow', () => {
    it('should handle complete CRUD operations', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'password123',
      };

      const createdUser = await controller.create(createUserDto);
      expect(createdUser.id).toBeDefined();

      const allUsers = await controller.findAll();
      expect(allUsers).toHaveLength(1);

      const foundUser = await controller.findOne(createdUser.id);
      expect(foundUser.email).toBe(createUserDto.email);

      const updateDto: UpdateUserDto = { name: 'Updated Integration User' };
      const updatedUser = await controller.update(createdUser.id, updateDto);
      expect(updatedUser.name).toBe('Updated Integration User');

      await controller.remove(createdUser.id);
      const emptyList = await controller.findAll();
      expect(emptyList).toHaveLength(0);
    });
  });
});
