import { MobileMapPage } from "@/components/map/MobileMapPage";
import { getRegions } from "@/lib/api/getRegions";
import { getAllProjects } from "@/lib/kurban";

export default async function MapDiscoveryPage() {
  const [regions, projects] = await Promise.all([getRegions(), getAllProjects()]);
  return <MobileMapPage regions={regions} projects={projects} />;
}
