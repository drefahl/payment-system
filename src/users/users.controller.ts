import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar usuário', description: 'Cria um novo usuário no sistema' })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna todos os usuários cadastrados' })
  @ApiOkResponse({ description: 'Lista de usuários retornada com sucesso', type: [UserResponseDto] })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Perfil do usuário', description: 'Retorna o perfil do usuário autenticado' })
  @ApiOkResponse({ description: 'Perfil retornado com sucesso', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token JWT inválido ou expirado' })
  getProfile(@Request() req): Promise<UserResponseDto> {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID', description: 'Retorna um usuário específico pelo ID' })
  @ApiParam({ name: 'id', description: 'ID único do usuário (UUID)' })
  @ApiOkResponse({ description: 'Usuário encontrado com sucesso', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário', description: 'Atualiza os dados de um usuário existente' })
  @ApiParam({ name: 'id', description: 'ID único do usuário (UUID)' })
  @ApiOkResponse({ description: 'Usuário atualizado com sucesso', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar usuário', description: 'Remove um usuário do sistema' })
  @ApiParam({ name: 'id', description: 'ID único do usuário (UUID)' })
  @ApiNoContentResponse({ description: 'Usuário deletado com sucesso' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
