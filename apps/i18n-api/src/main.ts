import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { API_PREFIX } from '@packages/shared';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // 全局前缀
  app.setGlobalPrefix(API_PREFIX);

  // 全局管道：参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on: http://localhost:${port}${API_PREFIX}`);
}

bootstrap();
