# ChatGPT Exporter

Chromium extension (Chrome, Edge, Vivaldi, Brave…) that exports the ChatGPT conversation currently open on screen to a file — in full, even if it isn't entirely loaded on the page.

**Supported formats:** Markdown (`.md`). More formats may be added in the future.

## Installation

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this extension's folder (`chatgpt-exporter`, the one containing `manifest.json`).

After changing any file, click the reload button (↻) on the extension's card.

### Moving or renaming the folder

Chromium loads an unpacked extension from a fixed path, so after moving or renaming this folder the extension has to be loaded again from the new location.

The manifest has a fixed `key`, which keeps the extension's ID the same wherever the folder lives, so your options survive the move. To keep them:

1. Move or rename the folder.
2. On the extensions page, click **Load unpacked** and select the folder at its new location. It replaces the old entry.

**Don't remove the extension before loading it again**: removing it erases its saved options. If you delete or change the `key` in `manifest.json`, the ID changes and the browser treats it as a new extension, without the old options.

## Usage

1. Open a conversation on `chatgpt.com`.
2. Click the extension icon. A small popup opens.
3. Click **Export conversation**. A `<conversation title>.md` file is downloaded.

The popup tells you what happened:

- **Not a ChatGPT page / no conversation open**: the button stays disabled.
- **Exporting…**: in progress. You can close the popup; the download still happens.
- **Exported N messages via API**: success.
- **Exported N messages (scroll method)**: worked, but the API failed and the fallback was used (plain text only). The API error is shown.
- **Export failed**: nothing was downloaded; the reason is shown.

### Options

Saved automatically and synced with your browser profile.

- **Method**: *Auto* (API, then scroll if it fails), *API only* or *Scroll only*.
- **Include title, link and date at the top** of the file (on by default).
- **Prefix file name with today's date**, e.g. `2026-09-26 My chat.md` (off by default).

The popup footer shows the version and links to this README and the changelog.

## How it works

1. **API** (primary): reads the full conversation through the internal API the site itself uses, with your existing logged-in session. Gets everything, with the responses' original Markdown formatting.
2. **Scroll** (fallback): scrolls the conversation to the top and then down step by step, collecting each rendered turn. Only plain text comes out, without the original formatting.

## What gets exported

- Your messages and ChatGPT's, in conversation order.
- Images and files you sent appear only as a placeholder (`📎 _[image: name.png]_`), without their content.
- In conversations with edited messages, only the branch visible on screen is exported.
- Internal reasoning (thinking), tool calls and hidden messages are skipped.
- ChatGPT's internal citation markers are removed.

## Structure

```
manifest.json      # Manifest V3
popup.html/css/js  # Popup: run button, options, status, footer
exporter.js        # exportChat(): injected into the ChatGPT tab
docs.html/js       # Renders README.md / CHANGELOG.md inside the extension
icons/             # Extension icons (16, 32, 48, 128 px)
```

See the change history in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © VitorGaRi
