import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCollegesForAdmin } from "@/lib/db";
import { CollegesAdminClient, type CollegeRow } from "./CollegesAdminClient";

export default async function CollegesDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    redirect("/dashboard");
  }

  let colleges: CollegeRow[] = [];
  try {
    const rows = await getCollegesForAdmin();
    colleges = rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: (r as { name_ar?: string | null; nameAr?: string | null }).nameAr ?? r.name_ar ?? null,
      slug: r.slug,
    }));
  } catch {
    colleges = [];
  }

  return <CollegesAdminClient initialColleges={colleges} />;
}
