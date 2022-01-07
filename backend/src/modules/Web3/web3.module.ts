import { NonceHandlingWallet } from "./services/MnemonicWallet";
import { Module } from "@nestjs/common";
import { JsonRpcProvider } from "ethers/providers";
import config from "../../config";
import { ContractFactory } from "ethers";
import { abi, bytecode } from "./Drawing.json";
import { BatchJsonRpcProvider } from "./services/BatchJsonRpcProvider";
import { RedisFactory } from "../../redis/redisFactory";

const DrawingContractFactoryToken = "DrawingContractFactory";

@Module({
  providers: [
    RedisFactory,
    {
      provide: JsonRpcProvider,
      useFactory: () => {
        const provider = new BatchJsonRpcProvider(100, config.app.rpcUrl);
        provider.pollingInterval = 100;
        return provider;
      }
    },
    {
      provide: NonceHandlingWallet,
      useFactory: (provider: JsonRpcProvider) =>
        new NonceHandlingWallet(
          config.app.privateKey,
          provider,
          new RedisFactory()
        ),
      inject: [JsonRpcProvider, RedisFactory]
    },
    {
      provide: DrawingContractFactoryToken,
      useFactory: (wallet: NonceHandlingWallet) =>
        new ContractFactory(abi, bytecode, wallet),
      inject: [NonceHandlingWallet]
    }
  ],
  exports: [JsonRpcProvider, NonceHandlingWallet, DrawingContractFactoryToken]
})
export class Web3Module {}
export { JsonRpcProvider, NonceHandlingWallet, DrawingContractFactoryToken };
