export type KurbanType =
  | "yurt-ici"
  | "yurt-disi"
  | "vacip"
  | "adak"
  | "akika"
  | "sukur"
  | "filistin"
  | "genel";

export type KurbanProject = {
  type: KurbanType;
  title: string;
  price: number;
  description: string;
  region?: string;
  regions?: string[];
  donation_url: string;
};

export type KurbanOrganization = {
  name: string;
  slug: string;
  description: string;
  founded?: string;
  projects: KurbanProject[];
};

export type KurbanProjectWithOrganization = KurbanProject & {
  organization: {
    id: number;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    level: number | null;
  }>;
  id: string;
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(price);
}
