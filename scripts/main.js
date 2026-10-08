EAUI.init();
EAGuide.init();
EANav.init();
EAAudit.init();
EAAI.init();

EAApp.renderAll = function () {
  EAFilters.apply();
  EANav.apply();
  EAAI.apply();
  if (EAAudit.scheduleAuditRefresh) {
    EAAudit.scheduleAuditRefresh(180);
  } else {
    EAAudit.refresh();
  }
  EAUI.updateButtons();
  if (EAUI.applyAssistantVisibility) EAUI.applyAssistantVisibility();
};

EAApp.loadState(() => {
    // Chrome hafızası (eski site verisi) yüklendikten HEMEN SONRA,
    // yeni site için sayaçları tekrar sıfırlıyoruz ki eski veri bizim değerleri ezmesin.
    EAApp.state.initialFindingCount = 0;
    EAApp.state.currentIssueCount = 0;
    
    // Şimdi her şeyi güvenle ekrana çizebiliriz
    EAApp.renderAll();
});