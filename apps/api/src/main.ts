import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as express from "express";
import { AppModule } from "./app.module";
import { initSentry } from "./common/monitoring/sentry";

async function bootstrap() {
  initSentry();
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors();
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const rawUploadLimitBytes = Number(
    process.env.DOCUMENT_MAX_FILE_SIZE_BYTES ?? "15728640",
  );
  app.use(
    "/v1/documents/upload",
    express.raw({ type: "*/*", limit: rawUploadLimitBytes }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("PropTech Manager API")
    .setDescription("Backend foundation for property management platform")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("v1/docs", app, swaggerDocument);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

bootstrap();
