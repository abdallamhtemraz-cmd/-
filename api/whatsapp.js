export default async function handler(req, res) {
 const VERIFY_TOKEN = "masr2026bot";
const ACCESS_TOKEN = "EAANr2TqnNx8BShTS8chMHwFFpTUbsH8ZCWBcHGGnI4pkRECQKBfWi8dI2NZAmer29KWBCyt8ESXQ0q954xclL8Jgm2Chi5ZCZAZABf62HeVKMRZAt4DZAFYRjoOlGam9sF98dtxMgGeNtRW5Vg4gBzUohWb1CUxYtxgqokC7lTq7HqyfMblCINrOgBkVAMWCSZAbpABqWuNGP5YFNpfIRDAuSZCYnZBVOlRkZCzeQBtYfpuoJpXjSzmd4sebK5dkeRaZA229BLCd3gY9dviEmQZCjBkLs";
const PHONE_NUMBER_ID = "+1 (555) 646-2622";
  // =========================
  // Meta Webhook Verification
  // =========================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Verification failed");
  }

  // =========================
  // استقبال رسالة واتساب
  // =========================
  if (req.method === "POST") {
    try {
      const body = req.body;

      console.log(
        "WhatsApp message:",
        JSON.stringify(body, null, 2)
      );

      const message =
        body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      // Meta ممكن تبعت Webhook من غير رسالة
      if (!message) {
        return res.status(200).json({ ok: true });
      }

      const from = message.from;

      const incomingText =
        message?.text?.body?.trim() || "";

      if (!incomingText) {
        return res.status(200).json({ ok: true });
      }

      // =========================
      // تنظيف الكلام
      // =========================
      const command = incomingText
        .trim()
        .toLowerCase()
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه");

      let reply;

      // =========================
      // إضافة
      // =========================
      if (
        command.includes("اضافه") ||
        command.includes("اضيف") ||
        command.includes("عايز اضيف") ||
        command.includes("طلب جديد")
      ) {
        reply = `تمام 👌

هنبدأ إضافة طلب جديد.

اكتب الاسم الرباعي:`;
      }

      // =========================
      // استعلام
      // =========================
      else if (
        command.includes("استعلام") ||
        command.includes("استعلم") ||
        command.includes("بحث") ||
        command.includes("دور")
      ) {
        reply = `🔎 تمام.

ابعتلي:
الاسم
أو رقم الهاتف
أو الرقم القومي

وهبحث لك في البيانات.`;
      }

      // =========================
      // ترحيب
      // =========================
      else if (
        command === "السلام عليكم" ||
        command === "السلام عليكم ورحمه الله" ||
        command === "اهلا" ||
        command === "اهلا بيك" ||
        command === "hello" ||
        command === "hi"
      ) {
        reply = `أهلاً بيك 👋

أنت دلوقتي على بوت مصر الرقمية.

اختار الخدمة:

➕ إضافة

🔎 استعلام`;
      }

      // =========================
      // أمر غير معروف
      // =========================
      else {
        reply = `أهلاً بيك 👋

اكتب واحد من دول:

➕ إضافة
🔎 استعلام`;
      }

      // =========================
      // إرسال الرد إلى WhatsApp
      // =========================
      const url =
        `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: from,
          type: "text",
          text: {
            preview_url: false,
            body: reply
          }
        })
      });

      const result = await response.json();

      console.log("Meta response:", result);

      if (!response.ok) {
        console.error("WhatsApp API error:", result);

        return res.status(500).json({
          ok: false,
          error: result
        });
      }

      return res.status(200).json({
        ok: true
      });

    } catch (error) {
      console.error("Webhook error:", error);

      return res.status(500).json({
        ok: false,
        error: error.message
      });
    }
  }

  return res.status(405).send("Method Not Allowed");
}
