import { snowflakeToTimestamp } from "../../../../../utils/helpers.ts";
import { replyToInteraction } from "../../../../../utils/replies.ts";
import { createCommand } from "../createCommand.ts";

const command = createCommand({
  name: "ping",
  dev: true,
  description: "🏓 Check whether the bot is online and responsive.",
  execute: async function (bot, interaction) {
    return await replyToInteraction(
      bot,
      interaction,
      `🏓 Pong! ${Date.now() - snowflakeToTimestamp(interaction.id) / 1000} seconds! I am online and responsive! :clock10:`
    );
  },
});

export default command;
