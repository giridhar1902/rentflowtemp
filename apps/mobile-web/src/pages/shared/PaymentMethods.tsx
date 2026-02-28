import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  SelectField,
  TextField,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { formatINR } from "../../lib/currency";
import {
  api,
  type PaymentMethodRecord,
  type PaymentRecord,
} from "../../lib/api";

const currency = (value: string | number | null | undefined) =>
  formatINR(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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
    if (!session) {
      return;
    }

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
    if (!session) {
      return;
    }
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
    <PageLayout withDockInset className="pb-6" contentClassName="!px-0 !pt-0">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-background px-4 pb-4 pt-5">
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
          <h1 className="text-base font-semibold text-text-primary">
            Payment Methods
          </h1>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForm((value) => !value)}
            leadingIcon={
              <span className="material-symbols-outlined text-[18px]">
                {showForm ? "close" : "add"}
              </span>
            }
          >
            {showForm ? "Close" : "Add"}
          </Button>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        {error && (
          <InstitutionCard>
            <p className="text-sm text-danger">{error}</p>
          </InstitutionCard>
        )}

        {isLoading ? (
          <InstitutionCard>
            <p className="text-sm text-text-secondary">
              Loading payment profile...
            </p>
          </InstitutionCard>
        ) : (
          <>
            {showForm && (
              <InstitutionCard>
                <div className="section-stack">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Add Payment Method
                  </h2>

                  <SelectField
                    label="Type"
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as MethodType)
                    }
                  >
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank</option>
                    <option value="CASH">Cash</option>
                    <option value="OTHER">Other</option>
                  </SelectField>

                  <TextField
                    label="Provider"
                    value={provider}
                    onChange={(event) => setProvider(event.target.value)}
                  />

                  <TextField
                    label="Token / Reference"
                    value={providerRef}
                    onChange={(event) => setProviderRef(event.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="Last 4"
                      maxLength={4}
                      value={last4}
                      onChange={(event) => setLast4(event.target.value)}
                    />
                    <TextField
                      label="Brand"
                      value={brand}
                      onChange={(event) => setBrand(event.target.value)}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(event) => setIsDefault(event.target.checked)}
                    />
                    Set as default method
                  </label>

                  <Button
                    type="button"
                    loading={isSubmitting}
                    onClick={() => void handleCreateMethod()}
                  >
                    Save Method
                  </Button>
                </div>
              </InstitutionCard>
            )}

            <section className="section-stack">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Saved Methods
              </h2>

              {methods.length === 0 ? (
                <InstitutionCard>
                  <p className="text-sm text-text-secondary">
                    No payment methods saved yet.
                  </p>
                </InstitutionCard>
              ) : (
                methods.map((method) => (
                  <InstitutionCard key={method.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {method.brand || method.provider || method.type}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {method.last4
                            ? `•••• ${method.last4}`
                            : "Tokenized method"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {method.isDefault ? (
                          <Badge tone="accent">Default</Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => void handleSetDefault(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                      </div>
                    </div>
                  </InstitutionCard>
                ))
              )}
            </section>

            {defaultMethod && (
              <InstitutionCard accentSpine elevation="raised">
                <div className="section-stack">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                    Default Snapshot
                  </h2>

                  <div className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-4">
                    <p className="font-numeric text-lg font-semibold text-text-primary">
                      {defaultMethod.last4
                        ? `•••• •••• •••• ${defaultMethod.last4}`
                        : "TOKEN REFERENCE"}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="uppercase tracking-[0.08em] text-text-secondary">
                          Account Holder
                        </p>
                        <p className="mt-1 font-medium text-text-primary">
                          {userName}
                        </p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.08em] text-text-secondary">
                          Provider
                        </p>
                        <p className="mt-1 font-medium text-text-primary">
                          {defaultMethod.provider || "Internal"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </InstitutionCard>
            )}

            <section className="section-stack">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                Recent Transactions
              </h2>

              {payments.length === 0 ? (
                <InstitutionCard>
                  <p className="text-sm text-text-secondary">
                    No transactions yet.
                  </p>
                </InstitutionCard>
              ) : (
                <InstitutionCard className="p-0">
                  {payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {payment.provider === "cash"
                            ? "Cash Payment"
                            : "Payment"}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {new Date(payment.createdAt).toLocaleDateString()} •{" "}
                          {payment.status.replaceAll("_", " ")}
                        </p>
                      </div>
                      <p className="font-numeric text-sm font-semibold text-text-primary">
                        {currency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </InstitutionCard>
              )}
            </section>
          </>
        )}
      </main>
    </PageLayout>
  );
};

export default PaymentMethods;
