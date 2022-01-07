import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  Inject
} from "@nestjs/common";
import { DrawingContractFactoryToken } from "../../Web3/web3.module";
import { ContractFactory, Contract } from "ethers";
import { NotFoundError } from "../../../errors/response-errors/NotFoundError";
import { Cache, CacheClass } from "memory-cache";

@Injectable()
export class ContractAddressToContractPipe implements PipeTransform {
  private contractCache: CacheClass<string, Contract>;

  constructor(
    @Inject(DrawingContractFactoryToken)
    private readonly contractFactory: ContractFactory
  ) {
    this.contractCache = new Cache<string, Contract>();
  }

  async transform(value: string, metadata: ArgumentMetadata) {
    try {
      let contract = await this.contractCache.get(value);
      if (!contract) {
        console.log("[ContractAddressToContractPipe] contract cache not hit");
        contract = this.contractFactory.attach(value);
        // cache for one day
        this.contractCache.put(value, contract, 24 * 60 * 60 * 1000);
      }

      return contract;
    } catch (e) {
      throw new NotFoundError("Contract does not exist");
    }
  }
}
