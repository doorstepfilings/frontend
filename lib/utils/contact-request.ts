export const CONTACT_REQUEST_EVENT = "dsf:open-contact-request";

export type ContactRequestDetails = {
  service?: string;
  message?: string;
  mode?: "contact" | "quote";
};

export function openContactRequest(details: ContactRequestDetails = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ContactRequestDetails>(CONTACT_REQUEST_EVENT, {
      detail: details,
    }),
  );
}
