"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { useStoredUser } from "@/lib/auth/hooks";
import {
  createRazorpayOrder,
  fetchCart,
  removeFromCart,
  verifyRazorpayPayment,
} from "@/lib/features/services/services-slice";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { buildDashboardDocumentsUrl } from "@/lib/utils/payment-navigation";
import { formatCurrencyFixed, formatPrice } from "@/lib/utils/pricing";
import { loadRazorpay } from "@/lib/utils/razorpay";
import { PageLogoLoader } from "@/components/ui/logo-loader";

export function CartView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { cart, cartLoading, paymentLoading } = useAppSelector(
    (state) => state.services,
  );
  const user = useStoredUser();
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await dispatch(removeFromCart(id)).unwrap();
      toast.success("Item removed from cart");
    } catch (err: any) {
      toast.error(err || "Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const cartItemIds = cart.map((item) => item.id);
      const response = await dispatch(createRazorpayOrder(cartItemIds)).unwrap();
      const data = response?.data || response;

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        toast.error("Razorpay SDK failed to load");
        return;
      }

      const options = {
        key: data.key_id,
        amount: Math.round(data.amount * 100),
        currency: data.currency || "INR",
        name: "DoorstepFilings",
        description: "Service Payment",
        modal: {
          ondismiss: async () => {
            try {
              await apiClient.post("/payments/razorpay/fail", {
                payment_id: data.payment_id,
                reason: "Payment modal closed by user",
              });
            } catch (error) {
              console.warn("Failed to report payment cancellation", error);
            }
          },
        },
        order_id: data.razorpay_order_id,
        handler: async (razorpayResponse: any) => {
          try {
            const verification = await dispatch(
              verifyRazorpayPayment({
                payment_id: data.payment_id,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            ).unwrap();

            toast.success("Payment Successful!");
            router.replace(
              buildDashboardDocumentsUrl({
                paymentId: String(data.payment_id),
                orderId: verification?.data?.order_unique_id,
                serviceIds: cartItemIds.map(String),
                message:
                  "Payment successfully done. You can upload your documents now.",
                status: "success",
              }),
            );
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.mobile_number || "",
        },
        theme: {
          color: "#1e3a8a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response) => {
        try {
          await apiClient.post("/payments/razorpay/fail", {
            payment_id: data.payment_id,
            reason: response.error?.description || "Payment failed",
          });
        } catch (error) {
          console.warn("Failed to report payment failure", error);
        }
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err || "Checkout initialization failed");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const gst = Math.round((subtotal * 0.18 + Number.EPSILON) * 100) / 100;
  const total = Math.round(subtotal + gst);

  if (cartLoading && cart.length === 0) {
    return <PageLogoLoader label="Loading your cart..." />;
  }

  return (
    <div className="animate-fadeIn space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Checkout Cart
        </h1>
        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500 opacity-60">
          Complete your service acquisition journey
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-[3rem] border border-slate-100 bg-white p-20 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-200">
            <i className="fas fa-shopping-cart text-3xl" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Your cart is empty
          </h2>
          <p className="mb-10 mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
            Start adding services to your workspace
          </p>
          <Link
            href="/services"
            className="inline-flex h-14 items-center rounded-2xl bg-blue-900 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:shadow-xl hover:shadow-blue-900/20"
          >
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-50 p-8 md:p-10">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Cart Items ({cart.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="group p-8 transition-colors hover:bg-slate-50/50 md:p-10"
                  >
                    <div className="flex gap-8">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                        <i className="fas fa-briefcase text-xl text-blue-900" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="mb-2 inline-block rounded-md bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600">
                              {item.service?.category?.name ||
                                "Professional Service"}
                            </span>
                            <h3 className="text-lg font-black tracking-tight text-slate-900">
                              {item.service?.name}
                            </h3>
                            <p className="mt-1 line-clamp-1 text-sm font-bold tracking-tight text-slate-500">
                              {item.service?.short_description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={removingId === item.id}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          >
                            {removingId === item.id ? (
                              <i className="fas fa-spinner animate-spin" />
                            ) : (
                              <i className="fas fa-trash-alt text-xs" />
                            )}
                          </button>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-tag text-[10px] text-blue-900" />
                            <span className="text-sm font-black text-slate-900">
                              ₹{formatPrice(item.amount)}
                            </span>
                          </div>
                          {item.form_data?.pricing_plan ? (
                            <div className="rounded-lg border border-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Plan: {item.form_data.pricing_plan}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/services"
              className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-900 transition-transform hover:translate-x-[-4px]"
            >
              <i className="fas fa-arrow-left" />
              Continue Shopping
            </Link>
          </div>

          <div className="space-y-6">
            <div className="sticky top-20 rounded-[2rem] bg-slate-900 p-5 text-white shadow-2xl shadow-slate-900/20 sm:p-8 lg:top-24 lg:rounded-[3rem] lg:p-10">
              <h2 className="mb-6 text-2xl font-black tracking-tight sm:mb-10">
                Order Summary
              </h2>

              <div className="mb-8 space-y-5 sm:mb-10 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Subtotal
                  </span>
                  <span className="text-sm font-black text-white">
                    ₹{formatCurrencyFixed(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Tax (18% GST)
                  </span>
                  <span className="text-sm font-black text-white">
                    ₹{formatCurrencyFixed(gst)}
                  </span>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Total Amount
                  </span>
                  <span className="text-3xl font-black text-white">
                    ₹{formatPrice(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={paymentLoading || cart.length === 0}
                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20 disabled:opacity-50"
              >
                {paymentLoading ? (
                  <i className="fas fa-spinner animate-spin" />
                ) : (
                  <>
                    Proceed to Payment
                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>

              <div className="mt-10 space-y-4">
                <SummaryBadge
                  icon="fa-shield-check"
                  label="Secure Payment via Razorpay"
                />
                <SummaryBadge
                  icon="fa-headset"
                  label="24/7 Expert Support"
                />
                <SummaryBadge
                  icon="fa-bolt"
                  label="Instant Confirmation"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 opacity-60">
      <i className={`fas ${icon} text-[10px] text-blue-400`} />
      <span className="text-[9px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
