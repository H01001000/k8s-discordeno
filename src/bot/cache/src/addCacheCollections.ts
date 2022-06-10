import {
  Bot,
  Channel,
  Member,
  Message,
  ModifyWebhook,
  PresenceUpdate,
  User,
  VoiceState,
  Webhook,
} from "../deps.ts";
import { GuildCollection } from "./customCollection/GuildCollection.ts";
import { RedisCollection } from "./RedisCollection.ts"

export type BotWithCache<B extends Bot = Bot> = Omit<B, "helpers"> & CacheProps & {
  helpers: BotHelpersWithCache<B["helpers"]>;
};

export type BotHelpersWithCache<T> = Omit<T, "editWebhook"> & {
  /** The added channelId argument at the end is used to validate permission checks */
  editWebhook: (webhookId: bigint, options: ModifyWebhook, fromChannelId?: bigint) => Promise<Webhook>;
};

export interface CacheProps {
  guilds: GuildCollection;
  users: RedisCollection<User>;
  members: RedisCollection<Member>;
  channels: RedisCollection<Channel>;
  messages: RedisCollection<Message>;
  presences: RedisCollection<PresenceUpdate>;
  dispatchedGuildIds: Set<bigint>;
  dispatchedChannelIds: Set<bigint>;
  activeGuildIds: Set<bigint>;
  voiceStates: RedisCollection<VoiceState>;
}

export function addCacheCollections<B extends Bot>(bot: B): BotWithCache<B> {
  const cacheBot = bot as unknown as BotWithCache<B>;
  cacheBot.guilds = new GuildCollection("guilds");
  cacheBot.users = new RedisCollection("users");
  cacheBot.members = new RedisCollection("members");
  cacheBot.channels = new RedisCollection("channels");
  cacheBot.messages = new RedisCollection("messages");
  cacheBot.presences = new RedisCollection("presences");
  cacheBot.dispatchedGuildIds = new Set();
  cacheBot.dispatchedChannelIds = new Set();
  cacheBot.activeGuildIds = new Set();

  return cacheBot;
}
