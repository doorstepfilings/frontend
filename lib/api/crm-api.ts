import { apiClient } from "@/lib/api/client";

export const crmApi = {
  createInquiry: (formData: FormData) =>
    apiClient.post("/enquiries/crm", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
