import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  api,
  type ChatMessageRecord,
  type ChatThreadRecord,
  type LeaseRecord,
} from "../../lib/api";
import { AppLayout } from "../../components/layout/AppLayout";

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
    if (!thread || !selfUserId) return null;
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
      if (!session) return;
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
          { limit: 100 },
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
    if (!session || !thread) return;
    let disposed = false;
    const poll = async () => {
      try {
        const since = messages[messages.length - 1]?.createdAt;
        const updates = await api.listChatMessages(
          session.access_token,
          thread.id,
          { since, limit: 100 },
        );
        if (!disposed && updates.length > 0) {
          setMessages((previous) => [...previous, ...updates]);
        }
      } catch {
        // Polling resilient
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
    if (!session || !thread || !draft.trim() || sending) return;
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
    <AppLayout
      title={
        counterpart
          ? `${counterpart.firstName ?? ""} ${counterpart.lastName ?? ""}`.trim() ||
            counterpart.email ||
            "Conversation"
          : "Conversation"
      }
      subtitle={
        lease
          ? `${lease.unit?.name ?? "Unit"} - ${lease.property?.name ?? "Property"}`
          : undefined
      }
      showBackButton={true}
      fixedHeight={true}
      rightAction={
        <button
          onClick={() => navigate("/lease")}
          className="flex h-9 shrink-0 items-center justify-center rounded-full bg-white border px-3 gap-1.5 text-[12px] font-bold text-text-secondary  hover:text-primary transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px] text-inherit">
            description
          </span>
          <span className="text-[12px] font-bold">Doc</span>
        </button>
      }
      className="flex-1 flex flex-col pb-2"
    >
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {error && (
          <div className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 shrink-0 shadow-sm">
            <p className="text-[13px] font-bold text-danger">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="size-8 rounded-full border-2 border-t-primary animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 mt-10">
            <div className="flex size-16 items-center justify-center rounded-full bg-white border mb-4 shadow-inner">
              <span className="material-symbols-outlined text-[32px] text-text-secondary opacity-50">
                chat
              </span>
            </div>
            <p className="text-[16px] font-black text-text-primary mb-2">
              No messages yet
            </p>
            <p className="text-[13px] font-bold text-text-secondary">
              Start the conversation about your lease or property.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message, idx) => {
              const isMine = message.senderId === selfUserId;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showTime =
                !prevMsg ||
                new Date(message.createdAt).getTime() -
                  new Date(prevMsg.createdAt).getTime() >
                  10 * 60000; // 10 mins

              return (
                <div key={message.id} className="flex flex-col">
                  {showTime && (
                    <div className="flex justify-center my-4">
                      <span className="bg-white border text-text-secondary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[80%] rounded-[20px] px-4 py-3 transform transition-transform text-[14px] leading-relaxed shadow-sm ${
                        isMine
                          ? "bg-gradient-to-br from-[#F5A623] to-[#F5A623] text-white rounded-br-[6px] font-medium p-[1px]" // Using p-[1px] and inner div for border effect if needed, but simple gradient is better
                          : "bg-white border text-text-primary rounded-bl-[6px]  font-medium"
                      }`}
                    >
                      {/* Inner content wrapper just in case we used gradient border hack, but we didn't */}
                      <div className="relative z-10">
                        <p className="whitespace-pre-wrap word-break">
                          {message.content}
                        </p>
                        <div
                          className={`flex items-center gap-1 mt-1 justify-end ${isMine ? "text-white/80" : "text-text-secondary"}`}
                        >
                          <span className="text-[9px] font-bold uppercase tracking-widest">
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                          {isMine && (
                            <span className="material-symbols-outlined text-[10px]">
                              done_all
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={listBottomRef} className="h-4 shrink-0" />
      </div>

      <footer className="shrink-0 border-t bg-white backdrop-blur-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)] px-4 py-3 relative z-20">
        <div className="flex items-end gap-3 max-w-[500px] mx-auto">
          <div className="relative flex-1 bg-white border rounded-[24px] shadow-inner flex items-center transition-all focus-within:bg-white/80 focus-within:ring-1 focus-within:ring-primary">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent text-text-primary font-bold text-[14px] px-4 py-3.5 outline-none placeholder:text-text-secondary/50 max-h-[120px] min-h-[50px] resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
          </div>

          <button
            type="button"
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#F5A623] to-[#F5A623] text-white shadow-[0_4px_15px_rgba(245,166,35,0.3)] hover:scale-105 active:scale-[0.95] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 disabled:shadow-none"
            disabled={!draft.trim() || sending}
            onClick={() => void sendMessage()}
          >
            {sending ? (
              <div className="size-5 rounded-full border-2 border-[rgba(27,43,94,0.06)] border-t-white animate-spin"></div>
            ) : (
              <span className="material-symbols-outlined text-[24px]">
                send
              </span>
            )}
          </button>
        </div>
      </footer>
    </AppLayout>
  );
};

export default Chat;
