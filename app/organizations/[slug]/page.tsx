import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { OrganizationDetail } from "@/components/OrganizationDetail";
import { getOrganization, organizations } from "@/lib/kurban";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return organizations.map((organization) => ({
    slug: organization.slug,
  }));
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;
  const organization = getOrganization(slug);

  if (!organization) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <OrganizationDetail organization={organization} />
      <Disclaimer />
    </main>
  );
}
