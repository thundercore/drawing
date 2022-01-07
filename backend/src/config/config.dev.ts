import { parseEnv, parseEnvNumber } from "./util";

export default {
  app: {
    rpcUrl: "https://testnet-rpc.thundercore.com",
    thunderScanUrl: "https://scan-testnet.thundercore.com",
    privateKey: parseEnv("PRIVATE_KEY"),
    jwtSecret: parseEnv("JWT_SECRET")
  },
  debug: {
    benchmark: true
  },
  redis: {
    port: parseEnvNumber("REDIS_CLUSTER_PORT"),
    host: parseEnv("REDIS_CLUSTER_HOST")
  }
};
