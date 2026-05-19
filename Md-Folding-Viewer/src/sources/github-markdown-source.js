(function () {
  "use strict";

  window.MFV = window.MFV || {};

  const { githubMarkdownBlobPath } = window.MFV.sourceRules;

  // GitHub blob pages are already rendered HTML. Prefer that over reparsing raw MD.
  class GitHubMarkdownSource extends window.MFV.MarkdownSource {
    // getters and setters
    canHandle() {
      return location.hostname === "github.com" && githubMarkdownBlobPath.test(location.pathname);
    }

    getRawUrl() {
      const match = location.pathname.match(githubMarkdownBlobPath);
      if (!match) return "";

      return "https://raw.githubusercontent.com/" +
        match.slice(1).map(encodeURIComponent).join("/");
    }

    getRenderedFragment() {
      const markdownBody = document.querySelector("article.markdown-body, .markdown-body");
      if (!markdownBody) {
        return null;
      }

      const fragment = document.createDocumentFragment();
      Array.from(markdownBody.childNodes).forEach((node) => {
        fragment.appendChild(node);
      });
      return fragment;
    }

    // functions
    async loadDocument() {
      const renderedFragment = this.getRenderedFragment();
      if (renderedFragment) {
        return {
          fragment: renderedFragment,
          preserveDom: true,
          sourceType: "github"
        };
      }

      const response = await fetch(this.getRawUrl(), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " while loading " + this.getRawUrl());
      }

      const markdown = await response.text();

      return {
        html: window.MFV.MarkdownRenderer.render(markdown),
        preserveDom: false,
        sourceType: "native"
      };
    }
  }

  window.MFV.GitHubMarkdownSource = GitHubMarkdownSource;
})();
