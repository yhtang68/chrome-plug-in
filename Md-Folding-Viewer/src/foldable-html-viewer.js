(function () {
  "use strict";

  window.MFV = window.MFV || {};

  // Shared HTML post-processor. It does not care whether HTML came from GitHub or Markdown parsing.
  class FoldableHtmlViewer {
    constructor(toggle) {
      this.toggle = toggle;
    }

    // getters and setters
    getFoldableHeading(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      if (/H[12]/.test(node.tagName)) {
        return node;
      }

      if (node.classList.contains("markdown-heading")) {
        return node.querySelector("h1, h2");
      }

      return null;
    }

    setAllDetails(open) {
      document.querySelectorAll(".mfv-content details").forEach((section) => {
        section.open = open;
      });
    }

    setMenuOpen(open) {
      const menuTrigger = document.querySelector('[data-action="menu"]');
      const menu = document.querySelector(".mfv-menu");

      menuTrigger.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    }

    // functions
    addHeadingIds(root) {
      const seen = {};

      root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
        const base = heading.id || this.slugify(heading.textContent);
        let id = base;
        let count = 1;

        while (seen[id]) {
          id = base + "-" + count;
          count += 1;
        }

        seen[id] = true;
        if (!heading.id || heading.id !== id) {
          heading.id = id;
        }
      });
    }

    applySourceClasses(content, documentPayload) {
      const sourceType = documentPayload && documentPayload.sourceType
        ? documentPayload.sourceType
        : "native";

      document.body.classList.toggle("mfv-github-page", sourceType === "github");
      document.body.classList.toggle("mfv-native-page", sourceType === "native");
      content.classList.add("markdown-body");
      content.classList.toggle("mfv-github", sourceType === "github");
      content.classList.toggle("mfv-native", sourceType === "native");
    }

    bindControls() {
      const menuTrigger = document.querySelector('[data-action="menu"]');

      menuTrigger.addEventListener("click", () => {
        const expanded = menuTrigger.getAttribute("aria-expanded") === "true";
        this.setMenuOpen(!expanded);
      });

      document.querySelector('[data-action="expand"]').addEventListener("click", () => {
        this.setAllDetails(true);
        this.setMenuOpen(false);
      });

      document.querySelector('[data-action="fold"]').addEventListener("click", () => {
        this.setAllDetails(false);
        this.setMenuOpen(false);
      });

      document.querySelector('[data-action="disable"]').addEventListener("click", () => {
        this.toggle.setDisabled(true).then(() => {
          location.reload();
        });
      });

      document.querySelector(".mfv-content").addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (link && event.target.closest(".mfv-summary")) {
          event.stopPropagation();
        }

        if (link && link.classList.contains("anchor")) {
          event.preventDefault();
          event.stopPropagation();
          this.navigateToPermalink(link);
        }
      });

      document.addEventListener("click", (event) => {
        if (!event.target.closest(".mfv-floating-controls")) {
          this.setMenuOpen(false);
        }
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuTrigger.getAttribute("aria-expanded") === "true") {
          this.setMenuOpen(false);
          menuTrigger.focus();
        }
      });
    }

    ensureHeadingPermalinks(root) {
      root.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
        const headingWrapper = heading.closest(".markdown-heading");
        const existingAnchor = headingWrapper
          ? headingWrapper.querySelector(":scope > .anchor")
          : heading.querySelector(":scope > .anchor");

        if (existingAnchor) {
          existingAnchor.href = "#" + heading.id;
          existingAnchor.setAttribute("aria-label", "Permalink: " + heading.textContent.trim());
          return;
        }

        const anchor = document.createElement("a");
        anchor.className = "anchor";
        anchor.href = "#" + heading.id;
        anchor.setAttribute("aria-label", "Permalink: " + heading.textContent.trim());
        anchor.innerHTML =
          '<svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' +
          '<path d="m7.775 3.275.53-.53a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .75.75 0 0 1 1.06-1.06 2 2 0 0 0 2.83 0l2.5-2.5a2 2 0 1 0-2.83-2.83l-.53.53a.75.75 0 0 1-1.06-1.06Zm-4.03 4.03 2.5-2.5a3.5 3.5 0 0 1 4.95 0 .75.75 0 0 1-1.06 1.06 2 2 0 0 0-2.83 0l-2.5 2.5a2 2 0 1 0 2.83 2.83l.53-.53a.75.75 0 0 1 1.06 1.06l-.53.53a3.5 3.5 0 1 1-4.95-4.95Z"></path>' +
          "</svg>";
        heading.insertBefore(anchor, heading.firstChild);
      });
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    foldTopLevels(root) {
      const sourceNodes = Array.from(root.childNodes);
      const folded = document.createElement("div");
      const stack = [{ level: 0, body: folded }];

      sourceNodes.forEach((node) => {
        const heading = this.getFoldableHeading(node);

        if (!heading) {
          stack[stack.length - 1].body.appendChild(node);
          return;
        }

        const level = Number(heading.tagName.substring(1));

        while (stack.length && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        const parent = stack[stack.length - 1].body;
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        const body = document.createElement("div");

        details.open = true;
        details.className = "mfv-section mfv-level-" + level;
        summary.className = "mfv-summary";
        body.className = "mfv-section-body";

        summary.appendChild(node);
        details.appendChild(summary);
        details.appendChild(body);
        parent.appendChild(details);
        stack.push({ level: level, body: body });
      });

      root.replaceChildren(...Array.from(folded.childNodes));
    }

    hasExistingFoldableContent(root, documentPayload) {
      return Boolean(root.querySelector("details summary"));
    }

    mountContent(content, documentPayload) {
      if (documentPayload && documentPayload.preserveDom && documentPayload.fragment) {
        content.replaceChildren(documentPayload.fragment);
        return;
      }

      const html = documentPayload && Object.prototype.hasOwnProperty.call(documentPayload, "html")
        ? documentPayload.html
        : String(documentPayload || "");
      content.innerHTML = this.sanitizeHtml(html);
    }

    navigateToPermalink(anchor) {
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }

      history.replaceState(null, "", href);
      this.scrollToHashTarget();
    }

    render(documentPayload, sourceLabel) {
      const filename = sourceLabel || decodeURIComponent(location.pathname.split("/").pop() || "Markdown");

      document.title = filename + " - Markdown Folding Viewer";
      document.body.classList.add("md-folding-viewer");
      document.body.innerHTML =
        '<div class="mfv-floating-controls">' +
        '<button class="mfv-button mfv-menu-trigger" type="button" data-action="menu" aria-expanded="false" aria-controls="mfv-control-menu">Controls</button>' +
        '<div class="mfv-menu" id="mfv-control-menu" hidden>' +
        '<button class="mfv-menu-item" type="button" data-action="expand">Expand all</button>' +
        '<button class="mfv-menu-item" type="button" data-action="fold">Fold all</button>' +
        '<button class="mfv-menu-item" type="button" data-action="disable">Disable viewer</button>' +
        '<span class="mfv-status"></span>' +
        '</div>' +
        '</div>' +
        '<main class="mfv-shell"><article class="mfv-content"></article></main>';

      const content = document.querySelector(".mfv-content");
      const status = document.querySelector(".mfv-status");

      try {
        this.applySourceClasses(content, documentPayload);
        this.mountContent(content, documentPayload);
        this.addHeadingIds(content);
        this.ensureHeadingPermalinks(content);
        if (!this.hasExistingFoldableContent(content, documentPayload)) {
          this.foldTopLevels(content);
        }
        status.textContent = "Loaded: " + filename;
        setTimeout(() => this.scrollToHashTarget(), 0);
      } catch (error) {
        content.innerHTML = '<div class="mfv-error"><strong>Could not render Markdown.</strong><p><code>' +
          this.escapeHtml(error.message || String(error)) +
          "</code></p></div>";
        status.textContent = "Render failed";
      }

      this.bindControls();
    }

    sanitizeHtml(html) {
      if (!window.DOMPurify || typeof window.DOMPurify.sanitize !== "function") {
        throw new Error("The DOMPurify sanitizer did not load.");
      }

      return window.DOMPurify.sanitize(html, {
        ADD_ATTR: ["checked", "disabled", "target"],
        ADD_TAGS: ["details", "input", "summary"]
      });
    }

    scrollToHashTarget() {
      if (!location.hash) {
        return;
      }

      const id = decodeURIComponent(location.hash.substring(1));
      const target = document.getElementById(id);

      if (target) {
        target.scrollIntoView();
      }
    }

    slugify(text) {
      return text
        .toLowerCase()
        .trim()
        .replace(/<[^>]*>/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || "section";
    }
  }

  window.MFV.FoldableHtmlViewer = FoldableHtmlViewer;
})();
