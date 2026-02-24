"use client";

import { Card, CardBody } from "@heroui/react";

type SeasonInfoProps = {
  info: string;
};

export default function SeasonInfo({ info }: SeasonInfoProps) {
  return (
    <Card isBlurred className="dark:bg-secondary/10 mb-8 border-none" shadow="sm">
      <CardBody className="p-5">
        <div dangerouslySetInnerHTML={{ __html: info }} />
      </CardBody>
    </Card>
  );
}
