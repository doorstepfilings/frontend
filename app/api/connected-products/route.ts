import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { auth } from "@/auth";
import { normalizeRole } from "@/lib/auth/redirects";

export interface ConnectedAppItem {
  id: string;
  name: string;
  tagline: string;
  category: "accounting" | "hrms" | "erp" | "legal" | "crm" | "custom";
  description: string;
  icon: string;
  color: string;
  badge?: string;
  url: string;
  apiUrl?: string;
  isReady: boolean;
  features: string[];
  updatedAt?: string;
}

const DEFAULT_ECOSYSTEM_PRODUCTS: ConnectedAppItem[] = [
  {
    id: "doorstep-books",
    name: "Doorstep Books",
    tagline: "Smart Accounting, Invoicing & GST",
    category: "accounting",
    description:
      "Automate your bookkeeping, create GST-compliant invoices, track cash flow, and manage customer ledgers seamlessly.",
    icon: "fa-calculator",
    color: "from-emerald-500 to-teal-700",
    badge: "Active Integration",
    url: "https://books.doorstepfilings.com",
    apiUrl: "https://api-books.doorstepfilings.com/api",
    isReady: true,
    features: [
      "GST & Non-GST Invoicing",
      "Real-time Balance Sheet & P&L",
      "Quotations & Proforma Invoices",
      "Customer & Supplier Ledger",
      "Bank Reconciliation",
    ],
  },
  {
    id: "doorstep-hrms",
    name: "Doorstep HRMS",
    tagline: "People, Payroll & Attendance",
    category: "hrms",
    description:
      "End-to-end employee lifecycle management, automated payroll processing, statutory deductions, and biometric sync.",
    icon: "fa-users-cog",
    color: "from-blue-600 to-indigo-800",
    badge: "Coming Soon",
    url: "#",
    isReady: false,
    features: [
      "Automated Payroll & Payslips",
      "Attendance & Biometric Sync",
      "Leave & Holiday Management",
      "PF, ESI & TDS Calculations",
      "Employee Self-Service Portal",
    ],
  },
  {
    id: "doorstep-erp",
    name: "Doorstep ERP",
    tagline: "Enterprise Operations & Inventory",
    category: "erp",
    description:
      "Multi-warehouse inventory tracking, procurement workflows, bills of materials, and integrated enterprise analytics.",
    icon: "fa-boxes-stacked",
    color: "from-purple-600 to-violet-900",
    badge: "Coming Soon",
    url: "#",
    isReady: false,
    features: [
      "Multi-Warehouse Stock Control",
      "Purchase Orders & Approvals",
      "Barcode & Batch Tracking",
      "Supply Chain Analytics",
      "Custom Workflow Automation",
    ],
  },
];

const DATA_FILE_PATH = path.join(process.cwd(), "data", "ecosystem-products.json");

async function readProductsFromFile(): Promise<ConnectedAppItem[]> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let modified = false;
      const cleaned = parsed.map((item: ConnectedAppItem) => {
        if (item.id === "doorstep-books" && item.url?.includes("staging-books")) {
          modified = true;
          return {
            ...item,
            url: "https://books.doorstepfilings.com",
            apiUrl: "https://api-books.doorstepfilings.com/api",
          };
        }
        return item;
      });

      if (modified) {
        await saveProductsToFile(cleaned);
      }
      return cleaned;
    }
    return DEFAULT_ECOSYSTEM_PRODUCTS;
  } catch {
    // If file doesn't exist, initialize it
    await saveProductsToFile(DEFAULT_ECOSYSTEM_PRODUCTS);
    return DEFAULT_ECOSYSTEM_PRODUCTS;
  }
}

async function saveProductsToFile(products: ConnectedAppItem[]): Promise<void> {
  const dir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(products, null, 2), "utf-8");
}

export async function GET() {
  try {
    const products = await readProductsFromFile();
    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const normalized = normalizeRole(userRole);

    if (normalized !== "super_admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload: 'products' array is required" },
        { status: 400 }
      );
    }

    // Clean products and ensure books app defaults correctly
    const sanitized: ConnectedAppItem[] = products.map((item) => ({
      id: String(item.id || "").trim(),
      name: String(item.name || "").trim(),
      tagline: String(item.tagline || "").trim(),
      category: item.category || "accounting",
      description: String(item.description || "").trim(),
      icon: String(item.icon || "fa-calculator").trim(),
      color: String(item.color || "from-emerald-500 to-teal-700").trim(),
      badge: item.badge ? String(item.badge).trim() : undefined,
      url: String(item.url || "#").trim().replace(/\/$/, ""),
      apiUrl: item.apiUrl ? String(item.apiUrl).trim().replace(/\/$/, "") : undefined,
      isReady: Boolean(item.isReady),
      features: Array.isArray(item.features)
        ? item.features.map(String)
        : ["General Integration"],
      updatedAt: item.updatedAt ? String(item.updatedAt) : new Date().toISOString(),
    }));

    await saveProductsToFile(sanitized);

    return NextResponse.json({
      success: true,
      message: "Ecosystem products saved successfully",
      data: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to save products" },
      { status: 500 }
    );
  }
}
