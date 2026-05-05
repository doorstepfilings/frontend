/**
 * Generalized Error Parser for Laravel API Responses
 */
export const parseApiError = (error: any): string => {
  if (!error) return "An unexpected error occurred";

  // 1. If it's a string, return it
  if (typeof error === "string") return error;

  // 2. Handle Axios/External response structures
  const payload = error.response?.data || error;

  // 3. Handle Laravel Validation Errors Object
  if (payload.errors && typeof payload.errors === "object") {
    const errorList = Object.values(payload.errors).flat();
    if (errorList.length > 0) {
      return errorList.join("\n");
    }
  }

  // 4. Handle simple message property
  if (payload.message) return payload.message;

  // 5. Handle direct error object
  if (typeof payload === "object" && payload !== null) {
    const errorValues = Object.values(payload).flat();
    if (errorValues.length > 0 && typeof errorValues[0] === "string") {
      return (errorValues as string[]).join("\n");
    }
  }

  return "Request failed. Please try again.";
};

export default parseApiError;
