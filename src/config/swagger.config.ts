import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Payment System API')
    .setVersion('1.0.0')
    .addServer('http://localhost:3000', 'Servidor de Desenvolvimento')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Digite seu JWT token obtido através do endpoint de login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Payment System API Documentation',
  });

  SwaggerModule.setup('api-json', app, documentFactory, {
    jsonDocumentUrl: 'swagger.json',
    yamlDocumentUrl: 'swagger.yaml',
  });
}

export function getSwaggerConfig() {
  return {
    enabled: process.env.NODE_ENV !== 'production',
    path: 'api',
    title: 'Payment System API',
    description: 'API Documentation',
    version: '1.0.0',
  };
}
