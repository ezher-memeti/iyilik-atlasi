import Head from "next/head";

export const siteUrl = "https://iyilikatlasi.com";
export const defaultSeoImage = `${siteUrl}/logo.png`;

export function createCanonicalUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function createSeoMetadata({
  title,
  description,
  keywords = [],
  url = "/",
  image = defaultSeoImage,
  type = "website",
}) {
  const canonicalUrl = createCanonicalUrl(url);
  const keywordList = Array.isArray(keywords) ? keywords : [keywords];

  return {
    title,
    description,
    keywords: keywordList,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "İyilik Atlası",
      type,
      locale: "tr_TR",
      images: [
        {
          url: image,
          width: 1024,
          height: 1024,
          alt: "İyilik Atlası",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function SEO({
  title,
  description,
  keywords = [],
  url = "/",
  image = defaultSeoImage,
}) {
  const canonicalUrl = createCanonicalUrl(url);
  const keywordContent = Array.isArray(keywords) ? keywords.join(", ") : keywords;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordContent} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
