export const siteConfig = {
  name: "Heloci",
  description: "AI-powered NGO housing assistance platform",
  url: "https://heloci.ngo",
  primaryColor: "#003DB8",
  secondaryColor: "#0F172A"
};

export function getAuthRedirectOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return siteConfig.url;
}
