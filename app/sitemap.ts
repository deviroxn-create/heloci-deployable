import type { MetadataRoute } from "next";

const SITE_URL = "https://www.heloci.us";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    "/",
    "/about",
    "/contact",
    "/eligibility",
    "/properties",
    "/apply",
    "/check-eligibility",
    "/housing-goal",
    "/programs",
    "/privacy-policy"
  ];

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route}`
  }));
}
