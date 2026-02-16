import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner label="Loading..." />
    </div>
  );
}
