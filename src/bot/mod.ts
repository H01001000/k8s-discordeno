import {
  BOT_ID,
  DEVELOPMENT,
  DISCORD_TOKEN,
  EVENT_EXCHANGE_NAME,
  EVENT_QUEUE_NAME,
  GATEWAY_INTENTS,
  RABBITMQ_PASSWORD,
  RABBITMQ_URL,
  RABBITMQ_USERNAME,
  REST_AUTHORIZATION_KEY,
  REST_URL,
} from "../../configs.ts";
import { connectAmqp, createBot, createRestManager, DiscordGatewayPayload, serve } from "../../deps.ts";
import logger from "../utils/logger.ts";
import { updateDevCommands as _updateDevCommands } from "../utils/updateSlash.ts";
import enableCachePlugin, { dispatchRequirements, enableCacheSweepers } from "./cache/mod.ts";
import { setGuildCommands as _setGuildCommands } from "./events/interactions/slash/setGuildCommands.ts";
import { setupEventHandlers } from "./events/mod.ts";
import { patchBot } from "./patch.ts";

let ready = false
serve((req) => {
  const path = new URL(req.url).pathname

  if (path === '/healthz') {
    return ready ? new Response(undefined, { status: 200 }) : new Response(undefined, { status: 400 })
  }
  return new Response(undefined, { status: 404 })
}, { port: 8000 });

// deno-lint-ignore no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const bot = enableCachePlugin(
  createBot({
    token: DISCORD_TOKEN,
    botId: BOT_ID,
    events: {},
    intents: GATEWAY_INTENTS,
  })
);

enableCacheSweepers(bot);

setupEventHandlers();
// customizeBotInternals(bot);
patchBot(bot);

bot.rest = createRestManager({
  token: DISCORD_TOKEN,
  secretKey: REST_AUTHORIZATION_KEY,
  customUrl: `http://${REST_URL}:8000`,
});

if (DEVELOPMENT) {
  logger.info(`[DEV MODE] Updating slash commands for dev server.`);
  //await updateDevCommands(bot);
} else {
  // THIS WILL UPDATE ALL YOUR GLOBAL COMMANDS ON STARTUP
  // await updateGlobalCommands(bot);
}

const connection = await connectAmqp(`amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_URL}`);
const channel = await connection.openChannel();

channel.declareExchange({
  exchange: EVENT_EXCHANGE_NAME,
  durable: true,
  type: "x-message-deduplication",
  arguments: {
    "x-cache-size": 1000,
    "x-cache-ttl": 500
  }
})

await channel.declareQueue({ queue: EVENT_QUEUE_NAME });
await channel.bindQueue({ exchange: EVENT_EXCHANGE_NAME, queue: EVENT_QUEUE_NAME })
await channel.consume(
  { queue: EVENT_QUEUE_NAME },
  async (args, _props, data) => {
    const json = (JSON.parse(new TextDecoder().decode(data))) as {
      data: DiscordGatewayPayload;
      shardId: number;
    };

    // EMITS RAW EVENT
    bot.events.raw(bot, json.data, json.shardId);

    await dispatchRequirements(bot, json.data)

    if (json.data.t && json.data.t !== "RESUMED") {
      // When a guild or something isn't in cache this will fetch it before doing anything else
      if (!["READY", "GUILD_LOADED_DD"].includes(json.data.t)) {
        await bot.events.dispatchRequirements(bot, json.data, json.shardId);
        // WE ALSO WANT TO UPDATE GUILD SLASH IF NECESSARY AT THIS POINT
        //await setGuildCommands(bot, json.data);
      }

      bot.handlers[json.data.t]?.(bot, json.data, json.shardId);
    }
    await channel.ack({ deliveryTag: args.deliveryTag });
  },
);
ready = true