import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação nas requisições',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados básicos do usuário autenticado',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'João Silva',
      email: 'joao@example.com',
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Tempo de expiração do token JWT',
    example: '1h',
  })
  expires_in: string;

  constructor(access_token: string, user: User, expires_in: string = '1h') {
    this.access_token = access_token;
    this.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    this.expires_in = expires_in;
  }
}
