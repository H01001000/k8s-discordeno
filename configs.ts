import { dotEnvConfig, GatewayIntents } from "./deps.ts";

// Get the .env file that the user should have created, and load the configs.
const env = { ...Deno.env.toObject(), ...dotEnvConfig({ export: true }) };

// TODO: REMOVE THESE! THEY ARE BAD FOR YOU! DUH! Seriously, only keep the ones your bot needs!
export const GATEWAY_INTENTS: (keyof typeof GatewayIntents)[] = [
  "DirectMessageReactions",
  "DirectMessageTyping",
  "DirectMessages",
  "GuildBans",
  "GuildEmojis",
  "GuildIntegrations",
  "GuildInvites",
  "GuildMembers",
  "GuildMessageReactions",
  "GuildMessageTyping",
  "GuildMessages",
  "GuildPresences",
  "GuildVoiceStates",
  "GuildWebhooks",
  "Guilds",
];

if (!env.DISCORD_TOKEN) {
  throw new Error("DUDE! You did not provide a Discord token!");
}
export const DISCORD_TOKEN = env.DISCORD_TOKEN!;

// Set as 0 to make it use default values. NOT RECOMMENDED TO DEFAULT FOR BIG BOTS!!!!
export const MAX_SHARDS = env.MAX_SHARDS ? parseInt(env.MAX_SHARDS, 10) : 0;
export const FIRST_SHARD_ID = env.FIRST_SHARD_ID ? parseInt(env.FIRST_SHARD_ID, 10) : 0;
export const LAST_SHARD_ID = env.LAST_SHARD_ID ? parseInt(env.LAST_SHARD_ID, 10) : 0;
// Default to 10
export const SHARDS_PER_CLUSTER = env.SHARDS_PER_CLUSTER ? parseInt(env.SHARDS_PER_CLUSTER, 10) : 10;
export const MAX_CLUSTERS = parseInt(env.MAX_CLUSTERS!, 10);
if (!MAX_CLUSTERS) {
  throw new Error(
    "How many clusters can you run on your machine (MAX_CLUSTERS)? Check your .env file!",
  );
}

export const REST_URL = env
  .REST_URL!;
if (!REST_URL) {
  throw new Error(
    "Hmm, it seems like you don't have somewhere to send http requests to (REST_URL). Please check your .env file!",
  );
}

export const REDIS_URL = env
  .REDIS_URL!;
if (!REDIS_URL) {
  throw new Error(
    "Hmm, it seems like you don't have a redis DB to connect to (REDIS_URL). Please check your .env file!",
  );
}

export const RABBITMQ_URL = env
  .RABBITMQ_URL!;
if (!RABBITMQ_URL) {
  throw new Error(
    "Hmm, it seems like you don't have a message queue to connect to (QUEUE_URL). Please check your .env file!",
  );
}

export const REST_AUTHORIZATION_KEY = env.REST_AUTHORIZATION_KEY!;
if (!REST_AUTHORIZATION_KEY) {
  throw new Error(
    "You need to add a REST_AUTHORIZATION_KEY to your .env file!",
  );
}

export const BOT_ID = BigInt(atob(env.DISCORD_TOKEN.split(".")[0]));
if (!BOT_ID) {
  throw new Error(
    "Hmm, it seems like you didn't put in a valid DISCORD_TOKEN. Check your .env file!",
  );
}

export const REST_PORT = env.REST_PORT ? parseInt(env.REST_PORT, 10) : 5000;
export const REDIS_PORT = env.REDIS_PORT ? parseInt(env.REDIS_PORT, 10) : 6379;

export const RABBITMQ_PORT = env.RABBITMQ_PORT ? parseInt(env.RABBITMQ_PORT, 10) : 5672;
export const EVENT_EXCHANGE_NAME = env.EVENT_EXCHANGE_NAME ? env.EVENT_EXCHANGE_NAME : "event";
export const RABBITMQ_USERNAME = env.RABBITMQ_USERNAME ? env.RABBITMQ_USERNAME : "guest";
export const RABBITMQ_PASSWORD = env.RABBITMQ_PASSWORD ? env.RABBITMQ_PASSWORD : "guest";

export const DEVELOPMENT = env.DEVELOPMENT ?? true;
export const MISSING_TRANSLATION_WEBHOOK = env.MISSING_TRANSLATION_WEBHOOK ||
  "";
export const DEV_GUILD_ID = env.DEV_GUILD_ID ? BigInt(env.DEV_GUILD_ID) : 0n;
