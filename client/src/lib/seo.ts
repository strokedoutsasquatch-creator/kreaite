import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'KreAIte.xyz | AI-Powered Creator Studio';
const DEFAULT_DESCRIPTION = 'Create professional content with AI. 6 powerful studios for books, videos, music, courses, and images. 85% creator earnings.';

export function useSEO(props: SEOProps) {
  useEffect(() => {
    const {
      title,
      description,
      keywords,
      ogImage,
      ogType = 'website',
      canonical,
      noIndex = false
    } = props;

    if (title) {
      const fullTitle = title.includes('KreAIte') ? title : `${title} | KreAIte.xyz`;
      document.title = fullTitle;
      updateMetaTag('og:title', fullTitle);
      updateMetaTag('twitter:title', fullTitle);
    }

    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description);
      updateMetaTag('twitter:description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage);
      updateMetaTag('twitter:image', ogImage);
    }

    updateMetaTag('og:type', ogType);

    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    }

    return () => {
      document.title = DEFAULT_TITLE;
      updateMetaTag('description', DEFAULT_DESCRIPTION);
    };
  }, [props]);
}

function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name);
    } else {
      meta.name = name;
    }
    document.head.appendChild(meta);
  }
  
  meta.content = content;
}

export const SEO_PAGES = {
  home: {
    title: 'KreAIte.xyz | AI-Powered Creator Studio | Books, Videos, Music, Courses',
    description: 'Create professional content with AI. 6 powerful studios for books, videos, music, courses, and images. Publish to marketplace with 85% creator earnings.',
    keywords: 'AI content creation, AI book writing, AI video generator, AI music composer, creator platform'
  },
  bookStudio: {
    title: 'AI Book Writing Studio',
    description: 'Write and publish books with AI assistance. Professional WYSIWYG editor, AI ghostwriting, export to PDF/EPUB, publish to KDP and Lulu print-on-demand.',
    keywords: 'AI book writing, AI ghostwriter, self-publishing, ebook creator, KDP publishing, book editor'
  },
  videoStudio: {
    title: 'AI Video Production Studio',
    description: 'Create professional videos with AI. Multi-track timeline editor, AI video generation, studio effects, 4K export. Perfect for YouTube and social media.',
    keywords: 'AI video generator, video editor, professional video production, AI video creation, video studio'
  },
  musicStudio: {
    title: 'AI Music Composition Studio',
    description: 'Compose original music with AI. Professional DAW features, loop libraries, mixing and mastering, stem generation. Create royalty-free music.',
    keywords: 'AI music generator, music composition, AI composer, royalty-free music, beat maker'
  },
  courseBuilder: {
    title: 'AI Course Builder',
    description: 'Create and sell online courses with AI. Video lessons, quizzes, certificates, and downloadable resources. Earn 85% of every sale.',
    keywords: 'course creator, online course builder, AI course creation, sell courses online'
  },
  imageStudio: {
    title: 'AI Image Editor & Generator',
    description: 'Photoshop-like image editor with AI generation. Layers, filters, background removal, text overlays. Create stunning visuals with AI.',
    keywords: 'AI image generator, image editor, Photoshop alternative, background removal, AI art'
  },
  doctrineEngine: {
    title: 'Doctrine Engine - Knowledge Base Builder',
    description: 'Build structured knowledge bases and training content. Perfect for teams, documentation, and educational materials.',
    keywords: 'knowledge base builder, documentation tool, training content, knowledge management'
  },
  marketplace: {
    title: 'KreAItorverse Marketplace',
    description: 'Discover and purchase professional digital content. Books, courses, music, videos, and images from creators worldwide. Creators earn 85%.',
    keywords: 'digital marketplace, buy ebooks, online courses, digital content, creator marketplace'
  },
  pricing: {
    title: 'Pricing Plans',
    description: 'Choose the perfect plan for your creative needs. Free tier available, premium plans with advanced AI features. 85% revenue share for creators.',
    keywords: 'KreAIte pricing, creator platform pricing, AI content creation cost'
  },
  terms: {
    title: 'Terms of Service',
    description: 'KreAIte.xyz Terms of Service. Review our terms for using the AI-powered creator platform, revenue share policy, and content guidelines.',
    keywords: 'terms of service, legal, KreAIte terms'
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'KreAIte.xyz Privacy Policy. Learn how we collect, use, and protect your data. GDPR and CCPA compliant.',
    keywords: 'privacy policy, data protection, GDPR, CCPA'
  },
  analytics: {
    title: 'Creator Analytics Dashboard',
    description: 'Track your earnings, sales, and content performance. Real-time analytics for KreAIte creators.',
    keywords: 'creator analytics, earnings dashboard, sales tracking'
  },
  affiliate: {
    title: 'Affiliate Program',
    description: 'Earn 10% commission by referring creators to KreAIte. Share your unique referral link and track your earnings.',
    keywords: 'affiliate program, referral program, earn commissions'
  }
} as const;
