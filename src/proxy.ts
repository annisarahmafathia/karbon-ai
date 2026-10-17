import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (pengganti middleware) untuk memperbarui sesi autentikasi Supabase.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Berlaku untuk semua rute aplikasi kecuali aset statis:
     * - _next/static (file statis kompilasi)
     * - _next/image (optimasi gambar)
     * - favicon.ico
     * - file media statis (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|bea|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
