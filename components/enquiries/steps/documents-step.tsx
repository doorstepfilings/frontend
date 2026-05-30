"use client";

import { DocumentUpload } from "@/components/ui/document-upload";
import {
  CRM_DOCUMENT_TYPE_OPTIONS,
  type CrmInquiryDocumentInput,
} from "@/lib/constants/crm";
import { SectionHeader } from "./shared";

type DocumentsStepProps = {
  documents: CrmInquiryDocumentInput[];
  fileErrors: Record<number, string>;
  onFileChange: (index: number, file: File | null) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onTypeChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
};

export function DocumentsStep({
  documents,
  fileErrors,
  onFileChange,
  onAddRow,
  onRemoveRow,
  onTypeChange,
  onNotesChange,
}: DocumentsStepProps) {
  return (
    <div>
      <SectionHeader
        eyebrow="Step 4"
        title="Attach supporting documents"
        description="Upload whatever is already available. The inquiry can move ahead even if the customer is still gathering files, and your team can request anything missing during verification."
      />

      <DocumentUpload
        rows={documents}
        fileErrors={fileErrors}
        onFileChange={onFileChange}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onTypeChange={onTypeChange}
        onNotesChange={onNotesChange}
        onSubmit={() => undefined}
        title="Consultation Documents"
        description="Accepted examples include PAN, Aadhaar, GST Certificate, Form 16, financial statements, and other supporting files."
        submitLabel="Continue"
        availableTypes={CRM_DOCUMENT_TYPE_OPTIONS}
        maxFileSizeMB={5}
        showSubmitButton={false}
      />
    </div>
  );
}
