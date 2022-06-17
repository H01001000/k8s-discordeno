import { ApplicationCommandOptionTypes } from "../../../../../../deps.ts";
import { replyToInteraction } from "../../../../../utils/replies.ts";
import { updateGlobalCommands, updateGuildCommands } from "../../../../../utils/updateSlash.ts";
import { createCommand } from "../createCommand.ts";

const command = createCommand({
  name: "update",
  description: "🎉 Update the commands for the bot.",
  dev: true,
  acknowledge: true,
  options: [
    {
      name: "global",
      description: "Update the global commands.",
      type: ApplicationCommandOptionTypes.SubCommand,
    },
    {
      name: "guild",
      description: "Update guild commands for a guild.",
      type: ApplicationCommandOptionTypes.SubCommand,
      options: [
        {
          name: "id",
          description: "The guild id you wish to manually update.",
          type: ApplicationCommandOptionTypes.String,
          required: true,
        },
      ],
    },
  ] as const,
  execute: async function (bot, interaction, args) {
    if (args.global) {
      await updateGlobalCommands(bot);
      return await replyToInteraction(
        bot,
        interaction,
        "Updated Global Commands!",
      );
    }

    if (args.guild) {
      // GUILD COMMANDS
      await updateGuildCommands(bot, bot.transformers.snowflake(args.guild.id));
      return await replyToInteraction(
        bot,
        interaction,
        `Updated Guild Commands for Guild ID: ${args.guild.id}!`,
      );
    }
  },
});

export default command;
