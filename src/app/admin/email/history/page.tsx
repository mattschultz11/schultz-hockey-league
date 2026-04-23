"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Button,
  Chip,
  Spinner,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import DataTable from "@/components/DataTable";
import PageLayout from "@/components/PageLayout";

const EMAIL_HISTORY_QUERY = gql`
  query EmailHistory {
    emailHistory {
      id
      createdAt
      subject
      recipientCount
      status
      sentAt
    }
  }
`;

type EmailSendSummary = {
  id: string;
  createdAt: string;
  subject: string;
  recipientCount: number;
  status: string;
  sentAt: string | null;
};

type EmailHistoryResult = {
  emailHistory: EmailSendSummary[];
};

function statusColor(status: string) {
  switch (status) {
    case "sent":
      return "success";
    case "partial_failure":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "default";
  }
}

function formatStatus(status: string) {
  switch (status) {
    case "sent":
      return "Sent";
    case "partial_failure":
      return "Partial Failure";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export default function EmailHistoryPage() {
  const router = useRouter();
  const { data, loading, error } = useQuery<EmailHistoryResult>(EMAIL_HISTORY_QUERY);

  if (loading && !data) {
    return (
      <PageLayout>
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
          Failed to load email history: {error.message}
        </div>
      </PageLayout>
    );
  }

  const emails = data?.emailHistory ?? [];

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Email History</h1>
        <Button as={Link} href="/admin/email" color="primary">
          Compose New
        </Button>
      </div>

      <DataTable aria-label="Email history">
        <TableHeader>
          <TableColumn>Date</TableColumn>
          <TableColumn>Subject</TableColumn>
          <TableColumn>Recipients</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No emails sent yet">
          {emails.map((email) => (
            <TableRow
              key={email.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/email/history/${email.id}`)}
            >
              <TableCell>
                {new Date(email.sentAt ?? email.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{email.subject}</TableCell>
              <TableCell>{email.recipientCount}</TableCell>
              <TableCell>
                <Chip size="sm" color={statusColor(email.status)} variant="flat">
                  {formatStatus(email.status)}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </DataTable>
    </PageLayout>
  );
}
