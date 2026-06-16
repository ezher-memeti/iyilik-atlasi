import type { KurbanProjectWithOrganization } from "@/lib/donationModels";

export type MapRegion = {
  id: number;
  name: string;
  slug?: string | null;
  is_visible: boolean;
  latitude: number | null;
  longitude: number | null;
  map_zoom: number | null;
  geojson_url?: string | null;
  geojson?: unknown;
};

export type RegionPreview = {
  region: MapRegion;
  projectCount: number;
  ngoCount: number;
};

export type RegionProject = KurbanProjectWithOrganization;
