import { Inject, Injectable } from "@nestjs/common";
import { Contract, ContractFactory } from "ethers";
import { DrawingContractFactoryToken } from "../../Web3/web3.module";
import { genRandomBytes32 } from "../../../util/genRandomBytes32";
import { bigNumberify, keccak256 } from "ethers/utils";
import { chunkArray } from "../../../util/chunkArray";
import { flatArray } from "../../../util/flatArray";

@Injectable()
export class DrawingService {
  constructor(
    @Inject(DrawingContractFactoryToken)
    private readonly contractFactory: ContractFactory
  ) {
    // this.test()
  }

  async test() {
    // const { contractAddress } = await this.deployContract(1002, '')
    // const contract = this.contractFactory.attach(contractAddress)
    // const { secret } = await this.startDrawing(contract, 'this no good')
    // const users = [...Array(1002).keys()]
    // await this.enrollUsers(contract, users)
    // await this.endEnrollment(contract)
    // await this.revealSeed(contract, secret)
    // await this.revealWinners(contract)
  }

  async deployContract(numWinners: number, name: string) {
    const contract = await this.contractFactory.deploy(numWinners, name);
    await contract.deployed();
    return {
      contractAddress: contract.address,
      transactionHash: contract.deployTransaction.hash!
    };
  }

  async startDrawing(contract: Contract, rules: string) {
    const secret = genRandomBytes32();
    const commit = keccak256(secret);
    const trans = await contract.startEnrollment(rules, commit);
    const receipt = await trans.wait();
    return {
      transactionHash: trans.hash!,
      secret,
      rules,
      startBlockNumber: receipt.blockNumber
    };
  }

  async enrollUsers(contract: Contract, users: number[]) {
    const chunks = chunkArray(users, 100);
    const promises = chunks.map(async chunk => {
      const trans = await contract.adminBatchEnroll(chunk, {
        gasLimit: bigNumberify(30000000).toHexString()
      });

      const receipt = await trans.wait();
      return {
        transactionHash: trans.hash! as string,
        usersEnrolled: receipt.events[0].args.participants.map(
          obj => obj
        ) as number[]
      };
    });
    const receipts = await Promise.all(promises);

    return {
      transactionHashes: receipts.map(re => re.transactionHash),
      usersEnrolled: flatArray<number>(receipts.map(re => re.usersEnrolled))
    };
  }

  async endEnrollment(contract: Contract) {
    const trans = await contract.endEnrollment();
    const receipt = await trans.wait();
    return {
      endBlockNumber: receipt.blockNumber,
      transactionHash: trans.hash!
    };
  }

  async calculateWinners(contract: Contract) {
    const trans = await contract.calculateWinners({
      gasLimit: bigNumberify(70000000).toHexString()
    });
    await trans.wait();
    return {
      transactionHash: trans.hash!
    };
  }

  async revealWinners(contract: Contract, seed: string) {
    const logs = await contract.provider.getLogs({
      address: contract.address,
      fromBlock: (await contract.revealBlockNumber()).toHexString(),
      toBlock: "latest",
      ...contract.filters.WinnersSelected()
    });

    const decodedData = contract.interface.events.WinnersSelected.decode(
      logs[0].data,
      logs[0].topics
    );

    return {
      transactionHashes: [logs[0].transactionHash!],
      winners: decodedData.winners
    };
  }
}
