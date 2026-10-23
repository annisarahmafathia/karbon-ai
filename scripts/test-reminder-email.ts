
import { Resend } from "resend";
import {
    generateReminderEmailHtml,
    generateReminderEmailPlainText,
} from "../src/lib/notifications/email-template";

async function main() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail =
        process.env.EMAIL_FROM || "onboarding@resend.dev";

    // Ganti dengan alamat email kamu sendiri.
    const recipientEmail = "annisarahmafathia63@gmail.com";

    if (!apiKey || apiKey === "your-resend-api-key-here") {
        throw new Error("RESEND_API_KEY belum dikonfigurasi.");
    }

    const appUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const params = {
        recipientName: "Pejuang Bumi",
        appUrl,
        lastCalculationDateFormattedWIB: new Intl.DateTimeFormat(
            "id-ID",
            {
                timeZone: "Asia/Jakarta",
                dateStyle: "long",
                timeStyle: "short",
            }
        ).format(new Date()) + " WIB",
    };

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [recipientEmail],
        subject: "Saatnya Cek Jejak Karbon Mingguanmu! 🌱",
        html: generateReminderEmailHtml(params),
        text: generateReminderEmailPlainText(params),
    });

    if (error) {
        console.error("Gagal mengirim email:", error.message);
        process.exitCode = 1;
        return;
    }

    console.log("Email pengingat berhasil dikirim ke Resend.");
    console.log("ID email:", data?.id);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
