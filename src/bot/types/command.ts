import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  Channel,
  Interaction,
  Member,
  PermissionStrings,
  Role,
  User,
  Bot
} from "../../../deps.ts";
import { PermissionLevelHandlers } from "../../utils/permLevels.ts";

// deno-lint-ignore no-explicit-any
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type Identity<T> = { [P in keyof T]: T[P] };

// TODO: make required by default true
// Define each of the types here
type BaseDefinition = {
  description: string;
};

// Subcommand
type SubcommandArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.SubCommand;
    // options: Omit<ArgumentDefinition, 'SubcommandArgumentDefinition' | 'SubcommandGroupArgumentDefinition'>[]
    options?: readonly ArgumentDefinition[];
  };

// SubcommandGroup
type SubcommandGroupArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.SubCommandGroup;
  options: readonly SubcommandArgumentDefinition[];
};

// String
type StringArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.String;
    choices?: readonly { name: string; value: string }[];
    required?: true;
  };
type StringOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.String;
  choices?: readonly { name: string; value: string }[];
  required?: false;
};

// Integer
type IntegerArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.Integer;
    choices?: readonly { name: string; value: number }[];
    required: true;
  };
type IntegerOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Integer;
  choices?: readonly { name: string; value: number }[];
  required?: false;
};

// BOOLEAN
type BooleanArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.Boolean;
    required: true;
  };
type BooleanOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Boolean;
  required?: false;
};

// USER
type UserArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.User;
    required: true;
  };
type UserOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.User;
  required?: false;
};

// CHANNEL
type ChannelArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.Channel;
    required: true;
  };
type ChannelOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Channel;
  required?: false;
};

// ROLE
type RoleArgumentDefinition =
  & BaseDefinition
  & {
    name: string;
    type: ApplicationCommandOptionTypes.Role;
    required: true;
  };
type RoleOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Role;
  required?: false;
};

// MENTIONABLE
type MentionableArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Mentionable;
  required: true;
};
type MentionableOptionalArgumentDefinition = BaseDefinition & {
  name: string;
  type: ApplicationCommandOptionTypes.Mentionable;
  required?: false;
};

// Add each of known ArgumentDefinitions to this union.
export type ArgumentDefinition =
  | StringArgumentDefinition
  | StringOptionalArgumentDefinition
  | IntegerArgumentDefinition
  | IntegerOptionalArgumentDefinition
  | BooleanArgumentDefinition
  | BooleanOptionalArgumentDefinition
  | UserArgumentDefinition
  | UserOptionalArgumentDefinition
  | ChannelArgumentDefinition
  | ChannelOptionalArgumentDefinition
  | RoleArgumentDefinition
  | RoleOptionalArgumentDefinition
  | MentionableArgumentDefinition
  | MentionableOptionalArgumentDefinition
  | SubcommandArgumentDefinition
  | SubcommandGroupArgumentDefinition;


// OPTIONALS MUST BE FIRST!!!
export type ConvertArgumentDefinitionsToArgs<
  T extends readonly ArgumentDefinition[],
> = Identity<
  UnionToIntersection<
    {
      [P in keyof T]: T[P] extends StringOptionalArgumentDefinition // STRING
      ? {
        [_ in string]?: T[P]["choices"] extends readonly { name: string; value: string }[] ? // @ts-ignore ts being dumb
        T[P]["choices"][number]["value"]
        : string;
      }
      : T[P] extends StringArgumentDefinition ? {
        [_ in string]: T[P]["choices"] extends readonly { name: string; value: string }[] ? // @ts-ignore ts being dumb
        T[P]["choices"][number]["value"]
        : string;
      }
      : // INTEGER
      T[P] extends IntegerOptionalArgumentDefinition ? {
        [_ in string]?: T[P]["choices"] extends readonly { name: string; value: number }[] ? // @ts-ignore ts being dumb
        T[P]["choices"][number]["value"]
        : number;
      }
      : T[P] extends IntegerArgumentDefinition ? {
        [_ in string]: T[P]["choices"] extends readonly { name: string; value: number }[] ? // @ts-ignore ts being dumb
        T[P]["choices"][number]["value"]
        : number;
      }
      : // BOOLEAN
      T[P] extends BooleanOptionalArgumentDefinition ? { [_ in string]?: boolean }
      : T[P] extends BooleanArgumentDefinition ? { [_ in string]: boolean }
      : // USER
      T[P] extends UserOptionalArgumentDefinition ? {
        [_ in string]?: {
          user: User;
          member: Member;
        };
      }
      : T[P] extends UserArgumentDefinition ? {
        [_ in string]: {
          user: User;
          member: Member;
        };
      }
      : // CHANNEL
      T[P] extends ChannelOptionalArgumentDefinition ? { [_ in string]?: Channel }
      : T[P] extends ChannelArgumentDefinition ? { [_ in string]: Channel }
      : // ROLE
      T[P] extends RoleOptionalArgumentDefinition ? { [_ in string]?: Role }
      : T[P] extends RoleArgumentDefinition ? { [_ in string]: Role }
      : // MENTIONABLE
      T[P] extends MentionableOptionalArgumentDefinition ? {
        [_ in string]?: Role | {
          user: User;
          member: Member;
        };
      }
      : T[P] extends MentionableArgumentDefinition ? {
        [_ in string]: Role | {
          user: User;
          member: Member;
        };
      }
      : // SUBCOMMAND
      T[P] extends SubcommandArgumentDefinition ? {
        [_ in string]?: T[P]["options"] extends readonly ArgumentDefinition[] ? // @ts-ignore ignore this for a bit
        ConvertArgumentDefinitionsToArgs<T[P]["options"]>
        : // deno-lint-ignore ban-types
        {};
      }
      : // SUBCOMMAND GROUP
      T[P] extends SubcommandGroupArgumentDefinition ? {
        [_ in string]?: ConvertArgumentDefinitionsToArgs<
          T[P]["options"]
        >;
      }
      : never;
    }[number]
  >
>;

export interface Command<T extends readonly ArgumentDefinition[]> {
  /** The name of the command, used for both slash and message commands. */
  name: string;
  /** The type of command. */
  type?: ApplicationCommandTypes;
  /** The description of the command*/
  description: string;
  // TODO: consider type being a string like "number" | "user" for better ux
  /** The options for the command, used for both slash and message commands. */
  // options?: ApplicationCommandOption[];
  options?: T;
  execute: (
    bot: Bot,
    data: Interaction,
    args: ConvertArgumentDefinitionsToArgs<T>,
  ) => unknown;
  subcommands?: Record<
    string,
    // deno-lint-ignore no-explicit-any
    Omit<Command<any>, "subcommands"> & { group?: string }
  >;
  /** Whether the command should have a cooldown */
  cooldown?: {
    /** How long the user needs to wait after the first execution until he can use the command again */
    seconds: number;
    /** How often the user is allowed to use the command until he is in cooldown */
    allowedUses?: number;
  };
  nsfw?: boolean;
  /** By default false */
  global?: boolean;
  /** Dm only by default false */
  dmOnly?: boolean;

  advanced?: boolean;

  /** Whether or not this slash command should be enabled right now. Defaults to true. */
  enabled?: boolean;
  /** Whether or not this command is still in development and should be setup in the dev server for testing. */
  dev?: boolean;
  /** Whether or not this command will take longer than 3s and need to acknowledge to discord. */
  acknowledge?: boolean;

  permissionLevels?:
  | (keyof typeof PermissionLevelHandlers)[]
  | ((
    data: Interaction,
    command: Command<T>,
  ) => boolean | Promise<boolean>);
  botServerPermissions?: PermissionStrings[];
  botChannelPermissions?: PermissionStrings[];
  userServerPermissions?: PermissionStrings[];
  userChannelPermissions?: PermissionStrings[];
}

export enum PermissionLevels {
  Member,
  Moderator,
  Admin,
  ServerOwner,
  BotSupporter,
  BotDev,
  BotOwner,
}
