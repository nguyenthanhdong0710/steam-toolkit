import { Suspense } from "react";

import PublicOnlyGuard from "@/components/guards/PublicOnlyGuard";

export default function PublicOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <PublicOnlyGuard>{children}</PublicOnlyGuard>
    </Suspense>
  );
}
