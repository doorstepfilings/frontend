export const appConfig = {
  backendUrl: (
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.BACKEND_URL ??
    "http://127.0.0.1:4000"
  ).replace(/\/$/, ""),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000").replace(
    /\/$/,
    "",
  ),
};
