"use client";

import React from 'react';

const STATUS_CONFIG: any = {
    in_cart: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: 'In Cart' },
    draft: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Draft' },
    applied: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Initial Submission' },
    payment_pending: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Payment Pending' },
    document_collection: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Docs Needed' },
    under_review: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Verifying' },
    update_required: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Correction Required' },
    in_progress: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Processing' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Cancelled' },

};

export function StatusIndicator({ status, size = 'sm', className = '' }: { status: string, size?: 'sm' | 'lg', className?: string }) {
    const config = STATUS_CONFIG[status?.toLowerCase()] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: status };
    const sizeClasses = size === 'lg' ? 'px-4 py-2 text-xs' : 'px-2.5 py-1 text-[9px]';

    return (
        <span className={`inline-flex items-center gap-2 rounded-full font-black uppercase tracking-widest border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${['pending', 'under_review', 'in_progress', 'payment_pending'].includes(status?.toLowerCase()) ? 'animate-pulse' : ''}`} />
            {config.label}
        </span>
    );
}
