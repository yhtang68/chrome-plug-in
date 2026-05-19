(function () {
  "use strict";

  window.MFV = window.MFV || {};

  // Stores the per-page viewer enabled/disabled state used by the toolbar popup.
  class ViewerToggle {
    constructor(currentLocation) {
      this.key = "mfv-disabled:" + currentLocation.origin + currentLocation.pathname;
    }

    // getters and setters
    isDisabled() {
      return new Promise((resolve) => {
        chrome.storage.local.get(this.key, (items) => {
          resolve(items[this.key] === true);
        });
      });
    }

    setDisabled(disabled) {
      return new Promise((resolve) => {
        if (disabled) {
          chrome.storage.local.set({ [this.key]: true }, resolve);
        } else {
          chrome.storage.local.remove(this.key, resolve);
        }
      });
    }

    // functions
  }

  window.MFV.ViewerToggle = ViewerToggle;
})();
