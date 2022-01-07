import { INestApplication, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { logger } from "./util/logger";
import * as helmet from "helmet";
import config from "./config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { setupDocumentation } from "./setupDocumentation";
import { validationErrorFactory } from "./errors/validationErrorFactory";

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: validationErrorFactory
    })
  );

  return app;
}

// We store app outside of bootstrap function to be able to close the Nest application
// on unexpected errors
let app: INestApplication;

async function bootstrap() {
  app = await createApp();

  const options = new DocumentBuilder()
    .setTitle("drawing")
    .setDescription(
      "Full Suite to create and manage your drawings on the blockchain"
    )
    .setVersion("0.1")
    .setSchemes("http", "https")
    .addBearerAuth("Authorization", "header")
    .build();

  const document = SwaggerModule.createDocument(app, options);
  setupDocumentation("docs", app, document);

  const server = await app.listen(config.app.port, () =>
    logger.info(`📡 Drawing service listening on port ${config.app.port}`)
  );
  server.setTimeout(3600 * 1000);
}

bootstrap().catch(async err => {
  logger.error(`Failed to start server`);
  logger.error(err);

  if (app) {
    await app.close();
  }

  process.exit(1);
});
