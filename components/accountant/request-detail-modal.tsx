'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from '@/lib/status-helpers';
import { accountantApi } from '@/lib/api/accountant-api';
import { CheckCircle, XCircle, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestDetailModalProps {
    request: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function RequestDetailModal({ request, isOpen, onClose, onUpdate }: RequestDetailModalProps) {
    const [submitting, setSubmitting] = useState(false);

    if (!request) return null;

    const handleVerifyDoc = async (docId: number, status: 'verified' | 'rejected', notes?: string) => {
        setSubmitting(true);
        try {
            await accountantApi.verifyDocument(request.id, docId, status, notes);
            onUpdate();
        } catch (error) {
            alert('Failed to verify document');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusTransition = async (status: string) => {
        setSubmitting(true);
        try {
            await accountantApi.updateStatus(request.id, { status });
            onUpdate();
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center pr-8">
                        <span>Application Details: {request.service?.name}</span>
                        <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Client Information</h3>
                            <p className="font-medium text-lg">{request.user?.name}</p>
                            <p className="text-sm text-slate-600">{request.user?.email}</p>
                            <p className="text-sm text-slate-600">{request.user?.mobileNumber}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Application Data</h3>
                            <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                                {JSON.stringify(request.formData, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Documents</h3>
                        <div className="space-y-2">
                            {request.requestDocuments?.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="text-slate-400" size={20} />
                                        <div>
                                            <p className="text-sm font-medium">{doc.documentName || doc.fileName}</p>
                                            <Badge variant="outline" className="text-[10px] h-4">
                                                {doc.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <a
                                            href={`http://localhost:4000/storage/${doc.filePath}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-blue-500")}
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-emerald-600"
                                            disabled={submitting || doc.status === 'verified'}
                                            onClick={() => handleVerifyDoc(doc.id, 'verified')}
                                        >
                                            <CheckCircle size={16} />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-rose-500"
                                            disabled={submitting || doc.status === 'rejected'}
                                            onClick={() => {
                                                const reason = prompt('Reason for correction:');
                                                if (reason) handleVerifyDoc(doc.id, 'rejected', reason);
                                            }}
                                        >
                                            <XCircle size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t space-y-2">
                            <h3 className="text-lg font-bold">Actions</h3>
                            <div className="flex flex-wrap gap-2">
                                {request.status === 'applied' && (
                                    <Button onClick={() => handleStatusTransition('under_review')} disabled={submitting}>
                                        Mark Under Review
                                    </Button>
                                )}
                                {request.status === 'under_review' && (
                                    <>
                                        <Button onClick={() => handleStatusTransition('in_progress')} disabled={submitting}>
                                            Move to In Progress
                                        </Button>
                                        <Button variant="outline" className="text-rose-600 border-rose-200 bg-rose-50" onClick={() => handleStatusTransition('update_required')} disabled={submitting}>
                                            Request Update
                                        </Button>
                                    </>
                                )}
                                {request.status === 'in_progress' && (
                                    <Button onClick={() => handleStatusTransition('submitted_to_ca')} disabled={submitting}>
                                        Submit to CA
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
