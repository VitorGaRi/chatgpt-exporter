const DEFAULTS = { method: "auto", includeHeader: true, dateInFilename: false };
const CHATGPT_RE = /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//;

const $ = (id) => document.getElementById(id);
const runBtn = $("run");
const statusEl = $("status");
let tab;

function setStatus(kind, text, detail) {
  statusEl.className = "status " + (kind || "");
  statusEl.textContent = text || "";
  if (detail) {
    const small = document.createElement("small");
    small.textContent = detail;
    statusEl.appendChild(small);
  }
}

// ---------- Options (saved in chrome.storage.sync) ----------
async function loadOptions() {
  const opts = await chrome.storage.sync.get(DEFAULTS);
  $("method").value = opts.method;
  $("includeHeader").checked = opts.includeHeader;
  $("dateInFilename").checked = opts.dateInFilename;
}
function readOptions() {
  return {
    method: $("method").value,
    includeHeader: $("includeHeader").checked,
    dateInFilename: $("dateInFilename").checked,
  };
}
["method", "includeHeader", "dateInFilename"].forEach((id) =>
  $(id).addEventListener("change", () => chrome.storage.sync.set(readOptions()))
);

// ---------- Check the current tab ----------
async function checkTab() {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";
  if (!CHATGPT_RE.test(url)) {
    setStatus("warn", "This isn't a ChatGPT page.", "Open a conversation on chatgpt.com and click the icon again.");
    return;
  }
  if (!/\/c\/[\w-]+/.test(new URL(url).pathname)) {
    setStatus("warn", "No conversation open.", "Open (or start) a conversation first.");
    return;
  }
  runBtn.disabled = false;
  setStatus("", "");
}

// ---------- Run ----------
runBtn.addEventListener("click", async () => {
  const opts = readOptions();
  runBtn.disabled = true;
  setStatus("", "Exporting…",
    opts.method === "api" ? "" : "If it falls back to scrolling, the page will scroll by itself. " +
    "You can close this popup; the file still downloads when done.");

  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: exportChat,
      args: [opts],
    });
    if (!result) throw new Error("The page returned no result.");

    if (!result.ok) {
      setStatus("err", "Export failed: " + result.error,
        result.apiError && result.apiError !== result.error ? "API error: " + result.apiError : "");
    } else if (result.method === "scroll" && result.apiError) {
      setStatus("warn", `Downloaded ${result.count} messages (scroll method, plain text).`,
        `${result.filename} — API failed: ${result.apiError}`);
    } else {
      setStatus("ok", `Downloaded ${result.count} messages via ${result.method === "api" ? "API" : "scroll"}.`,
        result.filename);
    }
  } catch (e) {
    setStatus("err", "Could not run on this page.", e.message);
  } finally {
    runBtn.disabled = false;
  }
});

// ---------- Footer ----------
$("version").textContent = "v" + chrome.runtime.getManifest().version;
document.querySelectorAll("[data-doc]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL("docs.html?f=" + a.dataset.doc) });
  })
);

loadOptions();
checkTab();
