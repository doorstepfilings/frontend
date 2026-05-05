'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { rmApi } from '@/lib/api/rm-api';
import { getStatusColor, getStatusLabel } from '@/lib/status-helpers';
import { buildCollectionKey } from '@/lib/utils/list-keys';

export function RMServiceRequests() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await rmApi.getServiceRequests();
                setRequests(response.data.data);
            } catch (error) {
                console.error('Failed to fetch service requests', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    if (loading) return <div>Loading service requests...</div>;

    return (
        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Service Applications Tracking
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Accountant</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((request, index) => (
                            <TableRow key={buildCollectionKey(request, index, 'rm-request', [request.user?.email, request.service?.name])}>
                                <TableCell>
                                    <div className="font-medium">{request.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{request.user?.email}</div>
                                </TableCell>
                                <TableCell>{request.service?.name}</TableCell>
                                <TableCell>
                                    {request.accountant ? request.accountant.name : <span className="text-muted-foreground italic">None</span>}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(request.status)}>
                                        {getStatusLabel(request.status)}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
