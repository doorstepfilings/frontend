# Implementation Plan - Accountant, RM & Payment Details on Client Service Page

Show the client's assigned accountant, regional manager, and transactional/payment details directly on the dedicated service application details page.

## User Review Required

> [!NOTE]
> - The Accountant and Regional Manager details are loaded from the user's profile and the service's direct assignment relations. If not assigned yet, the UI will display a clean "Not Assigned Yet" indicator.
> - Payment details (amount paid, transaction timestamp, order ID, invoice number, and download invoice receipt action) will dynamically render for paid services.

## Proposed Changes

### Frontend Components

---

#### [MODIFY] [service-application-detail-view.tsx](file:///d:/project/doorstepfilings/doorstepfilings-frontend/components/dashboard/service-application-detail-view.tsx)

- Update imports:
  - Add `downloadInvoice` from `@/lib/features/services/services-slice`.
  - Add `openBlobInNewTabOrDownload` from `@/lib/utils/document-helpers`.
- Add state variable `invoiceDownloading` to manage button loading states.
- Retrieve the assigned team members:
  - `assignedAccountant`: Fallback from direct service accountant to user-profile accountant.
  - `assignedRM`: Retrieved from user-profile regional manager.
- Implement the `handleDownloadInvoice` handler to download the invoice PDF.
- Add a new **Support Team** card grid under the Details/Appointment grid to display name, email, and phone contact info of both the Accountant and RM.
- Add a **Payment Details** card in the right column sidebar to show transactional details (Order ID, Invoice ID, Date Paid, and a Download Receipt button) when the service has been paid.

---

## Verification Plan

### Automated Tests
- Run `npm run typecheck` to ensure type safety.
- Run `npm run build` to verify production compilation.

### Manual Verification
1. Navigate to `/dashboard/services/[id]` for a paid service.
2. Confirm the **Payment Details** card is rendered showing the correct amount, Order ID, Invoice number, and a functional "Download Invoice" button.
3. Confirm the **Support Team** card is visible showing the correct Accountant and Regional Manager details.
