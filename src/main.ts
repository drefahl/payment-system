import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { setupAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupAppConfig(app);
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
