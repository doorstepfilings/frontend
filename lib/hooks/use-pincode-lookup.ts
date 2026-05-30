import { useEffect, useRef, useState } from "react";
import type { PincodeLookupResponse, PincodeLookupResult } from "@/lib/pincode/lookup";

const lookupCache = new Map<string, PincodeLookupResult>();

/**
 * Custom hook for fetching city and state based on Indian Pincode.
 */
export const usePincodeLookup = (
  pincode: string | number | undefined,
  onSuccess: (data: Pick<PincodeLookupResult, "city" | "state">) => void,
) => {
  const [loading, setLoading] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    const normalizedPincode = String(pincode ?? "")
      .trim()
      .replace(/\D/g, "");

    if (normalizedPincode.length !== 6) {
      return;
    }

    const cachedResult = lookupCache.get(normalizedPincode);
    if (cachedResult) {
      onSuccessRef.current?.({
        city: cachedResult.city,
        state: cachedResult.state,
      });
      return;
    }

    const controller = new AbortController();

    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Keep this request isolated from axios interceptors because it is a plain location lookup.
        const response = await fetch(`/api/pincode/${normalizedPincode}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const responseData = (await response.json()) as PincodeLookupResponse;

        if (!responseData.success) {
          return;
        }

        const result = {
          city: responseData.city,
          pincode: responseData.pincode,
          state: responseData.state,
        };

        lookupCache.set(normalizedPincode, result);
        onSuccessRef.current?.({
          city: result.city,
          state: result.state,
        });
      } catch (error) {
        if (
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          // Ignore lookup failures here; forms still allow manual entry.
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void fetchDetails();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setLoading(false);
    };
  }, [pincode]);

  return { loading };
};
