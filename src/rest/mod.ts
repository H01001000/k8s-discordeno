// START FILE FOR REST PROCESS
import { DISCORD_TOKEN, REST_AUTHORIZATION_KEY, REST_URL, REDIS_URL } from "../../configs.ts";
import { BASE_URL, createRestManager, connectRedis, RestRateLimitedPath, serve } from "../../deps.ts";
import { logger } from "../utils/logger.ts";


const log = logger({ name: "REST" });

// CREATES THE FUNCTIONALITY FOR MANAGING THE REST REQUESTS
const rest = createRestManager({
  token: DISCORD_TOKEN,
  secretKey: REST_AUTHORIZATION_KEY,
  customUrl: `http://${REST_URL}:8000`,
  debug: console.log,
});

const publisher = await connectRedis({
  hostname: REDIS_URL,
})

class RedisRatelimitedPaths extends Map {
  set(key: string, value: RestRateLimitedPath) {
    console.log(key, value);
    publisher.publish("setRedisRatelimitedPaths", JSON.stringify({ key, value }))
    return super.set(key, value)
  }
  delete(key: string) {
    publisher.publish("deleteRedisRatelimitedPaths", key)
    return super.delete(key)
  }
  cacheSet(key: string, value: RestRateLimitedPath) {
    return super.set(key, value)
  }
  cacheDelete(key: string) {
    return super.delete(key)
  }
}

rest.ratelimitedPaths = new RedisRatelimitedPaths()

const subscriber = await connectRedis({
  hostname: REDIS_URL,
})

const setSubscribtion = await subscriber.subscribe("setRedisRatelimitedPaths", "deleteRedisRatelimitedPaths");
(async function () {
  for await (const { channel, message } of setSubscribtion.receive()) {
    if (channel === "setRedisRatelimitedPaths") {
      const data = JSON.parse(message)
      if (message === "global") rest.globallyRateLimited = true;
      (rest.ratelimitedPaths as RedisRatelimitedPaths).cacheSet(data.key, data.value)
      if (!rest.processingRateLimitedPaths) {
        rest.processRateLimitedPaths(rest);
      }
      continue
    }
    if (message === "global") rest.globallyRateLimited = false;
    (rest.ratelimitedPaths as RedisRatelimitedPaths).cacheDelete(message)
  }
})();

// START LISTENING TO THE URL(localhost)
serve(handleRequest, {
  port: 8000, onListen: () => {
    log.info(
      `HTTP webserver running.  Access it at:  http://${REST_URL}:8000/`,
    );
  }
});

async function handleRequest(req: Request) {
  const path = new URL(req.url).pathname
  if (path === '/healthz') {
    return new Response(undefined, { status: 200 })
  }

  if (
    !REST_AUTHORIZATION_KEY ||
    REST_AUTHORIZATION_KEY !==
    req.headers.get("AUTHORIZATION")
  ) {
    return new Response(JSON.stringify({ error: "Invalid authorization key." }), {
      status: 401,
    })
  }

  const json = req.body ? (await req.json()) : undefined;

  try {
    const result = await rest.runMethod(
      rest,
      req.method as RequestMethod,
      `${BASE_URL}${req.url.substring(
        `http://${REST_URL}:8000`.length,
      )
      }`,
      json,
    );

    if (result) {
      return new Response(JSON.stringify(result), {
        status: 200,
      })
    } else {
      return new Response(undefined, {
        status: 204,
      })
    }
  } catch (error) {
    log.error(error);
    return new Response(JSON.stringify(error), {
      status: error.code,
    })
  }
}

type RequestMethod = "post" | "put" | "delete" | "patch";
