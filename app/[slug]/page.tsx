import { notFound } from "next/navigation";
import { PublicPlaceholder } from "@/components/migration/public-placeholder";

const routeMap: Record<
  string,
  {
    badge: string;
    title: string;
    description: string;
    sourcePath: string;
    nextSteps: string[];
  }
> = {
  about: {
    badge: "Public Route",
    title: "About Page",
    description:
      "The route now exists in Next.js, but the full content and presentation from the current SPA still need to be migrated.",
    sourcePath: "resources/js/pages/About.jsx",
    nextSteps: [
      "Port the existing About page layout into typed Next components.",
      "Move any shared content blocks into reusable public-section components.",
      "Preserve the same CTA structure and visual branding as the current page.",
    ],
  },
  contact: {
    badge: "Public Route",
    title: "Contact Page",
    description:
      "This route is ready for the current enquiry form and contact UI to move over.",
    sourcePath: "resources/js/pages/Contact.jsx",
    nextSteps: [
      "Port the contact form UI and validation logic.",
      "Reconnect form submission to the enquiry API endpoint.",
      "Preserve contact info, WhatsApp behavior, and success messaging.",
    ],
  },
  register: {
    badge: "Auth Route",
    title: "Registration Page",
    description:
      "The Next.js route is in place, but the existing OTP-first registration workflow still lives in Laravel-connected React code.",
    sourcePath: "resources/js/pages/Register.jsx",
    nextSteps: [
      "Port email OTP request and verification flow.",
      "Move registration form validation and RM lookup into typed helpers.",
      "Preserve existing redirect and post-registration auth behavior.",
    ],
  },
  "forgot-password": {
    badge: "Auth Route",
    title: "Forgot Password",
    description:
      "The route is ready, but the current password-reset request UI still needs to be moved into Next.js.",
    sourcePath: "resources/js/pages/ForgotPassword.jsx",
    nextSteps: [
      "Move the forgot-password form and response states.",
      "Reconnect Laravel reset-link API calls through the shared client.",
      "Preserve current messaging and error handling.",
    ],
  },
  cart: {
    badge: "Commerce Route",
    title: "Cart",
    description:
      "This page needs the full cart state, Razorpay order creation, and delete-item behavior moved into the Next data layer.",
    sourcePath: "resources/js/pages/Cart.jsx",
    nextSteps: [
      "Port cart loading and remove-item actions.",
      "Move Razorpay checkout launch and verification handling.",
      "Reconnect payment redirect flow back into dashboard documents.",
    ],
  },
  "confidentiality-policy": {
    badge: "Policy Route",
    title: "Confidentiality Policy",
    description:
      "A Next.js route now exists for this policy page, ready for content migration.",
    sourcePath: "resources/js/pages/ConfidentialityPolicy.jsx",
    nextSteps: [
      "Move policy content into Next public layout.",
      "Preserve typography and legal-page styling.",
      "Consolidate policy pages into reusable static content components.",
    ],
  },
  "refund-policy": {
    badge: "Policy Route",
    title: "Refund Policy",
    description:
      "This legal page is mapped and ready for content migration into Next.js.",
    sourcePath: "resources/js/pages/RefundPolicy.jsx",
    nextSteps: [
      "Move refund policy content.",
      "Keep policy layout consistent across all legal pages.",
      "Preserve route names used in the current footer and payment flows.",
    ],
  },
  "disclaimer-policy": {
    badge: "Policy Route",
    title: "Disclaimer Policy",
    description:
      "This route is created so the current legal content can be ported cleanly.",
    sourcePath: "resources/js/pages/DisclaimerPolicy.jsx",
    nextSteps: [
      "Port disclaimer content from the current React page.",
      "Reuse shared policy layout components.",
      "Verify all footer links resolve inside the Next app.",
    ],
  },
  terms: {
    badge: "Policy Route",
    title: "Terms and Conditions",
    description:
      "The Next route is ready for the existing terms page content.",
    sourcePath: "resources/js/pages/TermsAndConditions.jsx",
    nextSteps: [
      "Move the terms content into Next.js.",
      "Preserve current headings, CTA blocks, and navigation.",
      "Keep exact public route compatibility.",
    ],
  },
  privacy: {
    badge: "Policy Route",
    title: "Privacy Policy",
    description:
      "This route is in place, but the content still needs to move from the current frontend.",
    sourcePath: "resources/js/pages/PrivacyPolicy.jsx",
    nextSteps: [
      "Port the privacy page content and structure.",
      "Preserve legal-page styling and responsive behavior.",
      "Verify footer links and metadata after migration.",
    ],
  },
};

export default async function GenericPublicRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = routeMap[slug];

  if (!config) {
    notFound();
  }

  return <PublicPlaceholder {...config} />;
}
