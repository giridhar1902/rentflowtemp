import React, { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "./ui/Button";

interface UpgradeModalDetail {
  error: string;
  message: string;
  upgradeUrl: string;
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradeModalDetail | null>(null);

  useEffect(() => {
    const handleUpgradeRequired = (e: Event) => {
      const customEvent = e as CustomEvent<UpgradeModalDetail>;
      setDetail(customEvent.detail);
      setOpen(true);
    };

    window.addEventListener("upgrade-required", handleUpgradeRequired);
    return () =>
      window.removeEventListener("upgrade-required", handleUpgradeRequired);
  }, []);

  if (!detail) return null;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-background text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <SparklesIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-bold leading-6"
                    >
                      Upgrade Your Plan
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        {detail.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6">
                  {/* Essential Tier */}
                  <div className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">NRI Essential</h3>
                      <span className="font-bold text-xl">
                        ₹1,499
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </span>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {[
                        "Dual currency dashboard",
                        "TDS compliance automation",
                        "Property health reports",
                        "Timezone-aware reminders",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6 bg-transparent border border-primary text-primary hover:bg-primary/5"
                      onClick={() => (window.location.href = detail.upgradeUrl)}
                    >
                      Upgrade to Essential
                    </Button>
                  </div>

                  {/* Premium Tier */}
                  <div className="rounded-xl border bg-primary/5 p-5 shadow-sm ring-1 ring-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                      Recommended
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <h3 className="font-semibold text-lg text-primary">
                        NRI Premium
                      </h3>
                      <span className="font-bold text-xl">
                        ₹2,999
                        <span className="text-sm font-normal text-muted-foreground">
                          /mo
                        </span>
                      </span>
                    </div>
                    <p className="text-sm mt-3 font-medium text-foreground">
                      Everything in Essential, plus:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {[
                        "TDS PDF reports for CA",
                        "Legal notice automation",
                        "Power of Attorney access",
                        "Daily WhatsApp morning digest",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => (window.location.href = detail.upgradeUrl)}
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
