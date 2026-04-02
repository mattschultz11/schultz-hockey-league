"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";

import DataTable from "@/components/DataTable";
import PageLayout from "@/components/PageLayout";

const EMAIL_SEND_DETAIL_QUERY = gql`
  query EmailSendDetail($id: ID!) {
    emailSend(id: $id) {
      id
      subject
      htmlBody
      recipientCount
      status
      sentAt
      recipients {
        id
        address
        name
        status
      }
    }
  }
`;

type Recipient = {
  id: string;
  address: string;
  name: string | null;
  status: string;
};

type EmailSendDetail = {
  id: string;
  subject: string;
  htmlBody: string;
  recipientCount: number;
  status: string;
  sentAt: string | null;
  recipients: Recipient[];
};

type EmailSendDetailResult = {
  emailSend: EmailSendDetail;
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

function recipientStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
      return "danger";
    default:
      return "default";
  }
}

function formatRecipientStatus(status: string) {
  switch (status) {
    case "delivered":
      return "Delivered";
    case "queued":
      return "Queued";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EmailSendDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<EmailSendDetailResult>(EMAIL_SEND_DETAIL_QUERY, {
    variables: { id: params.id },
    skip: !params.id,
  });

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
          Failed to load email details: {error.message}
        </div>
      </PageLayout>
    );
  }

  const email = data?.emailSend;
  if (!email) return null;

  return (
    <PageLayout>
      <div>
        <Button as={Link} href="/admin/email/history" variant="light" size="sm" className="mb-4">
          &larr; Back to History
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-white">{email.subject}</h1>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          <div className="text-default-500 flex flex-wrap gap-4 text-sm">
            {email.sentAt && <span>Sent: {formatDateTime(email.sentAt)}</span>}
            <span>
              Status:{" "}
              <Chip size="sm" color={statusColor(email.status)} variant="flat">
                {formatStatus(email.status)}
              </Chip>
            </span>
            <span>Recipients: {email.recipientCount}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Body Preview</h2>
        </CardHeader>
        <CardBody>
          <div
            className="bg-default-100 rounded-lg p-4"
            dangerouslySetInnerHTML={{ __html: email.htmlBody }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Recipients</h2>
        </CardHeader>
        <CardBody>
          <DataTable aria-label="Recipients">
            <TableHeader>
              <TableColumn>Email</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No recipients">
              {email.recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell>{recipient.address}</TableCell>
                  <TableCell>{recipient.name ?? "-"}</TableCell>
                  <TableCell>
                    <Chip size="sm" color={recipientStatusColor(recipient.status)} variant="flat">
                      {formatRecipientStatus(recipient.status)}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </CardBody>
      </Card>
    </PageLayout>
  );
}
