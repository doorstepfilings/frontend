'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { adminApi } from '@/lib/api/admin-api';

interface ServiceModalProps {
    service?: any;
    categories: any[];
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ServiceModal({ service, categories, isOpen, onClose, onSave }: ServiceModalProps) {
    const [formData, setFormData] = useState<any>({
        name: '',
        slug: '',
        price: '',
        serviceCategoryId: '',
        description: '',
        metaTitle: '',
        metaDescription: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (service) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: service.name || '',
                slug: service.slug || '',
                price: service.price || '',
                serviceCategoryId: String(service.serviceCategoryId || ''),
                description: service.description || '',
                metaTitle: service.metaTitle || '',
                metaDescription: service.metaDescription || '',
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                price: '',
                serviceCategoryId: '',
                description: '',
                metaTitle: '',
                metaDescription: '',
            });
        }
    }, [service, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => {
            const newData = { ...prev, [name]: value };
            if (name === 'name' && !service) {
                newData.slug = value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            }
            return newData;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (service) {
                await adminApi.updateService(service.id, formData);
            } else {
                await adminApi.storeService(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            alert('Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{service ? 'Edit Service' : 'Create New Service'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right text-xs">Slug (SEO)</Label>
                        <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right text-xs">Base Price (₹)</Label>
                        <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">Category</Label>
                        <div className="col-span-3">
                            <SearchableSelect 
                                value={formData.serviceCategoryId} 
                                onChange={(e) => setFormData((p: any) => ({ ...p, serviceCategoryId: e.target.value }))}
                                options={categories.map((cat) => ({
                                    value: String(cat.id),
                                    label: cat.name,
                                }))}
                                placeholder="Select a category"
                                size="sm"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right text-xs">Description</Label>
                        <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="col-span-3" />
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">SEO Meta Tags</p>
                        <div className="grid gap-2">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="metaTitle" className="text-right text-xs">Meta Title</Label>
                                <Input id="metaTitle" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="metaDescription" className="text-right text-xs">Meta Desc</Label>
                                <Textarea id="metaDescription" name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="col-span-3" />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-purple-600">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
