import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import {
  api,
  type PaymentMethodRecord,
  type PaymentRecord,
} from "../../lib/api";

const currency = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

type MethodType = "CARD" | "BANK_TRANSFER" | "CASH" | "OTHER";

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile } = useAuth();

  const [methods, setMethods] = useState<PaymentMethodRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState<MethodType>("CARD");
  const [provider, setProvider] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [last4, setLast4] = useState("");
  const [brand, setBrand] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const userName =
    `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() ||
    profile?.email ||
    "Account User";

  const loadData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [nextMethods, nextPayments] = await Promise.all([
        api.listPaymentMethods(session.access_token),
        api.listPayments(session.access_token),
      ]);
      setMethods(nextMethods);
      setPayments(nextPayments);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load payment methods",
      );
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    setType("CARD");
    setProvider("");
    setProviderRef("");
    setLast4("");
    setBrand("");
    setIsDefault(false);
  };

  const handleCreateMethod = async () => {
    if (!session) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createPaymentMethod(session.access_token, {
        type,
        provider: provider || undefined,
        providerRef: providerRef || undefined,
        last4: last4 || undefined,
        brand: brand || undefined,
        isDefault,
      });
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to save payment method",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!session) return;
    setError(null);
    try {
      await api.setDefaultPaymentMethod(session.access_token, methodId);
      await loadData();
    } catch (defaultError) {
      setError(
        defaultError instanceof Error
          ? defaultError.message
          : "Failed to set default method",
      );
    }
  };

  const defaultMethod =
    methods.find((method) => method.isDefault) ?? methods[0];

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 border border-white/50 text-text-secondary hover:text-primary hover:bg-white/80 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>
          <h1 className="text-[17px] font-black tracking-tight text-text-primary">
            Payment Methods
          </h1>
          <button
            onClick={() => setShowForm((value) => !value)}
            className="flex h-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-3 text-[12px] font-bold text-primary uppercase tracking-wider hover:bg-primary/20 transition-colors shadow-sm"
          >
            {showForm ? "Cancel" : "Add New"}
          </button>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        {error && (
          <div className="rounded-[16px] border border-danger/20 bg-danger/10 p-4 mb-2 shadow-sm">
            <p className="text-[13px] font-bold text-danger">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="size-8 rounded-full border-2 border-white/50 border-t-primary animate-spin"></div>
          </div>
        ) : (
          <>
            {showForm && (
              <div className="rounded-[24px] border border-white/50 bg-white/40 backdrop-blur-[20px] p-6 shadow-sm flex flex-col gap-4">
                <h2 className="text-[14px] font-black text-text-primary mb-2">
                  Add New Payment Method
                </h2>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
                    Type
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as MethodType)}
                      className="w-full appearance-none rounded-[16px] border border-white/50 bg-white/50 py-3.5 pl-4 pr-10 text-[14px] font-bold text-text-primary outline-none focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner transition-all"
                    >
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
                    Provider{" "}
                    <span className="lowercase normal-case opacity-80">
                      (Optional)
                    </span>
                  </label>
                  <input
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-[16px] border border-white/50 bg-white/50 py-3.5 px-4 text-[14px] font-bold text-text-primary outline-none focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
                    Token / Reference
                  </label>
                  <input
                    value={providerRef}
                    onChange={(e) => setProviderRef(e.target.value)}
                    className="w-full rounded-[16px] border border-white/50 bg-white/50 py-3.5 px-4 text-[14px] font-bold text-text-primary outline-none focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
                      Last 4 Digits
                    </label>
                    <input
                      maxLength={4}
                      value={last4}
                      onChange={(e) => setLast4(e.target.value)}
                      className="w-full rounded-[16px] border border-white/50 bg-white/50 py-3.5 px-4 text-[14px] font-bold text-text-primary outline-none focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary pl-1">
                      Brand
                    </label>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Visa, MC"
                      className="w-full rounded-[16px] border border-white/50 bg-white/50 py-3.5 px-4 text-[14px] font-bold text-text-primary outline-none focus:border-primary focus:bg-white/80 focus:ring-1 focus:ring-primary shadow-inner transition-all placeholder:text-text-secondary/50"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer mt-2 w-max group">
                  <div
                    className={`flex size-5 items-center justify-center rounded-[6px] border shadow-sm transition-colors ${isDefault ? "bg-primary border-primary" : "bg-white/60 border-white/50 group-hover:border-primary/50 shadow-inner"}`}
                  >
                    {isDefault && (
                      <span className="material-symbols-outlined text-[14px] text-white">
                        check
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="hidden"
                  />
                  <span className="text-[13px] font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                    Set as default payment method
                  </span>
                </label>

                <button
                  disabled={isSubmitting}
                  onClick={() => void handleCreateMethod()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] py-3.5 text-[14px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_4px_15px_rgba(255,122,0,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100"
                >
                  {isSubmitting ? (
                    <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  ) : (
                    "Save Method"
                  )}
                </button>
              </div>
            )}

            {defaultMethod && !showForm && (
              <div className="relative overflow-hidden rounded-[24px] border border-primary/30 bg-primary/5 p-6 shadow-sm backdrop-blur-[20px] group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <span className="material-symbols-outlined text-[100px] text-primary">
                    payments
                  </span>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#FF9A3D] to-[#FF7A00]"></div>

                <h2 className="text-[11px] font-black uppercase tracking-[0.1em] text-primary mb-4 pl-1">
                  Default Snapshot
                </h2>

                <div className="relative rounded-[20px] border border-white/50 bg-white/60 backdrop-blur-md shadow-inner p-5 pb-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[24px] font-black text-text-primary font-numeric tracking-[0.15em]">
                      {defaultMethod.last4
                        ? `**** **** **** ${defaultMethod.last4}`
                        : "TOKEN REFERENCE"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary opacity-80 mb-1">
                        Account Holder
                      </p>
                      <p className="text-[12px] font-bold text-text-primary truncate">
                        {userName.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-text-secondary opacity-80 mb-1">
                        Provider
                      </p>
                      <p className="text-[12px] font-bold text-text-primary uppercase">
                        {defaultMethod.provider || "Internal"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                Saved Methods
              </h2>

              {methods.length === 0 ? (
                <div className="rounded-[20px] border border-white/50 bg-white/40 shadow-sm p-6 text-center">
                  <p className="text-[13px] text-text-secondary font-bold">
                    No payment methods saved yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {methods.map((method) => (
                    <div
                      key={method.id}
                      className="rounded-[20px] border border-white/50 bg-white/40 backdrop-blur-[20px] shadow-sm p-4 flex items-center justify-between gap-3 group transition-all hover:bg-white/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner text-text-secondary group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                          <span className="material-symbols-outlined text-[20px]">
                            {method.type === "CARD"
                              ? "credit_card"
                              : method.type === "BANK_TRANSFER"
                                ? "account_balance"
                                : method.type === "CASH"
                                  ? "payments"
                                  : "account_balance_wallet"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-text-primary mb-0.5 group-hover:text-primary transition-colors">
                            {method.brand || method.provider || method.type}
                          </p>
                          <p className="text-[12px] font-bold text-text-secondary">
                            {method.last4
                              ? `•••• ${method.last4}`
                              : "Tokenized method"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {method.isDefault ? (
                          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Default
                          </span>
                        ) : (
                          <button
                            onClick={() => void handleSetDefault(method.id)}
                            className="bg-white/60 text-text-secondary border border-white/50 shadow-sm hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-3 py-1.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98]"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3 mt-2">
              <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary pl-1">
                Recent Transactions
              </h2>

              {payments.length === 0 ? (
                <div className="rounded-[20px] border border-white/50 bg-white/40 shadow-sm p-6 text-center">
                  <p className="text-[13px] text-text-secondary font-bold">
                    No transactions yet.
                  </p>
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/50 bg-white/40 backdrop-blur-[20px] overflow-hidden shadow-sm">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 border-b border-white/40 px-5 py-4 last:border-b-0 group hover:bg-white/60 active:bg-white/70 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white/60 border border-white/50 shadow-inner text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            {payment.provider === "cash"
                              ? "attach_money"
                              : "receipt_long"}
                          </span>
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-text-primary group-hover:text-primary transition-colors mb-0.5">
                            {payment.provider === "cash"
                              ? "Cash Payment"
                              : "Digital Payment"}
                          </p>
                          <p className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                            <span>
                              {new Date(payment.createdAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                            <span className="size-1 rounded-full bg-text-secondary/50"></span>
                            <span className="uppercase tracking-wider">
                              {payment.status.replaceAll("_", " ")}
                            </span>
                          </p>
                        </div>
                      </div>
                      <p className="font-numeric text-[16px] font-black text-text-primary shrink-0 tracking-tight group-hover:text-primary transition-colors">
                        {currency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PaymentMethods;
