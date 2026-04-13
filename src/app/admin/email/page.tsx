"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  addToast,
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import PageLayout from "@/components/PageLayout";

// --- Constants ---

const CLASSIFICATIONS = ["ROSTER", "SUBSTITUTE"] as const;
const POSITIONS = ["G", "D", "D_F", "F", "F_D"] as const;

// --- GraphQL ---

const LEAGUES_QUERY = gql`
  query GetLeagues {
    leagues {
      id
      name
    }
  }
`;

const SEASONS_QUERY = gql`
  query GetSeasons($leagueId: ID!) {
    seasons(leagueId: $leagueId) {
      id
      name
    }
  }
`;

const TEAMS_QUERY = gql`
  query GetTeams($seasonId: ID!) {
    teams(seasonId: $seasonId) {
      id
      name
    }
  }
`;

const PLAYER_CATALOG_QUERY = gql`
  query PlayerCatalog($filter: PlayerCatalogFilter!) {
    playerCatalog(filter: $filter) {
      id
      position
      classification
      number
      team {
        id
        name
      }
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const SEND_BULK_EMAIL_MUTATION = gql`
  mutation SendBulkEmail($data: SendBulkEmailInput!) {
    sendBulkEmail(data: $data) {
      emailSend {
        id
        recipientCount
      }
      totalSent
      failures {
        email
        error
      }
    }
  }
`;

// --- Types ---

type League = { id: string; name: string };
type Season = { id: string; name: string };
type Team = { id: string; name: string };

type CatalogPlayer = {
  id: string;
  position: string | null;
  classification: string;
  number: number | null;
  team: { id: string; name: string } | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

type SendBulkEmailResult = {
  sendBulkEmail: {
    emailSend: { id: string; recipientCount: number };
    totalSent: number;
    failures: { email: string; error: string }[];
  };
};

// --- Template Variables Reference ---

const TEMPLATE_VARS = [
  "baseUrl",
  "player.id",
  "player.user.firstName",
  "player.user.lastName",
  "player.user.email",
  "player.user.role",
  "player.number",
  "player.position",
  "player.classification",
  "player.team.name",
  "player.team.slug",
  "player.season.name",
  "player.season.slug",
  "player.season.league.name",
  "player.season.league.slug",
];

// --- Component ---

export default function AdminEmailPage() {
  // League / Season selection
  const [selectedLeagueId, setSelectedLeagueId] = useState("");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  // Filters
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [selectedClassifications, setSelectedClassifications] = useState<Set<string>>(new Set());
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [nameSearch, setNameSearch] = useState("");

  // Recipients (set of player emails)
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Email content
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplateRef, setShowTemplateRef] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const confirmModal = useDisclosure();

  // --- Data Fetching ---

  const { data: leaguesData, loading: leaguesLoading } = useQuery<{ leagues: League[] }>(
    LEAGUES_QUERY,
  );

  const { data: seasonsData, loading: seasonsLoading } = useQuery<{ seasons: Season[] }>(
    SEASONS_QUERY,
    { variables: { leagueId: selectedLeagueId }, skip: !selectedLeagueId },
  );

  const { data: teamsData } = useQuery<{ teams: Team[] }>(TEAMS_QUERY, {
    variables: { seasonId: selectedSeasonId },
    skip: !selectedSeasonId,
  });

  // Build filter for playerCatalog
  const catalogFilter = useMemo(() => {
    if (!selectedSeasonId) return null;
    const filter: Record<string, unknown> = { seasonId: selectedSeasonId };
    if (selectedTeamIds.size > 0) filter.teamIds = [...selectedTeamIds];
    if (selectedClassifications.size > 0) filter.classifications = [...selectedClassifications];
    if (selectedPositions.size > 0) filter.positions = [...selectedPositions];
    if (nameSearch.trim()) filter.search = nameSearch.trim();
    return filter;
  }, [selectedSeasonId, selectedTeamIds, selectedClassifications, selectedPositions, nameSearch]);

  const { data: playersData, loading: playersLoading } = useQuery<{
    playerCatalog: CatalogPlayer[];
  }>(PLAYER_CATALOG_QUERY, {
    variables: { filter: catalogFilter },
    skip: !catalogFilter,
  });

  const [sendBulkEmail, { loading: sending }] =
    useMutation<SendBulkEmailResult>(SEND_BULK_EMAIL_MUTATION);

  // --- Derived ---

  const leagues = leaguesData?.leagues ?? [];
  const seasons = seasonsData?.seasons ?? [];
  const teams = teamsData?.teams ?? [];
  const players = useMemo(() => playersData?.playerCatalog ?? [], [playersData]);

  // --- Handlers ---

  const togglePlayer = useCallback((email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      for (const p of players) next.add(p.user.email);
      return next;
    });
  }, [players]);

  const deselectAllVisible = useCallback(() => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      for (const p of players) next.delete(p.user.email);
      return next;
    });
  }, [players]);

  function htmlToPlainText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isFormValid(): boolean {
    return !!(subject.trim() && htmlBody.trim() && selectedEmails.size > 0 && selectedSeasonId);
  }

  async function handleSend() {
    confirmModal.onClose();
    setSubmitError("");

    try {
      const result = await sendBulkEmail({
        variables: {
          data: {
            seasonId: selectedSeasonId,
            recipientEmails: [...selectedEmails],
            subject,
            html: htmlBody,
            text: htmlToPlainText(htmlBody),
          },
        },
      });

      const totalSent = result.data?.sendBulkEmail?.totalSent ?? 0;
      const failures = result.data?.sendBulkEmail?.failures ?? [];

      if (failures.length > 0) {
        addToast({
          title: `Sent ${totalSent} email(s) with ${failures.length} failure(s)`,
          description: failures.map((f: { email: string }) => f.email).join(", "),
          color: "warning",
          severity: "warning",
          timeout: 10000,
        });
      } else {
        addToast({
          title: "Emails sent",
          description: `Successfully sent ${totalSent} email(s).`,
          color: "success",
          severity: "success",
          timeout: 5000,
        });
      }

      setSubject("");
      setHtmlBody("");
      setSelectedEmails(new Set());
    } catch (err) {
      const message =
        err instanceof Error ? err.message.replace(/^[^:]+:\s*/, "") : "Failed to send email";
      setSubmitError(message);
    }
  }

  // --- Render ---

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Email Compose</h1>
        <Button as={Link} href="/admin/email/history" variant="flat" size="sm">
          View History
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {submitError && (
          <div className="border-danger-200/30 bg-danger-50/10 text-danger rounded-lg border p-4">
            {submitError}
          </div>
        )}

        {/* League / Season Selection */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="League"
            placeholder="Select a league"
            isLoading={leaguesLoading}
            selectedKeys={selectedLeagueId ? [selectedLeagueId] : []}
            onSelectionChange={(keys) => {
              const id = [...keys][0]?.toString() ?? "";
              setSelectedLeagueId(id);
              setSelectedSeasonId("");
              setSelectedTeamIds(new Set());
              setSelectedEmails(new Set());
            }}
          >
            {leagues.map((l) => (
              <SelectItem key={l.id}>{l.name}</SelectItem>
            ))}
          </Select>

          <Select
            label="Season"
            placeholder="Select a season"
            isLoading={seasonsLoading}
            isDisabled={!selectedLeagueId}
            selectedKeys={selectedSeasonId ? [selectedSeasonId] : []}
            onSelectionChange={(keys) => {
              const id = [...keys][0]?.toString() ?? "";
              setSelectedSeasonId(id);
              setSelectedTeamIds(new Set());
              setSelectedEmails(new Set());
            }}
          >
            {seasons.map((s) => (
              <SelectItem key={s.id}>{s.name}</SelectItem>
            ))}
          </Select>
        </div>

        {/* Filters — only show after season selected */}
        {selectedSeasonId && (
          <Card>
            <CardBody className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Filter Players</h2>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Teams"
                  placeholder="All teams"
                  selectionMode="multiple"
                  selectedKeys={selectedTeamIds}
                  onSelectionChange={(keys) => setSelectedTeamIds(new Set([...keys].map(String)))}
                >
                  {teams.map((t) => (
                    <SelectItem key={t.id}>{t.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Classifications"
                  placeholder="All classifications"
                  selectionMode="multiple"
                  selectedKeys={selectedClassifications}
                  onSelectionChange={(keys) =>
                    setSelectedClassifications(new Set([...keys].map(String)))
                  }
                >
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c}>{c}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Positions"
                  placeholder="All positions"
                  selectionMode="multiple"
                  selectedKeys={selectedPositions}
                  onSelectionChange={(keys) => setSelectedPositions(new Set([...keys].map(String)))}
                >
                  {POSITIONS.map((p) => (
                    <SelectItem key={p}>{p}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Search by name"
                  placeholder="First or last name"
                  value={nameSearch}
                  onValueChange={setNameSearch}
                />
              </div>
            </CardBody>
          </Card>
        )}

        {/* Player Results */}
        {selectedSeasonId && (
          <Card>
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Players {players.length > 0 && `(${players.length})`}
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onPress={selectAllVisible}>
                    Select All
                  </Button>
                  <Button size="sm" variant="flat" onPress={deselectAllVisible}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {playersLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <DataTable aria-label="Player search results">
                  <TableHeader>
                    <TableColumn width={40}> </TableColumn>
                    <TableColumn>Name</TableColumn>
                    <TableColumn>Email</TableColumn>
                    <TableColumn>Team</TableColumn>
                    <TableColumn>Pos</TableColumn>
                    <TableColumn>Class</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No players match filters">
                    {players.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            isSelected={selectedEmails.has(p.user.email)}
                            onValueChange={() => togglePlayer(p.user.email)}
                          />
                        </TableCell>
                        <TableCell>
                          {[p.user.firstName, p.user.lastName].filter(Boolean).join(" ") || "-"}
                        </TableCell>
                        <TableCell>{p.user.email}</TableCell>
                        <TableCell>{p.team?.name ?? "-"}</TableCell>
                        <TableCell>{p.position ?? "-"}</TableCell>
                        <TableCell>{p.classification}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              )}
            </CardBody>
          </Card>
        )}

        {/* Selected Recipients */}
        {selectedEmails.size > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-default-500 text-sm leading-8">
              Recipients ({selectedEmails.size}):
            </span>
            {[...selectedEmails].map((email) => (
              <Chip key={email} size="sm" variant="flat" onClose={() => togglePlayer(email)}>
                {email}
              </Chip>
            ))}
          </div>
        )}

        {/* Subject */}
        <Input
          label="Subject"
          placeholder="Enter email subject (supports {{player.user.firstName}} etc.)"
          value={subject}
          onValueChange={setSubject}
          isRequired
        />

        {/* HTML Body */}
        <Textarea
          label="Body (HTML)"
          placeholder="<h1>Hello {{player.user.firstName}}!</h1><p>Your team: {{player.team.name}}</p>"
          value={htmlBody}
          onValueChange={setHtmlBody}
          minRows={8}
          isRequired
        />

        {/* Template Variables Reference */}
        <div>
          <Button size="sm" variant="light" onPress={() => setShowTemplateRef(!showTemplateRef)}>
            {showTemplateRef ? "Hide" : "Show"} Template Variables
          </Button>
          {showTemplateRef && (
            <Card className="mt-2">
              <CardBody>
                <p className="text-default-500 mb-2 text-sm">
                  Use these in subject or body. Each recipient gets personalized values.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARS.map((v) => (
                    <Chip key={v} size="sm" variant="flat">
                      {"{{" + v + "}}"}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Preview */}
        <Checkbox isSelected={showPreview} onValueChange={setShowPreview}>
          Show Preview
        </Checkbox>

        {showPreview && (
          <Card>
            <CardBody>
              <h3 className="text-default-500 mb-2 text-sm font-medium">Preview (raw template)</h3>
              <div
                className="prose prose-invert max-w-none rounded-lg bg-white p-4 text-black"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </CardBody>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            color="primary"
            size="lg"
            isDisabled={!isFormValid() || sending}
            isLoading={sending}
            onPress={confirmModal.onOpen}
          >
            Send to {selectedEmails.size} Recipient{selectedEmails.size !== 1 ? "s" : ""}
          </Button>
          <Button as={Link} href="/admin/email/history" variant="light">
            View History
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.isOpen} onOpenChange={confirmModal.onOpenChange}>
        <ModalContent>
          <ModalHeader>Confirm Send</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to send this email to{" "}
              <strong>
                {selectedEmails.size} recipient{selectedEmails.size !== 1 ? "s" : ""}
              </strong>
              ?
            </p>
            <p className="text-default-500 text-sm">
              Subject: <span className="font-medium">{subject}</span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={confirmModal.onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSend} isLoading={sending}>
              Send
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageLayout>
  );
}
