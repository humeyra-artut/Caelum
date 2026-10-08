window.EAUI = {
  heatmapVisible: false,

  init: function () {
    EAApp.dom.root = document.createElement("div");
    EAApp.dom.root.id = "ea-accessibility-assistant";
    EAApp.dom.html.appendChild(EAApp.dom.root);
    EAApp.dom.shadow = EAApp.dom.root.attachShadow({ mode: "closed" });
    this.injectPageStyles();
    this.injectPageHelpers();
    this.renderShell();
    this.setupEvents();
  },

  injectPageStyles: function () {
    const style = document.createElement("style");
    style.textContent = `
            /* --- 1. ESKİ STABİL SİSTEMDEN GELEN GÜÇLÜ SAYFA FİLTRELERİ --- */
            /* Bağlantı Vurgulama */
            html.ea-hl-links a, 
            html.ea-hl-links a * { 
                background-color: #ffeb3b !important; 
                color: #000 !important; 
                font-weight: bold !important; 
                text-decoration: underline !important; 
            }
            html.ea-hl-links a {
                outline: 3px solid #f57f17 !important; 
                outline-offset: 2px !important;
            }            
            /* Kademeli Yakınlaştırma (Zoom) */
            html.ea-zoom-1 body { zoom: 1.15 !important; } 
            html.ea-zoom-2 body { zoom: 1.30 !important; } 
            html.ea-zoom-3 body { zoom: 1.50 !important; }
            
            /* Metin Düzenlemeleri (Satır Boyu ve Boşluk) */
            html.ea-lh-1 * { line-height: 2 !important; } 
            html.ea-lh-2 * { line-height: 2.25 !important; } 
            html.ea-lh-3 * { line-height: 2.50 !important; }
            html.ea-space-1 * { letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } 
            html.ea-space-2 * { letter-spacing: 0.18em !important; word-spacing: 0.24em !important; }
            
            /* Font ve Okunabilirlik */
            html.ea-font-1 * { font-family: 'Comic Sans MS', cursive, sans-serif !important; } 
            html.ea-font-2 * { font-family: 'Arial', sans-serif !important; letter-spacing: 0.1em !important; }
            
            /* Görsel ve Animasyon Kontrolü */
            html.ea-hide-img img, html.ea-hide-img svg, html.ea-hide-img picture { display: none !important; opacity: 0 !important; }
            html.ea-stop-anim * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
            
            /* Karanlık Mod ve Kontrast */
            html.ea-dark-mode { 
                filter: invert(1) hue-rotate(180deg) contrast(1.1) brightness(0.95) !important; 
                background: #fff !important; 
            }
            html.ea-dark-mode body {
                background-color: #fff !important; 
            }

            html.ea-dark-mode img, 
            html.ea-dark-mode video, 
            html.ea-dark-mode canvas,
            html.ea-dark-mode iframe,
            html.ea-dark-mode picture { 
                filter: invert(1) hue-rotate(180deg) !important; 
            }

            /* Div arka planı olarak CSS ile verilen haber görsellerinin negatif olmasını engeller */
            html.ea-dark-mode [style*="background-image"] {
                filter: invert(1) hue-rotate(180deg) !important; 
            }

            html.ea-dark-mode * {
            text-shadow: none !important; 
            box-shadow: none !important; 
            }

            /* Erişilebilirlik Yardımcıları (Başlıklar ve Klavye) */
            html.ea-show-headings h1, html.ea-show-headings h2, html.ea-show-headings h3 { outline: 3px solid #ffeb3b !important; outline-offset: 2px !important; background-color: rgba(255, 235, 59, 0.2) !important; }
            html.ea-screen-reader *:hover { outline: 2px dashed #A86A73 !important; cursor: help !important; }
            html.ea-keyboard-nav *:focus, html.ea-keyboard-nav *:focus-visible { outline: 5px solid #ff5722 !important; outline-offset: 4px !important; box-shadow: 0 0 15px rgba(255, 87, 34, 0.8) !important; }
            
            /* --- BÜYÜK TIKLANABİLİR HEDEFLER --- */
            html.ea-large-targets button,
            html.ea-large-targets a,
            html.ea-large-targets input,
            html.ea-large-targets [role="button"],
            html.ea-large-targets [data-ea-keyboard-fixed="true"] {
                min-width: 48px !important;
                min-height: 48px !important;
                padding: 12px !important;
            }

            /* --- 3 KADEMELİ ODAK YARDIMI --- */
            html.ea-focus-1 *:focus, html.ea-focus-1 *:focus-visible { outline: 4px solid #ff5722 !important; outline-offset: 4px !important; }
            html.ea-focus-2 *:focus, html.ea-focus-2 *:focus-visible { outline: 4px solid #2563eb !important; outline-offset: 4px !important; box-shadow: 0 0 15px 5px rgba(37,99,235,0.6) !important; }
            html.ea-focus-3 *:focus, html.ea-focus-3 *:focus-visible { outline: 4px solid #6f78bd !important; outline-offset: 4px !important; box-shadow: 0 0 0 9999px rgba(0,0,0,0.65) !important; position: relative; z-index: 2147483641 !important; background: white !important; color: black !important; }

            /* --- REKLAM / DİKKAT DAĞITICI ALAN GİZLEME --- */
            html.ea-suppress-distractions aside,
            html.ea-suppress-distractions iframe,
            html.ea-suppress-distractions [class*="banner" i],
            html.ea-suppress-distractions [class*="popup" i],
            html.ea-suppress-distractions [class*="ads" i],
            html.ea-suppress-distractions [class*="ad-" i],
            html.ea-suppress-distractions [class*="-ad" i],
            html.ea-suppress-distractions [class*="advert" i],
            html.ea-suppress-distractions [class*="reklam" i],
            html.ea-suppress-distractions [class*="sponsor" i],
            html.ea-suppress-distractions [id*="banner" i],
            html.ea-suppress-distractions [id*="ads" i],
            html.ea-suppress-distractions [id*="advert" i],
            html.ea-suppress-distractions [id*="reklam" i],
            html.ea-suppress-distractions [id*="sponsor" i],
            html.ea-suppress-distractions [data-ad],
            html.ea-suppress-distractions [data-ads],
            html.ea-suppress-distractions [data-ad-slot],
            html.ea-suppress-distractions [aria-label*="reklam" i],
            html.ea-suppress-distractions [aria-label*="sponsor" i] {
                display: none !important;
            }

            /* --- 2. YENİ SİSTEMİN ÖZEL GÖRSEL ARAÇLARI --- */
            /* Isı Haritası (Heatmap) Katmanı */
            #ea-heatmap-canvas { position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:2147483640; display:none; }
            
            /* Alt Metin Bilgi Kutusu */
            #ea-alt-tooltip { position:fixed; background:#101828; color:#fff; padding:8px 10px; border-radius:6px; font:13px Arial; z-index:2147483647; display:none; pointer-events:none; border: 1px solid #ffeb3b; }
            
            /* Mavi Işık Filtresi */
            #ea-blue-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 60, 150, 0.25) !important; z-index: 2147483645; pointer-events: none; display: none; }
            #ea-blue-overlay.active { display: block !important; }

            /* Okuma Rehberi ve Sanal İmleç */
            html.ea-large-cursor, html.ea-large-cursor * { cursor: none !important; }
            #ea-virtual-cursor { position: fixed; width: 64px; height: 64px; background-image: url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='%23ff5722' stroke='%23000000' stroke-width='7' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='12,6 47,35 31,37 42,58 32,62 23,41 10,51'/%3E%3C/svg%3E"); background-size: contain; background-repeat:no-repeat; z-index: 2147483647; pointer-events: none; display: none; transform: translate(-6px,-4px); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45)); }
            #ea-virtual-cursor.active { display: block; }
            #ea-reading-line { position: fixed; width: 50vw; height: 14px; background: black; border: 3px solid #ffeb3b; border-radius: 8px; z-index: 2147483646; pointer-events: none; display: none; transform: translateX(-50%); }
            #ea-reading-line.active { display: block; }
            #ea-reading-mask { position: fixed; inset: 0; z-index: 2147483645; pointer-events: none; display: none; background: transparent; }
            #ea-reading-mask.active { display: block; }
            #ea-mask-hole { position: fixed; left: 0; top: 45%; width: 100vw; height: 120px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.55); border-top: 2px solid #ffeb3b; border-bottom: 2px solid #ffeb3b; background: transparent; pointer-events: none; }


            /* --- METİN HİZALAMA --- */
            html.ea-align-1 * { text-align: left !important; }
            html.ea-align-2 * { text-align: center !important; }
            html.ea-align-3 * { text-align: right !important; }
            html.ea-align-4 * { text-align: justify !important; }

            /* --- DİSLEKSİ FONTU --- */
            html.ea-font-1 * { font-family: 'OpenDyslexic', 'Comic Sans MS', cursive, sans-serif !important; }
            html.ea-font-2 * { font-family: 'Arial', sans-serif !important; font-weight: 500 !important; }
        `;
    document.head.appendChild(style);

    // Gerekli DOM elemanlarını sayfaya ekle
    const elements = [
      { id: "ea-heatmap-canvas", tag: "canvas" },
      { id: "ea-blue-overlay", tag: "div" },
      { id: "ea-virtual-cursor", tag: "div" },
      { id: "ea-reading-line", tag: "div" },
      { id: "ea-reading-mask", tag: "div" },
      { id: "ea-alt-tooltip", tag: "div" },
    ];

    elements.forEach((item) => {
      if (!document.getElementById(item.id)) {
        const el = document.createElement(item.tag);
        el.id = item.id;
        if (item.id === "ea-reading-mask") {
          el.innerHTML = `<div id="ea-mask-hole"></div>`;
        }
        document.body.appendChild(el);
      }
    });
  },

  injectPageHelpers: function () {
    const live = document.createElement("div");
    live.id = "ea-live-region";
    live.style.cssText =
      "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);";
    document.body.appendChild(live);
  },

  renderShell: function () {
    EAApp.dom.shadow.innerHTML = `
    <style>
        :host { all: initial; } * { box-sizing:border-box; font-family:'Segoe UI', sans-serif; }
        button:focus-visible, input:focus-visible { outline:3px solid #f97316; outline-offset:3px; box-shadow:0 0 0 4px rgba(249,115,22,0.24); }
        .floating-btn {position:fixed;
right:20px;
top:20px;
width:68px;
height:68px;
border-radius:50%;
border:none;
cursor:pointer;
z-index:2147483647;

background:
linear-gradient(135deg,#A86A73,#D8B7BF);

box-shadow:
0 12px 40px rgba(168,85,247,.45);

transition:.3s; }
        .floating-btn:hover { transform: scale(1.1); background: #A86A73; }
        
        .panel { position:fixed; right:20px; top:90px; width:420px; max-height:calc(100vh - 120px); background:rgba(255,255,255,0.72);
backdrop-filter:blur(18px);
-webkit-backdrop-filter:blur(18px);
border:1px solid rgba(255,255,255,0.4); border-radius:16px; box-shadow:0 12px 48px rgba(0,0,0,0.2); z-index:2147483647; border:1px solid #ddd; display:none; flex-direction:column; overflow:hidden; }
        .panel.open { display:flex; }
        
        .header {
         
display:flex;
align-items:center;
justify-content:space-between;

background:linear-gradient(135deg,#A86A73,#D8B7BF);

color:white;

padding:14px 18px;

font-size:18px;
font-weight:800;

letter-spacing:.5px;
}
        .ea-tabs {  display:flex;
    justify-content:center;
    align-items:center;
    gap:12px;
    padding:10px; }
        .tab { border:1px solid #c7d6ea; background:white; padding:10px 4px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; color:#111827; text-align:center; transition: 0.2s; width:95px;
    flex:none; }
        .tab.active { background:#A86A73; color:white; border-color: #A86A73; }
        
        .content { overflow-y:auto; padding:15px; flex-grow:1; scrollbar-width: thin; }
        .section { display:none; } .section.active { display:block; }
        
        .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
        .btn-mode { background:#fff; border:1px solid #d8deea; padding:12px 8px 10px; min-height:108px; height:108px; border-radius:14px; cursor:pointer; font-size:12px; font-weight:800; color:#0f172a; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; transition: all 0.2s; box-shadow: 0 3px 10px rgba(15,23,42,0.06); gap:4px; }
.btn-mode b{
display:flex;
align-items:center;
justify-content:center;
text-align:center;
min-height:38px;
line-height:1.3;
font-size:13.5px;
font-weight:900;
letter-spacing:0.01em;
color:#0f172a;
}

        .btn-mode:hover{
    transform:translateY(-3px);
    box-shadow:0 12px 28px rgba(139,92,246,.18);
}

.btn-mode.active{
    background:linear-gradient(135deg,#8e7bdb,#d68f9a);
    color:white;
    border:none;
    box-shadow:0 14px 40px rgba(168,85,247,.35);
}
        .btn-mode .emoji { font-size: 24px; margin-bottom: 4px; }
        .btn-mode .sub-label { font-size:10.5px; line-height:1.25; opacity:1; margin-top:4px; background: rgba(15,23,42,0.09); color:#1f2937; font-weight:900; padding: 3px 7px; border-radius: 7px; border:1px solid rgba(15,23,42,0.06); }
        .btn-mode.active b { color:#fff !important; }
        .btn-mode.active .sub-label { color:#fff; background:rgba(255,255,255,0.26); border-color:rgba(255,255,255,0.18); }
.btn-mode.active{
background:linear-gradient(135deg,#A86A73,#D8B7BF);
color:white;
border:none;
box-shadow:
0 14px 40px rgba(168,85,247,.35);
}
        /* --- 🔥 ÖZET SEKMMESİ VE PROFİL BUTONLARI --- */
        .score-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:15px; }
        .score { background:white; border:1px solid #d7e0ea; border-radius:8px; padding:10px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        .score strong { display: block; font-size: 10px; color: #64748b; margin-bottom: 4px; }
        .score span { font-size:18px; font-weight:800; #111827 }

        .profile-btn { width:100%; border:1px solid #cad5e4; background:white; border-radius:10px; padding:12px; margin-bottom:8px; cursor:pointer; text-align:left; transition: 0.2s; }
        .profile-btn b { display:block; font-size:13px; #111827 }
        .profile-btn i { display:block; font-size:11px; color:#64748b; font-style:normal; margin-top:4px; line-height:1.4; }
        .profile-btn:hover { border-#111827 background: #f0f7ff; }
        .profile-btn.active { border-#111827 background:#eaf2ff; box-shadow: inset 0 0 0 1px #A86A73; }

        .finding { background:white; border:1px solid #d7e0ea; border-left:5px solid #A86A73; border-radius:8px; padding:12px; margin:10px 0; }
        .finding h4 { margin: 0 0 5px 0; font-size: 14px; color: #1e293b; }
        .finding p { margin: 0; font-size: 13px; color: #64748b; }
        .ea-ai-fix-btn{ margin-top:10px; border:none; background:#A86A73; color:white; padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600; width:100%; }
        
        /* --- FINDING SEVERITY --- */
        .finding-severity { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .finding.critical { border-left: 6px solid #dc2626 !important; }
        .finding.medium { border-left: 6px solid #f59e0b !important; }
        .finding.low { border-left: 6px solid #2563eb !important; }
        .finding.success { border-left: 6px solid #22c55e !important; background:linear-gradient(135deg,#ffffff,#f0fdf4); }
        .finding.success .finding-severity {
            display:inline-flex;
            align-items:center;
            gap:5px;
            background:#dcfce7;
            color:#166534;
            border:1px solid #bbf7d0;
            border-radius:999px;
            padding:4px 8px;
            font-size:11px;
            font-weight:900;
        }
        .finding.not-applicable { border-left: 6px solid #94a3b8 !important; background:linear-gradient(135deg,#ffffff,#f8fafc); }
        .finding.not-applicable .finding-severity {
            display:inline-flex;
            align-items:center;
            background:#e2e8f0;
            color:#475569;
            border:1px solid #cbd5e1;
            border-radius:999px;
            padding:4px 8px;
            font-size:11px;
            font-weight:900;
        }
        .finding-tags { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 10px; }
        .finding-tags span { background:#f1f5f9; border:1px solid #e2e8f0; color:#334155; border-radius:999px; padding:3px 8px; font-size:10px; font-weight:700; }
        .audit-overview-card { background:linear-gradient(135deg,#f8fafc,#eef2ff); border:1px solid #dbe4ff; border-radius:14px; padding:12px; margin-bottom:12px; }
        .audit-overview-title { font-weight:900; color:#334155; margin-bottom:8px; font-size:13px; }
        .audit-overview-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; margin:8px 0; }
        .audit-chip { background:white; border:1px solid #e2e8f0; border-radius:10px; padding:8px; font-size:11px; }
        .audit-chip b { display:block; color:#111827; font-size:16px; margin-top:3px; }
        .audit-formula { font-size:10px; color:#475569; line-height:1.45; background:rgba(255,255,255,0.72); border:1px dashed #cbd5e1; border-radius:10px; padding:8px; }
        /* =========================
   AI FIX RESULT
========================= */

.ai-fix-report{

    margin-top:14px;

    background:
        linear-gradient(
            135deg,
            #ecfeff,
            #f8f7ff
        );

    border:1px solid #a7f3d0;

    border-radius:16px;

    padding:14px;

    animation:aiFade 0.35s ease;
}

.ai-fix-top{

    display:flex;
    align-items:center;
    justify-content:space-between;

    margin-bottom:10px;
}

.ai-fix-badge{

    background:#6f78bd;
    color:white;

    padding:6px 10px;

    border-radius:999px;

    font-size:11px;
    font-weight:800;

    letter-spacing:0.3px;
}

.ai-fix-title{

    font-size:14px;
    font-weight:800;

    color:#4e568f;
}

.ai-fix-list{

    display:flex;
    flex-direction:column;

    gap:8px;
}

.ai-fix-item{

    background:white;

    border-radius:12px;

    padding:10px 12px;

    font-size:13px;

    color:#334155;

    border:1px solid #dcfce7;

    display:flex;
    align-items:center;

    gap:8px;
}

.ai-fix-score{

    margin-top:12px;

    background:#111827;

    color:white;

    border-radius:12px;

    padding:12px;

    text-align:center;

    font-size:13px;

    font-weight:600;
}
.heatmap-btn{
width:100%;
min-height:72px;
margin-bottom:16px;

border:none;
border-radius:20px;

background:linear-gradient(135deg,#A86A73,#D8B7BF);

color:white;

font-size:16px;
font-weight:800;

cursor:pointer;

transition:.25s;

box-shadow:0 10px 30px rgba(139,92,246,.22);

display:flex;
align-items:center;
justify-content:center;
gap:10px;
}

.heatmap-btn:hover{
transform:translateY(-2px);
box-shadow:0 16px 40px rgba(139,92,246,.32);
}
.ai-fix-score strong{

    font-size:18px;

    display:block;

    margin-top:4px;
}

.finding.fixed{

    border-color:#6f78bd !important;

    background:#f8f7ff;

    box-shadow:
        0 10px 30px rgba(111,120,189,0.15);
}

.finding.fixed .fix-btn{

    background:#6f78bd;
}
.ea-fix-score-card{

    background:#ffffff;

    border:1px solid #dbe4f0;

    border-radius:18px;

    padding:14px;

    margin:14px 0;

    box-shadow:
        0 4px 12px rgba(15,23,42,0.05);
}

.ea-fix-score-top{

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-bottom:10px;
}

.ea-fix-score-title{

    font-size:13px;

    font-weight:600;

    color:#334155;
}

.ea-fix-percent{

    font-size:20px;

    font-weight:900;

    color:#6f78bd;
}

.ea-fix-progress{

    width:100%;

    height:8px;

    background:#e2e8f0;

    border-radius:999px;

    overflow:hidden;

    margin-bottom:10px;
}

.ea-fix-progress-fill{

    height:100%;

    background:
        linear-gradient(
            90deg,
            #6f78bd,
            #d98a92
        );

    border-radius:999px;

    transition:0.4s ease;
}

.ea-fix-detail{

    font-size:12px;

    color:#64748b;
}

.ea-fix-score-card::before{

    content:"";

    position:absolute;

    top:-80px;
    right:-80px;

    width:180px;
    height:180px;

    background:
        radial-gradient(
            circle,
            rgba(111,120,189,0.20),
            transparent 70%
        );

    pointer-events:none;
}

.ea-fix-score-title{

    font-size:13px;

    font-weight:600;

    color:#94a3b8;

    letter-spacing:0.4px;

    margin-bottom:18px;

    text-transform:uppercase;
}

.ea-fix-main{

    display:flex;

    align-items:end;

    gap:10px;

    margin-bottom:18px;
}

.ea-fix-percent{

    font-size:52px;

    line-height:1;

    font-weight:900;

    color:#d98a92;
}

.ea-fix-label{

    font-size:15px;

    font-weight:600;

    color:#e2e8f0;

    margin-bottom:6px;
}

.ea-fix-progress{

    width:100%;

    height:12px;

    background:
        rgba(255,255,255,0.08);

    border-radius:999px;

    overflow:hidden;

    margin-bottom:18px;
}

.ea-fix-progress-fill{

    height:100%;

    border-radius:999px;

    background:
        linear-gradient(
            90deg,
            #6f78bd,
            #d98a92,
            #e7b965
        );

    box-shadow:
        0 0 20px rgba(217,138,146,0.35);

    transition:0.5s ease;
}

.ea-fix-stats{

    display:grid;

    grid-template-columns:1fr 1fr;

    gap:12px;
}

.ea-fix-stat{

    background:
        rgba(255,255,255,0.05);

    border:1px solid rgba(255,255,255,0.06);

    border-radius:16px;

    padding:14px;
}

.ea-fix-stat strong{

    display:block;

    font-size:22px;

    margin-bottom:4px;

    color:white;
}

.ea-fix-stat span{

    font-size:12px;

    color:#94a3b8;
}

.ea-fix-score-title{

    font-size:14px;

    font-weight:600;

    color:#334155;

    margin-bottom:10px;
}

.ea-fix-percent{

    font-size:30px;

    font-weight:900;

    color:#6f78bd;

    margin-bottom:12px;
}

.ea-fix-progress{

    width:100%;

    height:14px;

    background:#e5e7eb;

    border-radius:999px;

    overflow:hidden;
}

.ea-fix-progress-fill{

    height:100%;

    background:linear-gradient(
        90deg,
        #6f78bd,
        #d98a92
    );

    border-radius:999px;

    transition:0.4s ease;
}

.ea-fix-detail{

    margin-top:10px;

    font-size:13px;

    color:#64748b;
}
@keyframes aiFade{

    from{
        opacity:0;
        transform:translateY(10px);
    }

    to{
        opacity:1;
        transform:translateY(0);
    }
}
        .nav-input { flex:1; padding:8px 12px; border-radius:8px; border:1px solid #cad5e4; font-size:13px; outline:none; }
.reset-btn {
    width:100%;
    margin-top:15px;
    background:#334155;
    color:white;
    border:none;
    padding:14px;
    border-radius:10px;
    cursor:pointer;
    font-weight:bold;
    transition:0.2s;
}
.content::-webkit-scrollbar{
width:8px;
}

.content::-webkit-scrollbar-thumb{
background:linear-gradient(#A86A73,#D8B7BF);
border-radius:999px;
}
#closeMenu:hover{
background:rgba(255,255,255,0.28);
transform:scale(1.05);
}

/* AI BAR */
.ea-ai-bar{
    display:flex;

    flex-direction:column;

    align-items:center;

    justify-content:space-between;

    gap:12px;

    background:linear-gradient(
        90deg,
        #8A6170,
        #B38A96,
        #D8B7BF
    );

    padding:14px;
    border-radius:18px;
    margin-bottom:16px;

    color:white;
    font-weight:600;

    box-shadow:0 8px 20px rgba(147,51,234,0.25);
}

.ea-ai-left{
    font-size:15px;
}

/* AI BUTTONS */

.ea-ai-actions{
    display:flex;

    gap:10px;

    

    justify-content:center;
}

.ea-ai-btn{
    border:none;
    background:white;
    color:#8A6170;

    padding:10px 14px;

    border-radius:999px;

    font-weight:800;
    cursor:pointer;

    transition:0.2s;

    font-size:12px;

    white-space:nowrap;
}

.ea-ai-btn:hover{
    transform:scale(1.05);
}

.ea-ai-btn.active{
    background:#111827;
    color:white;
}

/* =========================
   SAYFA REHBERİ MODALI
========================= */
        /* =========================
           SAYFA REHBERİ MODALI (EAGuide Uyumlu)
        ========================= */
        #ea-guide-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 760px; max-width: 92vw; max-height: 85vh; background: #ffffff;
            border-radius: 18px; box-shadow: 0 25px 60px rgba(0,0,0,0.28);
            z-index: 2147483647; display: none; flex-direction: column;
            overflow: hidden; border: 1px solid #dbe4f0;
        }
        #ea-guide-modal.active { display: flex; } /* JavaScript active sınıfını kullanıyor */
        
        #ea-guide-header {
            background: #A86A73; color: white; padding: 18px 22px;
            display: flex; justify-content: space-between; align-items: center;
            font-size: 20px; font-weight: 700;
        }
        #ea-guide-close-btn { border: none; background: transparent; color: white; font-size: 28px; cursor: pointer; }
        #ea-guide-content { overflow-y: auto; padding: 20px; background: #f7f9fc; display: flex; flex-direction: column; gap: 14px; }

        /* GUIDE ITEM */
        .ea-guide-item {
            background: white; border-radius: 14px; padding: 18px;
            border-left: 6px solid #4a90e2; cursor: pointer; transition: 0.2s ease;
            font-size: 16px; line-height: 1.5; border-top: 1px solid #eee; border-right: 1px solid #eee; border-bottom: 1px solid #eee; text-align: left;
        }
        .ea-guide-item:hover { transform: translateX(4px); background: #eef5ff; border-left-color:#6f78bd; outline: 2px solid #d98a92; outline-offset: -2px; }
        .ea-guide-h1 { border-left-color: #A86A73; font-size: 18px; font-weight: 800; background: #e8f0fe; }
        .ea-guide-h2 { border-left-color: #2563eb; font-weight: 700; margin-left: 10px; }
        .ea-guide-h3 { border-left-color: #60a5fa; font-weight: 600; margin-left: 20px; }
        .ea-guide-landmark { border-left-color: #6f78bd; background: #f8f7ff; font-weight: bold; margin-top: 10px; color: #8a4c56;}

        /* Soft premium finish - visual only */
        :host {
            --ea-soft-ink: #282b3d;
            --ea-soft-muted: #72758a;
            --ea-soft-line: rgba(82, 85, 112, 0.14);
            --ea-soft-lavender: #eef1ff;
            --ea-soft-blush: #f9e8ee;
            --ea-soft-cream: #fff7ed;
            --ea-soft-accent: #6f78bd;
            --ea-soft-rose: #d98a92;
        }

        .floating-btn {
            background: linear-gradient(135deg, var(--ea-soft-cream), var(--ea-soft-lavender) 58%, var(--ea-soft-blush)) !important;
            color: var(--ea-soft-ink) !important;
            border: 1px solid rgba(255,255,255,0.76) !important;
            box-shadow: 0 18px 44px rgba(82,85,112,0.18), 0 0 0 8px rgba(249,232,238,0.32) !important;
        }

        .panel {
            background: linear-gradient(180deg, rgba(255,251,246,0.96), rgba(248,247,255,0.96) 50%, rgba(250,241,236,0.94)) !important;
            border: 1px solid rgba(255,255,255,0.78) !important;
            box-shadow: 0 28px 70px rgba(82,85,112,0.20), 0 2px 10px rgba(82,85,112,0.08) !important;
        }

        .header,
        #ea-guide-header {
            background: linear-gradient(135deg, #fff8f1, #eef1ff 58%, #f9e8ee) !important;
            color: var(--ea-soft-ink) !important;
            border-bottom: 1px solid var(--ea-soft-line);
        }

        #closeMenu,
        #ea-guide-close-btn {
            color: #565b78 !important;
            background: rgba(255,255,255,0.70) !important;
            border: 1px solid rgba(82,85,112,0.12) !important;
        }

        .tab.active {
            background: linear-gradient(135deg, var(--ea-soft-accent), var(--ea-soft-rose)) !important;
            color: white !important;
            border-color: rgba(255,255,255,0.62) !important;
            box-shadow: 0 12px 24px rgba(111,120,189,0.18) !important;
        }

        .ea-ai-bar {
            background: linear-gradient(135deg, var(--ea-soft-cream), var(--ea-soft-lavender) 55%, var(--ea-soft-blush)) !important;
            color: var(--ea-soft-ink) !important;
            border: 1px solid rgba(117,132,214,0.18) !important;
            box-shadow: 0 14px 30px rgba(82,85,112,0.10) !important;
        }

        .ea-ai-btn {
            background: rgba(255,255,255,0.86) !important;
            color: #5f66a7 !important;
            border: 1px solid rgba(117,132,214,0.18) !important;
        }

        .ea-ai-btn.active,
        #aiConditionBtn,
        #ea-auto-fix-btn,
        .ea-ai-fix-btn {
            background: linear-gradient(135deg, var(--ea-soft-accent), var(--ea-soft-rose)) !important;
            color: white !important;
        }

        .btn-mode > span:first-child,
        .btn-mode .emoji {
            filter: grayscale(1) saturate(0.35) contrast(0.92) brightness(1.06);
        }

        .btn-mode.active {
            background: linear-gradient(145deg, var(--ea-soft-accent), var(--ea-soft-rose)) !important;
            color: white !important;
        }

        .score span,
        .ea-fix-percent {
            color: var(--ea-soft-accent) !important;
        }

        .profile-btn.active {
            background: linear-gradient(135deg, rgba(238,241,255,0.92), rgba(255,247,237,0.88)) !important;
            border-color: rgba(111,120,189,0.34) !important;
            box-shadow: inset 0 0 0 1px rgba(111,120,189,0.10), 0 12px 24px rgba(82,85,112,0.08) !important;
        }

        #tab-summary,
        #tab-audit {
            color: var(--ea-soft-ink);
        }

        #btn-calc-total-score,
        .heatmap-btn,
        #oneClickBtn,
        #undoBtn,
        #ea-auto-fix-btn,
        .reset-btn {
            border-radius: 12px !important;
            border: 1px solid rgba(117,132,214,0.18) !important;
            box-shadow: 0 12px 24px rgba(82,85,112,0.10) !important;
            transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease !important;
        }

        #btn-calc-total-score,
        .heatmap-btn,
        #ea-auto-fix-btn {
            width: 100% !important;
            min-height: 58px !important;
            margin-bottom: 14px !important;
            padding: 15px 16px !important;
            background: linear-gradient(135deg, var(--ea-soft-accent), var(--ea-soft-rose)) !important;
            color: #ffffff !important;
            font-size: 14px !important;
            font-weight: 850 !important;
            cursor: pointer !important;
        }

        #btn-calc-total-score:hover,
        .heatmap-btn:hover,
        #oneClickBtn:hover,
        #undoBtn:hover,
        #ea-auto-fix-btn:hover,
        .reset-btn:hover {
            transform: translateY(-2px);
            border-color: rgba(217,138,146,0.28) !important;
            box-shadow: 0 16px 30px rgba(82,85,112,0.14) !important;
        }

        #oek-total-score-card {
            background: linear-gradient(135deg, rgba(255,247,237,0.82), rgba(238,241,255,0.92), rgba(249,232,238,0.76)) !important;
            border: 1px solid rgba(117,132,214,0.20) !important;
            border-radius: 16px !important;
            box-shadow: 0 14px 30px rgba(82,85,112,0.10) !important;
        }

        #oek-total-score-card h3 {
            color: #555d9f !important;
            letter-spacing: 0 !important;
        }

        #oek-score-value {
            color: var(--ea-soft-accent) !important;
        }

        #oek-total-score-card p {
            color: var(--ea-soft-muted, #72758a) !important;
        }

        .score-grid {
            gap: 10px !important;
            margin-bottom: 14px !important;
        }

        .score,
        .finding,
        .profile-btn,
        .ea-fix-score-card {
            background: rgba(255,255,255,0.84) !important;
            border: 1px solid rgba(82,85,112,0.12) !important;
            border-radius: 12px !important;
            box-shadow: 0 12px 24px rgba(82,85,112,0.08) !important;
        }

        .score {
            padding: 12px 8px !important;
        }

        .score strong {
            color: #72758a !important;
            letter-spacing: 0 !important;
        }

        .finding {
            border-left: 5px solid var(--ea-soft-accent) !important;
            margin: 10px 0 !important;
            padding: 14px !important;
        }

        #tab-summary > .finding {
            background: linear-gradient(135deg, rgba(255,247,237,0.66), rgba(238,241,255,0.82)) !important;
            border-left-color: var(--ea-soft-rose) !important;
        }

        .finding h4 {
            color: var(--ea-soft-ink) !important;
            font-weight: 850 !important;
        }

        .finding p {
            color: var(--ea-soft-muted, #72758a) !important;
        }

        .finding-severity {
            display: inline-flex;
            align-items: center;
            min-height: 24px;
            padding: 4px 9px;
            border-radius: 999px;
            background: rgba(117,132,214,0.11) !important;
            color: #555d9f !important;
            font-size: 11px !important;
            font-weight: 850 !important;
        }

        .finding.critical {
            border-left-color: #d45d68 !important;
        }

        .finding.medium {
            border-left-color: #e7b965 !important;
        }

        .finding.low {
            border-left-color: var(--ea-soft-accent) !important;
        }

        #profilesArea {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .profile-btn {
            margin-bottom: 0 !important;
            padding: 14px !important;
        }

        .profile-btn:hover {
            border-color: rgba(111,120,189,0.28) !important;
            transform: translateY(-1px);
        }

        #oneClickBtn {
            background: rgba(255,255,255,0.86) !important;
            color: #555d9f !important;
        }

        #undoBtn {
            background: rgba(249,232,238,0.84) !important;
            color: #a84f5b !important;
            border-color: rgba(217,138,146,0.22) !important;
        }

        .ea-fix-score-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.88), rgba(238,241,255,0.78)) !important;
            overflow: hidden;
        }

        .ea-fix-progress {
            background: rgba(117,132,214,0.13) !important;
        }

        .ea-fix-progress-fill {
            background: linear-gradient(90deg, var(--ea-soft-accent), var(--ea-soft-rose), #e7b965) !important;
        }

        #findings:empty::before {
            content: "Denetim sonuçları burada görünecek.";
            display: block;
            padding: 18px;
            color: var(--ea-soft-muted, #72758a);
            text-align: center;
            background: rgba(255,255,255,0.58);
            border: 1px dashed rgba(117,132,214,0.22);
            border-radius: 12px;
        }

        #resetApiBtn {
            background: linear-gradient(135deg, #b84d5b, #d45d68) !important;
            border-color: rgba(212,93,104,0.22) !important;
        }

        #resetSettingsBtn {
            background: rgba(255,255,255,0.86) !important;
            color: #555d9f !important;
            border-color: rgba(117,132,214,0.20) !important;
        }

        .floating-wrap {
            position: fixed;
            right: 20px;
            top: 20px;
            z-index: 2147483647;
            width: 76px;
            height: 76px;
            user-select: none;
            touch-action: none;
        }
        .floating-wrap.dragging .floating-btn { cursor: grabbing !important; transform: scale(1.04); }
        .floating-wrap .floating-btn {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            width: 68px !important;
            height: 68px !important;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .hide-assistant-btn {
            position: absolute;
            right: -2px;
            top: -6px;
            width: 24px;
            height: 24px;
            border-radius: 999px;
            border: 1px solid rgba(82,85,112,0.18);
            background: rgba(255,255,255,0.96);
            color: #475569;
            font-size: 15px;
            font-weight: 900;
            line-height: 1;
            cursor: pointer;
            box-shadow: 0 8px 18px rgba(15,23,42,0.16);
        }
        .hide-assistant-btn:hover { background:#fee2e2; color:#991b1b; }


        .ea-ai-fix-btn,
        .ea-individual-fix-btn {
            pointer-events: auto !important;
            position: relative !important;
            z-index: 5 !important;
        }
        .ea-ai-fix-btn:disabled,
        .ea-individual-fix-btn:disabled,
        #ea-auto-fix-btn:disabled {
            opacity: .72 !important;
            cursor: wait !important;
        }
        .ea-fix-note {
            margin-top: 10px;
            padding: 9px 10px;
            border-radius: 10px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            color: #7c2d12;
            font-size: 11px;
            line-height: 1.45;
        }


        /* --- SUMMARY LAYOUT FIX --- */
        #tab-summary .score-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
        }
        #tab-summary .score {
            min-height: 74px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 12px 8px !important;
        }
        #profilesArea {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
        }
        #profilesArea .profile-btn {
            width: 100% !important;
            min-height: 76px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            margin: 0 !important;
            line-height: 1.35 !important;
        }
        #tab-summary #oneClickBtn,
        #tab-summary #undoBtn {
            width: 100% !important;
            min-height: 52px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 12px 10px !important;
            white-space: normal !important;
            text-align: center !important;
        }
        #tab-summary > div[style*="grid-template-columns"] {
            align-items: stretch !important;
        }
        .tab {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            line-height: 1.2 !important;
        }

        /* --- BLACK/WHITE AUTO ALT TEXT ICON --- */
        .ea-auto-alt-icon {
            width: 32px !important;
            height: 28px !important;
            position: relative !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 4px !important;
            filter: none !important;
        }
        .ea-auto-alt-photo {
            width: 25px !important;
            height: 21px !important;
            border: 2px solid currentColor !important;
            border-radius: 6px !important;
            color: #111827 !important;
            background: transparent !important;
            position: relative !important;
            display: block !important;
            box-sizing: border-box !important;
        }
        .ea-auto-alt-photo::before {
            content: "" !important;
            position: absolute !important;
            width: 5px !important;
            height: 5px !important;
            border: 2px solid currentColor !important;
            border-radius: 999px !important;
            left: 4px !important;
            top: 3px !important;
            box-sizing: border-box !important;
        }
        .ea-auto-alt-photo::after {
            content: "" !important;
            position: absolute !important;
            left: 4px !important;
            right: 4px !important;
            bottom: 4px !important;
            height: 8px !important;
            background:
                linear-gradient(135deg, transparent 49%, currentColor 50%, currentColor 58%, transparent 59%),
                linear-gradient(45deg, transparent 46%, currentColor 47%, currentColor 55%, transparent 56%) !important;
            opacity: .95 !important;
        }
        .ea-auto-alt-text {
            position: absolute !important;
            right: -2px !important;
            bottom: -4px !important;
            min-width: 20px !important;
            height: 13px !important;
            padding: 0 3px !important;
            border: 1.8px solid #111827 !important;
            border-radius: 4px !important;
            background: #fff !important;
            color: #111827 !important;
            font-size: 7px !important;
            font-weight: 950 !important;
            line-height: 11px !important;
            letter-spacing: .2px !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }
        .btn-mode.active .ea-auto-alt-photo,
        .btn-mode.active .ea-auto-alt-text {
            color: #fff !important;
            border-color: #fff !important;
        }
        .btn-mode.active .ea-auto-alt-text {
            background: rgba(17,24,39,.18) !important;
        }
        .btn-mode[data-state="autoAlt"] > span:first-child {
            background: transparent !important;
            box-shadow: none !important;
            filter: none !important;
        }


        /* --- FLOATING BUTTON CAELUM LOGO --- */
        .floating-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
        .ea-floating-logo {
            width: 54px !important;
            height: 54px !important;
            display: block !important;
            border-radius: 50% !important;
            background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAA0pklEQVR4nO29efAl13Xf9zm3u9/y2+Y3+4JtsBEECIAAKEGkJUoRZEVUpLIlynLZTmzHcSV28ocSx6nISiWppCpO5Y/Y5ZTKKW9yZEViLMlyJBqUZUrWRoIiDRIkQYJYCc6AmMEAs/7Wt3T3Pfnj9u2+vbz3ew8AaaeAU/Wbea9f973nnnvuOd9z7tKyt7WvvEvvWDL/thl4l/7t0rsK8A6ndxXgHU7vKsA7nN5VgHc4vasA73B6VwHe4fSuArzDKV74ToWDM0YKyFtg5+0noZvvZbn0ZXz7W7dAzc1GLsHkQgogBsZ7lsmeOpuhQW2itfq0+Eck/O4Vw/3g75fiJverIlLd2myDzGpXUJ6W/4BI+QFUEZHqd3H11Rg9gLS8rfv+ZjG+fAnvb90jqCpKwV8g15J/3wxTf9i1x9TaBKBWiRJD1DOLjNglLYCCFP+rl11ZeV0NrW3W7htUF7qGneOv2XbHhKWLSGGRtFGrFvcW6qJB+aHOIqjaslzPR1l2d/Nbn+rU5FdrZZXKrkFnl5WHo4X6MzXtDvgpFIeibVU7ZrA3gxbDAKUyWjfiJewfL7g6c2UDCvKfq/+d/hpRBIuR9j0dLFRUu79xRzF6tLhHSk319wTduYDEfBkiUh/RNXZs2RbBBvXOUaqibmMcT16uIjrzmdrzZRmKYlGsK+vtdgF4AWsFBJqjylpbXg/NWdUQLcyaFoKsLEjZPY3O8KOlZCMYReF3q802S/Cvf9aXaVujpFlPu6Sgzhn3OBEpRqq7aqO90YYWr6IHWqFWvd5lUsnVWbbFNWAxBVDHaJ2xsFLtFGJ4zd1XleF0tvAgHS6BxnWh3vH+2ep3L3SviFpTPl9us67m55bwm20KfyoUTwyBHNrWMGxTqRQhH3SbYpVKPt2WygZ++M3RchZgBspfTGMdo7NGdfO7NK81OshbkKZcFh09i1AnnwX2qK4X7kZn190aGP4B92NNrNJQjINBakfnL6EPi4NAikaiZWNndWQ4mryraI42Y2jdHyJ2CT6jWoyEqnVC6eobPAhgG5xLS47zzH7zHq0N6xpcLYDobB9viobWRrDa6okCUc+zhL5tbRmatuVa0hgs5QLoGHFh5RWoqRhzjLqO0SLGc/dXnWSCcNALWq0DUtZ6QNWus9u3tjtWAr8c8nkgBe6tGuGCxzMOpM/u/FAuXZiorMZ0g8UuXFSxJt1KvKQBXBIEzq8gxAMe1dapciMlcGpWQ0P7BaxANKc+R+Gon41FZuGVJlnf5hKtetPvPjd9dghwvaL7+jyvdf7qgaVKCFRbqLYTR4S/tetYjJYDgUYKtFr91GRqNmCp0zxW66aPmrxmYYYqHK1GRlNoXeV3XXPdV5ll1TLl0vI79VA07JzmqNZuHooxocHz8xQ0tKxdJC2wPp+WDgNrKHhuiNZRTC0iqDKIXf6tAns+p9b0tU0htUPPNzMiSgGLtyje5LcFO0/R2/68bhHLzOIcOXVd6xpgUvjmGlZfkJYGgaYjJel+q3d80/e3BYKPcapGzHMvhMrWLfwu69DZSR3hw6z4uQZQO+ubBdbmm2Vfe6i0iyaluiyEd1KzMMksegt5gDroC1Wvyww2fb4CWmTAvKmt0vdOsN6XRjXlWMyHzxV84ddDgZsGZjENN9fCK6ItqzWPBw9mjZhGGNm2omF5nSM+uM/4Ln8T1s49/5ZJsdaidDOp3m2ozjeZNeWpymij/zmde0AdB1FNIYyZq2RdiaXGHbisY07oQppyapZprZ3TBplbr7++jC4s5QJqYYDaIAwqgGGorR2gcK5AgWpGsGuEa3CXxw+zfWXniKTgsXFvWXxwfZagw/bMApbuug1Cx0ZGtFlhB/9hWe0IAsooqybbIlxdYhAsaAG8w7ZADrjON4FplwazqooUwMQEDeiKg7u+tim0EPNj4y6TKdLAGFo37c3O7s4lhJ1+ECBsp51L3lr4Yz6YnG9p6uUz18a0aTkQSD3MsDRHUdVIEcGWtlyD592fQWqd7l1F1eBm8iQY2WpqrqJJXcIqZzLxWMMg6kPa7ri7Smi1J5BEorKt7r58rnme5ccPwjOtyCaInma19+0PAx0rbsQHI2GeufXXjSlATzkACy1txfWzEXXT1C4aftXAkvG8FlVhsb4NJWqXIMKoo/l222xRbvV5Hs3rlGXadPD15TDQ4gpQ66jZvrap2aparCIqjFOhwSKm9owz697VUI3MjrI9lSPOa5eGT3Sb2S5MUgdOYQQzL6gO+ZwbwbZJ2nmPOTfPTMB2W49KhovQ4lFACJLC6jpGnAt3KkQauuzQnJdAphR0869dj0sguQ6XYqLFYgsXEi6qCAVRz1768uoKYDxHhbJXE85dA60leCMQ5kgKzNHdmvlUYhPPSgdu8NStPG+7C9CifX4hh9NgGwgwZKb043hwSBl7G/UN8792m8/mSFUPQkWBCEVIxym9fgwiRWzQnlUrO7Fx3YoF9X1WtMW7HLQcGS0+GhFAiIfKilxTA3cTclL/1G54hZNsca/PSYSA9a2EuyEtkQcIFl/qDKRZhgRau3dWOBV+bv6F1x3wAyFGSMCAphlXLu4S9dwqmHBV4TxMUvLTxn0zn2ny3ZlvWBDZ19vd/q0cNmEE0XjWA2Bv6d6KMiyhAI15AMdJ7Q4J+K4GvQS/OWN4EEjtBDcCYjKIMnqDHq+/NuaZL7wBE0M/7kFhwudhk5pyUSmASl055vEUKnStrhnPNcut8xUqPZVspLBCWkRLpvvZCqi+eXoTmUAfU8/vRRHKe+pmFLxXnCXszs5TA0RMRhFffPISv/nrL3HppS3+6Dee5cbrW84KNFxS+PwsCpddLRI+hZ1/kNIskufvSiaFrqw0qg3AWjm8oH1vQhkWjgKUYh2bhB6sWhjqQX3FTIFfi+8GKRmsAFp72rasr3lNXGq134u4+57j7N5QXn76Avd8x1nWjiVuPh1a5fnOsrTT1c36TOEaugBjF4k4mdigHV33ND+XCZsqFnbgU4t7igjIhs1vldUABuGCgiUg55KpYB/KUa4N8OQmJUrY1ym0eUJaeCZMclbWEh7+4DFW1oST711luq8YyZxK1SxNaHEWp0UTKQ6cOpoFDrvKayWBytBYXKKncClqu+XYnQTzg8p/XoyWnA7WspurOFjdkqZAIR369VpejXjfx7Ny6OHobSlEoGxZlhKJcusdm4ynKYjFUM1I1kPAkvtafWU9xW/zlnbV2AglX7az/nuX3693WLerMhTRg5/0IezKalJtXvuW1PXlMEAJ5KThk7rTFAE33aO+bhIP8ttF52JQa4gT4ehmRJQKaIzVHBGII1NapnCEEtYX1OaaIx011VPTXZhHZ4y4LjxRV6QOeQBq2/mK8n4pFpUYWkrXuncJWtACCOWOINNc3AlGu1bdFk/OsEZtkx+UKbNSJ64eUyiCzSOQCXESIdJjsj9hMsqIejG9QeRGUwe+MCLYaUZuoB8nlfnGrQUsVx9VsKVsjOfM7cwzpfn2K3wq63UwAKy1TLvxyyzZ1ULkQkFKOTayqvNo4URQOQqkPmJMAViK7lusuLk0OzEEgem2FkkgSQZsX9nnxrUtkl7ExuaQZCD4jFNLiKpIFJHujTFxDIf6kGWoCaaJaa9trHUMlMrllMXSNKbNBFKrPXP6pmkRRQyIPSCkDPDH7KJbtNTmUGzlK8tKRGqNCXkKGz4rXKoLWlvcdz1jVemt9BntTHj2yVfpGcNNdx1idXPo0L5t4/1a/SLoKIME2AybqM6aQbAbuM2HSJHRjCJM5NxPnmaNkTt/lq/TaYb4R9RrWYuPLgUIAeUytIQCKBKApTBmLWGhONMYAr8m8zOjAGyQPCqr9HfgZu8giiKGvR4vfvl1XnnhMvc8eIpTdx4iB1KbAoIhKlPDvnxRXBirboZysj0iioXBTYfR1LmUEHS1QVw99tfYkF3LuPL1lzm6MWR450kmYomtqcK3jgRRFc5pJ8r3gNFtnCvcUBF5HSTDN0NLzQZ2jmAUFT8rV4yicOo1YG4W+q++hwJpLiSFOInR3PB7jz/HZDflwx+5m+GRmMkoR7FuckgpV/TWwiyhlvQZXdtjMIwxxpAX4VdlxOsmuDnSjDGMd3I+9StfYXO8RbYx5vjoTvoP3wnWdZwpFK4EkjZwB+okV80b1COHDkzcktUs97QsLRwFOAhgOhGuZ2IRsDNzGlSbSuHDOotqRtRPmO7Cb/7Sl5nsww/+xP30DllGoyk+O9bmuTL5VgSTu07OM0u+tcd0a68wt/N5NsE+NqeIhuuXd3jxQspucphRNmT31RvEWURuDIYKLM6Tg+MviKaCHULzAGC4E/ut0lJzAdUUqcvKdTHX+WQAhjoTJA2N96GlFMM2jgeMt1M+/ktfYnW4yg//qbvJmJJN42KVbVaZ2g6ZaJFcMSjEBvanZNtj8q0R7E2KZ0JFaEx8BSPMGCFLczZPbdI70ee51/b5+lVDduY4eWIK2ajDEOKmxU2g3GGiysnQo3hbhNgWJZ8J8GbJ9c3SwmGgm5FrjpbZTB1ElVC11flFlagqUZwwGSmf+NizDIcxP/ATdzLKUzQXjLhN5lar+XNfRtOH+1EpkWHyxhbZaILJhemNXeJTh7A2LxZTStl5bX5dJdbC2orlo3/mXl786msc3xxy4oFTaJYSWS1dStmQDrm4JWrgd1pJx8TOvIRZXYZvnpbIBFbmqRKG1hg9yNfXkbi3KPU6fDipgBrIrfK7/+JF9vcyPvKTD5LHGTYVIlOs01NxziKQQyt7F5jkyML1b1xCrKBZzv6Fqxw6cxglx0gIHWnod7X3XwSmac6x4zFnfuh2NFfG07TAPELkfXwQItdKqg2kAjlpE/O0reYsK/BWlGBBF+CnKdvr2hfN4Tf/ZlflkzKWftLjqU9f4PwLW3zoB+7i0Mke02mOkSrGP8hfemFbBZMYJtf2uHH+MiaKiOOIyTdew+6MIDal8hX7VeawqIhEpKllb3fCZJQeKANv6bwC1ctqryAOOz3EV01LUFOQ4v5lQsHlp4M7yp7l28MVxOXjM0KYugAs/V7MKy/u8/lPXeX2ew5x94OHGI9HxMYsl24qy7VExFx66lXs2CKRIBamO7vsP/9N+nGCj7ZmJmmk7sNFIDKmfoJX+TGEgS6udz7en42yCOvzl6qXNQUJoFlp61m09FxAF5Pd9/owx49oDxydYJraW/8M47Hw5BMXiXvw/g/eRBRZjI1ceFX+zdZ0FzsbDIrNM/qDHq8/f4krz7+BJDFZnpGhREmPvZcuMHn1MtKPoFhXYHxYWLTD4fUC1Em7w0s8X5h9RF04KramUXN5roWCyyV03iwtHgb6Ji6oXOqHkoQIt/rzUUSYBPS+MBnEfO0rl3n1lX3O3rXJqVtWmU6z4gQsny/oTop4RYqIMJKj1jIYrHDl3DYvfeocRhKsGqzGuFMHDEwt1//oq3B1GwYJmSq5cbjCaLUyx1TNQawSUWVBjU8lhfinOck0J0pqJpu6XNusmclvAwbwI7jKSB1ETT8H1X67Okj0nw2QY6KIvd2cZ754gygS7rrvMHEMbkfSwZjDCRM3VxAnDFb6vPb8Fb70+HPYfSUzBs1jICZXQ5YLaiLMJGX7019BL14h7kVEajA5GBtasOpzV+csioe6rnUdJdPl95s5gLdqLZZeEOLRcBe1GldYgW4UK2VWzemVxQL9XszzX7vG9StjjhwznL51SJYpptiJUxbdAEr+qDhjhDgxRAlsX8354mcv8upX3mCFGO2lTK0SGyVHkDxyIzyymCSCvX12fv8pVu4/S+89Z7GDHqla4lQRLULWRsKqzkf4WzfWmRW7z7reHjDtELDGT1Vgq/4uWiIP4Iv3Jnh2aBI85v+pLokPeywipmBUi3mECGstLz2/RZYpJ286xHA9Ip2kRKY5cpyBjRJDFBviOCZXy3hiufJGystfu8YLT71OtjPl0FrMyChqhT4RUzLIcxCIRMhzMGrBGGKZsv/0i9hX3qB/9hT9m07A+gYSR6BKbt1kk7SycR70vXlzHJr/g0d1fTB1FLaQEixsAcLMWL2eGQ1unIhRv9f/Zmsxdy+JuHxtwuuvjTFGOHZyiIkEFUNT6dQok1y48caUra0pl17f45uv7LF7I2fv2gQmOWvDmLVhn9TmgDDViAhLVKSZTaTuc65Yq/RFGQ96xCZjcmOb7Ks3iJ59nmhjHXP4MLK5htlcx/T72N4AQr6knhvpoq6p3GbSquuZTvGWmUQQMahfk7GkO1h4PYAfzVKEQtXpXV0jnFoE0CxrlvUwkeHV83vs7FlWhzHHTqxirZZLGyR4xqjg9t7bAslErK+vkE322UHJNWJqYaqC5hHEFolgWkRgqsYd7WrdziIxhmms9HJFrSHNcywCSQyxwSSOgVyr41iL/i/CwOX2983K7EF1mMTiihGGnJZZayq66E1gAEduYoia1as1yl3oEIp/qGny3OraS69NsRozWIXVQwaba7HgtL5DVxSGccTqyYSbz8S8/z7nUiapcu16ysvPXeerX3iDqxfHrK8adxaxCmKlgPdA5sJSjWKEHBTicc4ohtWbjjG8/TTD0ydgZQBRMaWcA9aikjk3ZgQv8FkmfGY2lHbnN+/vpi684M9oYJ4RatFbUICCkS730/L71f+z0LKgpKnlxlaKREKSCP2kEVYFgs19FWmOpDkjcR0bieXopnDiw8d48KETPP3513jyiQuMphESO5wBeVGucShfcoxJMJMx++sxp7/zXg7deRobG2yaQj6FrMZsK8k1a8KrW3bdzzVHdTlX4ittUJeFcPUvdlQ8vIkTQjyPLhRSD31L/jQ0CYVf8hMe3rR1FIsxyjSNGI3d4k6LccBPiyyamhAxVPIoztxxVthFA5MUdJpjEssHHzvNmbNH+K1ffZa9nQwzENSCFQUxmFwwkrA3ntI/vcLZx+5ncGxINk7RzPv3CCQP6u4O5crmLOgKZk6NU4XHtlhfIN7flI2vzx/Miz7m0fKp4FL7S06Ly6UGVLf6S8G1zpEizo+mWc54krq1MJHzsU6hDBpkDuvZw6IIq4jVImHjFEIt7O3tc/NtCT/2H91HvBGxMxEmakg1IVUltTF7IyXe7HH2hx6id7jHdDR1UYk7wx6wZbtEulc+LpqMmYV/mpbRZzp9G0WCqeOGC62HkMv5gMWPiPECKLKB4dKw7nSuVM/6T0HCI7xWDHKsFdLMjUwVN4FTKViD8SCxGJ7oVWpbkbIz0md/lHLiJuGxH3kPI2uZaMREDaMc9jMhHVre+8fvY7gRoZMMIlOkcX3ar9vVUat2sSRQM+u3aFlahMtS6GRnprBov8LC0ejiFqAssIjbZyL8pmYuIhhQEYwBE8VgDJOxZTLNipm/vGtS1Q3xGadz+Fk9wRIbw2gH7rp3nfd/8Cjb+ylThZyInTTl7MM3c+SWNSaTKXkcuxdZ0LZWfvTXF8E2R+6ssC1cLt6UTdWxVYhc1XuQtQh+WFjmnpZbEVSOhqqjPaOu0vop/n43cFdjqrSq6yyrSpQoSS8mR9nZs+zsWBKTgBZ75+bxFpCIFGxKNf0gME2nPPxdN9NbiZmmyjgzDA71uPuhm0gnUyKJkeJYNwKQpwXO8TNt4bGuYdsqWczj0ytAXsTxddPuMZMvf1bGL6y3FlWYYqPOgjqwxJrA9px+O5wJv9efaWpt2ajiH1XoJQkrw8IVWNjaUncWQOv1EPP56r4PsmnO5tGI9z5whP00ZXcCt99/guGGIcur+0L+SlJn9dzy02qdQVdiZxE8EKaP69V0n2bif/PlN11pwGbJ2yL0lg+KnNWQefd3dphCL4bNwwlWFRXDa5f2sdaFiNL1/IzQKPwcmkRBEM14zwNHSCUiiy233bWJzbNW+U1+AbDQiyN6vQTELyRvy6KL5mf0OsLiAxRp0cmng2jx2cAOZFFHoLVfWvc1ZwJbvhMwYjl9epVcFTU9zr+8w2hskSh2XrmO9sDMtgxNbhS3iTVPheMnhpi+sHZ0wNETA/KpdSg7aEPL76JECbzx9au88eR5etaQGx8B+2gkMOV49O6EM6srZ01nz7ruZwO7ydf5truAYvOHVr5ofqzrnmmi3Wbj6iMN8izj1lv69AYKJuPajSnnz+3TK46BQUHVvR1LNXJ/BVvNMiv2HDYRcX82h7Wh4fDRIUeODxmuCrnmRdOq/QTNsmITsbOt/NY/u8Azn3yBqy9cJIkTx0/w1i9fn4qbMLLYYrv3bHB2UDTQBQK7qdpBvCgtHgaWCzsc4JNyUWf1f8hws+MPQrKCMs2E48eG3HyqT5bFjPOYp56+QZpKuSGUKIJYkMRC5Pxxrm7XkNpQYGXcSvjBkhMnEafP9Nk8Erl8gcqBymk1ZziMOXTbGtdXj5AcPuTSwkHcXbbHGHQ6wo7HqJji0InuOZDQl3eliLs+txXG94FF1BarmlmI3kQquG6CZrmprpx4MwauKQwRKkpP4IEHD/PcSxe4/54Bjz5yGGJLnBgmIyWbKHmeY4wQxRFxHJMkWkzrKja3gbA9sg6YFEByjh7rEyfiloP7WenOHDuAOwk0ieCH/9RZ8n2ltxaR2QwxLvHktp65uyMEe/kaHD+C0UpiTeVqdmzX75X4/NnDZSOK+/29VftKQ7QALaQAvqzWlDzdWjqPOjNhAqhgJCdNp9x+W8xf/gu3cvbmATvbU558YpdLl/bY3ZpgU0CVnlH6fWFlNeLQ5oCjxxKOnVzh0LEh/SFk6ZQ8z4AEQfHZEcGlVzfWewwGCd6lylyJuXRsblOMxMSrCvmURCKHV4p2KYrEMdnrb5Bu7zK47SbyVAvACIi0ZlHnhXnFI+3PRUTil7EvONg7aamjYt1oqpYuhcwtgki7Ji9U3Z58iTLIwfQMm0nC1Rv7/NwvnuPiq2OUnATDMI7pxRFxZJmKYTxSdq5PuHJhzHmxDAaGwyd73Hr7BqfObrJyaEiWZmhejJSi6izLOXK4T69nyPPQd88Xpd9eoi5PXBO+WovGQjyZsvu1F1h573uwalyiSpwCdWUAFx04LU68K34TT4cke1v7B/aciJBNUrJJWnsj2Kx7Q/PfXOvW1HhFXZ5fcwaDFV67NubXH7/AM8+PyDNlGAu9SLzrJzFCYoReLAwSwyAxJAKJCJFkSJ4iuWH9aMJt965w6z1HSVYN6TQtR6ExhvHYjfpeX1E1na6s01pBYbGKOXtArJJHhpic9I++itqUwfd8gDRzh1lYsUVesl12k5zMCtBbVNYKFTsGUvAjRD33t0gWdhEFQIR8QQVwt7fNWxczghQ7dpXV1T6f+cIWv/DL59gdKWdObnD6pGVj0Gdjvc/Kiou7bZYzHaeM9nL2tqdM9lLIheFA6MWGnomIjRLnOXmesXqkzz0fOMrNd29ibUaeZxiJnVCtoJK6KeISM9TbUW3Nti0bIeIOqjBJjEmVnSefIbvwKiuPPUp05ChkKYjxHq6GzueNfNfh8xd1NJ8uMYQqxN9CBZBiY0YzTdnJDCGgCbXYLzIXrFh6wyG/8duv8ju/f5H33XuM73zwMLeeSTi8sUJswPRS+oMB2BysIc8tk1TY35tw+fUxr54bcemVfXauj4nEstJLMEZIjHUzhCqcunvIfY+eZuVQ5OYY8KhNwOTOrOP9rH+ti5QhnGpx1J0f0RZMFGF6Cekb22w//RK8comV999K75H7kEmGGjehFSFo4xUzbRmFv3XnB/ATPdCyAt8WBcgnWbkLZlb2ylM499+Vw9ZiWEQ94UtfvcrL5/f5nj92Ezcdi0CFNMvI8xyJhN09w1NfvoyJYtaGCYc2Yo4cjjl0qMfqWgxW2bqRcvGVPV748havXxiRRJZhv0+MYiQnT1PWDyfc/8HTnLpzjTTLsDnu9FFNSqG6iNfH7VJ0eU5edJJRIYp7mNiQj1K2nnuV7a+9QjKe0j+zzrHvez95EhWjvbIgs01+kUwSP6BKNhboluouHxEIikbJ268AdpqRT9ISis5TgIOWN4kIGLfII1fLzmjCiaOb2EnKNJ1gjYIkROSFJFb41cdf4dOfucKhjR7DBNb7hhPH1jlzJub2syvcfNs6K2sRk/GU8y/t8bWnrnH54h6DuE8vSYkiIUoNyJQ7Hz7C3Y+cxCSQpQ4bxD2DkZg8t+TkBTKtUs6RCBpZbK6Mr0/ZOneNrRcuYnbGGIVow3DTRx4mPpSgmYXgOPx5qd7SCgQu5mA4Okve4hTJfAsUIJ+kZOO0vg+Oerw/s7OD+8LrgkWIMFHENE9LpRBV1ORgE4QcjXJ6/RV+4/FLfOZz26wOY2LJiUSIbMpqL+b4iZj7HtzkrnuOsLZu2N8b89yXt3jmC9dJ9zOGw4gYQ0QGajl2aoX3f/gkq8d7TCc558/fQIETxzbo9yJULJG4wySyac7+Xsre6/vsfHOb/cs7yGRKL4kRyVhdjzj72H2Ym9ZgPAETM2uaupBaC3SWYfycLOusJWAtBYgSMG+jArgoYEo2yVpmp9apJR9Oj318XGXKwpVEtgBIEUrhk4mKNG8x+orkjPsFZBDziU++zh/84VU219cYJJZErFs6NlVik3PqTMxDjxzn7N0bxInh6uVdvvTZK5x/bo9ebBj2DRE5cQbRiuWOh49x1wMnuLG/z+efeI2vfX4LsRmHN/usrkRomsJUifIcmSorsaHft0gOYsYcv3WVWx67j/5mH8ZjrIkKxF9PK9flWc87zBrxbRNfXW9mFkt3C2iUOCvwtirAeEo2zVpmJ5zNqxTA4ys/CeIVoA4K/f8HpRBEhFwVo4Z4mPDpz13ht//1JdA+68OYnloSUeJIkdwQmRG337XGwx88zYkzCelEeOGr13j6c1cZbU8Z9BN6SURsM7DKyduG3PNdpzl2Zp1z567zxc++zuvf2GH/xpREDcMko5cokTjlGfTgyImYmx84w80PnsJKis2U5rDuSv+W4XFjw+hBYLp5PXyuHlqDmm+FAvgoYF74Eoaq0vT/7TTrTC3uaKDLqbtJ+/5wwLMv7vCbv/U6V69b1geGfuTyAD0jxBJDmrKxaXjou47ynns3MT1l+1rKlz57mXMv7CCZsL4SEZsczS0mguM3r/HeRzc5dvNRdndTzr90jTde3WW0MyLbz1gZxBzaTDh1yyGO3bqJGRom2YQo15rP97zXqb4gthVOzhkFs0x/s65SblH8rXABPgyUEtWGx5dBXQGKOA8Id7zWG9VsSNd3f6+IRYndkoxcWVmJ2d4VfvcP3uCLX7mB5oa1fp9+MiEmomdijGZgc269fcgj332Kk6cHTKfKq6/s8fwXL3Hp/IhYhH4S0RNBbUZvKBw5tcrh031O3bLBxpEhagwaK5IJeZoxzsdu6bq6iZ7c1C2dI9u2AIU3lNIyVm1eZm6/nU31WdrietR7ey1AFQamQYOavqgoJnRo3juUoU639ejKG7TMm6rbqWPUhTq5IY4gHhhe/saUJz73BudfHiN5wspASGJLz0BPhSydsL4Zc+9D69z9vqOsHeoxHqVcPLfPK89f5/IrIyaTjEFsiPMYa/cRhcGgTzJQekPLsB8TDZTNU6scu+Uog424mPxxE0GYsBNDkWoRnPmvGrjGdvu7vs+SUVhHVaeiUf/ttQCIkI9TbJEH6ExSQGNevslgd06gu7pGY6VDuYovqsqgb8htj3Pf3OWpL17h3Ll9JiOXHh70Ilb6PWLr/PSpm/rc+8AqZ+5YZ31zyHQyZfdGytVLUy6/tsP2tTH5BAw5sUAvETYO91k/1uPomQ1WN3tYUWyRdCkP9FxgO9Y8UBdem2feu+nboAB27BJB1MBdg41Wp3cVtUiEG9xvwM/GQRsruIwkGCxJz6DS48qVlG+c2+GVc/tcvZwzHo8gh14UQ5aSiHD81ICb7xhy2x2rHDo6pNePsHmOtWBz52bEGKIkIordRhK1OXZqgQgxxQ7nZdoyI4cya8Q3761b3zqorDaKgpr+tyARNEnJx2lzaJcJDdtKX+lMs9WVE6g3tggXJWxYE+3WhWZFEStEKkSJEMWG3MLOjuXK5QnXrqfsbI+Y7GXkU3UdqTmbR3ocOZFw+tYV1g8NkWKSR4w7r0DV7Vs06lcFu3ePeKNeg7mNds1C9zUpzYnt68miUBG666oSQT30bXcBBQYoJ4NC8OcBYTO5MddvNe6lrunev4YYgGBKt1lHqEQWd6CDiFtAZGLjpk/VuBHucsDFMjfrruG3urlIwx8IIQWYVSl8fcjL20AHhYB1TFR7claJS1mApd8dXL5utRkB+Lw33Y06aDSESFaDSQ+nXNQPz+5QgpAiMeU9ea5kmUPkJjyKldQd6lyA2WojSHGPqQtPys0ArrUlsu1oxzJubhELUVVcB5qzIqZFOt7TQgrQwpyFBZDwe2CWupB88/nqPg0GdxAyKiXgNEgl7ICZ7hyC/7Xyid5kVo87Baud1h0msso7ZshDpLPz305qyk4KixjmU2aBRV2Ct6WWhIU+KYz0wt9D5kNq+vzqe7nLsCZTN0qlMv8Oahf81LNojkIU3g6pSt6KsIxGGQZF576KxZc3+7dlYvn5dbQ30ixrWRalpY6Jk8L0+TeS+HSvX9RR3ltECaYclVKYUAFxW6LyXMltBpq6UYppPC+45dVgRcjzHEuO3w0qqFuMAYXzca9/tRby3BaI3pLl1eviRIu3mymghZvIM/yG13mtB4PaHDQqvkdgxV1z25cKxabQLUVzHIgtTWXxrmPrzyeoK2JF1TK1auTXR7m/7Feb+/5xm4jbeGwWLbUmUKytzItU40gIV6/WHilHjEoKGLBCbxgxHAxAY6aTMePJ2C0dq5lgfMmoKitrfbIsI01zRN0sYfkmUpyPtmSsrAyJegn+2DnEkO5MmGRpw1y554erq0wm4yLamCU1BQMrwxXGk9QBRbVEvYQ4ThiPxlRvQ3eKrmoZrAzJbUaaTnCrjtyewNWVNSbTKTa3czqqqQTS/LkUsEDNVczsjw5aPgz0R7W6mhpmr474Q2TvxmrGymCVF85f5FOffhJrU777Q9/Je+68lXy6T2iQrCiiMUJG0ot46umXOXniGGdObJCmWQnoyvtVSPqGJ7/0dV587uvEvQSkRzrZ5/u/7yHOnDpeTmYpIBFkmfLlZ87xwH230I9NKbQablEwkTCeZjz9zDd45IG7iIwQ9yIuvbHDxQtv8PD77yDL8gBPCEk/4QtffpbDh45wx23HSdMMsERxnyc//zzvufsWDq33yDMtlls3LOgBp4s20+4VznGJIDX9Wpmz6E2cFaxeLk6QDTBSMlwcC+vxkmjKytqAX/v47/M3fvpvc/3GHtt7U/6Xv/kP+c1PfIrhyoo7EEokMHGWOIHt3Zy/9t/+Lf7Jxz7OYGUNf55+5Sfd+buRxPyjf/LrPPHk01y6dJVz5y/wyjdfY2+UYSQKOLREUcLO9oT/4+/+IuNRRhxFjTKLtqDEccTrr2/xs3/3Y0wmbhD0BkOeee5lfu4f/xpxMqxbL7Ukg4SP/con+d/+1i+QDIfY3DIYDnn6uXP8lz/9v/PNC5fp9SK3LrFA1E0A7euflXsJmCyvL0tLvDKGUl3UO54iLtbCHM3KdLl07ZDnX7jEx375cf7Xv/lf8cCDt4Mq589dYDqeFEfBVgBTjCFDWV9d5f/6pX/BQx94Hxdfv8q5cxc5deIw03TqTvkqchAGyNOUfmz46//Nf8I999xa1p9e22Yymbh8PeDWJVhymzIYrFQBRoBZwnaoAsYyXNtw+xRtDjYnig2DtQ3nEhoxuk5zjhw7xqefeILf+lef5Ycee4TxRPl7/+D/xUQ9+v2eSzKJlu8pqOZOtMQS5ZqIyvMG30MrQaUoS2DRN3VETJsaMbNI4RNdh1rr3vL1h5/5PO+7/24eePAOrr9xleuXtzhx5DC33XwTeVqZUAWwEMfKlWt7/N7vfZa/8df+Infffiu/8s8/yWC1h2peq96iEAvGDPj5f/wb/Nzf+xX+z5/9p/zq//MJxtnUSbLERn5Ovli6Ye1cmRkxGCKm0zGZTQvrpESRwSRxzVyX/BsBm/OjP/xhfv4X/jkTEf7pr/5LVoYJH3z0Qba3txzuEcWY9ugNLVEr6mlYqMpd1V3wIrTE7mA3AdISVJiYwCI+o+ap5EUZ7Y/Y2NhwL1ayijFKmiuZzYrooHrM2py1jTU++Tv/hqPHNjh750m+/3sf4XNPPcvVa1v0ElMKqQoZYTwdceXaVbZ29rl2dYetq3ugscMj4vfPORcSGUOaZWRZhrXqoodg923pjkTIiy1kcRyh1pLbnDwTpumoBeZVBTGwc32HRx6+gw996BH+h//pH/EHTzzNX/lPPwqaYaIokJ0voPqbZU29pShBn9YtV5mVXZCW3hvY0NPimtSvOZsZ3kI+yfnghx7i7/yd/5trV/Y5cuIYSMb2dsa16zc4sllhAAWIlHRi+Z3f/Rw/+dHvJdse8cgjd3PTTSf5xL/8N/yF//AH2L6+W8vuWetG9F//qf+Y9z5wtuRoev0a02ndlRoR0jzDGMORI5sMN1cZWoUsY39vP2ipkOUZR48dIptGXL+yx13vuxVMzPlzr9FPepg4Qgll4xpt+j3UWv6zv/yT/Ht//C/x5/7sj3D/+9/L7u4OYAOT3zwY0sdWQdDiB7lYwlk3n5Sqspg6M7jsosWPihW3MraiUFODLJT6VEvFgjHC/v4+jz50Hw/ffzf/+U/9j3z0Jz5CniuPP/6v+ZEf+h7+7J/+D9jd2cIYd17w2uF1Pv7x32d/b4fv/75HGe2NWE3W+BM//N38w5/7Z/z4n/wwcSRValpzoqgH1vKLv/Q49917mxulacr3/rHv4MyZI2TZtBCYj1CE61dv8Mu/9nusrSbs7o04eeIQj33vBwJg5VYOHzuyzocefR8/89//LH/uL/4oly5e4Xd++wn+u5/5qy66CLpfcAcHpNmUnd0RwzXDz//9/5ljx1YZb+0wnWbFAViRC2eLwVIL5zqAnQZYYWaiTb0KLEZLnBUs1ejEjybxbAcMzoAJYhnvbfFf/9Sf55N/+CSf/vTnUSv8+I9/hH//sUcY7W+XPlFQbKZsbKzzl/78jxGLkAqM98Y8+si9XL78/ezt7rK5toLN84Ivg7U5H/nBD/HFrzzLSy+fB4TJeMwHHr6XKDpKmlbuIs8sG+sD/uSPfJjz33wF1DKdZGTTU6g1GKlwgZiYyf6U/+Kv/ihnbzvJZz/zeYzAz/z0X+GR99/CaGfi3lnoB4KBbDrlB7/nOzhz5iTZ3j5333mKPMuxNuWjP/YDnDl1zG1XM4IaaUw0VdQ1c1r2dd3ssPi4D7pl8X0BKXYydeAmiEy68tH1R5vmSVldX8Ofua/AaKdIxIh1iQ11yyv6g1WUKdPRBCNx+ftwOGQ8Gjfqc1nG3mCFpN8Dm7kxbmImox2yNCsycd6WRohJGa6uISYBzdwMWp6zv7tFpdyubFF3QtDK+mYR1+bYkWU03ieKpLUcRIGV/oDc5kym4yJSiVzyaWWVyWSKzdMisSagNrAiDVBdti/UkW5Zg2JNb+E8wBIKMHUK0AiVFqXw/voxJ7Y82ao2E2gU8giYINIvOh/UCugEI4PCH4blK7lNQY2LQsSlbo2R4gyAZtJKCgsCFR52m0cVG5Rb/GLdEnZ36kcEkmFMglvG3l4RZK3LNhq3qB0rztyrLdrsyw7fKlpy11F/YXXDrGV7sm25RNByLiDYGDpvHtv/3vwuxSSCCcylW/FfMB6EM+IPdC63bXk+ANOrZiSLSSIlBxWMiRCJ8B3sHmqfvOXIYKLC/4pf4aN0nrYtBjVZ0aFJkeiKnb+VDG0cGSVqMf44eYKD8ZXiZZdBe4XyFBEvs+aEkAT5FpcrkbLtdXl3tXM2LZ0H6Mr8LfqcO2kjvOqFra3G+sUa7rstby8TJEHSpJzhK8NPWx/VtRAtDL2KdxkVK3gdNKwfFVHyVbxzQIs9/5UM/KvjtWhHdXilFAkqiy2wTQGOF5p17J7udb+5iaxmBvFbmwlsMNF1Tl0Yl3c9003du1zqU6G1WupPSzXKheq5Lgvkv8+atp6FYcLfq2f9+Ujuu99P3JSKw3b+17A8rTel5v5b6K7b2rqEgIfgrWcWoeVmAx0nrXz5rBRq89osDe1aK9DqjCL9rOC0X03ruU6uO+ptrrc7qOO7y9Ha//PVvAK8/iCr0pQ1yxNKGdf46Ajutex0LX8U0W9NIki1AG8zMlTtzvdMzej0gP0K2roQxzaeD5FvVU9eT0Dl87FJyNtByuKSSrbRpm4FaFmvonWe52Zk59ceiA0xgNba4ssM3xwSyrFiQxv/e7mqg1YL6MHCS8Jym5NmWeeo6zaldaHNFL6EzxQHR4j354tpcqfFWPC5kLfm9fq1+htL5pXT6VaksRlEtVSQcoVNo8xZK4Kq38KRX/Bgc4zpl4dZHESLWQBxpivPsiLhMds3VlQpQFfnuLeEtVn0yNaDpQAozzQoXYp4kEIsCpjqYK/Rhhn1lVatUY4Gz5UTN+U/wX0zsEnbLeXtazYHq4sagCVeG4d7ZZo0mOnuYMG/6HFuqaGd9A0oOzlcSkWnkJplzfPlTVzShVNCao64KlJo31+WF7RlnrvpwhM16yBNYOzfGlKrFR9FhSJUtZi5x8nWaWEMYK0tLUD3KAuXLoXghNq9Vc664jpExi4jGJhLWdx3z6N5ZTiBuzDPJ5T86aFV2bZVT/h7mZfwIpjFBxVOqH+n5Sbq7Zul3PUch1pL3C8YaWCHLjpYAYqyrLVkmZvG7ELITgFchbNG23yr4R+oT8d2J5Ta7meW6T9IOSoh2kCBoR3QtfnqtC7azXfBjasrqCdUoFkRULcCdHWuoHmGPeCEsZAWsABa/ldtiNSOU6vrPr9LQF0KUH4Wj5AXf7W6L3uWmW3ee1A767dVKN+RPVCBBQ9jfQlad8QSmuqDQ8/QMs4/Jbwim2cuemgktGbRgQqgBSOT6YTtrW3iOEKModfrEUURan3cOQf0aZGrk2bD/M+BghygAPNG/NxyDyyzjtukcD1dCtDFT/lcCFq7rNKCWcA63+qWks9pS+l0NVC6gz3AYhjARBE3btzg69/4Or1eH4BeL+Hw4U02Nw+XJid8z44CPk3pBkJeRTtBH5cdCYWiUJYV3qPBPXUs5IDkcokg35m+g1yYV+cpPONnMUUqn6eufK3EzAHWsaMVVZhcvk6mPVkURTH7e2NMb5/1I7IIDl9mUaibDDKRS1CMp2Nefe0C+6N9Thw/7hJFHQ0KYKDvK/e/z7oH78NTbT9XdmBwvRSwVGvivRgWCQOdEOf7+JBa7qrjnjZVGbkwRV0Dwe5CcU/7+YPKDz8bE7G7u8358+e54z0DzhhD1llunZbYG6jYPCVNITIRiLMM165fp5/0WN9YJ7PVnLZIAETRWue6G/zIsrV6wn1t9VFUdXxZTlOYtBWgqzPrgKqyl119ukiHd2OCNpBr8jirLO9OZ2aeqrsd30YYjfa5cPE1sjxbQDkrWjARJKRpCsDa2ho3rt9w5+QbdxbqlWtX6Q36QQMoRjegGuwo9iCpK1tdT4f6shbJ0s1lna6xZEuTX3Ww1vUpdGVvom53axgOzz4rof1cNXq8xeyyEL5kYwxXrlwhS1OstQVeWIzXhRTAWsvK6gonbjrD6TOnyV58iThO2NvdQcS90jXLc3pJuCfdH6gApvCjVVNNmbP2uXFtmETfcqmdvuVBJlU93q8QitqLp9H54qdpo7IOKQ94ChRTfLkezAUFh8WVXLUV21u80FWVMgHciUdu4YrWQVFpAJwi+N3T0rjF4ieYc+u2wMdJH2sVE5mg9fMVYbEVQTgtc5stM/euHJTUL7XVYiPokqPz209NgSwAk9+2ej3V1ab+eRZ/XXzWr6n1U2hKFEUYE7EILZUJBIoXJbkG+YjgXfp3iQpLdCB+cLT0voDmDNW79O8aLdcnb/nFke/S/7/pXQV4h9O7CvAOp3cV4B1O7yrAO5zeVYB3OL2rAO9w+v8AFYFVQeHgxG4AAAAASUVORK5CYII=") !important;
            background-size: 122% 122% !important;
            background-position: center 43% !important;
            background-repeat: no-repeat !important;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.72), 0 4px 12px rgba(82,85,112,0.18) !important;
        }
        .floating-btn:hover .ea-floating-logo {
            transform: scale(1.04) !important;
        }


        /* --- BEHAVIOR AI ANALYSIS CARD --- */
        .ea-behavior-card {
            transition: border-color .18s ease, background .18s ease, box-shadow .18s ease !important;
        }
        .ea-behavior-card.behavior-stable {
            border-left-color: #6f78bd !important;
        }
        .ea-behavior-card.behavior-warning {
            border-left-color: #e7b965 !important;
            background: linear-gradient(135deg, rgba(255,247,237,0.86), rgba(238,241,255,0.72)) !important;
        }
        .ea-behavior-card.behavior-critical {
            border-left-color: #d45d68 !important;
            background: linear-gradient(135deg, rgba(255,239,241,0.88), rgba(238,241,255,0.72)) !important;
            box-shadow: 0 14px 28px rgba(212,93,104,0.12) !important;
        }
        .ea-behavior-signals {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
            margin-top: 10px;
        }
        .ea-behavior-signals span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 26px;
            padding: 5px 7px;
            border-radius: 999px;
            background: rgba(255,255,255,0.70);
            border: 1px solid rgba(117,132,214,0.14);
            color: #555d9f;
            font-size: 10px;
            font-weight: 800;
            text-align: center;
        }
        .ea-behavior-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 10px;
        }
        .ea-mini-action {
            min-height: 38px;
            border: none;
            border-radius: 11px;
            padding: 9px 12px;
            background: linear-gradient(135deg, var(--ea-soft-accent), var(--ea-soft-rose));
            color: #fff;
            font-size: 12px;
            font-weight: 850;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            box-shadow: 0 10px 18px rgba(82,85,112,0.10);
        }
        .ea-mini-action:disabled {
            opacity: .72;
            cursor: wait;
        }
        .ea-ai-result {
            margin-top: 10px;
            padding: 10px 11px;
            border-radius: 12px;
            background: rgba(255,255,255,0.76);
            border: 1px solid rgba(117,132,214,0.16);
            color: #4b5563;
            font-size: 11px;
            line-height: 1.45;
        }


        .ea-heatmap-legend {
            margin-top: 8px;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 7px;
            font-size: 10px;
            font-weight: 800;
            color: #475569;
        }
        .ea-heatmap-legend-bar {
            height: 9px;
            border-radius: 999px;
            background: linear-gradient(
                90deg,
                rgb(30,64,175) 0%,
                rgb(34,197,94) 24%,
                rgb(250,204,21) 52%,
                rgb(249,115,22) 74%,
                rgb(220,38,38) 100%
            );
            box-shadow: inset 0 0 0 1px rgba(15,23,42,.10);
        }


        .ea-alt-results-card {
            background: linear-gradient(135deg, #ecfdf5, #f8fafc);
            border: 1px solid #a7f3d0;
            border-radius: 14px;
            padding: 12px;
            margin: 10px 0 14px;
            color: #1f2937;
        }
        .ea-alt-results-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
        }
        .ea-alt-results-head strong { font-size: 13px; color: #14532d; }
        .ea-alt-results-clear {
            border: none;
            background: rgba(255,255,255,.8);
            color: #475569;
            border-radius: 8px;
            padding: 5px 8px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 800;
        }
        .ea-alt-result-item {
            background: #fff;
            border: 1px solid #d1fae5;
            border-radius: 10px;
            padding: 9px;
            margin-top: 7px;
        }
        .ea-alt-result-text {
            font-size: 12px;
            line-height: 1.45;
            color: #1e293b;
            font-weight: 700;
        }
        .ea-alt-result-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 7px;
            font-size: 10px;
            color: #64748b;
        }
        .ea-alt-result-jump {
            border: none;
            background: #6f78bd;
            color: #fff;
            border-radius: 8px;
            padding: 6px 9px;
            cursor: pointer;
            font-size: 10px;
            font-weight: 800;
        }


        .ea-criteria-card {
            background:linear-gradient(135deg,#f8fafc,#f1f5f9);
            border:1px solid #dbe4ee;
            border-radius:14px;
            padding:12px;
            margin-bottom:14px;
        }
        .ea-criteria-head {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:8px;
            margin-bottom:9px;
        }
        .ea-criteria-head strong { color:#1e293b; font-size:13px; }
        .ea-criteria-summary { font-size:10px; font-weight:800; color:#475569; }
        .ea-criteria-list { display:flex; flex-direction:column; gap:7px; }
        .ea-criterion {
            display:grid;
            grid-template-columns:24px minmax(0,1fr) auto;
            align-items:center;
            gap:8px;
            background:#fff;
            border:1px solid #e2e8f0;
            border-radius:10px;
            padding:8px 9px;
        }
        .ea-criterion-index {
            width:22px;
            height:22px;
            border-radius:999px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#eef2ff;
            color:#4f46e5;
            font-size:10px;
            font-weight:900;
        }
        .ea-criterion-title { color:#1e293b; font-size:11px; font-weight:900; line-height:1.3; }
        .ea-criterion-message { color:#64748b; font-size:9.5px; line-height:1.35; margin-top:2px; }
        .ea-criterion-status {
            border-radius:999px;
            padding:4px 7px;
            font-size:9px;
            font-weight:900;
            white-space:nowrap;
        }
        .ea-criterion.pass { border-color:#bbf7d0; background:#f0fdf4; }
        .ea-criterion.pass .ea-criterion-status { background:#dcfce7; color:#166534; }
        .ea-criterion.fail { border-color:#fecaca; background:#fff7f7; }
        .ea-criterion.fail .ea-criterion-status { background:#fee2e2; color:#991b1b; }
        .ea-criterion.na { border-color:#e2e8f0; background:#f8fafc; }
        .ea-criterion.na .ea-criterion-status { background:#e2e8f0; color:#475569; }


        /* Davranışsal durum başlığı ile açıklama arasındaki okunabilirlik boşluğu */
        #dIndexText {
            margin: 6px 0 0 !important;
            line-height: 1.42 !important;
        }
        #dIndexText strong {
            display: block !important;
            margin-bottom: 7px !important;
            line-height: 1.30 !important;
        }
        #dIndexText span {
            display: block !important;
            line-height: 1.42 !important;
        }

    </style>
    
    <div class="floating-wrap" id="floatWrapper" title="Sürükleyerek konumlandırın">
        <button class="floating-btn" id="floatBtn" aria-label="Caelum panelini aç/kapat"><span class="ea-floating-logo" aria-hidden="true"></span></button>
        <button class="hide-assistant-btn" id="hideAssistantBtn" aria-label="Caelum butonunu gizle" title="Butonu gizle">×</button>
    </div>
    <div class="panel" id="mainPanel">
        <div class="header"><span>CAELUM</span><button 
id="closeMenu"
style="
background:rgba(255,255,255,0.15);
border:none;
color:white;
cursor:pointer;
font-size:18px;
width:36px;
height:36px;
border-radius:12px;
display:flex;
align-items:center;
justify-content:center;
transition:.2s;
backdrop-filter:blur(8px);
">
✕
</button></div>
        <nav class="ea-tabs">
            <button class="tab active" data-tab="modes">Modlar</button>
            <button class="tab" data-tab="summary">Özet</button>
            <button class="tab" data-tab="audit">Denetim</button>
          
        </nav>
        <div class="content">
    <div class="section active" id="tab-modes">

    <div class="ea-ai-bar" style="background: linear-gradient(135deg, #fff7ed, #eef1ff 55%, #f9e8ee); margin-bottom: 15px; color:#282b3d; border:1px solid rgba(117,132,214,0.18);">
        <div class="ea-ai-left" style="font-size:13px; margin-bottom:8px;">🩺 Akıllı Profil Oluşturucu</div>
        <textarea id="aiConditionInput" name="aiConditionInput" placeholder="Durumunuzu buraya yazın (Örn: İleri derece disleksi ve astigmatım var...)" style="width:100%; padding:10px; border-radius:8px; border:none; font-size:12px; resize:vertical; min-height: 60px; color:#111;"></textarea>
        <button class="ea-ai-btn" id="aiConditionBtn" style="margin-top:10px; width:100%; justify-content:center; background: #6f78bd; color: white;">🎯 Profilimi Oluştur ve Kaydet</button>
        <div id="aiConditionResult" style="margin-top:10px; font-size:11px; background:rgba(255,255,255,0.62); padding:8px; border-radius:6px; display:none; color:#282b3d; border:1px solid rgba(117,132,214,0.18);"></div>
    </div>

    <div class="ea-ai-bar">

        <div class="ea-ai-left">
            ✨ Yapay Zeka Destek Merkezi
        </div>

        <div class="ea-ai-actions">

            <button
                class="ea-ai-btn"
                id="aiSimplifyToggle">

                🪄 Akıllı Sadeleştir
            </button>

            <button
                class="ea-ai-btn"
                id="aiNavigatorToggle">

                🧭 Sayfada Bul
            </button>

        </div>

    </div>
    <div class="grid" id="modeButtons"></div>

</div>            
            <div class="section" id="tab-summary">
    
    <button class="reset-btn" id="btn-calc-total-score" style="background: linear-gradient(90deg, #0284c7, #38bdf8); margin-bottom: 15px; border: 1px solid #0369a1; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);">
        Erişilebilirlik Skoru
    </button>
    
    <div id="oek-total-score-card" style="display:none; text-align:center; padding:18px; background:linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius:12px; margin-bottom:15px; border:2px solid #7dd3fc; animation: aiFade 0.3s ease;">
        <h3 style="margin:0; color:#0369a1; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Genel Erişilebilirlik Skoru</h3>
        <div style="font-size:42px; font-weight:900; color:#0284c7; margin:8px 0;" id="oek-score-value">--</div>
        <p style="margin:0; font-size:11px; color:#0ea5e9;">Görsel, İşitsel, Bilişsel ve Motor alt skorların ağırlıklı birleşimidir.</p>
    </div>
    <div class="score-grid" id="scoreGrid"></div>

                <div class="finding ea-behavior-card" style="background:#f0f9ff; border-left-color:#0ea5e9;">
                    <h4>Davranışsal Durum Analizi</h4>
                    <p id="dIndexText">Veri toplanıyor...</p>
                    <div id="eaBehaviorSignals" class="ea-behavior-signals"></div>
                    <div class="ea-behavior-actions">
                        <button type="button" class="ea-mini-action" id="eaBehaviorAIButton">🤖 AI Çözüm Öner</button>
                        <button type="button" class="ea-mini-action" id="eaBehaviorProfileButton" style="display:none;">Profili Aç</button>
                    </div>
                    <div id="eaBehaviorAIResult" class="ea-ai-result" style="display:none;"></div>
                </div>

                <div id="profilesArea">
                    <button class="profile-btn" data-profile="vision">
                        <b>👁️ Görme Profili</b>
                        <i>Alt metin, kontrast, başlık ve rehber desteği.</i>
                    </button>
                    <button class="profile-btn" data-profile="cognitive">
                        <b>🧠 Bilişsel Profil</b>
                        <i>Sade okuma, dikkat azaltma ve AI özetleme.</i>
                    </button>
                    <button class="profile-btn" data-profile="motor">
                        <b>🖱️ Motor Profil</b>
                        <i>Büyük hedefler, net odak ve klavye desteği. Sanal imleç otomatik açılmaz.</i>
                    </button>
                    <button class="profile-btn" data-profile="hearing">
                        <b>🔊 İşitme Profili</b>
                        <i>Medya altyazı, transkript ve ses kontrolleri.</i>
                    </button>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
                    <button class="tab" id="oneClickBtn">Tek Tuşla Çözüm</button>
                    <button class="tab" id="undoBtn" style="color:#b91c1c; border-color:#fca5a5;">Geri Al</button>
                </div>
            </div>
            
            <div class="section" id="tab-audit">
              <button id="heatmapBtn" class="heatmap-btn" type="button" aria-pressed="false">
                𖦏 Risk ve Zorluk Haritasını Başlat
              </button>
              <div id="heatmapInfo" style="display:none; margin:-6px 0 14px; padding:10px 12px; border-radius:12px; background:#f8fafc; border:1px solid #e5e7eb; font-size:11px; color:#334155; line-height:1.45;">
                Harita; ağırlıklı WCAG bulgularını, DOM konumlarını, Rage Click, Scroll Oscillation, odak kaybı ve fare tutarsızlığı sinyallerini birleştirerek piksel tabanlı termal yoğunluk üretir.
              </div>
              <div id="ea-fix-score-area"></div>
              <button id="ea-refresh-audit-btn" class="reset-btn" style="margin-bottom:10px; background:#7c89d6;">
                  ↻ Denetimi Yenile
              </button>
              <button id="ea-auto-fix-btn" class="reset-btn" style="margin-bottom:12px; background:#6f78bd;">
                  🚀 Otomatik Düzelt
              </button>
              
              <div id="findings"></div>
            </div>

    </div>
            <div class="section" id="tab-editor"><div id="editorPanel"></div></div>

           <button class="reset-btn" id="resetSettingsBtn">↻ Ayarları Sıfırla</button>
           <button class="reset-btn" id="resetApiBtn" style="background:#dc2626; margin-top:8px;">🗑 API Anahtarını Sil</button>
        </div>
    </div>

    <div id="ea-guide-modal">
        <div id="ea-guide-header">
            <span>🗺️ Sayfa İçerik Haritası</span>
            <button id="ea-guide-close-btn">✕</button>
        </div>
        <div id="ea-guide-content"></div>
    </div>
    `;
  },


  applyAssistantVisibility: function () {
    const shadow = EAApp.dom.shadow;
    if (!shadow) return;
    const wrapper = shadow.getElementById("floatWrapper");
    const panel = shadow.getElementById("mainPanel");
    const hidden = !!EAApp.state.assistantHidden;

    if (wrapper) {
      wrapper.style.display = hidden ? "none" : "block";
    }

    if (hidden && panel) {
      panel.classList.remove("open");
    }

    if (!hidden) {
      this.applySavedButtonPosition();
    }
  },

  showAssistant: function (openPanel = true) {
    EAApp.state.assistantHidden = false;
    EAApp.saveState();
    this.applyAssistantVisibility();

    const panel = EAApp.dom.shadow.getElementById("mainPanel");
    if (openPanel && panel) {
      panel.classList.add("open");
      this.positionPanelNearButton();
      this.updateButtons();
    }
  },

  hideAssistant: function () {
    EAApp.state.assistantHidden = true;
    EAApp.saveState();
    this.applyAssistantVisibility();
    alert("Caelum butonu gizlendi. Tekrar göstermek için tarayıcıdaki Caelum eklenti ikonuna tıklayabilirsiniz.");
  },

  applySavedButtonPosition: function () {
    const wrapper = EAApp.dom.shadow.getElementById("floatWrapper");
    if (!wrapper) return;

    const pos = EAApp.state.assistantButtonPosition;
    if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
      const maxLeft = Math.max(8, window.innerWidth - wrapper.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - wrapper.offsetHeight - 8);
      wrapper.style.left = Math.min(Math.max(8, pos.left), maxLeft) + "px";
      wrapper.style.top = Math.min(Math.max(8, pos.top), maxTop) + "px";
      wrapper.style.right = "auto";
      wrapper.style.bottom = "auto";
    }
  },

  positionPanelNearButton: function () {
    const shadow = EAApp.dom.shadow;
    const wrapper = shadow.getElementById("floatWrapper");
    const panel = shadow.getElementById("mainPanel");
    if (!wrapper || !panel) return;

    const rect = wrapper.getBoundingClientRect();
    const panelWidth = Math.min(420, window.innerWidth - 24);
    const panelHeight = panel.offsetHeight || Math.min(window.innerHeight - 120, 640);

    let left = rect.left;
    if (rect.left + panelWidth > window.innerWidth - 12) {
      left = window.innerWidth - panelWidth - 12;
    }
    left = Math.max(12, left);

    let top = rect.bottom + 12;
    if (top + panelHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - panelHeight - 12);
    }

    panel.style.left = left + "px";
    panel.style.right = "auto";
    panel.style.top = top + "px";
  },

  initDraggableLauncher: function () {
    const shadow = EAApp.dom.shadow;
    const wrapper = shadow.getElementById("floatWrapper");
    const floatBtn = shadow.getElementById("floatBtn");
    if (!wrapper || !floatBtn || this.__launcherDragReady) return;
    this.__launcherDragReady = true;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let moved = false;

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

      const maxLeft = Math.max(8, window.innerWidth - wrapper.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - wrapper.offsetHeight - 8);
      const left = Math.min(Math.max(8, startLeft + dx), maxLeft);
      const top = Math.min(Math.max(8, startTop + dy), maxTop);

      wrapper.style.left = left + "px";
      wrapper.style.top = top + "px";
      wrapper.style.right = "auto";
      wrapper.style.bottom = "auto";
      this.positionPanelNearButton();
      e.preventDefault();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      wrapper.classList.remove("dragging");

      const left = parseInt(wrapper.style.left || wrapper.getBoundingClientRect().left, 10);
      const top = parseInt(wrapper.style.top || wrapper.getBoundingClientRect().top, 10);
      EAApp.state.assistantButtonPosition = { left, top };
      EAApp.saveState();

      this.__launcherWasDragged = moved;
      setTimeout(() => {
        this.__launcherWasDragged = false;
      }, 80);

      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
    };

    floatBtn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      wrapper.classList.add("dragging");

      const rect = wrapper.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener("pointermove", onMove, true);
      document.addEventListener("pointerup", onUp, true);
    });

    window.addEventListener("resize", () => {
      this.applySavedButtonPosition();
      this.positionPanelNearButton();
    });
  },

  installRestoreMessageListener: function () {
    if (this.__restoreMessageListenerReady) return;
    this.__restoreMessageListenerReady = true;

    try {
      chrome.runtime.onMessage.addListener((request) => {
        if (request && request.action === "ea-show-assistant") {
          this.showAssistant(true);
        }
      });
    } catch (error) {
      console.warn("Caelum gösterme dinleyicisi kurulamadı:", error);
    }
  },


  handleAuditFixButton: async function (btn) {
    if (!btn || !window.EAAudit) return;

    const index = Number(btn.dataset.index);
    if (!Number.isFinite(index)) return;

    const oldText = btn.innerText;
    btn.disabled = true;
    btn.style.pointerEvents = "none";
    btn.innerText = "⏳ İşleniyor...";

    try {
      if (btn.classList.contains("ea-ai-fix-btn")) {
        const fixType = btn.dataset.fix;
        if (fixType === "label") {
          await EAAudit.fixSpecificIssue(index, false, { forceAI: true });
        } else {
          await EAAudit.aiFixAlt(index, { forceAI: true });
        }
      } else {
        await EAAudit.fixSpecificIssue(index);
      }
    } catch (error) {
      console.error("Denetim düzeltmesi başarısız:", error);
      alert("Düzeltme uygulanamadı: " + (error.message || "Bilinmeyen hata"));
    } finally {
      btn.disabled = false;
      btn.style.pointerEvents = "";
      btn.innerText = oldText;
    }
  },

  setupAuditFixDelegation: function () {
    if (this.__auditFixDelegationReady) return;
    this.__auditFixDelegationReady = true;

    const shadow = EAApp.dom.shadow;
    const panel = shadow.getElementById("mainPanel");
    if (!panel) return;

    panel.addEventListener("click", (event) => {
      const path = event.composedPath ? event.composedPath() : [];

      const clearAltResults = path.find(
        (node) => node && node.classList && node.classList.contains("ea-alt-results-clear")
      );
      if (clearAltResults) {
        event.preventDefault();
        EAAudit.altFixResults = {};
        this.renderFindings();
        return;
      }

      const clearLabelResults = path.find(
        (node) => node && node.classList && node.classList.contains("ea-label-results-clear")
      );
      if (clearLabelResults) {
        event.preventDefault();
        EAAudit.formLabelFixResults = {};
        this.renderFindings();
        return;
      }

      const labelJumpButton = path.find(
        (node) => node && node.classList && node.classList.contains("ea-label-result-jump")
      );
      if (labelJumpButton) {
        event.preventDefault();
        const resultId = labelJumpButton.dataset.labelResultId;
        const target = Array.from(document.querySelectorAll("[data-ea-label-result-id]")).find(
          (node) => node.getAttribute("data-ea-label-result-id") === resultId
        );

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.focus({ preventScroll: true });
          const previousOutline = target.style.outline;
          const previousOffset = target.style.outlineOffset;
          target.style.setProperty("outline", "6px solid #f59e0b", "important");
          target.style.setProperty("outline-offset", "5px", "important");
          setTimeout(() => {
            target.style.outline = previousOutline;
            target.style.outlineOffset = previousOffset;
          }, 3500);
        } else {
          alert("İlgili form alanı dinamik olarak kaldırılmış veya sayfa yenilenmiş olabilir.");
        }
        return;
      }

      const jumpButton = path.find(
        (node) => node && node.classList && node.classList.contains("ea-alt-result-jump")
      );
      if (jumpButton) {
        event.preventDefault();
        const resultId = jumpButton.dataset.altResultId;
        const target = Array.from(document.querySelectorAll("[data-ea-alt-result-id]")).find(
          (node) => node.getAttribute("data-ea-alt-result-id") === resultId
        );

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          const previousOutline = target.style.outline;
          const previousOffset = target.style.outlineOffset;
          target.style.setProperty("outline", "6px solid #f59e0b", "important");
          target.style.setProperty("outline-offset", "5px", "important");
          setTimeout(() => {
            target.style.outline = previousOutline;
            target.style.outlineOffset = previousOffset;
          }, 3500);
        } else {
          alert("İlgili görsel dinamik olarak kaldırılmış veya sayfa yenilenmiş olabilir.");
        }
        return;
      }

      const btn = path.find(
        (node) =>
          node &&
          node.classList &&
          (node.classList.contains("ea-ai-fix-btn") ||
            node.classList.contains("ea-individual-fix-btn"))
      );

      if (!btn) return;

      event.preventDefault();
      event.stopPropagation();
      this.handleAuditFixButton(btn);
    });
  },

  setupEvents: function () {
    const shadow = EAApp.dom.shadow;
    const panel = shadow.getElementById("mainPanel");
    const floatBtn = shadow.getElementById("floatBtn");
    const hideBtn = shadow.getElementById("hideAssistantBtn");

    this.initDraggableLauncher();
    this.installRestoreMessageListener();
    this.setupAuditFixDelegation();
    this.initHeatmapLiveUpdates();
    this.applyAssistantVisibility();

    // Paneli Aç/Kapat
    floatBtn.onclick = () => {
      if (this.__launcherWasDragged) return;
      panel.classList.toggle("open");
      if (panel.classList.contains("open")) {
        this.positionPanelNearButton();
        this.updateButtons();
      }
    };

    if (hideBtn) {
      hideBtn.onclick = (e) => {
        e.stopPropagation();
        this.hideAssistant();
      };
    }

    shadow.getElementById("closeMenu").onclick = () =>
      panel.classList.remove("open");

    // Sekmeler ve Profiller
    shadow
      .querySelectorAll(".tab[data-tab]")
      .forEach((t) => (t.onclick = () => this.activateTab(t.dataset.tab)));
    shadow
      .querySelectorAll("[data-profile]")
      .forEach((b) => (b.onclick = () => this.applyProfile(b.dataset.profile)));

    const behaviorAIButton = shadow.getElementById("eaBehaviorAIButton");
    if (behaviorAIButton) {
      behaviorAIButton.onclick = () => this.runBehaviorAIAnalysis();
    }

    const behaviorProfileButton = shadow.getElementById("eaBehaviorProfileButton");
    if (behaviorProfileButton) {
      behaviorProfileButton.onclick = () => {
        const profile = behaviorProfileButton.dataset.profile || EAApp.state.aiBehaviorRecommendedProfile;
        if (profile) this.applyProfile(profile);
      };
    }

    const behaviorResult = shadow.getElementById("eaBehaviorAIResult");
    if (behaviorResult) {
      behaviorResult.addEventListener("click", (event) => {
        const target = event.target.closest && event.target.closest(".ea-ai-profile-open");
        if (!target) return;
        const profile = target.dataset.profile;
        if (profile) this.applyProfile(profile);
      });
    }

    shadow.getElementById("oneClickBtn").onclick = () => this.applyOneClick();
    shadow.getElementById("undoBtn").onclick = () => {
      EAApp.undoAll();
      this.updateButtons();
    };

    // Risk ve Zorluk Haritası
    shadow.getElementById("heatmapBtn").onclick = (e) => {
      this.heatmapVisible = !this.heatmapVisible;
      const canvas = document.getElementById("ea-heatmap-canvas");
      const info = shadow.getElementById("heatmapInfo");
      if (canvas) canvas.style.display = this.heatmapVisible ? "block" : "none";
      if (info) info.style.display = this.heatmapVisible ? "block" : "none";
      e.currentTarget.setAttribute("aria-pressed", this.heatmapVisible ? "true" : "false");
      e.currentTarget.innerText = this.heatmapVisible
        ? " ✕ Risk ve Zorluk Haritasını Kapat"
        : "𖦏 Risk ve Zorluk Haritasını Başlat";
      if (this.heatmapVisible) this.drawHeatmap();
      if (!this.heatmapVisible && info) {
        info.innerHTML = "Harita kapalı. Açıldığında ağırlıklı DOM bulguları ve davranışsal sinyaller piksel tabanlı termal haritaya dönüştürülür.";
      }
    };

    // DENETİMİ MANUEL YENİLE
    const refreshAuditBtn = shadow.getElementById("ea-refresh-audit-btn");
    if (refreshAuditBtn) {
      refreshAuditBtn.onclick = () => {
        if (!window.EAAudit) return;
        EAAudit.refresh();
        this.updateButtons();
        alert("Denetim yenilendi.");
      };
    }

    // OTOMATİK DÜZELT
    const autoFixBtn = shadow.getElementById("ea-auto-fix-btn");
    if (autoFixBtn) {
      autoFixBtn.onclick = async () => {
        if (!window.EAAudit) return;
        autoFixBtn.disabled = true;
        const oldText = autoFixBtn.innerText;
        autoFixBtn.innerText = "⏳ Düzeltmeler uygulanıyor...";
        try {
          await EAAudit.autoFix();
        } finally {
          autoFixBtn.disabled = false;
          autoFixBtn.innerText = oldText;
        }
      };
    }

    // AI Navigasyon
    const aiBtn = shadow.getElementById("aiNavBtn");
    if (aiBtn) {
      aiBtn.onclick = () => {
        const query = shadow.getElementById("aiNavInput").value;
        if (query && window.EAAI) EAAI.findTarget(query);
      };
    }

    // AYARLARI SIFIRLA
// AYARLARI SIFIRLA
shadow.getElementById("resetSettingsBtn").onclick = () => {
  if (!confirm("Tüm erişilebilirlik ayarları sıfırlansın mı?")) {
    return;
  }

  const apiKey = EAApp.state.apiKey;
  const captionApiKey = EAApp.state.captionApiKey;

  Object.assign(EAApp.state, {
    hlLinks: false,
    keyboard: false,
    zoom: 0,
    lh: 0,
    align: 0,
    space: 0,
    font: 0,
    guide: 0,
    pageGuide: false,
    contrast: 0,
    sat: 0,
    blue: false,

    aiConditionText: "",
    aiConditionActiveModes: [],
    aiConditionRecommendations: [],

    cb: 0,
    img: false,
    anim: false,
    dark: false,
    head: false,
    altText: false,
    mute: false,
    reader: false,
    simplify: false,
    cognitive: false,
    focusAssist: false,
    largeTargets: false,
    suppressDistractions: false,
    autoAlt: false,
    oneClick: false,

    activeProfile: "",
    initialFindingCount: 0,
    currentIssueCount: 0,

    assistantHidden: false,
    assistantButtonPosition: null,

    auditFixNotes: {},
    aiBehaviorAnalysis: "",
    aiBehaviorRecommendedProfile: "",
    behaviorPopupShown: false,
    behaviorAutoApplied: {}
  });

  EAApp.state.apiKey = apiKey;
  EAApp.state.captionApiKey = captionApiKey;

  EAApp.saveState();
  location.reload();
};

    // API KEY SİL
    shadow.getElementById("resetApiBtn").onclick = () => {
      if (confirm("API anahtarı silinsin mi?")) {
        EAApp.state.apiKey = null;
        EAApp.state.captionApiKey = null;
        EAApp.saveState();
        alert("API anahtarı silindi.");
      }
    };
    /* AI SIMPLIFY TOGGLE */

    const aiToggle = EAApp.dom.shadow.getElementById("aiSimplifyToggle");

    if (aiToggle) {
      const updateAIButton = () => {
        const active = EAApp.state.simplify;

        const updateAIButton = () => {
          const active = EAApp.state.simplify;

          aiToggle.classList.toggle("active", active);
        };

        aiToggle.classList.toggle("active", active);
      };

      updateAIButton();

      aiToggle.addEventListener("click", () => {
        EAApp.toggleState("simplify");

        updateAIButton();
      });
    }

    /* AI NAVIGATOR */

    const aiNavigatorBtn = shadow.getElementById("aiNavigatorToggle");

    if (aiNavigatorBtn) {
      aiNavigatorBtn.onclick = () => {
        const query = prompt("Nereye gitmek istiyorsun?");

        if (query && window.EAAI) {
          EAAI.findTarget(query);
        }
      };
    }
    const calcScoreBtn = shadow.getElementById("btn-calc-total-score");
    const scoreCard = shadow.getElementById("oek-total-score-card");
    const scoreValue = shadow.getElementById("oek-score-value");

    if (calcScoreBtn && scoreCard && scoreValue) {
      // 1. Butona tıklayınca hesapla ve göster
      calcScoreBtn.onclick = () => {
        if (window.EAAudit) {
          EAAudit.refresh();
        }
        if (window.EAAudit && EAApp.audit && EAApp.audit.scores) {
          const scores = EAApp.audit.scores;

          // Genel skor, uygulanabilir boyutların OEK-4 ağırlıkları
          // kendi toplamları içinde normalize edilerek hesaplanır.
          const totalScore = scores.general;

          scoreValue.innerText = totalScore;

          // Skora göre renk değişimi
          if (totalScore >= 80) {
            scoreValue.style.color = "#6f78bd";
            scoreCard.style.borderColor = "#e7b965";
          } else if (totalScore >= 50) {
            scoreValue.style.color = "#f59e0b";
            scoreCard.style.borderColor = "#fcd34d";
          } else {
            scoreValue.style.color = "#ef4444";
            scoreCard.style.borderColor = "#fca5a5";
          }

          // Butonu gizle, kartı göster
          calcScoreBtn.style.display = "none";
          scoreCard.style.display = "block";
        } else {
          alert(
            "Lütfen hesaplama yapmadan önce denetimin tamamlanmasını bekleyin.",
          );
        }
      };

      // 2. Karta tıklayınca gizle ve butonu geri getir
      scoreCard.style.cursor = "pointer";
      scoreCard.title = "Kapatmak için tıklayın";
      scoreCard.onclick = () => {
        scoreCard.style.display = "none";
        calcScoreBtn.style.display = "block";
      };
    }
    const aiConditionInput = shadow.getElementById("aiConditionInput");
    const aiConditionBtn = shadow.getElementById("aiConditionBtn");
    const aiConditionResult = shadow.getElementById("aiConditionResult");

    const modeNames = {
      autoAlt: "▧ ALT Oto Alt Metin",
      hlLinks: "🔗 Link Vurgula",
      keyboard: "⌨️ Klavye Desteği",
      dark: "🌙 Karanlık Mod",
      head: "🏷️ Başlıklar",
      reader: "🔊 Ekran Okuyucu",
      altText: "📝 Alt Metin Yaz",
      mute: "🔇 Sesi Kapat",
      blue: "🔵 Mavi Filtre",
      img: "🖼️ Görselleri Gizle",
      anim: "🚫 Animasyonu Durdur",
      focusAssist: "🎯 Odak Yardımı",
      largeTargets: "🔘 Büyük Hedef",
      suppressDistractions: "🚫 Reklamları Gizle",
      zoom: "🔍 Yakınlaştır",
      lh: "↕️ Satır Boyu",
      space: "↔️ Metin Boşluğu",
      align: "↔️ Metin Hizalama",
      font: "🅰️ Disleksi Fontu",
      contrast: "🌗 Kontrast",
      sat: "🎨 Doygunluk",
      cb: "👁️ Genel Renk Körlüğü Filtresi",
      pageGuide: "🗺️ Sayfa Haritası",
    };

    const renderRecommendations = (keys) => {
      const recommendedHTML = keys
        .map((k) => {
          const name = modeNames[k] || k;
          return `<span style="display:inline-block; background:rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding:4px 8px; border-radius:6px; margin: 3px;">${name}</span>`;
        })
        .join("");

      aiConditionResult.style.display = "block";
      if (keys.length > 0) {
        aiConditionResult.innerHTML = `<strong>💡 Yapay Zeka Önerileri:</strong><br><span style="opacity:0.8; font-size:10px;">Durumunuz için aşağıdaki özellikler önerildi/açıldı:</span><br><br>${recommendedHTML}`;
      } else {
        aiConditionResult.innerHTML = `Bu durum için spesifik bir mod önerisi bulunamadı.`;
      }
    };

    // 1. Sayfa yüklendiğinde hafızadaki API verisini çek (TOKEN TASARRUFU)
    if (EAApp.state.aiConditionText && EAApp.state.aiConditionRecommendations) {
      aiConditionInput.value = EAApp.state.aiConditionText;
      renderRecommendations(EAApp.state.aiConditionRecommendations);

      if (EAApp.state.aiConditionExplanation) {
        aiConditionResult.innerHTML += `<div style="margin-top:8px; opacity:.86;">${EAApp.state.aiConditionExplanation}</div>`;
      }
    }

    const resetAccessibilityStateForProfile = () => {
      const boolKeys = [
        "autoAlt", "hlLinks", "keyboard", "dark", "head", "reader", "altText",
        "mute", "blue", "img", "anim", "focusAssist", "largeTargets",
        "suppressDistractions", "simplify", "oneClick", "pageGuide"
      ];

      const numericKeys = [
        "zoom", "lh", "space", "align", "font", "guide",
        "contrast", "sat", "cb"
      ];

      boolKeys.forEach((key) => {
        EAApp.state[key] = false;
      });

      numericKeys.forEach((key) => {
        EAApp.state[key] = 0;
      });

      EAApp.state.activeProfile = "";
    };

    const applyConditionKeys = (keys) => {
      resetAccessibilityStateForProfile();

      const numericDefaults = {
        zoom: 1,
        lh: 1,
        space: 1,
        align: 1,
        font: 1,
        guide: 3,
        contrast: 3,
        sat: 1,
        cb: 1
      };

      (keys || []).filter((key) => key !== "keyboard").forEach((key) => {
        if (key === "cbProtanopia") {
          EAApp.state.cb = 1;
          return;
        }

        if (key === "cbDeuteranopia") {
          EAApp.state.cb = 2;
          return;
        }

        if (key === "cbTritanopia") {
          EAApp.state.cb = 3;
          return;
        }

        if (key === "cbMonochrome") {
          EAApp.state.cb = 4;
          return;
        }

        if (Object.prototype.hasOwnProperty.call(numericDefaults, key)) {
          EAApp.state[key] = Math.max(EAApp.state[key] || 0, numericDefaults[key]);
        } else {
          EAApp.state[key] = true;
        }
      });

      EAApp.saveState();

      if (window.EAFilters) {
        EAFilters.apply();
      }

      if (window.EAGuide) {
        EAGuide.toggle(!!(keys && keys.includes("pageGuide")));
      }

      this.renderModes();
    };

    if (aiConditionBtn) {
      aiConditionBtn.onclick = async () => {
        const text = aiConditionInput.value.trim();
        if (!text) return alert("Lütfen bir durum belirtin.");
        if (!window.EAAI || !EAAI.generateProfileRecommendations) {
          return alert("Profil oluşturucu modülü yüklenemedi.");
        }

        const oldText = aiConditionBtn.innerText;
        aiConditionBtn.disabled = true;
        aiConditionBtn.innerText = "⏳ OpenRouter ile profil oluşturuluyor...";

        try {
          aiConditionResult.style.display = "block";
          aiConditionResult.innerHTML = "OpenRouter üzerinden durum analizi yapılıyor...";

          const result = await EAAI.generateProfileRecommendations(text);
          const keys = result.keys || [];

          EAApp.state.aiConditionText = text;
          EAApp.state.aiConditionRecommendations = keys;
          EAApp.state.aiConditionExplanation = result.explanation || "";
          EAApp.state.aiConditionProfile = result.profile || "";
          EAApp.saveState();

          applyConditionKeys(keys);

          const recommendedHTML = keys
            .map((k) => {
              const name = modeNames[k] || k;
              return `<span style="display:inline-block; background:rgba(255,255,255,0.72); border: 1px solid rgba(117,132,214,0.18); color:#4b5563; padding:4px 8px; border-radius:999px; margin: 3px; font-weight:800;">${name}</span>`;
            })
            .join("");

          aiConditionResult.style.display = "block";
          aiConditionResult.innerHTML = `
            <strong>✅ Profil oluşturuldu ve modlar açıldı.</strong><br>
            <span style="opacity:.82;">Kaynak: ${result.source === "openrouter" ? "OpenRouter AI" : "Yerel analiz"}</span><br>
            ${result.explanation ? `<div style="margin-top:6px;">${result.explanation}</div>` : ""}
            <div style="margin-top:8px;">${recommendedHTML || "Uygulanacak özel mod bulunamadı."}</div>
          `;
        } catch (err) {
          console.error("Akıllı profil oluşturucu hatası:", err);
          aiConditionResult.style.display = "block";
          aiConditionResult.innerHTML = `
            <strong>⚠️ Profil oluşturulamadı.</strong><br>
            OpenRouter yanıtı alınamadı veya API anahtarı geçersiz olabilir. Hata: ${err.message || "bilinmeyen hata"}
          `;
        } finally {
          aiConditionBtn.disabled = false;
          aiConditionBtn.innerText = oldText || "🎯 Profilimi Oluştur ve Kaydet";
        }
      };
    }
  },

  activateTab: function (name) {
    const shadow = EAApp.dom.shadow;
    shadow
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    shadow
      .querySelectorAll(".section")
      .forEach((s) => s.classList.toggle("active", s.id === `tab-${name}`));

    if (name === "audit" || name === "summary") {
      this.updateButtons();
    } else {
      this.renderModes();
    }
  },

  applyProfile: function (p) {
    const profs = {
      vision: {
        activeProfile: "vision",
        contrast: 3,
        reader: true,
        head: true,
        altText: true,
        zoom: 2,
        hlLinks: true,
        guide: 1,
        lh: 2,
        space: 1,
        sat: 1,
      },
      cognitive: {
        activeProfile: "cognitive",
        simplify: true,
        anim: true,
        suppressDistractions: true,
        focusAssist: true,
        lh: 1,
        space: 1,
        align: 1,
        zoom: 1,
        sat: 1,
        hlLinks: true,
      },
      motor: {
        activeProfile: "motor",
        // Motor profilde sanal imleç otomatik açılmaz.
        // Amaç: hedefleri büyütmek, focus görünürlüğünü artırmak ve klavye erişimini desteklemek.
        keyboard: false,
        largeTargets: true,
        focusAssist: true,
        zoom: 1,
        space: 1,
        lh: 1,
        hlLinks: true,
        guide: 0,
      },
      hearing: {
        activeProfile: "hearing",
        mute: false,
        head: true,
        zoom: 1,
        focusAssist: true,
        guide: 1,
      },
    };
    EAApp.setState(profs[p] || {});

    if (p === "hearing") {
      const ytCC = document.querySelector(".ytp-subtitles-button");
      if (ytCC && ytCC.getAttribute("aria-pressed") !== "true") ytCC.click();
      document.querySelectorAll("track").forEach((track) => {
        track.mode = "showing";
      });
      document.querySelectorAll("[data-transcript]").forEach((el) => {
        el.style.display = "block";
      });
      document.querySelectorAll("video, audio").forEach((media) => {
        if (media.autoplay) media.muted = true;
      });
    }
    this.updateButtons();
  },

  applyOneClick: function () {
    EAApp.setState({
      oneClick: true,
      contrast: 2,
      head: true,
      simplify: true,
      largeTargets: true,
    });
    this.updateButtons();
  },


  getAccessibilityPayload: function () {
    const audit = EAApp.audit || (window.EAAudit ? EAAudit.refresh() : null);
    const signals = window.EAAudit && EAAudit.getBehaviorSignals
      ? EAAudit.getBehaviorSignals()
      : {};

    const findingSummary = window.EAAudit
      ? EAAudit.findings.slice(0, 8).map((finding) => ({
          title: finding.title,
          group: finding.group || "general",
          type: finding.type || "",
          count: finding.nodes ? finding.nodes.length : 1
        }))
      : [];

    return {
      page: {
        title: document.title,
        url: location.href
      },
      // Skor istemci tarafında deterministik olarak hesaplanır. AI bu değeri
      // yeniden hesaplamaz; yalnızca bağlamsal öneri ve profil seçimi için yorumlar.
      oek4: {
        method: audit?.scoreMethod || "OEK4_WEIGHTED_NORMALIZED_FIXED_4D_CLIENT_MONOTONIC",
        weights: audit?.scoreWeights || {
          vision: 0.30,
          hearing: 0.20,
          cognitive: 0.25,
          motor: 0.25
        },
        scores: audit ? audit.scores : {},
        rawScores: audit ? audit.rawScores : {},
        criteriaSummary: audit ? audit.criteriaSummary : {},
        applicability: audit ? audit.scoreApplicability : {}
      },
      scores: audit ? audit.scores : {},
      totalIssues: EAApp.state.currentIssueCount || 0,
      findings: findingSummary,
      behavior: signals
    };
  },

  localBehaviorSuggestion: function (signals) {
    if (!signals || signals.level === "stable") {
      return "Kullanıcı davranışı stabil görünüyor. Yine de sayfada erişilebilirlik bulguları varsa ilgili profili manuel açabilirsiniz.";
    }

    if (signals.recommendedProfile === "motor") {
      return "Fare hareketlerinde tutarsızlık, sürekli tıklama veya odak değişimi algılandı. Motor Profil açılarak büyük hedefler ve net focus göstergesi etkinleştirilebilir. Klavye Desteği otomatik açılmaz; kullanıcı isterse manuel açar.";
    }

    if (signals.recommendedProfile === "vision") {
      return "Görsel erişilebilirlik skoru düşük görünüyor. Görme Profili açılarak kontrast, alt metin ve rehber destekleri etkinleştirilebilir.";
    }

    if (signals.recommendedProfile === "cognitive") {
      return "Tekrarlı kaydırma ve yön kaybı belirtisi algılandı. Bilişsel Profil açılarak sadeleştirme ve okuma desteği etkinleştirilebilir.";
    }

    return "Davranışsal zorluk algılandı. Kullanıcıya uygun profil açılarak sayfa daha erişilebilir hale getirilebilir.";
  },


  applyBehaviorAutoSupport: function (signals) {
    if (!signals || !window.EAApp || !EAApp.state) return;

    EAApp.state.behaviorAutoApplied = EAApp.state.behaviorAutoApplied || {};

    const shadow = EAApp.dom && EAApp.dom.shadow;
    const resultBox = shadow ? shadow.getElementById("eaBehaviorAIResult") : null;

    const showResult = (html) => {
      if (!resultBox) return;
      resultBox.style.display = "block";
      resultBox.innerHTML = html;
    };

    // Aynı bölgede tekrarlı tıklama varsa motor destekleri aç.
    if (
      signals.rageClicks >= 2 &&
      !EAApp.state.behaviorAutoApplied.largeTargets
    ) {
      EAApp.state.largeTargets = true;
      EAApp.state.focusAssist = true;
      EAApp.state.behaviorAutoApplied.largeTargets = true;
      EAApp.saveState();

      if (window.EAFilters) {
        EAFilters.apply();
      }

      showResult(`
        <strong>🖱️ Otomatik Motor Destek Açıldı</strong><br>
        Aynı bölgede tekrarlı tıklama algılandı. Bu yüzden büyük hedefler ve net odak desteği etkinleştirildi.
      `);
    }

    // Aşağı-yukarı kaydırma / yön kaybı varsa sayfa haritası aç.
    if (
      (signals.scrollDirectionChanges >= 4 || signals.disorientationScore >= 0.65) &&
      !EAApp.state.behaviorAutoApplied.pageGuide
    ) {
      EAApp.state.pageGuide = true;
      EAApp.state.behaviorAutoApplied.pageGuide = true;
      EAApp.saveState();

      if (window.EAGuide) {
        EAGuide.toggle(true);
      }

      showResult(`
        <strong>🗺️ Sayfa Haritası Açıldı</strong><br>
        Kullanıcının sayfada aşağı-yukarı hareket ederek yön kaybı yaşadığı algılandı. Sayfa bölümlerini daha kolay bulması için Sayfa Haritası etkinleştirildi.
      `);
    }

    if (EAApp.dom && EAApp.dom.shadow) {
      this.renderModes();
    }
  },

  updateBehaviorPanel: function () {
    const shadow = EAApp.dom.shadow;
    if (!shadow || !window.EAAudit || !EAAudit.getBehaviorSignals) return;

    const dText = shadow.getElementById("dIndexText");
    const signalsArea = shadow.getElementById("eaBehaviorSignals");
    const profileBtn = shadow.getElementById("eaBehaviorProfileButton");
    const resultBox = shadow.getElementById("eaBehaviorAIResult");

    const signals = EAAudit.getBehaviorSignals();
    this.applyBehaviorAutoSupport(signals);
    let icon = "✓";
    let tone = "stable";

    if (signals.level === "warning") {
      icon = "⚠️";
      tone = "warning";
    }

    if (signals.level === "critical") {
      icon = "🚨";
      tone = "critical";
    }

    if (dText) {
      dText.innerHTML = `<strong>${icon} ${signals.title}</strong><br><span>${signals.reason}</span>`;
    }

    if (signalsArea) {
      signalsArea.innerHTML = `
        <span>Yön kaybı: ${Math.round((signals.disorientationScore || 0) * 100)}%</span>
        <span>Fare zikzak/tutarsızlık: ${Math.round((signals.jitterIntensity || 0) * 100)}%</span>
        <span>Aynı bölgede sık tıklama: ${signals.rageClicks || 0}</span>
        <span>Odak değişimi: ${signals.focusChanges || 0}</span>
      `;
    }

    const card = shadow.querySelector(".ea-behavior-card");
    if (card) {
      card.classList.remove("behavior-stable", "behavior-warning", "behavior-critical");
      card.classList.add(`behavior-${tone}`);
    }

    if (profileBtn) {
      if (signals.recommendedProfile) {
        const labelMap = {
          vision: "👁️ Görme Profilini Aç",
          motor: "🖱️ Motor Profilini Aç",
          cognitive: "🧠 Bilişsel Profili Aç",
          hearing: "🔊 İşitme Profilini Aç"
        };
        profileBtn.style.display = "inline-flex";
        profileBtn.dataset.profile = signals.recommendedProfile;
        profileBtn.textContent = labelMap[signals.recommendedProfile] || "Profili Aç";
      } else {
        profileBtn.style.display = "none";
      }
    }

    if (resultBox) {
      if (signals.level === "stable") {
        resultBox.style.display = "none";
        resultBox.innerHTML = "";
      } else if (EAApp.state.aiBehaviorAnalysis) {
        resultBox.style.display = "block";
        resultBox.innerHTML = EAApp.state.aiBehaviorAnalysis;
      }
    }
  },

  runBehaviorAIAnalysis: async function () {
    const shadow = EAApp.dom.shadow;
    const resultBox = shadow.getElementById("eaBehaviorAIResult");
    const btn = shadow.getElementById("eaBehaviorAIButton");

    if (!window.EAAI || !window.EAAudit) return;

    const oldText = btn ? btn.innerText : "";
    if (btn) {
      btn.disabled = true;
      btn.innerText = "⏳ AI analiz ediyor...";
    }

    const payload = this.getAccessibilityPayload();
    const signals = payload.behavior || {};

    try {
      if (resultBox) {
        resultBox.style.display = "block";
        resultBox.innerHTML = "Yapısal veri, erişilebilirlik skoru ve davranışsal sinyaller yapay zekaya gönderiliyor...";
      }

      let aiText = null;

      try {
        aiText = await EAAI.analyzeAccessibilityState(payload);
      } catch (error) {
        console.error("AI davranış analizi hatası:", error);

        if (resultBox) {
          resultBox.style.display = "block";
          resultBox.innerHTML = `
            <strong>⚠️ AI analizi yapılamadı.</strong><br>
            Model endpoint hatası oluştu. Yerel davranış analizine göre öneri gösteriliyor.
          `;
        }
      }

      const suggestion = aiText || this.localBehaviorSuggestion(signals);
      const profile = signals.recommendedProfile || (
        payload.scores?.motor < 60 ? "motor" :
        payload.scores?.vision < 60 ? "vision" :
        payload.scores?.cognitive < 70 ? "cognitive" : ""
      );

      EAApp.state.aiBehaviorAnalysis = `
        <strong>🤖 AI Erişilebilirlik Analizi</strong><br>
        ${String(suggestion).replace(/\n/g, "<br>")}
        ${profile ? `<br><button type="button" class="ea-mini-action ea-ai-profile-open" data-profile="${profile}">Önerilen Profili Aç</button>` : ""}
      `;
      EAApp.state.aiBehaviorRecommendedProfile = profile;
      EAApp.saveState();

      if (resultBox) {
        resultBox.style.display = "block";
        resultBox.innerHTML = EAApp.state.aiBehaviorAnalysis;
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = oldText;
      }
    }
  },

  updateButtons: function () {
    const shadow = EAApp.dom.shadow;
    const activeTab = shadow.querySelector(".tab.active")
      ? shadow.querySelector(".tab.active").dataset.tab
      : "modes";

    if (window.EAAudit && (activeTab === "summary" || activeTab === "audit")) {
      const audit = EAApp.audit || EAAudit.refresh();
      const dScore = EAAudit.behaviorData.disorientationScore;

      const scoreGrid = shadow.getElementById("scoreGrid");
      if (scoreGrid) {
        const safeScore = (value) => {
          if (value === null || value === undefined || !Number.isFinite(Number(value))) {
            return "Öğe yok";
          }
          return Math.min(100, Math.max(0, Math.round(Number(value))));
        };

        scoreGrid.innerHTML = [
          ["Bilişsel", safeScore(audit.scores.cognitive)],
          ["Motor", safeScore(audit.scores.motor)],
          ["Görme", safeScore(audit.scores.vision)],
          ["İşitme", safeScore(audit.scores.hearing)],
        ]
          .map(
            (x) => `
                    <div class="score">
                        <strong>${x[0]}</strong>
                        <span>${x[1]}</span>
                    </div>
                `,
          )
          .join("");
      }
      const fixArea = shadow.getElementById("ea-fix-score-area");

      if (fixArea) {
        const current = EAApp.state.currentIssueCount || 0;
        const score = audit?.scores?.general ?? 0;

        fixArea.innerHTML = `
    <div class="ea-fix-score-card">

        <div class="ea-fix-score-top">

            <div class="ea-fix-score-title">
                🫧 Erişilebilirlik Durumu
            </div>

            <div class="ea-fix-percent">
                %${score}
            </div>
        </div>

        <div class="ea-fix-progress">

            <div
                class="ea-fix-progress-fill"
                style="width:${score}%">
            </div>
        </div>


    </div>
`;
      }

      this.updateBehaviorPanel();
      this.renderFindings();
    }

    // Denetim düzeltme butonları event delegation ile yönetiliyor.

    this.renderModes();
    if (this.heatmapVisible) this.drawHeatmap();

    shadow
      .querySelectorAll("[data-profile]")
      .forEach((btn) =>
        btn.classList.toggle(
          "active",
          EAApp.state.activeProfile === btn.dataset.profile,
        ),
      );
    // PROFİL KARTINI GÜNCELLE
    if (EAApp.state.userProfile && EAApp.state.userProfile.preferences) {
      const prefs = EAApp.state.userProfile.preferences;
      const updateEl = (id, val) => {
        const el = shadow.getElementById(id);
        if (el) {
          el.innerText = (val || 1).toFixed(2) + "x";
          el.style.color =
            val > 1.0 ? "#6f78bd" : val < 1.0 ? "#f59e0b" : "#0284c7";
        }
      };
      updateEl("prof-vision", prefs.vision);
      updateEl("prof-hearing", prefs.hearing);
      updateEl("prof-cognitive", prefs.cognitive);
      updateEl("prof-motor", prefs.motor);
    }
  },

  renderModes: function () {
    const modes = [
      ["autoAlt", "Oto Alt Metin", "autoAlt", "boolean", "__AUTO_ALT_ICON__"],
      ["hlLinks", "Link Vurgula", "hlLinks", "boolean", "🔗"],
      ["kbd", "Klavye Desteği", "keyboard", "boolean", "⌨️"],
      ["dark", "Karanlık Mod", "dark", "boolean", "🌙"],
      ["head", "Başlıklar", "head", "boolean", "🏷️"],
      ["reader", "Ekran Okuyucu", "reader", "boolean", "🔊"],
      ["alt", "Alt Metin Yaz", "altText", "boolean", "📝"],
      ["mute", "Sesi Kapat", "mute", "boolean", "🔇"],
      ["blue", "Mavi Filtre", "blue", "boolean", "🔵"],
      ["img", "Görselleri Gizle", "img", "boolean", "🖼️"],
      ["anim", "Animasyonu Durdur", "anim", "boolean", "🚫"],
      ["guide", "Okuma Rehberi", "guide", 4, "🎯"],
      ["target", "Büyük Hedef", "largeTargets", "boolean", "🔘"],
      ["dist", "Reklamları Gizle", "suppressDistractions", "boolean", "🚫"],
      ["zoom", "Yakınlaştır", "zoom", 4, "🔍"],
      ["lh", "Satır Boyu", "lh", 4, "↕️"],
      ["space", "Metin Boşluğu", "space", 4, "↔️"],
      ["align", "Metin Hizalama", "align", 5, "↔️"],
      ["font", "Disleksi Fontu", "font", 3, "🅰️"],
      ["contrast", "Kontrast", "contrast", 4, "🌗"],
      ["sat", "Doygunluk", "sat", 4, "🎨"],
      ["cb", "Renk Körlüğü", "cb", 5, "👁️"],
      ["pageGuide", "Sayfa Haritası", "pageGuide", "boolean", "🗺️"],
    ];
    const container = EAApp.dom.shadow.getElementById("modeButtons");
    if (container) {
      container.innerHTML = modes
        .map(([id, title, key, type, emoji]) => {
          const rawVal = key === "pageGuide" && window.EAGuide ? EAGuide.isOpen : EAApp.state[key];
          const val = typeof rawVal === "undefined" ? (type === "boolean" ? false : 0) : rawVal;
          const active = type === "boolean" ? Boolean(val) : val > 0;
          
          // Seviye 1/2 yerine kullanıcının göreceği gerçek işlev adını göster.
          let subText = "";
          const levelLabels = {
              guide: ["Kapalı", "Büyük İmleç", "Okuma Çizgisi", "Okuma Maskesi"],
              zoom: ["Normal", "Hafif büyüt", "Orta büyüt", "Yüksek büyüt"],
              lh: ["Normal", "Geniş satır", "Daha geniş", "Çok geniş"],
              space: ["Normal", "Hafif boşluk", "Orta boşluk", "Geniş boşluk"],
              align: ["Normal", "Sola dayalı", "Ortalanmış", "Sağa dayalı", "İki yana yaslı"],
              font: ["Normal", "Disleksi fontu", "Sade font"],
              contrast: ["Normal", "Ters renk", "Gece kontrastı", "Yüksek kontrast"],
              sat: ["Normal", "Düşük doygunluk", "Yüksek doygunluk", "Gri tonlama"],
              cb: ["Normal", "Protanopi", "Döteranopi", "Tritanopi", "Monokrom"]
          };

          if (type === "boolean") {
              subText = active ? "Açık" : "Kapalı";
          } else if (levelLabels[key]) {
              subText = levelLabels[key][val] || levelLabels[key][0];
          } else {
              subText = val === 0 ? "Normal" : "Kademe " + val;
          }

          const iconHTML = emoji === "__AUTO_ALT_ICON__"
            ? `<span class="ea-auto-alt-icon" aria-hidden="true"><span class="ea-auto-alt-photo"></span><span class="ea-auto-alt-text">ALT</span></span>`
            : `<span class="emoji" style="font-size:22px;">${emoji}</span>`;

          return `<button class="btn-mode ${active ? "active" : ""}" data-state="${key}" data-max="${type === "boolean" ? 0 : type}">${iconHTML}<b>${title}</b><span class="sub-label">${subText}</span></button>`;
        })
        .join("");

      // Mod butonları dinamik üretildiği için tıklama olayları burada bağlanmalı.
      container.querySelectorAll(".btn-mode").forEach((btn) => {
        btn.onclick = () => {
          const key = btn.dataset.state;
          const max = Number(btn.dataset.max || 0);

          if (key === "pageGuide") {
            const next = !(window.EAGuide && EAGuide.isOpen);
            EAApp.state.pageGuide = next;
            EAApp.saveState();
            if (window.EAGuide) EAGuide.toggle(next);
            this.renderModes();
            return;
          }

          EAApp.toggleState(key, max || 2);
        };
      });
    }
    const aiConditionInput =
      EAApp.dom.shadow.getElementById("aiConditionInput");
    const aiConditionResult =
      EAApp.dom.shadow.getElementById("aiConditionResult");

    // 1. Textbox'taki eski metni yerine koy
    if (aiConditionInput && EAApp.state.aiConditionText) {
      aiConditionInput.value = EAApp.state.aiConditionText;
    }

    // 2. Eğer öneri dizisi varsa ekrana yeşil rozetleri çiz
    if (
      aiConditionResult &&
      EAApp.state.aiConditionRecommendations &&
      EAApp.state.aiConditionRecommendations.length > 0
    ) {
      const modeNames = {
        autoAlt: "▧ ALT Oto Alt Metin",
        hlLinks: "🔗 Link Vurgula",
        keyboard: "⌨️ Klavye Desteği",
        dark: "🌙 Karanlık Mod",
        head: "🏷️ Başlıklar",
        reader: "🔊 Ekran Okuyucu",
        altText: "📝 Alt Metin Yaz",
        mute: "🔇 Sesi Kapat",
        blue: "🔵 Mavi Filtre",
        img: "🖼️ Görselleri Gizle",
        anim: "🚫 Animasyonu Durdur",
          focusAssist: "🎯 Odak Yardımı",
        largeTargets: "🔘 Büyük Hedef",
        suppressDistractions: "🚫 Reklamları Gizle",
        zoom: "🔍 Yakınlaştır",
        lh: "↕️ Satır Boyu",
        space: "↔️ Metin Boşluğu",
        align: "↔️ Metin Hizalama",
        font: "🅰️ Disleksi Fontu",
        contrast: "🌗 Kontrast",
        sat: "🎨 Doygunluk",
        cb: "👁️ Genel Renk Körlüğü Filtresi",
        pageGuide: "🗺️ Sayfa Haritası",
      };

      const recommendedHTML = EAApp.state.aiConditionRecommendations
        .map((k) => {
          const name = modeNames[k] || k;
          return `<span style="display:inline-block; background:rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); padding:4px 8px; border-radius:6px; margin: 3px;">${name}</span>`;
        })
        .join("");

      aiConditionResult.style.display = "block";
      aiConditionResult.innerHTML = `<strong>💡 Yapay Zeka Önerileri:</strong><br><span style="opacity:0.8; font-size:10px;">Durumunuz için aşağıdaki özellikler önerildi/açıldı:</span><br><br>${recommendedHTML}`;
    } else if (aiConditionResult) {
      aiConditionResult.style.display = "none";
    }
  },

  getFindingMeta: function (finding) {
    const title = (finding?.title || "").toLowerCase();
    const type = finding?.type || "";
    const group = finding?.group || "general";

    let severity = "ℹ️ Düşük";
    let sevClass = "low";
    let wcag = "Genel denetim";
    let dimension = "Genel";

    if (group === "vision") dimension = "Görsel";
    if (group === "motor") dimension = "Motor";
    if (group === "cognitive") dimension = "Bilişsel";
    if (group === "hearing") dimension = "İşitsel";
    if (group === "form" || group === "semantic" || group === "screenreader") dimension = "Semantik";

    if (title.includes("alt") || title.includes("görsel")) {
      wcag = "WCAG 1.1.1 Non-text Content";
      severity = "🚨 Kritik";
      sevClass = "critical";
    } else if (title.includes("form") || title.includes("aria") || type === "missing-form-label") {
      wcag = "WCAG 2.4.6 / 3.3.2 Labels";
      severity = "🚨 Kritik";
      sevClass = "critical";
    } else if (title.includes("klavye")) {
      wcag = "WCAG 2.1.1 Keyboard";
      severity = "🚨 Kritik";
      sevClass = "critical";
    } else if (title.includes("küçük")) {
      wcag = "WCAG 2.5.5 Target Size";
      severity = "🚨 Kritik";
      sevClass = "critical";
    } else if (title.includes("focus") || title.includes("odak")) {
      wcag = "WCAG 2.4.7 Focus Visible";
      severity = "⚠️ Orta";
      sevClass = "medium";
    } else if (title.includes("kontrast")) {
      wcag = "WCAG 1.4.3 Contrast";
      severity = "⚠️ Orta";
      sevClass = "medium";
    } else if (title.includes("başlık") || title.includes("semantik")) {
      wcag = "WCAG 1.3.1 / 2.4.6";
      severity = "⚠️ Orta";
      sevClass = "medium";
    } else if (title.includes("uzun") || group === "cognitive") {
      wcag = "Bilişsel yük göstergesi";
      severity = "ℹ️ Düşük";
      sevClass = "low";
    }

    return { severity, sevClass, wcag, dimension };
  },

  renderAuditOverview: function (audit) {
    const shadow = EAApp.dom.shadow;
    const area = shadow && shadow.getElementById("auditOverview");
    if (!area || !audit || !audit.scores) return;

    const summary = audit.criteriaSummary || {
      total: 10,
      passed: 0,
      failed: 0,
      notApplicable: 0
    };

    area.innerHTML = `
      <div class="audit-overview-card">
        <div class="audit-overview-title">📋 Denetim Özeti</div>
        <div class="audit-overview-grid">
          <div class="audit-chip">Genel skor<b>${audit.scores.general}</b></div>
          <div class="audit-chip">Başarılı kriter<b>${summary.passed}</b></div>
          <div class="audit-chip">Sorunlu kriter<b>${summary.failed}</b></div>
          <div class="audit-chip">Öğe bulunmayan<b>${summary.notApplicable}</b></div>
        </div>
      </div>`;
  },

  createHeatmapPalette: function () {
    if (this.__heatmapPalette) return this.__heatmapPalette;

    const palette = new Uint8ClampedArray(256 * 4);
    const stops = [
      { at: 0.00, color: [30, 64, 175] },   // mavi
      { at: 0.24, color: [34, 197, 94] },   // yeşil
      { at: 0.52, color: [250, 204, 21] },  // sarı
      { at: 0.74, color: [249, 115, 22] },  // turuncu
      { at: 1.00, color: [220, 38, 38] }    // kırmızı
    ];

    for (let i = 0; i < 256; i++) {
      const value = i / 255;
      let left = stops[0];
      let right = stops[stops.length - 1];

      for (let s = 0; s < stops.length - 1; s++) {
        if (value >= stops[s].at && value <= stops[s + 1].at) {
          left = stops[s];
          right = stops[s + 1];
          break;
        }
      }

      const span = Math.max(0.0001, right.at - left.at);
      const local = Math.max(0, Math.min(1, (value - left.at) / span));

      palette[i * 4] = Math.round(
        left.color[0] + (right.color[0] - left.color[0]) * local
      );
      palette[i * 4 + 1] = Math.round(
        left.color[1] + (right.color[1] - left.color[1]) * local
      );
      palette[i * 4 + 2] = Math.round(
        left.color[2] + (right.color[2] - left.color[2]) * local
      );
      palette[i * 4 + 3] = 255;
    }

    this.__heatmapPalette = palette;
    return palette;
  },

  scheduleHeatmapRedraw: function (options = {}) {
    if (!this.heatmapVisible) return;

    clearTimeout(this.__heatmapRedrawTimer);
    this.__heatmapRedrawTimer = setTimeout(() => {
      if (!this.heatmapVisible) return;

      if (options.refreshAudit && window.EAAudit) {
        EAAudit.refresh();
      }

      this.drawHeatmap();
    }, options.delay ?? 120);
  },

  initHeatmapLiveUpdates: function () {
    if (this.__heatmapLiveUpdatesReady) return;
    this.__heatmapLiveUpdatesReady = true;

    window.addEventListener(
      "resize",
      () => this.scheduleHeatmapRedraw({ delay: 120 }),
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      () => this.scheduleHeatmapRedraw({ delay: 90 }),
      { passive: true }
    );

    if (window.MutationObserver && document.body) {
      this.__heatmapMutationObserver = new MutationObserver((mutations) => {
        if (!this.heatmapVisible) return;

        const relevant = mutations.some((mutation) => {
          const target = mutation.target;
          if (!target) return false;
          if (EAApp.dom?.root && EAApp.dom.root.contains(target)) return false;
          if (target.id === "ea-heatmap-canvas") return false;

          return (
            mutation.type === "childList" ||
            mutation.type === "attributes"
          );
        });

        if (relevant) {
          this.scheduleHeatmapRedraw({
            refreshAudit: true,
            delay: 420
          });
        }
      });

      this.__heatmapMutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "hidden",
          "aria-hidden",
          "src"
        ]
      });
    }
  },

  drawHeatmap: function () {
    const canvas = document.getElementById("ea-heatmap-canvas");
    if (!canvas || !window.EAAudit) return;

    const width = Math.max(
      window.innerWidth || 0,
      document.documentElement.clientWidth || 0
    );
    const height = Math.max(
      window.innerHeight || 0,
      document.documentElement.clientHeight || 0
    );

    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const outputCtx = canvas.getContext("2d", {
      alpha: true,
      willReadFrequently: false
    });

    outputCtx.clearRect(0, 0, width, height);

    const hotspots = EAAudit.generateHeatmapData();
    const shadow = EAApp.dom.shadow;
    const info = shadow && shadow.getElementById("heatmapInfo");

    if (!hotspots.length) {
      if (info) {
        info.style.display = this.heatmapVisible ? "block" : "none";
        info.innerHTML = `
          <strong>Risk ve Zorluk Haritası aktif.</strong><br>
          Görünür alanda haritalandırılabilecek erişilebilirlik yoğunluğu bulunamadı.
        `;
      }
      return;
    }

    /*
     * İki aşamalı piksel işleme:
     * 1) Yoğunluk canvasa radyal alfa değerleri çizilir.
     * 2) Her pikselin alfa yoğunluğu 256x1 mavi-yeşil-sarı-turuncu-kırmızı
     *    renk paletiyle eşleştirilir.
     */
    const densityCanvas = document.createElement("canvas");
    densityCanvas.width = width;
    densityCanvas.height = height;

    const densityCtx = densityCanvas.getContext("2d", {
      alpha: true,
      willReadFrequently: true
    });

    densityCtx.clearRect(0, 0, width, height);
    densityCtx.globalCompositeOperation = "lighter";

    hotspots.forEach((hotspot) => {
      const risk = Math.max(0, Math.min(1, hotspot.totalRisk || 0));
      const radius = Math.max(30, hotspot.radius || 70);

      const centerAlpha = Math.max(
        0.08,
        Math.min(0.88, 0.14 + risk * 0.72)
      );

      const gradient = densityCtx.createRadialGradient(
        hotspot.x,
        hotspot.y,
        0,
        hotspot.x,
        hotspot.y,
        radius
      );

      gradient.addColorStop(0, `rgba(255,255,255,${centerAlpha})`);
      gradient.addColorStop(
        0.36,
        `rgba(255,255,255,${centerAlpha * 0.66})`
      );
      gradient.addColorStop(
        0.72,
        `rgba(255,255,255,${centerAlpha * 0.24})`
      );
      gradient.addColorStop(1, "rgba(255,255,255,0)");

      densityCtx.fillStyle = gradient;
      densityCtx.beginPath();
      densityCtx.arc(
        hotspot.x,
        hotspot.y,
        radius,
        0,
        Math.PI * 2
      );
      densityCtx.fill();
    });

    const densityImage = densityCtx.getImageData(0, 0, width, height);
    const outputImage = outputCtx.createImageData(width, height);
    const palette = this.createHeatmapPalette();

    for (let i = 0; i < densityImage.data.length; i += 4) {
      const alpha = densityImage.data[i + 3];

      if (alpha < 5) {
        outputImage.data[i + 3] = 0;
        continue;
      }

      // Düşük alfa değerlerini tamamen kaybetmeden termal skalaya yay.
      const normalized = Math.max(
        0,
        Math.min(1, Math.pow(alpha / 255, 0.72))
      );
      const paletteIndex = Math.min(
        255,
        Math.max(0, Math.round(normalized * 255))
      );
      const paletteOffset = paletteIndex * 4;

      outputImage.data[i] = palette[paletteOffset];
      outputImage.data[i + 1] = palette[paletteOffset + 1];
      outputImage.data[i + 2] = palette[paletteOffset + 2];

      // Yoğunluk arttıkça opaklık yükselir.
      outputImage.data[i + 3] = Math.round(
        Math.min(220, 20 + normalized * 205)
      );
    }

    outputCtx.putImageData(outputImage, 0, 0);

    const high = hotspots.filter((item) => item.level === "high").length;
    const medium = hotspots.filter((item) => item.level === "medium").length;
    const low = hotspots.filter((item) => item.level === "low").length;
    const behaviorCount = hotspots.filter(
      (item) => item.behaviorRisk > 0.08
    ).length;

    if (info) {
      info.style.display = this.heatmapVisible ? "block" : "none";
      info.innerHTML = `
        <strong>Risk ve Zorluk Haritası aktif.</strong><br>
        Harita; problem türünün ağırlığını, DOM konumunu ve davranışsal sinyalleri birlikte değerlendirir.
        Reklam/sponsor alanları hesaba katılmaz.<br>
        <div class="ea-heatmap-legend" aria-label="Risk renk skalası">
          <span>Mavi</span>
          <div class="ea-heatmap-legend-bar"></div>
          <span>Kırmızı</span>
        </div>
        
      `;
    }
  },

  renderFindings: function () {
    const fArea = EAApp.dom.shadow.getElementById("findings");
    if (!fArea || !window.EAAudit) return;

    const escapeHTML = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const criteria = Array.isArray(EAApp.audit?.criteria) ? EAApp.audit.criteria : [];
    const criteriaDimensionNames = {
      vision: "Görsel",
      cognitive: "Bilişsel",
      motor: "Motor",
      hearing: "İşitsel"
    };
    const criteriaWCAG = {
      "alt-text": "WCAG 1.1.1 Non-text Content",
      contrast: "WCAG 1.4.3 Contrast",
      "accessible-names": "WCAG 1.3.1 / 4.1.2",
      "heading-hierarchy": "WCAG 1.3.1 / 2.4.6",
      "semantic-landmarks": "WCAG 1.3.1 / 2.4.1",
      "small-targets": "WCAG 2.5.5 Target Size",
      "keyboard-access": "WCAG 2.1.1 Keyboard",
      "focus-order": "WCAG 2.4.3 Focus Order",
      "focus-indicator": "WCAG 2.4.7 Focus Visible",
      captions: "WCAG 1.2.2 / 1.4.2"
    };

    // Sorunlu kriterler mevcut finding kartlarıyla üstte kalır.
    // Sorun bulunmayan kriterler aynı kart tasarımıyla listenin en altında gösterilir.
    const successfulCriteriaHTML = criteria
      .map((criterion, criterionIndex) => ({ criterion, criterionIndex }))
      .filter(({ criterion }) => criterion.status === "pass")
      .sort((a, b) => a.criterionIndex - b.criterionIndex)
      .map(({ criterion, criterionIndex }) => {
        const cardClass = "success";
        const statusText = "✓ Sorun yok";
        const dimension = criteriaDimensionNames[criterion.dimension] || criterion.dimension || "Genel";
        const wcag = criteriaWCAG[criterion.id] || "WCAG kontrolü";
        const itemCount = Number.isFinite(Number(criterion.total)) ? Number(criterion.total) : 0;

        return `
          <div class="finding ${cardClass}">
            <div class="finding-severity">${statusText}</div>
            <h4>${criterionIndex + 1}. ${escapeHTML(criterion.title)}</h4>
            <div class="finding-tags">
              <span>${escapeHTML(dimension)}</span>
              <span>${escapeHTML(wcag)}</span>
              <span>${itemCount} öğe</span>
            </div>
            <p>${escapeHTML(criterion.message)}</p>
          </div>`;
      })
      .join("");

    const labelResultGroups = Object.values(EAAudit.formLabelFixResults || {});
    const labelResultItems = labelResultGroups.flatMap((group) => group.items || []);
    const labelResultsHTML = labelResultItems.length
      ? `<div class="ea-alt-results-card" style="border-color:#bfdbfe; background:linear-gradient(135deg,#eff6ff,#f8fafc);">
          <div class="ea-alt-results-head">
            <strong style="color:#1e3a8a;">✅ Uygulanan Form Etiketleri</strong>
            <button type="button" class="ea-label-results-clear">Temizle</button>
          </div>
          <div style="font-size:10px; color:#64748b; line-height:1.4;">
            Etiketler alanların <code>aria-label</code> niteliğine yazılır ve ekran okuyucular tarafından okunur. Aşağıdaki düğmelerle ilgili alana gidebilirsin.
          </div>
          ${labelResultItems.map((item, resultIndex) => `
            <div class="ea-alt-result-item" style="border-color:#dbeafe;">
              <div class="ea-alt-result-text">${resultIndex + 1}. ${escapeHTML(item.label)}</div>
              <div class="ea-alt-result-meta">
                <span>${String(item.source || "").startsWith("openrouter") ? "🤖 OpenRouter AI" : "🧩 Yerel bağlam"}</span>
                <button type="button" class="ea-label-result-jump" data-label-result-id="${escapeHTML(item.id)}">Alana Git</button>
              </div>
            </div>`).join("")}
        </div>`
      : "";

    const altResultGroups = Object.values(EAAudit.altFixResults || {});
    const altResultItems = altResultGroups.flatMap((group) => group.items || []);
    const altResultsHTML = altResultItems.length
      ? `<div class="ea-alt-results-card">
          <div class="ea-alt-results-head">
            <strong>✅ Üretilen Görsel Açıklamaları</strong>
            <button type="button" class="ea-alt-results-clear">Temizle</button>
          </div>
          <div style="font-size:10px; color:#64748b; line-height:1.4;">
            Alt metin ekran okuyucular tarafından okunur; normalde sayfada görünmez. Aşağıda üretilen metinleri görebilir ve ilgili görsele gidebilirsin.
          </div>
          ${altResultItems.map((item, resultIndex) => `
            <div class="ea-alt-result-item">
              <div class="ea-alt-result-text">${resultIndex + 1}. ${escapeHTML(item.text)}</div>
              <div class="ea-alt-result-meta">
                <span>${String(item.source || "").startsWith("openrouter") ? "🤖 OpenRouter AI" : "🧩 Yerel bağlam"}</span>
                <button type="button" class="ea-alt-result-jump" data-alt-result-id="${escapeHTML(item.id)}">Görsele Git</button>
              </div>
            </div>`).join("")}
        </div>`
      : "";

    const findingsHTML = EAAudit.findings.length
      ? EAAudit.findings
          .map((f, i) => {
            const meta = this.getFindingMeta(f);
            const severity = meta.severity;
            const sevClass = meta.sevClass;
            const noteKey = f.type || f.title;
            const fixNote = EAApp.state.auditFixNotes && EAApp.state.auditFixNotes[noteKey]
              ? `<div class="ea-fix-note">ℹ️ ${EAApp.state.auditFixNotes[noteKey]}</div>`
              : "";

            return `
    <div class="finding ${sevClass}">
        <div class="finding-severity">${severity}</div>
        <h4>${i + 1}. ${f.title}</h4>
        <div class="finding-tags"><span>${meta.dimension}</span><span>${meta.wcag}</span><span>${f.nodes ? f.nodes.length : 1} öğe</span></div>
        <p>${f.detail}</p>
${
  (!f.nodes || f.nodes.length === 0)
    ? `<div style="margin-top:10px; padding:9px 10px; border-radius:10px; background:#f8fafc; border:1px dashed #cbd5e1; color:#475569; font-size:11px;">Bu bulgu yapısal öneri niteliğindedir; kod tarafında manuel kontrol edilmelidir.</div>`
    : f.type === "missing-form-label"
    ? `<button
                type="button"
                class="ea-ai-fix-btn"
                data-fix="label"
                data-index="${i}">
                ✨ AI ile Form Etiketi Üret
           </button>`
    : (f.title.includes("Alt") && !f.title.includes("Altyaz")) ||
        f.title.includes("Görsel")
      ? `<button
                type="button"
                class="ea-ai-fix-btn"
                data-fix="alt"
                data-index="${i}">
                🤖 AI Açıklama Üret
           </button>`
      : f.title.includes("Altyaz")
        ? `<button
                type="button"
                class="ea-individual-fix-btn"
                style="margin-top:10px; border:none; background:#6f78bd; color:white; padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600; width:100%; transition:0.2s;"
                data-index="${i}">
                Altyazı Oluştur
           </button>`
        : `<button
                type="button"
                class="ea-individual-fix-btn"
                style="margin-top:10px; border:none; background:#6f78bd; color:white; padding:10px 14px; border-radius:10px; cursor:pointer; font-weight:600; width:100%; transition:0.2s;"
                data-index="${i}">
                ✨ Bunu Çöz
           </button>`
}
${fixNote}
    </div>
`;
          })
          .join("")
      : `<p style="text-align:center; padding:14px; color:#64748b;">✓ Erişilebilirlik sorunu bulunamadı.</p>`;

    fArea.innerHTML = labelResultsHTML + altResultsHTML + findingsHTML + successfulCriteriaHTML;
  },

  announce: function (m) {
    const live = document.getElementById("ea-live-region");
    if (live) live.textContent = m;
  },
};
