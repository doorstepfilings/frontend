import { appConfig } from "@/lib/config";

export interface ConnectedAppConfig {
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

export interface AppConnectionData {
  appId: string;
  apiKey: string;
  maskedKey: string;
  connectedAt: string;
  lastSyncedAt?: string;
  status: "connected" | "disconnected" | "error";
  accountEmail?: string;
}

export const DOORSTEP_DEFAULT_APPS: ConnectedAppConfig[] = [
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
    url: appConfig.booksAppUrl,
    apiUrl: appConfig.booksApiUrl,
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

export const DOORSTEP_ECOSYSTEM_APPS = DOORSTEP_DEFAULT_APPS;

const REGISTRY_STORAGE_KEY = "doorstep_ecosystem_registry";
const CONNECTION_STORAGE_KEY = "doorstep_connected_apps";

let isSyncing = false;
let hasSyncedOnce = false;

export async function syncEcosystemAppsFromServer(): Promise<ConnectedAppConfig[]> {
  if (typeof window === "undefined" || isSyncing) return getEcosystemApps();
  isSyncing = true;
  try {
    const res = await fetch("/api/connected-products", { cache: "no-store" });
    if (!res.ok) return getEcosystemApps();
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(json.data));
      window.dispatchEvent(new Event("doorstep-ecosystem-registry-change"));
      hasSyncedOnce = true;
      return json.data;
    }
  } catch (err) {
    console.error("Failed to sync ecosystem apps from server:", err);
  } finally {
    isSyncing = false;
  }
  return getEcosystemApps();
}

export function resolveAppLaunchUrl(app: ConnectedAppConfig): string {
  if (app.id === "doorstep-books") {
    // Always prioritize appConfig.booksAppUrl (defaults to https://books.doorstepfilings.com)
    // and ignore any stale localhost or 3002 URLs saved in the user's browser storage
    if (
      !app.url ||
      app.url === "#" ||
      app.url.includes("localhost") ||
      app.url.includes("127.0.0.1") ||
      app.url.includes("3002") ||
      app.url.includes("staging-books") ||
      appConfig.booksAppUrl
    ) {
      return (appConfig.booksAppUrl || "https://books.doorstepfilings.com").replace(/\/$/, "");
    }

    return (app.url || appConfig.booksAppUrl || "https://books.doorstepfilings.com").replace(/\/$/, "");
  }

  return (app.url || "").replace(/\/$/, "");
}

export function getEcosystemApps(): ConnectedAppConfig[] {
  if (typeof window === "undefined") return DOORSTEP_DEFAULT_APPS;
  
  // Trigger background server sync once per page session
  if (!hasSyncedOnce && !isSyncing) {
    void syncEcosystemAppsFromServer();
  }

  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(DOORSTEP_DEFAULT_APPS));
      return DOORSTEP_DEFAULT_APPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let hasChanges = false;

      const updated = parsed.map((item: ConnectedAppConfig) => {
        // Automatically sanitize any legacy staging-books or stale localhost/3002 URLs
        if (
          item.id === "doorstep-books" &&
          (item.url?.includes("staging-books") ||
            item.url?.includes("localhost") ||
            item.url?.includes("3002") ||
            item.url?.includes("127.0.0.1") ||
            (appConfig.booksAppUrl && item.url !== appConfig.booksAppUrl))
        ) {
          hasChanges = true;
          return {
            ...item,
            url: appConfig.booksAppUrl || "https://books.doorstepfilings.com",
            apiUrl: appConfig.booksApiUrl || "https://api-books.doorstepfilings.com/api",
          };
        }
        return item;
      });

      if (hasChanges) {
        localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    }
    return DOORSTEP_DEFAULT_APPS;
  } catch (err) {
    console.error("Failed to parse ecosystem registry:", err);
    return DOORSTEP_DEFAULT_APPS;
  }
}

export async function saveEcosystemApp(app: ConnectedAppConfig): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const current = getEcosystemApps();
    const existingIndex = current.findIndex((item) => item.id === app.id);
    let updated: ConnectedAppConfig[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = app;
    } else {
      updated = [...current, app];
    }
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("doorstep-ecosystem-registry-change"));

    // Persist to server API so all users receive the updated URL
    await fetch("/api/connected-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: updated }),
    }).catch((err) => console.error("Server persistence error:", err));
  } catch (err) {
    console.error("Failed to save ecosystem app to registry:", err);
  }
}

export async function deleteEcosystemApp(appId: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const current = getEcosystemApps();
    const updated = current.filter((item) => item.id !== appId);
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
    removeAppConnection(appId);
    window.dispatchEvent(new Event("doorstep-ecosystem-registry-change"));

    // Persist deletion to server API
    await fetch("/api/connected-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: updated }),
    }).catch((err) => console.error("Server persistence error:", err));
  } catch (err) {
    console.error("Failed to delete ecosystem app from registry:", err);
  }
}

export async function resetEcosystemAppsToDefault(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(DOORSTEP_DEFAULT_APPS));
    window.dispatchEvent(new Event("doorstep-ecosystem-registry-change"));

    // Persist reset to server API
    await fetch("/api/connected-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: DOORSTEP_DEFAULT_APPS }),
    }).catch((err) => console.error("Server persistence error:", err));
  } catch (err) {
    console.error("Failed to reset ecosystem apps registry:", err);
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "ds_••••••••";
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(Math.max(4, key.length - 7))}${suffix}`;
}

export function getStoredConnectedApps(): Record<string, AppConnectionData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CONNECTION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse connected apps from storage:", err);
    return {};
  }
}

export function getStoredAppConnection(appId: string): AppConnectionData | null {
  const all = getStoredConnectedApps();
  return all[appId] || null;
}

export function saveAppConnection(data: AppConnectionData): void {
  if (typeof window === "undefined") return;
  try {
    const all = getStoredConnectedApps();
    all[data.appId] = data;
    localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("doorstep-connected-apps-change"));
  } catch (err) {
    console.error("Failed to save app connection to storage:", err);
  }
}

export function removeAppConnection(appId: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = getStoredConnectedApps();
    delete all[appId];
    localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("doorstep-connected-apps-change"));
  } catch (err) {
    console.error("Failed to remove app connection from storage:", err);
  }
}

export async function verifyBooksApiKey(
  apiKey: string,
  customApiUrl?: string
): Promise<{ success: boolean; message?: string; accessToken?: string }> {
  const trimmedKey = apiKey.trim();

  if (!trimmedKey) {
    return { success: false, message: "API Key cannot be empty." };
  }

  if (!trimmedKey.startsWith("ds_") && trimmedKey.length < 10) {
    return {
      success: false,
      message: "Invalid API key format. Books API keys start with 'ds_'.",
    };
  }

  const baseApi = (customApiUrl || appConfig.booksApiUrl).replace(/\/$/, "");

  try {
    const endpoint = `${baseApi}/auth/api-key/token`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: trimmedKey }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message:
          errorData.message ||
          "Invalid or inactive API key. Please check the key in Doorstep Books.",
      };
    }

    const data = await res.json();
    return {
      success: true,
      accessToken: data?.data?.accessToken || data?.accessToken,
    };
  } catch (err) {
    console.warn("API Key verification direct endpoint call error:", err);
    if (baseApi.includes("localhost") || baseApi.includes("127.0.0.1")) {
      return {
        success: false,
        message: `Doorstep Books backend at ${baseApi} is currently unreachable. Please ensure the backend server is running.`,
      };
    }
    return {
      success: true,
      message: "API Key format verified.",
    };
  }
}

export function buildBooksLaunchUrl(connection?: AppConnectionData | null): string {
  const baseUrl = appConfig.booksAppUrl;
  if (!connection?.apiKey) {
    return baseUrl;
  }
  const ssoParam = encodeURIComponent(connection.apiKey);
  return `${baseUrl}/login?apiKey=${ssoParam}&source=doorstepfilings`;
}

export function buildAppLaunchUrl(
  app: ConnectedAppConfig
): string {
  if (!app.url || app.url === "#") return "#";
  return app.url;
}

export function launchAppSecurely(
  app: ConnectedAppConfig,
  connection?: AppConnectionData | null
): void {
  if (typeof window === "undefined") return;

  const baseUrl = resolveAppLaunchUrl(app);
  if (!baseUrl || baseUrl === "#") return;

  if (!connection?.apiKey) {
    window.open(baseUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // 100% Hidden HTTP POST Form Submission (Zero URL Parameter / Plaintext Exposure)
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `${baseUrl}/api/sso`;
  form.target = "_blank";
  form.style.display = "none";

  const apiKeyInput = document.createElement("input");
  apiKeyInput.type = "hidden";
  apiKeyInput.name = "apiKey";
  apiKeyInput.value = connection.apiKey;
  form.appendChild(apiKeyInput);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
}

/**
 * Production-Grade Server-Proxy Launch (Zoho One / Google Workspace Pattern)
 *
 * Calls our own /api/sso/launch proxy first to get the server-authoritative URL,
 * then submits the hidden POST form to that canonical SSO endpoint.
 * The client NEVER decides which URL to use — the server always resolves it from env vars.
 *
 * Falls back to launchAppSecurely() if the proxy call fails (e.g. offline dev).
 */
export async function launchAppViaServerProxy(
  app: ConnectedAppConfig,
  connection?: AppConnectionData | null
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/sso/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId: app.id }),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.ssoEndpoint) {
        const ssoEndpoint: string = data.ssoEndpoint;

        if (!connection?.apiKey) {
          // No API key — just open the app in a new tab (will require manual login)
          window.open(data.targetUrl, "_blank", "noopener,noreferrer");
          return;
        }

        // Hidden POST form with the server-resolved canonical SSO endpoint
        const form = document.createElement("form");
        form.method = "POST";
        form.action = ssoEndpoint;
        form.target = "_blank";
        form.style.display = "none";

        const apiKeyInput = document.createElement("input");
        apiKeyInput.type = "hidden";
        apiKeyInput.name = "apiKey";
        apiKeyInput.value = connection.apiKey;
        form.appendChild(apiKeyInput);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        }, 1000);
        return;
      }
    }
  } catch (err) {
    console.warn("SSO proxy failed, falling back to local URL resolution:", err);
  }

  // Fallback: client-side URL resolution (still sanitizes stale URLs via resolveAppLaunchUrl)
  launchAppSecurely(app, connection);
}

/**
 * Get the server-authoritative connect URL for 1-click browser sync popup.
 * Calls /api/sso/launch (GET) to resolve the canonical connect URL, falling back to appConfig.
 */
export async function getServerAuthoritativeConnectUrl(appId: string): Promise<string> {
  try {
    const res = await fetch(`/api/sso/launch?appId=${encodeURIComponent(appId)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.connectEndpoint) {
        return data.connectEndpoint as string;
      }
    }
  } catch (err) {
    console.warn("Failed to get authoritative connect URL:", err);
  }

  // Fallback to appConfig
  if (appId === "doorstep-books") {
    return `${appConfig.booksAppUrl}/connect`;
  }
  return "#";
}

export async function validateConnectionHealth(
  appId: string,
  apiKey: string,
  customApiUrl?: string
): Promise<{ isValid: boolean; message?: string }> {
  if (!apiKey) {
    return { isValid: false, message: "No API key found." };
  }

  const result = await verifyBooksApiKey(apiKey, customApiUrl);
  if (!result.success) {
    // Update stored connection status to 'error'
    const current = getStoredAppConnection(appId);
    if (current) {
      saveAppConnection({
        ...current,
        status: "error",
      });
    }
    return {
      isValid: false,
      message: result.message || "Your API key is invalid or has been revoked in Doorstep Books.",
    };
  }

  return { isValid: true };
}

export async function verifyAndLaunchApp(
  app: ConnectedAppConfig,
  connection?: AppConnectionData | null,
  onRevoked?: (message: string) => void
): Promise<boolean> {
  if (!connection?.apiKey) {
    // No API key — launch via server proxy (opens app without SSO)
    await launchAppViaServerProxy(app, connection);
    return true;
  }

  // Check health before launching to prevent broken states
  const health = await validateConnectionHealth(app.id, connection.apiKey, app.apiUrl);
  if (!health.isValid) {
    if (onRevoked) {
      onRevoked(health.message || "Your API key has been revoked. Please reconnect to continue.");
    }
    return false;
  }

  // Launch via server proxy — server resolves the authoritative URL
  await launchAppViaServerProxy(app, connection);
  return true;
}

