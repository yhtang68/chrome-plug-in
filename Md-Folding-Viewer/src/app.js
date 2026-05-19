(function () {
  "use strict";

  window.MFV = window.MFV || {};

  function pickSource() {
    return [
      new window.MFV.GitHubMarkdownSource(),
      new window.MFV.NativeMarkdownSource()
    ].find((source) => source.canHandle());
  }

  async function main() {
    const source = pickSource();
    if (!source || document.documentElement.dataset.mfvRendered === "true") {
      return;
    }

    const toggle = new window.MFV.ViewerToggle(location);
    if (await toggle.isDisabled()) {
      return;
    }

    document.documentElement.dataset.mfvRendered = "true";

    const viewer = new window.MFV.FoldableHtmlViewer(toggle);
    try {
      viewer.render(await source.loadDocument(), source.getSourceLabel());
    } catch (error) {
      viewer.render(
        {
          html: '<h1>Markdown load failed</h1><p><code>' +
            viewer.escapeHtml(error.message || String(error)) +
            "</code></p>",
          preserveDom: false,
          sourceType: "native"
        },
        "Load failed"
      );
    }
  }

  main();
})();
