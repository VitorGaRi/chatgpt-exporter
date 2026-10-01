// Renders README.md and CHANGELOG.md inside the extension. Supports a small Markdown
// subset: headings, lists, tables, code blocks, inline code, bold, italic and links.
const ALLOWED = ["README.md", "CHANGELOG.md"];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s) {
  const codes = [];
  s = esc(s).replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,:;]|$)/g, "$1<em>$2</em>")
    .replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
      if (ALLOWED.includes(href)) return `<a href="docs.html?f=${href}">${text}</a>`;
      if (/^https?:\/\//.test(href)) return `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    });
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}

function render(md) {
  const out = [];
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let list = null, para = [];
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`</${list}>`); list = null; };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      flushPara(); flushList();
      const code = [];
      while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    if (line.startsWith("|")) {
      flushPara(); flushList();
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i++) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      }
      i--;
      const cells = (row, tag) => "<tr>" + row.map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>";
      // rows[1] is the |---|---| separator
      out.push(`<table><thead>${cells(rows[0], "th")}</thead><tbody>${rows.slice(2).map((r) => cells(r, "td")).join("")}</tbody></table>`);
      continue;
    }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      flushPara(); flushList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if ((m = line.match(/^\s*(?:[-*]|(\d+)\.)\s+(.*)/))) {
      flushPara();
      const type = m[1] ? "ol" : "ul";
      if (list !== type) { flushList(); out.push(`<${type}>`); list = type; }
      out.push(`<li>${inline(m[2])}</li>`);
    } else if (!line.trim()) {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara(); flushList();
  return out.join("\n");
}

(async () => {
  const f = new URLSearchParams(location.search).get("f");
  const file = ALLOWED.includes(f) ? f : "README.md";
  document.title = `ChatGPT Exporter: ${file.replace(".md", "")}`;
  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
  const el = document.getElementById("content");
  try {
    el.innerHTML = render(await (await fetch(file)).text());
  } catch (e) {
    el.textContent = "Could not load " + file + ": " + e.message;
  }
})();
