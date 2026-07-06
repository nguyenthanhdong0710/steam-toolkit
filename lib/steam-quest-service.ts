import type SteamUser from "steam-user";

/**
 * Equipping a "Profile Theme" (profile_modifier) item has no RPC anywhere in
 * steam-user's bundled Steam client protocol schema — confirmed by calling the two
 * plausible candidates (Player.SetProfileTheme#1, Player.SetEquippedProfileItemFlags#1)
 * live and having Steam reject both. The real mechanism, reverse-engineered from a
 * captured browser request, is a plain HTTPS call to an undocumented Steam Web API
 * endpoint (IQuestService), authenticated with a community web-session access token
 * (obtainable via steam-user's public webLogOn()). Unlike most Steam WebAPI "Service"
 * methods, this endpoint takes plain named query/form parameters rather than a
 * protobuf-encoded body — confirmed live via https://steamapi.xpaw.me/IQuestService.
 */

function getCommunityAccessToken(client: SteamUser): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out waiting for web session.")),
      10000,
    );

    client.once("webSession", (_sessionId: string, cookies: string[]) => {
      clearTimeout(timeout);

      const raw = cookies.find((c) => c.startsWith("steamLoginSecure="));
      if (!raw) {
        reject(new Error("steamLoginSecure cookie missing from web session."));
        return;
      }

      const value = decodeURIComponent(raw.slice("steamLoginSecure=".length));
      const token = value.split("||")[1];
      if (!token) {
        reject(new Error("Unexpected steamLoginSecure cookie format."));
        return;
      }

      resolve(token);
    });

    client.webLogOn();
  });
}

export async function activateProfileModifierItem(
  client: SteamUser,
  appid: number,
  communityItemId: string,
): Promise<void> {
  const accessToken = await getCommunityAccessToken(client);

  const url = new URL(
    "https://api.steampowered.com/IQuestService/ActivateProfileModifierItem/v1",
  );
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("appid", String(appid));
  url.searchParams.set("communityitemid", communityItemId);
  url.searchParams.set("activate", "true");

  const response = await fetch(url, { method: "POST" });

  if (!response.ok) {
    throw new Error(`ActivateProfileModifierItem failed: ${response.status}`);
  }
}
