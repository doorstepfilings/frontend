"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { setStoredUser, type AuthUser } from "@/lib/auth/storage";
import { usePincodeLookup } from "@/lib/hooks/use-pincode-lookup";
import { parseApiError } from "@/lib/utils/error-parser";
import { FormField } from "@/components/ui/core/form-field";
import { PageLogoLoader } from "@/components/ui/logo-loader";

type ProfileResponse = {
  data?: AuthUser;
  message?: string;
};

type RegionalManagerResponse = {
  data?: {
    id?: number;
    name?: string;
    email?: string;
    mobile_number?: string | null;
    rm_unique_id?: string | null;
  };
  message?: string;
};

export function AccountView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "rm">("profile");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [rmSearchId, setRmSearchId] = useState("");
  const [rmResult, setRmResult] = useState<RegionalManagerResponse["data"] | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [searchingRm, setSearchingRm] = useState(false);
  const [connectingRm, setConnectingRm] = useState(false);

  const handlePincodeSuccess = useCallback(({ city, state }: { city: string; state: string }) => {
    setProfileData((prev) => ({ ...prev, city, state }));
  }, []);

  const { loading: pincodeLoading } = usePincodeLookup(
    profileData.pincode,
    handlePincodeSuccess,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const response = await apiClient.get<ProfileResponse>("/user");
        const resolvedUser = response.data?.data ?? null;

        if (!resolvedUser || !isMounted) {
          return;
        }

        setStoredUser(resolvedUser);
        setUser(resolvedUser);
        setProfileData({
          name: String(resolvedUser.name ?? ""),
          email: String(resolvedUser.email ?? ""),
          mobile_number: String(resolvedUser.mobile_number ?? ""),
          address: String(resolvedUser.address ?? ""),
          city: String(resolvedUser.city ?? ""),
          state: String(resolvedUser.state ?? ""),
          pincode: String(resolvedUser.pincode ?? ""),
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }
        setMessage({ type: "error", text: parseApiError(requestError) });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
  };

  const handleProfileUpdate = async () => {
    setSavingProfile(true);
    setMessage(null);

    try {
      const response = await apiClient.put<ProfileResponse>("/user/profile", profileData);
      const resolvedUser = response.data?.data ?? null;

      if (resolvedUser) {
        setStoredUser(resolvedUser);
        setUser(resolvedUser);
      }

      showMessage("success", response.data?.message ?? "Profile updated successfully.");
    } catch (requestError) {
      showMessage("error", parseApiError(requestError));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showMessage("error", "New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setMessage(null);

    try {
      const response = await apiClient.post<ProfileResponse>("/user/change-password", passwordData);
      setPasswordData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      showMessage("success", response.data?.message ?? "Password changed successfully.");
    } catch (requestError) {
      showMessage("error", parseApiError(requestError));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSearchRm = async () => {
    if (!rmSearchId.trim()) {
      showMessage("error", "Enter an RM ID to continue.");
      return;
    }

    setSearchingRm(true);
    setMessage(null);

    try {
      const response = await apiClient.get<RegionalManagerResponse>("/user/search-rm", {
        params: {
          rm_unique_id: rmSearchId.trim(),
        },
      });
      setRmResult(response.data?.data ?? null);
      showMessage("success", response.data?.message ?? "Relationship Manager  found.");
    } catch (requestError) {
      setRmResult(null);
      showMessage("error", parseApiError(requestError));
    } finally {
      setSearchingRm(false);
    }
  };

  const handleConnectRm = async () => {
    if (!rmResult?.rm_unique_id) {
      return;
    }

    setConnectingRm(true);
    setMessage(null);

    try {
      const response = await apiClient.post<ProfileResponse>("/user/connect-rm", {
        rm_unique_id: rmResult.rm_unique_id,
      });
      const resolvedUser = response.data?.data ?? null;

      if (resolvedUser) {
        setStoredUser(resolvedUser);
        setUser(resolvedUser);
      }

      setRmSearchId("");
      setRmResult(null);
      showMessage("success", response.data?.message ?? "Connected to Relationship Manager  successfully.");
    } catch (requestError) {
      showMessage("error", parseApiError(requestError));
    } finally {
      setConnectingRm(false);
    }
  };

  return (
    <>
      {loading ? (
        <PageLogoLoader
          className="min-h-[24rem]"
          label="Loading your account..."
          size={64}
        />
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage your profile, security preferences, and Relationship Manager  connection.
            </p>
          </div>

          {message ? (
            <div
              className={`rounded-2xl border px-6 py-4 text-[11px] font-bold uppercase tracking-wider animate-fadeIn ${message.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-rose-100 bg-rose-50 text-rose-700"
                }`}
            >
              <i className={`fas ${message.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} mr-2`} />
              {message.text}
            </div>
          ) : null}

          <div className="inline-flex rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
            {[
              { id: "profile" as const, label: "Profile", icon: "fa-user" },
              { id: "security" as const, label: "Security", icon: "fa-shield-halved" },
              { id: "rm" as const, label: "My RM", icon: "fa-user-tie" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                  ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <i className={`fas ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
            {activeTab === "profile" ? (
              <section className="p-10 animate-fadeIn">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-900 text-xl shadow-inner">
                    <i className="fas fa-user-circle" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Information</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Update your identity and contact vectors
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <FormField label="Full Name">
                    <FieldInput
                      value={profileData.name}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, name: value }))}
                      placeholder="e.g. John Doe"
                    />
                  </FormField>
                  <FormField label="Email Address">
                    <FieldInput
                      type="email"
                      value={profileData.email}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, email: value }))}
                      placeholder="john@example.com"
                    />
                  </FormField>
                  <FormField label="Mobile Number">
                    <FieldInput
                      value={profileData.mobile_number}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, mobile_number: value }))}
                      placeholder="+91 00000 00000"
                    />
                  </FormField>
                  <FormField
                    label="Pincode"
                    error={pincodeLoading ? "Locating..." : undefined}
                  >
                    <FieldInput
                      value={profileData.pincode}
                      onChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          pincode: value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="6-digit Pincode"
                    />
                  </FormField>
                  <FormField label="City">
                    <FieldInput
                      value={profileData.city}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, city: value }))}
                      placeholder="City Name"
                    />
                  </FormField>
                  <FormField label="State">
                    <FieldInput
                      value={profileData.state}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, state: value }))}
                      placeholder="State Name"
                    />
                  </FormField>
                  <FormField label="Address" className="md:col-span-2">
                    <FieldInput
                      value={profileData.address}
                      onChange={(value) => setProfileData((prev) => ({ ...prev, address: value }))}
                      placeholder="Street, Landmark, Area"
                    />
                  </FormField>
                </div>

                <div className="mt-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleProfileUpdate()}
                    disabled={savingProfile}
                    className="h-14 px-10 bg-blue-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:shadow-2xl hover:shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {savingProfile ? <i className="fas fa-circle-notch animate-spin" /> : <i className="fas fa-save" />}
                    {savingProfile ? "Synchronizing..." : "Save Changes"}
                  </button>
                </div>
              </section>
            ) : null}

            {activeTab === "security" ? (
              <section className="p-10 animate-fadeIn">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 text-xl shadow-inner">
                    <i className="fas fa-shield-alt" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Security Settings</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Manage your encryption access keys
                    </p>
                  </div>
                </div>

                <div className="grid max-w-2xl gap-8">
                  <FormField label="Current Password">
                    <FieldInput
                      type="password"
                      value={passwordData.current_password}
                      onChange={(value) =>
                        setPasswordData((prev) => ({ ...prev, current_password: value }))
                      }
                      placeholder="••••••••"
                    />
                  </FormField>
                  <div className="grid gap-8 md:grid-cols-2">
                    <FormField label="New Password">
                      <FieldInput
                        type="password"
                        value={passwordData.new_password}
                        onChange={(value) =>
                          setPasswordData((prev) => ({ ...prev, new_password: value }))
                        }
                        placeholder="••••••••"
                      />
                    </FormField>
                    <FormField label="Confirm New Password">
                      <FieldInput
                        type="password"
                        value={passwordData.new_password_confirmation}
                        onChange={(value) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            new_password_confirmation: value,
                          }))
                        }
                        placeholder="••••••••"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handlePasswordUpdate()}
                    disabled={savingPassword}
                    className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-black hover:shadow-2xl disabled:opacity-50 flex items-center gap-3"
                  >
                    {savingPassword ? <i className="fas fa-circle-notch animate-spin" /> : <i className="fas fa-key" />}
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </section>
            ) : null}

            {activeTab === "rm" ? (
              <section className="p-10 animate-fadeIn">
                <div className="mb-10 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-xl shadow-inner">
                    <i className="fas fa-user-tie" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Relationship Manager </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Your direct relationship interface
                    </p>
                  </div>
                </div>

                {user?.regional_manager ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-8">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-blue-900 text-3xl font-black text-white shadow-xl shadow-blue-900/20">
                        {user.regional_manager.name?.charAt(0).toUpperCase() ?? "R"}
                      </div>
                      <div className="grid flex-1 gap-10 md:grid-cols-2 w-full">
                        <InfoTile
                          label="Officer Name"
                          value={String(user.regional_manager.name ?? "Not available")}
                        />
                        <InfoTile
                          label="Unique Identity"
                          value={String(user.regional_manager.rm_unique_id ?? "Not available")}
                        />
                        <InfoTile
                          label="Official Email"
                          value={String(user.regional_manager.email ?? "Not available")}
                        />
                        <InfoTile
                          label="Direct Contact"
                          value={String(user.regional_manager.mobile_number ?? "Not available")}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="rounded-[2.5rem] border border-slate-100 bg-slate-50/50 p-12 text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm text-3xl text-slate-300">
                        <i className="fas fa-user-slash" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">No Relationship Manager  Linked</h3>
                      <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                        Link with a Relationship Manager  using their officer ID to receive personalized assistance.
                      </p>
                    </div>

                    <div className="rounded-[2.5rem] border border-blue-100 bg-blue-50/30 p-10">
                      <FormField label="Officer Search">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input
                            type="text"
                            value={rmSearchId}
                            onChange={(event) => setRmSearchId(event.target.value)}
                            className="flex-1 h-14 rounded-2xl border border-blue-100 bg-white px-6 text-sm font-medium text-slate-700 outline-none transition-all focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                            placeholder="Officer ID (e.g. RM000123)"
                          />
                          <button
                            type="button"
                            onClick={() => void handleSearchRm()}
                            disabled={searchingRm || !rmSearchId.trim()}
                            className="h-14 px-8 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 justify-center"
                          >
                            {searchingRm ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-search" />}
                            {searchingRm ? "Searching..." : "Initiate Search"}
                          </button>
                        </div>
                      </FormField>

                      {rmResult ? (
                        <div className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 animate-slideDown shadow-xl shadow-emerald-500/5">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-bold text-white shadow-lg shadow-emerald-500/20">
                                {rmResult.name?.charAt(0).toUpperCase() ?? "R"}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 tracking-tight">
                                  {rmResult.name ?? "Relationship Manager "}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  ID: {rmResult.rm_unique_id ?? "N/A"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => void handleConnectRm()}
                              disabled={connectingRm}
                              className="w-full sm:w-auto h-12 px-6 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 justify-center"
                            >
                              {connectingRm ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-link" />}
                              {connectingRm ? "Linking..." : "Establish Connection"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

function FieldInput({
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
    />
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}
