import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Lock, Plus, Save, X } from 'lucide-react';

const API_BASE = 'http://localhost:8080';

const Profile: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [services, setServices] = useState<string[]>([]);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [serviceData, setServiceData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newData, setNewData] = useState('');

    const [initPassword, setInitPassword] = useState('');

    const [newServiceJson, setNewServiceJson] = useState('{}');

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API_BASE}/vault/services`);
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            } else {
                // If we can't list services, maybe vault is locked or not initialized
                // But the spec doesn't explicitly say 403/401. 
                // We'll assume if we can fetch, it's open.
            }
        } catch (err) {
            console.error("Failed to fetch services", err);
        }
    };

    const initializeVault = async () => {
        try {
            const res = await fetch(`${API_BASE}/vault/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: initPassword })
            });
            if (res.ok) {
                alert('Vault initialized!');
                setInitPassword('');
                fetchServices();
            } else {
                alert('Failed to initialize vault');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const lockVault = async () => {
        try {
            await fetch(`${API_BASE}/vault/lock`, { method: 'POST' });
            alert('Vault locked');
            setServices([]);
            setSelectedService(null);
            setServiceData(null);
        } catch (err) {
            console.error(err);
        }
    };

    const purgeExpired = async () => {
        try {
            await fetch(`${API_BASE}/vault/purge-expired`, { method: 'POST' });
            alert('Expired entries purged');
            fetchServices();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchServiceData = async (service: string) => {
        try {
            const res = await fetch(`${API_BASE}/vault/credentials/${service}`);
            if (res.ok) {
                const data = await res.json();
                setServiceData(data);
                setSelectedService(service);
                setIsEditing(false);
                setNewData(JSON.stringify(data, null, 2));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateCredential = async () => {
        if (!selectedService) return;
        try {
            const parsedData = JSON.parse(newData);
            const res = await fetch(`${API_BASE}/vault/credentials/${selectedService}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData)
            });
            if (res.ok) {
                alert('Credential updated');
                fetchServiceData(selectedService);
            } else {
                alert('Failed to update');
            }
        } catch (err) {
            alert('Invalid JSON');
        }
    };

    const addCredential = async () => {
        try {
            const parsedData = JSON.parse(newServiceJson);
            // The API expects the body to be the entry data. 
            // Wait, the spec says:
            // /vault/credentials POST
            // Request Body: { "service": "name", ... } ? 
            // No, the spec says "Add unstructured credential entry."
            // But how do we specify the service name?
            // Looking at the spec:
            // /vault/credentials POST
            // requestBody content application/json schema: { "additionalProperties": true, "type": "object", "title": "Entry Data" }
            // It seems the service name must be part of the body? 
            // Or maybe it's generated?
            // Usually a credential manager needs a key.
            // Let's assume the body should contain a "service" field or similar.
            // Actually, looking at GET /vault/credentials/{service}, the service is the key.
            // If I POST to /vault/credentials, I probably need to include "service": "name" in the JSON.

            const res = await fetch(`${API_BASE}/vault/credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData)
            });

            if (res.ok) {
                alert('Credential added');
                setNewServiceJson('{}');
                fetchServices();
            } else {
                alert('Failed to add credential');
            }
        } catch (err) {
            alert('Invalid JSON');
        }
    };

    const deleteCredential = async (service: string) => {
        if (!confirm(`Are you sure you want to delete ${service}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/vault/credentials/${service}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Credential deleted');
                if (selectedService === service) {
                    setSelectedService(null);
                    setServiceData(null);
                }
                fetchServices();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-gray-100 overflow-hidden">
            <Sidebar
                user={user}
                logout={logout}
                chatSessions={[]}
                currentSessionId={null}
                onSelectSession={() => { }}
                onNewChat={() => navigate('/dashboard')}
                onDeleteSession={() => { }}
            />

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                            Vault Management
                        </h1>
                        <div className="flex gap-2">
                            <Button variant="destructive" onClick={lockVault} className="gap-2">
                                <Lock className="w-4 h-4" /> Lock Vault
                            </Button>
                            <Button variant="outline" onClick={purgeExpired} className="gap-2 text-slate-200 border-slate-700 hover:bg-slate-800">
                                <Trash2 className="w-4 h-4" /> Purge Expired
                            </Button>
                        </div>
                    </div>

                    {/* Initialize Vault Section */}
                    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-100">Initialize Vault</CardTitle>
                            <CardDescription className="text-slate-400">Set a master password to initialize or unlock the vault.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input
                                type="password"
                                placeholder="Master Password"
                                value={initPassword}
                                onChange={(e) => setInitPassword(e.target.value)}
                                className="bg-slate-900/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                            />
                            <Button onClick={initializeVault} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 border-0">
                                Initialize
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Services List */}
                        <Card className="md:col-span-1 bg-slate-800/50 border-slate-700 backdrop-blur-sm h-[600px] flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-slate-100">Services</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto space-y-2">
                                {services.map(service => (
                                    <div
                                        key={service}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center group ${selectedService === service ? 'bg-slate-700/70 text-white' : 'hover:bg-slate-700/50 text-slate-300'
                                            }`}
                                        onClick={() => fetchServiceData(service)}
                                    >
                                        <span className="truncate">{service}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                                            onClick={(e) => { e.stopPropagation(); deleteCredential(service); }}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                {services.length === 0 && (
                                    <p className="text-slate-500 text-sm text-center py-4">No services found</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Credential Details / Add New */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Add New Credential */}
                            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-slate-100 text-lg">Add New Credential</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Credential Data (JSON)</Label>
                                        <textarea
                                            className="w-full h-32 bg-slate-900/50 border border-slate-600 rounded-md p-3 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newServiceJson}
                                            onChange={(e) => setNewServiceJson(e.target.value)}
                                            placeholder='{ "service": "google", "username": "...", "password": "..." }'
                                        />
                                        <p className="text-xs text-slate-500">Must include a "service" field to identify the entry.</p>
                                    </div>
                                    <Button onClick={addCredential} className="w-full bg-slate-700 hover:bg-slate-600">
                                        <Plus className="w-4 h-4 mr-2" /> Add Credential
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* View/Edit Credential */}
                            {selectedService && serviceData && (
                                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-slate-100">
                                            {selectedService}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsEditing(!isEditing)}
                                            className={isEditing ? "text-blue-400" : "text-slate-400"}
                                        >
                                            {isEditing ? 'Cancel Edit' : 'Edit'}
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <textarea
                                                    className="w-full h-64 bg-slate-900/50 border border-slate-600 rounded-md p-3 text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={newData}
                                                    onChange={(e) => setNewData(e.target.value)}
                                                />
                                                <Button onClick={updateCredential} className="w-full bg-blue-600 hover:bg-blue-700">
                                                    <Save className="w-4 h-4 mr-2" /> Save Changes
                                                </Button>
                                            </div>
                                        ) : (
                                            <pre className="bg-slate-900/50 p-4 rounded-lg overflow-x-auto text-sm font-mono text-slate-300">
                                                {JSON.stringify(serviceData, null, 2)}
                                            </pre>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
