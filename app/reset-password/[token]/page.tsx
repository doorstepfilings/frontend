import { ResetPasswordView } from "@/components/auth/reset-password-view";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <ResetPasswordView token={token} />;
}
