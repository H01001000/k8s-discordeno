import { redis } from "../../../redis.ts";
import { Channel, Collection, Emoji, Guild, Role, VoiceState } from "../../deps.ts";
import { RedisCollection } from "../RedisCollection.ts";

//@ts-expect-error: overriding
export interface CachedGuild extends Guild {
  roles: RedisCollection<Role>
  emojis: RedisCollection<Emoji>
  channels: RedisCollection<Channel>
  voiceStates: RedisCollection<VoiceState>
}

export class GuildCollection extends RedisCollection<CachedGuild> {
  async get(key: bigint) {
    const guild = await super.get(key)
    if (!guild) return
    guild.roles = new RedisCollection(`${guild.id}-roles`)
    guild.emojis = new RedisCollection(`${guild.id}-emojis`)
    guild.channels = new RedisCollection(`${guild.id}-channels`)
    guild.voiceStates = new RedisCollection(`${guild.id}-voiceStates`)
    return guild
  }

  async set(key: bigint, value: CachedGuild | Guild) {
    // deno-lint-ignore no-unused-vars
    const { emojis, channels, voiceStates, roles, ...guild } = value
    //@ts-expect-error: remove collection before cacheing
    return await super.set(key, guild)
  }

  // deno-lint-ignore no-explicit-any
  async forEach(callbackfn: (value: CachedGuild, key: bigint, map: Map<string, number>) => void, _thisArg?: any) {
    const records = await redis.hgetall("guilds")
    for (let i = 0; i < records.length / 2; i++) {
      const guild: CachedGuild = JSON.parse(records[i * 2 + 1])
      guild.roles = new RedisCollection(`${guild.id}-roles`)
      guild.emojis = new RedisCollection(`${guild.id}-emojis`)
      guild.channels = new RedisCollection(`${guild.id}-channels`)
      guild.voiceStates = new RedisCollection(`${guild.id}-voiceStates`)
      callbackfn(guild, BigInt(records[i * 2]), new Map());
    }
  }

  filter(callback: (value: CachedGuild, key: bigint) => boolean) {
    const relevant = new Collection<bigint, CachedGuild>();
    this.forEach((value, key) => {
      if (callback(value, key)) relevant.set(key, value);
    });

    return relevant;
  }
} 