# ChatGPT Exporter

A Chromium extension (Chrome, Edge, Vivaldi, Brave) that saves the ChatGPT conversation open in the current tab to a file. It exports the whole conversation, including the parts the page hasn't loaded yet.

Markdown (`.md`) is the only output format for now.

## Installation

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `chatgpt-exporter` folder, the one that contains `manifest.json`.

After you change any file, click the reload button (↻) on the extension's card.

### Moving or renaming the folder

Chromium loads an unpacked extension from a fixed path. If you move or rename the folder, load the extension again from the new location:

1. Move or rename the folder.
2. On the extensions page, click **Load unpacked** and select the folder in its new place. This replaces the old entry.

Your options survive the move because `manifest.json` has a fixed `key`, which keeps the extension's ID the same wherever the folder is.

Two things erase the saved options: removing the extension before you load it again, and deleting or changing the `key`. A different `key` gives the extension a new ID, and the browser treats it as a new extension.

## Usage

1. Open a conversation on `chatgpt.com`.
2. Click the extension icon to open the popup.
3. Click **Export conversation**. The browser downloads `<conversation title>.md`.

The popup reports the result:

| Message | Meaning |
|---|---|
| This isn't a ChatGPT page / No conversation open | The button stays disabled until you open a conversation. |
| Exporting… | The export is running. You can close the popup and the file still downloads. |
| Exported N messages via API | The export worked. |
| Exported N messages (scroll method, plain text) | The API failed, so the extension used the scroll method. The popup shows the API error. |
| Export failed | Nothing was downloaded. The popup shows the reason. |

### Options

The popup saves your options as you change them, and the browser syncs them with your profile.

| Option | Default | What it does |
|---|---|---|
| Method | Auto | *Auto* tries the API and falls back to scrolling. *API only* and *Scroll only* force one method. |
| Include title, link and date at the top | On | Adds a header to the file. |
| Prefix file name with today's date | Off | Names the file `2026-09-26 My chat.md`. |

The popup footer shows the version and links to this README and the changelog.

## How it works

The extension has two ways to read a conversation.

The API method asks ChatGPT's own internal API for the conversation, using the session you are already logged in with. It returns every message with the original Markdown formatting.

The scroll method is the fallback. It scrolls the conversation to the top, then down one step at a time, and collects each turn as the page renders it. The result is plain text without the original formatting.

## What gets exported

- Your messages and ChatGPT's, in conversation order.
- Images and files you sent appear as a placeholder such as `📎 _[image: name.png]_`. Their content is not exported.
- If you edited messages, the export contains only the branch shown on screen.
- Internal reasoning, tool calls and hidden messages are skipped.
- ChatGPT's internal citation markers are removed.

## Files

| File | Role |
|---|---|
| `manifest.json` | Extension definition and permissions (Manifest V3) |
| `popup.html`, `popup.css`, `popup.js` | Popup with the export button, options, status and footer |
| `exporter.js` | `exportChat()`, the function the popup injects into the ChatGPT tab |
| `docs.html`, `docs.js` | Page that shows this README and the changelog inside the extension |
| `icons/` | Extension icon in 16, 32, 48 and 128 px |

The change history is in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © VitorGaRi
