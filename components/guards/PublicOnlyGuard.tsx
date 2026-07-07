"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";

import Spinner from "@/components/Spinner";
import PATH from "@/lib/router-path";

type Props = {
  children: ReactNode;
};

const PublicOnlyGuard = ({ children }: Props) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (session && status === "authenticated") {
      let path = PATH.home;

      const returnUrl = searchParams.get("returnUrl");

      if (returnUrl) {
        path = returnUrl;
      }

      const newSearchParams = new URLSearchParams();

      searchParams.entries().forEach(([key, value]) => {
        if (key !== "returnUrl") {
          newSearchParams.append(key, value);
        }
      });

      router.push(`${path}?${newSearchParams.toString()}`);
    }
  }, [session, status, router, pathname, searchParams]);

  if (status === "unauthenticated") {
    return children;
  }

  return <Spinner />;
};

export default PublicOnlyGuard;
