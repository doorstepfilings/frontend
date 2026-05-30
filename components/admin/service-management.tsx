'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

import { ServiceModal } from '@/components/admin/service-modal';

async function fetchServiceManagementData() {
    const [servicesRes, categoriesRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/categories')
    ]);

    return {
        categories: categoriesRes.data,
        services: servicesRes.data,
    };
}

export function ServiceManagement() {
    const [services, setServices] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refreshData = async () => {
        setLoading(true);
        try {
            const data = await fetchServiceManagementData();
            setServices(data.services);
            setCategories(data.categories);
        } catch (error) {
            console.error('Failed to fetch services data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const loadInitialData = async () => {
            try {
                const data = await fetchServiceManagementData();
                if (cancelled) {
                    return;
                }
                setServices(data.services);
                setCategories(data.categories);
            } catch (error) {
                console.error('Failed to fetch services data', error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadInitialData();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleEdit = (service: any) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedService(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            try {
                await api.delete(`/admin/services/${id}`);
                await refreshData();
            } catch (error) {
                alert('Failed to delete service');
            }
        }
    };

    if (loading) return <div>Loading services...</div>;

    return (
        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Service Catalog Management
                </CardTitle>
                <Button 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                    onClick={handleCreate}
                >
                    Create New Service
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Service Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.category?.name || 'N/A'}</TableCell>
                                <TableCell>₹{service.price}</TableCell>
                                <TableCell className="text-xs text-slate-400">{service.slug}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>Edit</Button>
                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(service.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <ServiceModal 
                key={`${selectedService?.id ?? 'new'}-${isModalOpen ? 'open' : 'closed'}`}
                service={selectedService}
                categories={categories}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={refreshData}
            />
        </Card>
    );
}

