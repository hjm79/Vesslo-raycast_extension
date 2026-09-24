import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { marked } = await import(pathToFileURL(require.resolve("marked")).href);
const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, "../..");
const documents = [
  { file: "VESSLO_RAYCAST_INTRO.ko", date: "2026.09.13", lang: "ko", title: "Vesslo Raycast 익스텐션 소개", kind: "스크린샷으로 보는 기능과 사용 흐름" },
  { file: "RAYCAST_SUBMISSION.en", date: "2026.09.24", lang: "en", title: "Vesslo — Raycast Store Submission Draft", kind: "Store copy · Reviewer notes · Submission checklist" },
];

function imageData(file) {
  const bytes = fs.readFileSync(file);
  const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const logo = imageData(path.join(repository, "assets/extension-icon.png"));
const css = `
:root{color-scheme:light;--ink:#202a3c;--muted:#647187;--line:#dfe5ee;--blue:#345cb5}
*{box-sizing:border-box}body{margin:0;background:#f3f5f8;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;font-size:16px;line-height:1.85;word-break:keep-all;overflow-wrap:anywhere}
.topbar{max-width:1060px;margin:0 auto;padding:28px 38px;display:flex;justify-content:space-between;align-items:center;gap:20px}.brand{display:flex;align-items:center;gap:12px;font-size:14px;font-weight:700;letter-spacing:.08em}.brand img{width:42px;height:42px}.links{display:flex;gap:20px;flex-wrap:wrap;font-size:13px}a{color:var(--blue);text-underline-offset:3px}
main{max-width:1060px;margin:0 auto 56px;padding:52px 66px 62px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 45px #24365108}.eyebrow{font-size:12px;letter-spacing:.06em;color:var(--muted);margin:0 0 10px}h1{font-size:40px;line-height:1.27;letter-spacing:-.04em;margin:0 0 20px;font-weight:750}h2{font-size:27px;line-height:1.45;letter-spacing:-.025em;margin:58px 0 18px;padding-top:16px;border-top:1px solid var(--line)}h1+h2{border:0;padding:0;margin:0 0 30px;font-size:23px;color:#4a5870;font-weight:550}h3{font-size:20px;line-height:1.5;margin:28px 0 12px}p{margin:15px 0}strong{font-weight:700}li{margin:7px 0}ul,ol{padding-left:26px}blockquote{margin:28px 0;padding:14px 20px;background:#f0f4fc;border-left:3px solid #7995d0;color:#455771;font-size:14px}blockquote p{margin:0}
article img{display:block;width:auto;max-width:100%;height:auto;margin:28px auto 12px;border-radius:10px;border:1px solid var(--line);box-shadow:0 8px 24px #18233214}article p:has(>em:only-child){font-size:13px;color:var(--muted);line-height:1.65;margin:10px auto 26px;max-width:750px}em{font-style:normal}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.7;margin:24px 0}th{text-align:left;background:#eef2f8;color:#34445d;font-weight:650}th,td{padding:13px 15px;border-bottom:1px solid var(--line);vertical-align:top}td:first-child{min-width:100px}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;background:#eef2f7;border-radius:4px;padding:2px 5px;word-break:break-word}pre{overflow:auto;background:#182234;color:#e8eef9;padding:20px;border-radius:8px;word-break:normal}pre code{padding:0;background:none;color:inherit;white-space:pre}hr{border:0;border-top:1px solid var(--line);margin:42px 0}footer{max-width:1060px;margin:0 auto 40px;padding:0 38px;color:var(--muted);font-size:12px}.review h1{font-size:34px}.review table{font-size:13px}.review table td:first-child{min-width:125px}.review li{overflow-wrap:anywhere}
@media(max-width:760px){body{font-size:15px}.topbar{padding:18px 22px;align-items:flex-start}.links{gap:8px;flex-direction:column}main{margin:0 12px 30px;padding:30px 22px;border-radius:10px}h1{font-size:32px}h1+h2{font-size:20px}h2{font-size:23px;margin-top:38px}table{display:block;overflow:auto;font-size:13px}th,td{padding:10px 12px}footer{padding:0 24px}}
@media print{body{background:white;font-size:10pt;line-height:1.65}.topbar,.links,footer{display:none}main{border:0;box-shadow:none;margin:0;padding:0;max-width:none}h1{font-size:27pt}h2{font-size:17pt;margin-top:26px;break-after:avoid}h3{break-after:avoid}table{font-size:9pt}tr,img,blockquote,pre{break-inside:avoid}article img{max-height:128mm;max-width:170mm;box-shadow:none}a{color:inherit;text-decoration:none}pre{white-space:pre-wrap}pre code{white-space:pre-wrap}@page{size:A4;margin:18mm}}
`;

for (const document of documents) {
  const markdown = fs.readFileSync(path.join(directory, `${document.file}.md`), "utf8");
  let content = marked.parse(markdown, { gfm: true });
  content = content.replace(/<img src="([^"]+)"/g, (tag, src) => {
    const file = path.resolve(directory, src);
    if (!file.startsWith(path.join(repository, "media") + path.sep)) throw new Error(`Unexpected image: ${src}`);
    return `<img src="${imageData(file)}"`;
  });
  const html = `<!doctype html><html lang="${document.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${document.title}</title><style>${css}</style></head><body><header class="topbar"><div class="brand"><img src="${logo}" alt="Vesslo">VESSLO / RAYCAST</div><nav class="links"><a href="VESSLO_RAYCAST_INTRO.ko.html">한국어 소개 글</a><a href="RAYCAST_SUBMISSION.en.html">Review preparation</a></nav></header><main class="${document.lang === "en" ? "review" : "introduction"}"><p class="eyebrow">${document.kind} · ${document.date}</p><article>${content}</article></main><footer>Prepared from the local Vesslo Raycast extension. This document does not publish or submit the extension. Images are embedded for offline reading.</footer></body></html>`;
  fs.writeFileSync(path.join(directory, `${document.file}.html`), html);
  console.log(`Rendered ${document.file}.html (${Buffer.byteLength(html)} bytes)`);
}
