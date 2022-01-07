import { Module } from "@nestjs/common";
import { AuthModule } from "../Auth/auth.module";
import { DrawingController } from "./controllers/drawing.controller";
import { DrawingModule } from "../Drawing/drawing.module";
import { ContractAddressToContractPipe } from "./pipes/ContractAddressToContractPipe";
import { Web3Module } from "../Web3/web3.module";

@Module({
  imports: [AuthModule, DrawingModule, Web3Module],
  controllers: [DrawingController],
  providers: [ContractAddressToContractPipe]
})
export class V1Module {}
