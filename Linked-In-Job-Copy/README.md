# LinkedIn Job Copy

A simple Chrome extension that highlights the `About the job` content on LinkedIn job pages and copies that content when clicked.

## Features

- Applies only on LinkedIn job pages (`https://www.linkedin.com/jobs/*`).
- Highlights only the `About the job` heading text so it is visibly clickable.
- Shows `Click to copy job content` when hovering the highlighted heading.
- Click the highlighted heading to copy the job content with readable line breaks and rich HTML formatting when supported.

## Install

1. Open Chrome and go to `chrome://extensions/`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `Linked-In-Job-Copy` folder.
5. Open a LinkedIn job page such as `https://www.linkedin.com/jobs/view/4420437821/`.

## Files

- `manifest.json` - Chrome extension manifest describing permissions and content scripts.
- `content.js` - JavaScript that runs on LinkedIn job pages to find, highlight, and copy the job content.
- `styles.css` - Hover highlight and tooltip styling.
