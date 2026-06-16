import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const MAINTENANCE_PAGE_PATH = "/bakimdayiz";
const MAINTENANCE_ALLOWED_API_PATHS = ["/api/auth/callback"];
const PUBLIC_ADMIN_AUTH_PATHS = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const maintenanceRaw = process.env.MAINTENANCE_MODE ?? "";
  const isMaintenanceMode = maintenanceRaw.trim().toLowerCase() === "true";

  if (isMaintenanceMode) {
    if (path.startsWith("/api")) {
      const isAllowedApiPath = MAINTENANCE_ALLOWED_API_PATHS.some(
        (allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`),
      );

      if (!isAllowedApiPath) {
        return NextResponse.json(
          {
            error: "Servis bakımda. Lütfen daha sonra tekrar deneyin.",
          },
          {
            status: 503,
            headers: {
              "Retry-After": "3600",
              "Cache-Control": "no-store",
            },
          },
        );
      }
    }

    const isAllowedPath = path === MAINTENANCE_PAGE_PATH;

    if (!isAllowedPath) {
      const maintenanceUrl = new URL(MAINTENANCE_PAGE_PATH, request.url);
      return NextResponse.redirect(maintenanceUrl);
    }
  } else if (path === MAINTENANCE_PAGE_PATH) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicAdminAuthPath = PUBLIC_ADMIN_AUTH_PATHS.some(
    (allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`),
  );

  if (path.startsWith("/admin") && !isPublicAdminAuthPath && !user) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (path.startsWith("/admin") && !isPublicAdminAuthPath && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  if (path === "/login" && user) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|logo.png).*)",
  ],
};
