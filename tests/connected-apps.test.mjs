import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Mock minimal browser environment for localStorage & window
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
globalThis.localStorage = mockStorage;
globalThis.window = {
  dispatchEvent: () => true,
};
globalThis.Event = class MockEvent {
  constructor(name) {
    this.name = name;
  }
};

// Unit implementations to verify
function connectionStorageKey(userId) {
  return userId == null || String(userId).trim() === ""
    ? null
    : `doorstep_connected_apps_${String(userId).trim()}`;
}

function maskApiKey(key) {
  if (!key || key.length < 8) return "ds_••••••••";
  const prefix = key.slice(0, 3);
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(Math.max(4, key.length - 7))}${suffix}`;
}

const CONNECTION_STORAGE_KEY = "doorstep_connected_apps";

function getStoredConnectedApps(userId) {
  if (typeof window === "undefined") return {};
  const storageKey = connectionStorageKey(userId);
  if (!storageKey) return {};
  try {
    localStorage.removeItem(CONNECTION_STORAGE_KEY);
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAppConnection(data, userId) {
  if (typeof window === "undefined") return;
  const storageKey = connectionStorageKey(userId);
  if (!storageKey) return;
  try {
    const all = getStoredConnectedApps(userId);
    all[data.appId] = data;
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {}
}

function removeAppConnection(appId, userId) {
  if (typeof window === "undefined") return;
  const storageKey = connectionStorageKey(userId);
  if (!storageKey) return;
  try {
    const all = getStoredConnectedApps(userId);
    delete all[appId];
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {}
}

async function verifyBooksApiKey(apiKey, customApiUrl = "https://books-api.doorstepfilings.com") {
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

  try {
    // Simulated unreachable network call
    throw new Error("Network unreachable");
  } catch {
    if (customApiUrl.includes("localhost") || customApiUrl.includes("127.0.0.1")) {
      return {
        success: false,
        message: `Doorstep Books backend at ${customApiUrl} is currently unreachable.`,
      };
    }
    return {
      success: false,
      message: "Could not reach Doorstep Books to verify this key. Please try again later.",
      unavailable: true,
    };
  }
}

function cleanProductsData(parsed) {
  if (Array.isArray(parsed)) {
    let modified = false;
    const cleaned = parsed.map((item) => {
      if (item.id === "doorstep-books" && item.url?.includes("staging-books")) {
        modified = true;
        return {
          ...item,
          url: "https://books.doorstepfilings.com",
        };
      }
      return item;
    });
    return { cleaned, modified };
  }
  return null;
}

describe("Connected Apps - Unit & Feature Tests", () => {
  test("1. maskApiKey should mask keys securely", () => {
    assert.equal(maskApiKey(""), "ds_••••••••");
    assert.equal(maskApiKey("short"), "ds_••••••••");
    assert.equal(maskApiKey("ds_live_abcdef1234"), "ds_•••••••••••1234");
    assert.ok(maskApiKey("ds_secret_key_9999").startsWith("ds_"));
    assert.ok(maskApiKey("ds_secret_key_9999").endsWith("9999"));
  });

  test("2. connectionStorageKey should isolate keys per user", () => {
    assert.equal(connectionStorageKey(null), null);
    assert.equal(connectionStorageKey(undefined), null);
    assert.equal(connectionStorageKey(""), null);
    assert.equal(connectionStorageKey("  "), null);
    assert.equal(connectionStorageKey(101), "doorstep_connected_apps_101");
    assert.equal(connectionStorageKey("user_abc"), "doorstep_connected_apps_user_abc");
  });

  test("3. Multi-User Isolation in LocalStorage", () => {
    mockStorage.clear();

    const user1Connection = {
      appId: "doorstep-books",
      apiKey: "ds_user1_secret_key",
      maskedKey: maskApiKey("ds_user1_secret_key"),
      connectedAt: new Date().toISOString(),
      status: "connected",
    };

    const user2Connection = {
      appId: "doorstep-books",
      apiKey: "ds_user2_secret_key",
      maskedKey: maskApiKey("ds_user2_secret_key"),
      connectedAt: new Date().toISOString(),
      status: "connected",
    };

    // Save connections for 2 different users
    saveAppConnection(user1Connection, "user_1");
    saveAppConnection(user2Connection, "user_2");

    // Verify User 1 only sees their connection
    const appsUser1 = getStoredConnectedApps("user_1");
    assert.equal(appsUser1["doorstep-books"].apiKey, "ds_user1_secret_key");

    // Verify User 2 only sees their connection
    const appsUser2 = getStoredConnectedApps("user_2");
    assert.equal(appsUser2["doorstep-books"].apiKey, "ds_user2_secret_key");

    // Verify unauthenticated user gets empty object
    const appsUnauthenticated = getStoredConnectedApps(null);
    assert.deepEqual(appsUnauthenticated, {});

    // Removing connection from User 1 does NOT affect User 2
    removeAppConnection("doorstep-books", "user_1");
    assert.equal(getStoredConnectedApps("user_1")["doorstep-books"], undefined);
    assert.equal(getStoredConnectedApps("user_2")["doorstep-books"].apiKey, "ds_user2_secret_key");
  });

  test("4. Legacy shared key is purged to prevent cross-account leak", () => {
    mockStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify({ "leak-app": { apiKey: "leaked" } }));
    assert.ok(mockStorage.getItem(CONNECTION_STORAGE_KEY));

    getStoredConnectedApps("user_safe");
    assert.equal(mockStorage.getItem(CONNECTION_STORAGE_KEY), null);
  });

  test("5. verifyBooksApiKey validation and failure resilience", async () => {
    const emptyResult = await verifyBooksApiKey("");
    assert.equal(emptyResult.success, false);
    assert.match(emptyResult.message, /empty/i);

    const badFormatResult = await verifyBooksApiKey("bad_key");
    assert.equal(badFormatResult.success, false);
    assert.match(badFormatResult.message, /Invalid API key format/i);

    const networkFailResult = await verifyBooksApiKey("ds_live_test_key_12345");
    assert.equal(networkFailResult.success, false);
    assert.equal(networkFailResult.unavailable, true);
    assert.match(networkFailResult.message, /Could not reach Doorstep Books/i);
  });

  test("6. Products API array parsing handles empty array and cleans URLs", () => {
    // Handles empty array [] without failing
    const emptyResult = cleanProductsData([]);
    assert.deepEqual(emptyResult.cleaned, []);
    assert.equal(emptyResult.modified, false);

    // Handles populated list and normalizes staging url
    const populated = [
      { id: "doorstep-books", url: "https://staging-books.doorstepfilings.com" },
      { id: "doorstep-hrms", url: "https://hrms.doorstepfilings.com" },
    ];
    const cleanedResult = cleanProductsData(populated);
    assert.equal(cleanedResult.cleaned[0].url, "https://books.doorstepfilings.com");
    assert.equal(cleanedResult.modified, true);
  });
});
