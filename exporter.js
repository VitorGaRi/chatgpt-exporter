// Injected into the ChatGPT page by popup.js via chrome.scripting.executeScript.
// Must be self-contained. Returns a result object instead of alerting:
//   { ok: true, count, method, apiError, filename }  or  { ok: false, error }
async function exportChat(opts) {
  opts = Object.assign({ method: "auto", includeHeader: true, dateInFilename: false }, opts);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Strip ChatGPT's internal citation markers (private-use characters U+E200…U+E201 and 【…†…】)
  const ch = String.fromCharCode;
  const citeRe = new RegExp(ch(0xe200) + "[^" + ch(0xe201) + "]*" + ch(0xe201), "g");
  const bracketRe = new RegExp(ch(0x3010) + "[^" + ch(0x3011) + "]*" + ch(0x3011), "g");
  const clean = (s) => s.replace(citeRe, "").replace(bracketRe, "").trim();

  const turnMd = (role, text) =>
    `## ${role === "user" ? "👤 You" : "🤖 ChatGPT"}\n\n${text}\n\n---\n\n`;

  const header = (title, date) =>
    !opts.includeHeader ? "" :
    `# ${title}\n\n` +
    (date ? `_Exported from ${location.href} — ${date}_\n\n` : `_Exported from ${location.href}_\n\n`) +
    "---\n\n";

  const download = (title, md) => {
    let name = (title || "conversation").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 100);
    if (opts.dateInFilename) name = new Date().toISOString().slice(0, 10) + " " + name;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".md";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return a.download;
  };

  // ---------- Method 1: internal API (gets the whole conversation, regardless of what is rendered) ----------
  async function viaApi() {
    const id = (location.pathname.match(/\/c\/([\w-]+)/) || [])[1];
    if (!id) throw new Error("No conversation open (URL has no /c/<id>).");

    const session = await fetch("/api/auth/session", { credentials: "include" }).then((r) => r.json());
    if (!session.accessToken) throw new Error("No accessToken in session.");

    const res = await fetch(`/backend-api/conversation/${id}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();

    // Walk from the current node up to the root (the branch visible on screen), then reverse.
    const chain = [];
    let nodeId = data.current_node;
    while (nodeId && data.mapping[nodeId]) {
      chain.push(data.mapping[nodeId]);
      nodeId = data.mapping[nodeId].parent;
    }
    chain.reverse();

    const skipTypes = new Set([
      "thoughts", "reasoning_recap", "model_editable_context", "user_editable_context",
    ]);
    let md = header(data.title || "ChatGPT Conversation",
      data.create_time ? new Date(data.create_time * 1000).toLocaleString() : "");

    let count = 0;
    for (const node of chain) {
      try {
        const msg = node.message;
        if (!msg) continue;
        const role = msg.author?.role;
        if (role !== "user" && role !== "assistant") continue;
        // Assistant messages addressed to tools (python, search etc.) are not shown on screen
        if (role === "assistant" && msg.recipient && msg.recipient !== "all") continue;
        const hidden = !!msg.metadata?.is_visually_hidden_from_conversation;
        if (role === "assistant" && hidden) continue;

        const c = msg.content || {};
        if (skipTypes.has(c.content_type)) continue;

        let pieces = [];
        let hasImage = false;
        if (Array.isArray(c.parts)) {
          for (const p of c.parts) {
            if (typeof p === "string") pieces.push(p);
            else if (p && typeof p.text === "string") pieces.push(p.text);
            else if (p && /image/i.test(p.content_type || "")) hasImage = true;
            else if (p) pieces.push("_[non-text content]_");
          }
        } else if (typeof c.text === "string") {
          pieces.push(c.content_type === "code" ? "```\n" + c.text + "\n```" : c.text);
        }
        let text = clean(pieces.join("\n\n"));

        // Attachments (images, PDFs etc.) — only indicate what was sent
        const attachments = (msg.metadata?.attachments || [])
          .map((a) => `📎 _[${/^image\//.test(a.mime_type || "") ? "image" : "file"}: ${a.name || "unnamed"}]_`);
        if (hasImage && !attachments.some((a) => a.includes("[image"))) {
          attachments.push("📎 _[image sent]_");
        }
        // Hidden user messages (internal context) are only included if they have attachments
        if (hidden && !attachments.length) continue;
        if (attachments.length) text = attachments.join("\n") + (text ? "\n\n" + text : "");

        if (!text) {
          if (role === "assistant") continue;
          text = "_[message without text]_";
        }

        md += turnMd(role, text);
        count++;
      } catch (e) {
        console.warn("[ChatGPT→MD] error in a message, skipping:", e, node);
      }
    }
    if (!count) throw new Error("API returned no messages.");
    return { title: data.title, md, count };
  }

  // ---------- Method 2 (fallback): scroll the page and collect what gets rendered ----------
  async function viaScroll() {
    const firstTurn = document.querySelector("article, [data-message-author-role]");
    if (!firstTurn) throw new Error("No messages found on the page.");

    let scroller = firstTurn.parentElement;
    while (scroller && !(scroller.scrollHeight > scroller.clientHeight &&
           /(auto|scroll)/.test(getComputedStyle(scroller).overflowY))) {
      scroller = scroller.parentElement;
    }
    scroller = scroller || document.scrollingElement;

    // Scroll to the top until older messages stop loading
    let lastH = -1;
    for (let i = 0; i < 50 && scroller.scrollHeight !== lastH; i++) {
      lastH = scroller.scrollHeight;
      scroller.scrollTop = 0;
      await sleep(700);
    }

    // Each "turn" (article) is the unit: it includes images/files that sit
    // outside the message's text block.
    const collected = new Map(); // key -> {role, text, num}
    const orderList = []; // keys in the real conversation order
    const grab = () => {
      const turns = document.querySelectorAll('article, [data-testid^="conversation-turn-"]');
      const units = turns.length ? turns : document.querySelectorAll("[data-message-author-role]");
      const seen = []; // keys from this pass, in DOM order
      units.forEach((el) => {
        if (el.parentElement?.closest('article, [data-testid^="conversation-turn-"]')) return;
        const roleEl = el.matches("[data-message-author-role]") ? el : el.querySelector("[data-message-author-role]");
        const role = el.getAttribute("data-turn") || roleEl?.getAttribute("data-message-author-role") ||
          (el.querySelector("img") ? "user" : "assistant");
        const key = el.getAttribute("data-testid") || roleEl?.getAttribute("data-message-id") ||
          role + (el.innerText || "").slice(0, 200);
        const imgs = [...el.querySelectorAll("img")].filter((i) => i.naturalWidth > 48 || i.width > 48);
        // Strip the screen-reader prefix ChatGPT adds (depends on the UI language)
        let text = clean(el.innerText || "").replace(/^(You said|ChatGPT said|Você disse|O ChatGPT disse):?\s*/i, "");
        if (imgs.length) text = `📎 _[${imgs.length} image(s)]_` + (text ? "\n\n" + text : "");
        const numMatch = (el.getAttribute("data-testid") || "").match(/conversation-turn-(\d+)/);
        const prev = collected.get(key);
        // Keep the most complete version (images load later)
        if (!prev) {
          if (!text) return;
          collected.set(key, { role, text, num: numMatch ? +numMatch[1] : null });
        } else if (text.length > prev.text.length) {
          prev.text = text;
        }
        seen.push(key);
      });

      // Place new keys next to their already-known neighbours (DOM order),
      // instead of using the order in which they appeared while scrolling.
      seen.forEach((key, i) => {
        if (orderList.includes(key)) return;
        const before = seen.slice(0, i).reverse().find((k) => orderList.includes(k));
        if (before) return orderList.splice(orderList.indexOf(before) + 1, 0, key);
        const after = seen.slice(i + 1).find((k) => orderList.includes(k));
        if (after) return orderList.splice(orderList.indexOf(after), 0, key);
        orderList.push(key);
      });
    };

    // Scroll down gradually while collecting (small steps so tall turns aren't skipped)
    let stuck = 0;
    while (stuck < 3) {
      grab();
      const before = scroller.scrollTop;
      scroller.scrollTop += scroller.clientHeight * 0.5;
      await sleep(500);
      stuck = scroller.scrollTop === before ? stuck + 1 : 0;
    }
    grab();

    const title = document.title.replace(/\s*[-|]\s*ChatGPT\s*$/i, "") || "ChatGPT Conversation";
    let md = header(title, new Date().toLocaleString());
    let items = orderList.map((k) => collected.get(k));
    // If every turn has a number (conversation-turn-N), it is the most reliable source
    if (items.every((it) => it.num !== null)) items.sort((a, b) => a.num - b.num);
    if (!items.length) throw new Error("No messages collected while scrolling.");
    items.forEach(({ role, text }) => { md += turnMd(role, text); });
    return { title, md, count: items.length };
  }

  let apiError = "";
  try {
    let result, method;
    if (opts.method !== "scroll") {
      try {
        result = await viaApi();
        method = "api";
      } catch (e) {
        apiError = e.message;
        console.warn("[ChatGPT→MD] API failed:", e);
        if (opts.method === "api") throw e;
      }
    }
    if (!result) {
      result = await viaScroll();
      method = "scroll";
    }
    const filename = download(result.title, result.md);
    return { ok: true, count: result.count, method, apiError, filename };
  } catch (e) {
    return { ok: false, error: e.message, apiError };
  }
}
