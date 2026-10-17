import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Proteksi server-side untuk Riwayat Emisi. Tamu tanpa sesi tidak boleh merender data privat.
 */
export default async function RiwayatLayout({
  children,
}: LayoutProps<"/riwayat">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/riwayat");
  }

  return <>{children}</>;
}
