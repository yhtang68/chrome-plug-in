# Gmail Hover Sender

A simple Chrome extension that highlights Gmail sender email addresses on hover and lets you Alt+Click to search all emails from that sender in Gmail.

## What it does

- Applies only on Gmail pages (`https://mail.google.com/*`).
- Highlights sender email addresses when you hover over them.
- Uses mouse `Click` on a sender to search Gmail for all emails from that sender.

## Install in Chrome Dev Mode

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `Chrome-Plug-In-Gmail-Sender` folder.
5. The extension should now appear in your extension list and be active on Gmail.

## Files

- `manifest.json` — Chrome extension manifest describing permissions, content scripts, and metadata.
- `content.js` — JavaScript that runs on Gmail pages to handle hover highlighting and Alt+Click search.
- `styles.css` — CSS styles used by the extension to highlight sender elements.

## Notes

- This extension is intended for development/testing in Chrome's unpacked extension mode.
- Make sure Gmail is loaded on a page under `mail.google.com` for the extension to work.
