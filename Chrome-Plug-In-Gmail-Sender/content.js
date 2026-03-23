/**
 * content.js
 * Gmail Hover Sender Extension
 * Highlights sender emails on hover and supports Alt+Click search
 */

(function() {
  const NAMESPACE = "gsqv";
  const emailRegex = /<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i;

  // Config: require Alt key for click? Default: false
  const altRequired = false; 

  // Helper function: extract email from a sender span
  function getSender(senderSpan) {
    if (!senderSpan) return null;

    if (senderSpan.classList.contains("go")) {
      const text = senderSpan.textContent.trim();
      const match = text.match(emailRegex);
      return match ? match[1] : null;
    }

    if (senderSpan.classList.contains("gD")) {
      return senderSpan.getAttribute("email") || null;
    }

    return null;
  }

  // Attach click & hover to a single sender span
  function attachClickToSpan(senderSpan) {
    if (senderSpan._hoverListenerAdded) return;

    const email = getSender(senderSpan);
    if (!email) return;

    senderSpan.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (altRequired && !ev.altKey) return; // Alt required logic
      location.href = `#search/from:${email}`;
    });

    senderSpan._hoverListenerAdded = true;
    senderSpan.dataset[`${NAMESPACE}Enhanced`] = "true";
  }

  // Mouseover handler (hover highlight)
  function handleMouseOver(e) {
    const senderSpan = e.target.closest("span.go, span.gD");
    if (!senderSpan) return;
    attachClickToSpan(senderSpan);
  }

  // Scan all sender spans currently on the page (SPA-safe)
  function scanEmail() {
    const spans = document.querySelectorAll("span.go, span.gD");
    spans.forEach(attachClickToSpan);
  }

  // Initialize
  function main() {
    document.body.addEventListener("mouseover", handleMouseOver);
    scanEmail();
    console.log(`Gmail Hover Sender extension active (Alt required: ${altRequired})`);
  }

  main();
})();