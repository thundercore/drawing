import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./services/auth.service";
import config from "../../config";
import { DrawingGuard } from "./guards/DrawingGuard";

@Module({
  imports: [JwtModule.register({ secret: config.app.jwtSecret })],
  providers: [AuthService, DrawingGuard],
  exports: [AuthService, DrawingGuard]
})
export class AuthModule {}
export { AuthService, DrawingGuard };
