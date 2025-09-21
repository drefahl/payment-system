import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getConfigModuleOptions } from './config/env.config';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [ConfigModule.forRoot(getConfigModuleOptions()), getDatabaseConfig()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
