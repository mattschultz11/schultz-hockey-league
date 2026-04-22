"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-2xl font-bold">Page not found</h2>
      <p className="text-default-600">The page you are looking for does not exist.</p>
      <Button as={Link} color="primary" href="/">
        Go home
      </Button>
    </div>
  );
}
