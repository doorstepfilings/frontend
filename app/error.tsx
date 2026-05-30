"use client";

import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { ServerCrash } from "lucide-react";

export default function ErrorPage() {
  return (
    <ErrorPageLayout
      title="Something Went Wrong"
      description="Our server is facing a temporary issue. Please try again after some time."
      Icon={ServerCrash}
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
    />
  );
}
