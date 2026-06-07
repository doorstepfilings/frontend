"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { FormSelect, FormTextarea } from "@/components/ui/form-controls";
import { Modal } from "@/components/ui/modal";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { useConfirm } from "@/hooks/use-confirm";
import {
  updateApplicationStatus,
  overrideApplicationStatus,
  updateDocumentStatus,
  uploadDocument,
  deleteDocument,
  fetchAdminApplicationDetail
} from "@/lib/features/admin/admin-slice";
import {
  isClientDocument,
  isInternalDocument,
  getDocumentIcon,
  resolveStorageUrl,
  formatFileSize
} from "@/lib/utils/document-helpers";
import { parseApiError } from "@/lib/utils/error-parser";

interface StatusManagementProps {
  application: any;
}

export const StatusManagement = ({ application }: StatusManagementProps) => {
  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.admin);
  const { confirm, ConfirmDialog } = useConfirm();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocStatusModal, setShowDocStatusModal] = useState(false);

  const [statusForm, setStatusForm] = useState({
    status: "",
    ca_notes: "",
    update_note: "",
    rejection_reason: "",
  });

  const [overrideForm, setOverrideForm] = useState({
    status: application?.status || "",
  });

  const [uploadForm, setUploadForm] = useState({
    document: null as File | null,
    document_type: "internal",
    notes: "",
  });

  const [docStatusForm, setDocStatusForm] = useState({
    docId: null as string | number | null,
    status: "pending",
    remark: "",
  });

  const [activeDocTab, setActiveDocTab] = useState<"client" | "internal">("client");

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm.status) return toast.error("Please select a target status");

    const resultAction = await dispatch(
      updateApplicationStatus({ id: application.id, ...statusForm })
    );
    if (updateApplicationStatus.fulfilled.match(resultAction)) {
      toast.success("Service status updated successfully");
      setShowStatusModal(false);
      dispatch(fetchAdminApplicationDetail(application.id));
    } else {
      toast.error(parseApiError(resultAction.payload));
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.document) return toast.error("Select a source artifact");

    const resultAction = await dispatch(
      uploadDocument({
        applicationId: application.id,
        document: uploadForm.document,
        document_type: uploadForm.document_type,
        notes: uploadForm.notes,
      })
    );

    if (uploadDocument.fulfilled.match(resultAction)) {
      toast.success("Artifact archived successfully");
      setShowUploadModal(false);
      setUploadForm({ document: null, document_type: "internal", notes: "" });
      dispatch(fetchAdminApplicationDetail(application.id));
    } else {
      toast.error(parseApiError(resultAction.payload));
    }
  };

  const handleDocStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docStatusForm.docId) return;

    const resultAction = await dispatch(
      updateDocumentStatus({
        applicationId: application.id,
        docId: docStatusForm.docId,
        status: docStatusForm.status,
        remark: docStatusForm.remark,
      })
    );

    if (updateDocumentStatus.fulfilled.match(resultAction)) {
      toast.success("Artifact status updated");
      setShowDocStatusModal(false);
      dispatch(fetchAdminApplicationDetail(application.id));
    } else {
      toast.error(parseApiError(resultAction.payload));
    }
  };

  const handleDeleteDoc = async (docId: string | number) => {
    const isConfirmed = await confirm({
      title: "Purge Artifact",
      message: "Are you sure you want to permanently delete this document?",
    });

    if (isConfirmed) {
      const resultAction = await dispatch(
        deleteDocument({ applicationId: application.id, docId })
      );
      if (deleteDocument.fulfilled.match(resultAction)) {
        toast.success("Artifact purged");
        dispatch(fetchAdminApplicationDetail(application.id));
      } else {
        toast.error(parseApiError(resultAction.payload));
      }
    }
  };

  const clientDocs = (application.request_documents || []).filter((d: any) => isClientDocument(d));
  const internalDocs = (application.request_documents || []).filter((d: any) => isInternalDocument(d));
  const activeDocs = activeDocTab === "client" ? clientDocs : internalDocs;

  return (
    <div className="space-y-8">
      {/* Workflow Phase Card */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-8">
           <div>
             <h3 className="text-lg font-bold tracking-tight">Workflow Status</h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Management</p>
           </div>
           <StatusIndicator status={application.status} size="lg" />
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setShowStatusModal(true)}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <i className="fas fa-sync-alt"></i>
            Update Status
          </button>
        </div>
      </div>

      {/* Modals */}
      <ConfirmDialog />

      {/* Update Status Modal */}
      <Modal size="lg" isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status">
        <form onSubmit={handleStatusUpdate} className="space-y-6">
          <FormSelect
            label="Target Status"
            value={statusForm.status}
            onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
            options={[
              { value: "applied", label: "Initial Submission" },
              { value: "document_collection", label: "Collect Documents" },
              { value: "under_review", label: "Verification Stage" },
              { value: "update_required", label: "Request Correction" },
              { value: "in_progress", label: "Processing / Dept Submission" },
              { value: "completed", label: "Workflow Finalized" },
              { value: "rejected", label: "Reject Filing" },
              { value: "cancelled", label: "Cancel Application" },
            ]}
          />
          {statusForm.status === "update_required" && (
            <FormTextarea
              label="Update Message (Visible to Client)"
              required
              value={statusForm.update_note}
              onChange={(e) => setStatusForm({ ...statusForm, update_note: e.target.value })}
              placeholder="Explain what needs to be updated..."
            />
          )}
          {statusForm.status === "rejected" && (
            <FormTextarea
              label="Reason for Rejection (Visible to Client)"
              required
              value={statusForm.rejection_reason}
              onChange={(e) => setStatusForm({ ...statusForm, rejection_reason: e.target.value })}
              placeholder="Provide grounds for rejection..."
            />
          )}
          <FormTextarea
            label="Internal Notes (Private)"
            value={statusForm.ca_notes}
            onChange={(e) => setStatusForm({ ...statusForm, ca_notes: e.target.value })}
            placeholder="Notes for the team..."
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 rounded-xl h-11 bg-blue-600 shadow-lg" loading={actionLoading}>Update Status</Button>
          </div>
        </form>
      </Modal>

      {/* Manual Override Removed */}

      {/* Document Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Document">
        <form onSubmit={handleFileUpload} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">File</label>
            <input
              type="file"
              onChange={(e) => setUploadForm({ ...uploadForm, document: e.target.files?.[0] || null })}
              className="w-full text-xs text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:text-slate-900 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
          <FormSelect
            label="Visibility"
            value={uploadForm.document_type}
            onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
            options={[
              { value: "internal", label: "Internal Only" },
              { value: "client", label: "Visible to Client" },
              { value: "certificate", label: "Final Certificate" },
            ]}
          />
          <FormTextarea
            label="Internal Notes"
            value={uploadForm.notes}
            onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
            placeholder="Add context for this document..."
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowUploadModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 rounded-xl h-11 bg-blue-600 shadow-lg" loading={actionLoading}>Upload</Button>
          </div>
        </form>
      </Modal>

      {/* Document Verification Modal */}
      <Modal isOpen={showDocStatusModal} onClose={() => setShowDocStatusModal(false)} title="Verify Document">
        <form onSubmit={handleDocStatusUpdate} className="space-y-6">
          <FormSelect
            label="Status"
            value={docStatusForm.status}
            onChange={(e) => setDocStatusForm({ ...docStatusForm, status: e.target.value })}
            options={[
              { value: "pending", label: "Awaiting Review" },
              { value: "verified", label: "Verified" },
              { value: "rejected", label: "Correction Required" },
              { value: "approved", label: "Approved" },
            ]}
          />
          <FormTextarea
            label="Notes"
            value={docStatusForm.remark}
            onChange={(e) => setDocStatusForm({ ...docStatusForm, remark: e.target.value })}
            placeholder="Reason for this status..."
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setShowDocStatusModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1 rounded-xl h-11 bg-slate-900 shadow-lg" loading={actionLoading}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
