export function normalizePaymentServiceIds(
  serviceIds: string | string[] | null | undefined = [],
) {
  if (Array.isArray(serviceIds)) {
    return serviceIds.map((value) => String(value).trim()).filter(Boolean);
  }

  if (typeof serviceIds === "string") {
    return serviceIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (serviceIds === null || serviceIds === undefined) {
    return [];
  }

  return [String(serviceIds).trim()].filter(Boolean);
}

export function buildDashboardDocumentsUrl({
  status = "success",
  message = "Payment Successful",
  paymentId,
  orderId,
  serviceIds = [],
}: {
  status?: string;
  message?: string;
  paymentId?: string;
  orderId?: string;
  serviceIds?: string[] | string;
} = {}) {
  const params = new URLSearchParams();
  const normalizedServiceIds = normalizePaymentServiceIds(serviceIds);

  if (status) {
    params.set("status", status);
  }

  if (message) {
    params.set("message", message);
  }

  if (paymentId) {
    params.set("payment_id", paymentId);
  }

  if (orderId) {
    params.set("order_id", orderId);
  }

  if (normalizedServiceIds.length > 0) {
    params.set("service_ids", normalizedServiceIds.join(","));
  }

  const query = params.toString();
  return query ? `/dashboard/documents?${query}` : "/dashboard/documents";
}
