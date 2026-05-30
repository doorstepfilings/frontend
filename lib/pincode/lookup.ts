export type PincodeLookupResult = {
  city: string;
  pincode: string;
  state: string;
};

export type PincodeLookupResponse =
  | ({ success: true } & PincodeLookupResult)
  | { error: string; success: false };

type PostalApiPostOffice = {
  Block?: string | null;
  DeliveryStatus?: string | null;
  District?: string | null;
  Name?: string | null;
  Pincode?: string | null;
  State?: string | null;
};

type PostalApiRecord = {
  Message?: string | null;
  PostOffice?: PostalApiPostOffice[] | null;
  Status?: string | null;
};

function normalizeValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickPreferredPostOffice(postOffices: PostalApiPostOffice[]) {
  return (
    postOffices.find(
      (postOffice) =>
        normalizeValue(postOffice?.DeliveryStatus).toLowerCase() === "delivery",
    ) ??
    postOffices.find(
      (postOffice) =>
        Boolean(
          normalizeValue(postOffice?.State) &&
            (normalizeValue(postOffice?.District) ||
              normalizeValue(postOffice?.Block) ||
              normalizeValue(postOffice?.Name)),
        ),
    ) ??
    null
  );
}

export function parsePincodeLookupResponse(
  payload: unknown,
  requestedPincode: string,
): PincodeLookupResponse {
  const normalizedPincode = normalizeValue(requestedPincode).replace(/\D/g, "");
  const record = Array.isArray(payload) ? payload[0] : payload;

  if (!record || typeof record !== "object") {
    return {
      error: "Invalid pincode response.",
      success: false,
    };
  }

  const postalRecord = record as PostalApiRecord;
  const status = normalizeValue(postalRecord.Status).toLowerCase();

  if (status !== "success") {
    return {
      error: normalizeValue(postalRecord.Message) || "Pincode not found.",
      success: false,
    };
  }

  const postOffices = Array.isArray(postalRecord.PostOffice)
    ? postalRecord.PostOffice
    : [];
  const preferredPostOffice = pickPreferredPostOffice(postOffices);

  if (!preferredPostOffice) {
    return {
      error: "Pincode not found.",
      success: false,
    };
  }

  const city =
    normalizeValue(preferredPostOffice.District) ||
    normalizeValue(preferredPostOffice.Block) ||
    normalizeValue(preferredPostOffice.Name);
  const state = normalizeValue(preferredPostOffice.State);
  const pincode =
    normalizeValue(preferredPostOffice.Pincode).replace(/\D/g, "") ||
    normalizedPincode;

  if (!city || !state) {
    return {
      error: "Pincode lookup did not return a city and state.",
      success: false,
    };
  }

  return {
    city,
    pincode,
    state,
    success: true,
  };
}
