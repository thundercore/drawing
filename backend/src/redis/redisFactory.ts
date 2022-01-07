import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";
import config from "../config";
import * as IORedis from "ioredis";

@Injectable()
export class RedisFactory implements OnModuleDestroy {
  private instances: Redis[] = [];
  constructor() {}

  getInstance(): Redis {
    const r = new IORedis(config.redis.port, config.redis.host);
    this.instances.push(r);
    return r;
  }

  onModuleDestroy(): any {
    for (const r of this.instances) {
      r.disconnect();
    }
  }
}
