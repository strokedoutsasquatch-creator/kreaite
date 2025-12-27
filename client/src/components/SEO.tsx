import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  type?: "website" | "article" | "product" | "course";
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  schema?: object | object[];
  noindex?: boolean;
}

const BASE_URL = "https://kreaite.xyz";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "KreAIte.xyz";

export default function SEO({
  title,
  description = "Create professional content with AI. KreAIte.xyz offers 6 powerful studios for books, videos, music, courses, and images. 85% creator earnings.",
  keywords,
  canonical,
  type = "website",
  image = DEFAULT_IMAGE,
  author,
  publishedTime,
  modifiedTime,
  schema,
  noindex = false,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | AI-Powered Creator Studio`;
  
  const canonicalUrl = canonical
    ? `${BASE_URL}${canonical}`
    : typeof window !== "undefined"
    ? `${BASE_URL}${window.location.pathname}`
    : BASE_URL;

  const schemaScripts = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {author && <meta name="author" content={author} />}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {schemaScripts.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify({ "@context": "https://schema.org", ...s })}
        </script>
      ))}
    </Helmet>
  );
}

export const studioSchemas = {
  bookStudio: {
    "@type": "SoftwareApplication",
    name: "KreAIte Book Studio",
    applicationCategory: "DesktopEnhancementApplication",
    operatingSystem: "Web Browser",
    description: "AI-powered book writing studio with professional editor, AI ghostwriting, and direct publishing to KDP and Lulu.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Ghostwriting", "TipTap WYSIWYG Editor", "KDP Publishing", "Lulu Print-on-Demand", "Cover Designer"],
  },
  musicStudio: {
    "@type": "SoftwareApplication",
    name: "KreAIte Music Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "AI music composition studio with Tone.js, loop libraries, mixing and mastering tools.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Music Composition", "Loop Libraries", "Mixing & Mastering", "Export to MP3/WAV"],
  },
  videoStudio: {
    "@type": "SoftwareApplication",
    name: "KreAIte Video Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "CapCut-style video editor with AI video generation, multi-track timeline, and professional effects.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Video Generation", "Multi-track Timeline", "Effects & Transitions", "4K Export"],
  },
  courseStudio: {
    "@type": "SoftwareApplication",
    name: "KreAIte Course Builder",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    description: "Create professional online courses with AI-generated content, video lessons, quizzes, and certificates.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["AI Course Generation", "Video Lessons", "Quizzes", "Certificates", "Student Analytics"],
  },
  imageStudio: {
    "@type": "SoftwareApplication",
    name: "KreAIte Image Studio",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    description: "Photoshop-like image editor with layers, filters, AI generation, and background removal.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["Layers & Masks", "AI Image Generation", "Background Removal", "Filters & Effects"],
  },
};

export function createAuthorSchema(author: {
  name: string;
  bio?: string;
  url?: string;
  image?: string;
  sameAs?: string[];
}) {
  return {
    "@type": "Person",
    name: author.name,
    description: author.bio,
    url: author.url || `${BASE_URL}/author/${encodeURIComponent(author.name.toLowerCase().replace(/\s+/g, "-"))}`,
    image: author.image,
    sameAs: author.sameAs || [],
    jobTitle: "Content Creator",
    worksFor: {
      "@type": "Organization",
      name: "KreAIte.xyz",
    },
  };
}

export function createCourseSchema(course: {
  name: string;
  description: string;
  author: string;
  price?: number;
  image?: string;
}) {
  return {
    "@type": "Course",
    name: course.name,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "KreAIte.xyz",
      sameAs: BASE_URL,
    },
    instructor: {
      "@type": "Person",
      name: course.author,
    },
    image: course.image,
    offers: course.price
      ? { "@type": "Offer", price: course.price, priceCurrency: "USD" }
      : undefined,
  };
}

export function createProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  author?: string;
  category?: string;
}) {
  return {
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { "@type": "Brand", name: "KreAIte" },
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: product.author
      ? { "@type": "Person", name: product.author }
      : undefined,
  };
}

export function createArticleSchema(article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    author: { "@type": "Person", name: article.author },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image,
    publisher: {
      "@type": "Organization",
      name: "KreAIte.xyz",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
  };
}
