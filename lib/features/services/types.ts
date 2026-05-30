export type ServiceItem = {
  id: number;
  name: string;
  slug: string;
  link?: string | null;
  price?: number | string;
  short_description?: string;
  long_description?: string;
  benefits?: string[];
  features?: string[];
  pricing_plans?: any[];
  required_documents_list?: any[];
  documents?: any[];
  faqs?: any[];
  status_label?: string;
};

export type ServiceCategory = {
  id?: number;
  category: string;
  slug?: string;
  icon?: string;
  services: ServiceItem[];
};

export type ServicesState = {
  items: ServiceCategory[];
  serviceDetails: ServiceItem | null;
  serviceDetailsLoading: boolean;
  serviceDetailsError: string | null;
  cart: any[];
  myServices: any[];
  myOrders: any[];
  status: "idle" | "loading" | "succeeded" | "failed";
  loading: boolean;
  cartLoading: boolean;
  applyLoading: boolean;
  ordersLoading: boolean;
  paymentLoading: boolean;
  error: string | null;
  cartError: string | null;
  applyError: any | null;
  ordersError: string | null;
  paymentError: string | null;
  applySuccess: boolean;
  paymentSuccess: boolean;
};
