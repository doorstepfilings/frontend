type KeyableRecord = Record<string, unknown> | null | undefined;

function readValue(record: KeyableRecord, key: string) {
  if (!record || typeof record !== "object" || !(key in record)) {
    return null;
  }

  const value = record[key];
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value).trim();
  return stringValue ? stringValue : null;
}

export function buildCollectionKey(
  record: KeyableRecord,
  index: number,
  prefix = "row",
  extras: unknown[] = [],
) {
  const parts = [
    prefix,
    readValue(record, "activityType"),
    readValue(record, "type"),
    readValue(record, "id"),
    readValue(record, "order_unique_id"),
    readValue(record, "orderUniqueId"),
    readValue(record, "application_unique_id"),
    readValue(record, "applicationUniqueId"),
    readValue(record, "slug"),
    readValue(record, "email"),
    readValue(record, "name"),
    readValue(record, "file_name"),
    readValue(record, "created_at"),
    readValue(record, "createdAt"),
    readValue(record, "updated_at"),
    readValue(record, "updatedAt"),
    ...extras.map((value) => {
      if (value === null || value === undefined) {
        return null;
      }

      const stringValue = String(value).trim();
      return stringValue ? stringValue : null;
    }),
    String(index),
  ].filter(Boolean);

  return parts.join(":");
}
