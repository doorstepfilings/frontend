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

function toCurrencyNumber(amount: number | string | null | undefined) {
  const numericAmount = Number(amount ?? 0);
  return Number.isFinite(numericAmount) ? numericAmount : 0;
}

export function hasPositivePrice(
  amount: number | string | null | undefined,
) {
  return toCurrencyNumber(amount) > 0;
}

export function getServicePurchasePrice(service?: ServiceLike | null) {
  if (!service) {
    return null;
  }

  const pricingPlans = service.service?.pricing_plans ?? service.pricing_plans ?? [];
  const positivePlanPrices = pricingPlans
    .map((plan) => toCurrencyNumber(plan.price))
    .filter((price) => price > 0);
  const basePrice = toCurrencyNumber(
    service.service?.price ?? service.price ?? service.amount,
  );
  const positivePrices = [
    ...(basePrice > 0 ? [basePrice] : []),
    ...positivePlanPrices,
  ];

  return positivePrices.length > 0 ? Math.min(...positivePrices) : null;
}

export function isServicePurchasable(service?: ServiceLike | null) {
  return getServicePurchasePrice(service) !== null;
}

export function roundCurrency(amount: number | string | null | undefined) {
  return Math.round((toCurrencyNumber(amount) + Number.EPSILON) * 100) / 100;
}

export function calculateServicePrice(service?: ServiceLike | null) {
  if (!service) {
    return 0;
  }

  const selectedPlanName = service.form_data?.pricing_plan;
  const pricingPlans = service.service?.pricing_plans ?? service.pricing_plans ?? [];
  const selectedPlan = selectedPlanName
    ? pricingPlans.find((plan) => plan.name === selectedPlanName)
    : null;

  return toCurrencyNumber(
    selectedPlan?.price ??
      service.service?.price ??
      service.price ??
      service.amount ??
      0,
  );
}

export function calculateServiceTotal(service?: ServiceLike | null) {
  const basePrice = calculateServicePrice(service);
  const gstAmount = roundCurrency(basePrice * 0.18);
  const grandTotal = Math.round(basePrice + gstAmount);

  return {
    basePrice,
    gstAmount,
    grandTotal,
  };
}

export function formatCurrency(
  amount: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  return roundCurrency(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  });
}

export function formatCurrencyFixed(
  amount: number | string | null | undefined,
) {
  return formatCurrency(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPrice(amount: number | string | null | undefined) {
  return formatCurrency(amount);
}
