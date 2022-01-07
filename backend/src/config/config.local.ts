import { parseEnv } from "./util";

export default {
  app: {
    rpcUrl: "https://testnet-rpc.thundercore.com",
    thunderScanUrl: "https://scan-testnet.thundercore.com",
    privateKey: parseEnv("PRIVATE_KEY"),
    jwtSecret: "my_jwt_secret"
  },
  debug: {
    benchmark: true
  },
  redis: {
    port: 6379,
    host: "127.0.0.1"
  }
};
