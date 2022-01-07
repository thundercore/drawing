import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GeneralExceptionFilter } from "./errors/exception.filter";
import "reflect-metadata";
import { RouterModule } from "nest-router";
import { routes } from "./routes";
import { V1Module } from "./modules/v1/v1.module";
import { TerminusModule, TypeOrmHealthIndicator } from "@nestjs/terminus";

@Module({
  imports: [
    RouterModule.forRoutes(routes),
    V1Module,
    TerminusModule.forRootAsync({
      inject: [TypeOrmHealthIndicator],
      useFactory: _ => ({
        endpoints: [
          {
            url: "/health",
            healthIndicators: []
          }
        ]
      })
    })
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GeneralExceptionFilter
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {}
}
