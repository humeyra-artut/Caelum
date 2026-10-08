window.EAGuide = {
  isOpen: false,
  pageItems: [], // Filtreleme için tüm öğeler (Heading + Landmark)
  pageHeaders: [], // AI'nın anlaması için sadece başlıklar

  init: function () {
    const shadow = EAApp.dom.shadow;
    const closeBtn = shadow.getElementById("ea-guide-close-btn");
    const mapBtn = shadow.getElementById("mapBtn");

    if (closeBtn) closeBtn.onclick = () => this.toggle(false);
    if (mapBtn) mapBtn.onclick = () => this.toggle();

    console.log(
      "📍 [Erişilebilirlik Asistanım] Akıllı Rehber Modülü Başlatıldı!",
    );
  },

  toggle: function (force) {
    this.isOpen = force ?? !this.isOpen;
    EAApp.state.pageGuide = this.isOpen;
    if (EAApp.loaded) EAApp.saveState();
    const modal = EAApp.dom.shadow.getElementById("ea-guide-modal");
    const mapBtn = EAApp.dom.shadow.getElementById("mapBtn");

    if (!modal) return;

    if (this.isOpen) {
      this.build();
      modal.classList.add("active");
      if (mapBtn) {
        mapBtn.classList.add("active");
        mapBtn.querySelector(".sub").innerText = "Açık";
      }

      setTimeout(() => {
        const first = modal.querySelector("button, input");
        if (first) first.focus();
      }, 100);

      if (window.EAUI?.announce) EAUI.announce("Sayfa rehberi açıldı.");
    } else {
      modal.classList.remove("active");
      if (mapBtn) {
        mapBtn.classList.remove("active");
        mapBtn.querySelector(".sub").innerText = "Kapalı";
      }
      if (window.EAUI?.announce) EAUI.announce("Sayfa rehberi kapandı.");
    }
  },

  build: function () {
    const shadow = EAApp.dom.shadow;
    const content = shadow.getElementById("ea-guide-content");
    if (!content) return;

    const isVisible = (node) => node && node.offsetParent !== null;
    const getPos = (node) => {
      const rect = node.getBoundingClientRect();
      return rect.top + window.scrollY;
    };

    const headingNodes = Array.from(
      document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    ).filter((node) => isVisible(node) && (node.innerText || "").trim().length > 0);

    const headings = headingNodes.map((node) => ({
      type: node.tagName.toUpperCase(),
      label: node.innerText.trim().replace(/\s+/g, " ").substring(0, 120),
      node,
      order: getPos(node),
      styleClass: "ea-guide-" + node.tagName.toLowerCase(),
    }));

    const landmarkSelectors = [
      "header",
      "nav",
      "main",
      "aside",
      "footer",
      "form",
      "article",
      "section",
      "[role='banner']",
      "[role='navigation']",
      "[role='main']",
      "[role='contentinfo']",
      "[role='complementary']",
      "[role='search']",
      "[role='region']",
      "[role='form']",
    ].join(",");

    const landmarkItems = Array.from(document.querySelectorAll(landmarkSelectors))
      .filter((node) => isVisible(node))
      .map((node) => this.describeLandmark(node))
      .filter(Boolean)
      .map((item) => ({ ...item, order: getPos(item.node) }));

    const unique = new Map();
    [...landmarkItems, ...headings]
      .sort((a, b) => a.order - b.order)
      .forEach((item) => {
        const key = `${item.type}|${item.label}`.toLowerCase();
        if (!unique.has(key)) unique.set(key, item);
      });

    this.pageItems = Array.from(unique.values());

    this.pageHeaders = headingNodes.map((node, index) => ({
      id: index,
      text: node.innerText.trim(),
      element: node,
    }));

    content.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:15px; padding:15px; background:#f0f4f8; border-radius:12px; border:1px solid #d1d9e6;">
                <input id="ea-ai-search-input" name="eaAiSearchInput" type="text" placeholder="AI ile sayfada ara... (Örn: iletişim formu, sonuç bölümü)" 
                    style="flex:1; padding:10px; border-radius:8px; border:1px solid #A86A73; outline:none; font-family:sans-serif;">
                <button id="ea-ai-search-btn" style="background:#ff5722; color:white; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-weight:bold;">✨ AI Bul</button>
            </div>

            <div style="margin-bottom:15px;">
                <label style="font-size:12px; color:#666; font-weight:bold;" for="ea-guide-search">BAŞLIK VEYA BÖLÜM SÜZ:</label>
                <input id="ea-guide-search" name="eaGuideSearch" type="search" placeholder="Listede filtrele..." 
                    style="width:100%; padding:10px; border:1px solid #ccc; border-radius:7px; margin-top:5px; box-sizing:border-box;">
            </div>

            <div id="ea-guide-list" style="display:flex; flex-direction:column; gap:8px;"></div>
        `;

    const filterInput = shadow.getElementById("ea-guide-search");
    filterInput.oninput = () => this.renderList(filterInput.value);

    const aiBtn = shadow.getElementById("ea-ai-search-btn");
    const aiInput = shadow.getElementById("ea-ai-search-input");
    aiBtn.onclick = () => this.runAISearch(aiInput.value);
    aiInput.onkeypress = (e) => {
      if (e.key === "Enter") this.runAISearch(aiInput.value);
    };

    this.renderList("");
  },

  describeLandmark: function (node) {
    const role = (node.getAttribute("role") || "").toLowerCase();
    const tag = node.tagName.toLowerCase();
    const ariaLabel = (node.getAttribute("aria-label") || "").trim();
    const labelledBy = (node.getAttribute("aria-labelledby") || "").trim();
    const heading = node.querySelector("h1,h2,h3,h4,h5,h6");
    const headingText = heading ? (heading.innerText || "").trim().replace(/\s+/g, " ") : "";

    let label = ariaLabel;
    if (!label && labelledBy) {
      const ref = document.getElementById(labelledBy);
      label = ref ? (ref.innerText || "").trim().replace(/\s+/g, " ") : "";
    }
    if (!label && headingText) label = headingText;

    const typeMap = {
      header: "Üst Alan",
      banner: "Üst Alan",
      nav: "Navigasyon",
      navigation: "Navigasyon",
      main: "Ana İçerik",
      aside: "Yan Panel",
      complementary: "Yan Panel",
      footer: "Alt Bilgi",
      contentinfo: "Alt Bilgi",
      form: "Form",
      search: "Arama",
      article: "Makale",
      section: "Bölüm",
      region: "Bölüm",
    };

    const rawType = role || tag;
    const type = typeMap[rawType] || "Bölüm";

    // Anlamsız/gereksiz tekrarları temizle:
    // - Generic section/article öğeleri başlıksızsa gösterme
    // - Sadece tag adını tekrar eden (örn. "section") etiketleri gösterme
    // - Kendi içinde çok kısa/boş öğeleri gösterme
    const weakLabel = !label || /^(section|article|div|bölüm)$/i.test(label.trim());
    const genericNode = ["section", "article"].includes(tag) || ["region"].includes(role);
    if (genericNode && weakLabel) return null;
    if (["header", "footer"].includes(tag) && weakLabel) return null;
    if (!label && ["nav", "main", "aside", "form"].includes(tag)) {
      label = type;
    }
    if (!label || label.length < 2) return null;

    return {
      type,
      label: label.substring(0, 120),
      node,
      styleClass: "ea-guide-landmark",
    };
  },

  renderList: function (query) {
    const list = EAApp.dom.shadow.getElementById("ea-guide-list");
    const normalized = query.trim().toLowerCase();

    const filteredItems = this.pageItems.filter(
      (item) =>
        !normalized ||
        item.label.toLowerCase().includes(normalized) ||
        item.type.toLowerCase().includes(normalized),
    );

    if (filteredItems.length === 0) {
      list.innerHTML = `<p style="text-align:center; color:#666; padding:20px;">Eşleşen sonuç bulunamadı.</p>`;
      return;
    }

    list.innerHTML = filteredItems
      .map(
        (item) => `
            <button class="ea-guide-item ${item.styleClass}" data-guide-idx="${this.pageItems.indexOf(item)}" 
                style="display:block; width:100%; text-align:left; padding:14px 14px; cursor:pointer; border-radius:12px; border:1px solid #e5e7eb; background:#fff; transition:0.2s;">
                <span style="display:inline-block; margin-bottom:6px; padding:4px 8px; border-radius:999px; background:#f3f4f6; color:#7c3a44; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.03em;">${item.type}</span>
                <div style="color:#111827; font-size:15px; font-weight:600; line-height:1.4;">${item.label}</div>
            </button>
        `,
      )
      .join("");

    list.querySelectorAll("[data-guide-idx]").forEach((btn) => {
      btn.onclick = () => {
        const item = this.pageItems[parseInt(btn.dataset.guideIdx)];
        this.navigate(item.node);
      };
    });
  },

  runAISearch: async function (query) {
    if (!query.trim()) {
      alert("Lütfen arama girin.");
      return;
    }
    if (!EAApp.state.apiKey) {
      alert("Önce 'AI Sadeleştir' kısmından API anahtarı girin.");
      return;
    }

    const aiBtn = EAApp.dom.shadow.getElementById("ea-ai-search-btn");
    if (aiBtn) {
      aiBtn.innerText = "⏳ Arıyor...";
      aiBtn.disabled = true;
    }

    try {
      let headerListText = this.pageHeaders
        .map((h) => `[ID:${h.id}] ${h.text}`)
        .join("\n");
      const promptText = `Kullanıcı şu bölümü arıyor: "${query}"

Aşağıdaki başlıklardan en uygun olanın SADECE ID numarasını yaz:

${headerListText}`;

      const data = await EAAI.fetchFromBackground(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${EAApp.state.captionApiKey}`,        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        },
      );

      if (!data.candidates || data.candidates.length === 0)
        throw new Error("AI yanıt veremedi.");

      const text = data.candidates[0].content?.parts[0]?.text || "";
      const id = parseInt(text.replace(/[^0-9]/g, ""));
      const target = this.pageHeaders.find((h) => h.id === id);

      if (target) {
        this.navigate(target.element);
      } else {
        alert("AI bu konuyla ilgili uygun bir bölüm bulamadı.");
      }
    } catch (err) {
      console.error(err);
      alert("AI araması başarısız: " + err.message);
    } finally {
      if (aiBtn) {
        aiBtn.innerText = "✨ AI Bul";
        aiBtn.disabled = false;
      }
    }
  },

  navigate: function (node) {
    this.toggle(false);

    node.scrollIntoView({ behavior: "smooth", block: "center" });

    if (node.tabIndex === -1 || !node.hasAttribute("tabindex")) {
      node.setAttribute("tabindex", "-1");
    }
    node.focus();

    const originalOutline = node.style.outline;
    const originalOffset = node.style.outlineOffset;
    const originalBg = node.style.backgroundColor;

    node.style.outline = "5px solid #ff5722";
    node.style.outlineOffset = "5px";
    node.style.backgroundColor = "rgba(255,87,34,.15)";
    node.style.borderRadius = "6px";

    setTimeout(() => {
      node.style.outline = originalOutline;
      node.style.outlineOffset = originalOffset;
      node.style.backgroundColor = originalBg;
    }, 2500);

    if (window.EAUI?.announce) EAUI.announce("İlgili bölüme gidildi.");
  },
};
