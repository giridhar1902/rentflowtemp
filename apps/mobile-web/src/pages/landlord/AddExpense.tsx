import React from "react";
import { useNavigate } from "react-router-dom";
import { PageLayout } from "../../components/layout";
import {
  Badge,
  Button,
  InstitutionCard,
  SelectField,
  TextField,
} from "../../components/ui";

const AddExpense: React.FC = () => {
  const navigate = useNavigate();

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
            Add Expense
          </h1>
          <Badge tone="neutral">Draft</Badge>
        </div>
      </header>

      <main className="section-stack px-4 pb-8 pt-4">
        <InstitutionCard accentSpine elevation="raised">
          <TextField
            label="Expense Amount"
            type="number"
            placeholder="0.00"
            className="h-14 font-numeric text-2xl font-semibold"
          />
        </InstitutionCard>

        <InstitutionCard>
          <SelectField
            label="Property"
            defaultValue="Sunset Heights Apartment 4B"
          >
            <option>Sunset Heights Apartment 4B</option>
            <option>Riverside Villa Unit 12</option>
          </SelectField>
        </InstitutionCard>

        <InstitutionCard>
          <div className="section-stack">
            <p className="text-sm font-medium text-text-primary">Category</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Button type="button" size="sm" className="shrink-0">
                Maintenance
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                Utilities
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
              >
                Tax
              </Button>
            </div>
          </div>
        </InstitutionCard>

        <InstitutionCard interactive className="cursor-pointer">
          <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] border border-dashed border-border-subtle bg-surface-subtle px-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-[var(--radius-pill)] bg-surface">
              <span className="material-symbols-outlined text-primary">
                photo_camera
              </span>
            </div>
            <p className="text-sm font-semibold text-text-primary">
              Upload Receipt
            </p>
            <p className="text-xs text-text-secondary">
              Snap a photo or browse files
            </p>
          </div>
        </InstitutionCard>
      </main>

      <div className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-[430px] border-t border-border-subtle bg-background px-4 pb-[calc(var(--layout-safe-area-bottom)+1rem)] pt-3">
        <Button
          type="button"
          className="w-full"
          size="lg"
          leadingIcon={
            <span className="material-symbols-outlined text-[18px]">save</span>
          }
        >
          Save Expense
        </Button>
      </div>
    </PageLayout>
  );
};

export default AddExpense;
