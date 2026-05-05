import { notFound, redirect } from "next/navigation";
import { ProtectedPlaceholder } from "@/components/migration/protected-placeholder";

const dashboardMap: Record<
  string,
  {
    title: string;
    subtitle: string;
    sourcePath: string;
    nextSteps: string[];
  }
> = {
  services: {
    title: "My Services",
    subtitle: "Protected user dashboard route scaffold in Next.js.",
    sourcePath: "resources/js/pages/Dashboard/MyServices.jsx",
    nextSteps: [
      "Move active service listings and status tracking.",
      "Preserve links back into the user workflow.",
    ],
  },
};

export default async function DashboardCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  if (key === "applications") {
    redirect("/dashboard/services");
  }

  if (key === "services") {
    redirect("/dashboard/services");
  }

  const config = dashboardMap[key];

  if (!config) {
    notFound();
  }

  return (
    <ProtectedPlaceholder
      title={config.title}
      subtitle={config.subtitle}
      sourcePath={config.sourcePath}
      nextSteps={config.nextSteps}
      embedded
    />
  );
}
