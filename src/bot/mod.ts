import {
  BOT_ID,
  DEVELOPMENT,
  DISCORD_TOKEN,
  EVENT_EXCHANGE_NAME,
  GATEWAY_INTENTS,
  RABBITMQ_PASSWORD,
  RABBITMQ_PORT,
  RABBITMQ_URL,
  RABBITMQ_USERNAME,
  REST_AUTHORIZATION_KEY,
  REST_PORT,
  REST_URL,
} from "../../configs.ts";
import { connectAmqp, createBot, createRestManager, DiscordGatewayPayload } from "../../deps.ts";
import logger from "../utils/logger.ts";
import { updateDevCommands } from "../utils/updateSlash.ts";
import { BotClient, setupBotClient } from "./botClient.ts";
import { setGuildCommands } from "./events/interactions/slash/setGuildCommands.ts";
import { setupEventHandlers } from "./events/mod.ts";

export const bot = createBot({
  token: DISCORD_TOKEN,
  botId: BOT_ID,
  events: {},
  intents: GATEWAY_INTENTS,
}) as BotClient;

setupEventHandlers();
// customizeBotInternals(bot);
setupBotClient(bot);

bot.rest = createRestManager({
  token: DISCORD_TOKEN,
  secretKey: REST_AUTHORIZATION_KEY,
  customUrl: `http://${REST_URL}:${REST_PORT}`,
});

if (DEVELOPMENT) {
  logger.info(`[DEV MODE] Updating slash commands for dev server.`);
  //await updateDevCommands(bot);
} else {
  // THIS WILL UPDATE ALL YOUR GLOBAL COMMANDS ON STARTUP
  // await updateGlobalCommands(bot);
}

const connection = await connectAmqp(`amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_URL}:${RABBITMQ_PORT}`);
const channel = await connection.openChannel();

channel.declareExchange({
  exchange: EVENT_EXCHANGE_NAME,
  durable: true,
  type: "x-message-deduplication",
  arguments: {
    "x-cache-size": 1000,
    "x-cache-ttl": 10000
  }
})

const queue = await channel.declareQueue({ queue: '', exclusive: true });
const queueName = queue.queue;

channel.bindQueue({ exchange: EVENT_EXCHANGE_NAME, queue: queueName })

await channel.consume(
  { queue: queueName },
  async (args, _props, data) => {
    const json = (JSON.parse(new TextDecoder().decode(data))) as {
      data: DiscordGatewayPayload;
      shardId: number;
    };

    // EMITS RAW EVENT
    bot.events.raw(bot, json.data, json.shardId);

    if (json.data.t && json.data.t !== "RESUMED") {
      // When a guild or something isn't in cache this will fetch it before doing anything else
      if (!["READY", "GUILD_LOADED_DD"].includes(json.data.t)) {
        await bot.events.dispatchRequirements(bot, json.data, json.shardId);
        // WE ALSO WANT TO UPDATE GUILD SLASH IF NECESSARY AT THIS POINT
        await setGuildCommands(bot, json.data);
      }

      bot.handlers[json.data.t]?.(bot, json.data, json.shardId);
    }
    await channel.ack({ deliveryTag: args.deliveryTag });
  },
);
