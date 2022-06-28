import { REDIS_URL } from "../../configs.ts";
import { connectRedis } from "../../deps.ts";

export const redis = await connectRedis({
  hostname: REDIS_URL,
  maxRetryCount: 0
})