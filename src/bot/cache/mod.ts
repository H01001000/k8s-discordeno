import { Bot, DiscordChannel, DiscordGuildEmojisUpdate, DiscordUser, endpoints } from "./deps.ts";
import { setupCacheRemovals } from "./src/setupCacheRemovals.ts";
import { addCacheCollections, BotWithCache } from "./src/addCacheCollections.ts";
import { setupCacheEdits } from "./src/setupCacheEdits.ts";
import { RedisCollection } from "./src/RedisCollection.ts";

const mergeObject = <T extends Record<string, unknown> | undefined, V extends Record<string, unknown>>(oldObject: T, newObject: V) => {
  if (!oldObject) return newObject as V
  Object.keys(oldObject).forEach((key) => {
    if (newObject[key] === undefined || newObject[key] === 'undefined') {
      delete newObject[key];
    }
  })
  return { ...oldObject, ...newObject }
}

// PLUGINS MUST TAKE A BOT ARGUMENT WHICH WILL BE MODIFIED
export function enableCachePlugin<B extends Bot = Bot>(rawBot: B): BotWithCache<B> {
  // MARK THIS PLUGIN BEING USED
  rawBot.enabledPlugins.add("CACHE");

  // CUSTOMIZATION GOES HERE
  const bot = addCacheCollections(rawBot);

  // Get the unmodified transformer.
  const { guild, user, member, channel, message, presence, role, voiceState } = bot.transformers;
  // Override the transformer
  bot.transformers.guild = function (_, payload) {
    // Run the unmodified transformer
    const result = guild(bot, payload);

    //@ts-expect-error: overriding
    result.roles = new RedisCollection(`${result.id}-roles`)
    //@ts-expect-error: overriding
    result.emojis = new RedisCollection(`${result.id}-emojis`)
    //@ts-expect-error: overriding
    result.channels = new RedisCollection(`${result.id}-channels`)
    //@ts-expect-error: overriding
    result.voiceStates = new RedisCollection(`${result.id}-voiceStates`)

    // Cache the result
    if (result) {
      bot.guilds.get(result.id).then((oldResult) => {
        //@ts-expect-error: typescript thinks interface is not record<string, unknow>
        const mergedResult = mergeObject(oldResult, result);
        bot.guilds.set(result.id, mergedResult);
      })

      const channels = payload.guild.channels || [];
      channels.forEach((channel) => {
        bot.transformers.channel(bot, { channel, guildId: result.id });
      });

      const emojis = payload.guild.emojis || [];
      emojis.forEach((emoji) => {
        result.emojis.set(bot.transformers.snowflake(emoji.id!), bot.transformers.emoji(bot, emoji));
      });
    }

    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.user = function (...args) {
    // Run the unmodified transformer
    const result = user(...args);
    // Cache the result
    if (result) {
      bot.users.get(result.id).then((oldResult) => {
        const mergedResult = mergeObject(oldResult, result)
        if (!mergedResult.username) {
          bot.rest.runMethod<DiscordUser>(bot.rest, "get", endpoints.USER(result.id)).then((payload) => {
            bot.transformers.user(bot, payload)
          })
          return result
        }
        bot.users.set(result.id, mergedResult);
      })
    }
    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.member = function (...args) {
    // Run the unmodified transformer
    const result = member(...args);
    // Cache the result
    if (result) {
      bot.members.get(bot.transformers.snowflake(`${result.id}${result.guildId}`)).then((oldResult) => {
        bot.members.set(bot.transformers.snowflake(`${result.id}${result.guildId}`), mergeObject(oldResult, result));
      })
    }
    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.channel = function (...args) {
    // Run the unmodified transformer
    const result = channel(...args);
    // Cache the result
    if (result) {
      bot.channels.get(result.id).then((oldResult) => {
        const mergedResult = mergeObject(oldResult, result)
        if (!mergedResult.name) {
          bot.rest.runMethod<DiscordChannel>(bot.rest, "get", endpoints.CHANNEL_BASE(result.id)).then((payload) => {
            console.log("fetch channel", result.id, payload);
            bot.transformers.channel(bot, { channel: payload })
          })
          return result
        }
        console.log("result channel", result.id, result);
        bot.channels.set(result.id, mergedResult);
        if (result.guildId) {
          new RedisCollection(`${result.guildId}-channels`).set(result.id, result)
        }
      })
    }
    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.message = function (_, payload) {
    // Run the unmodified transformer
    const result = message(bot, payload);
    // Cache the result
    if (result) {
      bot.messages.get(result.id).then((oldResult) => {
        bot.messages.set(result.id, mergeObject(oldResult, result));
      })
      // CACHE THE USER
      const user = bot.transformers.user(bot, payload.author);

      if (payload.guild_id && payload.member) {
        const guildId = bot.transformers.snowflake(payload.guild_id);
        // CACHE THE MEMBER
        bot.transformers.member(bot, payload.member, guildId, user.id)
      }
    }

    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.presence = function (...args) {
    // Run the unmodified transformer
    const result = presence(...args);
    // Cache the result
    if (result) {
      bot.presences.get(result.user.id).then((oldResult) => {
        bot.presences.set(result.user.id, mergeObject(oldResult, result));
      })
    }
    // Return the result
    return result;
  };

  // Override the transformer
  bot.transformers.role = function (...args) {
    // Run the unmodified transformer
    const result = role(...args);
    // Cache the result
    if (result) {
      bot.guilds.get(result.guildId).then((guild) => {
        guild?.roles?.get(result.id).then((oldResult) => {
          guild?.roles?.set(result.id, mergeObject(oldResult, result))
        })
      });
    }
    // Return the result
    return result;
  };

  const { GUILD_EMOJIS_UPDATE } = bot.handlers;
  bot.handlers.GUILD_EMOJIS_UPDATE = async function (_, data, shardId) {
    const payload = data.d as DiscordGuildEmojisUpdate;

    const guild = await bot.guilds.get(bot.transformers.snowflake(payload.guild_id));
    if (guild) {
      guild.emojis = new RedisCollection(`${payload.guild_id}-emojis`, payload.emojis.map((e) => {
        const emoji = bot.transformers.emoji(bot, e);
        return [emoji.id!, emoji];
      }));

      await guild.emojis.loadEntries()
    }

    GUILD_EMOJIS_UPDATE(bot, data, shardId);
  };


  // Override the transformer
  bot.transformers.voiceState = function (...args) {
    // Run the unmodified transformer
    const result = voiceState(...args);
    // Cache the result
    if (result) {
      bot.guilds.get(result.guildId).then((guild) => {
        guild?.voiceStates.get(result.userId).then((oldResult) => {
          guild?.voiceStates?.set(result.userId, mergeObject(oldResult, result))
        })
      });
    }
    // Return the result
    return result;
  };

  setupCacheRemovals(bot);
  setupCacheEdits(bot);

  // PLUGINS MUST RETURN THE BOT
  return bot;
}

export default enableCachePlugin;
export * from "./src/addCacheCollections.ts";
export * from "./src/dispatchRequirements.ts";
export * from "./src/setupCacheEdits.ts";
export * from "./src/setupCacheRemovals.ts";
export * from "./src/sweepers.ts";
