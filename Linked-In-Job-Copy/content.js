/**
 * LinkedIn Job Copy
 * Click "About the job" to copy the job description.
 */

(function () {
  const ABOUT_JOB_RE = /^about\s+the\s+job$/i;
  const JOB_CONTENT_SELECTOR =
    ".jobs-description-content__text, .jobs-description__content, .jobs-box__html-content";

  let currentHeading = null;
  let currentContent = null;
  let tooltip = null;

  function isLinkedInJobPage() {
    return location.hostname === "www.linkedin.com" && location.pathname.startsWith("/jobs/");
  }

  function cleanText(text) {
    return (text || "")
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function isAboutJobHeading(node) {
    return ABOUT_JOB_RE.test(cleanText(node.textContent).replace(/:$/, ""));
  }

  function findAboutJobHeading() {
    return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).find(isAboutJobHeading);
  }

  function findJobContent(heading) {
    const knownContent = heading.closest(JOB_CONTENT_SELECTOR);
    if (knownContent && cleanText(knownContent.textContent).length > 200) {
      return knownContent;
    }

    let node = heading.parentElement;

    while (node && node !== document.body) {
      const text = cleanText(node.textContent);

      if (text.length > 500 && text.includes(cleanText(heading.textContent))) {
        return node;
      }

      node = node.parentElement;
    }

    return heading.parentElement;
  }

  function buildClipboardContent(content) {
    const clone = content.cloneNode(true);

    clone.querySelectorAll("button, script, style").forEach((node) => node.remove());

    return {
      html: clone.innerHTML.trim(),
      text: cleanText(clone.innerText || clone.textContent)
    };
  }

  async function copyJobContent(content) {
    if (navigator.clipboard?.write && window.ClipboardItem && content.html) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([content.html], { type: "text/html" }),
            "text/plain": new Blob([content.text], { type: "text/plain" })
          })
        ]);
        return;
      } catch (error) {
        console.warn("HTML copy failed; falling back to text.", error);
      }
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content.text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = content.text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function showTooltip(anchor, text, duration) {
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "lijc-tooltip";
      document.body.appendChild(tooltip);
    }

    const rect = anchor.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 8}px`;
    tooltip.classList.add("lijc-tooltip--visible");

    window.clearTimeout(tooltip.hideTimer);

    if (duration) {
      tooltip.hideTimer = window.setTimeout(() => {
        tooltip.classList.remove("lijc-tooltip--visible");
      }, duration);
    }
  }

  function hideTooltip() {
    if (!tooltip) return;

    window.clearTimeout(tooltip.hideTimer);
    tooltip.classList.remove("lijc-tooltip--visible");
  }

  function enhance() {
    if (!isLinkedInJobPage()) return;

    const heading = findAboutJobHeading();
    if (!heading || heading === currentHeading) return;

    const content = findJobContent(heading);
    if (!content) return;

    currentHeading = heading;
    currentContent = content;

    heading.classList.add("lijc-about-job");

    heading.addEventListener("mouseenter", () => {
      showTooltip(heading, "Click to copy job content");
    });

    heading.addEventListener("mouseleave", hideTooltip);

    heading.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const clipboardContent = buildClipboardContent(currentContent);
      if (!clipboardContent.text) return;

      await copyJobContent(clipboardContent);
      showTooltip(currentHeading, "Job Copied", 1500);
    });
  }

  if (!isLinkedInJobPage()) return;

  enhance();
  new MutationObserver(enhance).observe(document.body, {
    childList: true,
    subtree: true
  });
})();
