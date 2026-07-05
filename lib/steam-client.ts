import SteamUser from "steam-user";

let steamClient: SteamUser | null = null;

function withTimeout<T>(promise: Promise<T>, ms = 5000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then((v) => {
      clearTimeout(t);
      resolve(v);
    }, (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function promisifyPersonas(client: SteamUser, ids: Array<string>) {
  return withTimeout(new Promise<any>((resolve) => {
    (client as any).getPersonas(ids, (personas: any) => resolve(personas));
  }));
}

function promisifyGetTradeURL(client: SteamUser) {
  return withTimeout(new Promise<string>((resolve, reject) => {
    try {
      (client as any).getTradeURL((err: any, resp: any) => {
        if (err) return reject(err);
        if (!resp) return resolve('');
        if (typeof resp === 'string') return resolve(resp);
        if (resp.url) return resolve(resp.url);
        return resolve(String(resp));
      });
    } catch (e) {
      reject(e);
    }
  }));
}

function promisifyGetOwnedApps(client: SteamUser) {
  return withTimeout(new Promise<number[]>((resolve) => {
    (client as any).getOwnedApps((apps: number[]) => resolve(apps));
  }));
}

function promisifyGetCredentialChangeTimes(client: SteamUser) {
  return withTimeout(new Promise<any>((resolve) => {
    (client as any).getCredentialChangeTimes((times: any) => resolve(times));
  }));
}

function promisifyGetSteamGuardDetails(client: SteamUser) {
  return withTimeout(new Promise<any>((resolve) => {
    (client as any).getSteamGuardDetails((details: any) => resolve(details));
  }));
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
  includeVacDetails?: boolean;
}) {
  const opts = {
    includeSensitive: false,
    includeOwnedApps: false,
    includeFriendsList: false,
    includeGroupsList: false,
    includeInventory: false,
    includeVacDetails: false,
    ...(options || {}),
  };

  const client = await getSteamClient();

  const account: any = {};

  try {
    const sidAny: any = client.steamID;
    account.steamID = sidAny && typeof sidAny.getSteamID64 === 'function'
      ? sidAny.getSteamID64()
      : sidAny ? sidAny.toString() : null;
  } catch (e) {
    account.steamID = null;
  }

  try {
    if (account.steamID) {
      const personas = await promisifyPersonas(client, [account.steamID]);
      const p = personas && personas[account.steamID] ? personas[account.steamID] : null;
      if (p) {
        account.personaName = p.player_name || p.persona_name || p.name;
        account.personaState = p.persona_state || p.player_state || null;
        account.avatar = {
          small: p.avatar && p.avatar.small || null,
          medium: p.avatar && p.avatar.medium || null,
          full: p.avatar && p.avatar.full || null,
        };
        account.currentGame = p.game && p.game.appid ? p.game : null;
      }
    }
  } catch (e) {
    // ignore persona failures
  }

  // accountInfo, wallet, limitations, vac, licenses available on client object
  try {
    account.accountInfo = client.accountInfo || null;
  } catch (e) {
    account.accountInfo = null;
  }

  try {
    account.limitations = client.limitations || null;
  } catch (e) {
    account.limitations = null;
  }

  try {
    account.vac = client.vac || null;
  } catch (e) {
    account.vac = null;
  }

  try {
    account.licensesCount = client.licenses ? client.licenses.length : 0;
  } catch (e) {
    account.licensesCount = 0;
  }

  try {
    account.friendsCount = client.myFriends ? Object.keys(client.myFriends).length : 0;
  } catch (e) {
    account.friendsCount = 0;
  }

  try {
    account.groupsCount = client.myGroups ? Object.keys(client.myGroups).length : 0;
  } catch (e) {
    account.groupsCount = 0;
  }

  // sensitive fields
  if (opts.includeSensitive) {
    try {
      account.emailInfo = client.emailInfo || null;
    } catch (e) {
      account.emailInfo = null;
    }

    try {
      account.wallet = client.wallet || null;
    } catch (e) {
      account.wallet = null;
    }

    try {
      account.tradeURL = await promisifyGetTradeURL(client);
    } catch (e) {
      account.tradeURL = null;
    }
  }

  // credential change times
  try {
    account.credentialChangeTimes = await promisifyGetCredentialChangeTimes(client);
  } catch (e) {
    account.credentialChangeTimes = null;
  }

  // steam guard details
  try {
    account.steamGuardDetails = await promisifyGetSteamGuardDetails(client);
  } catch (e) {
    account.steamGuardDetails = null;
  }

  // optionally include heavy lists
  if (opts.includeOwnedApps) {
    try {
      const apps = await promisifyGetOwnedApps(client);
      account.ownedApps = Array.isArray(apps) ? apps : [];
      account.ownedAppsCount = account.ownedApps.length;
    } catch (e) {
      account.ownedApps = null;
      account.ownedAppsCount = account.ownedAppsCount || 0;
    }
  }

  if (opts.includeFriendsList) {
    try {
      const friends: any = client.myFriends || {};
      const keys = Object.keys(friends || {});
      // build brief persona list for friends
      const friendPersonas = await promisifyPersonas(client, keys);
      account.friends = keys.map((k) => ({ steamID: k, personaName: friendPersonas && friendPersonas[k] ? (friendPersonas[k].player_name || friendPersonas[k].persona_name) : null }));
    } catch (e) {
      account.friends = null;
    }
  }

  if (opts.includeGroupsList) {
    try {
      account.groups = client.myGroups || null;
    } catch (e) {
      account.groups = null;
    }
  }

  // inventory/profile items (lightweight summary)
  if (opts.includeInventory) {
    try {
      // @ts-expect-error dynamic
      const items = await withTimeout(new Promise<any>((resolve) => client.getOwnedProfileItems((res: any) => resolve(res))));
      account.ownedProfileItems = items || null;
    } catch (e) {
      account.ownedProfileItems = null;
    }
  }

  return account;
}

function getRefreshTokenLoginDetails(): SteamUser.LogOnDetailsRefresh {
  const refreshToken = process.env.STEAM_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error("Missing STEAM_REFRESH_TOKEN environment variable.");
  }

  return { refreshToken };
}

function getPasswordLoginDetails(twoFactorCode?: string): SteamUser.LogOnDetailsNamePass {
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
      reject(error);
    };

    const handleLoggedOn = () => {
      client.removeListener("error", handleError);
      client.removeListener("steamGuard", handleSteamGuard);
      steamClient = client;
      resolve(client);
    };

    const handleSteamGuard = (domain: string | null, callback: (code: string) => void, lastCodeWrong: boolean) => {
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

export async function createSteamAuthSessionTicket(appId: number) {
  const client = await getSteamClient();
  const { sessionTicket } = await client.createAuthSessionTicket(appId);

  return sessionTicket.toString("hex");
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

    const handleSteamGuard = (domain: string | null, callback: (code: string) => void, lastCodeWrong: boolean) => {
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