# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow [SemVer](https://semver.org/).

## [2.2.1] - 2026-10-01

### Changed

- README, changelog, code comments and popup messages rewritten in plainer language.
- The header of the exported file now reads `Exported from <link> on <date>`.
- The page that shows the README inside the extension can render tables.

## [2.2.0] - 2026-09-26

### Changed

- Renamed from "ChatGPT → Markdown" to "ChatGPT Exporter". The extension exports conversations, and Markdown is the first format it supports. The extension ID is the same, so saved options are kept.
- The popup button is now **Export conversation**, and the success messages say "Exported N messages".
- The README lists the supported formats.

## [2.1.0] - 2026-09-26

### Added

- Fixed extension ID (`key` in the manifest). Moving or renaming the folder no longer resets the options. The ID changes one last time with this update.
- README section on moving or renaming the folder.
- MIT license.

## [2.0.0] - 2026-09-26

### Changed (breaking)

- Clicking the icon opens a popup. The export starts from the popup's **Download conversation** button, where before it started on the click.
- The exported file no longer ends with the `_(method: …)_` line. The popup shows the method and any API error.

### Added

- Status messages in the popup: wrong site, no conversation open, exporting, success (with message count, method and file name), fallback used (with the API error) and failure.
- Options saved with `chrome.storage.sync`: method (Auto, API only or Scroll only), header with title, link and date, and date prefix in the file name.
- Popup footer with the version and links to the README and changelog, which open inside the extension (`docs.html`).
- `storage` permission, needed for the options.

### Removed

- The `background.js` service worker. The export code is now in `exporter.js`, and the popup injects it.

## [1.2.0] - 2026-09-25

### Added

- Extension icon in 16, 32, 48 and 128 px, in `icons/`.

## [1.1.0] - 2026-09-25

### Changed

- Translated to English: the text in the exported file (`👤 You`, `_[image sent]_`, `_(method: API)_`), error messages, code comments, manifest, README and changelog.
- The scroll method still recognizes the ChatGPT interface in both English and Portuguese.

## [1.0.1] - 2026-09-25

### Added

- `README.md` covering installation, usage and how the extension works.
- `CHANGELOG.md`.

## [1.0.0] - 2026-09-25

First stable release.

### Fixed

- The scroll method wrote messages out of order. It now sorts them by turn number (`conversation-turn-N`). When a turn has no number, it places the message next to its neighbours on screen.

### Added

- When the API fails, the last line of the file gives the reason.

## [0.2.0] - 2026-09-25

### Fixed

- A message with an image was skipped, together with the text sent with it and ChatGPT's reply.

### Added

- Images and files you sent appear as `📎 _[image: name]_` or `📎 _[file: name]_`.
- A message of yours with no text appears as `_[message without text]_`.
- The last line of the file names the method used (API or scroll).

### Changed

- An error in one message no longer stops the export. Only that message is skipped.
- The scroll method reads each whole turn, including images outside the text block, and scrolls in smaller steps.

## [0.1.0] - 2026-09-25

### Added

- First version: the extension button exports the open conversation as `.md`.
- Main method: ChatGPT's internal API, which returns the full conversation with its formatting.
- Fallback method: scrolling the page.
- Internal citation markers are removed from the text.
