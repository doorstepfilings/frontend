"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { adminApi } from "@/lib/api/admin-api";
import type { CrmInquiryRecord } from "@/lib/constants/crm";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatDateTime } from "@/lib/utils/formatters";
import {
  CrmEmptyState,
  CrmInlineTextarea,
  CrmPanel,
  CrmSubmitButton,
} from "./shared";

type CrmNotesPanelProps = {
  inquiry: CrmInquiryRecord;
  onRefresh: () => Promise<void> | void;
};

export function CrmNotesPanel({
  inquiry,
  onRefresh,
}: CrmNotesPanelProps) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error("Write a note before saving.");
      return;
    }

    setSaving(true);

    try {
      await adminApi.createCrmInquiryNote(inquiry.id, {
        note: note.trim(),
      });
      toast.success("Internal note added");
      setNote("");
      await onRefresh();
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CrmPanel title="Internal Notes" eyebrow="Consultation Timeline">
      <div className="space-y-5">
        <CrmInlineTextarea
          label="Add Note"
          value={note}
          onChange={setNote}
          placeholder="Capture discovery points, missing documents, client expectations, or internal follow-up."
        />
        <CrmSubmitButton
          label="Add Note"
          loading={saving}
          onClick={handleSave}
        />

        {inquiry.notes.length === 0 ? (
          <CrmEmptyState
            icon="fa-notes-medical"
            title="No internal notes yet"
            description="Start the consultation trail by recording the first verification or follow-up note."
          />
        ) : (
          <div className="space-y-4">
            {inquiry.notes.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 px-5 py-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    {entry.author?.name || "Internal Team"}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {formatDateTime(entry.created_at ?? undefined)}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {entry.note}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </CrmPanel>
  );
}
