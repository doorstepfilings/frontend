"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DocumentUpload } from "@/components/ui/document-upload";
import { LoginModal } from "@/components/auth/login-modal";
import { PublicShell } from "@/components/layout/public-shell";
import { usePincodeLookup } from "@/hooks/use-pincode-lookup";
import { useStoredUser } from "@/lib/auth/hooks";
import { getStoredToken, setStoredUser } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { apiClient } from "@/lib/api/client";
import { parseApiError } from "@/lib/utils/error-parser";
import { getDocumentIcon } from "@/lib/utils/document-helpers";
import { formatPrice } from "@/lib/utils/pricing";
import {
  SLOT_TIMES,
  formatTimeSlot,
  isWorkingDay,
  findNextWorkingDay,
  getAvailableSlots,
  getNextAvailableSlot,
} from "@/lib/utils/slot-helpers";
import {
  fetchServiceDetails,
  addToCart,
  applyForService,
  clearApplyStatus,
  clearServiceDetails,
} from "@/lib/features/services/services-slice";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

type ProfileResponse = {
  data?: AuthUser | null;
  user?: AuthUser | null;
};

const parsePhoneNumber = (fullNumber: string) => {
  if (!fullNumber) return { phone: "", dialCode: "91", countryIso: "in" };
  const cleanNumber = fullNumber.startsWith("+") ? fullNumber.slice(1) : fullNumber;
  const dialCodes = ["91", "1", "44", "971", "966", "965", "974"];
  const dialCodeToIso: Record<string, string> = {
    "91": "in",
    "1": "us",
    "44": "gb",
    "971": "ae",
    "966": "sa",
    "965": "kw",
    "974": "qa",
  };

  for (const code of dialCodes) {
    if (cleanNumber.startsWith(code)) {
      return {
        dialCode: code,
        phone: cleanNumber.slice(code.length),
        countryIso: dialCodeToIso[code] ?? "in",
      };
    }
  }

  return { phone: cleanNumber, dialCode: "91", countryIso: "in" };
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

export default function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    serviceDetails,
    loading,
    error,
    cartError,
    applyLoading,
    applyError,
    applySuccess,
  } = useAppSelector((state) => state.services);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedPricingPlan, setSelectedPricingPlan] = useState("");
  const [slotAvailability, setSlotAvailability] = useState<Record<string, any>>({});
  const [slotLoading, setSlotLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [includeAppointment, setIncludeAppointment] = useState(false);
  const user = useStoredUser();

  const [applyFormData, setApplyFormData] = useState({
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

  const [rows, setRows] = useState<any[]>([]);
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});

  const COUNTRIES = [
    { iso: "in", name: "India", dialCode: "91", flag: "https://flagcdn.com/24x18/in.png" },
    { iso: "us", name: "United States", dialCode: "1", flag: "https://flagcdn.com/24x18/us.png" },
    { iso: "gb", name: "United Kingdom", dialCode: "44", flag: "https://flagcdn.com/24x18/gb.png" },
    { iso: "ae", name: "UAE", dialCode: "971", flag: "https://flagcdn.com/24x18/ae.png" },
    { iso: "sa", name: "Saudi Arabia", dialCode: "966", flag: "https://flagcdn.com/24x18/sa.png" },
    { iso: "kw", name: "Kuwait", dialCode: "965", flag: "https://flagcdn.com/24x18/kw.png" },
    { iso: "qa", name: "Qatar", dialCode: "974", flag: "https://flagcdn.com/24x18/qa.png" },
  ];

  useEffect(() => {
    if (slug) {
      dispatch(fetchServiceDetails(slug));
    }
    return () => {
      dispatch(clearServiceDetails());
    };
  }, [slug, dispatch]);

  const handlePincodeSuccess = useCallback(({ city, state }: { city: string, state: string }) => {
    setApplyFormData((prev) => ({ ...prev, city, state }));
  }, []);

  const handleCloseApplyModal = useCallback(() => {
    setShowApplyModal(false);
    setSlotAvailability({});
    setSelectedTimeSlot("");
  }, []);

  const { loading: pincodeLoading } = usePincodeLookup(
    applyFormData.pincode,
    handlePincodeSuccess
  );

  const handleAddToCart = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (serviceDetails) {
      dispatch(addToCart(serviceDetails.id))
        .unwrap()
        .then(() => {
          setAddedToCart(true);
          toast.success("Added to cart!");
          setTimeout(() => setAddedToCart(false), 3000);
        })
        .catch((err) => {
          toast.error(err);
        });
    }
  };

  const handleApplyNow = (preselectedPlan = "") => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (serviceDetails) {
      const parsedPhone = parsePhoneNumber(String(user.mobile_number ?? ""));
      setApplyFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: parsedPhone.phone,
        dialCode: parsedPhone.dialCode,
        countryIso: parsedPhone.countryIso,
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode ? String(user.pincode) : "",
      }));

      if (serviceDetails.documents) {
        setRows(
          serviceDetails.documents.map((doc: any) => ({
            file: null,
            type: doc.document_name || doc.document_type || "",
            notes: "",
            is_required: !!doc.is_required,
            service_document_id: doc.id,
          }))
        );
      } else {
        setRows([{ file: null, type: "", notes: "" }]);
      }

      setFileErrors({});
      setSelectedDate(null);
      setSelectedTimeSlot("");
      setSelectedPricingPlan(preselectedPlan || serviceDetails.pricing_plans?.[0]?.name || "");
      setIncludeAppointment(false);
      setSlotAvailability({});
      dispatch(clearApplyStatus());
      setShowApplyModal(true);
    }
  };

  useEffect(() => {
    if (!showApplyModal || !user) {
      return;
    }

    let isMounted = true;

    async function hydrateApplyProfile() {
      try {
        const response = await apiClient.get<ProfileResponse>("/user");
        const profile = resolveProfileFromResponse(response.data);

        if (!profile || !isMounted) {
          return;
        }

        const parsedPhone = parsePhoneNumber(String(profile.mobile_number ?? ""));
        setStoredUser(profile);
        setApplyFormData((prev) => ({
          ...prev,
          fullName: String(profile.name ?? ""),
          email: String(profile.email ?? ""),
          phone: parsedPhone.phone,
          dialCode: parsedPhone.dialCode,
          countryIso: parsedPhone.countryIso,
          address: String(profile.address ?? ""),
          city: String(profile.city ?? ""),
          state: String(profile.state ?? ""),
          pincode: String(profile.pincode ?? ""),
        }));
      } catch {
        // Keep the modal usable with stored user details if the profile request fails.
      }
    }

    void hydrateApplyProfile();

    return () => {
      isMounted = false;
    };
  }, [showApplyModal, user]);

  const formatDateForApi = (date: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchSlotAvailability = useCallback(async (serviceId: number | string, date: Date) => {
    if (!serviceId || !date) {
      setSlotAvailability({});
      return {};
    }

    try {
      setSlotLoading(true);
      const token = await getStoredToken();
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/service/slot-availability`, {
        params: {
          service_id: serviceId,
          date: formatDateForApi(date),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response?.data?.data || [];
      const mapped = data.reduce((acc: any, slot: any) => {
        acc[slot.time] = slot;
        return acc;
      }, {});
      setSlotAvailability(mapped);
      return mapped;
    } catch (err) {
      setSlotAvailability({});
      return {};
    } finally {
      setSlotLoading(false);
    }
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (includeAppointment && (!selectedDate || !selectedTimeSlot)) {
      toast.error("Please select both a date and a time slot for your appointment");
      return;
    }

    const missingDocs = rows.filter((r) => r.is_required && !r.file);
    if (missingDocs.length > 0) {
      toast.error(`Please upload the mandatory document: ${missingDocs[0].type}`);
      return;
    }

    if (!serviceDetails?.id) return;

    const fullMobile = `+${applyFormData.dialCode}${applyFormData.phone}`;

    const submitFormData = new FormData();
    submitFormData.append("service_id", String(serviceDetails.id));
    submitFormData.append(
      "form_data",
      JSON.stringify({
        fullName: applyFormData.fullName,
        email: applyFormData.email,
        phone: fullMobile,
        address: applyFormData.address,
        city: applyFormData.city,
        state: applyFormData.state,
        pincode: applyFormData.pincode,
        appointment_request: includeAppointment ? "yes" : "no",
        scheduled_date: includeAppointment ? formatDateForApi(selectedDate!) : null,
        scheduled_time: includeAppointment ? selectedTimeSlot : null,
        pricing_plan: selectedPricingPlan || null,
      })
    );
    submitFormData.append("notes", applyFormData.notes || "");

    rows.forEach((row, index) => {
      if (row.file) {
        submitFormData.append(`documents[${index}][file]`, row.file);
        if (row.service_document_id) {
          submitFormData.append(`documents[${index}][service_document_id]`, row.service_document_id);
        }
        submitFormData.append(`documents[${index}][type]`, row.type);
        if (row.notes) {
          submitFormData.append(`documents[${index}][notes]`, row.notes);
        }
      }
    });

    try {
      await dispatch(applyForService(submitFormData)).unwrap();
      toast.success("Application submitted successfully.");
      handleCloseApplyModal();
      router.push("/dashboard/services");
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const getSlotRecovery = (availabilityMap = slotAvailability) => {
    if (!selectedDate || slotLoading || Object.keys(availabilityMap).length === 0) {
      return null;
    }

    const selectedSlotState = selectedTimeSlot ? availabilityMap[selectedTimeSlot] : null;
    const nextSlot = getNextAvailableSlot({
      slotAvailability: availabilityMap,
      selectedTimeSlot,
      slotTimes: SLOT_TIMES,
    });
    const nextDate = findNextWorkingDay(selectedDate);

    if (selectedSlotState?.is_full || selectedSlotState?.is_past) {
      return {
        title: selectedSlotState?.is_full ? "This slot was just booked." : "This time is already over.",
        nextSlot,
        nextDate,
      };
    }
    return null;
  };

  const slotRecovery = getSlotRecovery();
  const selectedPlanDetails =
    selectedPricingPlan && serviceDetails?.pricing_plans
      ? serviceDetails.pricing_plans.find((plan: any) => plan.name === selectedPricingPlan) ?? null
      : null;

  if (loading) {
    return (
      <PublicShell>
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-900 border-t-transparent"></div>
            <p className="text-gray-600">Loading service details...</p>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (error && !serviceDetails) {
    return (
      <PublicShell>
        <div className="flex min-h-[60vh] items-center justify-center bg-gray-50">
          <div className="mx-auto max-w-md px-4 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">Service Not Found</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link href="/services">
              <Button className="bg-blue-900 hover:bg-blue-800">
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  const service = serviceDetails;

  return (
    <>
      <PublicShell>
        <div className="min-h-screen bg-gray-50 pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-blue-900 py-20 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-amber-400 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 transform rounded-full bg-blue-400 blur-3xl"></div>
          </div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{service?.name}</h1>
            <p className="mx-auto max-w-2xl text-xl text-blue-200">
              Professional handling of your {service?.name?.toLowerCase()} needs with precision and care.
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-3">
            <p className="text-sm text-gray-500">
              <Link href="/" className="hover:text-amber-500">Home</Link> /
              <Link href="/services" className="hover:text-amber-500"> Services</Link> /
              <span className="text-gray-800"> {service?.name}</span>
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Main Content */}
            <div className="lg:w-2/3">
              <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-800">
                  <i className="fas fa-align-left text-blue-900"></i>
                  Service Overview
                </h2>
                {service?.long_description ? (
                  <div
                    className="quill-content prose prose-blue max-w-none leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ __html: service.long_description }}
                  />
                ) : (
                  <p className="leading-relaxed text-gray-600">
                    {service?.short_description || "Professional handling of your requirements with precision and care."}
                  </p>
                )}
              </div>

              {/* Pricing Plans */}
              {service?.pricing_plans && service.pricing_plans.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <i className="fas fa-tags text-blue-900"></i>
                    Pricing Plans
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {service.pricing_plans.map((plan: any, index: number) => (
                      <div key={index} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
                        <div className="bg-blue-900 p-6 text-center text-white">
                          <h4 className="mb-1 text-lg font-bold">{plan.name}</h4>
                          <div className="text-2xl font-black text-amber-400">₹{formatPrice(plan.price)}</div>
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <ul className="mb-6 flex-1 space-y-3">
                            {(plan.features || []).map((feature: string, fIndex: number) => (
                              <li key={fIndex} className="flex items-start gap-2 text-sm text-gray-600">
                                <i className="fas fa-check mt-1 text-green-500"></i>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button
                            onClick={() => handleApplyNow(plan.name)}
                            variant="outline"
                            className="w-full rounded-lg border-blue-100 bg-blue-50 font-bold text-blue-900 hover:bg-blue-900 hover:text-white"
                          >
                            Select Plan
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {(service?.required_documents_list?.length || 0) > 0 && (
                <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-gray-800">
                    <i className="fas fa-file-alt text-amber-500"></i>
                    Required Documents
                  </h2>
                  <p className="mb-6 text-gray-600">
                    Please prepare the following documents. Items marked with <span className="text-red-500">*</span> are mandatory.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {service?.required_documents_list?.map((doc: any, index: number) => (
                      <div key={index} className={`rounded-xl border p-4 transition-all ${doc.is_required ? "border-amber-100 bg-amber-50/30" : "border-gray-100 bg-gray-50/50"}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${doc.is_required ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-600"}`}>
                            <i className="fas fa-file"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-800">
                              {doc.name} {doc.is_required && <span className="text-red-500">*</span>}
                            </h4>
                            {doc.description && <p className="mt-1 text-xs text-gray-500">{doc.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border-t-4 border-amber-500 bg-white p-6 shadow-lg">
                  {service?.price && (
                    <div className="mb-4 text-center">
                      <p className="text-sm text-gray-500">Starting from</p>
                      <p className="text-4xl font-bold text-blue-900">₹{formatPrice(service.price)}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">+ GST | Govt. fee extra</p>
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-bold text-gray-900">Apply for Service</h3>
                  <p className="mb-6 text-sm text-gray-600">
                    Get started with your {service?.name?.toLowerCase()} application today.
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() => handleApplyNow()}
                      className="w-full rounded-xl bg-amber-500 py-6 text-base font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600"
                    >
                      <i className="fas fa-bolt mr-2"></i>
                      Apply Now
                    </Button>
                    <Link href="/contact" className="block">
                      <Button variant="outline" className="w-full rounded-xl border-2 border-blue-900 py-6 text-base font-bold text-blue-900 hover:bg-blue-900 hover:text-white">
                        <i className="fas fa-phone mr-2"></i>
                        Contact Us
                      </Button>
                    </Link>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-shield-alt text-green-500"></i>
                      <span>Secure Application Process</span>
                    </div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-clock text-blue-500"></i>
                      <span>Fast Processing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-headset text-amber-500"></i>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-800 p-6 text-white shadow-lg">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                    <i className="fas fa-headset"></i>
                    Need Help?
                  </h3>
                  <p className="mb-4 text-sm text-blue-100">
                    Our experts are available to answer your questions about this service.
                  </p>
                  <a
                    href="tel:+918401626032"
                    className="flex items-center gap-3 rounded-lg bg-white/10 p-3 transition-colors hover:bg-white/20"
                  >
                    <i className="fas fa-phone-alt text-amber-400"></i>
                    <span className="font-semibold">+91 84016 26032</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </PublicShell>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={handleCloseApplyModal}
        title={`Apply for ${service?.name}`}
        size="xl"
      >
        <form onSubmit={handleApplySubmit} className="space-y-8">
          {service?.pricing_plans && service.pricing_plans.length > 0 && (
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 border-b pb-2 text-base font-semibold text-gray-800">
                <i className="fas fa-box-open text-blue-900"></i>
                {service.pricing_plans.length > 1 ? "Choose Package" : "Selected Package"}
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {service.pricing_plans.map((plan: any, index: number) => {
                  const isSelected = selectedPricingPlan === plan.name;

                  return (
                    <button
                      key={`${plan.name}-${index}`}
                      type="button"
                      onClick={() => setSelectedPricingPlan(plan.name)}
                      className={`rounded-2xl border p-5 text-left transition-all ${
                        isSelected
                          ? "border-blue-900 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-gray-900">{plan.name}</p>
                          <p className="mt-1 text-sm font-semibold text-blue-900">
                            Rs. {formatPrice(plan.price)}
                          </p>
                        </div>
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                            isSelected
                              ? "border-blue-900 bg-blue-900 text-white"
                              : "border-gray-300 text-transparent"
                          }`}
                        >
                          <i className="fas fa-check"></i>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPlanDetails && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <span className="font-bold">{selectedPlanDetails.name}</span>
                  <span className="ml-2">Rs. {formatPrice(selectedPlanDetails.price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 border-b pb-2 text-base font-semibold text-gray-800">
              <i className="fas fa-user text-blue-900"></i>
              Personal Information
            </h4>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={applyFormData.fullName}
                  onChange={(e) => setApplyFormData({ ...applyFormData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={applyFormData.email}
                  onChange={(e) => setApplyFormData({ ...applyFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Mobile Number *</label>
                <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-900/20">
                  <button
                    type="button"
                    className="flex min-w-[80px] items-center justify-center gap-2 border-r bg-gray-50 px-3 hover:bg-gray-100"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  >
                    <img src={`https://flagcdn.com/24x18/${applyFormData.countryIso}.png`} alt="flag" className="h-3.5 w-5" />
                    <i className="fas fa-chevron-down text-[10px] text-gray-400"></i>
                  </button>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-400">+{applyFormData.dialCode}</span>
                    <input
                      type="text"
                      value={applyFormData.phone}
                      onChange={(e) => setApplyFormData({ ...applyFormData, phone: e.target.value.replace(/\D/g, "") })}
                      className="w-full border-none py-3 pl-12 pr-4 outline-none"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
                {showCountryDropdown && (
                  <div className="absolute z-[70] mt-2 max-h-64 w-64 overflow-y-auto rounded-xl border bg-white py-2 shadow-2xl">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.iso}
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                        onClick={() => {
                          setApplyFormData({ ...applyFormData, dialCode: c.dialCode, countryIso: c.iso });
                          setShowCountryDropdown(false);
                        }}
                      >
                        <img src={c.flag} className="h-3.5 w-5" alt={c.name} />
                        <span className="flex-1 text-sm">{c.name}</span>
                        <span className="text-xs text-gray-400">+{c.dialCode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 border-b pb-2 text-base font-semibold text-gray-800">
              <i className="fas fa-map-marker-alt text-blue-900"></i>
              Address Details
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Detailed Address *</label>
                <input
                  type="text"
                  required
                  value={applyFormData.address}
                  onChange={(e) => setApplyFormData({ ...applyFormData, address: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  placeholder="Flat no, Street, Locality"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Pincode *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={applyFormData.pincode}
                      onChange={(e) => setApplyFormData({ ...applyFormData, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                      placeholder="123456"
                    />
                    {pincodeLoading && <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-900"></i>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">City *</label>
                  <input
                    type="text"
                    required
                    value={applyFormData.city}
                    onChange={(e) => setApplyFormData({ ...applyFormData, city: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">State *</label>
                  <input
                    type="text"
                    required
                    value={applyFormData.state}
                    onChange={(e) => setApplyFormData({ ...applyFormData, state: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appointment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-md">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Appointment Request?</h4>
                  <p className="text-[10px] font-medium text-blue-700 uppercase tracking-widest">Schedule a call with our experts</p>
                </div>
              </div>
              <div className="flex items-center rounded-lg border border-blue-100 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setIncludeAppointment(true)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${includeAppointment ? "bg-blue-900 text-white shadow-md" : "text-gray-400 hover:text-blue-900"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeAppointment(false)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!includeAppointment ? "bg-blue-900 text-white shadow-md" : "text-gray-400 hover:text-blue-900"}`}
                >
                  No
                </button>
              </div>
            </div>

            {includeAppointment && (
              <div className="animate-fadeIn space-y-4">
                <div className="relative">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Select Date *</label>
                  <div className="relative">
                    <i className="fas fa-calendar-alt absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400"></i>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date: Date | null) => {
                        setSelectedDate(date);
                        setSelectedTimeSlot("");
                        if (!date || !serviceDetails?.id) {
                          setSlotAvailability({});
                          return;
                        }
                        void fetchSlotAvailability(serviceDetails.id, date);
                      }}
                      minDate={new Date()}
                      filterDate={isWorkingDay}
                      dateFormat="dd/MM/yyyy"
                      className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-900/20"
                      placeholderText="Choose appointment date"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700">Available Slots *</label>
                    <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
                      {SLOT_TIMES.map((slot) => {
                        const isPast = !!slotAvailability[slot]?.is_past;
                        const isFull = !!slotAvailability[slot]?.is_full;
                        const isDisabled = isPast || isFull;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`rounded-xl border-2 py-3 px-2 text-xs font-bold transition-all ${selectedTimeSlot === slot
                              ? "bg-blue-900 border-blue-900 text-white shadow-lg"
                              : isDisabled
                                ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                                : "bg-white border-gray-100 text-gray-600 hover:border-blue-200"
                              }`}
                          >
                            {formatTimeSlot(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {slotRecovery && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-900">{slotRecovery.title}</p>
                    <div className="mt-3 flex gap-2">
                      {slotRecovery.nextSlot && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSelectedTimeSlot(slotRecovery.nextSlot || "")}
                          className="bg-blue-900 text-xs text-white"
                        >
                          Move to {formatTimeSlot(slotRecovery.nextSlot)}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Button variant="outline" type="button" onClick={handleCloseApplyModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={applyLoading} className="bg-blue-900 px-8 py-6 text-base font-bold text-white hover:bg-blue-800">
              {applyLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-paper-plane mr-2 text-amber-400"></i>}
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
