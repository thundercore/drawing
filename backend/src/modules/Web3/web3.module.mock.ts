import { NonceHandlingWallet } from "./services/MnemonicWallet";
import { Module } from "@nestjs/common";
import { JsonRpcProvider } from "ethers/providers";
import { RedisFactory } from "../../redis/redisFactory";

jest.mock("./services/MnemonicWallet");
jest.mock("ethers/providers");

@Module({
  providers: [JsonRpcProvider, NonceHandlingWallet, RedisFactory],
  exports: [JsonRpcProvider, NonceHandlingWallet]
})
export class Web3ModuleMock {}
export { JsonRpcProvider, NonceHandlingWallet };
