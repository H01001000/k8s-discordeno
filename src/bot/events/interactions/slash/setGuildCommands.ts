import { DEV_GUILD_ID } from "../../../../../configs.ts";
import { Bot, DiscordGatewayPayload } from "../../../../../deps.ts";
import logger from "../../../../utils/logger.ts";
import { updateGuildCommands } from "../../../../utils/updateSlash.ts";

export async function setGuildCommands(
  bot: Bot,
  data: DiscordGatewayPayload,
) {
  if (!data.t) return;

  const id = bot.transformers.snowflake(
    (["GUILD_CREATE", "GUILD_UPDATE"].includes(data.t)
      ? // deno-lint-ignore no-explicit-any
      (data.d as any).id
      : // deno-lint-ignore no-explicit-any
      (data.d as any).guild_id ?? "") ?? "",
  );

  // IF NO ID FOUND CANCEL. IF ALREADY ON LATEST VERSION CANCEL.
  if (!id) return;

  // DEV GUILD SHOULD BE IGNORED
  if (id === DEV_GUILD_ID) return;

  // NEW GUILD AVAILABLE OR NOT USING LATEST VERSION
  logger.info(
    `[Slash Setup] Installing slash commands on Guild ${id} for Event ${data.t}`,
  );
  await updateGuildCommands(bot, id);
}
