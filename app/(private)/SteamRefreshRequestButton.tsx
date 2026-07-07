"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthenticationIdentity from "@/lib/hooks/use-authentication-identity";
import { useSteamAction } from "@/lib/hooks/use-steam-action";
import type {
  RefreshTokenRequestBody,
  RefreshTokenResponse,
} from "@/lib/types/steam-api";

export default function SteamRefreshRequestButton() {
  // ** Hooks
  const { credentialId, verifyBiometrics, verifyPassword } =
    useAuthenticationIdentity();
  const mutation = useSteamAction<
    RefreshTokenRequestBody,
    RefreshTokenResponse
  >("/api/steam/refresh-token");

  // ** States
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(false);
  };

  const runRefreshRequest = () => {
    mutation.mutate(
      {},
      {
        onSuccess: (data) => {
          window.prompt("Copy your Steam refresh token", data.refreshToken);
        },
      },
    );
  };

  const handleButtonClick = () => {
    if (credentialId) {
      handleVerifyBiometric();
    } else {
      setIsOpen(true);
    }
  };

  const handleVerifyBiometric = async () => {
    try {
      setBiometricLoading(true);
      const isValid = await verifyBiometrics();

      if (isValid) {
        runRefreshRequest();
      } else {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const isValidPassword = await verifyPassword(password);

      if (isValidPassword) {
        runRefreshRequest();
        setIsOpen(false);
        setPassword("");
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const label = biometricLoading
    ? "Verifying passkey..."
    : mutation.isPending
      ? "Requesting Steam refresh token..."
      : mutation.isError
        ? mutation.error.message
        : mutation.isSuccess
          ? "Steam refresh token created."
          : "Request Refresh Token";

  return (
    <>
      <Button onClick={handleButtonClick} disabled={biometricLoading}>
        {label}
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="flex !max-w-[300px] flex-col">
          <DialogHeader>
            <DialogTitle>Verify Password</DialogTitle>
            <DialogDescription>
              Enter your password to verify your identity.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyPassword}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="*****"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              {error ? (
                <p className="flex h-[36px] items-center justify-center text-xs text-red-400">
                  Password incorrect
                </p>
              ) : (
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="animate-spin" />}
                  Verify
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
