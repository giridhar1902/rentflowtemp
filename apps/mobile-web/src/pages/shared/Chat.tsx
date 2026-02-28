import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  TextareaField,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type ChatMessageRecord,
  type ChatThreadRecord,
  type LeaseRecord,
} from "../../lib/api";

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [lease, setLease] = useState<LeaseRecord | null>(null);
  const [thread, setThread] = useState<ChatThreadRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBottomRef = useRef<HTMLDivElement | null>(null);

  const selfUserId = profile?.id;

  const counterpart = useMemo(() => {
    if (!thread || !selfUserId) {
      return null;
    }

    const member = thread.participants.find(
      (participant) => participant.userId !== selfUserId,
    );

    return member?.user ?? null;
  }, [thread, selfUserId]);

  useEffect(() => {
    listBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const initialize = async () => {
      if (!session) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const leases = await api.listLeases(session.access_token);
        const selectedLease =
          leases.find((item) => item.status === "ACTIVE") ?? leases[0] ?? null;

        if (!selectedLease) {
          setError("No lease available for chat.");
          setLoading(false);
          return;
        }

        setLease(selectedLease);

        const ensuredThread = await api.ensureLeaseThread(
          session.access_token,
          selectedLease.id,
        );
        setThread(ensuredThread);

        const initialMessages = await api.listChatMessages(
          session.access_token,
          ensuredThread.id,
          {
            limit: 100,
          },
        );
        setMessages(initialMessages);
      } catch (chatError) {
        setError(
          chatError instanceof Error
            ? chatError.message
            : "Unable to load chat",
        );
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [session]);

  useEffect(() => {
    if (!session || !thread) {
      return;
    }

    let disposed = false;

    const poll = async () => {
      try {
        const since = messages[messages.length - 1]?.createdAt;
        const updates = await api.listChatMessages(
          session.access_token,
          thread.id,
          {
            since,
            limit: 100,
          },
        );

        if (!disposed && updates.length > 0) {
          setMessages((previous) => [...previous, ...updates]);
        }
      } catch {
        // Polling should be resilient; ignore transient errors.
      }
    };

    const interval = setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [session, thread, messages]);

  const sendMessage = async () => {
    if (!session || !thread || !draft.trim() || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const sent = await api.sendChatMessage(session.access_token, thread.id, {
        content: draft.trim(),
      });
      setMessages((previous) => [...previous, sent]);
      setDraft("");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout
      className="h-screen"
      contentClassName="!px-0 !pt-0 !pb-0 h-full"
    >
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                arrow_back_ios_new
              </span>
            }
          >
            Back
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-base font-semibold text-text-primary">
              {counterpart
                ? `${counterpart.firstName ?? ""} ${counterpart.lastName ?? ""}`.trim() ||
                  counterpart.email ||
                  "Conversation"
                : "Conversation"}
            </h1>
            <p className="mt-1 text-xs text-text-secondary">
              {lease?.unit?.name ?? "Unit"} -{" "}
              {lease?.property?.name ?? "Property"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/lease")}
          >
            Doc
          </Button>
        </div>
      </header>

      <main className="section-stack flex-1 overflow-y-auto bg-background px-4 py-4">
        {error && (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        )}

        {loading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">Loading chat...</p>
          </InstitutionCard>
        ) : messages.length === 0 ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              No messages yet. Start the conversation.
            </p>
          </InstitutionCard>
        ) : (
          messages.map((message) => {
            const isMine = message.senderId === selfUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[var(--radius-control)] px-3 py-2 text-sm ${
                    isMine
                      ? "bg-primary text-[var(--color-accent-contrast)]"
                      : "bg-surface-subtle text-text-primary"
                  }`}
                >
                  <p>{message.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${isMine ? "text-white/75" : "text-text-secondary"}`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={listBottomRef} />
      </main>

      <footer className="sticky bottom-0 border-t border-border-subtle bg-background px-4 pb-[calc(var(--layout-safe-area-bottom)+0.75rem)] pt-3">
        <div className="flex items-end gap-2">
          <TextareaField
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="min-h-[2.75rem] resize-none"
            containerClassName="flex-1"
          />

          <Button
            type="button"
            className="h-11 w-11 px-0"
            disabled={!draft.trim() || sending}
            loading={sending}
            onClick={() => void sendMessage()}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                arrow_upward
              </span>
            }
          >
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </footer>
    </PageLayout>
  );
};

export default Chat;
