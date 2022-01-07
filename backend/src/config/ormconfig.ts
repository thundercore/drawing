import { parseEnv, parseEnvNumber } from "./util";

const root = process.env.NODE_ENV === "production" ? "dist" : "src";

const options = {
  host: parseEnv("POSTGRES_HOST"),
  port: parseEnvNumber("POSTGRES_PORT"),
  username: parseEnv("POSTGRES_USER"),
  password: parseEnv("POSTGRES_PASSWORD"),
  database: parseEnv("POSTGRES_DATABASE"),
  type: "postgres",
  entities: [root + "/**/*.entity{.ts,.js}"],
  migrations: [root + "/migrations/*{.ts,.js}"],
  cli: {
    migrationsDir: root + "/migrations"
  },
  synchronize: false
};

export = [
  { name: "default", ...options },
  {
    name: "seed",
    ...options,
    migrations: [root + "/seeds/*.ts"],
    cli: { migrationsDir: root + "/seeds" }
  }
];
