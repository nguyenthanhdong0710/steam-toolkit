import { Suspense } from "react";

import PrivateGuard from "@/components/guards/PrivateGuard";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={null}>
      <PrivateGuard>{children}</PrivateGuard>
    </Suspense>
  );
}
