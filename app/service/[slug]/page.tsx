import { ServiceDetailView } from "@/components/services/service-detail-view";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ServiceDetailView slug={slug} />;
}
