(function () {
  "use strict";

  window.MFV = window.MFV || {};

  const { markdownFilePath } = window.MFV.sourceRules;

  // Native/raw Markdown files need parsing before the shared fold patch can run.
  class NativeMarkdownSource extends window.MFV.MarkdownSource {
    // getters and setters
    canHandle() {
      return markdownFilePath.test(location.pathname);
    }

    getMarkdownText() {
      const pre = document.querySelector("body > pre");
      if (pre) return pre.textContent;
      return document.body ? document.body.innerText : "";
    }

    // functions
    async loadDocument() {
      const markdown = this.getMarkdownText();

      return {
        html: window.MFV.MarkdownRenderer.render(markdown),
        preserveDom: false,
        sourceType: "native"
      };
    }

    async loadHtml() {
      return window.MFV.MarkdownRenderer.render(this.getMarkdownText());
    }
  }

  window.MFV.NativeMarkdownSource = NativeMarkdownSource;
})();
