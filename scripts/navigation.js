window.EANav = {
  vCursorPos: { x: 0, y: 0 },
  activeKeys: { w: false, a: false, s: false, d: false },
  cursorSpeed: 5,
  animationFrameId: null,

  init: function () {
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    document.addEventListener("mousemove", (e) => {
      const altTooltip = document.getElementById("ea-alt-tooltip");
      if (EAApp.state.altText && altTooltip.style.display === "block") {
        altTooltip.style.left = e.clientX + 15 + "px";
        altTooltip.style.top = e.clientY + 15 + "px";
      }
      if (EAApp.state.guide === 1 && !EAApp.state.keyboard) {
        const virtualCursor = document.getElementById("ea-virtual-cursor");
        if (virtualCursor) {
          virtualCursor.classList.add("active");
          virtualCursor.style.left = e.clientX + "px";
          virtualCursor.style.top = e.clientY + "px";
        }
      }
      if (EAApp.state.guide === 2) {
        const readingLine = document.getElementById("ea-reading-line");

        if (readingLine) {
          let line = document.getElementById("ea-reading-line");

          if (line) {
            line.style.top = e.clientY - 40 + "px";

            line.style.left = e.clientX + "px";
          }
        }
      }
      if (EAApp.state.guide === 3) {
        let hole = document.getElementById("ea-mask-hole");
        if (hole) hole.style.top = e.clientY - 60 + "px";
      }
    });

    document.addEventListener("mouseover", (e) => {
      const altTooltip = document.getElementById("ea-alt-tooltip");
      if (EAApp.state.altText && e.target.tagName === "IMG" && e.target.alt) {
        altTooltip.innerText = "Alternatif Metin: " + e.target.alt;
        altTooltip.style.display = "block";
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (EAApp.state.altText && e.target.tagName === "IMG")
        document.getElementById("ea-alt-tooltip").style.display = "none";
    });

    document.addEventListener(
      "click",
      (e) => {
        if (EAApp.state.reader) {
          if (e.composedPath().includes(EAApp.dom.root)) return;
          let textToRead =
            e.target.innerText ||
            e.target.alt ||
            e.target.title ||
            e.target.value;
          if (textToRead) {
            e.preventDefault();
            e.stopPropagation();
            window.speechSynthesis.cancel();

            let utterance = new SpeechSynthesisUtterance(textToRead);
            // Sayfanın lang özelliğini al, yoksa tarayıcı dilini kullan, o da yoksa varsayılanı ata
            utterance.lang =
              document.documentElement.lang || navigator.language || "tr-TR";
            window.speechSynthesis.speak(utterance);
          }
        }
      },
      true,
    );
  },

  apply: function () {
    const virtualCursor = document.getElementById("ea-virtual-cursor");
    if (!virtualCursor) return;

    const showLargeCursor = EAApp.state.guide === 1;
    const showKeyboardCursor = EAApp.state.keyboard;

    if (showKeyboardCursor || showLargeCursor) {
      virtualCursor.classList.add("active");
      if (this.vCursorPos.x === 0) {
        this.vCursorPos.x = window.innerWidth / 2;
        this.vCursorPos.y = window.innerHeight / 2;
        virtualCursor.style.left = this.vCursorPos.x + "px";
        virtualCursor.style.top = this.vCursorPos.y + "px";
      }

      if (showKeyboardCursor) {
        this.startLoop();
      } else {
        this.stopLoop();
      }
    } else {
      virtualCursor.classList.remove("active");
      this.stopLoop();
    }
  },

  startLoop: function () {
    if (this.animationFrameId) return;
    const moveLoop = () => {
      let moved = false;
      if (this.activeKeys.w) {
        this.vCursorPos.y -= this.cursorSpeed;
        moved = true;
      }
      if (this.activeKeys.s) {
        this.vCursorPos.y += this.cursorSpeed;
        moved = true;
      }
      if (this.activeKeys.a) {
        this.vCursorPos.x -= this.cursorSpeed;
        moved = true;
      }
      if (this.activeKeys.d) {
        this.vCursorPos.x += this.cursorSpeed;
        moved = true;
      }

      if (moved) {
        if (this.vCursorPos.x < 0) this.vCursorPos.x = 0;
        if (this.vCursorPos.y < 0) this.vCursorPos.y = 0;
        if (this.vCursorPos.x > window.innerWidth)
          this.vCursorPos.x = window.innerWidth - 10;
        if (this.vCursorPos.y > window.innerHeight)
          this.vCursorPos.y = window.innerHeight - 10;
        if (this.vCursorPos.y < 50) window.scrollBy(0, -10);
        if (this.vCursorPos.y > window.innerHeight - 50) window.scrollBy(0, 10);
        if (this.vCursorPos.x < 50) window.scrollBy(-10, 0);
        if (this.vCursorPos.x > window.innerWidth - 50) window.scrollBy(10, 0);

        let cursor = document.getElementById("ea-virtual-cursor");
        if (cursor) {
          cursor.style.left = this.vCursorPos.x + "px";
          cursor.style.top = this.vCursorPos.y + "px";
        }
      }
      this.animationFrameId = requestAnimationFrame(moveLoop);
    };
    moveLoop();
  },

  stopLoop: function () {
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.activeKeys = { w: false, a: false, s: false, d: false };
  },

  handleKeyDown: function (e) {
    if (!EAApp.state.keyboard) return;
    const active = document.activeElement;
    const isTyping =
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable);
    if (isTyping) return;

    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") {
      this.activeKeys.w = true;
      e.preventDefault();
    }
    if (key === "s" || e.key === "ArrowDown") {
      this.activeKeys.s = true;
      e.preventDefault();
    }
    if (key === "a" || e.key === "ArrowLeft") {
      this.activeKeys.a = true;
      e.preventDefault();
    }
    if (key === "d" || e.key === "ArrowRight") {
      this.activeKeys.d = true;
      e.preventDefault();
    }
    if (key === "backspace") {
        e.preventDefault();
        window.history.back(); 
        return;
    }
    if (key === "enter") {
      e.preventDefault();
      let targetElement = document.elementFromPoint(
        this.vCursorPos.x + 8,
        this.vCursorPos.y + 12,
      );
      if (targetElement) {
        targetElement.focus();
        targetElement.click();
        let parentLink = targetElement.closest("a");
        if (parentLink && parentLink.href)
          window.location.href = parentLink.href;
        let parentLabel = targetElement.closest("label");
        if (parentLabel && parentLabel.htmlFor) {
          let hiddenInput = document.getElementById(parentLabel.htmlFor);
          if (hiddenInput) hiddenInput.click();
        }
      }
    }
  },
  handleKeyUp: function (e) {
    if (!EAApp.state.keyboard) return;
    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") this.activeKeys.w = false;
    if (key === "s" || e.key === "ArrowDown") this.activeKeys.s = false;
    if (key === "a" || e.key === "ArrowLeft") this.activeKeys.a = false;
    if (key === "d" || e.key === "ArrowRight") this.activeKeys.d = false;
  },
};
