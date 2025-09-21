import { User } from '../../users/entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
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
