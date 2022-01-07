import { parseEnv, parseEnvNumber } from "./util";

export default {
  app: {
    rpcUrl: "https://mainnet-rpc.thundercore.com",
    thunderScanUrl: "https://scan.thundercore.com",
    privateKey: parseEnv("PRIVATE_KEY"),
    jwtSecret: parseEnv("JWT_SECRET")
  },
  debug: {
    benchmark: false
  },
  redis: {
    port: parseEnvNumber("REDIS_CLUSTER_PORT"),
    host: parseEnv("REDIS_CLUSTER_HOST")
  }
};
