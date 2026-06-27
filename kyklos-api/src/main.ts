import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });

  const doc = new DocumentBuilder()
    .setTitle('Kyklos API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));

  await app.listen(process.env.PORT ?? 4000);
  console.log(`API running on http://localhost:${process.env.PORT ?? 4000}`);
  console.log(`Swagger: http://localhost:${process.env.PORT ?? 4000}/api/docs`);
}
bootstrap();
