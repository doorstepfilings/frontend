'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { getStatusColor, getStatusLabel } from '@/lib/status-helpers';
import { FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { LogoLoader } from '@/components/ui/logo-loader';
import { toast } from 'react-hot-toast';

type MyServiceListItem = {
    id: number;
    status: string;
    created_at?: string | null;
    certificate_url?: string | null;
    service?: {
        name?: string | null;
    } | null;
};

export function MyServicesList() {
    const [services, setServices] = useState<MyServiceListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadMyServices = async () => {
            try {
                const response = await apiClient.get('/service/my-services');
                if (!cancelled) {
                    setServices(response.data?.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch your services', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadMyServices();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this application?')) return;
        
        setDeletingId(id);
        try {
            await apiClient.delete(`/service/my-services/${id}`);
            toast.success('Application cancelled successfully');
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to cancel application');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-12"><LogoLoader size={48} /></div>;

    if (services.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-slate-50">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">You haven&apos;t applied for any services yet.</p>
                    <Link href="/services" className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
                        Browse Services
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Your Active Applications</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead>Date Applied</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">
                                    {service.service?.name || 'Service Application'}
                                </TableCell>
                                <TableCell>
                                    {service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(service.status)}>
                                        {getStatusLabel(service.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {service.certificate_url ? (
                                            <a
                                                href={service.certificate_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Certificate
                                            </a>
                                        ) : (
                                            <Link
                                                href={`/dashboard/services/${service.id}`}
                                                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                                            >
                                                Track Flow
                                            </Link>
                                        )}
                                        
                                        {['applied', 'in_cart'].includes(service.status) && (
                                            <button
                                                onClick={() => handleDelete(service.id)}
                                                disabled={deletingId === service.id}
                                                className="inline-flex items-center rounded-md p-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                                                title="Cancel Application"
                                            >
                                                {deletingId === service.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
