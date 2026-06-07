# Walkthrough - Accountant, RM & Payment Details on Client Service Page

Implemented the feature to display the client's assigned accountant, regional manager, and transactional/payment details directly on the dedicated service application details page.

## Changes Made

### Backend

- **File**: [operations.mapper.ts](file:///d:/project/doorstepfilings/doorstepfilings-backend/src/modules/operations/application/operations.mapper.ts)
  - Updated the service resource mapper `toUserServiceResource` to include `transaction_id` (representing the payment provider's transaction ID) and `payment_method` in the payload returned to the client.

### Frontend

- **File**: [service-application-detail-view.tsx](file:///d:/project/doorstepfilings/doorstepfilings-frontend/components/dashboard/service-application-detail-view.tsx)
  - Updated thunk imports to include `downloadInvoice` and `openBlobInNewTabOrDownload` helper.
  - Added state `invoiceDownloading` and helper variables `assignedAccountant` and `assignedRM` (using `useMemo` hooks).
  - Resolved a React "Rules of Hooks" violation by hoisting the `getMilestoneState` `useMemo` call above early conditional returns.
  - Added a **Support Team** card grid under the Details/Appointment grid to display contact info (name, email, phone) for both the assigned Accountant and Regional Manager.
  - Integrated the **Payment Details** summary card in the right column sidebar to show transactional details (Order ID, Transaction ID, Payment Method, Invoice Number, Date Paid, and a Download Receipt button) when the service has been paid.

---

## Verification Results

### Build & Type Verification
- Ran `npm run typecheck`
  - **Result**: Success. The TypeScript compilation completes with no issues.
- Ran `npm run build`
  - **Result**: Success. The Next.js production build completes with no errors.
