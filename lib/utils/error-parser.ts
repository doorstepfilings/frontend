/**
 * Generalized Error Parser for API Responses
 */
export const parseApiError = (error: any, fallback = "Request failed. Please try again."): string => {
  if (!error) return fallback;

  // 1. If it's a string, return it
  if (typeof error === "string") return error;

  // 2. Handle Axios/External response structures
  const payload = error.response?.data || error;

  // 3. Handle Validation Errors Object/Array
  if (payload.errors) {
    if (Array.isArray(payload.errors)) {
      const errorList = payload.errors.flat().filter(Boolean);
      if (errorList.length > 0) {
        return errorList.join("\n");
      }
    } else if (typeof payload.errors === "object") {
      const errorList = Object.values(payload.errors).flat().filter(Boolean);
      if (errorList.length > 0) {
        return errorList.join("\n");
      }
    } else if (typeof payload.errors === "string" && payload.errors.trim()) {
      return payload.errors.trim();
    }
  }

  // 4. Handle simple message property
  if (payload.message) {
    if (Array.isArray(payload.message)) {
      return payload.message.join("\n");
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  }

  // 5. Handle simple error property
  if (payload.error) {
    if (Array.isArray(payload.error)) {
      return payload.error.join("\n");
    }
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }
  }

  // 6. Handle direct error object values
  if (typeof payload === "object" && payload !== null) {
    const errorValues = Object.values(payload).flat().filter((val) => typeof val === "string");
    if (errorValues.length > 0) {
      return (errorValues as string[]).join("\n");
    }
  }

  return fallback;
};

export default parseApiError;

