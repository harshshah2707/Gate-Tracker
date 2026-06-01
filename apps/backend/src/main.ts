import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - accept all origins for PWA/web clients
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Health check endpoint (no auth required, used by Railway/Docker)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Swagger integration
  const config = new DocumentBuilder()
    .setTitle('GATE WARROOM 2026 API')
    .setDescription('Production-ready accountability and performance operating system for GATE CSE aspirants')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`✅ Backend server running on http://0.0.0.0:${port}`);
  console.log(`📋 Swagger docs: http://localhost:${port}/api`);
  console.log(`❤️  Health check: http://localhost:${port}/health`);
}
bootstrap();

