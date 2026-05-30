'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getStatusColor, getStatusLabel } from '@/lib/status-helpers';

import { RequestDetailModal } from '@/components/accountant/request-detail-modal';

async function fetchAssignedServices() {
    const response = await api.get('/accountant/service-requests');
    return response.data;
}

export function AssignedServices() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const reloadServices = async () => {
        try {
            const nextServices = await fetchAssignedServices();
            setServices(nextServices);
        } catch (error) {
            console.error('Failed to fetch assigned services', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadServices = async () => {
            try {
                const nextServices = await fetchAssignedServices();
                if (!cancelled) {
                    setServices(nextServices);
                }
            } catch (error) {
                console.error('Failed to fetch assigned services', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadServices();

        return () => {
            cancelled = true;
        };
    }, []);

    const openDetails = (service: any) => {
        setSelectedRequest(service);
        setIsModalOpen(true);
    };

    if (loading) return <div>Loading assigned services...</div>;

    return (
        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Assigned Service Applications
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell>
                                    <div className="font-medium">{service.user?.name}</div>
                                    <div className="text-xs text-muted-foreground">{service.user?.email}</div>
                                </TableCell>
                                <TableCell>{service.service?.name}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(service.status)}>
                                        {getStatusLabel(service.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => openDetails(service)}>
                                        View Details & Review
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <RequestDetailModal 
                request={selectedRequest}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUpdate={() => {
                    void reloadServices();
                    setIsModalOpen(false);
                }}
            />
        </Card>
    );
}

