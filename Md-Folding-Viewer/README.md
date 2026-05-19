# Markdown Folding Viewer

A small Chrome extension that turns opened Markdown files into a readable HTML view with foldable `h1` and `h2` sections. If a Markdown file already contains its own `<details>` / `<summary>` foldable sections, the viewer keeps those sections and does not wrap the page again.

## Contents

- [Install locally](#install-locally)
- [Use](#use)
- [UI Overview](#ui-overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [Chrome Plugin Extension Shell](#1-chrome-plugin-extension-shell)
- [Markdown Source Selection](#2-markdown-source-selection)
- [Source Adapters](#3-source-adapters)
- [GitHub Markdown Code Path](#4-github-markdown-code-path)
- [Native Markdown Code Path](#5-native-markdown-code-path)
- [Shared Foldable Envelope](#6-shared-foldable-envelope)

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `C:\dev\yhtang\chrome-plug-in\Md-Folding-Viewer`.
5. For local Markdown files, enable **Allow access to file URLs** on this extension's details page.
6. Pin **Markdown Folding Viewer** from Chrome's extensions menu if you want the toggle next to the URL bar.

## Use

Open one of these Markdown sources in Chrome:

- A local or hosted raw `.md` / `.markdown` file.
- A GitHub Markdown blob page, such as `https://github.com/owner/repo/blob/main/README.md`.

The extension will automatically render the page. The Markdown document starts at the top of the viewport, and the viewer controls live in a small floating **Controls** menu at the bottom-right of the page.

Use the floating menu to:

- **Expand all** opened/created foldable sections.
- **Fold all** opened/created foldable sections.
- **Disable viewer** for the current page and reload back to the original view.

If the document already has HTML foldable blocks, for example:

```md
<details>
<summary>Test Strategy</summary>

## Load Testing
Notes here...

</details>
```

the viewer treats it as already foldable. It will render the existing foldable blocks and skip the extra `h1` / `h2` wrapping step.

For GitHub blob pages, it reuses GitHub's rendered Markdown HTML when available, so GitHub-specific bullets, links, tables, and heading anchors stay intact.

Use the extension icon next to the URL bar to enable or disable the viewer for the current page. The page reloads after toggling so you can switch between the folding viewer and the original GitHub/raw view.

The viewer keeps its Markdown parser, syntax highlighter, sanitizer, and native GitHub-like theme local so it works cleanly as a Manifest V3 extension. Native/raw Markdown is rendered with bundled `markdown-it`, highlighted with bundled `Highlight.js`, styled by native-scoped GitHub Markdown CSS, and sanitized with bundled `DOMPurify`. GitHub blob pages reuse GitHub's rendered HTML and preserve GitHub's existing page theme/classes. Both paths then go through the same foldable HTML post-processing step unless existing foldable content is detected.

## UI Overview

- The Markdown content uses a clean reader layout with GitHub-like Markdown styling.
- Generated foldable sections use native disclosure arrows on `h1` and `h2` headings.
- The old sticky control banner has been removed so it does not cover the first Markdown heading.
- The floating **Controls** menu stays out of the document flow and opens only when needed.

## How It Works

The entry point is `src/app.js`. Chrome runs it as a content script because `manifest.json` lists the source files, vendor libraries, and styles that should load on supported Markdown pages.

At a high level, the flow is:

```text
manifest.json
  -> src/app.js
    -> pick the Markdown source
    -> check whether the viewer is disabled for this page
    -> load Markdown as HTML
    -> render the shared folding viewer
```

`src/app.js` starts by calling `pickSource()`. That chooses one of two source adapters:

- `GitHubMarkdownSource` handles GitHub Markdown blob pages.
- `NativeMarkdownSource` handles direct `.md` / `.markdown` URLs, including local `file://` Markdown files.

After a source is selected, `ViewerToggle` checks Chrome storage to see whether the viewer was disabled for the current page. If it is disabled, the content script stops and leaves the original page alone.

If the viewer is enabled, the selected source returns a document payload:

- GitHub pages usually provide already-rendered GitHub HTML.
- Native Markdown files are parsed into HTML with local `markdown-it`, highlighted with local Highlight.js, and then sanitized with DOMPurify.

Finally, `FoldableHtmlViewer.render()` owns the visible page. It replaces the raw page with the reader shell, mounts the Markdown HTML, normalizes heading IDs, keeps heading links working, and adds the floating **Controls** menu. If the rendered document already contains real `<details>` / `<summary>` foldable sections, it keeps them as-is. Otherwise, it wraps top-level `h1` and `h2` sections in generated foldable `<details>` blocks.

## Architecture

The core design has exactly two source paths:

1. GitHub Markdown source
   - Detects `github.com/<owner>/<repo>/blob/<branch>/*.md`.
   - Moves GitHub's already-rendered `.markdown-body` DOM into the viewer.
   - Preserves GitHub's existing page theme/classes and original rendered HTML behavior as much as possible.
   - Applies the shared foldable envelope after the GitHub HTML is mounted, unless existing foldable sections are detected.

2. Native Markdown source
   - Detects direct `.md` / `.markdown` URLs, including local `file://` Markdown files.
   - Reads raw Markdown text from the page.
   - Converts it to GitHub-like HTML with local `markdown-it`.
   - Applies local Highlight.js syntax highlighting and native-scoped GitHub-like CSS.
   - Applies the shared foldable envelope after the native Markdown has become HTML, unless existing foldable sections are detected.

The foldable envelope is deliberately last when the document needs viewer-generated folding:

```text
source md/html -> source-specific HTML -> shared foldable h1/h2 envelope
```

For documents that already contain `<details>` / `<summary>` blocks, the final envelope is skipped:

```text
source md/html -> source-specific HTML -> preserve existing foldable sections
```

## File Structure

```text
Md-Folding-Viewer/
  manifest.json
  README.md
  styles.css
  popup.html
  popup.css
  popup.js
  src/
    app.js
    source-rules.js
    viewer-toggle.js
    markdown-renderer.js
    foldable-html-viewer.js
    sources/
      markdown-source.js
      native-markdown-source.js
      github-markdown-source.js
  vendor/
    markdown-it.min.js
    highlight.min.js
    purify.min.js
    native-github-markdown.css
    native-highlight-github.css
```

1. **Chrome Plugin Extension Shell**

   - `manifest.json` wires the Chrome extension, content scripts, popup, local libraries, and CSS load order.
   - `popup.html`, `popup.css`, and `popup.js` implement the toolbar popup toggle for enabling/disabling the viewer on the current page.
   - `styles.css` owns the viewer shell, floating controls, and foldable-envelope styling. It does not decide the Markdown source and it does not parse Markdown.

2. **Markdown Source Selection**

   - `src/app.js` chooses the source:
     - `GitHubMarkdownSource` for `github.com/<owner>/<repo>/blob/<branch>/*.md` URLs.
     - `NativeMarkdownSource` for `.md` / `.markdown` URLs.
   - `src/source-rules.js` contains the URL rules that decide whether the current page is GitHub Markdown or native Markdown.
   - `src/viewer-toggle.js` stores the current page enable/disable state used by the Chrome toolbar popup.

3. **Source Adapters**

   `src/sources/` contains the source adapters. This folder exists because GitHub Markdown and native Markdown enter the pipeline differently, but both must become HTML before folding:

   - `src/sources/markdown-source.js` defines the base source contract.
   - `src/sources/github-markdown-source.js` owns the GitHub Markdown code path.
   - `src/sources/native-markdown-source.js` owns the native Markdown code path.

4. **GitHub Markdown Code Path**

   GitHub path:

   ```text
   github.com/.../*.md -> GitHub rendered .markdown-body HTML -> shared foldable envelope
   ```

   - `src/sources/github-markdown-source.js` detects GitHub blob Markdown URLs.
   - It moves GitHub's already-rendered `.markdown-body` DOM into the viewer.
   - It keeps GitHub as the source type with `sourceType: "github"`.
   - It does not use the native Markdown parser or native theme when GitHub HTML is available.

5. **Native Markdown Code Path**

   Native path:

   ```text
   file/raw .md -> markdown-it GitHub-like HTML -> Highlight.js -> DOMPurify -> shared foldable envelope or existing foldable sections
   ```

   - `src/sources/native-markdown-source.js` detects direct `.md` / `.markdown` URLs and reads the raw Markdown text.
   - `src/markdown-renderer.js` owns native Markdown parsing, task-list normalization, raw HTML passthrough for sanitized Markdown HTML such as `<details>`, and code syntax highlighting.
   - `vendor/markdown-it.min.js` parses native Markdown into HTML.
   - `vendor/highlight.min.js` adds syntax highlighting for native fenced code blocks.
   - `vendor/purify.min.js` sanitizes native-rendered HTML before insertion.
   - `vendor/native-github-markdown.css` is GitHub Markdown CSS scoped to native viewer pages only.
   - `vendor/native-highlight-github.css` is the native code-highlight theme scoped to native viewer pages only.
   - `vendor/` supports this native path because native Markdown must be parsed, highlighted, sanitized, and themed locally before folding.
   - GitHub source normally does not need `vendor/` parsing/theme files because GitHub already rendered and styled the Markdown page.

6. **Shared Foldable Envelope**

   - `src/foldable-html-viewer.js` is the shared final step for both source paths.
   - For GitHub source, it preserves GitHub body classes/DOM, mounts GitHub's rendered HTML, applies `sourceType: "github"`, and wraps `h1` / `h2` sections when needed.
   - For native source, it sanitizes locally rendered GitHub-like HTML, applies `sourceType: "native"`, and wraps `h1` / `h2` sections when needed.
   - It detects existing `<details>` / `<summary>` content and skips the wrapping pass to avoid double-folding.
   - It also normalizes heading IDs, keeps heading permalink behavior, and binds the floating viewer controls.
