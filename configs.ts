import { dotEnvConfig, GatewayIntents } from "./deps.ts";

// Get the .Deno.env file that the user should have created, and load the configs.
dotEnvConfig({ export: true })

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

if (!Deno.env.get("DISCORD_TOKEN")) {
  throw new Error("DUDE! You did not provide a Discord token!");
}
export const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!;

// Set as 0 to make it use default values. NOT RECOMMENDED TO DEFAULT FOR BIG BOTS!!!!
export const MAX_SHARDS = Deno.env.get("MAX_SHARDS") ? parseInt(Deno.env.get("MAX_SHARDS")!, 10) : 0;
export const FIRST_SHARD_ID = Deno.env.get("FIRST_SHARD_ID") ? parseInt(Deno.env.get("FIRST_SHARD_ID")!, 10) : 0;
export const LAST_SHARD_ID = Deno.env.get("LAST_SHARD_ID") ? parseInt(Deno.env.get("LAST_SHARD_ID")!, 10) : 0;
// Default to 10
export const SHARDS_PER_CLUSTER = Deno.env.get("SHARDS_PER_CLUSTER") ? parseInt(Deno.env.get("SHARDS_PER_CLUSTER")!, 10) : 10;
export const MAX_CLUSTERS = parseInt(Deno.env.get("MAX_CLUSTERS")!, 10);
if (!MAX_CLUSTERS) {
  throw new Error(
    "How many clusters can you run on your machine (MAX_CLUSTERS)? Check your .Deno.env file!",
  );
}

export const REST_URL = Deno.env
  .get("REST_URL")!;
if (!REST_URL) {
  throw new Error(
    "Hmm, it seems like you don't have somewhere to send http requests to (REST_URL). Please check your .Deno.env file!",
  );
}

export const REDIS_URL = Deno.env
  .get("REDIS_URL")!;
if (!REDIS_URL) {
  throw new Error(
    "Hmm, it seems like you don't have a redis DB to connect to (REDIS_URL). Please check your .Deno.env file!",
  );
}

export const RABBITMQ_URL = Deno.env
  .get("RABBITMQ_URL")!;
if (!RABBITMQ_URL) {
  throw new Error(
    "Hmm, it seems like you don't have a message queue to connect to (QUEUE_URL). Please check your .Deno.env file!",
  );
}

export const REST_AUTHORIZATION_KEY = Deno.env.get("REST_AUTHORIZATION_KEY")!;
if (!REST_AUTHORIZATION_KEY) {
  throw new Error(
    "You need to add a REST_AUTHORIZATION_KEY to your .Deno.env file!",
  );
}

export const BOT_ID = BigInt(atob(Deno.env.get("DISCORD_TOKEN")!.split(".")[0]));
if (!BOT_ID) {
  throw new Error(
    "Hmm, it seems like you didn't put in a valid DISCORD_TOKEN. Check your .Deno.env file!",
  );
}

export const EVENT_EXCHANGE_NAME = Deno.env.get("EVENT_EXCHANGE_NAME") ? Deno.env.get("EVENT_EXCHANGE_NAME")! : "event";
export const EVENT_QUEUE_NAME = Deno.env.get("EVENT_QUEUE_NAME") ? Deno.env.get("EVENT_QUEUE_NAME")! : "event";
export const RABBITMQ_USERNAME = Deno.env.get("RABBITMQ_USERNAME") ? Deno.env.get("RABBITMQ_USERNAME")! : "guest";
export const RABBITMQ_PASSWORD = Deno.env.get("RABBITMQ_PASSWORD") ? Deno.env.get("RABBITMQ_PASSWORD")! : "guest";

export const DEVELOPMENT = Deno.env.get("DEVELOPMENT") ?? true;
export const MISSING_TRANSLATION_WEBHOOK = Deno.env.get("MISSING_TRANSLATION_WEBHOOK") ||
  "";
export const DEV_GUILD_ID = Deno.env.get("DEV_GUILD_ID") ? BigInt(Deno.env.get("DEV_GUILD_ID")!) : 0n;
