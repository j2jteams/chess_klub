'use client';

import { useProtectedRoute } from '@/lib/hooks/useProtectedRoute';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useProtectedRoute();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}