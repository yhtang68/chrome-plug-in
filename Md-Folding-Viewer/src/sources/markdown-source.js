(function () {
  "use strict";

  window.MFV = window.MFV || {};

  // Base source contract: source-specific input becomes HTML for the shared viewer.
  class MarkdownSource {
    // getters and setters
    canHandle() {
      return false;
    }

    getSourceLabel() {
      return decodeURIComponent(location.pathname.split("/").pop() || "Markdown");
    }

    // functions
    async loadDocument() {
      return {
        html: await this.loadHtml(),
        preserveDom: false,
        sourceType: "native"
      };
    }

    async loadHtml() {
      throw new Error("Markdown source must implement loadHtml() or loadDocument().");
    }
  }

  window.MFV.MarkdownSource = MarkdownSource;
})();
