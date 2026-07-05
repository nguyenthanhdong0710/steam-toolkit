import SteamUser from "steam-user";

let steamClient: SteamUser | null = null;

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