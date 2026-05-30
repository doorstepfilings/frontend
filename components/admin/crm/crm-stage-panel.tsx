"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api/admin-api";
import {
  CRM_STAGE_OPTIONS,
  type CrmInquiryRecord,
} from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import {
  CrmInlineSelect,
  CrmInlineTextarea,
  CrmPanel,
  CrmSubmitButton,
} from "./shared";

type CrmStagePanelProps = {
  inquiry: CrmInquiryRecord;
  accountants: Array<{ id: number; name: string }>;
  onRefresh: () => Promise<void> | void;
};

export function CrmStagePanel({
  inquiry,
  accountants,
  onRefresh,
}: CrmStagePanelProps) {
  const [stage, setStage] = useState(String(inquiry.current_stage ?? ""));
  const [accountantId, setAccountantId] = useState(
    inquiry.assigned_accountant?.id ? String(inquiry.assigned_accountant.id) : "",
  );
  const [note, setNote] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const handleStageSave = async () => {
    if (!stage) {
      toast.error("Select a stage before saving.");
      return;
    }

    setSavingStage(true);

    try {
      await adminApi.updateCrmInquiryStage(inquiry.id, {
        current_stage: stage,
        note: note.trim() || null,
      });
      toast.success("CRM stage updated");
      setNote("");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSavingStage(false);
    }
  };

  const handleAssign = async () => {
    setSavingAssignment(true);

    try {
      await adminApi.assignCrmInquiryAccountant(inquiry.id, {
        accountant_id: accountantId ? Number(accountantId) : null,
      });
      toast.success("Assignment updated");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSavingAssignment(false);
    }
  };

  return (
    <CrmPanel title="Workflow Control" eyebrow="Status & Assignment">
      <div className="space-y-5">
        <CrmInlineSelect
          label="Current Stage"
          value={stage}
          onChange={setStage}
          options={CRM_STAGE_OPTIONS}
          placeholder="Select CRM stage"
        />
        <CrmInlineTextarea
          label="Stage Note"
          value={note}
          onChange={setNote}
          placeholder="Add an internal note for this status change"
        />
        <CrmSubmitButton
          label="Save Stage"
          loading={savingStage}
          onClick={handleStageSave}
        />

        <div className="border-t border-slate-100 pt-5">
          <CrmInlineSelect
            label="Assigned Accountant"
            value={accountantId}
            onChange={setAccountantId}
            options={accountants.map((accountant) => ({
              value: accountant.id,
              label: accountant.name,
            }))}
            placeholder="Unassigned"
          />
          <div className="mt-4">
            <CrmSubmitButton
              label="Update Assignment"
              loading={savingAssignment}
              onClick={handleAssign}
            />
          </div>
        </div>
      </div>
    </CrmPanel>
  );
}
