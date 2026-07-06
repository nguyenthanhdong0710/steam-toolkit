import type SteamUser from "steam-user";

export interface AccountAvatar {
  small: string | null;
  medium: string | null;
  full: string | null;
}

// Override: @types/steam-user's AccountInfo claims non-nullable strings/numbers for
// these fields, but they are observed to be null at runtime for some accounts.
export interface AccountInfoSummary {
  name: string;
  country: string;
  authedMachines: number | null;
  flags: SteamUser.EAccountFlags;
  facebookID: string | null;
  facebookName: string | null;
}

// Override: @types/steam-user's `vac` shape is missing `ranges`.
export interface VacStatus {
  numBans: number;
  appids: number[];
  ranges: unknown[];
}

export interface ProfileItemColor {
  style_name: string;
  color: string;
}

// Override: @types/steam-user's ProfileItem is stale — communityitemid is a string at
// runtime (not a number), movie_webm/movie_mp4 can be null, and profile_colors /
// movie_webm_small / movie_mp4_small are missing entirely.
export interface ProfileItem {
  profile_colors: ProfileItemColor[];
  communityitemid: string;
  image_small: string | null;
  image_large: string | null;
  name: string;
  item_title: string;
  item_description: string;
  appid: number;
  item_type: unknown;
  item_class: unknown;
  movie_webm: string | null;
  movie_mp4: string | null;
  movie_webm_small: string | null;
  movie_mp4_small: string | null;
  equipped_flags: unknown;
}

// Override: @types/steam-user's ProfileItems only lists 5 of the real categories.
export interface ProfileItems {
  profile_backgrounds: ProfileItem[];
  mini_profile_backgrounds: ProfileItem[];
  avatar_frames: ProfileItem[];
  animated_avatars: ProfileItem[];
  profile_modifiers: ProfileItem[];
  steam_deck_keyboard_skins: ProfileItem[];
  steam_deck_startup_movies: ProfileItem[];
}

// Override: @types/steam-user mistypes getEquippedProfileItems's return as the
// array-shaped ProfileItems; the real response has one optional item per category.
export interface EquippedProfileItems {
  profile_background: ProfileItem | null;
  mini_profile_background: ProfileItem | null;
  avatar_frame: ProfileItem | null;
  animated_avatar: ProfileItem | null;
  profile_modifier: ProfileItem | null;
  steam_deck_keyboard_skin: ProfileItem | null;
}

export interface AccountFriend {
  steamID: string;
  personaName: string | null;
}

export interface AccountSummary {
  steamID: string | null;

  // Only present when a persona lookup succeeded; omitted entirely otherwise.
  personaName?: string | null;
  personaState?: string | number | null;
  avatar?: AccountAvatar | null;
  currentGame?: Record<string, unknown> | null;

  accountInfo: AccountInfoSummary | null;
  limitations: SteamUser.AccountLimitations | null;
  vac: VacStatus | null;
  licensesCount: number;
  friendsCount: number;
  groupsCount: number;

  // Only present when includeSensitive is requested.
  emailInfo?: { address: string; validated: boolean } | null;
  wallet?: { hasWallet: boolean; currency: number; balance: number } | null;
  tradeURL?: string | null;

  credentialChangeTimes: SteamUser.CredentialChangeTimes | null;
  steamGuardDetails: SteamUser.SteamGuardDetails | null;

  // Only present when the corresponding includeX flag is requested.
  ownedApps?: number[] | null;
  ownedAppsCount?: number;
  friends?: AccountFriend[] | null;
  groups?: Record<string, number> | null;
  ownedProfileItems?: ProfileItems | null;
  equippedProfileItems?: EquippedProfileItems | null;
}
