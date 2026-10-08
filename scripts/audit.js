window.EAAudit = {
    findings: [],
    lastClicks: [],
    mouseMovements: [], // Mouse Jitter için
    behaviorData: {
        scrollPoints: [],
        focusNodes: [],
        disorientationScore: 0,
        jitterIntensity: 0
    },

    // OEK-4 skor oturumu yalnızca işlem akışı için tutulur.
    // Yayınlanan skor her denetimde güncel DOM ve davranış verilerinden
    // deterministik olarak yeniden hesaplanır.
    scoreSession: {
        pageKey: "",
        baselineMetrics: {},
        bestRatios: {},
        interventionStarted: false,
        publishedScores: null,
        rawScores: null
    },

    scoreConfig: {
        categoryWeights: {
            vision: 0.30,
            hearing: 0.20,
            cognitive: 0.25,
            motor: 0.25
        },
        metricWeights: {
            vision: {
                missingAlt: 0.40,
                lowContrast: 0.35,
                accessibleName: 0.25
            },
            cognitive: {
                longParagraph: 0.20,
                headingHierarchy: 0.25,
                semanticLandmark: 0.20,
                disorientation: 0.35
            },
            motor: {
                smallTarget: 0.30,
                keyboardAccess: 0.30,
                focusOrder: 0.15,
                focusIndicator: 0.25
            },
            hearing: {
                inaccessibleMedia: 1.00
            }
        }
    },

    init: function () {
        // HER YENİ SAYFA YÜKLENDİĞİNDE SAYAÇLARI VE DAVRANIŞSAL OTURUMU SIFIRLIYORUZ
        EAApp.state.initialFindingCount = 0;
        EAApp.state.currentIssueCount = 0;
        EAApp.state.aiBehaviorAnalysis = "";
        EAApp.state.aiBehaviorRecommendedProfile = "";
        EAApp.state.behaviorPopupShown = false;
        EAApp.state.behaviorAutoApplied = {};
        EAApp.saveState();

        this.lastClicks = [];
        this.mouseMovements = [];
        this.behaviorData = {
            scrollPoints: [],
            focusNodes: [],
            disorientationScore: 0,
            jitterIntensity: 0,
            lastNonStableSignal: null
        };
        this.__behaviorUiTimer = 0;
        this.resetScoreSession();

        this.observeBehavior();
        this.initAuditLiveUpdates();
        this.scheduleAuditRefresh(250);
        this.scheduleAuditRefresh(1200);
        this.scheduleAuditRefresh(2600);
    },

    scheduleAuditRefresh: function (delay = 500) {
        clearTimeout(this.__auditRefreshTimer);
        this.__auditRefreshTimer = setTimeout(() => {
            try {
                this.refresh();
                if (window.EAUI) {
                    EAUI.updateButtons();
                    EAUI.renderFindings();
                }
            } catch (error) {
                console.warn("Denetim yenilenemedi:", error);
            }
        }, delay);
    },

    initAuditLiveUpdates: function () {
        if (this.__auditLiveUpdatesReady) return;
        this.__auditLiveUpdatesReady = true;

        const attachIframeLoad = (iframe) => {
            if (!iframe || iframe.__eaAuditLoadBound) return;
            iframe.__eaAuditLoadBound = true;
            iframe.addEventListener("load", () => this.scheduleAuditRefresh(450));
        };

        document.querySelectorAll("iframe").forEach(attachIframeLoad);
        window.addEventListener("load", () => this.scheduleAuditRefresh(350), { once: true });

        if (!window.MutationObserver || !document.body) return;

        this.__auditMutationObserver = new MutationObserver((mutations) => {
            let relevant = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes || []) {
                    if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
                    if (this.isAssistantNode && this.isAssistantNode(node)) continue;

                    if (node.matches?.("iframe")) attachIframeLoad(node);
                    node.querySelectorAll?.("iframe").forEach(attachIframeLoad);

                    if (
                        node.matches?.("form,input,textarea,select,img,video,a,button,[role='button'],[tabindex],h1,h2,h3,h4,h5,h6,main,nav") ||
                        node.querySelector?.("form,input,textarea,select,img,video,a,button,[role='button'],[tabindex],h1,h2,h3,h4,h5,h6,main,nav")
                    ) {
                        relevant = true;
                    }
                }
            }

            if (relevant && !this.scoreSession.interventionStarted) {
                this.scheduleAuditRefresh(700);
            }
        });

        this.__auditMutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

   isMeaningfulImage: function(img) {

    if (!img) return false;

    const style =
        window.getComputedStyle(img);

    const bg =
        style.backgroundImage || "";

    const hasBgImage =
        bg !== "none" &&
        bg.includes("url(");

    const isImg =
        img.tagName === "IMG";

    // gerçek image source
    const src = (
        img.src ||
        bg
    ).toLowerCase();

    // boyut
    const width =
        img.naturalWidth ||
        img.width ||
        img.offsetWidth ||
        img.clientWidth ||
        0;

    const height =
        img.naturalHeight ||
        img.height ||
        img.offsetHeight ||
        img.clientHeight ||
        0;

    // hidden
    if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
    ) {
        return false;
    }

    // gerçek image değil
    if (
        !isImg &&
        !hasBgImage
    ) {
        return false;
    }

    // tiny
    if (
        width < 80 ||
        height < 80
    ) {
        return false;
    }

    // decorative/icon
    const cls =
        (
            img.className || ""
        ).toLowerCase();

    const decorativeWords = [

        "icon",
        "logo",
        "emoji",
        "avatar",
        "sprite",
        "ads",
        "banner"
    ];

    if (
        decorativeWords.some(word =>
            cls.includes(word)
        )
    ) {
        return false;
    }

    // svg/icon assets
    if (
        src.includes(".svg") ||
        src.includes("icon") ||
        src.includes("logo")
    ) {
        return false;
    }

    // semantic containers
    if (
        img.closest(`
            article,
            figure,
            main,
            section,
            a
        `)
    ) {
        return true;
    }

    // büyük background image
    if (
        hasBgImage &&
        width > 150 &&
        height > 150
    ) {
        return true;
    }

    return false;
},
    aiFixAlt: async function (index, options = {}) {
        const requestedFinding = this.findings[index];
        this.refresh();
        this.beginScoreIntervention();
        const finding = requestedFinding
            ? (this.findings.find(item =>
                (item.type && item.type === requestedFinding.type) ||
                item.title === requestedFinding.title
              ) || requestedFinding)
            : this.findings[index];
        if (!finding || !Array.isArray(finding.nodes) || !finding.nodes.length) {
            alert("Düzeltilecek görsel bulgusu bulunamadı.");
            return { fixed: 0, skipped: 0, failed: 0 };
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let decorativeCount = 0;
        let aiCount = 0;
        let localFallbackCount = 0;
        let aiPromptShown = false;
        const resultItems = [];
        const resultKey = finding.type || finding.title || `visual-${index}`;

        const applyDescription = (element, description, source) => {
            const text = EAAI.cleanAltTextResult(description);
            if (!text) return null;

            const resultId = element.getAttribute("data-ea-alt-result-id") ||
                `ea-alt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            if (element.tagName === "IMG") {
                element.setAttribute("alt", text);
            } else {
                if (!element.getAttribute("role")) {
                    element.setAttribute("role", "img");
                }
                element.setAttribute("aria-label", text);
            }

            element.setAttribute("data-ea-alt-source", source);
            element.setAttribute("data-ea-alt-result-id", resultId);
            element.setAttribute("data-ea-alt-preview", text);

            // Alt metin görsel olarak görünmez. Test eden kullanıcı açıklamayı
            // fareyle üzerine geldiğinde de görebilsin.
            const currentTitle = (element.getAttribute("title") || "").trim();
            if (!currentTitle || currentTitle.startsWith("Erişilebilirlik açıklaması:")) {
                element.setAttribute("title", `Erişilebilirlik açıklaması: ${text}`);
            }

            element.style.setProperty("outline", "3px solid #10b981", "important");
            element.style.setProperty("outline-offset", "2px", "important");

            const visualSource = EAAI.getVisualSource(element);
            return {
                id: resultId,
                text,
                source,
                tag: element.tagName || "GÖRSEL",
                visualSource: visualSource ? visualSource.substring(0, 160) : ""
            };
        };

        if (options.forceAI && !EAApp.state.apiKey) {
            if (!EAAI.ensureKey()) {
                alert("OpenRouter API anahtarı girilmedi. Görsel açıklaması uygulanmadı.");
                return { fixed: 0, skipped: finding.nodes.length, failed: 0 };
            }
            aiPromptShown = true;
        }

        console.group(`🎨 [Erişilebilirlik] Görsel Denetimi: ${finding.nodes.length} öğe`);

        for (const element of finding.nodes) {
            try {
                if (!element || element.nodeType !== Node.ELEMENT_NODE) {
                    skippedCount++;
                    continue;
                }

                const visualSource = EAAI.getVisualSource(element).toLowerCase();
                const width = Number(element.naturalWidth || element.offsetWidth || element.clientWidth || 0);
                const height = Number(element.naturalHeight || element.offsetHeight || element.clientHeight || 0);
                const tiny = width > 0 && height > 0 && width < 60 && height < 60;
                const placeholder = visualSource.includes("placeholder") || visualSource.includes("spacer");

                if (!this.isMeaningfulImage(element) || tiny || placeholder) {
                    if (element.tagName === "IMG") {
                        element.setAttribute("alt", "");
                        element.setAttribute("data-ea-alt-source", "decorative");
                        decorativeCount++;
                        successCount++;
                    } else {
                        skippedCount++;
                    }
                    continue;
                }

                let description = EAAI.generateLocalAlt(element);
                let source = EAAI.cleanAltTextResult(description) ? "local-context" : "none";
                const localValid = source !== "none";

                if (!localValid || options.forceAI) {
                    if (!EAApp.state.apiKey && !aiPromptShown) {
                        aiPromptShown = true;
                        if (!EAAI.ensureKey()) {
                            skippedCount++;
                            continue;
                        }
                    }

                    if (EAApp.state.apiKey) {
                        const aiDescription = await EAAI.generateAltText(element);
                        const cleanAI = EAAI.cleanAltTextResult(aiDescription);

                        if (cleanAI) {
                            description = cleanAI;
                            source = EAAI.lastAltTextSource || "openrouter-free";
                        } else if (!localValid) {
                            skippedCount++;
                            continue;
                        }
                    } else if (!localValid) {
                        skippedCount++;
                        continue;
                    }
                }

                const appliedResult = applyDescription(element, description, source);
                if (appliedResult) {
                    successCount++;
                    resultItems.push(appliedResult);
                    if (String(source).startsWith("openrouter")) aiCount++;
                    if (source === "local-fallback" || source === "local-context") localFallbackCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                console.warn("Görsel açıklaması uygulanamadı; öğe atlandı:", element, error);
                errorCount++;
            }
        }

        console.groupEnd();

        const parts = [];
        if (successCount > 0) parts.push(`✅ ${successCount} görsel için erişilebilirlik açıklaması uygulandı.`);
        if (aiCount > 0) parts.push(`🤖 ${aiCount} açıklama OpenRouter ücretsiz modeliyle üretildi.`);
        if (localFallbackCount > 0) parts.push(`🧩 ${localFallbackCount} açıklama sayfa bağlamından güvenli yedek olarak oluşturuldu.`);
        if (decorativeCount > 0) parts.push(`ℹ️ ${decorativeCount} dekoratif görsel boş alt metinle işaretlendi.`);
        if (skippedCount > 0) parts.push(`⚠️ ${skippedCount} görsel için güvenilir açıklama bulunamadı; değişiklik yapılmadı.`);
        if (errorCount > 0) parts.push(`⚠️ ${errorCount} görsel teknik nedenle atlandı.`);

        if (EAAI.isOpenRouterCreditError(EAAI.lastAltTextError)) {
            parts.push("ℹ️ OpenRouter hesabında ücretli kredi yok. Sistem ücretsiz model ve yerel yedekle devam etti.");
        } else if (EAAI.isOpenRouterRateLimitError(EAAI.lastAltTextError)) {
            parts.push("ℹ️ Ücretsiz OpenRouter kotası dolmuş olabilir; yerel yedek kullanıldı.");
        }

        this.altFixResults = this.altFixResults || {};
        if (resultItems.length > 0) {
            this.altFixResults[resultKey] = {
                title: finding.title || "Görsel açıklamaları",
                createdAt: Date.now(),
                items: resultItems
            };
        }

        const summaryMessage = parts.join("\n") || "Düzeltme uygulanamadı.";
        alert(
            resultItems.length > 0
                ? `${summaryMessage}\n\nÜretilen açıklamalar Denetim bölümünde gösterildi.`
                : summaryMessage
        );

        this.refresh();
        if (window.EAUI) {
            EAUI.renderFindings();
            EAUI.updateButtons();
        }

        return { fixed: successCount, skipped: skippedCount, failed: errorCount };
    },

    observeBehavior: function () {
        // Davranışsal veriler risk haritası ve durum metni için tutulur;
        // fakat denetim skoru scroll/mouse hareketiyle yeniden hesaplanmaz.
        // Böylece "Erişilebilirlik Durumu" sayfa aşağı kaydırıldıkça 67→80 gibi oynamaz.
        window.addEventListener("scroll", () => {
            const now = Date.now();
            this.behaviorData.scrollPoints.push({ y: window.scrollY, t: now });
            this.behaviorData.scrollPoints = this.behaviorData.scrollPoints.filter(p => now - p.t < 3000);
            this.calculateDisorientation();
            this.notifyBehaviorChanged();
        }, { passive: true });

        document.addEventListener("click", (event) => {
            if (event.composedPath && event.composedPath().includes(EAApp.dom.root)) return;
            const now = Date.now();
            this.lastClicks.push({ x: event.clientX + window.scrollX, y: event.clientY + window.scrollY, time: now });
            this.lastClicks = this.lastClicks.filter(click => now - click.time < 8000);
            this.calculateDisorientation();
            this.notifyBehaviorChanged();
        }, true);

        document.addEventListener("mousemove", (e) => {
            if (e.composedPath && e.composedPath().includes(EAApp.dom.root)) return;
            const now = Date.now();
            this.mouseMovements.push({ x: e.pageX, y: e.pageY, t: now });
            this.mouseMovements = this.mouseMovements.filter(m => now - m.t < 5000);
            this.calculateJitter();
            this.notifyBehaviorChanged();
        }, { passive: true });

        document.addEventListener("focusin", (e) => {
            if (e.composedPath && e.composedPath().includes(EAApp.dom.root)) return;
            const now = Date.now();
            const rect = e.target && e.target.getBoundingClientRect
                ? e.target.getBoundingClientRect()
                : null;

            this.behaviorData.focusNodes.push({
                t: now,
                x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
                y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
                node: e.target || null
            });

            this.behaviorData.focusNodes =
                this.behaviorData.focusNodes.filter(f => now - f.t < 10000);

            this.calculateDisorientation();
            this.notifyBehaviorChanged();
        }, true);
    },


    getBehaviorSignals: function () {
        const now = Date.now();
        const holdMs = 18000;
        const scrollPoints = (this.behaviorData.scrollPoints || []).filter(p => now - p.t < 4500);
        let scrollDirectionChanges = 0;

        for (let i = 2; i < scrollPoints.length; i++) {
            const diff1 = scrollPoints[i - 1].y - scrollPoints[i - 2].y;
            const diff2 = scrollPoints[i].y - scrollPoints[i - 1].y;

            if (Math.sign(diff1) !== Math.sign(diff2) && Math.abs(diff1) > 70 && Math.abs(diff2) > 70) {
                scrollDirectionChanges++;
            }
        }

        const recentClicks = (this.lastClicks || []).filter(click => now - click.time < 6000);
        let repeatedClickBursts = 0;

        for (let i = 2; i < recentClicks.length; i++) {
            const a = recentClicks[i - 2];
            const b = recentClicks[i - 1];
            const c = recentClicks[i];
            const timeWindow = c.time - a.time;
            const distAB = Math.hypot(a.x - b.x, a.y - b.y);
            const distBC = Math.hypot(b.x - c.x, b.y - c.y);

            if (timeWindow < 1500 && distAB < 42 && distBC < 42) {
                repeatedClickBursts++;
            }
        }

        const focusChanges = (this.behaviorData.focusNodes || []).filter(f => now - f.t < 10000).length;
        const jitter = Number(this.behaviorData.jitterIntensity || 0);
        const dis = Number(this.behaviorData.disorientationScore || 0);

        let level = "stable";
        let title = "Kullanıcı stabil geziyor.";
        let reason = "Belirgin erişilebilirlik zorluğu tespit edilmedi.";
        let recommendedProfile = "";
        const events = [];

        if (scrollDirectionChanges >= 4 || dis >= 0.65) {
            events.push("tekrarlı/ters yönlü kaydırma");
            recommendedProfile = recommendedProfile || "cognitive";
        }

        if (jitter >= 0.22) {
            events.push("fare hareketlerinde belirgin tutarsızlık");
            recommendedProfile = recommendedProfile || "motor";
        }

        if (repeatedClickBursts >= 2) {
            events.push("aynı bölgede sürekli tıklama");
            recommendedProfile = "motor";
        }

        if (focusChanges >= 10) {
            events.push("kısa sürede çok fazla odak değişimi");
            recommendedProfile = recommendedProfile || "motor";
        }

        const buildSignal = (held = false) => ({
            level,
            title,
            reason: held ? `${reason} Son algılama kısa süre korunuyor; çözüm üretmek için yeterli zaman var.` : reason,
            recommendedProfile,
            disorientationScore: Number(dis.toFixed(2)),
            jitterIntensity: Number(jitter.toFixed(2)),
            rageClicks: repeatedClickBursts,
            rawClicks: recentClicks.length,
            focusChanges,
            scrollDirectionChanges,
            held,
            timestamp: now
        });

        if (events.length) {
            level = events.length >= 2 || dis >= 0.75 || jitter >= 0.55 || repeatedClickBursts >= 3 ? "critical" : "warning";
            title = level === "critical"
                ? "Kullanıcı erişilebilirlik açısından zorluk yaşıyor."
                : "Kullanıcı erişilebilirlik açısından zorlanıyor olabilir.";
            reason = events.join(", ") + " gözlendi.";

            const signal = buildSignal(false);
            this.behaviorData.lastNonStableSignal = { ...signal, timestamp: now };
            return signal;
        }

        const last = this.behaviorData.lastNonStableSignal;
        if (last && now - last.timestamp < holdMs) {
            return {
                ...last,
                held: true,
                reason: `${last.reason} Son algılama kısa süre korunuyor; çözüm üretmek için yeterli zaman var.`,
                timestamp: now
            };
        }

        return buildSignal(false);
    },

    notifyBehaviorChanged: function () {
        const now = Date.now();
        if (this.__behaviorUiTimer && now - this.__behaviorUiTimer < 450) return;
        this.__behaviorUiTimer = now;

        if (window.EAUI && typeof EAUI.updateBehaviorPanel === "function") {
            EAUI.updateBehaviorPanel();
        }

        if (window.EAUI && EAUI.heatmapVisible) {
            EAUI.drawHeatmap();
        }
    },

    calculateJitter: function () {
        const now = Date.now();
        const points = (this.mouseMovements || []).filter(p => now - p.t < 4200);

        if (points.length < 14) {
            // Eski değer anında sıfırlanmasın; yavaşça sönümlensin.
            this.behaviorData.jitterIntensity = Math.max(0, (this.behaviorData.jitterIntensity || 0) * 0.88);
            return;
        }

        let sharpTurns = 0;
        let localBackAndForth = 0;
        let axisReversals = 0;
        let usableSegments = 0;

        for (let i = 2; i < points.length; i++) {
            const p0 = points[i - 2];
            const p1 = points[i - 1];
            const p2 = points[i];

            const dt1 = Math.max(1, p1.t - p0.t);
            const dt2 = Math.max(1, p2.t - p1.t);

            // Çok yavaş hareketleri normal gezinme say.
            if (dt1 > 320 || dt2 > 320) continue;

            const v1x = p1.x - p0.x;
            const v1y = p1.y - p0.y;
            const v2x = p2.x - p1.x;
            const v2y = p2.y - p1.y;

            const d1 = Math.hypot(v1x, v1y);
            const d2 = Math.hypot(v2x, v2y);

            if (d1 < 5 || d2 < 5 || d1 > 190 || d2 > 190) continue;

            usableSegments++;

            const cos = (v1x * v2x + v1y * v2y) / (d1 * d2);
            const speed1 = d1 / dt1;
            const speed2 = d2 / dt2;
            const speedChange = Math.abs(speed2 - speed1);

            // Genel keskin dönüş
            if (cos < 0.18 && (speed1 > 0.08 || speed2 > 0.08)) {
                sharpTurns++;
            }

            // Aynı küçük bölgede ileri-geri
            const backDist = Math.hypot(p2.x - p0.x, p2.y - p0.y);
            if (cos < -0.18 && backDist < 70) {
                localBackAndForth++;
            }

            // Kullanıcının özellikle test ettiği yukarı-aşağı / sağ-sol zikzak hareketi
            const verticalReverse =
                Math.sign(v1y) !== Math.sign(v2y) &&
                Math.abs(v1y) > 10 &&
                Math.abs(v2y) > 10 &&
                Math.abs(v1x) < Math.abs(v1y) * 1.2 &&
                Math.abs(v2x) < Math.abs(v2y) * 1.2;

            const horizontalReverse =
                Math.sign(v1x) !== Math.sign(v2x) &&
                Math.abs(v1x) > 10 &&
                Math.abs(v2x) > 10 &&
                Math.abs(v1y) < Math.abs(v1x) * 1.2 &&
                Math.abs(v2y) < Math.abs(v2x) * 1.2;

            if (verticalReverse || horizontalReverse) {
                axisReversals++;
            }
        }

        if (usableSegments < 8) {
            this.behaviorData.jitterIntensity = Math.max(0, (this.behaviorData.jitterIntensity || 0) * 0.88);
            return;
        }

        const turnRatio = sharpTurns / usableSegments;
        const localRatio = localBackAndForth / usableSegments;
        const axisRatio = axisReversals / usableSegments;

        let score = Math.max(
            turnRatio * 1.25,
            localRatio * 1.55,
            axisRatio * 1.85
        );

        // Belirgin birkaç yukarı-aşağı zikzak varsa skor üret.
        if (axisReversals >= 4) {
            score = Math.max(score, 0.32 + axisReversals * 0.035);
        }

        if (sharpTurns >= 6) {
            score = Math.max(score, 0.26 + sharpTurns * 0.02);
        }

        if (axisReversals < 3 && sharpTurns < 5 && localBackAndForth < 3) {
            score = 0;
        }

        // Anında düşürme yok; eski değerle harmanlayarak çözüm üretmeye zaman tanır.
        const previous = this.behaviorData.jitterIntensity || 0;
        const blended = score > previous
            ? score
            : Math.max(score, previous * 0.90);

        this.behaviorData.jitterIntensity = Math.min(1, Math.max(0, blended));
    },
    calculateDisorientation: function () {
        // 1. O_scroll: sadece belirgin ters yönlü kaydırmalar
        const points = this.behaviorData.scrollPoints || [];
        let directionChanges = 0;

        for (let i = 2; i < points.length; i++) {
            const diff1 = points[i - 1].y - points[i - 2].y;
            const diff2 = points[i].y - points[i - 1].y;

            if (Math.sign(diff1) !== Math.sign(diff2) && Math.abs(diff1) > 70 && Math.abs(diff2) > 70) {
                directionChanges++;
            }
        }

        const O_scroll = Math.min(1, directionChanges / 6);

        // 2. R_bounce: sadece aynı noktaya tekrarlı hızlı tıklama
        const clicks = this.lastClicks || [];
        let bounceCount = 0;

        for (let i = 2; i < clicks.length; i++) {
            const a = clicks[i - 2];
            const b = clicks[i - 1];
            const c = clicks[i];
            const timeWindow = c.time - a.time;
            const distAB = Math.hypot(a.x - b.x, a.y - b.y);
            const distBC = Math.hypot(b.x - c.x, b.y - c.y);

            if (timeWindow < 1500 && distAB < 42 && distBC < 42) {
                bounceCount++;
            }
        }

        const R_bounce = Math.min(1, bounceCount / 4);

        // 3. F_erratic: çok kısa sürede art arda odak sıçraması
        const focuses = this.behaviorData.focusNodes || [];
        let erraticCount = 0;

        for (let i = 1; i < focuses.length; i++) {
            if (focuses[i].t - focuses[i - 1].t < 450) {
                erraticCount++;
            }
        }

        const F_erratic = Math.min(1, erraticCount / 8);

        this.behaviorData.disorientationScore = (0.5 * O_scroll) + (0.3 * R_bounce) + (0.2 * F_erratic);
    },

    // İSİM DEĞİŞTİ: Artık refresh fonksiyonuyla konuşabiliyor
    calculateHearingScore: function () {const mediaElements = Array.from(document.querySelectorAll("video, audio"));
        
        // Eğer sayfada hiç medya öğesi yoksa, işitsel erişilebilirlik tamdır (100)
        if (mediaElements.length === 0) return 100;

        let hearingErrorCount = 0;
        const isYouTube = location.hostname.includes("youtube.com");

        mediaElements.forEach(media => {
            let hasIssue = false;

            // 1. OEK-4 Kriteri: Altyazı veya Metinsel Alternatif Eksikliği
            if (media.tagName === "VIDEO") {
                if (isYouTube) {
                    const ccButton = document.querySelector(".ytp-subtitles-button");
                    const ccDisabled = !ccButton || ccButton.disabled || ccButton.getAttribute("aria-disabled") === "true" || ccButton.style.display === "none";
                    const ccActive = ccButton && ccButton.getAttribute("aria-pressed") === "true";

                    // Altyazı butonu bozuk/gizli ise VEYA kapalı durumdaysa hata say
                    if (ccDisabled || !ccActive) {
                        hasIssue = true; 
                    }
                } else {
                    const hasTrack = media.querySelector("track[kind='captions'], track[kind='subtitles']");
                    const hasActiveTrack = Array.from(media.textTracks || []).some(track => track.mode === "showing");
                    
                    // Standart HTML5 videolarda altyazı izi (track) yoksa hata say
                    if (!hasTrack && !hasActiveTrack) {
                        hasIssue = true;
                    }
                }
            }

            // 2. WCAG Kriteri: Sesli Otomatik Oynatma (Kullanıcı kontrolü dışında ses)
            if (media.autoplay && !media.muted) {
                hasIssue = true;
            }

            // Eğer medyada bir işitsel erişim sorunu varsa, hata sayısını artır
            if (hasIssue) {
                hearingErrorCount++;
            }
        });

        // 🎯 OEK-4 İhlal Yoğunluğu Formülü: S_isitsel = 100 * (1 - (Hatalı Medya / Toplam Medya))
        let score = 100 * (1 - (hearingErrorCount / mediaElements.length));
        
        return Math.round(Math.max(0, score));},
    calculateMotorScore: function () {const interactiveElements = Array.from(
            document.querySelectorAll("button, a, input, textarea, select, [role='button'], [role='link']")
        ).filter(el => {
            // Sadece ekranda görünür olanları analize dahil et
            const style = this.getElementWindow(el).getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0;
        });

        if (interactiveElements.length === 0) return 100;

        let motorErrorCount = 0;

        interactiveElements.forEach(el => {
            let hasMotorIssue = false;
            const rect = el.getBoundingClientRect();

            // 1. OEK-4 Kriteri: Etkileşim Alanı Boyutu (WCAG minimum 44x44)
            if (
                !el.hasAttribute("data-ea-small-target-fixed") &&
                rect.width > 0 &&
                rect.height > 0 &&
                (rect.width < 44 || rect.height < 44)
            ) {
                hasMotorIssue = true;
            }

            // 2. OEK-4 Kriteri: Klavye ile Erişilebilirlik (Focus eksikliği)
            if (!el.disabled) {
                const isNativeFocusable = el.matches("button, input, textarea, select, a[href]");
                const tabindex = el.getAttribute("tabindex");
                const hasValidTabindex = tabindex !== null && Number(tabindex) >= 0;
                
                // Eğer doğal olarak klavyeyle ulaşılamıyorsa ve geliştirici tabindex ile düzeltmemişse
                if (!isNativeFocusable && !hasValidTabindex) {
                    hasMotorIssue = true;
                }
            }

            // Eğer öğede motor etkileşim sorunu varsa hata sayısını artır
            if (hasMotorIssue) {
                motorErrorCount++;
            }
        });

        // 🎯 OEK-4 İhlal Yoğunluğu Formülü: Smotor = 100 * (1 - (Hatalı / Toplam))
        let score = 100 * (1 - (motorErrorCount / interactiveElements.length));
        
        return Math.round(Math.max(0, score));},



    getHeatmapFindingWeight: function (finding) {
        const type = (finding?.type || "").toLowerCase();
        const title = (finding?.title || "").toLowerCase();

        const exactWeights = {
            "missing-form-label": 0.95,
            "missing-aria-label": 0.90,
            "focus-order": 0.85,
            "heading-hierarchy": 0.62,
            "semantic-landmark": 0.52,
            "navigation-landmark": 0.54
        };

        if (exactWeights[type] !== undefined) {
            return exactWeights[type];
        }

        if (
            title.includes("klavye navigasyon") ||
            title.includes("erişilem") ||
            title.includes("form etiketi") ||
            title.includes("aria label") ||
            title.includes("önemli görsel") ||
            title.includes("açıklama yok")
        ) {
            return 0.95;
        }

        if (
            title.includes("focus göstergesi") ||
            title.includes("odak") ||
            title.includes("küçük tıklama")
        ) {
            return 0.82;
        }

        if (title.includes("kontrast")) return 0.72;
        if (title.includes("başlık")) return 0.64;
        if (title.includes("screen reader")) return 0.78;
        if (title.includes("uzun ve yoğun")) return 0.42;

        return 0.55;
    },

    generateHeatmapData: function () {
        const viewportWidth = Math.max(
            window.innerWidth || 0,
            document.documentElement.clientWidth || 0
        );
        const viewportHeight = Math.max(
            window.innerHeight || 0,
            document.documentElement.clientHeight || 0
        );

        const hotspots = [];
        const adRects = this.collectAdvertisementRects(viewportWidth, viewportHeight);
        const now = Date.now();

        const clamp = (value, min, max) =>
            Math.min(max, Math.max(min, value));

        const visibleRect = (rect) => {
            if (!rect || rect.width <= 0 || rect.height <= 0) return null;

            const left = clamp(rect.left, 0, viewportWidth);
            const top = clamp(rect.top, 0, viewportHeight);
            const right = clamp(rect.right, 0, viewportWidth);
            const bottom = clamp(rect.bottom, 0, viewportHeight);

            if (right <= left || bottom <= top) return null;

            return {
                left,
                top,
                right,
                bottom,
                width: right - left,
                height: bottom - top
            };
        };

        const addHotspot = ({
            x,
            y,
            radius,
            staticRisk = 0,
            behaviorRisk = 0,
            source = "unknown",
            issueType = "",
            rect = null
        }) => {
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            if (x < 0 || y < 0 || x > viewportWidth || y > viewportHeight) return;
            if (this.pointInsideAnyRect(x, y, adRects)) return;

            const normalizedStatic = clamp(staticRisk, 0, 1);
            const normalizedBehavior = clamp(behaviorRisk, 0, 1);

            // Raporda belirtilen birleşik risk: statik erişilebilirlik bulguları
            // baskın, davranışsal göstergeler destekleyici faktördür.
            const totalRisk = clamp(
                (0.70 * normalizedStatic) + (0.30 * normalizedBehavior),
                0,
                1
            );

            if (totalRisk <= 0.015) return;

            hotspots.push({
                x,
                y,
                radius: clamp(radius || 70, 34, 220),
                staticRisk: normalizedStatic,
                behaviorRisk: normalizedBehavior,
                totalRisk,
                risk: Math.round(totalRisk * 100),
                level:
                    totalRisk >= 0.65
                        ? "high"
                        : totalRisk >= 0.35
                            ? "medium"
                            : "low",
                source,
                issueType,
                rect
            });
        };

        // 1) Statik WCAG / DOM bulguları
        (this.findings || []).forEach((finding) => {
            if (!Array.isArray(finding.nodes) || !finding.nodes.length) return;

            const findingWeight = this.getHeatmapFindingWeight(finding);

            finding.nodes.forEach((node) => {
                if (!node || !node.getBoundingClientRect) return;
                if (this.isAdvertisementNode(node)) return;
                if (this.isAssistantNode && this.isAssistantNode(node)) return;

                const rect = visibleRect(node.getBoundingClientRect());
                if (!rect) return;
                if (this.rectIntersectsAny(rect, adRects)) return;

                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const areaFactor = clamp(
                    Math.sqrt(rect.width * rect.height) / 260,
                    0.78,
                    1.35
                );
                const radius = clamp(
                    Math.max(rect.width, rect.height) * 0.58 + 54,
                    48,
                    190
                );

                addHotspot({
                    x: centerX,
                    y: centerY,
                    radius,
                    staticRisk: clamp(findingWeight * areaFactor, 0, 1),
                    behaviorRisk: 0,
                    source: "static",
                    issueType: finding.type || finding.title || "finding",
                    rect
                });

                // Büyük DOM alanlarında yalnızca merkez değil, alanın içi de
                // yoğunlukla doldurulsun.
                if (rect.width > 240 || rect.height > 180) {
                    const horizontalSteps = Math.min(3, Math.max(1, Math.ceil(rect.width / 260)));
                    const verticalSteps = Math.min(3, Math.max(1, Math.ceil(rect.height / 200)));

                    for (let ix = 0; ix < horizontalSteps; ix++) {
                        for (let iy = 0; iy < verticalSteps; iy++) {
                            const px =
                                rect.left +
                                ((ix + 0.5) / horizontalSteps) * rect.width;
                            const py =
                                rect.top +
                                ((iy + 0.5) / verticalSteps) * rect.height;

                            addHotspot({
                                x: px,
                                y: py,
                                radius: clamp(radius * 0.72, 42, 140),
                                staticRisk: clamp(findingWeight * 0.68, 0, 1),
                                behaviorRisk: 0,
                                source: "static-region",
                                issueType: finding.type || finding.title || "finding",
                                rect
                            });
                        }
                    }
                }
            });
        });

        // 2) Rage Click: aynı bölgedeki hızlı tıklamalar kümelenir.
        const recentClicks = (this.lastClicks || [])
            .filter((click) => now - click.time < 9000)
            .map((click) => ({
                x: click.x - window.scrollX,
                y: click.y - window.scrollY,
                time: click.time
            }))
            .filter((click) =>
                click.x >= 0 &&
                click.y >= 0 &&
                click.x <= viewportWidth &&
                click.y <= viewportHeight &&
                !this.pointInsideAnyRect(click.x, click.y, adRects)
            );

        const clickClusters = [];
        recentClicks.forEach((click) => {
            let cluster = clickClusters.find((item) =>
                Math.hypot(item.x - click.x, item.y - click.y) < 64
            );

            if (!cluster) {
                cluster = {
                    x: click.x,
                    y: click.y,
                    count: 0,
                    firstTime: click.time,
                    lastTime: click.time
                };
                clickClusters.push(cluster);
            }

            cluster.count += 1;
            cluster.x = ((cluster.x * (cluster.count - 1)) + click.x) / cluster.count;
            cluster.y = ((cluster.y * (cluster.count - 1)) + click.y) / cluster.count;
            cluster.firstTime = Math.min(cluster.firstTime, click.time);
            cluster.lastTime = Math.max(cluster.lastTime, click.time);
        });

        clickClusters.forEach((cluster) => {
            const duration = Math.max(1, cluster.lastTime - cluster.firstTime);
            const rapidFactor = duration < 2600 ? 1 : 0.62;
            const behaviorRisk = clamp(
                ((cluster.count - 1) / 5) * rapidFactor,
                0,
                1
            );

            if (cluster.count >= 3) {
                addHotspot({
                    x: cluster.x,
                    y: cluster.y,
                    radius: 58 + cluster.count * 8,
                    staticRisk: 0,
                    behaviorRisk,
                    source: "rage-click",
                    issueType: "rage-click"
                });
            }
        });

        // 3) Mouse jitter / kararsızlık: keskin ve ters yönlü hareketler
        const moves = (this.mouseMovements || [])
            .filter((movement) => now - movement.t < 6500);

        for (let i = 2; i < moves.length; i++) {
            const a = moves[i - 2];
            const b = moves[i - 1];
            const c = moves[i];

            const v1x = b.x - a.x;
            const v1y = b.y - a.y;
            const v2x = c.x - b.x;
            const v2y = c.y - b.y;

            const d1 = Math.hypot(v1x, v1y);
            const d2 = Math.hypot(v2x, v2y);
            if (d1 < 6 || d2 < 6 || d1 > 220 || d2 > 220) continue;

            const cos = (v1x * v2x + v1y * v2y) / (d1 * d2);
            const backDistance = Math.hypot(c.x - a.x, c.y - a.y);
            const abruptTurn = cos < 0.08;
            const localReturn = cos < -0.18 && backDistance < 78;

            if (!abruptTurn && !localReturn) continue;

            const x = c.x - window.scrollX;
            const y = c.y - window.scrollY;
            const intensity = clamp(
                ((1 - cos) / 2) * (localReturn ? 0.88 : 0.58),
                0.18,
                0.92
            );

            addHotspot({
                x,
                y,
                radius: localReturn ? 74 : 56,
                staticRisk: 0,
                behaviorRisk: intensity,
                source: "mouse-jitter",
                issueType: "mouse-jitter"
            });
        }

        // 4) Scroll Oscillation: belirgin aşağı-yukarı yön değişimleri
        const scrollPoints = (this.behaviorData.scrollPoints || [])
            .filter((point) => now - point.t < 6500);

        let oscillations = 0;
        for (let i = 2; i < scrollPoints.length; i++) {
            const d1 = scrollPoints[i - 1].y - scrollPoints[i - 2].y;
            const d2 = scrollPoints[i].y - scrollPoints[i - 1].y;

            if (
                Math.sign(d1) !== Math.sign(d2) &&
                Math.abs(d1) > 70 &&
                Math.abs(d2) > 70
            ) {
                oscillations += 1;
            }
        }

        if (oscillations > 0) {
            addHotspot({
                x: viewportWidth * 0.50,
                y: viewportHeight * 0.52,
                radius: clamp(100 + oscillations * 18, 110, 210),
                staticRisk: 0,
                behaviorRisk: clamp(oscillations / 5, 0, 1),
                source: "scroll-oscillation",
                issueType: "scroll-oscillation"
            });
        }

        // 5) Odak kaybı / hızlı odak değişimi
        const focusEvents = (this.behaviorData.focusNodes || [])
            .filter((event) => now - event.t < 10000);

        focusEvents.forEach((event, index) => {
            if (index === 0) return;

            const previous = focusEvents[index - 1];
            const delta = event.t - previous.t;
            if (delta > 520) return;

            const x = Number.isFinite(event.x)
                ? event.x
                : viewportWidth * 0.50;
            const y = Number.isFinite(event.y)
                ? event.y
                : viewportHeight * 0.50;

            addHotspot({
                x,
                y,
                radius: 68,
                staticRisk: 0,
                behaviorRisk: clamp((520 - delta) / 520, 0.22, 0.82),
                source: "focus-loss",
                issueType: "focus-loss"
            });
        });

        // Aynı konuma çok yakın noktaları birleştirerek termal yoğunluğu
        // daha doğal ve performanslı hale getir.
        const merged = [];

        hotspots
            .sort((a, b) => b.totalRisk - a.totalRisk)
            .forEach((hotspot) => {
                const existing = merged.find((item) =>
                    Math.hypot(item.x - hotspot.x, item.y - hotspot.y) <
                    Math.min(item.radius, hotspot.radius) * 0.38
                );

                if (!existing) {
                    merged.push({ ...hotspot, contributions: 1 });
                    return;
                }

                const totalWeight =
                    existing.totalRisk + hotspot.totalRisk || 1;

                existing.x =
                    ((existing.x * existing.totalRisk) +
                    (hotspot.x * hotspot.totalRisk)) /
                    totalWeight;

                existing.y =
                    ((existing.y * existing.totalRisk) +
                    (hotspot.y * hotspot.totalRisk)) /
                    totalWeight;

                existing.radius = clamp(
                    Math.max(existing.radius, hotspot.radius) +
                    Math.min(existing.radius, hotspot.radius) * 0.10,
                    38,
                    230
                );

                existing.staticRisk = clamp(
                    existing.staticRisk + hotspot.staticRisk * 0.52,
                    0,
                    1
                );

                existing.behaviorRisk = clamp(
                    existing.behaviorRisk + hotspot.behaviorRisk * 0.58,
                    0,
                    1
                );

                existing.totalRisk = clamp(
                    (0.70 * existing.staticRisk) +
                    (0.30 * existing.behaviorRisk),
                    0,
                    1
                );

                existing.risk = Math.round(existing.totalRisk * 100);
                existing.level =
                    existing.totalRisk >= 0.65
                        ? "high"
                        : existing.totalRisk >= 0.35
                            ? "medium"
                            : "low";
                existing.contributions += 1;
            });

        return merged;
    },

    isAdvertisementNode: function (el) {
        if (!el || !el.closest) return false;
        if (this.isAssistantNode(el)) return false;

        const quickSelectors = [
            '[data-ad]',
            '[data-ads]',
            '[data-ad-container]',
            '[data-ad-slot]',
            '[data-testid*="ad" i]',
            '[aria-label*="advert" i]',
            '[aria-label*="sponsor" i]',
            'iframe[src*="doubleclick"]',
            'iframe[src*="googlesyndication"]',
            'iframe[src*="adservice"]',
            'iframe[src*="taboola"]',
            'iframe[src*="outbrain"]'
        ].join(',');

        const match = el.closest(quickSelectors);
        if (match) return true;

        let current = el;
        const tokenRegex = /(^|[\s\-_])(ad|ads|advert|advertisement|sponsor|sponsored|promo|promotion|reklam|banner)([\s\-_]|$)/i;
        while (current && current !== document.body) {
            const attrs = [
                current.id || '',
                typeof current.className === 'string' ? current.className : '',
                current.getAttribute?.('role') || '',
                current.getAttribute?.('aria-label') || '',
                current.getAttribute?.('data-testid') || ''
            ].join(' ');

            if (tokenRegex.test(attrs)) return true;

            if (current.tagName === 'IFRAME') {
                const src = (current.getAttribute('src') || '').toLowerCase();
                if (/(doubleclick|googlesyndication|adservice|taboola|outbrain|criteo|adnxs|adsystem)/.test(src)) {
                    return true;
                }
            }
            current = current.parentElement;
        }
        return false;
    },

    collectAdvertisementRects: function (viewportWidth, viewportHeight) {
        const selectors = [
            '[data-ad]',
            '[data-ads]',
            '[data-ad-container]',
            '[data-ad-slot]',
            '[data-testid*="ad" i]',
            '[aria-label*="advert" i]',
            '[aria-label*="sponsor" i]',
            'iframe',
            '[id*="reklam" i]',
            '[class*="reklam" i]',
            '[id*="sponsor" i]',
            '[class*="sponsor" i]',
            '[id*="promo" i]',
            '[class*="promo" i]',
            '[id*="banner" i]',
            '[class*="banner" i]'
        ].join(',');

        const rects = [];
        document.querySelectorAll(selectors).forEach((el) => {
            if (!this.isAdvertisementNode(el)) return;
            const rect = el.getBoundingClientRect();
            if (!rect || rect.width <= 0 || rect.height <= 0) return;
            const left = Math.max(0, rect.left);
            const top = Math.max(0, rect.top);
            const right = Math.min(viewportWidth, rect.right);
            const bottom = Math.min(viewportHeight, rect.bottom);
            if (right <= left || bottom <= top) return;
            rects.push({ left, top, right, bottom });
        });
        return rects;
    },

    pointInsideAnyRect: function (x, y, rects) {
        return rects.some((rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
    },

    rectIntersectsAny: function (rect, rects) {
        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        if (this.pointInsideAnyRect(cx, cy, rects)) return true;
        return rects.some((r) => !(rect.right <= r.left || rect.left >= r.right || rect.bottom <= r.top || rect.top >= r.bottom));
    },

    getHeadingLevel: function (heading) {
        if (!heading) return 0;

        const ariaLevel = Number(heading.getAttribute?.("aria-level"));
        const role = (heading.getAttribute?.("role") || "").toLowerCase();

        if (role === "heading" && Number.isFinite(ariaLevel) && ariaLevel >= 1 && ariaLevel <= 6) {
            return ariaLevel;
        }

        const match = (heading.tagName || "").match(/^H([1-6])$/i);
        return match ? Number(match[1]) : 0;
    },

    fixHeadingHierarchy: function () {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
            .filter(el => this.isAuditableElement(el));

        const result = {
            fixed: 0,
            skipped: 0,
            failed: 0
        };

        if (!headings.length) {
            result.skipped = 1;
            return result;
        }

        try {
            let previousLevel = 0;
            let hasLevelOne = headings.some(h => this.getHeadingLevel(h) === 1);

            if (!hasLevelOne) {
                const first = headings[0];
                first.setAttribute("role", "heading");
                first.setAttribute("aria-level", "1");
                first.setAttribute("data-ea-heading-fixed", "true");
                first.style.setProperty("outline", "2px dashed #10b981", "important");
                first.style.setProperty("outline-offset", "3px", "important");
                result.fixed++;
            }

            headings.forEach((heading) => {
                let level = this.getHeadingLevel(heading);

                if (!level) {
                    return;
                }

                if (previousLevel && level - previousLevel > 1) {
                    const correctedLevel = Math.min(previousLevel + 1, 6);
                    heading.setAttribute("role", "heading");
                    heading.setAttribute("aria-level", String(correctedLevel));
                    heading.setAttribute("data-ea-heading-fixed", "true");
                    heading.style.setProperty("outline", "2px dashed #10b981", "important");
                    heading.style.setProperty("outline-offset", "3px", "important");
                    result.fixed++;
                    level = correctedLevel;
                }

                previousLevel = level;
            });
        } catch (err) {
            console.error("Başlık hiyerarşisi düzeltilemedi:", err);
            result.failed++;
        }

        return result;
    },

    fixStructuralLandmarks: function (type = "all") {
        const result = { fixed: 0, skipped: 0, failed: 0 };

        try {
            const needsMain = type === "all" || type === "semantic-landmark";
            const needsNav = type === "all" || type === "navigation-landmark";

            if (needsMain && !document.querySelector("main, [role='main']")) {
                const mainCandidate =
                    document.querySelector("article, section, #main, #content, .main, .content, .container") ||
                    document.body;

                if (mainCandidate) {
                    mainCandidate.setAttribute("role", "main");
                    mainCandidate.setAttribute("data-ea-landmark-fixed", "main");
                    if (mainCandidate.style) {
                        mainCandidate.style.setProperty("outline", "2px dashed #10b981", "important");
                        mainCandidate.style.setProperty("outline-offset", "3px", "important");
                    }
                    result.fixed++;
                } else {
                    result.skipped++;
                }
            }

            if (needsNav && !document.querySelector("nav, [role='navigation']")) {
                const navCandidate =
                    document.querySelector("[class*='nav' i], [id*='nav' i], [class*='menu' i], [id*='menu' i], header ul, header ol, ul, ol");

                if (navCandidate) {
                    navCandidate.setAttribute("role", "navigation");
                    navCandidate.setAttribute("data-ea-landmark-fixed", "navigation");
                    if (!navCandidate.getAttribute("aria-label")) {
                        navCandidate.setAttribute("aria-label", "Sayfa navigasyonu");
                    }
                    if (navCandidate.style) {
                        navCandidate.style.setProperty("outline", "2px dashed #10b981", "important");
                        navCandidate.style.setProperty("outline-offset", "3px", "important");
                    }
                    result.fixed++;
                } else {
                    result.skipped++;
                }
            }
        } catch (err) {
            console.error("Semantik landmark düzeltmesi başarısız:", err);
            result.failed++;
        }

        return result;
    },

    fixFocusOrder: function (nodes) {
        const result = { fixed: 0, skipped: 0, failed: 0 };

        (nodes || []).forEach((el) => {
            try {
                if (!el || this.isAssistantNode(el)) return;
                const value = Number(el.getAttribute("tabindex"));

                if (Number.isFinite(value) && value > 0) {
                    el.setAttribute("tabindex", "0");
                    el.setAttribute("data-ea-focus-order-fixed", "true");
                    if (el.style) {
                        el.style.setProperty("outline", "2px dashed #10b981", "important");
                        el.style.setProperty("outline-offset", "3px", "important");
                    }
                    result.fixed++;
                } else {
                    result.skipped++;
                }
            } catch (err) {
                console.error("Odak sırası düzeltilemedi:", err);
                result.failed++;
            }
        });

        return result;
    },

    ensureFormFieldIdentity: function (el) {
        if (!el || !el.matches || !el.matches("input, textarea, select")) return false;
        if ((el.id && el.id.trim()) || (el.name && el.name.trim())) return false;

        const base =
            (el.getAttribute("autocomplete") ||
            el.getAttribute("type") ||
            el.getAttribute("placeholder") ||
            el.tagName ||
            "field")
                .toString()
                .toLowerCase()
                .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi, "-")
                .replace(/^-+|-+$/g, "")
                .substring(0, 28) || "field";

        let index = 1;
        let id = `ea-fixed-${base}-${index}`;
        while (document.getElementById(id)) {
            index += 1;
            id = `ea-fixed-${base}-${index}`;
        }

        el.id = id;
        el.name = id;
        el.setAttribute("data-ea-identity-fixed", "true");
        return true;
    },

    fixSmallTargetElement: function (el) {
        if (!el || !el.style || this.isAssistantNode(el)) return false;

        const before = el.getBoundingClientRect();
        if (before.width <= 0 || before.height <= 0) return false;

        el.setAttribute("data-ea-small-target-fixed", "true");
        el.style.setProperty("display", "inline-flex", "important");
        el.style.setProperty("align-items", "center", "important");
        el.style.setProperty("justify-content", "center", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
        el.style.setProperty("min-width", "48px", "important");
        el.style.setProperty("min-height", "48px", "important");
        el.style.setProperty("width", before.width < 44 ? "48px" : `${Math.ceil(before.width)}px`, "important");
        el.style.setProperty("height", before.height < 44 ? "48px" : `${Math.ceil(before.height)}px`, "important");
        el.style.setProperty("padding", "10px", "important");
        el.style.setProperty("max-width", "none", "important");
        el.style.setProperty("max-height", "none", "important");
        el.style.setProperty("overflow", "visible", "important");
        el.style.setProperty("flex-shrink", "0", "important");
        el.style.setProperty("touch-action", "manipulation", "important");
        el.style.setProperty("position", window.getComputedStyle(el).position === "static" ? "relative" : window.getComputedStyle(el).position, "important");
        el.style.setProperty("z-index", "2", "important");
        el.style.setProperty("outline", "2px dashed #10b981", "important");
        el.style.setProperty("outline-offset", "2px", "important");

        if (!this.hasAccessibleName(el)) {
            const text = (el.innerText || el.textContent || el.getAttribute("title") || "").trim();
            el.setAttribute("aria-label", text || "Etkileşimli alan");
        }

        return true;
    },

    getAccessibleAuditDocuments: function () {
        const documents = [];
        const visited = new Set();

        const visit = (doc, depth = 0) => {
            if (!doc || visited.has(doc) || depth > 4) return;
            visited.add(doc);
            documents.push(doc);

            let frames = [];
            try {
                frames = Array.from(doc.querySelectorAll("iframe, frame"));
            } catch (_) {
                return;
            }

            frames.forEach((frame) => {
                try {
                    const childDocument = frame.contentDocument || frame.contentWindow?.document;
                    if (childDocument && childDocument.documentElement) {
                        visit(childDocument, depth + 1);
                    }
                } catch (_) {
                    // Cross-origin iframe içerikleri tarayıcı güvenliği nedeniyle atlanır.
                }
            });
        };

        visit(document, 0);
        return documents;
    },

    getElementWindow: function (el) {
        return el?.ownerDocument?.defaultView || window;
    },

    isAssistantNode: function (el) {
        return !!(el && el.closest && el.closest("#ea-accessibility-assistant"));
    },

    isAuditableElement: function (el) {
        if (!el || this.isAssistantNode(el)) return false;
        if (el.closest && el.closest("[aria-hidden='true'], [hidden]")) return false;

        const style = window.getComputedStyle(el);
        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number(style.opacity) === 0
        ) {
            return false;
        }

        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    },

    hasReadableText: function (el) {
        const text =
            (el.innerText || el.textContent || el.value || "")
                .replace(/\s+/g, " ")
                .trim();

        return text.length > 0;
    },

    parseCssColor: function (value) {
        if (!value || value === "transparent") {
            return { r: 0, g: 0, b: 0, a: 0 };
        }

        const match = value.match(/rgba?\(([^)]+)\)/i);
        if (!match) return null;

        const parts =
            match[1]
                .split(",")
                .map(part => part.trim());

        const channels = parts.slice(0, 3).map(part => {
            if (part.endsWith("%")) {
                return Math.round(parseFloat(part) * 2.55);
            }

            return Number(part);
        });

        if (channels.some(channel => Number.isNaN(channel))) {
            return null;
        }

        return {
            r: Math.max(0, Math.min(255, channels[0])),
            g: Math.max(0, Math.min(255, channels[1])),
            b: Math.max(0, Math.min(255, channels[2])),
            a: parts[3] === undefined ? 1 : Math.max(0, Math.min(1, Number(parts[3])))
        };
    },

    blendColors: function (foreground, background) {
        const alpha = foreground.a + background.a * (1 - foreground.a);

        if (alpha === 0) {
            return { r: 255, g: 255, b: 255, a: 1 };
        }

        return {
            r: Math.round(
                (foreground.r * foreground.a +
                    background.r * background.a * (1 - foreground.a)) /
                    alpha
            ),
            g: Math.round(
                (foreground.g * foreground.a +
                    background.g * background.a * (1 - foreground.a)) /
                    alpha
            ),
            b: Math.round(
                (foreground.b * foreground.a +
                    background.b * background.a * (1 - foreground.a)) /
                    alpha
            ),
            a: alpha
        };
    },

    getEffectiveBackground: function (el) {
        let current = el;
        let effective = null;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            const style = window.getComputedStyle(current);
            const bg = this.parseCssColor(style.backgroundColor);

            if (bg && bg.a > 0) {
                effective = effective
                    ? this.blendColors(effective, bg)
                    : bg;

                if (effective.a >= 0.99) break;
            }

            current = current.parentElement;
        }

        if (!effective) {
            effective = { r: 255, g: 255, b: 255, a: 1 };
        }

        if (effective.a < 1) {
            effective = this.blendColors(effective, {
                r: 255,
                g: 255,
                b: 255,
                a: 1
            });
        }

        return effective;
    },

    luminance: function (color) {
        const channels = [color.r, color.g, color.b].map(value => {
            value /= 255;

            return value <= 0.03928
                ? value / 12.92
                : Math.pow((value + 0.055) / 1.055, 2.4);
        });

        return (
            0.2126 * channels[0] +
            0.7152 * channels[1] +
            0.0722 * channels[2]
        );
    },

    contrastRatio: function (colorA, colorB) {
        const lumA = this.luminance(colorA);
        const lumB = this.luminance(colorB);
        const light = Math.max(lumA, lumB);
        const dark = Math.min(lumA, lumB);

        return (light + 0.05) / (dark + 0.05);
    },

    getContrastInfo: function (el) {
        const style = window.getComputedStyle(el);
        let color = this.parseCssColor(style.color);

        if (!color || color.a === 0) return null;

        const background = this.getEffectiveBackground(el);

        if (color.a < 1) {
            color = this.blendColors(color, background);
        }

        const fontSize = parseFloat(style.fontSize) || 16;
        const fontWeight = parseInt(style.fontWeight, 10) || 400;
        const largeText =
            fontSize >= 24 ||
            (fontSize >= 18.66 && fontWeight >= 700);

        return {
            color,
            background,
            ratio: this.contrastRatio(color, background),
            minimum: largeText ? 3 : 4.5
        };
    },

    bestTextColorFor: function (background) {
        const black = { r: 0, g: 0, b: 0, a: 1 };
        const white = { r: 255, g: 255, b: 255, a: 1 };

        return this.contrastRatio(black, background) >=
            this.contrastRatio(white, background)
            ? "#000000"
            : "#ffffff";
    },

    fixContrastForElement: function (el) {
        const info = this.getContrastInfo(el);
        if (!info || info.ratio >= info.minimum) return false;

        const textColor = this.bestTextColorFor(info.background);

        el.style.setProperty("color", textColor, "important");
        el.style.setProperty("-webkit-text-fill-color", textColor, "important");
        el.style.setProperty("text-shadow", "none", "important");
        el.setAttribute("data-ea-contrast-fixed", "true");
el.style.setProperty(
    "outline",
    "3px solid #f59e0b",
    "important"
);

el.style.setProperty(
    "outline-offset",
    "3px",
    "important"
);

el.setAttribute(
    "title",
    "Contrast accessibility fixed"
);
        return true;
    },

    isKeyboardFocusable: function (el) {
        if (!el || el.disabled) return false;

        const tabindex = el.getAttribute("tabindex");
        if (tabindex !== null) {
            return Number(tabindex) >= 0;
        }

        return el.matches(
            "a[href], button, input, textarea, select, summary, iframe, [contenteditable='true']"
        );
    },

    hasInteractiveRole: function (el) {
        const role = el.getAttribute("role");

        return [
            "button",
            "link",
            "menuitem",
            "tab",
            "checkbox",
            "switch",
            "radio"
        ].includes(role);
    },

    looksInteractive: function (el) {
        if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") {
            return false;
        }

        if (el.matches("button, input, textarea, select, a[href]")) {
            return true;
        }

      

        return !!(
              typeof el.onclick === "function" ||
    el.hasAttribute("onclick") ||
    this.hasInteractiveRole(el)
            
        );
    },

hasAccessibleName: function(el) {

    if (!el) return false;

    // aria-label
    const ariaLabel =
        el.getAttribute("aria-label");

    if (
        ariaLabel &&
        ariaLabel.trim().length > 0
    ) {
        return true;
    }

    // aria-labelledby
    const labelledby =
        el.getAttribute("aria-labelledby");

    if (labelledby) {

        const ids =
            labelledby.split(" ");

        for (const id of ids) {

            const ref =
                document.getElementById(id);

            if (
                ref &&
                ref.innerText.trim().length > 0
            ) {
                return true;
            }
        }
    }

    // gerçek label
    const label =
        el.closest("label") ||
        document.querySelector(
            `label[for="${el.id}"]`
        );

    if (
        label &&
        label.innerText.trim().length > 0
    ) {
        return true;
    }

    // button text
    const text =
        (
            el.innerText ||
            el.textContent ||
            el.value ||
            ""
        )
        .trim();

    if (text.length > 0) {
        return true;
    }

    // img alt
    if (
        el.tagName === "IMG" &&
        el.alt &&
        el.alt.trim().length > 0
    ) {
        return true;
    }

    // title fallback
    const title =
        el.getAttribute("title");

    if (
        title &&
        title.trim().length > 0
    ) {
        return true;
    }

    return false;
},
isDecorativeElement: function(el) {

    if (!el)
        return true;

    if (
        el.getAttribute("aria-hidden")
        === "true"
    ) {
        return true;
    }

    if (
        el.getAttribute("role")
        === "presentation"
    ) {
        return true;
    }

    return false;
},
hasVisibleFocusIndicator: function(el) {

    if (!el) return true;

    try {

        const style =
            window.getComputedStyle(el);

        // SADECE gerçek focus indicatorları

        const outlineVisible =

            style.outlineStyle !== "none" &&

            parseFloat(style.outlineWidth) >= 2;

        const shadowVisible =

            style.boxShadow &&
            style.boxShadow !== "none" &&
            !style.boxShadow.includes(
                "rgba(0, 0, 0, 0)"
            );

        // Apple/Tailwind wrapper sistemleri
        const parent =
            el.parentElement;

        let parentFocus = false;

        if (parent) {

            const p =
                window.getComputedStyle(
                    parent
                );

            parentFocus =

                (
                    p.outlineStyle !== "none" &&
                    parseFloat(
                        p.outlineWidth
                    ) >= 2
                ) ||

                (
                    p.boxShadow &&
                    p.boxShadow !== "none"
                );
        }

        return (

            outlineVisible ||

            shadowVisible ||

            parentFocus
        );

    } catch(err) {

        return true;}
    },
    applyFocusIndicator: function (el) {
        if (!el || !el.style) return false;

        el.setAttribute("data-ea-focus-fixed", "true");
        el.style.setProperty("outline-offset", "3px", "important");

        if (!el.__eaFocusInHandler) {
            el.__eaFocusInHandler = () => {
                el.style.setProperty("outline", "3px solid #2563eb", "important");
                el.style.setProperty("box-shadow", "0 0 0 4px rgba(37,99,235,0.25)", "important");
            };
        }

        if (!el.__eaFocusOutHandler) {
            el.__eaFocusOutHandler = () => {
                el.style.removeProperty("outline");
                el.style.removeProperty("box-shadow");
            };
        }

        el.removeEventListener("focusin", el.__eaFocusInHandler);
        el.addEventListener("focusin", el.__eaFocusInHandler);
        el.removeEventListener("focusout", el.__eaFocusOutHandler);
        el.addEventListener("focusout", el.__eaFocusOutHandler);

        return true;
    },

    fixKeyboardElement: function (el) {
        if (!el || !el.style) return false;

        if (el.closest("a, button") && !el.matches("a, button")) {
            el.setAttribute("tabindex", "-1");
            return true;
        }

        const safeFocusable =

    el.matches(`
        div,
        span,
        [role="button"],
        [role="link"],
        [onclick]
    `);

if (
    safeFocusable &&
    !this.isKeyboardFocusable(el)
) {

    el.setAttribute(
        "tabindex",
        "0"
    );
}

        if (!this.hasInteractiveRole(el)) {
            const href = el.getAttribute("href");
            el.setAttribute("role", href ? "link" : "button");
        }

        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("cursor", "pointer", "important");
        el.setAttribute("data-ea-keyboard-fixed", "true");
        el.setAttribute(
    "data-ea-keyboard-fixed",
    "true"
);

el.style.setProperty(
    "outline",
    "3px solid #22c55e",
    "important"
);

el.style.setProperty(
    "outline-offset",
    "3px",
    "important"
);

el.setAttribute(
    "title",
    "Keyboard accessibility fixed"
);

        this.applyFocusIndicator(el);

        if (!el.__eaKeyboardHandler) {
            el.__eaKeyboardHandler = (event) => {
                const role = el.getAttribute("role");
                
                if (role === "tab") {

    const tabs = Array.from(
        el.parentElement?.querySelectorAll(
            '[role="tab"]'
        ) || []
    );

    const currentIndex =
        tabs.indexOf(el);

    if (event.key === "ArrowRight") {

        event.preventDefault();

        tabs[
            (currentIndex + 1) %
            tabs.length
        ]?.focus();

        return;
    }

    if (event.key === "ArrowLeft") {

        event.preventDefault();

        tabs[
            (currentIndex - 1 + tabs.length) %
            tabs.length
        ]?.focus();

        return;
    }
}
                
                const shouldClick =
                    event.key === "Enter" ||
                    (event.key === " " && role !== "link");

                if (!shouldClick) return;

                event.preventDefault();
                el.click();
            };
        }

        el.removeEventListener("keydown", el.__eaKeyboardHandler);
        el.addEventListener("keydown", el.__eaKeyboardHandler);

        return true;
    },

    enableExistingCaptions: function (video) {// ... track kontrolleri kalsın ...

    const youtubeCC = document.querySelector(".ytp-subtitles-button");
    if (youtubeCC) {
        // Eğer CC butonu varsa ama aktif değilse, tıkla!
        if (youtubeCC.getAttribute("aria-pressed") === "false") {
            youtubeCC.click();
            return true; // Altyazıyı açtık, AI'a gerek yok
        }
        return true; // Zaten açıksa sorun yok
    }
    return false; },

    ensureCaptionApiKey: function () {
        if (EAApp.state.captionApiKey) return true;

        const key = window.prompt(
            "Altyazı oluşturmak için Google Gemini API anahtarını girin. Kısa ses parçaları gönderilir; tüm video tek seferde işlenmez."
        );

        if (!key?.trim()) return false;

        EAApp.state.captionApiKey = key.trim();
        EAApp.saveState();

        return true;
    },

    getCaptionWorkVideo: async function (video) {
        return { video, cleanup: () => {}, usesOriginal: true };

        const source = video.currentSrc || video.src;

        if (!source || source.startsWith("blob:")) {
            return { video, cleanup: () => {}, usesOriginal: true };
        }

        const clone = document.createElement("video");
        clone.src = source;
        clone.crossOrigin = video.crossOrigin || "anonymous";
        clone.muted = true;
        clone.playsInline = true;
        clone.preload = "auto";
        clone.style.cssText =
            "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";

        document.body.appendChild(clone);

        try {
            await new Promise((resolve, reject) => {
                const done = () => {
                    clone.removeEventListener("loadedmetadata", done);
                    clone.removeEventListener("error", fail);
                    resolve();
                };

                const fail = () => {
                    clone.removeEventListener("loadedmetadata", done);
                    clone.removeEventListener("error", fail);
                    reject(new Error("Video kopyası yüklenemedi."));
                };

                clone.addEventListener("loadedmetadata", done, { once: true });
                clone.addEventListener("error", fail, { once: true });

                if (clone.readyState >= 1) done();
            });

            clone.currentTime = Math.max(0, video.currentTime || 0);

            return {
                video: clone,
                cleanup: () => clone.remove(),
                usesOriginal: false
            };
        } catch (error) {
            clone.remove();
            return { video, cleanup: () => {}, usesOriginal: true };
        }
    },

    getVideoCaptureStream: function (video) {
        const capture =
            video.captureStream ||
            video.mozCaptureStream;

        if (!capture) {
            throw new Error("Bu tarayıcı video sesini yakalamayı desteklemiyor.");
        }

        const stream = capture.call(video);
        const audioTracks = stream.getAudioTracks();

        if (!audioTracks.length) {
            throw new Error("Videoda yakalanabilir ses kanalı bulunamadı.");
        }

        return new MediaStream(audioTracks);
    },

    getSupportedAudioMimeType: function () {
        const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            "audio/mp4"
        ];

        return candidates.find(type =>
            window.MediaRecorder &&
            MediaRecorder.isTypeSupported(type)
        ) || "";
    },

    recordCaptionChunk: function (video, seconds) {
        return new Promise((resolve, reject) => {
            let recorder;
            let timer;
            let stream;
            const chunks = [];
            const start = video.currentTime || 0;
            const remaining = Number.isFinite(video.duration)
                ? Math.max(1, video.duration - start)
                : seconds;
            const duration = Math.min(seconds, remaining);

            try {
                stream = this.getVideoCaptureStream(video);
                const mimeType = this.getSupportedAudioMimeType();
                recorder = new MediaRecorder(
                    stream,
                    mimeType ? { mimeType } : undefined
                );
            } catch (error) {
                reject(error);
                return;
            }

            const cleanup = () => {
                clearTimeout(timer);
                video.removeEventListener("ended", stopRecording);
                stream.getTracks().forEach(track => track.stop());
            };

            const stopRecording = () => {
                if (recorder.state !== "inactive") {
                    recorder.stop();
                }
            };

            recorder.ondataavailable = event => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onerror = event => {
                cleanup();
                reject(event.error || new Error("Ses kaydı alınamadı."));
            };

            recorder.onstop = () => {
                cleanup();
                const type = recorder.mimeType || "audio/webm";
                resolve({
                    blob: new Blob(chunks, { type }),
                    start,
                    end: Math.min(start + duration, video.duration || start + duration),
                    mimeType: type
                });
            };

            recorder.start();
            video.addEventListener("ended", stopRecording, { once: true });
            timer = setTimeout(() => {
                stopRecording();
            }, duration * 1000);
        });
    },

    blobToBase64: function (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const result = String(reader.result || "");
                resolve(result.split(",")[1] || "");
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    },

    normalizeCaptionMimeType: function (mimeType) {
        const base =
            String(mimeType || "audio/webm")
                .split(";")[0]
                .toLowerCase();

        if (base === "audio/webm") return "video/webm";
        if (base === "audio/mp4") return "video/mp4";

        return base;
    },

    transcribeCaptionChunk: async function (chunk) {
        const audioData = await this.blobToBase64(chunk.blob);

        if (!audioData) return [];

        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" +
            encodeURIComponent(EAApp.state.captionApiKey);

        const data = await EAAI.fetchFromBackground(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    'Transcribe speech. Return only compact JSON: [[start,end,"text"]]. start/end are seconds inside this audio. Merge tiny fragments. Empty array for no speech.'
                            },
                            {
                                inline_data: {
                                    mime_type: this.normalizeCaptionMimeType(chunk.mimeType),
                                    data: audioData
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 256,
                    responseMimeType: "application/json"
                }
            })
        });

        const text =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                ?.join("")
                ?.trim() || "";

        return this.parseCaptionSegments(text, chunk);
    },

    parseCaptionSegments: function (text, chunk) {
        if (!text) return [];

        const jsonText =
            text.match(/\[[\s\S]*\]/)?.[0] ||
            "";

        try {
            const parsed = JSON.parse(jsonText);

            return parsed
                .map(item => {
                    if (Array.isArray(item)) {
                        return {
                            start: Number(item[0]),
                            end: Number(item[1]),
                            text: String(item[2] || "").trim()
                        };
                    }

                    return {
                        start: Number(item.start),
                        end: Number(item.end),
                        text: String(item.text || item.caption || "").trim()
                    };
                })
                .filter(item =>
                    item.text &&
                    Number.isFinite(item.start) &&
                    Number.isFinite(item.end)
                );
        } catch (error) {
            const clean = text
                .replace(/```json|```/g, "")
                .trim();

            return clean
                ? [{ start: 0, end: Math.max(1, chunk.end - chunk.start), text: clean }]
                : [];
        }
    },

    getYouTubeCaptionUrl: function () {
        const url = new URL(location.href);

        if (!/youtube\.com$|youtube\.com\.|youtu\.be$/.test(url.hostname)) {
            return null;
        }

        if (url.hostname.includes("youtu.be")) {
            const id = url.pathname.replace("/", "").trim();
            return id ? `https://www.youtube.com/watch?v=${id}` : null;
        }

        const id = url.searchParams.get("v");
        return id ? `https://www.youtube.com/watch?v=${id}` : null;
    },

    transcribeVideoUrl: async function (video) {const pageUrl = this.getYouTubeCaptionUrl();
        if (!pageUrl) return 0;

        const start = Math.max(0, Math.floor(video.currentTime || 0));
        const end = start + 60;
        
        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(EAApp.state.captionApiKey);

        this.showCaptionStatus(video, "Sesi dinliyor ve altyazı üretiyor... (Lütfen bekleyin)");

        const payload = {
            contents: [{ parts: [{ text: `Here is a YouTube video URL: ${pageUrl}\n\nPlease transcribe the spoken audio strictly from ${start} seconds to ${end} seconds. Return ONLY a valid JSON array of objects with 'start', 'end', and 'text' keys. Example: [{"start": 0.5, "end": 2.0, "text": "Hello"}]. All timestamps must be relative to the segment start (i.e. start counting from 0). If there is no speech, return an empty array []. Do not include markdown formatting.` }] }],
            generationConfig: { temperature: 0, responseMimeType: "application/json" }
        };

        let data;
        try {
            data = await EAAI.fetchFromBackground(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        } catch (error) {
            console.error("Gemini API hatası:", error);
            this.clearCaptionStatus(video);
            return 0;
        }

        const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "")?.join("")?.trim() || "";
        const chunk = { start, end, mimeType: "video/mp4" };
        const segments = this.parseCaptionSegments(text, chunk);

        segments.forEach(s => { if (s.start >= start && start > 0) { s.start -= start; s.end -= start; } });

        const added = this.addCaptionSegments(video, chunk, segments);
        this.clearCaptionStatus(video);
        return added;},

    ensureCaptionOverlay: function (video) {if (video.__eaCaptionOverlay) return video.__eaCaptionOverlay;

        const overlay = document.createElement("div");
        overlay.className = "ea-generated-caption-overlay";
        
        // Z-Index ile altta kalmasını önler ve mutlak pozisyon sağlar
        overlay.style.cssText = [
            "position:absolute !important",
            "left:50% !important",
            "bottom:15% !important",
            "transform:translateX(-50%) !important",
            "max-width:90% !important",
            "padding:10px 18px !important",
            "border-radius:8px !important",
            "background:rgba(0,0,0,0.85) !important",
            "color:#fff !important",
            "font:700 22px/1.4 Arial,sans-serif !important",
            "text-align:center !important",
            "text-shadow:0 2px 4px rgba(0,0,0,0.8) !important",
            "z-index:2147483647 !important",
            "pointer-events:none !important",
            "display:none",
            "box-shadow:0 8px 24px rgba(0,0,0,0.5) !important",
            "white-space:pre-wrap !important"
        ].join(";");

        // BODY YERİNE VİDEONUN KAPSAYICISINA EKLİYORUZ (Tam ekran olunca kaybolmaması için)
        const container = video.closest('.html5-video-player') || video.parentElement || document.body;
        container.appendChild(overlay);
        
        video.__eaCaptionOverlay = overlay;

        const update = () => this.renderCaptionOverlay(video);
        video.__eaCaptionOverlayUpdate = update;

        // Daha Hızlı FPS Senkronizasyonu
        const loop = () => {
            if(video.__eaCaptionOverlay) {
                update();
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);

        return overlay;},

    positionCaptionOverlay: function (video, overlay) {// Artık CSS ile absolute konumlandırdığımız için sürekli piksel hesaplamaya gerek yok
        overlay.style.width = "max-content";},

    renderCaptionOverlay: function (video) {
        const overlay = this.ensureCaptionOverlay(video);
        const segments = video.__eaCaptionSegments || [];
        const current = video.currentTime || 0;
        const active = segments.find(segment =>
            current >= segment.start &&
            current <= segment.end
        );

        this.positionCaptionOverlay(video, overlay);

        if (active) {
            overlay.textContent = active.text;
            overlay.style.display = "block";
        } else if (!overlay.getAttribute("data-ea-status")) {
            overlay.style.display = "none";
        }
    },

    showCaptionStatus: function (video, message) {
        const overlay = this.ensureCaptionOverlay(video);
        overlay.setAttribute("data-ea-status", "true");
        overlay.textContent = message;
        this.positionCaptionOverlay(video, overlay);
        overlay.style.display = "block";
    },

    clearCaptionStatus: function (video) {
        const overlay = video.__eaCaptionOverlay;
        if (!overlay) return;

        overlay.removeAttribute("data-ea-status");
        this.renderCaptionOverlay(video);
    },

    getGeneratedCaptionTrack: function (video) {
        if (video.__eaGeneratedCaptionTrack) {
            video.__eaGeneratedCaptionTrack.mode = "showing";
            return video.__eaGeneratedCaptionTrack;
        }

        const track = video.addTextTrack(
            "captions",
            "Oluşturulan Altyazı",
            "tr"
        );

        track.mode = "showing";
        video.__eaGeneratedCaptionTrack = track;

        return track;
    },

    addCaptionSegments: function (video, chunk, segments) {
        const Cue = window.VTTCue || window.TextTrackCue;
        const track = Cue ? this.getGeneratedCaptionTrack(video) : null;
        video.__eaCaptionSegments = video.__eaCaptionSegments || [];
        let added = 0;

        segments.forEach(segment => {
            const start = Math.max(0, chunk.start + segment.start);
            const end = Math.max(start + 0.75, chunk.start + segment.end);
            const text = segment.text.replace(/\s+/g, " ").trim();

            if (!text) return;

            const duplicate =
                video.__eaCaptionSegments.some(cue =>
                    Math.abs(cue.start - start) < 0.25 &&
                    cue.text === text
                ) ||
                (
                    track?.cues &&
                    Array.from(track.cues).some(cue =>
                        Math.abs(cue.startTime - start) < 0.25 &&
                        cue.text === text
                    )
                );

            if (duplicate) return;

            if (track && Cue) {
                track.addCue(new Cue(start, end, text));
            }
            video.__eaCaptionSegments.push({ start, end, text });
            added++;
        });

        video.__eaCaptionSegments.sort((a, b) => a.start - b.start);
        this.ensureCaptionOverlay(video);
        this.renderCaptionOverlay(video);

        return added;
    },

    fixMissingCaptions: async function (
        videos, options = {}) {const allowAI = options.allowAI !== false;
        let fixedCount = 0;

        for (const video of videos) {
            if (this.enableExistingCaptions(video)) {
                fixedCount++;
                continue;
            }

            if (!allowAI) continue;

            if (!this.ensureCaptionApiKey()) {
                return fixedCount;
            }
            
            // YOUTUBE KONTROLÜ
            const isYouTube = this.getYouTubeCaptionUrl() !== null;

            if (isYouTube) {try {
                    const urlCaptionCount = await this.transcribeVideoUrl(video);
                    fixedCount += urlCaptionCount;
                } catch (error) {
                    console.warn("API hatası:", error);
                }
                continue;}

            if (!window.MediaRecorder) {
                throw new Error("Bu tarayıcı MediaRecorder desteklemediği için altyazı oluşturulamıyor.");
            }

            // DİĞER VİDEOLAR İÇİN (Yerel veya standart HTML5 videoları)
            try {
                const work = await this.getCaptionWorkVideo(video);
                const chunk = await this.recordCaptionChunk(work.video, 60);
                const segments = await this.transcribeCaptionChunk(chunk);
                const added = this.addCaptionSegments(video, chunk, segments);
                fixedCount += added;
                work.cleanup();
            } catch (err) {
                console.error("Yerel video altyazı hatası:", err);
            }
        }

        return fixedCount;
    },

    resetScoreSession: function () {
        this.scoreSession = {
            pageKey: `${location.origin}${location.pathname}${location.search}`,
            baselineMetrics: {},
            bestRatios: {},
            interventionStarted: false,
            publishedScores: null,
            rawScores: null
        };
    },

    beginScoreIntervention: function () {
        const pageKey = `${location.origin}${location.pathname}${location.search}`;
        if (!this.scoreSession || this.scoreSession.pageKey !== pageKey) {
            this.resetScoreSession();
        }

        // Düzeltme başlamadan hemen önce güncel sayfa yapısını taban kabul et.
        // Böylece sonradan yüklenen form alanları düzeltmeden sonra "yeni hata" gibi görünmez.
        this.scoreSession.interventionStarted = true;
        this.scoreSession.bestRatios = {};

        Object.entries(this.scoreSession.baselineMetrics || {}).forEach(([key, value]) => {
            if (value && Number.isFinite(Number(value.ratio))) {
                this.scoreSession.bestRatios[key] = Number(value.ratio);
            }
        });
    },

    getStableViolationRatio: function (metricKey, errorCount, totalCount) {
        const errors = Math.max(0, Number(errorCount) || 0);
        const total = Math.max(0, Number(totalCount) || 0);

        // Rapordaki deterministik yaklaşım: skor her denetimde mevcut DOM ve
        // davranış verilerinden yeniden hesaplanır. Önceki skor veya sürüm
        // sonucu yeni hesaba taşınmaz.
        if (total <= 0) {
            return null;
        }

        return Math.min(1, Math.max(0, errors / total));
    },

    calculateWeightedSubScore: function (category, metrics) {
        const weights = this.scoreConfig.metricWeights[category] || {};
        let weightedViolation = 0;
        let applicableWeight = 0;

        Object.entries(weights).forEach(([metricKey, rawWeight]) => {
            const weight = Number(rawWeight) || 0;
            if (weight <= 0) return;

            const rawRatio = metrics ? metrics[metricKey] : null;
            if (rawRatio === null || rawRatio === undefined || !Number.isFinite(Number(rawRatio))) {
                return;
            }

            const ratio = Math.min(1, Math.max(0, Number(rawRatio)));
            weightedViolation += weight * ratio;
            applicableWeight += weight;
        });

        // İlgili boyutta ölçülebilir öğe yoksa yapay biçimde 100 puan verme.
        if (applicableWeight <= 0) return null;

        const normalizedViolation = weightedViolation / applicableWeight;
        return Math.round(100 * (1 - normalizedViolation));
    },

    stabilizeOEK4Scores: function (rawScores) {
        const normalizeScore = (value) => {
            if (value === null || value === undefined || !Number.isFinite(Number(value))) {
                return null;
            }
            return Math.min(100, Math.max(0, Math.round(Number(value))));
        };

        const scores = {
            vision: normalizeScore(rawScores.vision),
            hearing: normalizeScore(rawScores.hearing),
            cognitive: normalizeScore(rawScores.cognitive),
            motor: normalizeScore(rawScores.motor)
        };

        const weights = this.scoreConfig.categoryWeights;
        let weightedTotal = 0;
        let applicableWeight = 0;

        ["vision", "hearing", "cognitive", "motor"].forEach((category) => {
            const score = scores[category];
            const weight = Number(weights[category]) || 0;
            if (score === null || weight <= 0) return;

            weightedTotal += score * weight;
            applicableWeight += weight;
        });

        // Değerlendirilemeyen boyutlar genel skoru ücretsiz puanla yükseltmez.
        // Kalan boyutların ağırlıkları kendi toplamları içinde normalize edilir.
        scores.general = applicableWeight > 0
            ? Math.round(weightedTotal / applicableWeight)
            : 0;

        this.scoreSession.rawScores = { ...scores };
        this.scoreSession.publishedScores = { ...scores };

        return scores;
    },

    refresh: function () {
        const findings = [];
        const isPageNode = (node) => node && !this.isAssistantNode(node);
        const auditDocuments = this.getAccessibleAuditDocuments();
        const auditable = (selector) =>
            auditDocuments.flatMap((doc) => {
                try {
                    return Array.from(doc.querySelectorAll(selector));
                } catch (_) {
                    return [];
                }
            }).filter((el) => this.isAuditableElement(el));
// ======================

        // VIDEO / ALTYAZI KONTROLÜ

        const videos = auditable("video");

        const inaccessibleVideos =
            videos.filter(video => {

                // HTML5 subtitle
                const tracks =
                    video.querySelectorAll("track");

                const hasTextTrack =
                    tracks.length > 0 ||
                    Array.from(video.textTracks || []).some(track =>
                        track.mode === "showing" ||
                        (track.cues && track.cues.length > 0)
                    );

                // YouTube CC
                const ytCC =
                    document.querySelector(
                        ".ytp-subtitles-button"
                    );

                const hasYoutubeCC =
                    ytCC &&
                    ytCC.getAttribute(
                        "aria-pressed"
                    ) === "true";

                return (
                    !hasTextTrack &&
                    !hasYoutubeCC
                );
            });

        // if (inaccessibleVideos.length) {

           // findings.push({

               //  group: "hearing",

               //  title:
               //      "Videoda Altyazı Bulunmuyor",

               //  detail:
                //     `${inaccessibleVideos.length} medya içeriğinde erişilebilir altyazı tespit edilemedi.`,

               //  nodes: inaccessibleVideos
           //  });
        // }
        // KÜÇÜK TIKLAMA ALANI DENETİMİ

        const clickable = auditable("button, a, [role='button']");

        const smallTargets =
            clickable.filter(el => {
                if (el.hasAttribute("data-ea-small-target-fixed")) {
                    return false;
                }

                const rect =
                    el.getBoundingClientRect();

                const style =
                    window.getComputedStyle(el);

                const minW =
                    parseFloat(style.minWidth) || 0;

                const minH =
                    parseFloat(style.minHeight) || 0;

                const effectiveWidth =
                    Math.max(rect.width, minW);

                const effectiveHeight =
                    Math.max(rect.height, minH);

                return (
                    effectiveWidth > 0 &&
                    effectiveHeight > 0 &&
                    (effectiveWidth < 44 ||
                    effectiveHeight < 44)
                );
            });

        if (smallTargets.length) {

            findings.push({

                group: "motor",

                title:
                    "Küçük Tıklama Alanları",

                detail:
                    `${smallTargets.length} adet küçük etkileşim alanı tespit edildi.`,

                nodes: smallTargets
            });
        }
        // UZUN PARAGRAF DENETİMİ

        const paragraphs = auditable("p");

        const longParagraphs =
            paragraphs.filter(p => {

                const text =
                    p.innerText.trim();

                return text.length > 450;
            });

        if (longParagraphs.length) {

            findings.push({

                group: "cognitive",

                title:
                    "Uzun ve Yoğun Paragraflar",

                detail:
                    `${longParagraphs.length} adet uzun paragraf bilişsel yük oluşturabilir.`,

                nodes: longParagraphs
            });
        }
       

        // BAŞLIK HİYERARŞİSİ DENETİMİ
        // OEK4_revize'deki özellik çıkarımı adımında belirtilen başlık hiyerarşisi bozuklukları denetlenir.
        const headings = auditable("h1, h2, h3, h4, h5, h6");

        const headingProblems = [];
        let previousHeadingLevel = 0;

        headings.forEach(heading => {
            const level = this.getHeadingLevel(heading);

            if (previousHeadingLevel && level - previousHeadingLevel > 1) {
                headingProblems.push(heading);
            }

            previousHeadingLevel = level;
        });

        if (headings.length && !headings.some(h => this.getHeadingLevel(h) === 1)) {
            headingProblems.push(headings[0]);
        }

        if (headingProblems.length) {
            findings.push({
                group: "semantic",
                type: "heading-hierarchy",
                title: "Başlık Hiyerarşisi Bozuk",
                detail: `${headingProblems.length} başlık öğesinde hiyerarşi atlaması veya H1 eksikliği tespit edildi.`,
                nodes: headingProblems
            });
        }

        // SEMANTİK BÖLGE / LANDMARK DENETİMİ
        // main/nav/header/footer/aside/section/article gibi anlamsal bölgeler rapordaki yapısal veri çıkarımıyla ilişkilidir.
        const hasMainLandmark = !!document.querySelector("main, [role='main']");
        const hasNavigationLandmark = !!document.querySelector("nav, [role='navigation']");
        const hasSemanticContainer = !!document.querySelector("main, nav, header, footer, aside, section, article, [role='main'], [role='navigation'], [role='banner'], [role='contentinfo']");
        const pageTextLength = (document.body?.innerText || "").replace(/\s+/g, " ").trim().length;

        if (pageTextLength > 600 && (!hasMainLandmark || !hasSemanticContainer)) {
            findings.push({
                group: "semantic",
                type: "semantic-landmark",
                title: "Semantik Bölge Eksikliği",
                detail: `Sayfada ${!hasMainLandmark ? "ana içerik bölgesi" : "yeterli semantik bölge"} tespit edilemedi.`,
                nodes: [document.body]
            });
        }

        if (pageTextLength > 1000 && !hasNavigationLandmark) {
            findings.push({
                group: "semantic",
                type: "navigation-landmark",
                title: "Navigasyon Landmark Eksikliği",
                detail: "Yoğun içerikli sayfada nav veya role='navigation' yapısı bulunamadı.",
                nodes: [document.body]
            });
        }

        // ODAK SIRASI DENETİMİ
        // Pozitif tabindex değerleri doğal odak sırasını bozabileceği için rapordaki odak sırası ihlali göstergesine dahil edilir.
        const positiveTabindex = auditable("[tabindex]").filter(el => {
            if (!this.isAuditableElement(el)) return false;
            const value = Number(el.getAttribute("tabindex"));
            return Number.isFinite(value) && value > 0;
        });

        if (positiveTabindex.length) {
            findings.push({
                group: "motor",
                type: "focus-order",
                title: "Doğal Olmayan Odak Sırası",
                detail: `${positiveTabindex.length} öğede pozitif tabindex kullanımı odak sırasını bozabilir.`,
                nodes: positiveTabindex
            });
        }

        // RENK KONTRAST DENETİMİ

        const textElements = auditable(
            "p, span, a, button, li, label, strong, em, small, h1, h2, h3, h4, h5, h6"
        ).filter(el => this.hasReadableText(el));

        const lowContrast =
            textElements.filter(el => {
                const info = this.getContrastInfo(el);
                return info && info.ratio < info.minimum;
            });

        if (lowContrast.length) {

            findings.push({

                group: "vision",

                title:
                    "Yetersiz Renk Kontrastı",

                detail:
                    `${lowContrast.length} metin alanında düşük kontrast tespit edildi.`,

                nodes: lowContrast
            });
        }
        // 🔍 GÖRME SKORU KESİN ÇÖZÜM: Gerçekten önemli olan resimleri bul
const allImages = [
    ...auditable("img"),
    ...auditable("div, section, article, a").filter(el => {
        const bg = this.getElementWindow(el).getComputedStyle(el).backgroundImage;
        return bg && bg !== "none" && bg.includes("url(");
    })
];
        const meaningfulImages = allImages.filter(img => {
            // 1. Asistanın kendi arayüzünü her zaman geç
            if (this.isAssistantNode(img)) return false;

            // 2. KRİTİK: Resmin fiziksel boyutuna bak (60x60 altındaki ikonları görmezden gel)
            // YouTube'daki like, bildirim ve küçük profil ikonları burada elenir.
const width =
    img.naturalWidth ||
    img.offsetWidth;

const height =
    img.naturalHeight ||
    img.offsetHeight;

if (
    width < 60 ||
    height < 60
) {
    return false;
}
            // 3. Görünürlük kontrolü (Ekrandan gizlenmiş teknik resimleri eler)
            const style = this.getElementWindow(img).getComputedStyle(img);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === "0") return false;

            // 4. WCAG: Zaten dekoratif işaretlenmişse hata sayma
const isDecorative = img.getAttribute("aria-hidden") === "true" || img.getAttribute("role") === "presentation";
            if (isDecorative && width < 250) { 
                return false;
            }
            return true;
        });

        // HATA: 'alt' özniteliği HİÇ tanımlanmamış olanlar (alt="" olanlar hata değildir, dekoratiftir)
       const missingAlt = meaningfulImages.filter(img => {

    const isImg =
        img.tagName === "IMG";

    // BACKGROUND IMAGE VAR MI
    const bg =
        window.getComputedStyle(img)
            .backgroundImage;

    const hasBgImage =
        bg &&
        bg !== "none" &&
        bg.includes("url(");

    // DEKORATİF Mİ
    // DEKORATİF Mİ
    const decorative =
        img.getAttribute("role") === "presentation" ||
        img.getAttribute("aria-hidden") === "true";
    
    const imgWidth = img.naturalWidth || img.offsetWidth;

    // Görsel devasa ise dekoratif etiketini yok say ve alt metin eksikliği olarak bildir!
    if (decorative && imgWidth < 250) {
        return false;
    }

    // NORMAL IMG
    if (isImg) {

        if (!img.hasAttribute("alt")) {
            return true;
        }

        const alt =
            img.getAttribute("alt")
                ?.trim();

        return !alt;
    }

    // BACKGROUND IMAGE
    if (hasBgImage) {

        const aria =
            img.getAttribute(
                "aria-label"
            );

        return (
            !aria ||
            !aria.trim()
        );
    }

    return false;
});

        if (missingAlt.length) {
            findings.push({
                group: "vision",
                title: "Önemli Görselde Açıklama Yok",
                nodes: missingAlt,
                detail: `${missingAlt.length} adet büyük içerik görselinde alt metin eksik.`
            });
        }
        // FORM LABEL DENETİMİ

        const formFields = auditable("input, textarea, select");
const filteredFields =
    formFields.filter(field => {

        // Extension panelini alma
        if (this.isAssistantNode(field)) {
            return false;
        }

        // CodePen console alma
        if (
            field.className?.includes(
                "console-command-line-input"
            )
        ) {
            return false;
        }

        return true;
    });
        const unlabeledFields =
    filteredFields.filter(field => {

                // Etiket denetimine tabi olmayan input türlerini alma.
                // Submit/button/reset zaten value ile erişilebilir ad taşır;
                // image input ise alt metin denetiminde ele alınır.
                const fieldType = String(field.type || "").toLowerCase();
                if (["hidden", "submit", "button", "reset", "image"].includes(fieldType)) {
                    return false;
                }

                // görünmeyen alma
                const style =
                    this.getElementWindow(field).getComputedStyle(field);

                if (
                    style.display === "none" ||
                    style.visibility === "hidden"
                ) {
                    return false;
                }

                // label kontrolü
                const hasLabel =
                    field.labels &&
                    field.labels.length > 0;

                // aria-label kontrolü
                const aria =
                    field.getAttribute(
                        "aria-label"
                    );

                // placeholder tek başına yeterli değil
                return !hasLabel && !aria;
            });

        if (unlabeledFields.length) {

            findings.push({

                group: "form",

                title:
                    "Form Etiketi Eksik",
type:
    "missing-form-label",
                detail:
                    `${unlabeledFields.length} adet form alanında erişilebilir label bulunamadı.`,

                nodes: unlabeledFields
            });
        }
       

        // İsimsiz button kontrolü
        const iconButtons = auditable("button").filter(btn => {
                if (!this.isAuditableElement(btn)) return false;

                const text =
                    btn.innerText.trim();

                const aria =
                    btn.getAttribute(
                        "aria-label"
                    );

              const rect =
    btn.getBoundingClientRect();

const uselessClass =
    /indicator|slider|carousel|bullet|dot/i
        .test(btn.className);

const hidden =
    rect.width < 24 ||
    rect.height < 24;

const labelledBy =
    btn.getAttribute(
        "aria-labelledby"
    );

const title =
    btn.getAttribute(
        "title"
    );

const hasAccessibleName =

    text.length > 0 ||

    !!aria ||

    !!labelledBy ||

    !!title;
    const role =
    btn.getAttribute(
        "role"
    );

const isSwitch =
    role === "switch";

return (

    !hasAccessibleName &&

    !uselessClass &&

    !hidden &&

    !isSwitch
);
            });

        if (iconButtons.length) {

            findings.push({

                group: "semantic",
type: "missing-aria-label",
                title:
                    "ARIA Label Eksik",

                detail:
                    `${iconButtons.length} butonda erişilebilir isim bulunamadı.`,

                nodes: iconButtons
            });
        }
// SCREEN READER DENETİMİ
        const srProblems = [];

        // 1. Boş button kontrolü (Artık aria-labelledby ve title'ı da anlıyor)
        const emptyButtons = auditable("button").filter(btn => {
            const text = btn.innerText.trim();
            const ariaLabel = btn.getAttribute("aria-label");
            const ariaLabelledBy = btn.getAttribute("aria-labelledby"); 
            const title = btn.getAttribute("title"); 
            
            // Eğer hiçbir isimlendirme metodu yoksa bu buton gerçekten boştur
            return (text.length === 0 && !ariaLabel && !ariaLabelledBy && !title);
        });
        srProblems.push(...emptyButtons);

        // 2. aria-hidden yanlış kullanımı (Devre dışı bırakılmışları ve gizlenmişleri ES GEÇ)
        const hiddenInteractive = auditable("[aria-hidden='true']").filter(el => {
            if (!isPageNode(el)) return false;
            // KRİTİK: Eleman disabled ise veya tabindex="-1" ile bilerek gizlenmişse ekran okuyucuya ZORLA OKUTMA!
            if (el.disabled || el.getAttribute("tabindex") === "-1") return false; 
            
            return (el.matches("button, a, input"));
        });
        srProblems.push(...hiddenInteractive);

        if (srProblems.length) {
            findings.push({
                group: "screenreader",
                title: "Screen Reader Problemi",
                detail: `${srProblems.length} element screen reader erişilebilirliği açısından problemli.`,
                nodes: srProblems
            });
        }

                        
        
        // KLAVYE ERİŞİM DENETİMİ

        const keyboardProblems = auditable(
            "div, span, a:not([href]), [role='button'], [role='link'], [role='menuitem'], [role='tab'], [onclick]"
        ).filter(el => {
                if (!this.isAuditableElement(el)) return false;
                if (!this.looksInteractive(el)) return false;
                if (el.matches("button, input, textarea, select, a[href]")) return false;
                if (el.closest("a, button") && !el.matches("a, button")) return false;

                const hasKeyboardHandler =
                    el.getAttribute("data-ea-keyboard-fixed") === "true" ||
                    !!el.onkeydown ||
                    !!el.getAttribute("onkeydown") ||
                    !!el.getAttribute("onkeyup") ||
                    !!el.getAttribute("onkeypress");
                    const role =
    el.getAttribute("role");

if (
    role === "tab"
) {
    return false;
}
const reasons = [];
if (
    el.getAttribute(
        "data-ea-keyboard-fixed"
        
    ) === "true"
) {
    return false;
}

if (!this.isKeyboardFocusable(el)) {
    reasons.push("tabindex/focus eksik");
}

if (!this.hasInteractiveRole(el)) {
    reasons.push("role eksik");
}

if (!hasKeyboardHandler) {
    reasons.push("keyboard event eksik");
}

el.setAttribute(
    "data-ea-keyboard-problems",
    reasons.join(", ")
);

console.log(
    "⌨️ Keyboard Sorunu:",
    el,
    reasons
);
                return (
                    !this.isKeyboardFocusable(el) ||
                    !this.hasInteractiveRole(el) ||
                    !hasKeyboardHandler
                );
            });

        if (keyboardProblems.length) {

            findings.push({

                group: "motor",

                title:
                    "Klavye Navigasyon Problemi",

                detail:
                    `${keyboardProblems.length} etkileşim alanı klavye erişimine uygun değil.`,

                nodes: keyboardProblems
            });
        }

        // FOCUS GÖSTERGESİ DENETİMİ

       const interactive = auditable(
        "button, a[href], input, textarea, select, [role='button'], [role='link'], [tabindex]:not([tabindex='-1'])"
    ).filter(el => {

        if (
            !this.isAuditableElement(el)
        ) {
            return false;
        }

        if (
            !this.isKeyboardFocusable(el)
        ) {
            return false;
        }

        const style =
            window.getComputedStyle(el);

        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
        ) {
            return false;
        }

        const rect =
            el.getBoundingClientRect();

        if (
            rect.width < 2 ||
            rect.height < 2
        ) {
            return false;
        }

        // Sayfa denetimi tüm belgeyi kapsar; scroll ile yukarıda kalan gerçek öğeler
        // bulgu sayısından düşürülmez. Böylece denetim sonucu panel kaydırıldıkça değişmez.

        return true;
    });

  const badFocus =
    interactive.filter(el => {

        if (
            el.getAttribute(
                "data-ea-focus-fixed"
            ) === "true"
        ) {
            return false;
        }

        const style =
            window.getComputedStyle(el);

        // SADECE gerçekten focus kaldırılmışsa hata
const removesOutline =

    style.outlineStyle === "none" ||

    style.outlineWidth === "0px";

const noShadow =

    !style.boxShadow ||
    style.boxShadow === "none";

// gerçekten clickable mı?
const trulyInteractive =

    el.matches(
        "button, a, [role='button'], [onclick]"
    );

// modern framework mü?
const hostname =
    location.hostname.toLowerCase();

const isModernSite =

    hostname.includes("apple.com") ||

    hostname.includes("google.com") ||

    hostname.includes("youtube.com") ||

    hostname.includes("github.com") ||

    hostname.includes("openai.com");

// Apple gibi siteleri geç

if (isModernSite) {
    return false;
}

return (
    trulyInteractive &&
    removesOutline &&
    noShadow
);
       });
        if (badFocus.length) {

            findings.push({

                group: "motor",

                title:
                    "Focus Göstergesi Eksik",

                detail:
                    `${badFocus.length} etkileşim alanında görünür focus göstergesi bulunamadı.`,

                nodes: badFocus
            });
        }

 
const totalIssues = findings.reduce(
            (sum, item) => sum + (item.nodes ? item.nodes.length : 1), 0
        );

      // İlk denetim sonucunu başlangıç değeri olarak sabitle.
        // Scroll sırasında görünür alan değişse bile iyileştirme yüzdesi kendiliğinden artıp azalmasın.
        if (EAApp.state.initialFindingCount === 0) {
            EAApp.state.initialFindingCount = totalIssues;
            EAApp.saveState();
        }

        // Güncel hata sayısını KATEGORİ sayısına göre değil, ELEMAN sayısına göre ata
        EAApp.state.currentIssueCount = totalIssues;
        this.findings = findings;
        // 📊 OEK-4 SKORLAMA
        // 1) Özellik çıkarımı
        // 2) Boyutsal alt skorlar: S = 100 × (1 - Σ(w_i × v_i) / Σw_i)
        // 3) Ağırlıklı genel skor: S_total = αS_g + βS_i + γS_b + δS_m
        // İlk denetimde paydalar ve başlangıç ihlal oranları sabitlenir.
        // Böylece sayfa büyüklüğü/dinamik DOM değişimleri skoru oynatmaz;
        // düzeltilebilen ihlaller azaldıkça skor yalnızca yukarı ilerler.

        const visibleFormFieldsForScore = filteredFields.filter(field => {
            if (field.type === "hidden") return false;
            const style = window.getComputedStyle(field);
            const rect = field.getBoundingClientRect();
            return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                style.opacity !== "0" &&
                rect.width > 0 &&
                rect.height > 0
            );
        });

        const keyboardCandidatesForScore = auditable(
            "div, span, a:not([href]), [role='button'], [role='link'], [role='menuitem'], [role='tab'], [onclick]"
        ).filter(el => {
            if (!this.isAuditableElement(el)) return false;
            if (!this.looksInteractive(el)) return false;
            if (el.matches("button, input, textarea, select, a[href]")) return false;
            if (el.closest("a, button") && !el.matches("a, button")) return false;
            return true;
        });

        const focusOrderCandidatesForScore = auditable(
            "[tabindex], button, a[href], input, textarea, select"
        );

        const mediaForScore = auditable("video, audio");
        let inaccessibleMediaCount = 0;

        mediaForScore.forEach(media => {
            let hasIssue = false;

            if (media.tagName === "VIDEO") {
                const tracks = media.querySelectorAll(
                    "track[kind='captions'], track[kind='subtitles']"
                );
                const activeTrack = Array.from(media.textTracks || []).some(track =>
                    track.mode === "showing" ||
                    (track.cues && track.cues.length > 0)
                );

                const isYouTube = location.hostname.includes("youtube.com");
                const youtubeCC = isYouTube
                    ? document.querySelector(".ytp-subtitles-button")
                    : null;
                const youtubeHasCC = youtubeCC &&
                    youtubeCC.getAttribute("aria-pressed") === "true";

                if (!tracks.length && !activeTrack && !youtubeHasCC) {
                    hasIssue = true;
                }
            }

            if (media.autoplay && !media.muted) {
                hasIssue = true;
            }

            if (hasIssue) inaccessibleMediaCount++;
        });

        const semanticIssueCount =
            (pageTextLength > 600 && (!hasMainLandmark || !hasSemanticContainer) ? 1 : 0) +
            (pageTextLength > 1000 && !hasNavigationLandmark ? 1 : 0);
        const semanticCheckCount =
            (pageTextLength > 600 ? 1 : 0) +
            (pageTextLength > 1000 ? 1 : 0);

        const currentDisorientation = Math.min(
            1,
            Math.max(0, Number(this.behaviorData.disorientationScore) || 0)
        );

        const visionMetrics = {
            missingAlt: this.getStableViolationRatio(
                "vision.missingAlt",
                missingAlt.length,
                meaningfulImages.length
            ),
            lowContrast: this.getStableViolationRatio(
                "vision.lowContrast",
                lowContrast.length,
                textElements.length
            ),
            missingFormLabel: this.getStableViolationRatio(
                "vision.missingFormLabel",
                unlabeledFields.length,
                visibleFormFieldsForScore.length
            )
        };

        const cognitiveMetrics = {
            longParagraph: this.getStableViolationRatio(
                "cognitive.longParagraph",
                longParagraphs.length,
                paragraphs.length
            ),
            headingHierarchy: this.getStableViolationRatio(
                "cognitive.headingHierarchy",
                headingProblems.length,
                headings.length
            ),
            semanticLandmark: this.getStableViolationRatio(
                "cognitive.semanticLandmark",
                semanticIssueCount,
                semanticCheckCount
            ),
            disorientation: this.getStableViolationRatio(
                "cognitive.disorientation",
                currentDisorientation,
                1
            )
        };

        const motorMetrics = {
            smallTarget: this.getStableViolationRatio(
                "motor.smallTarget",
                smallTargets.length,
                clickable.length
            ),
            keyboardAccess: this.getStableViolationRatio(
                "motor.keyboardAccess",
                keyboardProblems.length,
                keyboardCandidatesForScore.length
            ),
            focusOrder: this.getStableViolationRatio(
                "motor.focusOrder",
                positiveTabindex.length,
                focusOrderCandidatesForScore.length
            ),
            focusIndicator: this.getStableViolationRatio(
                "motor.focusIndicator",
                badFocus.length,
                interactive.length
            )
        };

        const hearingMetrics = {
            inaccessibleMedia: this.getStableViolationRatio(
                "hearing.inaccessibleMedia",
                inaccessibleMediaCount,
                mediaForScore.length
            )
        };

        const accessibleNameCandidates = [
            ...visibleFormFieldsForScore,
            ...auditable("button").filter(button => {
                const rect = button.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            })
        ];
        const accessibleNameErrors = unlabeledFields.length + iconButtons.length;
        const accessibleNameRatio = this.getStableViolationRatio(
            "vision.accessibleName",
            accessibleNameErrors,
            accessibleNameCandidates.length
        );

        const auditCriteria = [
            {
                id: "alt-text",
                title: "Görsel alternatif metinleri",
                dimension: "vision",
                weight: 0.14,
                total: meaningfulImages.length,
                errors: missingAlt.length,
                ratio: visionMetrics.missingAlt
            },
            {
                id: "contrast",
                title: "Renk kontrastı",
                dimension: "vision",
                weight: 0.13,
                total: textElements.length,
                errors: lowContrast.length,
                ratio: visionMetrics.lowContrast
            },
            {
                id: "accessible-names",
                title: "Form ve kontrol etiketleri",
                dimension: "vision",
                weight: 0.11,
                total: accessibleNameCandidates.length,
                errors: accessibleNameErrors,
                ratio: accessibleNameRatio
            },
            {
                id: "heading-hierarchy",
                title: "Başlık hiyerarşisi",
                dimension: "cognitive",
                weight: 0.09,
                total: headings.length,
                errors: headingProblems.length,
                ratio: cognitiveMetrics.headingHierarchy
            },
            {
                id: "semantic-landmarks",
                title: "Semantik bölgeler ve landmarklar",
                dimension: "cognitive",
                weight: 0.09,
                total: semanticCheckCount,
                errors: semanticIssueCount,
                ratio: cognitiveMetrics.semanticLandmark
            },
            {
                id: "small-targets",
                title: "Tıklama alanı boyutları",
                dimension: "motor",
                weight: 0.11,
                total: clickable.length,
                errors: smallTargets.length,
                ratio: motorMetrics.smallTarget
            },
            {
                id: "keyboard-access",
                title: "Klavye erişimi",
                dimension: "motor",
                weight: 0.12,
                total: keyboardCandidatesForScore.length,
                errors: keyboardProblems.length,
                ratio: motorMetrics.keyboardAccess
            },
            {
                id: "focus-order",
                title: "Odak sırası",
                dimension: "motor",
                weight: 0.07,
                total: focusOrderCandidatesForScore.length,
                errors: positiveTabindex.length,
                ratio: motorMetrics.focusOrder
            },
            {
                id: "focus-indicator",
                title: "Görünür odak göstergesi",
                dimension: "motor",
                weight: 0.08,
                total: interactive.length,
                errors: badFocus.length,
                ratio: motorMetrics.focusIndicator
            },
            {
                id: "captions",
                title: "Medya altyazısı ve ses kontrolü",
                dimension: "hearing",
                weight: 0.06,
                total: mediaForScore.length,
                errors: inaccessibleMediaCount,
                ratio: mediaForScore.length > 0 ? hearingMetrics.inaccessibleMedia : 0,
                emptyPass: true
            }
        ].map((criterion) => {
            const total = Math.max(0, Number(criterion.total) || 0);
            const errors = Math.max(0, Number(criterion.errors) || 0);
            const currentRatio = total > 0
                ? Math.min(1, Math.max(0, errors / total))
                : 0;

            const applicable = total > 0;
            const storedRatio = criterion.ratio;

            return {
                ...criterion,
                total,
                errors,
                applicable,
                currentRatio: applicable ? currentRatio : null,
                ratio: storedRatio === null || storedRatio === undefined || !Number.isFinite(Number(storedRatio))
                    ? null
                    : Number(storedRatio),
                // Arayüzde sorun kartı üretmemek için boş kriterler başarılı bilgi kartı olarak kalır;
                // ancak puan hesabına katılmaz.
                status: errors > 0 ? "fail" : "pass",
                message: errors > 0
                    ? `${errors} sorun / ${total} değerlendirilen öğe`
                    : applicable
                        ? `${total} öğe kontrol edildi; sorun bulunmadı.`
                        : "Bu kriter için değerlendirilecek öğe bulunmadı; puan hesabına katılmadı."
            };
        });

        const calculateCriteriaDimensionScore = (dimension) => {
            const items = auditCriteria.filter(item =>
                item.dimension === dimension && item.applicable && Number.isFinite(Number(item.ratio))
            );
            if (!items.length) return 100;

            const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
            const violation = items.reduce(
                (sum, item) => sum + item.weight * Math.min(1, Math.max(0, Number(item.ratio))),
                0
            );
            return Math.round(100 * (1 - violation / totalWeight));
        };

        // OEK4_revize: Her alt skor, ilgili ihlal oranlarının kendi boyutu
        // içindeki etki ağırlıklarıyla normalize edilmesiyle hesaplanır.
        // Bilişsel skora sayfada kaybolma metriği doğrudan ceza olarak dâhildir.
        const rawScores = {
            vision: this.calculateWeightedSubScore("vision", {
                missingAlt: visionMetrics.missingAlt,
                lowContrast: visionMetrics.lowContrast,
                accessibleName: accessibleNameRatio
            }),
            hearing: this.calculateWeightedSubScore("hearing", {
                inaccessibleMedia: hearingMetrics.inaccessibleMedia
            }),
            cognitive: this.calculateWeightedSubScore("cognitive", {
                longParagraph: cognitiveMetrics.longParagraph,
                headingHierarchy: cognitiveMetrics.headingHierarchy,
                semanticLandmark: cognitiveMetrics.semanticLandmark,
                disorientation: cognitiveMetrics.disorientation
            }),
            motor: this.calculateWeightedSubScore("motor", {
                smallTarget: motorMetrics.smallTarget,
                keyboardAccess: motorMetrics.keyboardAccess,
                focusOrder: motorMetrics.focusOrder,
                focusIndicator: motorMetrics.focusIndicator
            })
        };

        const stableScores = this.stabilizeOEK4Scores(rawScores);

        // Genel skor yalnızca OEK-4 ağırlıklı formülüyle belirlenir;
        // davranışsal kaybolma cezası başarılı teknik kriterler olsa bile korunur.

        EAApp.audit = {
            scores: {
                vision: stableScores.vision,
                cognitive: stableScores.cognitive,
                motor: stableScores.motor,
                hearing: stableScores.hearing,
                editor: 100,
                general: stableScores.general
            },
            rawScores: this.scoreSession.rawScores,
            scoreMethod: "OEK4_WEIGHTED_NORMALIZED_DETERMINISTIC_APPLICABLE",
            scoreApplicability: {
                vision: stableScores.vision !== null,
                hearing: stableScores.hearing !== null,
                cognitive: stableScores.cognitive !== null,
                motor: stableScores.motor !== null
            },
            scoreWeights: { ...this.scoreConfig.categoryWeights },
            scoreMetrics: {
                vision: visionMetrics,
                hearing: hearingMetrics,
                cognitive: cognitiveMetrics,
                motor: motorMetrics
            },
            criteria: auditCriteria,
            criteriaSummary: {
                total: auditCriteria.length,
                passed: auditCriteria.filter(item => item.status === "pass" && item.applicable).length,
                failed: auditCriteria.filter(item => item.status === "fail").length,
                notApplicable: auditCriteria.filter(item => !item.applicable).length
            },
            missingAlt
        };
        return EAApp.audit;

    },
    noteUnresolvedFindings: function () {
        const notes = {};
        const findingList = this.findings || [];

        const set = (finding, message) => {
            if (!finding) return;
            notes[finding.type || finding.title] = message;
        };

        findingList.forEach((finding) => {
            const title = finding.title || "";

            if (title.includes("Yetersiz Renk Kontrastı")) {
                set(finding, "Bu alanların bir kısmı sitenin kendi CSS kuralları, görsel arka planları veya dinamik tema stilleri nedeniyle güvenli biçimde otomatik değiştirilemedi. Manuel CSS düzenlemesi gerekebilir.");
            } else if (title.includes("Önemli Görselde Açıklama Yok")) {
                set(finding, "Görsel için güvenilir yerel açıklama bulunamadıysa AI anahtarı gerekir. AI yanıtı alınamazsa yanlış alt metin yazmamak için sorun otomatik çözülmüş sayılmaz.");
            } else if (title.includes("Klavye Navigasyon")) {
                set(finding, "Bazı etkileşimler sitenin JavaScript event yapısına bağlıdır. Eklenti tabindex/role ekleyebilir; fakat sitenin özel olay kodu klavye ile tetiklenmiyorsa manuel geliştirme gerekir.");
            } else if (title.includes("Focus Göstergesi")) {
                set(finding, "Bazı focus stilleri site CSS'i tarafından sürekli bastırılabilir. Eklenti görünür focus eklemeye çalışır; yine kalıyorsa ana CSS kurallarında düzenleme gerekir.");
            } else if (title.includes("Semantik") || title.includes("Landmark")) {
                set(finding, "Eklenti role ataması yapabilir; ancak sayfanın gerçek HTML iskeleti doğru main/nav/header yapısıyla yazılmadıysa tam semantik iyileştirme geliştirici düzenlemesi ister.");
            } else if (title.includes("Başlık Hiyerarşisi")) {
                set(finding, "Başlıkların görsel görünümünü bozmamak için etiketleri H1/H2 olarak değiştirmek yerine erişilebilir aria-level düzeltmesi uygulanır. Site HTML'i kökten hatalıysa manuel başlık düzeni gerekir.");
            }
        });

        EAApp.state.auditFixNotes = notes;
        EAApp.saveState();
    },

    autoFix: async function () {
        // Önce tüm dinamik/iframe içeriğini denetle, sonra tabanı kilitle.
        // Böylece düzeltmeden sonra ilk kez görünen bulgular oluşmaz.
        this.refresh();
        this.beginScoreIntervention();

        const summary = {
            fixed: 0,
            skipped: 0,
            failed: 0
        };

        const isOwnNode = (el) => this.isAssistantNode && this.isAssistantNode(el);
        const auditDocuments = this.getAccessibleAuditDocuments();
        const queryAll = (selector) => auditDocuments.flatMap((doc) => {
            try {
                return Array.from(doc.querySelectorAll(selector));
            } catch (_) {
                return [];
            }
        });

        try {
            queryAll("a, button, input, textarea, select")
                .forEach(el => {
                    if (isOwnNode(el)) return;
                    if (this.applyFocusIndicator(el)) {
                        summary.fixed++;
                    }
                });

            queryAll("button, a, [role='button']")
                .forEach(el => {
                    if (isOwnNode(el)) return;
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
                        if (this.fixSmallTargetElement(el)) {
                            summary.fixed++;
                        } else {
                            summary.skipped++;
                        }
                    }
                });

            queryAll("input, textarea, select")
                .forEach(el => {
                    if (isOwnNode(el)) return;
                    const inputType = String(el.type || "").toLowerCase();
                    if (["hidden", "submit", "button", "reset", "image"].includes(inputType)) return;
                    if (this.ensureFormFieldIdentity(el)) {
                        summary.fixed++;
                    }
                    const ownerDoc = el.ownerDocument || document;
                    const hasLabel = el.id
                        ? ownerDoc.querySelector(`label[for="${CSS.escape(el.id)}"]`)
                        : null;
                    const hasName = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || "").trim().length > 0;

                    if (hasLabel || hasName) return;

                    let localText = "";
                    try {
                        const nlpResult = window.EAAI && EAAI.inferFieldLabelNLP
                            ? EAAI.inferFieldLabelNLP(el)
                            : null;
                        if (nlpResult && nlpResult.confidence >= 0.72) {
                            localText = nlpResult.label || "";
                        }
                        if (!localText && window.EAAI && EAAI.generateLocalLabel) {
                            localText = EAAI.generateLocalLabel(el) || "";
                        }
                    } catch (_) {
                        localText = "";
                    }

                    if (localText && String(localText).trim().length > 1) {
                        el.setAttribute("aria-label", String(localText).trim());
                        el.setAttribute("data-ea-autofix", "nlp-label");
                        summary.fixed++;
                    } else {
                        summary.skipped++;
                    }
                });

            queryAll("img")
                .forEach(img => {
                    if (isOwnNode(img)) return;
                    if (img.alt && img.alt.trim() !== "") return;

                    if (!this.isMeaningfulImage(img)) {
                        img.alt = "";
                        img.setAttribute("data-ea-autofix", "decorative-alt");
                        summary.fixed++;
                        return;
                    }

                    let localAlt = "";
                    try {
                        localAlt = window.EAAI ? EAAI.generateLocalAlt(img) : "";
                    } catch (err) {
                        localAlt = "";
                    }

                    const clean = (localAlt || "").trim();
                    if (clean.length > 2 && clean.length < 120 && !["null", "undefined", "görsel", "image"].includes(clean.toLowerCase())) {
                        img.alt = clean;
                        img.setAttribute("data-ea-autofix", "local-alt");
                        summary.fixed++;
                    } else {
                        summary.skipped++;
                    }
                });

            const headingResult = this.fixHeadingHierarchy();
            summary.fixed += headingResult.fixed || 0;
            summary.skipped += headingResult.skipped || 0;
            summary.failed += headingResult.failed || 0;

            const landmarkResult = this.fixStructuralLandmarks("all");
            summary.fixed += landmarkResult.fixed || 0;
            summary.skipped += landmarkResult.skipped || 0;
            summary.failed += landmarkResult.failed || 0;

            const focusOrderNodes = queryAll("[tabindex]")
                .filter(el => Number(el.getAttribute("tabindex")) > 0);
            const focusOrderResult = this.fixFocusOrder(focusOrderNodes);
            summary.fixed += focusOrderResult.fixed || 0;
            summary.skipped += focusOrderResult.skipped || 0;
            summary.failed += focusOrderResult.failed || 0;
        } catch (err) {
            console.error("Otomatik düzeltme sırasında hata:", err);
            summary.failed++;
        }

        this.refresh();
        this.noteUnresolvedFindings();
        if (window.EAUI) {
            EAUI.updateButtons();
            EAUI.renderFindings();
        }

        const message = [
            "Otomatik düzeltme tamamlandı.",
            `✅ Uygulanan düzeltme: ${summary.fixed}`,
            `⚠️ Güvenle düzeltilemeyen / AI veya manuel kontrol isteyen: ${summary.skipped}`,
            `❌ Hata: ${summary.failed}`
        ].join("\n");

        alert(message);
        return summary;
    },
  fixSpecificIssue: function (index, isAutoMode = false, options = {}) {
        const requestedFinding = this.findings[index];
        this.refresh();
        this.beginScoreIntervention();
        const finding = requestedFinding
            ? (this.findings.find(item =>
                (item.type && item.type === requestedFinding.type) ||
                item.title === requestedFinding.title
              ) || requestedFinding)
            : this.findings[index];
        if (!finding || !finding.nodes) return;

        if (finding.title.includes("Altyaz")) {
            this.fixMissingCaptions(finding.nodes, {
                allowAI: !isAutoMode
            })
                .then(fixedCount => {
                    if (!isAutoMode) {
                        alert(
                            fixedCount > 0
                                ? `✅ "${finding.title}" için ${fixedCount} altyazı parçası etkinleştirildi/oluşturuldu.`
                                : "Altyazı oluşturulamadı. Video sesi yakalanamıyor olabilir veya API anahtarı girilmedi."
                        );
                    }
// Profil Öğrenme Tetikleyicisi
        if (fixedCount > 0 && finding.group) {
            this.recordInterventionFeedback(finding.group); 
        }
                    this.refresh();

                    if (window.EAUI) {
                        EAUI.updateButtons();
                    }
                })
                .catch(error => {
                    console.error("Altyazı oluşturma hatası:", error);
                    finding.nodes.forEach(video => this.clearCaptionStatus(video));

                    if (!isAutoMode) {
                        alert(error.message || "Altyazı oluşturma sırasında hata oluştu.");
                    }
                });

            return;
        }

        let fixedCount = 0;

        if (finding.type === "heading-hierarchy" || finding.title.includes("Başlık Hiyerarşisi")) {
            const result = this.fixHeadingHierarchy();

            if (!isAutoMode) {
                if (result.fixed > 0) {
                    alert(`✅ Başlık hiyerarşisi düzeltildi.\nUygulanan düzeltme: ${result.fixed}`);
                } else {
                    alert("⚠️ Başlık hiyerarşisi otomatik düzeltilemedi. Sayfada düzenlenebilir başlık bulunamadı.");
                }
            }

            this.refresh();
            if (window.EAUI) {
                EAUI.updateButtons();
                EAUI.renderFindings();
            }

            return result;
        }


        if (finding.type === "semantic-landmark" || finding.type === "navigation-landmark") {
            const result = this.fixStructuralLandmarks(finding.type);

            if (!isAutoMode) {
                if (result.fixed > 0) {
                    alert(`✅ Semantik bölge düzeltmesi uygulandı.\nUygulanan: ${result.fixed}`);
                } else {
                    alert("⚠️ Bu semantik bölge otomatik olarak güvenle oluşturulamadı. Sayfa yapısı manuel kontrol gerektiriyor.");
                }
            }

            this.refresh();
            if (window.EAUI) {
                EAUI.updateButtons();
                EAUI.renderFindings();
            }

            return result;
        }

        if (finding.type === "focus-order") {
            const result = this.fixFocusOrder(finding.nodes);

            if (!isAutoMode) {
                if (result.fixed > 0) {
                    alert(`✅ Odak sırası düzeltildi.\nPozitif tabindex düzeltilen öğe: ${result.fixed}`);
                } else {
                    alert("⚠️ Odak sırası otomatik düzeltilemedi.");
                }
            }

            this.refresh();
            if (window.EAUI) {
                EAUI.updateButtons();
                EAUI.renderFindings();
            }

            return result;
        }


        // --- 1. FORM ETİKETİ ÇÖZÜMÜ (Senin ai.js'deki Toplu Fonksiyonun) ---
        if (finding.type === "missing-form-label") {
            if (window.EAAI && typeof EAAI.fixMissingLabels === "function") {
                return EAAI.fixMissingLabels(finding.nodes, {
                    askForKey: !isAutoMode,
                    forceAI: !!options.forceAI && !isAutoMode
                }).then((result) => {
                    const visibleItems = (result.details || []).filter((item) => item && item.id && item.label);
                    if (visibleItems.length > 0) {
                        this.formLabelFixResults = this.formLabelFixResults || {};
                        const resultKey = finding.type || finding.title || "form-label";
                        this.formLabelFixResults[resultKey] = {
                            title: finding.title || "Form etiketleri",
                            createdAt: Date.now(),
                            items: visibleItems
                        };
                    }

                    if (!isAutoMode) {
                        if (result.fixed > 0) {
                            alert(`✅ Form etiketi düzeltmesi tamamlandı.\nUygulanan: ${result.fixed}\nNLP ile çözülen: ${result.nlpResolved || 0}\nAI'ye gönderilen belirsiz alan: ${result.attemptedAI || 0}\nToplu OpenRouter isteği: ${result.aiBatches || 0}\nAI yanıtıyla uygulanan: ${result.usedAI || 0}\nYerel yedekle uygulanan: ${result.usedLocal || 0}\nDüzeltilemeyen: ${(result.skipped || 0) + (result.failed || 0)}`);
                        } else {
                            alert(`⚠️ Form etiketleri uygulanamadı.\nSebep: Güvenilir yerel etiket bulunamadı veya AI anahtarı/yanıtı alınamadı.\nDüzeltilemeyen: ${(result.skipped || 0) + (result.failed || 0)}`);
                        }
                    }
                    this.refresh();
                    if (window.EAUI) {
                        EAUI.updateButtons();
                        EAUI.renderFindings();
                    }
                    return result;
                }).catch(err => {
                    console.error("Form etiketleme hatası:", err);
                    if (!isAutoMode) alert("Form etiketleme başarısız: " + (err.message || "Bilinmeyen hata"));
                    return { fixed: 0, skipped: 0, failed: finding.nodes.length };
                });
            }
            if (!isAutoMode) alert("Form etiketi üretim modülü bulunamadı.");
            return { fixed: 0, skipped: 0, failed: finding.nodes.length };
        }
        // ---------------------------------------------------------------

        
        finding.nodes.forEach(el => {
            // 1. KÜÇÜK TIKLAMA ALANLARI ÇÖZÜMÜ
            if (finding.title.includes("Küçük Tıklama")) {
                if (this.fixSmallTargetElement(el)) {
                    fixedCount++;
                }
            }
         // 2. RENK KONTRASTI ÇÖZÜMÜ
            else if (finding.title.includes("Kontrast")) {
                if (this.fixContrastForElement(el)) {
                    fixedCount++;
                }

                return;
                
                // 1. Sadece ana taşıyıcı elemente hafif bir zemin veriyoruz (Kutu kutu görünümü önler)
                
                // 2. İçindeki tüm metinlere "Beyaz Hale (Halo)" ve "Siyah Renk" veren sihirli fonksiyon
                const applyTextFix = (node) => {
                    if (!node.style) return;
                    
                    // Metni zorla siyah ve kalın yap
                    node.style.setProperty("color", "#000000", "important");
                    node.style.setProperty("-webkit-text-fill-color", "#000000", "important");
                    node.style.setProperty("font-weight", "800", "important");
                    
                    // KRİTİK: İç öğelerin kendi arka planlarını sil (iç içe yara bandı görünümünü engeller)
                    node.style.setProperty("background-color", "transparent", "important");
                    
                    // MÜKEMMEL OKUNABİLİRLİK: Metnin etrafına 8 yönlü yoğun BEYAZ gölge (Halo) atar
                    node.style.setProperty(
                        "text-shadow", 
                        "2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 0px 2px 0 #fff, 0px -2px 0 #fff, -2px 0px 0 #fff, 2px 0px 0 #fff", 
                        "important"
                    );
                };

                // Önce ana elemente, sonra içindeki tüm alt elementlere uygula
                applyTextFix(el);
                Array.from(el.querySelectorAll("*")).forEach(applyTextFix);

                fixedCount++;
            }


// ... form label bloğu veya önceki blokların bitişi ...
else if (finding.type === "missing-aria-label" || finding.title === "ARIA Label Eksik") {
    const htmlContext = (el.innerHTML + " " + el.className + " " + el.id).toLowerCase();
    const titleAttr = el.getAttribute("title");
    let bestGuess = null;

    if (titleAttr && titleAttr.trim().length > 1) bestGuess = titleAttr.trim();
    else if (htmlContext.includes("search") || htmlContext.includes("ara") || htmlContext.includes("magnify")) bestGuess = "Arama Yap";
    else if (htmlContext.includes("close") || htmlContext.includes("times") || htmlContext.includes("kapat")) bestGuess = "Kapat";
    else if (htmlContext.includes("menu") || htmlContext.includes("bars") || htmlContext.includes("hamburger") || htmlContext.includes("nav")) bestGuess = "Menü";
    else if (htmlContext.includes("user") || htmlContext.includes("account") || htmlContext.includes("profil") || htmlContext.includes("login")) bestGuess = "Kullanıcı Profili";
    else if (htmlContext.includes("cart") || htmlContext.includes("basket") || htmlContext.includes("sepet")) bestGuess = "Alışveriş Sepeti";
    else if (htmlContext.includes("play")) bestGuess = "Oynat";
    else if (htmlContext.includes("pause")) bestGuess = "Duraklat";
    else if (htmlContext.includes("left") || htmlContext.includes("prev") || htmlContext.includes("geri") || htmlContext.includes("chevron-left")) bestGuess = "Önceki";
    else if (htmlContext.includes("right") || htmlContext.includes("next") || htmlContext.includes("ileri") || htmlContext.includes("chevron-right")) bestGuess = "Sonraki";
    else if (htmlContext.includes("heart") || htmlContext.includes("favori") || htmlContext.includes("like")) bestGuess = "Favorilere Ekle";
    else if (htmlContext.includes("share") || htmlContext.includes("paylaş")) bestGuess = "Paylaş";
    else if (htmlContext.includes("delete") || htmlContext.includes("trash") || htmlContext.includes("remove") || htmlContext.includes("sil")) bestGuess = "Sil";
    else if (htmlContext.includes("edit") || htmlContext.includes("update") || htmlContext.includes("düzenle") || htmlContext.includes("pencil")) bestGuess = "Düzenle";
    else if (htmlContext.includes("settings") || htmlContext.includes("gear") || htmlContext.includes("ayarlar") || htmlContext.includes("cog")) bestGuess = "Ayarlar";
    else if (htmlContext.includes("notification") || htmlContext.includes("bell") || htmlContext.includes("bildirim")) bestGuess = "Bildirimler";

    if (bestGuess) {
        el.setAttribute("aria-label", bestGuess);
        el.style.setProperty("outline", "2px dashed #10b981", "important");
        el.style.setProperty("outline-offset", "2px", "important");
        console.log("✅ WCAG Uyumlu Etiket Atandı:", bestGuess);
    } else {
        el.setAttribute("aria-label", "Etkileşimli Düğme");
        el.style.setProperty("outline", "2px dashed #f59e0b", "important");
        el.style.setProperty("outline-offset", "2px", "important");
    }
    
    fixedCount++; // Ana sayacı artırıyoruz! (Alert yok)
}




else if (finding.title.includes("Screen Reader")) {
                if (!el.getAttribute("role")) {
                    if (el.tagName === "BUTTON") {
                        el.setAttribute("role", "button");
                    } else if (el.tagName === "A") {
                        el.setAttribute("role", "link");
                    } else if (el.tagName === "INPUT") {
                        const t = el.type.toLowerCase();
                        if (t !== "checkbox" && t !== "radio" && t !== "submit" && t !== "button") {
                            el.setAttribute("role", "textbox");
                        }
                    }
                }

                if (el.hasAttribute("aria-hidden")) {
                    el.removeAttribute("aria-hidden");
                }
el.setAttribute(
    "data-ea-screenreader-fixed",
    "true"
);

el.style.setProperty(
    "outline",
    "3px solid #a855f7",
    "important"
);

el.style.setProperty(
    "outline-offset",
    "3px",
    "important"
);

el.setAttribute(
    "title",
    "Screen reader accessibility fixed"
);
                fixedCount++;
            

    console.log(
        "SCREEN READER DÜZELTİLDİ:",
        el
    );
}



      // 4. KLAVYE VE FOCUS ÇÖZÜMÜ (ULTIMATE EDITION)
            // 4. KLAVYE VE FOCUS ÇÖZÜMÜ (ULTIMATE EDITION - FIXED)
else if (finding.title.includes("Klavye")) {
                if (this.fixKeyboardElement(el)) {
                    fixedCount++;
                }

                return;
                // A) İÇ İÇE ODAKLANMA HATASINI ÖNLE (Link içindeki alt span'lerin odağı çalmasını engelle)
                if (el.closest('a, button') && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
                    el.setAttribute("tabindex", "-1"); 
                    
                    return;
                }

                // ✅ SİLDİĞİN YERE DOĞRUDAN BU BLOĞU YAPIŞTIR:

el.style.setProperty("pointer-events", "auto", "important");
el.style.setProperty("cursor", "pointer", "important");

if (
    !el.hasAttribute("tabindex")
) {

    el.setAttribute(
        "tabindex",
        "0"
    );
}                
                if (!el.getAttribute("role")) {
                    el.setAttribute("role", "button");
                }

                // C) DEVRİMSEL MAVİ ODAK ÇERÇEVESİ VE PARLAMA EFEKTİ
                const applyFocusStyles = () => {

    el.style.outline =
        "3px solid #2563eb";

    el.style.outlineOffset =
        "3px";

    el.style.borderRadius =
        "6px";

    el.style.boxShadow =
        "0 0 0 4px rgba(37,99,235,0.25)";};

                const removeFocusStyles = () => {

    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.boxShadow = "";};

                // Eski listener'ları temizle ve yenilerini bağla
                el.removeEventListener("focus", applyFocusStyles);
el.addEventListener("focus", applyFocusStyles);                
                el.removeEventListener("blur", removeFocusStyles);
                el.addEventListener("blur", removeFocusStyles);

                // D) KLAVYE VE YÖN TUŞLARI ETKİLEŞİM DESTEĞİ
                const triggerClick = (e) => {
                    // Enter veya Space tuşuna basıldığında tıklama simüle et
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        el.click();
                        console.log("⌨️ Klavye ile tetiklendi:", el);
                    }
                };
                el.removeEventListener("keydown", triggerClick);
                el.addEventListener("keydown", triggerClick);

                fixedCount++;
            }
else if (finding.title.includes("Focus")) {if (this.applyFocusIndicator(el)) {
        
        el.setAttribute("data-ea-focus-visible", "true");
        el.setAttribute("title", "Focus visibility fixed");
        
        if (!el.hasAttribute("tabindex")) {
            el.setAttribute("tabindex", "0");
        }
        
        // ✨ ÇÖZÜM BURADA: Tarayıcının en alta uçmasını engelle!
        // Sadece düzelttiği İLK elemana yumuşakça kaysın ve odaklansın.
        if (fixedCount === 0) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
        }
        
        fixedCount++;
    }}
   else if (
    finding.title.includes("Uzun")
) {

    el.style.setProperty(
        "max-width",
        "70ch",
        "important"
    );

    el.style.setProperty(
        "line-height",
        "1.9",
        "important"
    );

    el.style.setProperty(
        "letter-spacing",
        "0.3px",
        "important"
    );

    el.style.setProperty(
        "word-spacing",
        "1px",
        "important"
    );

    // METNİ SADELEŞTİR
    let text =
        el.innerText;

    // Çok uzun cümleleri böl
    text =
        text.replace(
            /([.!?])\s+/g,
            "$1\n\n"
        );

    // Fazla boşluk temizle
    text =
        text.replace(
            /\s+/g,
            " "
        );

    // Uzun virgül zincirlerini böl
    text =
        text.replace(
            /,\s/g,
            ",\n"
        );

    // HTML'e geri yaz
    el.innerHTML =
        text
            .split("\n\n")
            .map(
                p =>
                `<p style="margin-bottom:16px;">${p}</p>`
            )
            .join("");

    console.log(
        "📖 Paragraf sadeleştirildi:",
        el
    );

    fixedCount++;
}         
});
 
// İşlem bittikten sonra tek bir akıllı bildirim göster
        if (!isAutoMode) {
            if (finding.title === "ARIA Label Eksik" || finding.type === "missing-aria-label") {
                alert(`✅ İşlem Başarılı: ${fixedCount} isimsiz butona anında WCAG uyumlu ARIA Label atandı.`);
            } else if (fixedCount > 0) {
                alert(`✅ "${finding.title}" sorunu için tespit edilen ${fixedCount} öğe düzeltildi.`);
            } else {
                const key = finding.type || finding.title;
                EAApp.state.auditFixNotes = EAApp.state.auditFixNotes || {};
                EAApp.state.auditFixNotes[key] = "Bu sorun otomatik olarak güvenle düzeltilemedi. Büyük olasılıkla sitenin kendi CSS/JavaScript yapısı veya HTML iskeleti manuel düzenleme gerektiriyor.";
                EAApp.saveState();
                alert(`⚠️ "${finding.title}" için otomatik uygulanabilir güvenli düzeltme bulunamadı.`);
            }
        }
       if (fixedCount > 0 && finding.group) {
            this.recordInterventionFeedback(finding.group); 
        }
        // =======================================================

        this.refresh();

        if (window.EAUI) {
            EAUI.updateButtons();
        }
        this.refresh();

        if (window.EAUI) {
            EAUI.updateButtons();
        }
    },
        

    suggestAlt: (img) => "Görsel açıklaması öneriliyor...",
    applyAltSuggestions: function () { },
    improveFocusTargets: function () { },
    
recordInterventionFeedback: function(groupType) {if (!EAApp.state.userProfile) return;

        const now = Date.now();
        const lastTime = EAApp.state.userProfile.lastActionTime || now;
        const timeSpent = (now - lastTime) / 1000;

        let weightChange = 0;
        if (timeSpent > 0 && timeSpent < 15) weightChange = 0.05;
        else if (timeSpent > 60) weightChange = -0.02;

        if (EAApp.state.userProfile.preferences[groupType] !== undefined) {
            let oldWeight = EAApp.state.userProfile.preferences[groupType];
            let newWeight = Math.max(0.5, Math.min(2.5, oldWeight + weightChange));
            EAApp.state.userProfile.preferences[groupType] = Number(newWeight.toFixed(2));
            
            // 🧠 OEK-4 REHBERLİK BİLDİRİMİ
            // Eğer ağırlık 1.20'ye ulaştıysa kullanıcıya öneride bulun
            if (newWeight >= 1.10 && oldWeight < 1.10) {
                alert(`💡 Erişilebilirlik Asistanı: ${groupType.toUpperCase()} kategorisini sık kullanıyorsun. Bu mod için 'Tek Tuşla Çözüm' özelliklerimizi denemek ister misin?`);
            }
        }

        EAApp.state.userProfile.lastActionTime = now;
        EAApp.saveState();
        if (window.EAUI) EAUI.updateButtons();}
    
};
