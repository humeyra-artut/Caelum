window.EAApp = {
  state: {
    apiKey: "",
    captionApiKey: "",
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
    aiConditionText: "",
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
    loaded: false,
    assistantHidden: false,
    assistantButtonPosition: null,
    auditFixNotes: {},
    aiBehaviorAnalysis: "",
    aiBehaviorRecommendedProfile: "",
    behaviorPopupShown: false,
    behaviorAutoApplied: {},
  
  },
  dom: {
    html: document.documentElement,
    body: document.body,
    root: null,
    shadow: null,
  },
  audit: null,
  changes: [],
  saveState: function () {try {  if (!this.loaded)
        return;

      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ eaA11yStates: this.state });
      }
    } catch (error) {
      console.warn("Eklenti bağlamı yenilendi. Lütfen sayfayı yenileyin.");
    }
  },
  
  loadState: function (callback) {

    chrome.storage.local.get(
        ["eaA11yStates"],
        (result) => {

            if (
                result &&
                result.eaA11yStates
            ) {

                const saved =
                    result.eaA11yStates;

                Object.assign(
                    this.state,
                    saved
                );

                // userProfile eksikse oluştur
                if (
                    !this.state.userProfile
                ) {

                    this.state.userProfile = {

                        preferences: {
                            vision: 1,
                            hearing: 1,
                            cognitive: 1,
                            motor: 1
                        },

                        lastActionTime:
                            Date.now()
                    };
                }

                // preferences eksikse koru
                if (
                    !this.state.userProfile.preferences
                ) {

                    this.state.userProfile.preferences = {
                        vision: 1,
                        hearing: 1,
                        cognitive: 1,
                        motor: 1
                    };
                }
            }

            console.log(
                "📦 STORAGE LOAD:",
                this.state.userProfile
            );
this.loaded = true;
            if (callback)
                callback();
        }
    );},
 
  toggleState: function (key, max = 2) {
    if (typeof this.state[key] === "boolean") {
      this.state[key] = !this.state[key];
    } else {
      this.state[key] = (this.state[key] + 1) % max;
    }
  const profileMap = {

        // GÖRME
        contrast: "vision",
        zoom: "vision",
        font: "vision",
        cb: "vision",
        blue: "vision",
        guide: "vision",
        hlLinks: "vision",
        altText: "vision",

        // BİLİŞSEL
        simplify: "cognitive",
        cognitive: "cognitive",
        suppressDistractions: "cognitive",
        align: "cognitive",
        lh: "cognitive",
        space: "cognitive",

        // MOTOR
        keyboard: "motor",
        focusAssist: "motor",
        largeTargets: "motor",

        // İŞİTME
        mute: "hearing",
        reader: "hearing"
    };

    const group =
        profileMap[key];

    if (
        group &&
        this.state.userProfile
    ) {

        let current =
            this.state.userProfile
                .preferences[group] || 1;

        current += 0.03;

        current =
            Math.min(2.5, current);

        this.state.userProfile
            .preferences[group] =
                Number(
                    current.toFixed(2)
                );

        this.state.userProfile
            .lastActionTime =
                Date.now();

        console.log(
            "🧠 Öğrenildi:",
            key,
            "→",
            group,
            current
        );
    }


    this.saveState();
    if (this.renderAll) this.renderAll();
  },
  setState: function (patch) {
    Object.assign(this.state, patch);
    this.saveState();
    if (this.renderAll) this.renderAll();
  },
  rememberChange: function (label, undo) {
    this.changes.push({ label, undo });
  },
  undoAll: function () {
    while (this.changes.length) {
      const change = this.changes.pop();
      try {
        change.undo();
      } catch (error) {
        console.warn("Geri alma başarısız:", error);
      }
    }
    if (window.EAAI) EAAI.restoreContent();
    this.setState({
      oneClick: false,
      activeProfile: "",
      simplify: false,
      cognitive: false,
      focusAssist: false,
      largeTargets: false,
      suppressDistractions: false,
      autoAlt: false,
    });
    if (window.EAUI) EAUI.announce("Bu sayfada yapılan erişilebilirlik müdahaleleri geri alındı.");
  },
};
