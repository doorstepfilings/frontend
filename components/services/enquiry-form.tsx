'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { Send } from 'lucide-react';

export function EnquiryForm({ serviceName }: { serviceName?: string }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        service: serviceName || '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post('/enquiries', formData);
            setSubmitted(true);
        } catch (error) {
            alert('Failed to send enquiry');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                <h3 className="text-emerald-800 font-bold text-lg mb-2">Enquiry Sent!</h3>
                <p className="text-emerald-700 text-sm">Thank you for your interest. Our team will contact you shortly.</p>
                <Button variant="ghost" className="mt-4 text-emerald-800" onClick={() => setSubmitted(false)}>Send another</Button>
            </div>
        );
    }

    return (
        <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Have Questions? Enquiry Now</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Email</label>
                            <Input 
                                required 
                                type="email" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Phone</label>
                        <Input 
                            required 
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="Mobile number"
                        />
                    </div>
                    {!serviceName && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Service Interest</label>
                            <Input 
                                value={formData.service} 
                                onChange={(e) => setFormData({...formData, service: e.target.value})}
                                placeholder="Which service are you interested in?"
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500">Message</label>
                        <Textarea 
                            required 
                            rows={4}
                            value={formData.message} 
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            placeholder="Tell us what you need help with..."
                        />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                        {submitting ? 'Sending...' : 'Send Message'}
                        <Send className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
