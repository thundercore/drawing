import { Module } from "@nestjs/common";

jest.mock("./services/MnemonicWallet");
jest.mock("ethers/providers");

@Module({
  providers: [],
  exports: []
})
export class DrawingModuleMock {}
export {};
