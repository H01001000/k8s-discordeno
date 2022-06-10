import { Bot, DiscordActivity, DiscordPresenceUpdate, Optionalize } from "../../deps.ts";

export const statusTypes = Object.freeze({
  online: 0,
  dnd: 1,
  idle: 2,
  invisible: 3,
  offline: 4,
});


export const patchBot = (bot: Bot) => {
  //@ts-expect-error: patch
  bot.transformers.activity = (bot: Bot, payload: DiscordActivity) => {
    const activity = {
      name: payload.name,
      type: payload.type,
      url: payload.url ?? undefined,
      createdAt: payload.created_at,
      startedAt: payload.timestamps?.start,
      endedAt: payload.timestamps?.end,
      applicationId: payload.application_id ? bot.transformers.snowflake(payload.application_id) : undefined,
      details: payload.details ?? undefined,
      state: payload.state ?? undefined,
      emoji: payload.emoji
        ? {
          name: payload.emoji.name,
          animated: payload.emoji.animated,
          id: payload.emoji.id ? bot.transformers.snowflake(payload.emoji.id) : undefined,
        }
        : undefined,
      partyId: payload.party?.id,
      partyCurrentSize: payload.party?.size?.[0],
      partyMaxSize: payload.party?.size?.[1],
      largeImage: payload.assets?.large_image,
      largeText: payload.assets?.large_text,
      smallImage: payload.assets?.small_image,
      smallText: payload.assets?.small_text,
      join: payload.secrets?.join,
      spectate: payload.secrets?.spectate,
      match: payload.secrets?.match,
      instance: payload.instance,
      flags: payload.flags,
      buttons: payload.buttons,
    };

    return activity as Optionalize<typeof activity>;
  }

  bot.transformers.presence = (bot: Bot, payload: DiscordPresenceUpdate) => {
    const presence = {
      user: bot.transformers.user(bot, payload.user),
      guildId: bot.transformers.snowflake(payload.guild_id),
      status: statusTypes[payload.status],
      activities: payload.activities.map((activity) => bot.transformers.activity(bot, activity)),
      desktop: payload.client_status.desktop,
      mobile: payload.client_status.mobile,
      web: payload.client_status.web,
    };

    return presence as Optionalize<typeof presence>;
  }
}


