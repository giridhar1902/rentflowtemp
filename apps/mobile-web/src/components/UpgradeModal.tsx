import React, { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "./ui/Button";

interface UpgradeModalDetail {
  error: string;
  message: string;
  upgradeUrl: string;
}

const DomvioIcon = () => (
  <svg width="32" height="32" viewBox="0 0 56 56" fill="none" aria-hidden>
    <path
      d="M10 4 H28 C42 4 52 14 52 28 C52 42 42 52 28 52 H10 Z"
      fill="#1B2B5E"
    />
    <rect
      x="10"
      y="4"
      width="6"
      height="48"
      rx="3"
      fill="#F5A623"
      opacity="0.9"
    />
    <circle cx="32" cy="24" r="7" fill="#F5A623" />
    <path d="M28.5 30 L28.5 39 Q32 42 35.5 39 L35.5 30 Z" fill="#F5A623" />
    <circle cx="32" cy="24" r="3.5" fill="#1B2B5E" />
  </svg>
);

const CheckItem = ({ text, gold }: { text: string; gold?: boolean }) => (
  <li className="flex items-center gap-2.5 text-sm">
    <span
      className="material-symbols-outlined text-[16px] shrink-0"
      style={{ color: gold ? "#F5A623" : "#16A34A" }}
    >
      check_circle
    </span>
    <span style={{ color: "#5A6A8A" }}>{text}</span>
  </li>
);

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradeModalDetail | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<UpgradeModalDetail>;
      setDetail(ev.detail);
      setOpen(true);
    };
    window.addEventListener("upgrade-required", handler);
    return () => window.removeEventListener("upgrade-required", handler);
  }, []);

  if (!detail) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0"
            style={{ background: "rgba(27,43,94,0.45)" }}
          />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95"
            >
              <Dialog.Panel
                className="relative w-full sm:max-w-lg rounded-2xl overflow-hidden"
                style={{
                  background: "#FFFFFF",
                  boxShadow: "0 24px 64px rgba(27,43,94,0.2)",
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}
              >
                {/* Navy header */}
                <div
                  className="px-6 pt-8 pb-6 text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1B2B5E 0%, #2D4A9E 100%)",
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  >
                    <DomvioIcon />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-white"
                  >
                    Upgrade to NRI Mode
                  </Dialog.Title>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {detail.message}
                  </p>
                </div>

                {/* Tiers */}
                <div className="p-6 flex flex-col gap-4">
                  {/* Essential */}
                  <div
                    className="rounded-xl p-5"
                    style={{
                      border: "1.5px solid rgba(27,43,94,0.1)",
                      background: "#F8F9FA",
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="font-bold text-base"
                        style={{ color: "#1B2B5E" }}
                      >
                        NRI Essential
                      </h3>
                      <span
                        className="font-extrabold text-lg"
                        style={{ color: "#1B2B5E" }}
                      >
                        ₹1,499
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#5A6A8A" }}
                        >
                          /mo
                        </span>
                      </span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[
                        "Dual currency dashboard",
                        "TDS compliance automation",
                        "Property health reports",
                        "Timezone-aware reminders",
                      ].map((f) => (
                        <CheckItem key={f} text={f} />
                      ))}
                    </ul>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        (window.location.href = detail!.upgradeUrl)
                      }
                    >
                      Upgrade to Essential
                    </Button>
                  </div>

                  {/* Premium */}
                  <div
                    className="rounded-xl p-5 relative overflow-hidden"
                    style={{
                      border: "2px solid #F5A623",
                      background: "#FFFBF2",
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl"
                      style={{ background: "#F5A623", color: "#FFFFFF" }}
                    >
                      Recommended
                    </div>
                    <div className="flex items-center justify-between mb-3 mt-1">
                      <h3
                        className="font-bold text-base"
                        style={{ color: "#1B2B5E" }}
                      >
                        NRI Premium
                      </h3>
                      <span
                        className="font-extrabold text-lg"
                        style={{ color: "#1B2B5E" }}
                      >
                        ₹2,999
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#5A6A8A" }}
                        >
                          /mo
                        </span>
                      </span>
                    </div>
                    <p
                      className="text-xs font-semibold mb-2"
                      style={{ color: "#5A6A8A" }}
                    >
                      Everything in Essential, plus:
                    </p>
                    <ul className="space-y-2 mb-4">
                      {[
                        "TDS PDF reports for CA",
                        "Legal notice automation",
                        "Power of Attorney access",
                        "Daily WhatsApp morning digest",
                      ].map((f) => (
                        <CheckItem key={f} text={f} gold />
                      ))}
                    </ul>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() =>
                        (window.location.href = detail!.upgradeUrl)
                      }
                    >
                      Upgrade to Premium
                    </Button>
                  </div>

                  {/* Dismiss */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full py-3 text-sm font-semibold transition-colors"
                    style={{ color: "#8A9AB8" }}
                  >
                    Maybe later
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
