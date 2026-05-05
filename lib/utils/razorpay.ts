export type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  amount: number;
  currency: string;
  description: string;
  handler?: (response: RazorpayPaymentResponse) => void | Promise<void>;
  key: string;
  name: string;
  order_id: string;
  prefill?: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export const loadRazorpay = () => {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
