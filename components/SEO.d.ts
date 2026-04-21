import type { Metadata } from "next";
import type { ReactNode } from "react";

export const siteUrl: string;
export const defaultSeoImage: string;

export function createCanonicalUrl(path?: string): string;

export function createSeoMetadata(props: {
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  image?: string;
  type?: "website" | "article";
}): Metadata;

export function SEO(props: {
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  image?: string;
}): ReactNode;
