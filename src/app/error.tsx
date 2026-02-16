"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      {error.digest && <p className="text-default-500 text-sm">Error ID: {error.digest}</p>}
      <Button color="primary" onPress={reset}>
        Try again
      </Button>
    </div>
  );
}
