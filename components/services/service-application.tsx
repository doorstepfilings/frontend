"use client";

import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { useAuthStatus, useStoredUser } from "@/lib/auth/hooks";
import { setStoredUser } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { usePincodeLookup } from "@/lib/hooks/use-pincode-lookup";
import { DocumentUpload } from "@/components/ui/document-upload";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  SLOT_TIMES,
  formatTimeSlot,
  isWorkingDay,
} from "@/lib/utils/slot-helpers";
import { parseApiError } from "@/lib/utils/error-parser";
import { formatPrice } from "@/lib/utils/pricing";

const COUNTRIES = [
  { iso: 'in', name: 'India', dialCode: '91', flag: 'https://flagcdn.com/24x18/in.png' },
  { iso: 'us', name: 'United States', dialCode: '1', flag: 'https://flagcdn.com/24x18/us.png' },
  { iso: 'gb', name: 'United Kingdom', dialCode: '44', flag: 'https://flagcdn.com/24x18/gb.png' },
  { iso: 'ae', name: 'UAE', dialCode: '971', flag: 'https://flagcdn.com/24x18/ae.png' },
  { iso: 'sa', name: 'Saudi Arabia', dialCode: '966', flag: 'https://flagcdn.com/24x18/sa.png' },
  { iso: 'kw', name: 'Kuwait', dialCode: '965', flag: 'https://flagcdn.com/24x18/kw.png' },
  { iso: 'qa', name: 'Qatar', dialCode: '974', flag: 'https://flagcdn.com/24x18/qa.png' },
];

const MAX_FILE_SIZE_BYTES = 1024 * 1024;

type ServiceDocument = {
  id: number;
  document_name?: string | null;
  document_type?: string | null;
  is_required?: boolean;
};

type Service = {
  id: number;
  name: string;
  slug: string;
  price?: number | string | null;
  pricing_plans?: Array<{ name: string; price: number; features?: string[] }> | null;
  documents?: ServiceDocument[];
};

type Slot = {
  time: string;
  booked: number;
  remaining: number;
  is_full: boolean;
  is_past: boolean;
};

type DocumentRow = {
  file: File | null;
  is_required: boolean;
  notes: string;
  service_document_id?: number;
  type: string;
};

type ProfileResponse = {
  data?: AuthUser | null;
  user?: AuthUser | null;
};

function createRowsFromService(service: Service | null) {
  if (service?.documents && service.documents.length > 0) {
    return service.documents.map((document) => ({
      file: null,
      is_required: Boolean(document.is_required),
      notes: "",
      service_document_id: document.id,
      type: document.document_name || document.document_type || "",
    }));
  }
  return [{ file: null, is_required: false, notes: "", type: "" }];
}

const dialCodeToIso = (dialCode: string) => {
  const mapping: Record<string, string> = {
    '91': 'in', '1': 'us', '44': 'gb', '971': 'ae', '966': 'sa', '965': 'kw', '974': 'qa',
  };
  return mapping[dialCode] || 'in';
};

const parsePhoneNumber = (fullNumber: string) => {
  if (!fullNumber) return { phone: '', dialCode: '91', countryIso: 'in' };
  const cleanNumber = fullNumber.startsWith('+') ? fullNumber.slice(1) : fullNumber;
  const dialCodes = ['91', '1', '44', '971', '966', '965', '974'];
  for (const code of dialCodes) {
    if (cleanNumber.startsWith(code)) {
      return { dialCode: code, phone: cleanNumber.slice(code.length), countryIso: dialCodeToIso(code) };
    }
  }
  return { dialCode: '91', phone: cleanNumber, countryIso: 'in' };
};

const mergeUserIntoForm = (
  currentFormData: {
    fullName: string;
    email: string;
    phone: string;
    dialCode: string;
    countryIso: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    notes: string;
  },
  profile: AuthUser | null,
  touchedFields: Set<string>,
) => {
  if (!profile) {
    return currentFormData;
  }

  const parsedPhone = parsePhoneNumber(String(profile.mobile_number ?? ""));

  return {
    ...currentFormData,
    fullName: touchedFields.has("fullName")
      ? currentFormData.fullName
      : String(profile.name ?? ""),
    email: touchedFields.has("email")
      ? currentFormData.email
      : String(profile.email ?? ""),
    phone: touchedFields.has("phone")
      ? currentFormData.phone
      : parsedPhone.phone,
    dialCode: touchedFields.has("dialCode")
      ? currentFormData.dialCode
      : parsedPhone.dialCode,
    countryIso: touchedFields.has("countryIso")
      ? currentFormData.countryIso
      : parsedPhone.countryIso,
    address: touchedFields.has("address")
      ? currentFormData.address
      : String(profile.address ?? ""),
    city: touchedFields.has("city")
      ? currentFormData.city
      : String(profile.city ?? ""),
    state: touchedFields.has("state")
      ? currentFormData.state
      : String(profile.state ?? ""),
    pincode: touchedFields.has("pincode")
      ? currentFormData.pincode
      : String(profile.pincode ?? ""),
  };
};

const resolveProfileFromResponse = (payload: ProfileResponse | AuthUser | null | undefined) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const directProfile = payload as AuthUser;
  if (
    directProfile.name !== undefined ||
    directProfile.email !== undefined ||
    directProfile.mobile_number !== undefined ||
    directProfile.address !== undefined
  ) {
    return directProfile;
  }

  const nestedPayload = payload as ProfileResponse & {
    data?: AuthUser | { user?: AuthUser | null } | null;
  };

  if (nestedPayload.data && typeof nestedPayload.data === "object") {
    const nestedDirect = nestedPayload.data as AuthUser;
    if (
      nestedDirect.name !== undefined ||
      nestedDirect.email !== undefined ||
      nestedDirect.mobile_number !== undefined ||
      nestedDirect.address !== undefined
    ) {
      return nestedDirect;
    }

    const nestedUser = (nestedPayload.data as { user?: AuthUser | null }).user;
    if (nestedUser) {
      return nestedUser;
    }
  }

  return nestedPayload.user ?? null;
};

export function ServiceApplication({ modalMode = false, onModalClose, preselectedService = null }: { modalMode?: boolean, onModalClose?: () => void, preselectedService?: Service | null }) {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const user = useStoredUser();
  const isServiceSelectionLocked = Boolean(preselectedService);
  const touchedFieldsRef = useRef<Set<string>>(new Set());

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(preselectedService);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [includeAppointment, setIncludeAppointment] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dialCode: "91",
    countryIso: "in",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const [selectedPricingPlan, setSelectedPricingPlan] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const selectedPlanDetails =
    selectedService?.pricing_plans?.find((plan) => plan.name === selectedPricingPlan) ?? null;
  const hasMultiplePackages = (selectedService?.pricing_plans?.length ?? 0) > 1;

  const applySelectedService = useCallback((service: Service | null) => {
    setSelectedService(service);
    setDocumentRows(createRowsFromService(service));
    setSelectedPricingPlan(service?.pricing_plans?.[0]?.name ?? "");
    setFileErrors({});
    setSelectedDate(null);
    setSelectedTimeSlot("");
  }, []);

  const handleServiceSelectionChange = useCallback((serviceId: string) => {
    const nextService =
      services.find((service) => String(service.id) === String(serviceId)) ?? null;

    if (nextService) {
      localStorage.setItem("selectedService", JSON.stringify(nextService));
    } else {
      localStorage.removeItem("selectedService");
    }

    applySelectedService(nextService);
  }, [applySelectedService, services]);

  const handlePincodeSuccess = useCallback(({ city, state }: { city: string; state: string }) => {
    setFormData((prev) => ({ ...prev, city, state }));
  }, []);

  const { loading: pincodeLoading } = usePincodeLookup(formData.pincode, handlePincodeSuccess);

  useEffect(() => {
    if (user) {
      setFormData((current) => mergeUserIntoForm(current, user, touchedFieldsRef.current));
    }
  }, [user]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let isMounted = true;

    async function loadCurrentUserProfile() {
      try {
        const response = await apiClient.get<ProfileResponse>("/user");
        const profile = resolveProfileFromResponse(response.data);

        if (!profile || !isMounted) {
          return;
        }

        setStoredUser(profile);
        setFormData((current) => mergeUserIntoForm(current, profile, touchedFieldsRef.current));
      } catch (requestError) {
        console.warn("Unable to hydrate service application profile", parseApiError(requestError));
        // Keep the form usable with session/local auth data if the profile request fails.
      }
    }

    void loadCurrentUserProfile();

    return () => {
      isMounted = false;
    };
  }, [authStatus]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get<{ data: Service[] }>("/services");
        const availableServices = res.data.data;
        setServices(availableServices);

        if (!preselectedService) {
          const stored = localStorage.getItem("selectedService");
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as Service;
              const matchedService =
                availableServices.find((service) => String(service.id) === String(parsed.id)) ??
                parsed;
              applySelectedService(matchedService);
            } catch {
              localStorage.removeItem("selectedService");
              applySelectedService(null);
            }
          }
        } else {
          applySelectedService(preselectedService);
        }
        setStatus("success");
      } catch {
        setError("Failed to load services");
        setStatus("error");
      }
    }
    if (authStatus === "authenticated") loadData();
  }, [authStatus, preselectedService, applySelectedService]);

  useEffect(() => {
    if (!selectedService || !selectedDate || !includeAppointment) {
      setTimeout(() => setSlots([]), 0);
      return;
    }
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const dateStr = [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');
        const res = await apiClient.get<{ data: Slot[] }>("/service/slot-availability", {
          params: { service_id: selectedService.id, date: dateStr },
        });
        setSlots(res.data.data);
      } catch { setSlots([]); } finally { setSlotsLoading(false); }
    };
    fetchSlots();
  }, [selectedService, selectedDate, includeAppointment]);

  const localSlots = SLOT_TIMES.map(time => {
    const backendSlot = slots.find(s => s.time === time);
    let isPastLocal = backendSlot?.is_past ?? false;
    const isFullLocal = backendSlot?.is_full ?? false;

    if (selectedDate) {
      const now = new Date();
      if (
        selectedDate.getFullYear() === now.getFullYear() &&
        selectedDate.getMonth() === now.getMonth() &&
        selectedDate.getDate() === now.getDate()
      ) {
        const [hour, min] = time.split(':').map(Number);
        if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= min)) {
          isPastLocal = true;
        }
      } else if (selectedDate < new Date(now.setHours(0, 0, 0, 0))) {
        isPastLocal = true;
      }
    }

    return {
      time,
      is_past: isPastLocal,
      is_full: isFullLocal,
      booked: backendSlot?.booked ?? 0,
      remaining: backendSlot?.remaining ?? 0
    };
  });

  const getSlotRecovery = () => {
    if (!selectedDate || slotsLoading || slots.length === 0) return null;

    const selectedSlotState = selectedTimeSlot ? localSlots.find(s => s.time === selectedTimeSlot) : null;
    const availableSlots = localSlots.filter(s => !s.is_past && !s.is_full);

    const nextSlot = localSlots.find(s => {
      if (selectedTimeSlot) {
        return s.time > selectedTimeSlot && !s.is_past && !s.is_full;
      }
      return !s.is_past && !s.is_full;
    });

    const formatSlotDate = (date: Date) => {
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    };

    if (selectedSlotState?.is_full) {
      return {
        title: 'This slot was just booked.',
        description: nextSlot
          ? `Pick ${formatTimeSlot(nextSlot.time)} today or choose another date.`
          : 'No more slots are open for this day. Please choose another date.',
        nextSlot: nextSlot?.time,
      };
    }

    if (selectedSlotState?.is_past) {
      return {
        title: 'This time is already over.',
        description: nextSlot
          ? `Choose ${formatTimeSlot(nextSlot.time)} today or pick another date.`
          : 'Today has no usable slots left. Please choose another date.',
        nextSlot: nextSlot?.time,
      };
    }

    if (availableSlots.length === 0) {
      return {
        title: 'No slots are available for this day.',
        description: 'Please choose another day to continue booking.',
        nextSlot: null,
      };
    }

    return null;
  };

  const slotRecovery = getSlotRecovery();

  const handleInputChange = (field: string, value: string) => {
    touchedFieldsRef.current.add(field);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentRow = (index: number, patch: Partial<DocumentRow>) => {
    setDocumentRows(curr => curr.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors(c => ({ ...c, [index]: "Max 1MB" }));
      updateDocumentRow(index, { file: null });
      return;
    }
    setFileErrors(c => { const n = { ...c }; delete n[index]; return n; });
    updateDocumentRow(index, { file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return setError("Select a service");
    if (includeAppointment && (!selectedDate || !selectedTimeSlot)) return setError("Select appointment");

    setSubmitLoading(true);
    setError("");

    try {
      const payload = new FormData();
      const dateStr = selectedDate ? [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
      ].join('-') : null;
      const formPayload = {
        ...formData,
        phone: `+${formData.dialCode}${formData.phone}`,
        appointment_request: includeAppointment ? "yes" : "no",
        pricing_plan: selectedPricingPlan || null,
        scheduled_date: dateStr,
        scheduled_time: selectedTimeSlot || null,
      };

      payload.append("service_id", String(selectedService.id));
      payload.append("form_data", JSON.stringify(formPayload));
      payload.append("notes", formData.notes || "");

      const metadata: any[] = [];
      documentRows.forEach(r => {
        if (r.file) {
          payload.append("documents", r.file);
          metadata.push({ document_type: "client", notes: r.notes, service_document_id: r.service_document_id, type: r.type });
        }
      });
      if (metadata.length) payload.append("document_metadata", JSON.stringify(metadata));

      await apiClient.post("/service/apply", payload);
      toast.success("Application submitted successfully.");
      localStorage.removeItem("selectedService");
      if (modalMode && onModalClose) {
        onModalClose();
      }
      router.push("/dashboard/services");
    } catch (err: any) {
      const parsedError = parseApiError(err);

      // If it's a slot conflict, we might want to refresh slots or show recovery msg
      if (includeAppointment && selectedService?.id && selectedDate && /slot|future time|passed|booked/i.test(parsedError)) {
        // Re-fetch slots to get latest availability
        const dateStr = [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0')
        ].join('-');
        try {
          const res = await apiClient.get<{ data: Slot[] }>("/service/slot-availability", {
            params: { service_id: selectedService.id, date: dateStr },
          });
          setSlots(res.data.data);
        } catch { }
      }

      setError(parsedError);
    } finally { setSubmitLoading(false); }
  };

  if (status === "loading") return <div className="p-10 text-center">Loading form...</div>;

  const content = (
    <div className={`w-full mx-auto ${modalMode ? 'p-0' : 'container px-4 py-12'}`}>
      <div className={`flex flex-col lg:flex-row gap-8`}>
        <div className={modalMode ? 'w-full' : 'lg:w-2/3'}>
          <form onSubmit={handleSubmit} className={`bg-white ${modalMode ? '' : 'rounded-2xl shadow-sm border border-gray-100 p-8'}`}>
            
            {/* Service Selection */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service</label>
                {isServiceSelectionLocked ? (
                    <div className="relative">
                        <input 
                            type="text" 
                            value={selectedService?.name || ''} 
                            readOnly 
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 outline-none"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <SearchableSelect
                            value={selectedService ? String(selectedService.id) : ""}
                            onChange={(e) => handleServiceSelectionChange(e.target.value)}
                            options={services.map((service) => ({
                                value: String(service.id),
                                label: service.name,
                            }))}
                            placeholder="Select a service"
                            required
                        />
                    </div>
                )}
            </div>

            {selectedService && (selectedService.pricing_plans?.length ?? 0) > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <i className="fas fa-box-open text-blue-900"></i>
                        <h3 className="text-lg font-bold text-gray-800">
                            {hasMultiplePackages ? "Choose Package" : "Selected Package"}
                        </h3>
                    </div>
                    <div className="h-px bg-gray-200 w-full mb-6"></div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {selectedService.pricing_plans?.map((plan) => {
                            const isActive = selectedPricingPlan === plan.name;

                            return (
                                <button
                                    key={plan.name}
                                    type="button"
                                    onClick={() => setSelectedPricingPlan(plan.name)}
                                    className={`rounded-2xl border p-5 text-left transition-all ${
                                        isActive
                                            ? "border-blue-900 bg-blue-50 shadow-sm"
                                            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-base font-bold text-gray-900">{plan.name}</p>
                                            {typeof plan.price === "number" && (
                                                <p className="mt-1 text-sm font-semibold text-blue-900">
                                                    Rs. {formatPrice(plan.price)}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                                                isActive
                                                    ? "border-blue-900 bg-blue-900 text-white"
                                                    : "border-gray-300 text-transparent"
                                            }`}
                                        >
                                            <i className="fas fa-check"></i>
                                        </span>
                                    </div>

                                    {plan.features && plan.features.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {plan.features.slice(0, 4).map((feature) => (
                                                <div key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <i className="fas fa-check-circle mt-0.5 text-[11px] text-emerald-500"></i>
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {selectedPlanDetails && (
                        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                            <span className="font-bold">{selectedPlanDetails.name}</span>
                            {selectedPlanDetails.price !== undefined && (
                                <span className="ml-2">
                                    Rs. {formatPrice(selectedPlanDetails.price)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Personal Information Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-user text-blue-900"></i>
                    <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                </div>
                <div className="h-px bg-gray-200 w-full mb-6"></div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <i className="fas fa-user"></i>
                            </span>
                            <input 
                                type="text" 
                                value={formData.fullName} 
                                onChange={e => handleInputChange('fullName', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Krishna Rathore"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <i className="fas fa-envelope"></i>
                            </span>
                            <input 
                                type="email" 
                                value={formData.email} 
                                onChange={e => handleInputChange('email', e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="krishna.radio2pir@gmail.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                        <div className="flex items-center gap-2 px-4 bg-white border-r border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
                            <img src={`https://flagcdn.com/24x18/${formData.countryIso}.png`} alt="Country" className="w-5" />
                            <i className="fas fa-chevron-down text-[10px] text-gray-400 ml-1"></i>
                        </div>
                        <div className="flex items-center px-3 bg-gray-50 border-r border-gray-200 text-gray-600 font-bold text-sm">
                            +{formData.dialCode}
                        </div>
                        <input 
                            type="tel" 
                            value={formData.phone} 
                            onChange={e => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-3 outline-none"
                            placeholder="9106035652"
                            required
                        />
                    </div>
                    {showCountryDropdown && (
                        <div className="absolute mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-60 overflow-y-auto">
                            {COUNTRIES.map(c => (
                                <button
                                    key={c.iso}
                                    type="button"
                                    onClick={() => {
                                        touchedFieldsRef.current.add("dialCode");
                                        touchedFieldsRef.current.add("countryIso");
                                        setFormData(p => ({ ...p, dialCode: c.dialCode, countryIso: c.iso }));
                                        setShowCountryDropdown(false);
                                    }}
                                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-left"
                                >
                                    <img src={c.flag} className="w-5" />
                                    <span className="text-sm text-gray-700">{c.name} (+{c.dialCode})</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Address Details Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-map-marker-alt text-blue-900"></i>
                    <h3 className="text-lg font-bold text-gray-800">Address Details</h3>
                </div>
                <div className="h-px bg-gray-200 w-full mb-6"></div>
                
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Detailed Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-4 text-gray-400">
                            <i className="fas fa-map-marker-alt"></i>
                        </span>
                        <input 
                            type="text" 
                            value={formData.address} 
                            onChange={e => handleInputChange('address', e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Flat no, Street, Locality"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input 
                                type="text" 
                                maxLength={6}
                                value={formData.pincode} 
                                onChange={e => handleInputChange('pincode', e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="123456"
                                required
                            />
                            {pincodeLoading && <i className="fas fa-circle-notch fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-900"></i>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={formData.city} 
                            onChange={e => handleInputChange('city', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="City"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            value={formData.state} 
                            onChange={e => handleInputChange('state', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="State"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Appointment Request */}
            <div className="mb-8">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                                <i className="fas fa-calendar-check text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Appointment Request?</h4>
                                <p className="text-xs text-blue-600">Schedule a call with our experts</p>
                            </div>
                        </div>
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                            <button 
                                type="button"
                                onClick={() => setIncludeAppointment(true)}
                                className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${includeAppointment ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Yes
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIncludeAppointment(false)}
                                className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${!includeAppointment ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    {includeAppointment && (
                        <div className="mt-8 animate-fadeIn">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                                        <i className="fas fa-calendar-alt"></i>
                                    </span>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(d: Date | null) => { setSelectedDate(d); setSelectedTimeSlot(''); }}
                                        minDate={new Date()}
                                        filterDate={isWorkingDay}
                                        dateFormat="dd/MM/yyyy"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholderText="14/05/2026"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4">Available Slots <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                    {SLOT_TIMES.map((time) => {
                                        const status = localSlots.find(s => s.time === time);
                                        const isSelected = selectedTimeSlot === time;
                                        const isDisabled = !!status?.is_full || !!status?.is_past;
                                        return (
                                            <button
                                                key={time}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setSelectedTimeSlot(time)}
                                                className={`
                                                    py-3 text-xs font-bold rounded-lg border transition-all
                                                    ${isSelected ? 'bg-blue-900 border-blue-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-900 hover:text-blue-900'}
                                                    ${isDisabled ? 'opacity-30 cursor-not-allowed bg-gray-50' : ''}
                                                `}
                                            >
                                                {formatTimeSlot(time)}
                                            </button>
                                        );
                                    })}
                                </div>
                                {slotRecovery && (
                                    <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                                        <p className="text-xs font-bold text-amber-900">{slotRecovery.title}</p>
                                        <p className="text-[11px] text-amber-700 mt-1">{slotRecovery.description}</p>
                                        {slotRecovery.nextSlot && (
                                            <button type="button" onClick={() => setSelectedTimeSlot(slotRecovery.nextSlot!)} className="mt-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-md hover:bg-amber-600 transition-colors">Move to {formatTimeSlot(slotRecovery.nextSlot!)}</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <i className="fas fa-sticky-note text-blue-900"></i>
                    <h3 className="text-lg font-bold text-gray-800">Additional Information</h3>
                </div>
                <div className="h-px bg-gray-200 w-full mb-6"></div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                    <textarea 
                        value={formData.notes} 
                        onChange={e => handleInputChange('notes', e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                        rows={4} 
                        placeholder="Tell us more about your needs or specifically what you're looking for..." 
                    />
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-lg flex items-center gap-2">
                    <i className="fas fa-exclamation-circle"></i>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={submitLoading} 
                    className="flex-1 max-w-[240px] px-8 py-3 bg-[#1e3a8a] text-white rounded-xl hover:bg-blue-800 transition-all font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                    {submitLoading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-paper-plane"></i>
                            Submit Application
                        </>
                    )}
                </button>
            </div>
          </form>
        </div>

        {/* Sidebar Summary - Legacy Style */}
        {!modalMode && (
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Application Summary</h3>
              
              {selectedService && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 mb-6">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-circle text-amber-500 text-xs"></i>
                        <span className="text-sm font-medium text-amber-700 uppercase">{selectedService.name}</span>
                    </div>
                </div>
              )}

              {selectedPricingPlan && (
                <div className="p-4 rounded-lg border border-slate-100 bg-slate-50 mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Selected Plan</p>
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>{selectedPricingPlan}</span>
                    <span className="text-blue-900">
                      ₹{formatPrice(
                        selectedService?.pricing_plans?.find(
                          (p) => p.name === selectedPricingPlan,
                        )?.price,
                      )}
                    </span>
                  </div>
                </div>
              )}

              {includeAppointment && selectedDate && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <i className="fas fa-calendar text-blue-500"></i>
                        <span className="text-sm font-medium text-blue-700">{selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {selectedTimeSlot && (
                        <div className="flex items-center gap-2">
                            <i className="fas fa-clock text-blue-500"></i>
                            <span className="text-sm font-medium text-blue-700">{formatTimeSlot(selectedTimeSlot)}</span>
                        </div>
                    )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                    <i className="fas fa-info-circle text-blue-500 mr-1"></i>
                    Your information is secure and will only be used for processing your application through our secure compliance engine.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return content;
}
