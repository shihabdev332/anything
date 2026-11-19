export const siteOrigin = (import.meta.env.VITE_SITE_URL || "https://digital-store-rj52.vercel.app")
  .replace(/\/+$/, "");

export const absoluteUrl = (value = "/") => {
  try {
    return new URL(value, `${siteOrigin}/`).toString();
  } catch {
    return `${siteOrigin}/`;
  }
};
