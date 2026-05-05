type PricingPlan = {
  name?: string | null;
  price?: number | string | null;
};

type ServiceLike = {
  amount?: number | string | null;
  form_data?: {
    pricing_plan?: string | null;
  } | null;
  price?: number | string | null;
  pricing_plans?: PricingPlan[] | null;
  service?: {
    price?: number | string | null;
    pricing_plans?: PricingPlan[] | null;
  } | null;
};

export function calculateServicePrice(service?: ServiceLike | null) {
  if (!service) {
    return 0;
  }

  const selectedPlanName = service.form_data?.pricing_plan;
  const pricingPlans = service.service?.pricing_plans ?? service.pricing_plans ?? [];
  const selectedPlan = selectedPlanName
    ? pricingPlans.find((plan) => plan.name === selectedPlanName)
    : null;

  return Number(
    selectedPlan?.price ??
      service.service?.price ??
      service.price ??
      service.amount ??
      0,
  );
}

export function calculateServiceTotal(service?: ServiceLike | null) {
  const basePrice = calculateServicePrice(service);
  const gstAmount = basePrice * 0.18;
  const grandTotal = Math.round(basePrice + gstAmount);

  return {
    basePrice,
    gstAmount,
    grandTotal,
  };
}

export function formatPrice(amount: number | string | null | undefined) {
  return Math.round(Number(amount || 0)).toLocaleString("en-IN");
}
