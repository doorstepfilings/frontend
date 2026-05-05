import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for fetching city and state based on Indian Pincode.
 */
export const usePincodeLookup = (pincode: string | undefined, onSuccess: (data: { city: string; state: string }) => void) => {
    const [loading, setLoading] = useState(false);

    const onSuccessRef = useRef(onSuccess);
    useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    useEffect(() => {
        const normalizedPincode = String(pincode ?? '')
            .trim()
            .replace(/\D/g, '');

        if (normalizedPincode.length !== 6) {
            return;
        }

        const fetchDetails = async () => {
            try {
                setLoading(true);

                // Use `fetch` to avoid global axios interceptors/headers leaking auth tokens to third-party APIs.
                const response = await fetch(`https://api.postalpincode.in/pincode/${normalizedPincode}`);
                const responseData = await response.json();

                const data = Array.isArray(responseData)
                    ? responseData[0]
                    : responseData;

                if (data && (data.Status === 'Success' || data.Status === 'success')) {
                    const postOffice = data.PostOffice?.[0];
                    if (postOffice) {
                        const result = {
                            city: postOffice.District,
                            state: postOffice.State,
                        };
                        onSuccessRef.current?.(result);
                    }
                }
            } catch {
                // Ignore network errors here; form still allows manual entry.
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchDetails, 500);
        return () => clearTimeout(timer);
    }, [pincode]);

    return { loading };
};
