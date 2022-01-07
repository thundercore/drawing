import { randomBytes } from "ethers/utils";

export const genRandomBytes32 = () =>
  randomBytes(32).reduce((hex, val) => {
    // @ts-ignore
    hex += val.toString(16).padStart(2, "0");
    return hex;
  }, "0x");
