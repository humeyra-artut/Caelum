window.EAFilters = {
  ensureColorBlindFilters: function () {
    if (document.getElementById("ea-colorblind-svg-filters")) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "ea-colorblind-svg-filters");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;left:-9999px;top:-9999px;";
    svg.innerHTML = `
      <defs>
        <filter id="cb-protan" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0" />
        </filter>
        <filter id="cb-deuter" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0   0 0
            0.700 0.300 0   0 0
            0     0.300 0.7 0 0
            0     0     0   1 0" />
        </filter>
        <filter id="cb-tritan" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            0.950 0.050 0     0 0
            0     0.433 0.567 0 0
            0     0.475 0.525 0 0
            0     0     0     1 0" />
        </filter>
        <filter id="cb-achrom" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            0.299 0.587 0.114 0 0
            0.299 0.587 0.114 0 0
            0.299 0.587 0.114 0 0
            0     0     0     1 0" />
        </filter>
      </defs>`;

    document.body.appendChild(svg);
  },

  apply: function () {
    this.ensureColorBlindFilters();

    const s = EAApp.state;
    const h = EAApp.dom.html;
    const body = document.body;

    h.className = h.className.replace(/\bea-\S+/g, "");
    h.classList.toggle("ea-hl-links", s.hlLinks);
    h.classList.toggle("ea-hide-img", s.img);
    h.classList.toggle("ea-stop-anim", s.anim);
    h.classList.toggle("ea-dark-mode", s.dark);
    h.classList.toggle("ea-show-headings", s.head);
    h.classList.toggle("ea-screen-reader", s.reader);
    h.classList.toggle("ea-keyboard-nav", s.keyboard);
    h.classList.toggle("ea-cognitive", s.cognitive);
    h.classList.toggle("ea-large-targets", s.largeTargets);
    h.classList.toggle("ea-suppress-distractions", s.suppressDistractions);

    document.querySelectorAll("audio, video").forEach((el) => {
      el.muted = s.mute;
    });

    const blueOverlay = document.getElementById("ea-blue-overlay");
    if (blueOverlay) blueOverlay.classList.toggle("active", s.blue);

    if (s.zoom > 0) h.classList.add(`ea-zoom-${s.zoom}`);
    if (s.lh > 0) h.classList.add(`ea-lh-${s.lh}`);
    if (s.align > 0) h.classList.add(`ea-align-${s.align}`);
    if (s.space > 0) h.classList.add(`ea-space-${s.space}`);
    if (s.font > 0) h.classList.add(`ea-font-${s.font}`);
    if (s.contrast > 0) h.classList.add(`ea-contrast-${s.contrast}`);
    if (s.sat > 0) h.classList.add(`ea-sat-${s.sat}`);
    if (s.cb > 0) h.classList.add(`ea-cb-${s.cb}`);

    if (s.focusAssist > 0) h.classList.add(`ea-focus-${s.focusAssist}`);

    h.classList.toggle("ea-large-cursor", s.guide === 1);
    const virtualCursor = document.getElementById("ea-virtual-cursor");
    if (virtualCursor) virtualCursor.classList.toggle("active", s.guide === 1);

    const readingLine = document.getElementById("ea-reading-line");
    const readingMask = document.getElementById("ea-reading-mask");
    if (readingLine) readingLine.classList.toggle("active", s.guide === 2);
    if (readingMask) readingMask.classList.toggle("active", s.guide === 3);

    const filters = [];
    if (s.contrast === 1) filters.push("invert(100%)");
    if (s.contrast === 2) filters.push("invert(100%) hue-rotate(180deg) contrast(120%) brightness(80%)");
    if (s.contrast === 3) filters.push("contrast(150%) brightness(120%)");
    if (s.sat === 1) filters.push("saturate(50%)");
    if (s.sat === 2) filters.push("saturate(200%)");
    if (s.sat === 3) filters.push("grayscale(100%)");

    // Renk körlüğü modu artık gerçek SVG filtreleriyle uygulanır.
    // Eski halinde SVG filtreleri DOM'a eklenmediği için buton tıklanıyor ama gözle görülür değişiklik oluşmuyordu.
    if (s.cb === 1) filters.push("url(#cb-protan) contrast(115%) saturate(120%)");
    if (s.cb === 2) filters.push("url(#cb-deuter) contrast(115%) saturate(120%)");
    if (s.cb === 3) filters.push("url(#cb-tritan) contrast(112%) saturate(125%)");
    if (s.cb === 4) filters.push("url(#cb-achrom) grayscale(100%) contrast(120%)");

    const filterValue = filters.join(" ");

    // Filtreyi body üzerinde uyguluyoruz; böylece asistan paneli okunabilir kalır.
    h.style.removeProperty("filter");
    if (body) {
      if (filterValue) {
        body.style.setProperty("filter", filterValue, "important");
        body.style.setProperty("transform", "translateZ(0)", "important");
      } else {
        body.style.removeProperty("filter");
        body.style.removeProperty("transform");
      }
    }
  },
};
