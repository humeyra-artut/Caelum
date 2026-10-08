window.EAConfig = {
    // Kredi gerektiren sabit bir modele bağlı kalmamak için ücretsiz yönlendirici kullanılır.
    defaultModel: "openrouter/free",
    fallbackModels: [
        "openrouter/free"
    ],
    visionModels: [
        "openrouter/free"
    ]
};

window.EAAI = {


    lastAltTextSource: "none",
    lastAltTextError: "",

    isOpenRouterCreditError: function (error) {
        const message = String(error?.message || error || "").toLowerCase();
        return (
            message.includes("insufficient credits") ||
            message.includes("402") ||
            message.includes("payment required") ||
            message.includes("credit")
        );
    },

    isOpenRouterRateLimitError: function (error) {
        const message = String(error?.message || error || "").toLowerCase();
        return (
            message.includes("429") ||
            message.includes("rate limit") ||
            message.includes("too many requests")
        );
    },

    generateLocalLabel: function(field) {
        if (!field) return null;

        const clean = (txt) =>
            String(txt || "")
                .replace(/([a-zğüşöçı])([A-ZİĞÜŞÖÇ])/g, "$1 $2")
                .replace(/[_\-\.]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const type = String(field.type || "").toLowerCase();
        const tag = String(field.tagName || "").toLowerCase();

        const autocompleteMap = {
            name: "Ad soyad",
            "given-name": "Ad",
            "family-name": "Soyad",
            email: "E-posta adresi",
            username: "Kullanıcı adı",
            "current-password": "Şifre",
            "new-password": "Yeni şifre",
            tel: "Telefon numarası",
            street_address: "Adres",
            "street-address": "Adres",
            postal_code: "Posta kodu",
            "postal-code": "Posta kodu",
            country: "Ülke",
            "address-level2": "Şehir"
        };

        const semanticMap = [
            [/^(first\s*name|firstname|given\s*name|ad)$/i, "Ad"],
            [/^(last\s*name|lastname|family\s*name|soyad)$/i, "Soyad"],
            [/^(full\s*name|fullname|name|ad\s*soyad)$/i, "Ad soyad"],
            [/^(mail|email|e\s*posta|email\s*address)$/i, "E-posta adresi"],
            [/^(phone|telephone|tel|telefon)$/i, "Telefon numarası"],
            [/^(message|mesaj|comment|yorum)$/i, "Mesaj"],
            [/^(city|sehir|şehir)$/i, "Şehir"],
            [/^(country|ulke|ülke)$/i, "Ülke"],
            [/^(address|adres)$/i, "Adres"],
            [/^(search|arama|query)$/i, "Arama"],
            [/^(password|sifre|şifre)$/i, "Şifre"],
            [/^(username|user\s*name|kullanici\s*adi|kullanıcı\s*adı)$/i, "Kullanıcı adı"],
            [/^(date|tarih)$/i, "Tarih"],
            [/^(time|saat)$/i, "Saat"],
            [/^(subject|konu)$/i, "Konu"]
        ];

        const candidates = [
            field.getAttribute("aria-label"),
            field.getAttribute("placeholder"),
            field.getAttribute("title"),
            field.getAttribute("autocomplete"),
            field.getAttribute("name"),
            field.getAttribute("id"),
            field.getAttribute("data-label"),
            field.getAttribute("data-testid"),
            field.previousElementSibling?.innerText,
            field.nextElementSibling?.innerText
        ];

        if (tag === "select") {
            const firstOption = field.querySelector("option");
            if (firstOption) candidates.unshift(firstOption.textContent);
        }

        const autocomplete = clean(field.getAttribute("autocomplete")).toLowerCase();
        if (autocompleteMap[autocomplete]) return autocompleteMap[autocomplete];

        for (const value of candidates) {
            const text = clean(value);
            if (!text || text.length < 2 || text.length > 60) continue;

            const normalized = text.toLowerCase();
            for (const [pattern, label] of semanticMap) {
                if (pattern.test(normalized)) return label;
            }

            const generic = this.cleanFieldLabelResult
                ? this.cleanFieldLabelResult(text, field)
                : this.normalizeLabel(text);
            if (generic) return generic;
        }

        const typeMap = {
            email: "E-posta adresi",
            password: "Şifre",
            search: "Arama",
            tel: "Telefon numarası",
            number: "Sayı",
            date: "Tarih",
            time: "Saat",
            url: "Web adresi",
            file: "Dosya seçimi",
            checkbox: "Onay kutusu",
            radio: "Seçenek",
            range: "Değer aralığı",
            color: "Renk seçimi"
        };

        if (typeMap[type]) return typeMap[type];
        if (tag === "select") return "Seçim alanı";
        if (tag === "textarea") return "Mesaj";

        // Son güvenli yerel yedek. Kullanıcı verisini etiket olarak kullanmaz.
        if (type === "text" || !type) return "Metin girişi";
        return null;
    },
normalizeLabel: function(text) {

    const map = {

        email:
            "E-posta adresi",

        mail:
            "E-posta adresi",

        password:
            "Şifre",

        search:
            "Arama",

        username:
            "Kullanıcı adı",

        phone:
            "Telefon numarası",

        tel:
            "Telefon numarası"
    };

    if (
    !text ||
    typeof text !== "string"
) {

    return null;
}

const lower =
    text.toLowerCase();

    for (const key in map) {

        if (
            lower.includes(key)
        ) {

            return map[key];
        }
    }

   const cleaned =
    String(text)
        .replace(/[^\wğüşöçıİĞÜŞÖÇ\s]/gi, "")
        .replace(/\b(l0|nv00|cta|gnb|btn|menu)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 40);

const useless = [

    "",

    "shop",

    "mobile",

    "support",

    "button",

    "menu",

    "icon",

    "null",

    "undefined"
];

if (
    useless.includes(
        cleaned.toLowerCase()
    )
) {

    return null;
}

return cleaned;
},
getVisionModelFallbacks: function () {
    const models = Array.isArray(EAConfig.visionModels) && EAConfig.visionModels.length
        ? EAConfig.visionModels
        : this.getModelFallbacks();

    return [...new Set(models.filter(Boolean))];
},

extractAIText: function (data) {
    const message = data?.choices?.[0]?.message;
    const content = message?.content;

    if (typeof content === "string") {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (!part) return "";
                if (typeof part === "string") return part;
                if (typeof part.text === "string") return part.text;
                return "";
            })
            .join(" ")
            .trim();
    }

    return "";
},

cleanAltTextResult: function (value) {
    if (!value) return null;

    const cleaned = String(value)
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/^alt\s*metin\s*:?/i, "")
        .replace(/^alt\s*text\s*:?/i, "")
        .replace(/^açıklama\s*:?/i, "")
        .replace(/^görsel\s*:?/i, "")
        .replace(/["'`]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[\.,;:!?]+$/g, "");

    const lower = cleaned.toLowerCase();
    const banned = [
        "null",
        "undefined",
        "görsel",
        "resim",
        "image",
        "fotoğraf",
        "açıklama yapılamadı",
        "alt metin üretilemedi"
    ];

    if (!cleaned || cleaned.length < 4 || cleaned.length > 140) return null;
    if (banned.includes(lower)) return null;
    if (/^(bir|bu)\s+görsel/i.test(cleaned) && cleaned.split(" ").length < 4) return null;

    return cleaned;
},

getVisualSource: function (element) {
    if (!element) return "";

    const direct = String(element.currentSrc || element.src || "").trim();
    if (direct) return direct;

    try {
        const backgroundImage = window.getComputedStyle(element).backgroundImage || "";
        const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/i);
        return match?.[1]?.trim() || "";
    } catch (error) {
        console.warn("Görsel kaynağı okunamadı:", error);
        return "";
    }
},

generateAltText: async function(img) {
    if (!img) return null;

    this.lastAltTextSource = "none";
    this.lastAltTextError = "";

    const localFallback = this.cleanAltTextResult(this.generateLocalAlt(img));
    const nearbyText = [
        img.getAttribute("aria-label"),
        img.title,
        img.closest("figure")?.querySelector("figcaption")?.innerText,
        img.closest("article, section, main")?.querySelector("h1,h2,h3")?.innerText,
        img.closest("a")?.innerText,
        img.parentElement?.innerText
    ]
        .filter(Boolean)
        .join(" \n")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 600);

    const visualSource = this.getVisualSource(img);
    const filename = visualSource
        .split("/")
        .pop()
        ?.split("?")[0]
        ?.replace(/[-_]/g, " ") || "";

    const basePrompt = `Sen bir erişilebilirlik asistanısın. Bu görsel için 5-12 kelimelik kısa, somut ve doğal bir Türkçe alt metin üret. Yalnızca alt metni döndür. Markdown, giriş cümlesi, madde işareti veya genel "görsel/resim" ifadesi kullanma.`;
    const contextPrompt = `${basePrompt}\nDosya adı: ${filename || "bilinmiyor"}\nSayfa bağlamı: ${nearbyText || "bağlam bulunamadı"}`;

    const usableSrc = String(visualSource || "").trim();
    const isRemoteVisual = /^https?:\/\//i.test(usableSrc) && !/\.(svg)(\?|$)/i.test(usableSrc);

    const requestFreeModel = async (payload) => {
        const data = await this.fetchFromBackground(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${EAApp.state.apiKey}`,
                    "HTTP-Referer": location.origin,
                    "X-Title": "Caelum Accessibility Assistant"
                },
                body: JSON.stringify({
                    ...payload,
                    model: "openrouter/free"
                })
            }
        );

        return this.cleanAltTextResult(this.extractAIText(data));
    };

    try {
        if (isRemoteVisual) {
            const visionPayload = {
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: `${basePrompt}\nBağlam: ${nearbyText || "bağlam bulunamadı"}` },
                        { type: "image_url", image_url: { url: usableSrc } }
                    ]
                }],
                temperature: 0.1,
                max_tokens: 70
            };

            const visionText = await requestFreeModel(visionPayload);
            if (visionText) {
                this.lastAltTextSource = "openrouter-free-vision";
                return visionText;
            }
        }
    } catch (visionError) {
        this.lastAltTextError = String(visionError?.message || visionError || "");
        console.warn("Ücretsiz OpenRouter görsel analizi kullanılamadı; bağlam tabanlı yedeğe geçiliyor:", visionError);
    }

    try {
        const textPayload = {
            messages: [{ role: "user", content: contextPrompt }],
            temperature: 0.1,
            max_tokens: 50
        };

        const contextText = await requestFreeModel(textPayload);
        if (contextText) {
            this.lastAltTextSource = "openrouter-free-context";
            return contextText;
        }
    } catch (contextError) {
        this.lastAltTextError = String(contextError?.message || contextError || "");

        if (this.isOpenRouterCreditError(contextError)) {
            console.warn("OpenRouter ücretli kredi hatası verdi. Ücretsiz yönlendirici ve yerel fallback kullanılıyor.");
        } else if (this.isOpenRouterRateLimitError(contextError)) {
            console.warn("OpenRouter ücretsiz model kotası dolmuş olabilir. Yerel fallback kullanılıyor.");
        } else {
            console.warn("OpenRouter alt metin isteği başarısız. Yerel fallback kullanılıyor:", contextError);
        }
    }

    if (localFallback) {
        this.lastAltTextSource = "local-fallback";
        return localFallback;
    }

    this.lastAltTextSource = "none";
    return null;
},

cleanFieldLabelResult: function(value, field = null) {
    if (!value) return null;

    const cleaned = String(value)
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/^label\s*:?/i, "")
        .replace(/^etiket\s*:?/i, "")
        .replace(/^aria-label\s*:?/i, "")
        .replace(/["'`]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[\.,;:!?]+$/g, "");

    const lower = cleaned.toLowerCase();
    const generic = [
        "input",
        "form alanı",
        "form alani",
        "alan",
        "label",
        "etiket",
        "değer",
        "deger",
        "bilgi"
    ];

    if (cleaned.length < 2 || cleaned.length > 60) return null;
    if (!/[a-zA-ZğüşöçıİĞÜŞÖÇ]/.test(cleaned)) return null;
    if (generic.includes(lower)) return null;

    if (field) {
        const type = String(field.type || "").toLowerCase();
        const isButtonType = ["button", "submit", "reset"].includes(type);
        const currentValue = String(field.value || "").trim();

        // Kullanıcının yazdığı veri erişilebilir etiket değildir.
        if (!isButtonType && currentValue && lower === currentValue.toLowerCase()) {
            return null;
        }
    }

    return cleaned;
},

inferFieldLabelNLP: function(field) {
    if (!field) return { label: null, confidence: 0, reason: "none" };

    const clean = (value) => String(value || "")
        .replace(/([a-zğüşöçı])([A-ZİĞÜŞÖÇ])/g, "$1 $2")
        .replace(/[_\-.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const normalize = (value) => clean(value)
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i")
        .replace(/ş/g, "s")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");

    const semanticRules = [
        { re: /\b(first name|firstname|given name|adiniz|adin|ad)\b/, label: "Ad" },
        { re: /\b(last name|lastname|family name|soyadiniz|soyadin|soyad)\b/, label: "Soyad" },
        { re: /\b(full name|fullname|ad soyad|isim soyisim)\b/, label: "Ad soyad" },
        { re: /\b(e mail|email|mail|eposta|email address)\b/, label: "E-posta adresi" },
        { re: /\b(phone|telephone|telefon|mobile|gsm|tel)\b/, label: "Telefon numarası" },
        { re: /\b(user name|username|kullanici adi|kullaniciadi)\b/, label: "Kullanıcı adı" },
        { re: /\b(password|passcode|sifre|parola)\b/, label: "Şifre" },
        { re: /\b(search|query|arama|ara)\b/, label: "Arama" },
        { re: /\b(message|mesaj|comment|yorum|aciklama)\b/, label: "Mesaj" },
        { re: /\b(city|sehir|ilce|town)\b/, label: "Şehir" },
        { re: /\b(country|ulke)\b/, label: "Ülke" },
        { re: /\b(address|adres|street)\b/, label: "Adres" },
        { re: /\b(postal code|postcode|zip code|posta kodu)\b/, label: "Posta kodu" },
        { re: /\b(subject|konu|baslik)\b/, label: "Konu" },
        { re: /\b(date|tarih|birthday|dogum tarihi)\b/, label: "Tarih" },
        { re: /\b(time|saat)\b/, label: "Saat" },
        { re: /\b(company|firma|sirket|organization)\b/, label: "Şirket" },
        { re: /\b(job|occupation|meslek|unvan|title)\b/, label: "Meslek" },
        { re: /\b(age|yas)\b/, label: "Yaş" },
        { re: /\b(gender|cinsiyet)\b/, label: "Cinsiyet" },
        { re: /\b(quantity|adet|miktar|number)\b/, label: "Miktar" }
    ];

    const autocompleteMap = {
        "name": "Ad soyad",
        "given-name": "Ad",
        "family-name": "Soyad",
        "email": "E-posta adresi",
        "username": "Kullanıcı adı",
        "current-password": "Şifre",
        "new-password": "Yeni şifre",
        "tel": "Telefon numarası",
        "street-address": "Adres",
        "postal-code": "Posta kodu",
        "country": "Ülke",
        "country-name": "Ülke",
        "address-level2": "Şehir",
        "bday": "Doğum tarihi",
        "organization": "Şirket"
    };

    const autocomplete = String(field.getAttribute("autocomplete") || "").trim().toLowerCase();
    if (autocompleteMap[autocomplete]) {
        return { label: autocompleteMap[autocomplete], confidence: 0.99, reason: "autocomplete" };
    }

    const sources = [
        { value: field.getAttribute("placeholder"), confidence: 0.96, reason: "placeholder" },
        { value: field.getAttribute("title"), confidence: 0.93, reason: "title" },
        { value: field.getAttribute("name"), confidence: 0.89, reason: "name" },
        { value: field.getAttribute("id"), confidence: 0.88, reason: "id" },
        { value: field.getAttribute("data-label"), confidence: 0.91, reason: "data-label" },
        { value: field.previousElementSibling?.innerText, confidence: 0.86, reason: "previous-text" },
        { value: field.nextElementSibling?.innerText, confidence: 0.80, reason: "next-text" },
        { value: field.parentElement?.querySelector("label")?.innerText, confidence: 0.92, reason: "near-label" }
    ];

    if (String(field.tagName || "").toLowerCase() === "select") {
        sources.unshift({
            value: field.options?.[0]?.textContent,
            confidence: 0.90,
            reason: "select-option"
        });
    }

    for (const source of sources) {
        const normalized = normalize(source.value);
        if (!normalized || normalized.length < 2 || normalized.length > 80) continue;

        for (const rule of semanticRules) {
            if (rule.re.test(normalized)) {
                return {
                    label: rule.label,
                    confidence: source.confidence,
                    reason: `nlp-${source.reason}`
                };
            }
        }
    }

    const type = String(field.type || "").toLowerCase();
    const tag = String(field.tagName || "").toLowerCase();
    const typeMap = {
        email: ["E-posta adresi", 0.98],
        password: ["Şifre", 0.98],
        search: ["Arama", 0.98],
        tel: ["Telefon numarası", 0.98],
        number: ["Sayı", 0.86],
        date: ["Tarih", 0.94],
        time: ["Saat", 0.94],
        url: ["Web adresi", 0.94],
        file: ["Dosya seçimi", 0.91],
        checkbox: ["Onay kutusu", 0.82],
        radio: ["Seçenek", 0.78],
        range: ["Değer aralığı", 0.84],
        color: ["Renk seçimi", 0.90]
    };

    if (typeMap[type]) {
        return {
            label: typeMap[type][0],
            confidence: typeMap[type][1],
            reason: "nlp-input-type"
        };
    }

    if (tag === "textarea") {
        return { label: "Mesaj", confidence: 0.72, reason: "generic-textarea" };
    }
    if (tag === "select") {
        return { label: "Seçim alanı", confidence: 0.66, reason: "generic-select" };
    }
    if (type === "text" || !type) {
        return { label: "Metin girişi", confidence: 0.38, reason: "generic-text" };
    }

    return { label: null, confidence: 0, reason: "none" };
},

getFieldLabelSignature: function(field) {
    if (!field) return "";
    return [
        field.tagName,
        field.type,
        field.id,
        field.name,
        field.placeholder,
        field.autocomplete,
        field.title
    ]
        .map((value) => String(value || "").trim().toLowerCase())
        .join("|")
        .substring(0, 320);
},

getCompactFieldDescriptor: function(field, index) {
    const short = (value, max = 45) => String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, max);

    const nearby = [
        field.previousElementSibling?.innerText,
        field.nextElementSibling?.innerText,
        field.parentElement?.querySelector("label")?.innerText
    ]
        .filter(Boolean)
        .map((value) => short(value, 50))
        .find(Boolean) || "";

    return [
        index,
        short(field.tagName, 12),
        short(field.type, 12),
        `id=${short(field.id)}`,
        `n=${short(field.name)}`,
        `ph=${short(field.placeholder)}`,
        `ac=${short(field.autocomplete, 28)}`,
        `ctx=${short(nearby, 55)}`
    ].join("|");
},

generateFieldLabelsBatch: async function(entries) {
    const result = new Map();
    if (!Array.isArray(entries) || !entries.length) return result;

    this.fieldLabelCache = this.fieldLabelCache || {};
    const pending = [];

    entries.forEach((entry, position) => {
        const index = Number.isFinite(entry.index) ? entry.index : position;
        const signature = this.getFieldLabelSignature(entry.field);
        const cached = signature && this.fieldLabelCache[signature];

        if (cached) {
            result.set(index, { label: cached, source: "openrouter-cache" });
        } else {
            pending.push({ ...entry, index, signature });
        }
    });

    if (!pending.length) return result;

    const descriptors = pending
        .map((entry) => this.getCompactFieldDescriptor(entry.field, entry.index))
        .join("\n");

    const prompt = `Türkçe form erişilebilirlik etiketi üret. Sadece JSON dizi döndür: [{"i":0,"l":"Etiket"}]. Kullanıcı değerini kullanma. Kısa ve özgül ol.\n${descriptors}`;

    const data = await this.fetchOpenRouterChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: Math.min(140, 28 + pending.length * 14)
    });

    const raw = this.extractAIText
        ? this.extractAIText(data)
        : data?.choices?.[0]?.message?.content || "";

    let parsed = [];
    try {
        const jsonText = String(raw).match(/\[[\s\S]*\]/)?.[0] || "[]";
        parsed = JSON.parse(jsonText);
    } catch (error) {
        console.warn("Toplu form etiketi JSON yanıtı ayrıştırılamadı:", raw, error);
    }

    if (!Array.isArray(parsed)) parsed = [];

    parsed.forEach((item) => {
        const index = Number(item?.i);
        const entry = pending.find((candidate) => candidate.index === index);
        if (!entry) return;

        const label = this.cleanFieldLabelResult(item?.l, entry.field);
        if (!label) return;

        result.set(index, {
            label,
            source: `openrouter-batch:${data.__eaModelUsed || EAConfig.defaultModel || "free"}`
        });

        if (entry.signature) {
            this.fieldLabelCache[entry.signature] = label;
        }
    });

    return result;
},

generateFieldLabel: async function(field) {
    if (!field) return null;

    this.lastFieldLabelSource = "none";
    this.lastFieldLabelError = "";

    const nlp = this.inferFieldLabelNLP(field);
    if (nlp.label && nlp.confidence >= 0.82) {
        this.lastFieldLabelSource = nlp.reason || "nlp";
        return this.cleanFieldLabelResult(nlp.label, field);
    }

    try {
        const labels = await this.generateFieldLabelsBatch([{ field, index: 0 }]);
        const item = labels.get(0);
        if (item?.label) {
            this.lastFieldLabelSource = item.source;
            return item.label;
        }
        this.lastFieldLabelError = "Model anlamlı form etiketi döndürmedi.";
    } catch (err) {
        this.lastFieldLabelError = String(err?.message || err || "");
        console.warn("OpenRouter form etiketi üretimi başarısız; yerel yedek deneniyor:", err);
    }

    const fallback = this.cleanFieldLabelResult(
        nlp.label || this.generateLocalLabel(field),
        field
    );
    if (fallback) {
        this.lastFieldLabelSource = nlp.label ? nlp.reason : "local-fallback";
        return fallback;
    }

    return null;
},

  originalContent: null,
  originalNode: null,
  running: false,
  applied: false,

  init: function () {},

  // Rapor 4.6: Bilişsel Uygulama Kontrolü
  apply: function () {
    if (EAApp.state.simplify && !this.running && !this.applied) this.runAPI();
    if (!EAApp.state.simplify && this.applied) this.restoreContent();
  },

  restoreContent: function () {
    if (this.originalNode && this.originalContent) {
      this.originalNode.innerHTML = this.originalContent;
    }
    this.originalContent = null;
    this.originalNode = null;
    this.applied = false;
  },

  
fixMissingLabels: async function(fields, options = {}) {
    const result = {
        fixed: 0,
        skipped: 0,
        failed: 0,
        attemptedAI: 0,
        usedAI: 0,
        usedLocal: 0,
        nlpResolved: 0,
        aiBatches: 0,
        cacheHits: 0,
        details: []
    };

    if (!Array.isArray(fields) || !fields.length) return result;

    const nonLabelFieldTypes = new Set([
        "hidden",
        "submit",
        "button",
        "reset",
        "image"
    ]);

    const applyLabel = (field, rawLabel, source) => {
        const label = this.cleanFieldLabelResult(rawLabel, field);
        if (!label) return false;

        const resultId = field.getAttribute("data-ea-label-result-id") ||
            `ea-label-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        field.setAttribute("aria-label", label);
        field.setAttribute("data-ea-label-source", source);
        field.setAttribute("data-ea-label-result-id", resultId);
        field.setAttribute("title", `Erişilebilirlik etiketi: ${label}`);
        field.style.setProperty("outline", "3px dashed #10b981", "important");
        field.style.setProperty("outline-offset", "2px", "important");

        result.fixed++;
        if (String(source).startsWith("openrouter")) {
            result.usedAI++;
            if (String(source).includes("cache")) result.cacheHits++;
        } else {
            result.usedLocal++;
        }

        result.details.push({
            id: resultId,
            label,
            source,
            tag: field.tagName || "ALAN",
            type: field.type || "",
            name: field.name || field.id || ""
        });
        return true;
    };

    const candidates = [];

    for (const field of fields) {
        try {
            if (!field || field.nodeType !== 1) {
                result.skipped++;
                continue;
            }

            const type = String(field.type || "").toLowerCase();
            if (nonLabelFieldTypes.has(type)) continue;

            const ariaLabel = field.getAttribute("aria-label");
            const ariaLabelledby = field.getAttribute("aria-labelledby");
            const associatedLabels = field.labels && field.labels.length > 0;

            if (
                associatedLabels ||
                (ariaLabel && ariaLabel.trim()) ||
                (ariaLabelledby && ariaLabelledby.trim())
            ) {
                continue;
            }

            if (ariaLabel !== null && !ariaLabel.trim()) {
                field.removeAttribute("aria-label");
            }

            const nlp = this.inferFieldLabelNLP(field);
            const localFallback = this.cleanFieldLabelResult(
                nlp.label || this.generateLocalLabel(field),
                field
            );

            candidates.push({ field, nlp, localFallback });
        } catch (err) {
            console.error("Form alanı hazırlanamadı:", err);
            result.failed++;
        }
    }

    if (!candidates.length) return result;

    const ambiguous = [];

    candidates.forEach((candidate, index) => {
        const { field, nlp } = candidate;
        if (nlp?.label && nlp.confidence >= 0.82) {
            if (applyLabel(field, nlp.label, nlp.reason || "nlp")) {
                result.nlpResolved++;
                console.log("🧠 NLP form etiketi uygulandı:", nlp.label, field);
                return;
            }
        }
        ambiguous.push({ ...candidate, index });
    });

    if (!ambiguous.length) {
        console.log(`🧠 Form etiketlerinin tamamı NLP ile çözüldü. AI çağrısı yapılmadı. (${result.nlpResolved})`);
        return result;
    }

    // Otomatik düzeltmede token harcamadan güvenli yerel sonuçları uygula.
    if (!options.forceAI) {
        const stillUnresolved = [];
        ambiguous.forEach((candidate) => {
            if (candidate.localFallback && applyLabel(candidate.field, candidate.localFallback, candidate.nlp?.reason || "local-fallback")) {
                return;
            }
            stillUnresolved.push(candidate);
        });

        if (!stillUnresolved.length) return result;
        ambiguous.length = 0;
        ambiguous.push(...stillUnresolved);
    }

    if (!EAApp.state.apiKey || !EAApp.state.apiKey.trim()) {
        if (!(options.askForKey && this.ensureKey())) {
            ambiguous.forEach((candidate) => {
                if (candidate.localFallback && applyLabel(candidate.field, candidate.localFallback, "local-fallback")) return;
                result.skipped++;
            });
            result.details.push({
                source: "ai-skipped",
                reason: "API anahtarı olmadığı için belirsiz alanlarda yerel NLP/yedek kullanıldı."
            });
            return result;
        }
    }

    const batchSize = 8;
    for (let offset = 0; offset < ambiguous.length; offset += batchSize) {
        const chunk = ambiguous.slice(offset, offset + batchSize);
        const entries = chunk.map((candidate, position) => ({
            field: candidate.field,
            index: position
        }));

        result.attemptedAI += chunk.length;
        result.aiBatches++;

        console.log(`📡 ${chunk.length} belirsiz form alanı tek toplu OpenRouter isteğine gönderiliyor.`);

        try {
            const labels = await this.generateFieldLabelsBatch(entries);

            chunk.forEach((candidate, position) => {
                const aiItem = labels.get(position);
                if (aiItem?.label && applyLabel(candidate.field, aiItem.label, aiItem.source)) {
                    console.log("✅ Toplu OpenRouter form etiketi uygulandı:", aiItem.label, candidate.field);
                    return;
                }

                if (candidate.localFallback && applyLabel(candidate.field, candidate.localFallback, "local-fallback")) {
                    console.warn("⚠️ AI yanıtı yok; yerel yedek uygulandı:", candidate.localFallback, candidate.field);
                    return;
                }

                result.skipped++;
                result.details.push({
                    source: "ai-empty",
                    reason: "Toplu AI yanıtında geçerli etiket bulunamadı."
                });
            });
        } catch (err) {
            console.warn("Toplu OpenRouter form etiketi isteği başarısız; yerel yedekler uygulanıyor:", err);

            chunk.forEach((candidate) => {
                if (candidate.localFallback && applyLabel(candidate.field, candidate.localFallback, "local-fallback")) return;
                result.failed++;
                result.details.push({
                    source: "ai-error",
                    reason: err.message || "AI hatası"
                });
            });
        }
    }

    return result;
},

  // CSP Engellerini Aşan Köprü Fonksiyonu
  
  getModelFallbacks: function () {
    const list = [
      EAConfig.defaultModel,
      ...(EAConfig.fallbackModels || [])
    ].filter(Boolean);

    return [...new Set(list)];
  },

  fetchOpenRouterChat: async function (payload, requestOptions = {}) {
    const models = this.getModelFallbacks();
    let lastError = null;

    for (const model of models) {
      try {
        const body = {
          ...payload,
          model
        };

        const data = await this.fetchFromBackground(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${EAApp.state.apiKey}`
            },
            body: JSON.stringify(body),
            ...requestOptions
          }
        );

        if (data?.choices?.length) {
          data.__eaModelUsed = model;
          return data;
        }

        lastError = new Error("Model boş yanıt döndürdü: " + model);
      } catch (err) {
        console.warn("OpenRouter ücretsiz model denemesi başarısız:", model, err);
        lastError = err;
      }
    }

    throw lastError || new Error("OpenRouter üzerinden uygun model bulunamadı.");
  },

fetchFromBackground: function (url, options = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: "fetchAPI", url, options }, (response) => {
        if (chrome.runtime.lastError) return reject(new Error("Arka plan servisine bağlanılamadı."));
        if (!response || !response.success) return reject(new Error(response?.error || "API Yanıtı başarısız."));
        resolve(response.data);
      });
    });
  },

  ensureKey: function () {
    if (EAApp.state.apiKey) return true;
    const userKey = window.prompt("Lütfen OpenRouter API anahtarınızı girin:");
    if (!userKey?.trim()) return false;
    EAApp.state.apiKey = userKey.trim();
    EAApp.saveState();
    return true;
  },

  // --- 🎯 GENİŞLETİLMİŞ VE AKILLI AI NAVİGASYON (Trendyol/Amazon/Hepsiburada Uyumlu) ---
  findTarget: async function (userQuery) {
    if (this.running) return;
this.running = true;
    if (!this.ensureKey()) return;

    try {
        console.log("🔍 Sayfa yerel algoritmalarla (NLP) taranıyor...");
        
        // 1. Kullanıcı Sorgusunu Temizle ve Parçala (Yerel NLP)
        const normalizedQuery = userQuery.toLowerCase().trim();
        const queryTokens = normalizedQuery.split(/\s+/); // "kırmızı ayakkabı" -> ["kırmızı", "ayakkabı"]

        // 2. Akıllı Eş Anlamlılar Sözlüğü (AI'a gitmeden niyeti anla)
        const intentDictionary = {
            "sepet": ["cart", "basket", "checkout", "ödeme"],
            "giriş": ["login", "sign in", "hesabım", "account", "user", "uye"],
            "ara": ["search", "bul", "query", "arama"],
            "iletişim": ["contact", "destek", "help", "bize ulaşın", "iletisim"],
            "favori": ["favorite", "wishlist", "kalp", "begendiklerim"]
        };

        // 3. Sadece görünür ve etkileşimli öğeleri topla
        const allElements = Array.from(
            document.querySelectorAll('a, button, [role="button"], [role="link"], input, [title], [aria-label]')
        ).filter(el => el.offsetWidth > 0 && el.offsetHeight > 0 && el.offsetParent !== null);

        // 4. YEREL PUANLAMA ALGORİTMASI (Gereksiz elementleri eleme)
        const scoredElements = allElements.map(el => {
            let score = 0;
            const text = (el.innerText || el.title || el.placeholder || el.value || "").toLowerCase().trim();
            const identity = (el.className + " " + el.id + " " + (el.getAttribute('href')||"") + " " + (el.getAttribute('aria-label')||"")).toLowerCase();

            // A. Tam Eşleşme (Çok yüksek puan)
            if (text === normalizedQuery || identity.includes(`=${normalizedQuery}`)) score += 100;

            // B. Kelime Bazlı Eşleşme
            queryTokens.forEach(token => {
                if (token.length > 2) { // Çok kısa bağlaçları atla
                    if (text.includes(token)) score += 30;
                    if (identity.includes(token)) score += 15; // href veya id içinde geçiyorsa
                }
            });

            // C. Niyet (Intent) Eşleşmesi
            for (const [key, synonyms] of Object.entries(intentDictionary)) {
                if (normalizedQuery.includes(key) || synonyms.some(s => normalizedQuery.includes(s))) {
                    if (text.includes(key) || synonyms.some(s => text.includes(s))) score += 40;
                    if (identity.includes(key) || synonyms.some(s => identity.includes(s))) score += 20;
                }
            }

            return { el, text, identity, score };
        })
        .filter(item => item.score > 0) // Puanı 0 olan çöp elementleri at
        .sort((a, b) => b.score - a.score); // En yüksek puanlılar üste

        // 5. YALNIZCA EN İYİ 10 ADAYI SEÇ (Yapay zekaya sadece bunları göndereceğiz)
        const topCandidates = scoredElements.slice(0, 10);
if (topCandidates[0] && topCandidates[0].score >= 80) {

    console.log("🧠 Yerel NLP yeterince emin. AI çağrısı yapılmadı.");

    const target = topCandidates[0].el;

    target.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    target.style.outline = "6px solid #22c55e";
    target.style.outlineOffset = "4px";

    target.focus();

    setTimeout(() => {
        target.style.outline = "";
    }, 3000);

    return;
}
        if (topCandidates.length === 0) {
            alert(`Sistem: "${userQuery}" ile ilgili sayfada hiçbir potansiyel hedef bulunamadı.`);
            return;
        }

        // 6. AI için Mikro Payload Hazırla
       const aiCandidates = topCandidates.map((item, index) => {

    const content =
        item.text
            .substring(0, 120)
            .replace(/\n/g, " ");

    const meta =
        item.identity
            .substring(0, 40)
            .replace(/\n/g, " ");

    const nearby =
        item.el.parentElement?.innerText
            ?.substring(0, 120)
            ?.replace(/\n/g, " ") || "";

    return `[ID:${index}] <${item.el.tagName}>
Metin: "${content}"
Yakın Metin: "${nearby}"
Meta: {${meta}}`;

});
const url = "https://openrouter.ai/api/v1/chat/completions";
        // Prompt çok kısaldı ve netleşti
   const promptText = `
Kullanıcının aradığı öğeyi bul.

Kullanıcı isteği:
"${userQuery}"
Aday öğeler:
${aiCandidates.join('\n\n')}

Kurallar:
- SADECE en uygun ID numarasını döndür.
- Açıklama yazma.
- Metin yazma.
- Markdown kullanma.
- Eğer bulamazsan sadece NULL yaz.

Örnek geçerli cevaplar:
0
3
7
NULL
`;

        console.log("📡 Mikro paket Aİ'ye  gönderiliyor...");

        const data = await this.fetchFromBackground(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${EAApp.state.apiKey}`
    },
    body: JSON.stringify({
model: "openrouter/free",       messages: [
            {
                role: "user",
                content: promptText
            }
        ],
        temperature: 0.1,
        max_tokens: 5
    })});

console.log(data);
const resultText = data.choices?.[0]?.message?.content?.trim() || "";
        console.log("🤖  AI Cevabı:", resultText);
        const cleanResponse =
    resultText
        ?.trim()
        ?.replace(/[^0-9]/g, '');

        const indexMatch = resultText.match(/\d+/); // Metin içinden sadece rakamı çek
        
        if (indexMatch && resultText.toLowerCase() !== "null") {
const selectedIndex =
    parseInt(cleanResponse);            
            if (topCandidates[selectedIndex]) {
                const target = topCandidates[selectedIndex].el;
                
                // Hedefe git ve görsel geri bildirim ver
                target.scrollIntoView({ behavior: "smooth", block: "center" });
                target.style.transition = "outline 0.3s ease, background-color 0.3s ease";
                target.style.outline = "6px solid #A86A73";
                target.style.outlineOffset = "4px";
                target.style.backgroundColor = "rgba(0, 74, 153, 0.1)";
                target.focus();
                
                setTimeout(() => {
                    target.style.outline = "";
                    target.style.backgroundColor = "";
                }, 4000);
            } else {
                alert(`Sistem: Hedef bulundu ancak sayfada konumlandırılamadı.`);
            }
        } else {
            // Eğer AI "null" döndürdüyse, ama bizim algoritmamızın 1 numarası çok güçlüyse onu kullan (Fallback)
            if (topCandidates[0] && topCandidates[0].score >= 50) {
                 console.log("AI bulamadı, algoritmamızın en güçlü tahmini kullanılıyor.");
                 const target = topCandidates[0].el;
                 target.scrollIntoView({ behavior: "smooth", block: "center" });
                 target.style.outline = "6px dashed #f59e0b"; // Fallback olduğunu belli etmek için turuncu
                 target.style.outlineOffset = "4px";
                 target.focus();
                 setTimeout(() => target.style.outline = "", 4000);
            } else {
                 alert(`Sistem: "${userQuery}" öğesini bu sayfada bulamadı.`);
            }
        }
    } catch (e) {

    console.error("🚫 Navigasyon Hatası:", e);

    alert("Bağlantı sırasında bir hata oluştu. Lütfen kotanızı kontrol edin.");

} finally {

    this.running = false;}},

  // --- 🧠 AI SADELEŞTİRME MODÜLÜ (Rapor 4.6) ---
  runAPI: async function () {
        if (!EAApp.state.apiKey) {
            const userKey = window.prompt("✨ Erişilebilirlik Asistanım - Akıllı Sadeleştirme\n\nSayfayı yapay zeka ile sadeleştirmek için lütfen Google  OpenRouter  API Anahtarınızı girin:\n(Bu işlem sadece ilk kullanımda bir kez istenir)");
            
            if (userKey && userKey.trim() !== '') {
                EAApp.state.apiKey = userKey.trim();
                EAApp.saveState();
            } else {
                
                return;
            }
        }

        let mainNode = document.querySelector('article') || document.querySelector('main') || document.querySelector('#content') || document.body;
        
        if (!this.originalContent) {
            this.originalContent = mainNode.innerHTML;
            this.originalNode = mainNode;
        }

        let savedImages = Array.from(mainNode.querySelectorAll('img'))
            .filter(img => img.clientWidth > 100 && img.clientHeight > 100)
            .slice(0, 3);
            
        
        mainNode.innerHTML = `
            <div style="text-align:center; padding: 100px 20px; font-family: 'Segoe UI', sans-serif;">
                <div style="border: 6px solid #f3f3f3; border-top: 6px solid #ff5722; border-radius: 50%; width: 50px; height: 50px; animation: ea-spin 1s linear infinite; margin: 0 auto 20px auto;"></div>
                <style>@keyframes ea-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                <h3 style="#111827 font-size: 24px;">Sayfa sizin için sadeleştiriliyor...</h3>
                <p style="color:#666; font-size: 16px;">Gereksiz detaylar atılıyor, metinler disleksi uyumlu hale getiriliyor.</p>
            </div>
        `;

        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.originalContent;
tempDiv.querySelectorAll(`
    script,
    style,
    nav,
    aside,
    footer,
    header,
    form,
    button,
    input,
    iframe,
    noscript,
    svg,
    canvas,
    video,
    audio,
    .ad,
    .ads,
    .banner,
    .popup,
    .modal,
    .sidebar,
    .menu,
    .navigation,
    .comment,
    .comments,
    .related,
    .recommendation,
    .footer,
    .header,
    .reflist,
    .reference
`).forEach(el => el.remove());        
const paragraphs = Array.from(
    tempDiv.querySelectorAll('p, h1, h2, h3, article li')
)
.map(el => el.innerText.trim())
.filter(text => text.length > 40)
.slice(0, 30);

let rawText = paragraphs.join('\n');

rawText = [...new Set(rawText.split('\n'))].join('\n');

rawText = rawText.substring(0, 2500);
        try {
            // İSTEKLERİ ARTIK ARKA PLAN ÜZERİNDEN YAPIYORUZ
       const url = "https://openrouter.ai/api/v1/chat/completions";

            const promptText = `Sen uzman bir web erişilebilirlik asistanısın. Aşağıda bir web sayfasının ham metni bulunuyor. Bu metni disleksi ve dikkat dağınıklığı olan bir kullanıcı için çok anlaşılır ve sade bir şekilde özetle.
Kurallar:
1. KISA ve ÖZ olsun. Gereksiz referansları ve parantez içi bilgileri at.
2. Paragrafları ve madde işaretlerini kullan.
3. Çıktının başına ASLA "İşte özet", "Tamamdır" gibi giriş cümleleri yazma. Doğrudan içeriğe başla.
4. Çıktıyı SADECE geçerli HTML etiketleriyle ver (<h2>, <p>, <ul>, <li>, <strong>). Asla markdown (\`\`\`html) kullanma!

Metin:
${rawText}`;

const data = await this.fetchFromBackground(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EAApp.state.apiKey}`
    },
    body: JSON.stringify({
model: "openrouter/free",
       messages: [
            {
                role: "user",
                content: promptText
            }
        ]
    })
});




            
if (!data.choices || data.choices.length === 0) {
    throw new Error("Yapay zekadan yanıt alınamadı.");
}

let aiHTML = data.choices?.[0]?.message?.content;

if (!aiHTML) {
    throw new Error("Yapay zekadan boş yanıt döndü.");
}

aiHTML = aiHTML
    .replace(/```html/g, '')
    .replace(/```/g, '')
    .trim();

 for (const img of savedImages) {

    if (
        !img.alt ||
        img.alt.trim().length < 5
    ) {

        try {

            const generatedAlt =
                await this.generateAltText(img);

            img.alt = generatedAlt;

            console.log(
                "🖼️ Alt metin üretildi:",
                generatedAlt
            );

        } catch (e) {

            console.warn(
                "Alt metin üretilemedi:",
                e
            );
        }
    }
}
let imageHTML = savedImages.map(img => 
    `<img 
        src="${img.src}" 
        alt="${img.alt || 'Görsel'}"
        style="
            max-width:100%;
            height:auto;
            border-radius:12px;
            margin:20px auto;
            display:block;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        "
    >`
).join('');

mainNode.innerHTML = `
    <div class="ea-simplified-view" style="max-width: 800px; margin: 0 auto; padding: 30px; font-size: 20px; line-height: 1.8; color: #222; font-family: 'Segoe UI', Arial, sans-serif;">
        ${imageHTML}
        ${aiHTML}
    </div>
`;
        } catch (err) {

    console.error(
        "Navigasyon Hatası:",
        err
    );

    alert(
        err.message
    );}
    },
    
    
    generateLocalAlt: function(img) {
    if (!img) return null;

    const visualSource = this.getVisualSource(img);
    const figureCaption = img.closest?.("figure")
        ?.querySelector?.("figcaption")
        ?.innerText;
    const nearbyHeading = img.closest?.("article, section, main")
        ?.querySelector?.("h1,h2,h3,h4")
        ?.innerText;
    const nearbyArticleText = img.closest?.("article, figure, section")
        ?.innerText
        ?.trim()
        ?.split(/\r?\n/)
        ?.find((text) => text.trim().length > 15)
        ?.substring(0, 100);
    const filename = visualSource
        .split("/")
        .pop()
        ?.split("?")[0]
        ?.replace(/[-_]/g, " ")
        ?.replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, "")
        ?.replace(/[0-9]/g, " ");

    const candidates = [
        img.alt,
        img.title,
        img.getAttribute?.("aria-label"),
        figureCaption,
        nearbyHeading,
        nearbyArticleText,
        filename
    ];

    window.__eaUsedAltTexts = window.__eaUsedAltTexts || [];

    const isBadSemanticText = (value) => {
        if (!value || typeof value !== "string") return true;

        const clean = value.replace(/\s+/g, " ").trim();
        const lower = clean.toLowerCase();
        if (clean.length < 8 || clean.length > 140) return true;
        if (["null", "undefined", "görsel", "resim", "image", "fotoğraf"].includes(lower)) return true;
        if (/\.(jpg|jpeg|png|webp|avif|gif|svg)(\?|$)/i.test(lower)) return true;
        if (/^(menu|navigation|search|home|login|cookie|privacy|audio|video)$/i.test(lower)) return true;

        const specialRatio = (clean.match(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s.,-]/gi) || []).length / clean.length;
        if (specialRatio > 0.35) return true;

        return false;
    };

    for (const candidate of candidates) {
        if (isBadSemanticText(candidate)) continue;

        const cleaned = String(candidate)
            .replace(/\s+/g, " ")
            .trim()
            .split(/\r?\n/)[0]
            .substring(0, 100);
        const normalized = cleaned.toLowerCase();

        if (window.__eaUsedAltTexts.includes(normalized)) continue;
        window.__eaUsedAltTexts.push(normalized);
        return cleaned;
    }

    return null;
},


generateProfileRecommendations: async function(userText) {
    const text = (userText || "").trim();
    if (!text) {
        return { keys: [], profile: "", explanation: "Durum bilgisi girilmedi.", source: "local" };
    }

    const allowedKeys = [
        "autoAlt", "hlLinks", "dark", "head", "reader", "altText",
        "mute", "blue", "img", "anim", "focusAssist", "largeTargets",
        "suppressDistractions", "zoom", "lh", "space", "align", "font",
        "contrast", "sat", "cb", "cbProtanopia", "cbDeuteranopia", "cbTritanopia", "cbMonochrome", "guide", "pageGuide"
    ];

    const enrichKeysByCondition = (baseKeys = [], rawText = text) => {
        const lower = rawText.toLowerCase();
        const ordered = [];

        const add = (...items) => {
            items.flat().forEach((key) => {
                if (allowedKeys.includes(key) && !ordered.includes(key)) {
                    ordered.push(key);
                }
            });
        };

        // Önce AI/yerel başlangıç anahtarlarını koru.
        add(baseKeys);

        const hasDyslexia =
            /disleksi|dyslexia|okuma güçlüğü|okuma guclugu|harfleri karıştır|harfleri karistir|kelimeleri karıştır|kelimeleri karistir/.test(lower);

        const hasLineTracking =
            /satır takip|satir takip|satırı takip|satiri takip|satırları takip|satirlari takip|satır kay|satir kay|satır atlı|satir atli|okurken kay|okuma takibi|takip edemiyorum|gözüm kayıyor|gozum kayiyor|metni takip|satırları karıştır|satirlari karistir/.test(lower);

        const hasRedGreenAmbiguous =
            /kırmızı yeşil|kirmizi yesil|kırmızı-yeşil|kirmizi-yesil|red green|red-green/.test(lower);

        const hasProtanopia =
            /protanopi|protanopia|protanomali|protanomaly|protanomi|kırmızı kör|kirmizi kor/.test(lower);

        const hasDeuteranopia =
            /deuteranopi|deuteranopia|deuteranomali|deuteranomaly|döteranopi|doteranopi|yeşil kör|yesil kor/.test(lower);

        const hasTritanopia =
            /tritanopi|tritanopia|tritanomali|tritanomaly|mavi sarı|mavi-sarı|mavi sari|mavi-sari/.test(lower);

        const hasMonochrome =
            /monokrom|monochrome|akromatopsi|achromatopsia|achromatopsi|tam renk kör|tam renk kor|renksiz gör|renksiz gor/.test(lower);

        const hasColorVision =
            hasProtanopia || hasDeuteranopia || hasTritanopia || hasMonochrome ||
            /renk kör|renk kor|renk körlüğü|renk korlugu|renk ayırt|renk ayirt/.test(lower);

        const hasLowVision =
            /az görü|az goru|az gorme|görme|gorme|astigmat|miyop|bulanık|bulanik|göz|goz|kontrast|ışık|isik|küçük yazı|kucuk yazi|yakını görem|yakini gorem/.test(lower);

        const hasMotor =
            /motor|titreme|el titreme|tıklama|tiklama|mouse|fare|küçük buton|kucuk buton|hedefe bas|parkinson|hareket kısıt|hareket kisit/.test(lower);

        const hasAttention =
            /dikkat|odak|konsantrasyon|adhd|yoğun|yogun|karmaşık|karmasik|reklam|dikkat dağıt|dikkat dagit/.test(lower);

        const hasHearing =
            /işitme|isitme|duyma|sağır|sagir|altyazı|altyazi|ses|video/.test(lower);

        const hasPhotosensitivity =
            /epilepsi|animasyon|hareketli|yanıp sönen|yanip sonen|ışık hassas|isik hassas|parlama|flash/.test(lower);

        // Şart bazlı öncelikli öneriler.
        if (hasLineTracking) {
            // Satır takibi için kullanıcının istediği mantık: büyük imleç/okuma maskesi benzeri takip rehberi.
            add("guide", "lh", "space", "font", "pageGuide", "focusAssist", "suppressDistractions");
        }

        if (hasDyslexia) {
            add("font", "lh", "space", "align", "guide", "suppressDistractions", "hlLinks");
        }

        if (hasColorVision) {
            if (hasRedGreenAmbiguous && !hasProtanopia && !hasDeuteranopia) {
                // Kırmızı-yeşil renk körlüğü genellikle protan/deuter grubudur.
                // Tek filtre uygulanabildiği için Deuteranopi daha genel seçenek olarak açılır.
                add("cbDeuteranopia");
            }

            if (hasProtanopia) add("cbProtanopia");
            if (hasDeuteranopia) add("cbDeuteranopia");
            if (hasTritanopia) add("cbTritanopia");
            if (hasMonochrome) add("cbMonochrome");

            if (!hasRedGreenAmbiguous && !hasProtanopia && !hasDeuteranopia && !hasTritanopia && !hasMonochrome) {
                add("cb");
            }

            add("contrast", "sat");
        }

        if (hasLowVision) {
            add("contrast", "zoom", "reader", "head", "altText", "autoAlt", "hlLinks");
        }

        if (hasMotor) {
            add("largeTargets", "focusAssist", "hlLinks", "space");
        }

        if (hasAttention) {
            add("suppressDistractions", "pageGuide", "focusAssist", "lh", "space");
        }

        if (hasHearing) {
            add("mute", "head", "reader", "focusAssist");
        }

        if (hasPhotosensitivity) {
            add("anim", "dark", "suppressDistractions", "sat");
        }

        if (!ordered.length) {
            add("hlLinks", "focusAssist", "lh");
        }

        return ordered.slice(0, 9);
    };

    const inferProfile = (keys, rawText = text) => {
        const lower = rawText.toLowerCase();
        const categories = new Set();

        if (keys.some(k => ["cb", "contrast", "sat", "zoom", "reader", "altText", "autoAlt"].includes(k))) {
            categories.add("vision");
        }

        if (keys.some(k => ["largeTargets", "focusAssist"].includes(k)) || /motor|titreme|mouse|fare|tıklama|tiklama/.test(lower)) {
            categories.add("motor");
        }

        if (keys.some(k => ["font", "lh", "space", "align", "guide", "pageGuide", "suppressDistractions"].includes(k))) {
            categories.add("cognitive");
        }

        if (keys.some(k => ["mute"].includes(k)) || /işitme|isitme|duyma|sağır|sagir|altyazı|altyazi/.test(lower)) {
            categories.add("hearing");
        }

        return categories.size > 1 ? "mixed" : (Array.from(categories)[0] || "mixed");
    };

    const localFallback = () => {
        const keys = enrichKeysByCondition([], text);
        const profile = inferProfile(keys, text);

        return {
            keys,
            profile,
            explanation: "OpenRouter yanıtı alınamadı; yerel durum analizine göre erişilebilirlik modları seçildi.",
            source: "local"
        };
    };

    if (!this.ensureKey()) {
        return localFallback();
    }

    const prompt = `
Sen Caelum adlı erişilebilirlik asistanının profil oluşturucususun.
Kullanıcının durumuna göre hangi erişilebilirlik modlarının açılması gerektiğini seç.

Kullanıcı durumu:
"${text}"

Kullanabileceğin mod anahtarları:
${allowedKeys.join(", ")}

Anahtar anlamları:
- cb = genel renk körlüğü filtresi
- cbProtanopia = protanopi / kırmızı algısı zorluğu filtresi
- cbDeuteranopia = deuteranopi / yeşil algısı zorluğu filtresi
- cbTritanopia = tritanopi / mavi-sarı algısı zorluğu filtresi
- cbMonochrome = monokrom / akromatopsi filtresi
- contrast = kontrast artırma
- sat = renk doygunluğu / renk algısı destek ayarı
- guide = okuma rehberi; büyük imleç, okuma çizgisi ve okuma maskesi gibi satır takibi desteklerini açar
- pageGuide = sayfa haritası / sayfa bölümleri rehberi
- font = disleksi dostu font
- lh = satır yüksekliği
- space = metin/harf boşluğu
- align = metin hizalama
- suppressDistractions = reklam ve dikkat dağıtıcı alanları gizleme
- largeTargets = büyük tıklama hedefleri
- focusAssist = net odak/focus göstergesi

Örnek 1:
Kullanıcı durumu: "disleksi ve monokrom"
Beklenen mantık:
- disleksi için: font, lh, space, align, guide, suppressDistractions
- monokrom için: cb, contrast, sat
- profil: mixed

Örnek 2:
Kullanıcı durumu: "satır takibi yapamıyorum"
Beklenen mantık:
- satır takibi için: guide, lh, space, font, pageGuide, focusAssist
- profil: cognitive

Cevabı SADECE geçerli JSON olarak döndür:
{
  "profile": "vision | motor | cognitive | hearing | mixed",
  "keys": ["modAnahtarı1", "modAnahtarı2"],
  "explanation": "Kısa Türkçe açıklama"
}

Kurallar:
- En fazla 8-9 mod seç.
- "keyboard" modunu otomatik seçme; kullanıcı isterse manuel açar.
- Kullanıcının durumuyla ilgisiz mod seçme.
- Satır takibi, okurken satır kaydırma veya metni takip edememe belirtilirse mutlaka guide öner.
- Protanopi belirtilirse cbProtanopia; deuteranopi belirtilirse cbDeuteranopia; tritanopi belirtilirse cbTritanopia; monokrom/akromatopsi belirtilirse cbMonochrome öner.
- Kırmızı-yeşil renk körlüğü belirtilirse monokrom açma; cbDeuteranopia öner.
- Genel renk körlüğü belirtilirse cb, contrast ve sat öner.
- Renk algısı sorunlarında ilgili renk körlüğü filtresini monokromla karıştırma.
- Açıklama kısa ve anlaşılır olsun.
- Markdown kullanma.
`;

    try {
        const data = await this.fetchOpenRouterChat({
            messages: [{ role: "user", content: prompt }],
            temperature: 0.15,
            max_tokens: 300
        });

        const content = data?.choices?.[0]?.message?.content || "";
        const jsonText = content.match(/\{[\s\S]*\}/)?.[0] || "{}";
        const parsed = JSON.parse(jsonText);

        const aiKeys = Array.isArray(parsed.keys)
            ? parsed.keys.filter(k => allowedKeys.includes(k))
            : [];

        let keys = enrichKeysByCondition(aiKeys, text);

        const lowerText = text.toLowerCase();
        const hasSpecificColor =
            /kırmızı yeşil|kirmizi yesil|kırmızı-yeşil|kirmizi-yesil|red green|red-green|protanopi|protanopia|protanomali|protanomaly|protanomi|deuteranopi|deuteranopia|deuteranomali|deuteranomaly|döteranopi|doteranopi|tritanopi|tritanopia|tritanomali|tritanomaly|monokrom|monochrome|akromatopsi|achromatopsia/.test(lowerText);

        if (hasSpecificColor) {
            const wanted = [];
            if (/kırmızı yeşil|kirmizi yesil|kırmızı-yeşil|kirmizi-yesil|red green|red-green/.test(lowerText)) wanted.push("cbDeuteranopia");
            if (/protanopi|protanopia|protanomali|protanomaly|protanomi/.test(lowerText)) wanted.push("cbProtanopia");
            if (/deuteranopi|deuteranopia|deuteranomali|deuteranomaly|döteranopi|doteranopi/.test(lowerText)) wanted.push("cbDeuteranopia");
            if (/tritanopi|tritanopia|tritanomali|tritanomaly/.test(lowerText)) wanted.push("cbTritanopia");
            if (/monokrom|monochrome|akromatopsi|achromatopsia/.test(lowerText)) wanted.push("cbMonochrome");

            keys = keys.filter(k => !["cb", "cbProtanopia", "cbDeuteranopia", "cbTritanopia", "cbMonochrome"].includes(k));
            keys = [...wanted.filter((k, i, arr) => arr.indexOf(k) === i), ...keys];
            ["contrast", "sat"].forEach(k => {
                if (!keys.includes(k)) keys.push(k);
            });
        }

        keys = keys.filter((key, index, arr) => arr.indexOf(key) === index).slice(0, 9);

        if (!keys.length) {
            return localFallback();
        }

        return {
            keys,
            profile: parsed.profile || inferProfile(keys, text),
            explanation: parsed.explanation || "OpenRouter analiziyle uygun erişilebilirlik modları seçildi.",
            source: "openrouter"
        };
    } catch (err) {
        console.error("OpenRouter profil oluşturucu hatası:", err);
        return {
            ...localFallback(),
            explanation: "OpenRouter model yanıtı alınamadı; yerel analizle profil oluşturuldu. Hata: " + (err.message || "bilinmeyen hata")
        };
    }
},

analyzeAccessibilityState: async function(payload) {
    if (!this.ensureKey()) {
        return null;
    }

    const prompt = `
Sen Caelum adlı yapay zeka destekli erişilebilirlik asistanısın.
Aşağıdaki OEK-4 teknik denetim skorlarını, bulgu özetlerini ve kullanıcı davranış sinyallerini birlikte değerlendir.
OEK-4 skoru istemci tarafında deterministik olarak hesaplanmıştır. Skoru yeniden hesaplama veya değiştirme; yalnızca yorumla ve uygun desteği öner.

GÖREV:
1. Kullanıcının neden zorlandığını 2-3 kısa maddeyle açıkla.
2. En uygun profili seç: vision, motor, cognitive veya hearing.
3. Kullanıcıya uygulanacak kısa çözüm önerisi ver.
4. Cevabı Türkçe, sade ve kısa yaz. Markdown tablosu kullanma.

VERİ:
${JSON.stringify(payload, null, 2)}
`;

    try {
        const data = await this.fetchOpenRouterChat({
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2,
                    max_tokens: 260
                });

        const result = data?.choices?.[0]?.message?.content?.trim();
        return result || null;
    } catch (err) {
        console.error("AI erişilebilirlik analizi başarısız:", err);
        return null;
    }
}



};