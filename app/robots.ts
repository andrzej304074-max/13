import type { MetadataRoute } from "next";

/** Aplikacja tylko dla zalogowanych – roboty wyszukiwarek nie mają czego indeksować. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
