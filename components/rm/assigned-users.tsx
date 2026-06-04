'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rmApi } from '@/lib/api/rm-api';
import { PanelLogoLoader } from '@/components/ui/logo-loader';

export function RMUserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await rmApi.getAssignedUsers();
                setUsers(response.data.data);
            } catch (error) {
                console.error('Failed to fetch assigned users', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <PanelLogoLoader label="Loading assigned users..." size={54} />;
    }

    return (
        <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Managed Users
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Accountant</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    {user.accountant ? (
                                        <Badge variant="secondary">{user.accountant.name}</Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Not Assigned</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Manage</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
