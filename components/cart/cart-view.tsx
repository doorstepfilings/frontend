"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchCart, removeFromCart, createRazorpayOrder, verifyRazorpayPayment } from "@/lib/features/services/services-slice";
import { loadRazorpay } from "@/lib/utils/razorpay";
import { buildDashboardDocumentsUrl } from "@/lib/utils/payment-navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoredUser } from "@/lib/auth/hooks";

export function CartView() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { cart, cartLoading, paymentLoading } = useAppSelector((state) => state.services);
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
            const cartItemIds = cart.map(item => item.id);
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
                currency: data.currency || 'INR',
                name: 'DoorstepFilings',
                description: 'Service Payment',
                order_id: data.razorpay_order_id,
                handler: async (razorpayResponse: any) => {
                    try {
                        const verification = await dispatch(verifyRazorpayPayment({
                            payment_id: data.payment_id,
                            razorpay_order_id: razorpayResponse.razorpay_order_id,
                            razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                            razorpay_signature: razorpayResponse.razorpay_signature,
                        })).unwrap();
                        
                        toast.success("Payment Successful!");
                        router.push(buildDashboardDocumentsUrl({
                            paymentId: String(data.payment_id),
                            orderId: verification?.data?.order_unique_id,
                            serviceIds: cartItemIds.map(String),
                            message: 'Payment Successful',
                            status: 'success'
                        }));
                    } catch (err) {
                        toast.error("Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.mobile_number || '',
                },
                theme: {
                    color: '#1e3a8a',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: any) {
            toast.error(err || "Checkout initialization failed");
        }
    };

    const subtotal = cart.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const gst = subtotal * 0.18;
    const total = Math.round(subtotal + gst);

    if (cartLoading && cart.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fadeIn">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Checkout Cart</h1>
                <p className="text-sm text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Complete your service acquisition journey</p>
            </div>

            {cart.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-slate-100 p-20 text-center shadow-sm">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <i className="fas fa-shopping-cart text-3xl"></i>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Your cart is empty</h2>
                    <p className="text-sm text-slate-400 font-bold mt-2 uppercase tracking-widest mb-10">Start adding services to your workspace</p>
                    <Link href="/services" className="h-14 px-10 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] inline-flex items-center hover:shadow-xl hover:shadow-blue-900/20 transition-all">
                        Browse Services
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 md:p-10 border-b border-slate-50">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Cart Items ({cart.length})</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-8 md:p-10 group hover:bg-slate-50/50 transition-colors">
                                        <div className="flex gap-8">
                                            <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                                <i className="fas fa-briefcase text-blue-900 text-xl"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                                                            {item.service?.category?.name || "Professional Service"}
                                                        </span>
                                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{item.service?.name}</h3>
                                                        <p className="text-sm text-slate-500 font-bold mt-1 tracking-tight line-clamp-1">{item.service?.short_description}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemove(item.id)}
                                                        disabled={removingId === item.id}
                                                        className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all disabled:opacity-50"
                                                    >
                                                        {removingId === item.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-trash-alt text-xs"></i>}
                                                    </button>
                                                </div>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-tag text-blue-900 text-[10px]"></i>
                                                        <span className="text-sm font-black text-slate-900">₹{Math.round(item.amount).toLocaleString('en-IN')}</span>
                                                    </div>
                                                    {item.form_data?.pricing_plan && (
                                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-lg">
                                                            Plan: {item.form_data.pricing_plan}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Link href="/services" className="inline-flex items-center gap-3 text-[10px] font-black text-blue-900 uppercase tracking-widest hover:translate-x-[-4px] transition-transform">
                            <i className="fas fa-arrow-left"></i>
                            Continue Shopping
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-slate-900/20 sticky top-24">
                            <h2 className="text-2xl font-black tracking-tight mb-10">Order Summary</h2>
                            
                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal</span>
                                    <span className="text-sm font-black text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax (18% GST)</span>
                                    <span className="text-sm font-black text-white">₹{gst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-px bg-white/10 w-full"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                    <span className="text-3xl font-black text-white">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={paymentLoading || cart.length === 0}
                                className="w-full h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {paymentLoading ? <i className="fas fa-spinner animate-spin"></i> : (
                                    <>
                                        Proceed to Payment
                                        <i className="fas fa-arrow-right"></i>
                                    </>
                                )}
                            </button>

                            <div className="mt-10 space-y-4">
                                <SummaryBadge icon="fa-shield-check" label="Secure Payment via Razorpay" />
                                <SummaryBadge icon="fa-headset" label="24/7 Expert Support" />
                                <SummaryBadge icon="fa-bolt" label="Instant Confirmation" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryBadge({ icon, label }: { icon: string, label: string }) {
    return (
        <div className="flex items-center gap-3 opacity-60">
            <i className={`fas ${icon} text-[10px] text-blue-400`}></i>
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
    );
}
