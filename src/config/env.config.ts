import { ConfigModuleOptions } from '@nestjs/config';
import * as path from 'path';

export const getConfigModuleOptions = (): ConfigModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const envFilePaths = [
    path.resolve(process.cwd(), `.env.${nodeEnv}`),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ];

  return {
    isGlobal: true,
    envFilePath: envFilePaths,
    expandVariables: true,
  };
};
