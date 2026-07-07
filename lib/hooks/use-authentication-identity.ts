"use client";

import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import { signIn } from "next-auth/react";

import { fetchJson } from "@/lib/api-client";
import KeyStore from "@/lib/key-store";

export default function useAuthenticationIdentity() {
  const loginPassword = async (username: string, password: string) => {
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (
      res?.ok &&
      process.env.NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE === "true"
    ) {
      registerBiometric(username);
    }

    return res;
  };

  const loginBiometrics = async (inputCredentialId?: string) => {
    // verify user by stored credential and create temporary challenge
    const options = await authenticationBiometricChallenge(inputCredentialId);

    // start authentication credential from user with credential id and temporary challenge
    const credential = await startAuthentication({ optionsJSON: options });

    const res = await signIn("credentials", {
      credentialId: credential.id,
      redirect: false,
    });

    return res;
  };

  const registerBiometric = async (username: string) => {
    // create new credential for this user and create temporary challenge
    const options = await fetchJson<PublicKeyCredentialCreationOptionsJSON>(
      "/api/auth/register-biometric-challenge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          credentialId: localStorage.getItem(KeyStore.credentialId) || "",
        }),
      },
    );

    // start registration credential for this user with temporary challenge
    const credential = await startRegistration({ optionsJSON: options });

    // verify challenge with temporary challenge in DB
    const { success, credentialId } = await fetchJson<{
      success: boolean;
      credentialId: string;
    }>("/api/auth/verify-and-create-biometric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, credential }),
    });

    // if success, store credentialId to storage
    if (success) {
      localStorage.setItem(KeyStore.credentialId, credentialId); // Base64 string
    }
  };

  const verifyBiometrics = async () => {
    const options = await authenticationBiometricChallenge();

    const credential = await startAuthentication({ optionsJSON: options });

    const isValid = await fetchJson<boolean>("/api/auth/verify-credential", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId: credential.id }),
    });

    return isValid;
  };

  const verifyPassword = async (password: string) => {
    const isValidPassword = await fetchJson<boolean>(
      "/api/me/verify-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    return isValidPassword;
  };

  const authenticationBiometricChallenge = async (cid?: string) => {
    const credentialId = cid || localStorage.getItem(KeyStore.credentialId);

    if (!credentialId) return Promise.reject("No Credential ID found");

    return fetchJson<PublicKeyCredentialRequestOptionsJSON>(
      "/api/auth/authentication-biometric-challenge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      },
    );
  };

  return {
    credentialId:
      typeof window !== "undefined"
        ? localStorage.getItem(KeyStore.credentialId)
        : null,
    loginPassword,
    loginBiometrics,
    verifyBiometrics,
    verifyPassword,
  };
}
