import {
  type BookkeepingDocument,
  type BookkeepingDocumentType,
  type Customer,
  customerStorageKey,
  documentStorageKey,
} from "@/lib/features/bookkeeping/types";

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, values: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function readCustomers() {
  return readJsonArray<Customer>(customerStorageKey);
}

export function writeCustomers(customers: Customer[]) {
  writeJsonArray(customerStorageKey, customers);
}

export function upsertCustomer(customer: Customer) {
  const customers = readCustomers();
  const exists = customers.some((item) => item.id === customer.id);
  const updatedCustomer = { ...customer, updatedAt: new Date().toISOString() };
  const nextCustomers = exists
    ? customers.map((item) => (item.id === customer.id ? updatedCustomer : item))
    : [updatedCustomer, ...customers];

  writeCustomers(nextCustomers);
  return nextCustomers;
}

export function deleteCustomer(customerId: string) {
  const customers = readCustomers().filter((customer) => customer.id !== customerId);
  writeCustomers(customers);
  return customers;
}

export function readDocuments(type?: BookkeepingDocumentType) {
  const documents = readJsonArray<BookkeepingDocument>(documentStorageKey);
  return type ? documents.filter((document) => document.type === type) : documents;
}

export function writeDocuments(documents: BookkeepingDocument[]) {
  writeJsonArray(documentStorageKey, documents);
}

export function upsertDocument(document: BookkeepingDocument) {
  const documents = readDocuments();
  const exists = documents.some((item) => item.id === document.id);
  const updatedDocument = { ...document, updatedAt: new Date().toISOString() };
  const nextDocuments = exists
    ? documents.map((item) => (item.id === document.id ? updatedDocument : item))
    : [updatedDocument, ...documents];

  writeDocuments(nextDocuments);
  return nextDocuments;
}

export function deleteDocument(documentId: string) {
  const documents = readDocuments().filter((document) => document.id !== documentId);
  writeDocuments(documents);
  return documents;
}

