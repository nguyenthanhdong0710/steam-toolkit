"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";

import Spinner from "@/components/Spinner";
import PATH from "@/lib/router-path";

type Props = {
  children: ReactNode;
};

const PrivateGuard = ({ children }: Props) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!session && status === "unauthenticated") {
      const newSearchParams = new URLSearchParams(searchParams);

      if (pathname !== "/") {
        newSearchParams.set("returnUrl", pathname);
      }

      router.replace(`${PATH.login}?${newSearchParams.toString()}`);
    }
  }, [session, status, router, pathname, searchParams]);

  if (status === "authenticated") {
    return children;
  }

  return <Spinner />;
};

export default PrivateGuard;
