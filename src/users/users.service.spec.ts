import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TestDatabaseModule } from './test/test-database.module';

describe('UsersService (Integration)', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestDatabaseModule],
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    await repository.clear().catch(() => {});
  });

  afterEach(async () => {
    await repository.clear().catch(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should create a user successfully', async () => {
      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createUserDto.name);
      expect(result.email).toBe(createUserDto.email);
      expect('password' in result).toBe(false);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      const savedUser = await repository.findOne({ where: { email: createUserDto.email } });
      expect(savedUser).toBeDefined();
      expect(savedUser?.password).not.toBe(createUserDto.password);
    });

    it('should throw ConflictException if email already exists', async () => {
      await service.create(createUserDto);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no users exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all users without passwords', async () => {
      await service.create({ name: 'User 1', email: 'user1@example.com', password: 'password1' });
      await service.create({ name: 'User 2', email: 'user2@example.com', password: 'password2' });

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect('password' in result[0]).toBe(false);
      expect('password' in result[1]).toBe(false);
      expect(result[0].name).toBe('User 1');
      expect(result[1].name).toBe('User 2');
    });
  });

  describe('findOne', () => {
    it('should return a user by id without password', async () => {
      const createdUser = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const result = await service.findOne(createdUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdUser.id);
      expect(result.name).toBe('Test User');
      expect('password' in result).toBe(false);
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email with password (for auth)', async () => {
      const createUserDto = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      await service.create(createUserDto);

      const result = await service.findByEmail(createUserDto.email);

      expect(result).toBeDefined();
      expect(result?.email).toBe(createUserDto.email);
      expect(result?.password).toBeDefined();
      expect(result?.password).not.toBe(createUserDto.password);
    });

    it('should return null if user not found', async () => {
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
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
      const result = await service.update(createdUser.id, updateUserDto);

      expect(result.name).toBe('Updated Name');
      expect(result.email).toBe(createdUser.email);
      expect('password' in result).toBe(false);

      const updatedUser = await repository.findOne({ where: { id: createdUser.id } });
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should update password and hash it', async () => {
      const createdUser = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const originalUser = await repository.findOne({ where: { id: createdUser.id } });
      const originalPassword = originalUser?.password;

      const updateUserDto: UpdateUserDto = { password: 'newPassword' };
      await service.update(createdUser.id, updateUserDto);

      const updatedUser = await repository.findOne({ where: { id: createdUser.id } });
      expect(updatedUser?.password).not.toBe('newPassword');
      expect(updatedUser?.password).not.toBe(originalPassword);
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      await expect(service.update('non-existent-id', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      const createdUser = await service.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      await service.remove(createdUser.id);

      const deletedUser = await repository.findOne({ where: { id: createdUser.id } });
      expect(deletedUser).toBeNull();
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
