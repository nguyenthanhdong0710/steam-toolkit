"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApiRequestError } from "@/lib/api-client";
import { useAccountSummary } from "@/lib/hooks/use-account-summary";

function formatValue(value: unknown) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

const DetailItem = ({
  label,
  value,
  fullscreenAllow = false,
}: {
  label: string;
  value: string;
  fullscreenAllow?: boolean;
}) => {
  return (
    <div className="rounded-none border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-2">
        <dt className="text-xs tracking-wide text-zinc-500 uppercase">
          {label}
        </dt>
        {fullscreenAllow ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Expand ${label}`}
              >
                <Maximize2 />
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100%-2rem)] max-w-3xl flex-col">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
              </DialogHeader>
              <dd className="min-h-0 overflow-y-auto text-sm wrap-break-word whitespace-pre-wrap text-zinc-950 dark:text-zinc-50">
                {value}
              </dd>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
      <dd className="mt-1 max-h-25 overflow-y-auto text-sm wrap-break-word whitespace-pre-wrap text-zinc-950 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
};

export default function AccountDetailsCard() {
  const [authPopupDismissed, setAuthPopupDismissed] = useState(false);

  const {
    data: account,
    isLoading,
    error,
  } = useAccountSummary({
    includeSensitive: true,
    includeOwnedApps: true,
    includeFriendsList: true,
    includeGroupsList: true,
    includeInventory: true,
  });

  const needsRefreshToken =
    error instanceof ApiRequestError && error.needsRefreshToken;
  const authPopupOpen = needsRefreshToken && !authPopupDismissed;
  const displayError = error && !needsRefreshToken ? error.message : null;

  return (
    <>
      <AlertDialog
        open={authPopupOpen}
        onOpenChange={(open) => {
          if (!open) setAuthPopupDismissed(true);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Steam session needs a new refresh token
            </AlertDialogTitle>
            <AlertDialogDescription>
              The account API could not authenticate with the current Steam
              refresh token. Please create a new refresh token and update your
              environment before trying again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => setAuthPopupDismissed(true)}>
                Got it
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="w-full rounded-none border border-zinc-200 bg-white p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Details
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Loaded automatically after the component mounts.
            </p>
          </div>
          {isLoading ? (
            <span className="text-xs tracking-wide text-zinc-500 uppercase">
              Loading
            </span>
          ) : null}
        </div>

        {displayError ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            {displayError}
          </p>
        ) : null}

        {!displayError && account ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Steam ID" value={formatValue(account.steamID)} />
            <DetailItem
              label="Nickname"
              value={formatValue(account.personaName)}
            />
            <DetailItem
              label="Account Name"
              value={formatValue(account.accountInfo?.name)}
            />
            <DetailItem
              label="Licenses"
              value={formatValue(account.licensesCount)}
            />
            <DetailItem
              label="Friends"
              value={formatValue(account.friendsCount)}
            />
            <DetailItem
              label="Groups"
              value={formatValue(account.groupsCount)}
            />
            <DetailItem label="Wallet" value={formatValue(account.wallet)} />
            <DetailItem
              label="Raw JSON"
              value={formatValue(account)}
              fullscreenAllow
            />
          </dl>
        ) : null}
      </section>
    </>
  );
}
