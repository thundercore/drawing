import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  mixin
} from "@nestjs/common";
import { Contract } from "ethers";
import { InvalidStateError } from "../../../errors/response-errors/InvalidStateError";
import { DrawingStateNames } from "../../Drawing/constants/DrawingStatesNames";
import { DrawingState } from "../../Drawing/constants/DrawingStates";

@Injectable()
export class ValidateContractState implements PipeTransform {
  protected readonly stage: DrawingState;

  async transform(contract: Contract, metadata: ArgumentMetadata) {
    const currentState = await contract.currentState();
    if (currentState !== this.stage) {
      throw new InvalidStateError(
        `Contract is the wrong state, current state = ${
          DrawingStateNames[currentState]
        } - should be ${DrawingStateNames[this.stage]}`
      );
    }

    return contract;
  }
}

export function MakeDrawingStateValidation(state: DrawingState) {
  return mixin(
    class CustomValidateContractState extends ValidateContractState {
      protected readonly stage = state;
    }
  );
}
