import { useEffect } from "react";
import { absoluteUrl } from "../utils/seoUtils";

const setMeta = (attribute, key, content) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const Seo = ({
  title = "Digital Store | Shop products from independent sellers",
  description = "Discover products from independent sellers on Digital Store. Browse the marketplace, explore seller stores and shop online.",
  path = typeof window !== "undefined" ? window.location.pathname : "/",
  image = "/og-image.png",
  imageAlt = "Digital Store marketplace preview",
  type = "website",
  noindex = false,
  jsonLd,
}) => {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd).replace(/</g, "\\u003c") : "";

  useEffect(() => {
    const canonicalUrl = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);
    const robots = noindex ? "noindex, nofollow, noarchive" : "index, follow, max-image-preview:large";

    document.title = title;
    setMeta("name", "description", description);
    setMeta("name", "robots", robots);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:site_name", "Digital Store");
    setMeta("property", "og:locale", "en_US");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);
    setMeta("name", "twitter:image:alt", imageAlt);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    let structuredData = document.getElementById("seo-structured-data");
    if (jsonLdText) {
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "seo-structured-data";
        structuredData.type = "application/ld+json";
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = jsonLdText;
    } else {
      structuredData?.remove();
    }
  }, [title, description, path, image, imageAlt, type, noindex, jsonLdText]);

  return null;
};

export default Seo;
