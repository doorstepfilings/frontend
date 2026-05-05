import { useEffect, useRef, useState } from "react";

interface PincodeResult {
  city: string;
  state: string;
}

/**
 * Custom hook for fetching city and state based on Indian Pincode.
 */
export const usePincodeLookup = (
  pincode: string | number,
  onSuccess: (result: PincodeResult) => void
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

    const fetchDetails = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://api.postalpincode.in/pincode/${normalizedPincode}`
        );
        const responseData = await response.json();

        const data = Array.isArray(responseData) ? responseData[0] : responseData;

        if (data && (data.Status === "Success" || data.Status === "success")) {
          const postOffice = data.PostOffice?.[0];
          if (postOffice) {
            const result = {
              city: postOffice.District,
              state: postOffice.State,
            };
            onSuccessRef.current?.(result);
          }
        }
      } catch (error) {
        // Ignore network errors
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchDetails, 500);
    return () => clearTimeout(timer);
  }, [pincode]);

  return { loading };
};
