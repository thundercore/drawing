import { Module } from "@nestjs/common";
import { Web3Module } from "../Web3/web3.module";
import { DrawingService } from "./services/DrawingService";

@Module({
  imports: [Web3Module],
  providers: [DrawingService],
  exports: [DrawingService]
})
export class DrawingModule {}
export { DrawingService };
