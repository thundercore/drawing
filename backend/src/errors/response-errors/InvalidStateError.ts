import { ErrorOption, ResponseError } from "./ResponseError";
import { ResponseErrors } from "../constants/ResponseErrors";

export class InvalidStateError extends ResponseError {
  constructor(message: string, options?: ErrorOption) {
    super(ResponseErrors.InvalidateState, message, 400, options);
  }
}
