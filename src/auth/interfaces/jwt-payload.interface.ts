export interface JwtPayload {
  sub: string; // subject - user ID
  email: string;
  name: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}
