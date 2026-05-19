(function () {
  "use strict";

  var MARKDOWN_EXTENSIONS = /\.(md|markdown)([#?].*)?$/i;
  var status = document.getElementById("status");
  var toggle = document.getElementById("viewerToggle");
  var activeTab = null;

  function isSupportedUrl(url) {
    try {
      var parsed = new URL(url);
      return MARKDOWN_EXTENSIONS.test(parsed.pathname) ||
        /^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/.+\.(md|markdown)$/i.test(url);
    } catch (error) {
      return false;
    }
  }

  function getStorageKey(url) {
    var parsed = new URL(url);
    return "mfv-disabled:" + parsed.origin + parsed.pathname;
  }

  function setDisabled(key, disabled, callback) {
    if (disabled) {
      chrome.storage.local.set({ [key]: true }, callback);
    } else {
      chrome.storage.local.remove(key, callback);
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    activeTab = tabs[0];

    if (!activeTab || !activeTab.url || !isSupportedUrl(activeTab.url)) {
      status.textContent = "This tab is not a supported Markdown page.";
      toggle.disabled = true;
      return;
    }

    var key = getStorageKey(activeTab.url);
    chrome.storage.local.get(key, function (items) {
      var disabled = items[key] === true;
      toggle.checked = !disabled;
      status.textContent = disabled ? "Original page is showing." : "Folding viewer is active.";
    });
  });

  toggle.addEventListener("change", function () {
    if (!activeTab || !activeTab.url) {
      return;
    }

    var key = getStorageKey(activeTab.url);
    var disabled = !toggle.checked;
    setDisabled(key, disabled, function () {
      chrome.tabs.reload(activeTab.id);
      window.close();
    });
  });
})();
