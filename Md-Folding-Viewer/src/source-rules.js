(function () {
  "use strict";

  window.MFV = window.MFV || {};

  // Shared URL rules that identify the two supported Markdown sources.
  window.MFV.sourceRules = {
    markdownFilePath: /\.(md|markdown)([#?].*)?$/i,
    githubMarkdownBlobPath: /^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+\.(?:md|markdown))$/i
  };
})();
