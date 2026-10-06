// api/whatsapp.js

const VERIFY_TOKEN = "masr2026bot";

const ACCESS_TOKEN = "EAANr2TqnNx8BShTS8chMHwFFpTUbsH8ZCWBcHGGnI4pkRECQKBfWi8dI2NZAmer29KWBCyt8ESXQ0q954xclL8Jgm2Chi5ZCZAZABf62HeVKMRZAt4DZAFYRjoOlGam9sF98dtxMgGeNtRW5Vg4gBzUohWb1CUxYtxgqokC7lTq7HqyfMblCINrOgBkVAMWCSZAbpABqWuNGP5YFNpfIRDAuSZCYnZBVOlRkZCzeQBtYfpuoJpXjSzmd4sebK5dkeRaZA229BLCd3gY9dviEmQZCjBkLs";

const PHONE_NUMBER_ID = "1267291373143606";

// ======================================================
// ذاكرة مؤقتة لحالة المستخدم
// ======================================================

const sessions = globalThis.__whatsappSessions || new Map();
globalThis.__whatsappSessions = sessions;

const processedMessages =
  globalThis.__whatsappProcessedMessages || new Map();

globalThis.__whatsappProcessedMessages = processedMessages;


// ======================================================
// تنظيف النص العربي
// ======================================================

function normalizeText(text = "") {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}


// ======================================================
// إرسال رسالة WhatsApp
// ======================================================

async function sendWhatsAppMessage(to, body) {
  const url =
    `https://graph.facebook.com/v26.0/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: body
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", result);
    throw new Error(
      result?.error?.message || "WhatsApp API error"
    );
  }

  return result;
}


// ======================================================
// إنشاء جلسة جديدة
// ======================================================

function newSession() {
  return {
    mode: "idle",

    step: null,

    data: {
      name: "",
      motherName: "",
      nationalId: "",
      factoryNumber: "",
      phone: "",
      paid: "",
      remaining: "",
      caseReason: ""
    }
  };
}


// ======================================================
// التحقق من الاسم
// ======================================================

function validName(value) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ");

  if (words.length < 4) {
    return false;
  }

  // عربي + إنجليزي فقط
  return /^[\u0600-\u06FFa-zA-Z\s]+$/.test(cleaned);
}


// ======================================================
// التحقق من اسم الأم
// ======================================================

function validMotherName(value) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .trim();

  return /^[\u0600-\u06FFa-zA-Z\s]+$/.test(cleaned);
}


// ======================================================
// التحقق من الرقم القومي
// ======================================================

function validNationalId(value) {
  return /^\d{14}$/.test(value.trim());
}


// ======================================================
// التحقق من رقم الهاتف
// ======================================================

function validPhone(value) {
  return /^\d{11}$/.test(value.trim());
}


// ======================================================
// التحقق من رقم المصنع
// ======================================================

function validFactoryNumber(value) {
  return /^[\u0600-\u06FFa-zA-Z0-9]+$/.test(
    value.trim()
  );
}


// ======================================================
// التحقق من الأرقام المالية
// ======================================================

function validMoney(value) {
  return /^\d+(\.\d+)?$/.test(value.trim());
}


// ======================================================
// بدء الإضافة
// ======================================================

function startAdd(session) {
  session.mode = "add";
  session.step = "name";

  session.data = {
    name: "",
    motherName: "",
    nationalId: "",
    factoryNumber: "",
    phone: "",
    paid: "",
    remaining: "",
    caseReason: ""
  };

  return `تمام 👌

هنبدأ إضافة طلب جديد.

📝 اكتب الاسم الرباعي:`;
}


// ======================================================
// بدء الاستعلام
// ======================================================

function startSearch(session) {
  session.mode = "search";
  session.step = "search";

  return `🔎 تمام.

ابعتلي:
• الاسم
• أو رقم الهاتف
• أو الرقم القومي

وهبحث لك في البيانات.`;
}


// ======================================================
// معالجة خطوات الإضافة
// ======================================================

function handleAddStep(session, text) {

  // --------------------------------
  // الاسم
  // --------------------------------

  if (session.step === "name") {

    if (!validName(text)) {
      return `⚠️ الاسم لازم يكون رباعي.

مثال:
محمد احمد محمد حسن

اكتب الاسم الرباعي مرة تانية:`;
    }

    session.data.name = text
      .replace(/\s+/g, " ")
      .trim();

    session.step = "motherName";

    return `تمام ✅

اكتب اسم الأم:`;
  }


  // --------------------------------
  // اسم الأم
  // --------------------------------

  if (session.step === "motherName") {

    if (!validMotherName(text)) {
      return `⚠️ اسم الأم لازم يحتوي على حروف فقط.

اكتب اسم الأم مرة تانية:`;
    }

    session.data.motherName = text
      .replace(/\s+/g, " ")
      .trim();

    session.step = "nationalId";

    return `تمام ✅

اكتب الرقم القومي:
🔢 لازم يكون 14 رقم بالضبط.`;
  }


  // --------------------------------
  // الرقم القومي
  // --------------------------------

  if (session.step === "nationalId") {

    if (!validNationalId(text)) {
      return `⚠️ الرقم القومي لازم يكون 14 رقم بالضبط.

مثال:
12345678901234

اكتبه مرة تانية:`;
    }

    session.data.nationalId = text.trim();

    session.step = "factoryNumber";

    return `تمام ✅

اكتب رقم المصنع:`;
  }


  // --------------------------------
  // رقم المصنع
  // --------------------------------

  if (session.step === "factoryNumber") {

    if (!validFactoryNumber(text)) {
      return `⚠️ رقم المصنع غير صحيح.

اكتبه مرة تانية:`;
    }

    session.data.factoryNumber = text.trim();

    session.step = "phone";

    return `تمام ✅

اكتب رقم الهاتف:
📱 لازم يكون 11 رقم.`;
  }


  // --------------------------------
  // الهاتف
  // --------------------------------

  if (session.step === "phone") {

    if (!validPhone(text)) {
      return `⚠️ رقم الهاتف لازم يكون 11 رقم بالضبط.

مثال:
01012345678

اكتبه مرة تانية:`;
    }

    session.data.phone = text.trim();

    session.step = "paid";

    return `تمام ✅

اكتب المبلغ المدفوع:
💰 أرقام فقط.`;
  }


  // --------------------------------
  // المدفوع
  // --------------------------------

  if (session.step === "paid") {

    if (!validMoney(text)) {
      return `⚠️ المبلغ لازم يكون أرقام فقط.

اكتب المبلغ المدفوع مرة تانية:`;
    }

    session.data.paid = text.trim();

    session.step = "remaining";

    return `تمام ✅

اكتب المبلغ المتبقي:
💰 أرقام فقط.`;
  }


  // --------------------------------
  // المتبقي
  // --------------------------------

  if (session.step === "remaining") {

    if (!validMoney(text)) {
      return `⚠️ المبلغ لازم يكون أرقام فقط.

اكتب المبلغ المتبقي مرة تانية:`;
    }

    session.data.remaining = text.trim();

    session.step = "caseReason";

    return `تمام ✅

اكتب سبب الحالة:`;
  }


  // --------------------------------
  // سبب الحالة
  // --------------------------------

  if (session.step === "caseReason") {

    if (!text.trim()) {
      return `⚠️ اكتب سبب الحالة من فضلك:`;
    }

    session.data.caseReason = text.trim();

    session.step = "confirm";

    const d = session.data;

    return `راجع البيانات قبل الإرسال 👇

👤 الاسم:
${d.name}

👩 اسم الأم:
${d.motherName}

🪪 الرقم القومي:
${d.nationalId}

🏭 رقم المصنع:
${d.factoryNumber}

📱 الهاتف:
${d.phone}

💰 المدفوع:
${d.paid}

💵 المتبقي:
${d.remaining}

📋 سبب الحالة:
${d.caseReason}

هل البيانات صحيحة؟

اكتب:
✅ تأكيد
❌ إلغاء`;
  }


  // --------------------------------
  // التأكيد
  // --------------------------------

  if (session.step === "confirm") {

    const normalized = normalizeText(text);

    if (
      normalized === "تاكيد" ||
      normalized === "موافق" ||
      normalized === "نعم" ||
      normalized === "ايوه" ||
      normalized === "تمام"
    ) {

      session.step = "submitted";

      /*
       * هنا سيتم ربط البيانات بـ Supabase
       * في الخطوة التالية.
       */

      return `✅ تم تجهيز الطلب بنجاح.

سيتم إرساله للمراجعة.

📌 حالة الطلب:
قيد المراجعة

سنربط الإرسال بصفحة "الطلبات" في الموقع في الخطوة التالية.`;
    }

    if (
      normalized === "الغاء" ||
      normalized === "لا" ||
      normalized === "مش صحيح"
    ) {

      session.mode = "idle";
      session.step = null;

      return `❌ تم إلغاء الطلب.

اكتب:
➕ إضافة
أو
🔎 استعلام`;
    }

    return `من فضلك اكتب:

✅ تأكيد

أو

❌ إلغاء`;
  }


  return `حدث خطأ بسيط في خطوة الإضافة.

اكتب "إضافة" للبدء من جديد.`;
}


// ======================================================
// معالجة الاستعلام
// ======================================================

function handleSearchStep(session, text) {

  /*
   * مؤقتًا بنرجع نتيجة توضيحية.
   *
   * في الخطوة التالية هنربطه مباشرة
   * بجدول Supabase الموجود عندك.
   */

  session.mode = "idle";
  session.step = null;

  return `🔎 استلمت طلب البحث:

${text}

قاعدة البيانات سيتم ربطها هنا في الخطوة التالية بحيث البحث يكون بالاسم أو الهاتف أو الرقم القومي، وتظهر كل البيانات والحالة والمراجعة.`;
}


// ======================================================
// Webhook
// ======================================================

export default async function handler(req, res) {

  // ====================================================
  // GET - Meta Verification
  // ====================================================

  if (req.method === "GET") {

    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === VERIFY_TOKEN
    ) {
      return res
        .status(200)
        .send(challenge);
    }

    return res
      .status(403)
      .send("Verification failed");
  }


  // ====================================================
  // POST - WhatsApp Webhook
  // ====================================================

  if (req.method === "POST") {

    try {

      const body = req.body;

      console.log(
        "WhatsApp Webhook:",
        JSON.stringify(body, null, 2)
      );


      const value =
        body?.entry?.[0]?.changes?.[0]?.value;


      const message =
        value?.messages?.[0];


      // Meta ممكن تبعت Event من غير رسالة
      if (!message) {

        return res
          .status(200)
          .json({ ok: true });
      }


      // =================================================
      // منع التكرار
      // =================================================

      const messageId = message.id;

      if (messageId) {

        if (processedMessages.has(messageId)) {

          console.log(
            "Duplicate message ignored:",
            messageId
          );

          return res
            .status(200)
            .json({
              ok: true,
              duplicate: true
            });
        }

        processedMessages.set(
          messageId,
          Date.now()
        );


        // حذف الرسائل القديمة من الذاكرة
        const now = Date.now();

        for (
          const [id, time] of processedMessages
        ) {

          if (
            now - time >
            10 * 60 * 1000
          ) {
            processedMessages.delete(id);
          }
        }
      }


      // =================================================
      // رقم المستخدم
      // =================================================

      const from = message.from;


      // =================================================
      // الرسائل النصية فقط حاليًا
      // =================================================

      const incomingText =
        message?.text?.body?.trim() || "";


      if (!incomingText) {

        await sendWhatsAppMessage(
          from,
          `أقدر أتعامل مع الرسائل النصية حاليًا فقط.

اكتب:
➕ إضافة
أو
🔎 استعلام`
        );

        return res
          .status(200)
          .json({ ok: true });
      }


      const command =
        normalizeText(incomingText);


      // =================================================
      // الحصول على جلسة المستخدم
      // =================================================

      let session =
        sessions.get(from);


      if (!session) {

        session = newSession();

        sessions.set(
          from,
          session
        );
      }


      let reply;


      // =================================================
      // إلغاء في أي وقت
      // =================================================

      if (
        command === "الغاء" ||
        command === "إلغاء" ||
        command === "cancel"
      ) {

        session.mode = "idle";
        session.step = null;
        session.data = newSession().data;

        reply = `❌ تم إلغاء العملية.

اختار الخدمة:

➕ إضافة
🔎 استعلام`;

      }


      // =================================================
      // إضافة جديدة
      // =================================================

      else if (
        command === "اضافه" ||
        command === "اضيف" ||
        command === "عايز اضيف" ||
        command === "عاوز اضيف" ||
        command === "طلب جديد"
      ) {

        reply = startAdd(session);
      }


      // =================================================
      // استعلام
      // =================================================

      else if (
        command === "استعلام" ||
        command === "استعلم" ||
        command === "بحث" ||
        command === "دور"
      ) {

        reply = startSearch(session);
      }


      // =================================================
      // لو المستخدم بالفعل داخل إضافة
      // =================================================

      else if (
        session.mode === "add"
      ) {

        reply =
          handleAddStep(
            session,
            incomingText
          );
      }


      // =================================================
      // لو المستخدم بالفعل داخل استعلام
      // =================================================

      else if (
        session.mode === "search"
      ) {

        reply =
          handleSearchStep(
            session,
            incomingText
          );
      }


      // =================================================
      // ترحيب
      // =================================================

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


      // =================================================
      // أمر غير معروف
      // =================================================

      else {

        reply = `أهلاً بيك 👋

اختار الخدمة:

➕ إضافة
🔎 استعلام

ولو عايز تلغي أي عملية اكتب:
❌ إلغاء`;
      }


      // =================================================
      // إرسال الرد
      // =================================================

      await sendWhatsAppMessage(
        from,
        reply
      );


      // =================================================
      // مهم جدًا:
      // نرجع 200 بعد معالجة الرسالة
      // =================================================

      return res
        .status(200)
        .json({
          ok: true
        });

    }

    catch (error) {

      console.error(
        "Webhook error:",
        error
      );

      /*
       * مهم:
       * نرجع 200 للـ Webhook بدل 500
       * حتى لا تعيد Meta إرسال نفس الرسالة
       * مرات كثيرة.
       */

      return res
        .status(200)
        .json({
          ok: false,
          error: error.message
        });
    }
  }


  // ====================================================
  // Method غير مدعوم
  // ====================================================

  return res
    .status(405)
    .send("Method Not Allowed");
}
