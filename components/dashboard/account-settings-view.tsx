"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { updateProfile, changePassword, searchRM, connectRM } from "@/lib/features/auth/auth-slice";
import { usePincodeLookup } from "@/lib/hooks/use-pincode-lookup";
import { toast } from "react-hot-toast";
import { useStoredUser } from "@/lib/auth/hooks";
import {
    AUTH_ERROR_MESSAGES,
    getFriendlyAuthErrorMessage,
} from "@/lib/auth/error-helper";

function createProfileData(
    user: {
        name?: string;
        email?: string;
        mobile_number?: string;
        address?: string;
        city?: string;
        state?: string;
        pincode?: number | string;
    } | null | undefined,
) {
    return {
        name: user?.name || "",
        email: user?.email || "",
        mobile_number: user?.mobile_number || "",
        address: user?.address || "",
        city: user?.city || "",
        state: user?.state || "",
        pincode: user?.pincode ? String(user.pincode) : ""
    };
}

export function AccountSettingsView() {
    const dispatch = useAppDispatch();
    const user = useStoredUser();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'rm'>('profile');

    // Profile State
    const [profileData, setProfileData] = useState(() => createProfileData(null));

    // Security State
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
    });

    // RM State
    const [rmSearchId, setRmSearchId] = useState("");
    const [rmSearchResult, setRmSearchResult] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const handlePincodeSuccess = useCallback(({ city, state }: { city: string; state: string }) => {
        setProfileData(prev => ({ ...prev, city, state }));
    }, []);

    useEffect(() => {
        const syncProfileState = () => {
            setProfileData(createProfileData(user));
        };

        const timeoutId = window.setTimeout(syncProfileState, 0);
        return () => window.clearTimeout(timeoutId);
    }, [user]);

    const { loading: pincodeLoading } = usePincodeLookup(profileData.pincode, handlePincodeSuccess);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(updateProfile(profileData)).unwrap();
            toast.success("Profile updated successfully!");
        } catch (err: any) {
            toast.error(getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.GENERIC));
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            await dispatch(changePassword(passwordData)).unwrap();
            setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
            toast.success("Password updated successfully!");
        } catch (err: any) {
            toast.error(getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.GENERIC));
        }
    };

    const handleRMSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rmSearchId.trim()) return;
        setIsSearching(true);
        try {
            const result = await dispatch(searchRM(rmSearchId)).unwrap();
            setRmSearchResult(result);
        } catch (err: any) {
            toast.error(getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.ACCOUNT_NOT_FOUND));
            setRmSearchResult(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleRMConnect = async () => {
        if (!rmSearchResult?.rm_unique_id) return;
        setIsConnecting(true);
        try {
            await dispatch(connectRM(rmSearchResult.rm_unique_id)).unwrap();
            toast.success("Connected to Regional Manager!");
            setRmSearchResult(null);
            setRmSearchId("");
        } catch (err: any) {
            toast.error(getFriendlyAuthErrorMessage(err, AUTH_ERROR_MESSAGES.GENERIC));
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account</h1>
                <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Manage your digital workspace identity</p>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 p-8 space-y-2">
                    <TabButton 
                        active={activeTab === 'profile'} 
                        onClick={() => setActiveTab('profile')} 
                        icon="fa-user" 
                        label="Profile Info" 
                    />
                    <TabButton 
                        active={activeTab === 'security'} 
                        onClick={() => setActiveTab('security')} 
                        icon="fa-shield-halved" 
                        label="Security" 
                    />
                    <TabButton 
                        active={activeTab === 'rm'} 
                        onClick={() => setActiveTab('rm')} 
                        icon="fa-user-tie" 
                        label="My Relationship Manager" 
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 p-10 md:p-16">
                    {activeTab === 'profile' && (
                        <div className="max-w-2xl animate-fadeIn">
                            <h2 className="text-2xl font-black text-slate-900 mb-8">Personal Information</h2>
                            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputGroup label="Full Name" value={profileData.name} onChange={v => setProfileData({...profileData, name: v})} required />
                                <InputGroup label="Email Address" value={profileData.email} onChange={v => setProfileData({...profileData, email: v})} required type="email" />
                                <InputGroup label="Phone Number" value={profileData.mobile_number} onChange={v => setProfileData({...profileData, mobile_number: v})} />
                                <InputGroup label="Pincode" value={profileData.pincode} onChange={v => setProfileData({...profileData, pincode: v.replace(/\D/g, '')})} loading={pincodeLoading} maxLength={6} />
                                <InputGroup label="City" value={profileData.city} onChange={v => setProfileData({...profileData, city: v})} />
                                <InputGroup label="State" value={profileData.state} onChange={v => setProfileData({...profileData, state: v})} />
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Street Address</label>
                                    <textarea 
                                        value={profileData.address}
                                        onChange={e => setProfileData({...profileData, address: e.target.value})}
                                        className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50 px-6 py-4 font-bold text-slate-900 outline-none focus:border-blue-900 focus:bg-white transition-all resize-none h-32"
                                    />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button type="submit" className="h-14 px-10 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-blue-900/20 transition-all">
                                        Update Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="max-w-xl animate-fadeIn">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Account Security</h2>
                            <p className="text-sm text-slate-400 font-bold mb-10 uppercase tracking-widest opacity-60">Maintain a secure access portal</p>
                            <form onSubmit={handlePasswordUpdate} className="space-y-8">
                                <InputGroup label="Current Password" value={passwordData.current_password} onChange={v => setPasswordData({...passwordData, current_password: v})} type="password" required />
                                <div className="h-px bg-slate-50 w-full"></div>
                                <InputGroup label="New Password" value={passwordData.new_password} onChange={v => setPasswordData({...passwordData, new_password: v})} type="password" required />
                                <InputGroup label="Confirm New Password" value={passwordData.new_password_confirmation} onChange={v => setPasswordData({...passwordData, new_password_confirmation: v})} type="password" required />
                                <div className="pt-4">
                                    <button type="submit" className="h-14 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-slate-900/20 transition-all">
                                        Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'rm' && (
                        <div className="max-w-2xl animate-fadeIn">
                            <h2 className="text-2xl font-black text-slate-900 mb-8">Relationship Manager</h2>
                            
                            {user?.regional_manager ? (
                                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20">
                                    <div className="flex items-start gap-8">
                                        <div className="h-24 w-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-3xl font-black shrink-0">
                                            {user.regional_manager.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Assigned RM</p>
                                                <p className="text-xl font-black">{user.regional_manager.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">RM Identifier</p>
                                                <p className="text-sm font-bold font-mono bg-white/5 px-3 py-1 rounded-lg inline-block">{user.regional_manager.rm_unique_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Direct Email</p>
                                                <a href={`mailto:${user.regional_manager.email}`} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">{user.regional_manager.email}</a>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Business Mobile</p>
                                                <a href={`tel:${user.regional_manager.mobile_number}`} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">{user.regional_manager.mobile_number}</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    <div className="p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100 text-center">
                                        <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                            <i className="fas fa-user-slash text-2xl"></i>
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No assigned relationship manager</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block">Connect via RM Identifier</p>
                                        <form onSubmit={handleRMSearch} className="flex gap-4">
                                            <div className="relative flex-1">
                                                <i className="fas fa-id-card absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                                <input 
                                                    type="text"
                                                    value={rmSearchId}
                                                    onChange={e => setRmSearchId(e.target.value)}
                                                    className="w-full h-14 pl-14 pr-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-900 focus:bg-white transition-all"
                                                    placeholder="Enter RM ID (e.g. RM000001)"
                                                />
                                            </div>
                                            <button 
                                                type="submit" 
                                                disabled={isSearching || !rmSearchId.trim()}
                                                className="h-14 px-8 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-blue-900/20 transition-all disabled:opacity-50"
                                            >
                                                {isSearching ? <i className="fas fa-spinner animate-spin"></i> : "Search"}
                                            </button>
                                        </form>

                                        {rmSearchResult && (
                                            <div className="mt-8 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 animate-fadeIn">
                                                <div className="flex items-center justify-between gap-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="h-14 w-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black">
                                                            {rmSearchResult.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{rmSearchResult.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rmSearchResult.rm_unique_id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleRMConnect}
                                                            disabled={isConnecting}
                                                            className="h-12 px-6 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:shadow-lg transition-all"
                                                        >
                                                            {isConnecting ? <i className="fas fa-spinner animate-spin"></i> : "Connect"}
                                                        </button>
                                                        <button 
                                                            onClick={() => setRmSearchResult(null)}
                                                            className="h-12 px-6 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-900 text-white shadow-xl shadow-blue-900/20 translate-x-2' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
        >
            <i className={`fas ${icon} text-sm`}></i>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function InputGroup({ label, value, onChange, type = "text", required = false, loading = false, maxLength }: { label: string, value: string, onChange: (v: string) => void, type?: string, required?: boolean, loading?: boolean, maxLength?: number }) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label} {required && <span className="text-rose-500">*</span>}</label>
            <div className="relative">
                <input 
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required={required}
                    maxLength={maxLength}
                    className="w-full h-14 px-6 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
                {loading && <i className="fas fa-spinner animate-spin absolute right-6 top-5 text-blue-900"></i>}
            </div>
        </div>
    );
}
