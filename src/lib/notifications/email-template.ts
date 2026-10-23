/**
 * Template Email Pengingat Mingguan KarbonAI
 * Responsif, inline CSS, konsisten dengan identitas visual KarbonAI (Forest, Mint, Cream, Charcoal).
 */

export interface ReminderEmailParams {
  recipientName?: string | null;
  appUrl: string;
  lastCalculationDateFormattedWIB?: string | null;
}

export function generateReminderEmailHtml(params: ReminderEmailParams): string {
  const { recipientName, appUrl, lastCalculationDateFormattedWIB } = params;
  const greetingName = recipientName ? recipientName.trim() : "Pejuang Bumi";
  const calculatorUrl = `${appUrl}/kalkulator`;
  const dashboardUrl = `${appUrl}/dashboard`;
  const profileUrl = `${appUrl}/profil`;

  const lastCalcInfo = lastCalculationDateFormattedWIB
    ? `<p style="margin: 0 0 16px 0; font-size: 13px; color: #52796F; background-color: #E8F5E9; padding: 8px 14px; border-radius: 8px; display: inline-block;">
        📅 Kalkulasi terakhir disimpan: <strong>${lastCalculationDateFormattedWIB}</strong>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saatnya Cek Jejak Karbon Mingguanmu! 🌱</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F1EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2D3142;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F1EA; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #1B4332; padding: 36px 32px; text-align: center;">
              <div style="display: inline-block; background-color: #2D6A4F; border-radius: 12px; padding: 8px 16px; margin-bottom: 12px;">
                <span style="color: #D8F3DC; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">KarbonAI • Pengingat Mingguan</span>
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 800; line-height: 1.3;">
                Saatnya Cek Jejak Karbon Mingguanmu! 🌱
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #1B4332;">
                Halo, ${greetingName}!
              </p>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                Sudah satu minggu sejak kamu terakhir menyimpan hasil kalkulasi jejak karbon di KarbonAI.
              </p>

              ${lastCalcInfo}

              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4A5568;">
                Yuk, luangkan sedikit waktu untuk mengecek kembali penggunaan plastikmu dan menghitung perkiraan emisi yang dihasilkan. Kamu juga bisa melihat riwayat serta grafik mingguan untuk memantau perkembangan kebiasaanmu.
              </p>

              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #1B4332; font-weight: 600;">
                Mulai minggu berikutnya dengan langkah kecil yang lebih ramah lingkungan!
              </p>

              <!-- CTA Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${calculatorUrl}" style="display: inline-block; background-color: #1B4332; color: #FFFFFF; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 2px 8px rgba(27, 67, 50, 0.2);">
                      Hitung Jejak Karbon Minggu Ini &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #F4F1EA; color: #1B4332; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 10px; border: 1px solid #D8F3DC;">
                      Lihat Dashboard & Riwayat
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 32px 0 20px 0;">

              <!-- Footer Notice -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #718096; text-align: center;">
                Email pengingat ini dikirim otomatis 7 hari setelah kalkulasi jejak karbon terakhirmu disimpan.<br>
                Ingin mengubah frekuensi atau berhenti menerima pengingat?
                <a href="${profileUrl}" style="color: #2D6A4F; font-weight: 600; text-decoration: underline;">Kelola Notifikasi di Profil</a>
              </p>
            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="background-color: #F8FAF7; padding: 16px 32px; text-align: center; border-top: 1px solid #EDF2F7;">
              <p style="margin: 0; font-size: 11px; color: #A0AEC0;">
                &copy; ${new Date().getFullYear()} KarbonAI. Bersama kurangi jejak plastik sekali pakai.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateReminderEmailPlainText(params: ReminderEmailParams): string {
  const { recipientName, appUrl } = params;
  const greetingName = recipientName ? recipientName.trim() : "Pejuang Bumi";

  return `Halo, ${greetingName}!

Sudah satu minggu sejak kamu terakhir menyimpan hasil kalkulasi jejak karbon di KarbonAI.

Yuk, luangkan sedikit waktu untuk mengecek kembali penggunaan plastikmu dan menghitung perkiraan emisi yang dihasilkan. Kamu juga bisa melihat riwayat serta grafik mingguan untuk memantau perkembangan kebiasaanmu.

Mulai minggu berikutnya dengan langkah kecil yang lebih ramah lingkungan!

Hitung jejak karbon minggu ini:
${appUrl}/kalkulator

Lihat dashboard & riwayat:
${appUrl}/dashboard

Pengaturan notifikasi:
${appUrl}/profil

Salam lestari,
Tim KarbonAI`;
}
