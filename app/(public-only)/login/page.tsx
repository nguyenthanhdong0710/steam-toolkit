"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthenticationIdentity from "@/lib/hooks/use-authentication-identity";

export default function LoginPage() {
  // ** Hooks
  const { credentialId, loginBiometrics, loginPassword } =
    useAuthenticationIdentity();

  // ** States
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [biometricsSubmitting, setBiometricsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setError(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(false);
  };

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setPasswordSubmitting(true);
      const res = await loginPassword(username, password);

      if (res?.error) {
        setError(true);
      } else {
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleLoginBiometric = async () => {
    try {
      setBiometricsSubmitting(true);
      const res = await loginBiometrics();

      if (res?.error) {
        setError(true);
      } else {
        setError(false);
      }
    } catch {
      setError(true);
    } finally {
      setBiometricsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex w-full max-w-[400px] flex-col gap-6 px-5">
        <Card className="pt-5 pb-10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Steam Toolkit Login</CardTitle>
            {error && (
              <CardDescription className="text-red-400">
                User not found
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginPassword}>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="username"
                    placeholder="username"
                    autoCapitalize="false"
                    required
                    value={username}
                    onChange={handleUsernameChange}
                  />
                </div>
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={biometricsSubmitting}
                >
                  {passwordSubmitting && <Loader2 className="animate-spin" />}
                  Login
                </Button>
                {process.env.NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE === "true" &&
                  !!credentialId && (
                    <>
                      <div className="border" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoginBiometric}
                        className="w-full"
                        disabled={passwordSubmitting}
                      >
                        {biometricsSubmitting && (
                          <Loader2 className="animate-spin" />
                        )}
                        Login via Passkey
                      </Button>
                    </>
                  )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
