import fs from "node:fs";
import path from "node:path";

export type OrganizationCatalogItem = {
  name: string;
  slug: string;
  shortDescription: string;
  website: string;
  donationUrl: string;
  logoUrl: string;
  category?: string;
  publicBenefit?: string;
  sectors?: string;
  foundedYear?: string;
  trustScore?: number;
  countryCount?: number;
  focusArea?: string;
};

const csvPath = path.join(process.cwd(), "data", "framer_stk_koleksiyonu.csv");

function parseLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());

  return values;
}

export function getOrganizationCatalog() {
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);

  if (lines.length <= 1) {
    return [] as OrganizationCatalogItem[];
  }

  const headers = parseLine(lines[0]);

  return lines.slice(1).map((line) => {
    const row = parseLine(line);
    const record = Object.fromEntries(
      headers.map((header, idx) => [header, row[idx] ?? ""]),
    );

    return {
      name: record.name,
      slug: record.slug,
      shortDescription: record.kisa_aciklama,
      website: record.web_sitesi,
      donationUrl: record.bagis_url,
      logoUrl: record.logo_url,
      category: record.katman,
      publicBenefit: record.kamu_yarari,
      sectors: record.ana_sektorler,
      foundedYear: record.kurulis_yili,
      trustScore: Number(record.guvenskor || 0) || undefined,
      countryCount: Number(record.yurt_disi_ulke_sayisi || 0) || undefined,
      focusArea: record.odak_cografya,
    } satisfies OrganizationCatalogItem;
  });
}

export function getOrganizationBySlug(slug: string) {
  return getOrganizationCatalog().find((organization) => organization.slug === slug);
}
