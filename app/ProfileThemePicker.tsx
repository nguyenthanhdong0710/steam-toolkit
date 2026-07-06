"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useAccountSummary } from "@/lib/hooks/use-account-summary";
import { useSetProfileModifier } from "@/lib/hooks/use-set-profile-modifier";
import { ProfileItem } from "@/lib/types/steam-account";

const defaultThemes: ProfileItem[] = [
  {
    profile_colors: [
      {
        style_name: "backgroundgradient_left",
        color: "rgba(175, 111, 37, 1)",
      },
      {
        style_name: "backgroundgradient_right",
        color: "rgba(40, 100, 62, 1)",
      },
      {
        style_name: "backgroundgradient_center",
        color: "rgba(175, 143, 30, 0.5)",
      },
      {
        style_name: "showcasegradient_left",
        color: "rgba(194, 129, 34, 1)",
      },
      {
        style_name: "showcasegradient_right",
        color: "rgba(40, 100, 62, 1)",
      },
    ],
    communityitemid: "39015937990",
    image_small:
      "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/items/2459330/2bc9c0f15ca2ae08ffbac84e27dab9194a593993.jpg",
    image_large:
      "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/items/2459330/b64373939c0957792ba184e1f40f629143cca58e.jpg",
    name: "Summer in the City (Day)",
    item_title: "Summer in the City (Day)",
    item_description: "",
    appid: 2459330,
    item_type: 21,
    item_class: 8,
    movie_webm: null,
    movie_mp4: null,
    equipped_flags: null,
    movie_webm_small: null,
    movie_mp4_small: null,
  },
  {
    profile_colors: [
      {
        style_name: "backgroundgradient_left",
        color: "rgba(117, 25, 53, 1)",
      },
      {
        style_name: "backgroundgradient_right",
        color: "rgba(32, 48, 80, 1)",
      },
      {
        style_name: "backgroundgradient_center",
        color: "rgba(130, 64, 11, 0.61)",
      },
      {
        style_name: "showcasegradient_left",
        color: "rgba(154, 35, 71, 1)",
      },
      {
        style_name: "showcasegradient_right",
        color: "rgba(32, 48, 80, 1)",
      },
    ],
    communityitemid: "39015938039",
    image_small:
      "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/items/2459330/903d866345c3400748879efecec186bd288d1984.jpg",
    image_large:
      "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/items/2459330/1eed842b3536eaeec5c9981f813f3f7ad0d9c0ad.jpg",
    name: "Summer in the City (Night)",
    item_title: "Summer in the City (Night)",
    item_description: "",
    appid: 2459330,
    item_type: 26,
    item_class: 8,
    movie_webm: null,
    movie_mp4: null,
    equipped_flags: null,
    movie_webm_small: null,
    movie_mp4_small: null,
  },
];

export default function ProfileThemePicker() {
  const {
    data: account,
    isLoading,
    error,
  } = useAccountSummary({ includeInventory: true });

  const mutation = useSetProfileModifier();

  const themes = account?.ownedProfileItems?.profile_modifiers || defaultThemes;

  return (
    <section className="w-full rounded-none border border-zinc-200 bg-white p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Profile Theme
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pick one of your owned profile themes to equip it.
          </p>
        </div>
        {isLoading ? (
          <span className="text-xs tracking-wide text-zinc-500 uppercase">
            Loading
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      ) : null}

      {mutation.isError ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">
          {mutation.error.message}
        </p>
      ) : null}

      {!error && !isLoading && themes.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No owned profile themes found.
        </p>
      ) : null}

      {themes.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {themes.map((theme) => {
            const isEquipped = Boolean(theme.equipped_flags);
            const isPending =
              mutation.isPending &&
              mutation.variables?.communityItemId === theme.communityitemid;

            return (
              <button
                key={theme.communityitemid}
                type="button"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    appid: theme.appid,
                    communityItemId: theme.communityitemid,
                  })
                }
                className={`flex flex-col items-center gap-2 rounded-none border p-2 text-center transition-colors disabled:opacity-50 ${
                  isEquipped
                    ? "border-zinc-950 dark:border-zinc-50"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                }`}
              >
                {theme.image_small ? (
                  <Image
                    src={theme.image_small}
                    alt={theme.item_title || theme.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 object-contain"
                    unoptimized
                  />
                ) : null}
                <span className="text-xs text-zinc-950 dark:text-zinc-50">
                  {isPending ? "Applying..." : theme.item_title || theme.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {mutation.isSuccess ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Theme equipped.
          <Button variant="link" className="ml-1 h-auto p-0 text-sm" asChild>
            <a
              href="https://steamcommunity.com/my/edit/theme"
              target="_blank"
              rel="noreferrer"
            >
              View on Steam
            </a>
          </Button>
        </p>
      ) : null}
    </section>
  );
}
