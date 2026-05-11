import Link from "next/link";
import { getProjects, type ProjectListItem } from "@/lib/api/getProjects";

export const revalidate = 60;

export default async function SupabaseProjectsPage() {
  let projects: ProjectListItem[] = [];
  let errorMessage: string | null = null;

  try {
    projects = await getProjects();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Projeler alınırken bilinmeyen bir hata oluştu.";
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-text-primary">
        Supabase Projeleri (Sunucu Bileşeni)
      </h1>
      <p className="mt-2 text-sm text-text-secondary">
        Kurum ve çoktan-çoğa kategori ilişkileriyle birlikte projeler.
      </p>

      {errorMessage ? (
        <section className="mt-6 rounded-lg border border-divider-softLight bg-surface-pageLight p-4 text-sm text-red-700">
          {errorMessage}
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          {projects.map((project) => (
            <article
              key={project.id}
              className="rounded-xl border border-divider-softLight bg-surface-pageLight p-5"
            >
              <h2 className="text-lg font-semibold text-text-primary">
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Kurum: {project.ngo?.name ?? "Bilinmiyor"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Tutar: {project.price ?? 0}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Kategoriler:{" "}
                {project.categories.length
                  ? project.categories.map((category) => category.name).join(", ")
                  : "Kategori yok"}
              </p>
              <Link
                href={project.donation_url}
                className="mt-3 inline-flex text-sm font-semibold text-brand-primary hover:text-brand-secondary"
              >
                Bağış bağlantısı
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
