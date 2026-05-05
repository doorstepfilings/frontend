"use client";

import { isAxiosError } from "axios";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useAuthStatus, useStoredUser } from "@/lib/auth/hooks";
import { usePincodeLookup } from "@/lib/hooks/use-pincode-lookup";
import {
  buildDashboardDocumentsUrl,
} from "@/lib/utils/payment-navigation";
import {
  loadRazorpay,
  type RazorpayCheckoutOptions,
  type RazorpayPaymentResponse,
} from "@/lib/utils/razorpay";
import { OrderSummaryModal } from "./order-summary-modal";

const MAX_FILE_SIZE_BYTES = 1024 * 1024;

type ServiceDocument = {
  id: number;
  document_name?: string | null;
  document_type?: string | null;
  is_required?: boolean;
  max_size?: number | string | null;
};

type Service = {
  id: number;
  name: string;
  slug: string;
  price?: number | string | null;
  short_description?: string | null;
  description?: string | null;
  category?: {
    name?: string | null;
  } | null;
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

type SubmittedApplication = {
  id: number;
  amount?: number | string | null;
  form_data?: {
    pricing_plan?: string | null;
  } | null;
  service?: {
    category?: {
      name?: string | null;
    } | null;
    name?: string | null;
    pricing_plans?: Array<{ name?: string | null; price?: number | string | null }> | null;
    short_description?: string | null;
  } | null;
};

type CreateOrderResponse = {
  data?: {
    amount?: number;
    amount_paise?: number;
    base_amount?: number;
    currency: string;
    gst_amount?: number;
    grand_total?: number;
    key_id: string;
    payment_id: number;
    razorpay_order_id: string;
    service_ids?: string[];
  };
  message?: string;
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

  return [
    {
      file: null,
      is_required: false,
      notes: "",
      type: "",
    },
  ];
}

function buildMultipartPayload({
  appointmentRequest,
  documentRows,
  formData,
  selectedDate,
  selectedPricingPlan,
  selectedService,
  selectedTimeSlot,
}: {
  appointmentRequest: "yes" | "no";
  documentRows: DocumentRow[];
  formData: {
    address: string;
    city: string;
    email: string;
    fullName: string;
    notes: string;
    phone: string;
    pincode: string;
    state: string;
  };
  selectedDate: string;
  selectedPricingPlan: string;
  selectedService: Service;
  selectedTimeSlot: string;
}) {
  const payload = new FormData();
  const formPayload = {
    ...formData,
    appointment_request: appointmentRequest,
    pricing_plan: selectedPricingPlan || null,
    ...(appointmentRequest === "yes"
      ? {
          scheduled_date: selectedDate,
          scheduled_time: selectedTimeSlot,
        }
      : {}),
  };

  const metadata: Array<{
    document_type: "client";
    notes: string | null;
    service_document_id?: number;
    type: string | null;
  }> = [];

  payload.append("service_id", String(selectedService.id));
  payload.append("form_data", JSON.stringify(formPayload));
  payload.append("notes", formData.notes || "");

  documentRows.forEach((row) => {
    if (!row.file) {
      return;
    }

    payload.append("documents", row.file);
    metadata.push({
      document_type: "client",
      notes: row.notes.trim() || null,
      service_document_id: row.service_document_id,
      type: row.type.trim() || null,
    });
  });

  if (metadata.length > 0) {
    payload.append("document_metadata", JSON.stringify(metadata));
  }

  return payload;
}

export function ServiceApplication() {
  const router = useRouter();
  const authStatus = useAuthStatus();
  const user = useStoredUser();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [appointmentRequest, setAppointmentRequest] = useState<"yes" | "no">("yes");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.mobile_number || "",
    address: String(user?.address || ""),
    city: String(user?.city || ""),
    state: String(user?.state || ""),
    pincode: String(user?.pincode || ""),
    notes: "",
  });

  const [selectedPricingPlan, setSelectedPricingPlan] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [documentRows, setDocumentRows] = useState<DocumentRow[]>(createRowsFromService(null));
  const [fileErrors, setFileErrors] = useState<Record<number, string>>({});
  const [createdApplication, setCreatedApplication] = useState<SubmittedApplication | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const applySelectedService = useCallback((service: Service | null) => {
    setSelectedService(service);
    setDocumentRows(createRowsFromService(service));
    setFileErrors({});
    setSelectedDate("");
    setSelectedTimeSlot("");
    setSlots([]);
    setSelectedPricingPlan((current) =>
      current && service?.pricing_plans?.some((plan) => plan.name === current) ? current : "",
    );
  }, []);

  const handlePincodeSuccess = useCallback(({ city, state }: { city: string; state: string }) => {
    setFormData((prev) => ({ ...prev, city, state }));
  }, []);

  const { loading: pincodeLoading } = usePincodeLookup(formData.pincode, handlePincodeSuccess);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.mobile_number || "",
      address: current.address || String(user.address || ""),
      city: current.city || String(user.city || ""),
      state: current.state || String(user.state || ""),
      pincode: current.pincode || String(user.pincode || ""),
    }));
  }, [user]);

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    if (!user) {
      router.push("/login?redirect=/apply-service");
      return;
    }

    async function loadServices() {
      try {
        const response = await apiClient.get<{ data: Service[] }>("/services");
        const loadedServices = response.data.data;
        setServices(loadedServices);
        setStatus("success");

        const stored = localStorage.getItem("selectedService");
        if (!stored) {
          return;
        }

        const storedService = JSON.parse(stored) as Service;
        const matchedService =
          loadedServices.find((service) => service.id === storedService.id) ?? storedService;
        applySelectedService(matchedService);
      } catch {
        setError("Failed to load services");
        setStatus("error");
      }
    }

    void loadServices();
  }, [applySelectedService, authStatus, router, user]);

  useEffect(() => {
    if (selectedService && selectedDate && appointmentRequest === "yes") {
      const serviceId = selectedService.id;

      async function loadSlots() {
        setSlotsLoading(true);
        try {
          const response = await apiClient.get<{ data: Slot[] }>("/service/slot-availability", {
            params: { service_id: serviceId, date: selectedDate },
          });
          setSlots(response.data.data);
        } catch {
          setSlots([]);
        } finally {
          setSlotsLoading(false);
        }
      }

      void loadSlots();
    }
  }, [appointmentRequest, selectedDate, selectedService]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentRow = (index: number, patch: Partial<DocumentRow>) => {
    setDocumentRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  };

  const handleFileChange = (index: number, file: File | null) => {
    if (!file) {
      updateDocumentRow(index, { file: null });
      setFileErrors((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileErrors((current) => ({
        ...current,
        [index]: "Max file size is 1MB.",
      }));
      updateDocumentRow(index, { file: null });
      return;
    }

    setFileErrors((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
    updateDocumentRow(index, { file });
  };

  const validateForm = () => {
    if (!selectedService) {
      setError("Please select a service.");
      return false;
    }

    if (appointmentRequest === "yes") {
      if (!selectedDate) {
        setError("Please select an appointment date.");
        return false;
      }
      if (!selectedTimeSlot) {
        setError("Please select an appointment time slot.");
        return false;
      }
      const slot = slots.find(s => s.time === selectedTimeSlot);
      if (slot?.is_full || slot?.is_past) {
        setError("Selected slot is no longer available.");
        return false;
      }
    }

    if (!formData.fullName?.trim()) {
      setError("Please fill in your full name.");
      return false;
    }
    if (!formData.email?.trim()) {
      setError("Please fill in your email.");
      return false;
    }
    if (!formData.phone?.trim()) {
      setError("Please fill in your phone number.");
      return false;
    }
    if (!formData.address?.trim()) {
      setError("Please fill in your address.");
      return false;
    }
    if (!formData.city?.trim()) {
      setError("Please fill in your city.");
      return false;
    }
    if (!formData.state?.trim()) {
      setError("Please fill in your state.");
      return false;
    }
    if (!formData.pincode?.trim()) {
      setError("Please fill in your pincode.");
      return false;
    }

    const missingRequiredDocument = documentRows.find(
      (row) => row.is_required && !row.file,
    );

    if (missingRequiredDocument) {
      setError("Please upload all required documents before continuing.");
      return false;
    }

    if (Object.keys(fileErrors).length > 0) {
      setError("Please resolve the document upload errors before continuing.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setSubmitLoading(true);

    try {
      const multipart = buildMultipartPayload({
        appointmentRequest,
        documentRows,
        formData,
        selectedDate,
        selectedPricingPlan,
        selectedService: selectedService as Service,
        selectedTimeSlot,
      });

      const response = await apiClient.post<{ data: SubmittedApplication }>("/service/apply", multipart);
      const application = response.data.data;
      setCreatedApplication(application);
      
      localStorage.removeItem("selectedService");
      
      // Instead of going directly to order modal, we match the old flow
      setSuccessMsg("Application submitted successfully!");
      setShowSuccessModal(true);
    } catch (requestError) {
      const message = isAxiosError(requestError)
        ? requestError.response?.data?.message
        : "Failed to submit application";
      setError(message || "Something went wrong");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFinish = () => {
    setShowSuccessModal(false);
    setShowOrderModal(true);
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    router.push("/dashboard/services");
  };

  const handleConfirmPayment = async () => {
    if (!createdApplication?.id) {
      return;
    }

    setPaymentLoading(true);
    setError("");

    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setError("Razorpay SDK failed to load. Please refresh and try again.");
        return;
      }

      const response = await apiClient.post<CreateOrderResponse>("/payments/razorpay/order-single", {
        user_service_id: createdApplication.id,
      });
      const order = response.data.data;

      if (!order?.razorpay_order_id || !order.key_id) {
        setError("Unable to create a payment order right now.");
        return;
      }

      const options: RazorpayCheckoutOptions = {
        amount: order.amount_paise ?? Math.round(Number(order.amount || 0) * 100),
        currency: order.currency,
        description: "Service Payment",
        handler: async (paymentResponse: RazorpayPaymentResponse) => {
          try {
            await apiClient.post("/payments/razorpay/verify", {
              ...paymentResponse,
              payment_id: order.payment_id,
            });
            router.push(
              buildDashboardDocumentsUrl({
                message: "Payment Successful",
                orderId: order.razorpay_order_id,
                paymentId: String(order.payment_id),
                serviceIds: [String(createdApplication.id)],
                status: "success",
              }),
            );
          } catch {
            setError("Payment verification failed. Please check your dashboard.");
          }
        },
        key: order.key_id,
        name: "DoorstepFilings",
        order_id: order.razorpay_order_id,
        prefill: {
          contact: user?.mobile_number ?? undefined,
          email: user?.email ?? undefined,
          name: user?.name ?? undefined,
        },
        theme: {
          color: "#1e3a8a",
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.open();
    } catch {
      setError("Unable to initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="p-20 text-center">Loading application form...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white py-16 -mt-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Service Application</h1>
          <p className="text-blue-200">Complete your service application</p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-gray-500">
            <Link href="/" className="hover:text-amber-500">Home</Link> /
            <Link href="/services" className="hover:text-amber-500"> Services</Link> /
            <span className="text-gray-800"> Application</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Application Form */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Service Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-briefcase text-blue-900"></i>
                  Select Service
                </h3>
                <select
                  value={selectedService?.id || ""}
                  onChange={(e) => {
                    const service = services.find(s => s.id === parseInt(e.target.value));
                    applySelectedService(service || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  <option value="">-- Select a service --</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Plan Selection */}
              {selectedService && selectedService.pricing_plans && selectedService.pricing_plans.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-tags text-blue-900"></i>
                    Select Pricing Plan
                  </h3>
                  <div className="space-y-3">
                    {selectedService.pricing_plans.map((plan, index) => (
                      <label
                        key={index}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedPricingPlan === plan.name
                            ? "border-blue-900 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pricing_plan"
                          value={plan.name}
                          checked={selectedPricingPlan === plan.name}
                          onChange={() => setSelectedPricingPlan(plan.name)}
                          className="w-5 h-5 text-blue-900 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{plan.name}</div>
                          {plan.features && plan.features.length > 0 && (
                            <div className="text-sm text-gray-500 mt-0.5">
                              {plan.features.slice(0, 2).join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="text-xl font-bold text-amber-600">&#8377;{Math.ceil(plan.price)}</div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointment Request */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-calendar-check text-blue-900"></i>
                  Appointment Request
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Do you need an appointment for this service?
                    </label>
                    <div className="space-y-3">
                      <label
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          appointmentRequest === "yes"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="appointment_request"
                          value="yes"
                          checked={appointmentRequest === "yes"}
                          onChange={(e) => setAppointmentRequest(e.target.value as "yes" | "no")}
                          className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">Yes, I need an appointment</div>
                          <div className="text-sm text-gray-600">Schedule a time slot for service completion</div>
                        </div>
                      </label>
                      <label
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          appointmentRequest === "no"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="appointment_request"
                          value="no"
                          checked={appointmentRequest === "no"}
                          onChange={(e) => setAppointmentRequest(e.target.value as "yes" | "no")}
                          className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">No, I don't need an appointment</div>
                          <div className="text-sm text-gray-600">Service will be processed without scheduling</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  {appointmentRequest === "yes" && (
                    <div className="border-l-2 border-gray-200 pl-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Slot Availability</h4>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Preferred Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTimeSlot("");
                        }}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />

                      <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">
                        Available Slots <span className="text-red-500">*</span>
                      </label>
                      {slotsLoading && <p className="text-xs text-gray-500 mb-2">Loading slot availability...</p>}
                      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-3">
                        {slots.map((slot) => {
                          const isDisabled = slot.is_past || slot.is_full;
                          return (
                            <button
                              type="button"
                              key={slot.time}
                              disabled={isDisabled}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                selectedTimeSlot === slot.time && !isDisabled
                                  ? "bg-blue-900 border-blue-900 text-white shadow-lg transform scale-[1.02]"
                                  : isDisabled
                                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-white border-gray-100 text-gray-600 hover:border-blue-200 hover:text-blue-900 hover:bg-blue-50/30"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Header */}
              {selectedService && (
                <div className="mb-8 pb-6 border-b border-gray-100">
                  {selectedService.category?.name && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full mb-3">
                      {selectedService.category.name}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedService.name}</h2>
                  {selectedService.description && <p className="text-gray-600">{selectedService.description}</p>}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                  <i className="fas fa-check-circle"></i>
                  {successMsg}
                </div>
              )}

              {/* Personal Information */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-user text-blue-900"></i>
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter your address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={(e) => handleInputChange("pincode", e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
                        placeholder="Pincode"
                      />
                      {pincodeLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <i className="fas fa-spinner fa-spin text-blue-900"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                      <input
                        required
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="State"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Upload Section */}
              {selectedService && (
                <div className="mb-12">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <i className="fas fa-folder-open text-sm"></i>
                    </div>
                    Document Upload
                  </h3>

                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl mb-8">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
                      <div>
                        <p className="text-sm font-bold text-amber-900 uppercase tracking-tight">
                          Requirement Policy
                        </p>
                        <p className="text-xs text-amber-800 font-medium mt-1">
                          Items marked as required must be uploaded to proceed. Max file size is 1MB per document.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {documentRows.map((row, index) => (
                      <div
                        key={`${row.service_document_id ?? "row"}-${index}`}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                          <div className="grid flex-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Document Type {row.is_required && <span className="text-red-500">*</span>}
                              </label>
                              <input
                                type="text"
                                value={row.type}
                                onChange={(event) => updateDocumentRow(index, { type: event.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                                placeholder="e.g. Aadhaar Card"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Upload File
                              </label>
                              <div
                                className={`rounded-lg border border-dashed bg-white p-3 transition-all ${
                                  fileErrors[index] ? "border-red-300 bg-red-50" : "border-gray-300"
                                }`}
                              >
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(event) => handleFileChange(index, event.target.files?.[0] ?? null)}
                                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {row.file && (
                                  <p className="mt-2 text-xs font-medium text-gray-600">Selected: {row.file.name}</p>
                                )}
                                {fileErrors[index] && (
                                  <p className="mt-2 text-xs font-medium text-red-600">{fileErrors[index]}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {documentRows.length > 1 && !row.is_required && (
                            <button
                              type="button"
                              onClick={() =>
                                setDocumentRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
                              }
                              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <i className="fas fa-trash-alt"></i> Remove
                            </button>
                          )}
                        </div>

                        <div className="mt-4">
                          <label className="mb-2 block text-sm font-semibold text-gray-700">Notes (Optional)</label>
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(event) => updateDocumentRow(index, { notes: event.target.value })}
                            placeholder="Add any specific detail about this document..."
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setDocumentRows((current) => [...current, { file: null, is_required: false, notes: "", type: "" }])
                      }
                      className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      + Add Document Row
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-sticky-note text-blue-900"></i>
                  Additional Notes
                </h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows={4}
                  placeholder="Any additional information you'd like to share..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Link
                  href="/dashboard/services"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <i className="fas fa-check"></i>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Application Summary</h3>

              {selectedService && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 mb-6">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-circle text-amber-500 text-xs"></i>
                    <span className="text-sm font-medium text-amber-700">{selectedService.name}</span>
                  </div>
                </div>
              )}

              {selectedDate && selectedTimeSlot && (
                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fas fa-calendar text-blue-500"></i>
                    <span className="text-sm font-medium text-blue-700">
                      {new Date(selectedDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-clock text-blue-500"></i>
                    <span className="text-sm font-medium text-blue-700">{selectedTimeSlot}</span>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  <i className="fas fa-info-circle text-blue-500 mr-1"></i>
                  Your information is secure and will only be used for processing your application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-green-600 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">
              Your service application has been submitted successfully. You can track the status in your "My Services" page.
            </p>
            <button
              onClick={handleFinish}
              className="w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      <OrderSummaryModal
        isOpen={showOrderModal}
        loading={paymentLoading}
        onClose={handleCloseOrderModal}
        onConfirm={() => void handleConfirmPayment()}
        service={createdApplication}
      />
    </div>
  );
}
