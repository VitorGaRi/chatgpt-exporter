# Changelog

All notable changes to this project. 

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versions follow [SemVer](https://semver.org/).

## [2.2.0] - 2026-09-26

### Changed

- Renamed from **ChatGPT → Markdown** to **ChatGPT Exporter**: the extension exports conversations, and Markdown is the first supported format. Options are kept (same extension ID).
- Popup button is now **Export conversation**, and success messages say "Exported N messages".
- README lists the supported formats.

## [2.1.0] - 2026-09-26

### Added

- Fixed extension ID (`key` in the manifest), so moving or renaming the folder no longer resets the options. The ID changes one last time with this update.
- README section on moving or renaming the folder.
- MIT license.

## [2.0.0] - 2026-09-26

### Changed (breaking)

- Clicking the icon now opens a **popup** instead of exporting right away. The export runs from the popup's **Download conversation** button.
- The `_(method: …)_` line is no longer written at the end of the exported file; the popup shows the method and any API error instead.

### Added

- Status feedback in the popup: wrong site, no conversation open, exporting, success (message count, method, file name), fallback used (with the API error) and failure.
- Options, saved with `chrome.storage.sync`: method (Auto / API only / Scroll only), include header (title, link, date) and date prefix in the file name.
- Popup footer with the version and links to README and changelog, rendered inside the extension (`docs.html`).
- `storage` permission (for the options).

### Removed

- `background.js` service worker; the export code now lives in `exporter.js` and is injected by the popup.

## [1.2.0] - 2026-09-25

### Added

- Extension icon (16, 32, 48 and 128 px) in `icons/`.

## [1.1.0] - 2026-09-25

### Changed

- Everything translated to English: exported file text (`👤 You`, `_[image sent]_`, `_(method: API)_`…), error messages, code comments, manifest, README and CHANGELOG.
- The scroll method still recognizes both the English and Portuguese ChatGPT UI.

## [1.0.1] - 2026-09-25

### Added

- `README.md` with installation, usage and how the extension works.
- `CHANGELOG.md`.

## [1.0.0] - 2026-09-25

First stable release.

### Fixed

- Messages came out of order with the scroll method. Order now comes from the turn number (`conversation-turn-N`) or, when missing, from the position relative to neighbouring messages on screen.

### Added

- When the API fails, the reason appears in the file's last line.

## [0.2.0] - 2026-09-25

### Fixed

- Messages with an image were skipped, along with the text sent with the image and ChatGPT's reply.

### Added

- Images and files sent appear as `📎 _[image: name]_` / `📎 _[file: name]_`.
- Your messages without text appear as `_[message without text]_` instead of disappearing.
- The method used (API or scroll) is noted at the end of the file.

### Changed

- An error in one message no longer stops the export; only that message is skipped.
- The scroll method reads each whole turn (including images outside the text block) and scrolls in smaller steps.

## [0.1.0] - 2026-09-25

### Added

- Initial version: the extension button exports the open conversation as `.md`.
- Primary method via ChatGPT's internal API (full conversation, with formatting).
- Fallback method by scrolling the page.
- Removal of internal citation markers.
