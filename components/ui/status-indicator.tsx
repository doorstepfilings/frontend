"use client";

import React from 'react';

const STATUS_CONFIG: any = {
    in_cart: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'In Cart' },
    draft: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Draft' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Awaiting Review' },
    under_review: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Verifying' },
    update_required: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Action Required' },
    approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Approved' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Rejected' },
    cancelled: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Cancelled' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    paid: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Paid' },
    applied: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Applied' },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Processing' },
    document_collection: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Doc Collection' },
    submitted_to_ca: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Forwarded to CA' },
};

export function StatusIndicator({ status, size = 'sm', className = '' }: { status: string, size?: 'sm' | 'lg', className?: string }) {
    const config = STATUS_CONFIG[status?.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: status };
    const sizeClasses = size === 'lg' ? 'px-4 py-2 text-xs' : 'px-2.5 py-1 text-[9px]';

    return (
        <span className={`inline-flex items-center gap-2 rounded-full font-black uppercase tracking-widest border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${['pending', 'under_review', 'in_progress'].includes(status) ? 'animate-pulse' : ''}`} />
            {config.label}
        </span>
    );
}
