import SteamUser from "steam-user";

import { activateProfileModifierItem } from "@/lib/steam-quest-service";
import type { AccountSummary } from "@/lib/types/steam-account";

let steamClient: SteamUser | null = null;

function withTimeout<T>(promise: Promise<T>, ms = 5000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

interface PersonaData {
  player_name?: string;
  persona_name?: string;
  name?: string;
  persona_state?: number;
  player_state?: number;
  avatar?: { small?: string; medium?: string; full?: string };
  game?: { appid?: number; [key: string]: unknown };
}

function promisifyPersonas(client: SteamUser, ids: Array<string>) {
  return withTimeout(
    new Promise<Record<string, PersonaData>>((resolve, reject) => {
      client.getPersonas(ids, (err, personas) =>
        err ? reject(err) : resolve(personas),
      );
    }),
  );
}

/**
 * Returns a normalized account summary. Options control inclusion of sensitive or heavy fields.
 */
export async function getAccountSummary(options?: {
  includeSensitive?: boolean;
  includeOwnedApps?: boolean;
  includeFriendsList?: boolean;
  includeGroupsList?: boolean;
  includeInventory?: boolean;
}): Promise<AccountSummary> {
  const opts = {
    includeSensitive: false,
    includeOwnedApps: false,
    includeFriendsList: false,
    includeGroupsList: false,
    includeInventory: false,
    ...(options || {}),
  };

  const client = await getSteamClient();

  const account = {} as AccountSummary;

  try {
    account.steamID = client.steamID ? client.steamID.getSteamID64() : null;
  } catch {
    account.steamID = null;
  }

  try {
    if (account.steamID) {
      const personas = await promisifyPersonas(client, [account.steamID]);
      const p =
        personas && personas[account.steamID]
          ? personas[account.steamID]
          : null;
      if (p) {
        account.personaName = p.player_name || p.persona_name || p.name;
        account.personaState = p.persona_state || p.player_state || null;
        account.avatar = {
          small: (p.avatar && p.avatar.small) || null,
          medium: (p.avatar && p.avatar.medium) || null,
          full: (p.avatar && p.avatar.full) || null,
        };
        account.currentGame = p.game && p.game.appid ? p.game : null;
      }
    }
  } catch {
    // ignore persona failures
  }

  // accountInfo, wallet, limitations, vac, licenses available on client object
  try {
    account.accountInfo = client.accountInfo || null;
  } catch {
    account.accountInfo = null;
  }

  try {
    account.limitations = client.limitations || null;
  } catch {
    account.limitations = null;
  }

  try {
    // Override: the installed steam-user typings omit `ranges`, which is present at runtime.
    account.vac = (client.vac as AccountSummary["vac"]) || null;
  } catch {
    account.vac = null;
  }

  try {
    account.licensesCount = client.licenses ? client.licenses.length : 0;
  } catch {
    account.licensesCount = 0;
  }

  try {
    account.friendsCount = client.myFriends
      ? Object.keys(client.myFriends).length
      : 0;
  } catch {
    account.friendsCount = 0;
  }

  try {
    account.groupsCount = client.myGroups
      ? Object.keys(client.myGroups).length
      : 0;
  } catch {
    account.groupsCount = 0;
  }

  // sensitive fields
  if (opts.includeSensitive) {
    try {
      account.emailInfo = client.emailInfo || null;
    } catch {
      account.emailInfo = null;
    }

    try {
      account.wallet = client.wallet || null;
    } catch {
      account.wallet = null;
    }

    try {
      const tradeURL = await withTimeout(client.getTradeURL());
      account.tradeURL = tradeURL?.url ?? null;
    } catch {
      account.tradeURL = null;
    }
  }

  // credential change times
  try {
    account.credentialChangeTimes = await withTimeout(
      client.getCredentialChangeTimes(),
    );
  } catch {
    account.credentialChangeTimes = null;
  }

  // steam guard details
  try {
    account.steamGuardDetails = await withTimeout(
      client.getSteamGuardDetails(),
    );
  } catch {
    account.steamGuardDetails = null;
  }

  // optionally include heavy lists
  if (opts.includeOwnedApps) {
    try {
      // TODO: enable via `new SteamUser({ enablePicsCache: true })` to stop this
      // throwing "PICS cache is not enabled." — out of scope for this refactor.
      const apps = client.getOwnedApps();
      account.ownedApps = Array.isArray(apps) ? apps : [];
      account.ownedAppsCount = account.ownedApps.length;
    } catch {
      account.ownedApps = null;
      account.ownedAppsCount = account.ownedAppsCount || 0;
    }
  }

  if (opts.includeFriendsList) {
    try {
      const friends = client.myFriends || {};
      const keys = Object.keys(friends);
      // build brief persona list for friends
      const friendPersonas = await promisifyPersonas(client, keys);
      account.friends = keys.map((k) => ({
        steamID: k,
        personaName:
          friendPersonas && friendPersonas[k]
            ? friendPersonas[k].player_name ||
              friendPersonas[k].persona_name ||
              null
            : null,
      }));
    } catch {
      account.friends = null;
    }
  }

  if (opts.includeGroupsList) {
    try {
      account.groups = client.myGroups || null;
    } catch {
      account.groups = null;
    }
  }

  // inventory/profile items (lightweight summary)
  if (opts.includeInventory) {
    try {
      const items = await withTimeout(
        client.getOwnedProfileItems({ language: "english" }),
      );
      // Override: the installed steam-user typings omit several profile-item
      // categories and fields that are present at runtime (see lib/types/steam-account.ts).
      account.ownedProfileItems =
        (items as unknown as AccountSummary["ownedProfileItems"]) || null;
    } catch {
      account.ownedProfileItems = null;
    }

    try {
      if (!account.steamID) {
        throw new Error("steamID unavailable");
      }
      const equipped = await withTimeout(
        client.getEquippedProfileItems(account.steamID, {
          language: "english",
        }),
      );
      // Override: the installed steam-user typings mistype this as array-shaped
      // ProfileItems (see lib/types/steam-account.ts).
      account.equippedProfileItems =
        (equipped as unknown as AccountSummary["equippedProfileItems"]) ||
        null;
    } catch {
      account.equippedProfileItems = null;
    }
  }

  return account;
}

function getRefreshTokenLoginDetails(): SteamUser.LogOnDetailsRefresh {
  const refreshToken = process.env.STEAM_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error("STEAM_REFRESH_TOKEN_MISSING");
  }

  return { refreshToken };
}

function getPasswordLoginDetails(
  twoFactorCode?: string,
): SteamUser.LogOnDetailsNamePass {
  const accountName = process.env.STEAM_ACCOUNT_NAME;
  const password = process.env.STEAM_PASSWORD;

  if (!accountName || !password) {
    throw new Error(
      "Set STEAM_REFRESH_TOKEN, or STEAM_ACCOUNT_NAME and STEAM_PASSWORD for password-based login.",
    );
  }

  return {
    accountName,
    password,
    ...(twoFactorCode ? { twoFactorCode } : {}),
  };
}

function loginSteamClient(details: SteamUser.LogOnDetailsRefresh) {
  return new Promise<SteamUser>((resolve, reject) => {
    const client = new SteamUser();

    const handleError = (error: Error) => {
      client.removeListener("loggedOn", handleLoggedOn);
      client.removeListener("error", handleError);
      client.removeListener("steamGuard", handleSteamGuard);
      // This login path is only ever used with a refresh token, so any
      // non-steamGuard failure here means the refresh token itself is bad.
      reject(new Error("STEAM_REFRESH_TOKEN_INVALID", { cause: error }));
    };

    const handleLoggedOn = () => {
      client.removeListener("error", handleError);
      client.removeListener("steamGuard", handleSteamGuard);
      steamClient = client;
      resolve(client);
    };

    const handleSteamGuard = (
      domain: string | null,
      callback: (code: string) => void,
      lastCodeWrong: boolean,
    ) => {
      void domain;
      void callback;
      void lastCodeWrong;
      client.removeListener("error", handleError);
      client.removeListener("loggedOn", handleLoggedOn);
      reject(new Error("STEAM_GUARD_REQUIRED"));
    };

    client.once("steamGuard", handleSteamGuard);
    client.once("error", handleError);
    client.once("loggedOn", handleLoggedOn);
    client.logOn(details);
  });
}

export async function getSteamClient() {
  if (steamClient) {
    return steamClient;
  }

  return loginSteamClient(getRefreshTokenLoginDetails());
}

export async function setSteamProfileModifier(
  appid: number,
  communityItemId: string,
): Promise<void> {
  const client = await getSteamClient();
  await activateProfileModifierItem(client, appid, communityItemId);
}

export async function createSteamRefreshToken(twoFactorCode?: string) {
  return new Promise<string>((resolve, reject) => {
    const client = new SteamUser();
    const loginDetails = getPasswordLoginDetails(twoFactorCode);

    const handleError = (error: Error) => {
      client.removeListener("loggedOn", handleLoggedOn);
      client.removeListener("refreshToken", handleRefreshToken);
      client.removeListener("steamGuard", handleSteamGuard);
      reject(error);
    };

    const handleLoggedOn = () => {
      client.removeListener("error", handleError);
    };

    const handleRefreshToken = (refreshToken: string) => {
      client.removeListener("error", handleError);
      client.removeListener("steamGuard", handleSteamGuard);
      steamClient = client;
      console.log("Steam refresh token:", refreshToken);
      resolve(refreshToken);
    };

    const handleSteamGuard = (
      domain: string | null,
      callback: (code: string) => void,
      lastCodeWrong: boolean,
    ) => {
      void domain;
      void lastCodeWrong;
      if (!twoFactorCode) {
        client.removeListener("error", handleError);
        client.removeListener("loggedOn", handleLoggedOn);
        client.removeListener("refreshToken", handleRefreshToken);
        reject(new Error("STEAM_GUARD_REQUIRED"));
        return;
      }

      callback(twoFactorCode);
    };

    client.once("steamGuard", handleSteamGuard);
    client.once("error", handleError);
    client.once("loggedOn", handleLoggedOn);
    client.once("refreshToken", handleRefreshToken);
    client.logOn(loginDetails);
  });
}
