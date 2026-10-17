import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Proteksi server-side untuk Dashboard. Tamu tanpa sesi tidak boleh merender halaman privat.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return <>{children}</>;
}
