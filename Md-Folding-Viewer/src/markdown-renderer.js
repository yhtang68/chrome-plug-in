(function () {
  "use strict";

  window.MFV = window.MFV || {};

  // Converts raw Markdown into GitHub-flavored-ish HTML. Folding is intentionally handled later.
  class MarkdownRenderer {
    // getters and setters

    // functions
    static addHighlightClasses(html) {
      return html.replace(/<pre><code( class="([^"]*)")?>/g, (match, classAttr, classes) => {
        const classList = new Set((classes || "").split(/\s+/).filter(Boolean));
        classList.add("hljs");
        return '<pre><code class="' + Array.from(classList).join(" ") + '">';
      });
    }

    static highlightCode(code, language) {
      if (!window.hljs) {
        return "";
      }

      try {
        if (language && window.hljs.getLanguage(language)) {
          return window.hljs.highlight(code, {
            language: language,
            ignoreIllegals: true
          }).value;
        }

        return window.hljs.highlightAuto(code).value;
      } catch (error) {
        return "";
      }
    }

    static render(markdown) {
      if (!window.markdownit) {
        throw new Error("The markdown-it parser did not load.");
      }

      const parser = window.markdownit({
        html: true,
        linkify: true,
        typographer: false,
        breaks: false,
        highlight: (code, language) => this.highlightCode(code, language)
      });

      return this.addHighlightClasses(this.renderTaskLists(parser.render(markdown)));
    }

    static renderTaskLists(html) {
      return html.replace(
        /<li>\s*\[([ xX])\]\s+/g,
        (match, checked) => '<li class="task-list-item"><input class="task-list-item-checkbox" type="checkbox" disabled' +
          (checked.toLowerCase() === "x" ? " checked" : "") +
          "> "
      );
    }
  }

  window.MFV.MarkdownRenderer = MarkdownRenderer;
})();
