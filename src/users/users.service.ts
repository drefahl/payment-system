import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { isValidUUID } from '../common/utils/uuid.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return new UserResponseDto(savedUser);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find();
    return users.map(user => new UserResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    if (!isValidUUID(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserResponseDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    if (!isValidUUID(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.userRepository.update(id, updateUserDto);
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return new UserResponseDto(updatedUser!);
  }

  async remove(id: string): Promise<void> {
    if (!isValidUUID(id)) {
      throw new NotFoundException('User not found');
    }

    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }
}
