/* Assessment Partner — embeddable lesson-plan feedback widget.
   Used on triciafriedman.com/ai-assessment-frameworks/ inside <section id="tfap">.
   Loaded as an external script so WordPress never rewrites it.
   Talks to https://ai-assessment-partner.netlify.app/api/partner (CORS allowed for triciafriedman.com). */
(function () {
  var root = document.getElementById('tfap');
  if (!root || root.getAttribute('data-ready')) return;
  root.setAttribute('data-ready', '1');
  var API = 'https://ai-assessment-partner.netlify.app/api/partner';
  var MAX_BYTES = 10 * 1024 * 1024;

  var css = [
    '#tfap{--o:#FF6A00;--ink:#0B0B0F;--cream:#FBF8F1;--mut:#6b6b80;--line:#eadfce;margin:0 0 30px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px 24px 18px;color:var(--ink);font-family:"Plus Jakarta Sans",system-ui,sans-serif}',
    '#tfap *{box-sizing:border-box}',
    '#tfap .p-eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--o);margin:0 0 8px}',
    '#tfap h2.p-title{font-family:Georgia,serif;font-weight:400;font-size:28px;line-height:1.2;margin:0 0 8px;color:var(--ink)}',
    '#tfap .p-intro{font-size:16px;line-height:1.55;margin:0 0 16px;max-width:72ch}',
    '#tfap .p-drop{display:flex;align-items:center;gap:14px;border:2px dashed var(--line);border-radius:14px;padding:16px 18px;cursor:pointer;background:var(--cream);transition:border-color .15s,background .15s}',
    '#tfap .p-drop:hover,#tfap .p-drop.over{border-color:var(--o);background:#fff1e6}',
    '#tfap .p-drop:focus-within{outline:2px solid var(--o);outline-offset:2px}',
    '#tfap .p-drop svg{flex:none;color:var(--o)}',
    '#tfap .p-drop-t{display:block;font-weight:700;font-size:16px}',
    '#tfap .p-drop-s{display:block;font-size:13.5px;color:var(--mut);margin-top:2px}',
    '#tfap .p-drop input{position:absolute;width:1px;height:1px;opacity:0}',
    '#tfap .p-attached{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--cream);font-size:14px}',
    '#tfap .p-attached[hidden],#tfap .p-drop[hidden],#tfap .p-log[hidden]{display:none}',
    '#tfap .p-nm{font-weight:700}',
    '#tfap .p-err{color:#a33a00}',
    '#tfap .p-log{display:flex;flex-direction:column;gap:14px;margin:16px 0 0;max-height:75vh;overflow-y:auto;padding-right:4px}',
    '#tfap .p-msg.user{align-self:flex-end;background:var(--ink);color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;max-width:82%;white-space:pre-wrap;font-size:15px}',
    '#tfap .p-msg.user .p-file{display:block;font-size:12.5px;opacity:.75;margin-bottom:3px}',
    '#tfap .p-msg.bot{background:var(--cream);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:14px 18px;font-size:16px;line-height:1.55}',
    '#tfap .p-msg.bot h3,#tfap .p-msg.bot h4{font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-weight:700;font-size:18px;line-height:1.3;margin:16px 0 6px;color:var(--ink)}',
    '#tfap .p-msg.bot h4{font-size:16px}',
    '#tfap .p-msg.bot > :first-child{margin-top:0}',
    '#tfap .p-msg.bot p{margin:0 0 10px}',
    '#tfap .p-msg.bot ul,#tfap .p-msg.bot ol{margin:0 0 10px;padding-left:22px}',
    '#tfap .p-msg.bot li{margin:3px 0}',
    '#tfap .p-msg.bot a{color:var(--ink)!important;text-decoration:underline!important;text-decoration-color:rgba(255,106,0,.55)!important;text-underline-offset:3px}',
    '#tfap .p-msg.bot table{border-collapse:collapse;width:100%;font-size:14px;margin:6px 0 12px;display:block;overflow-x:auto}',
    '#tfap .p-msg.bot th,#tfap .p-msg.bot td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}',
    '#tfap .p-msg.bot th{background:#fff}',
    '#tfap .p-msg.bot hr{border:0;border-top:1px dashed var(--line);margin:12px 0}',
    '#tfap .p-typing{color:var(--mut);font-size:14px}',
    '#tfap .p-tools{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}',
    '#tfap .p-mini{font:600 13px/1 "Plus Jakarta Sans",system-ui,sans-serif;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 11px;cursor:pointer;color:var(--ink)}',
    '#tfap .p-mini:hover{border-color:var(--ink)}',
    '#tfap form.p-form{display:flex;gap:10px;margin:14px 0 0}',
    '#tfap textarea{flex:1;resize:none;font:15px/1.45 "Plus Jakarta Sans",system-ui,sans-serif;border:1px solid var(--line);border-radius:10px;padding:12px 14px;min-height:50px;max-height:200px;background:#fff;color:var(--ink);margin:0}',
    '#tfap textarea:focus{outline:2px solid var(--o);outline-offset:1px;border-color:transparent}',
    '#tfap .p-btn{font:700 15px/1 "Plus Jakarta Sans",system-ui,sans-serif;background:var(--ink);color:#fff;border:0;border-radius:10px;padding:0 22px;cursor:pointer;min-height:50px}',
    '#tfap .p-btn:hover{background:#26262e}',
    '#tfap .p-btn:disabled{opacity:.45;cursor:default}',
    '#tfap .p-btn:focus-visible,#tfap .p-mini:focus-visible,#tfap .p-link:focus-visible{outline:2px solid var(--o);outline-offset:2px}',
    '#tfap .p-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:13px;color:var(--mut)}',
    '#tfap .p-link{border:0;background:none;font:inherit;color:var(--mut);text-decoration:underline;cursor:pointer;padding:0}',
    '#tfap .p-link[hidden]{display:none}',
    '#tfap .af-pick{margin-top:8px}',
    '@media (max-width:640px){#tfap{padding:18px 16px 14px}#tfap h2.p-title{font-size:24px}#tfap form.p-form{flex-direction:column}#tfap .p-btn{min-height:46px}}'
  ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  root.innerHTML =
    '<p class="p-eyebrow">Get feedback on your plan</p>' +
    '<h2 class="p-title">Hear from the three frameworks that fit your plan best</h2>' +
    '<p class="p-intro">Upload a lesson or unit plan. An AI partner picks the three frameworks in this library that fit it best and gives you feedback through each one: what is already working, what to try, and the three changes to make first.</p>' +
    '<label class="p-drop"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 17v-6"/><path d="m9 13 3-3 3 3"/></svg>' +
    '<span><span class="p-drop-t">Upload a lesson or unit plan</span><span class="p-drop-s">Word (.docx), PDF or a text file, up to 10 MB. Drop it here or click to choose. From Google Docs, use File, Download, Microsoft Word.</span></span>' +
    '<input type="file" accept=".docx,.pdf,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"></label>' +
    '<div class="p-attached" hidden></div>' +
    '<div class="p-log" aria-live="polite" hidden></div>' +
    '<form class="p-form"><label style="position:absolute;left:-9999px" for="tfap-q">Your message</label>' +
    '<textarea id="tfap-q" rows="1" placeholder="Add a note (optional), or paste your plan here"></textarea>' +
    '<button class="p-btn" type="submit">Get feedback</button></form>' +
    '<div class="p-foot"><span>Please take out student names first. Plans are not saved. The partner is an AI and knows each framework only through its summary here, so check the source before relying on a detail.</span><button class="p-link" type="button" hidden>Start over</button></div>';

  var drop = root.querySelector('.p-drop'), fileInput = drop.querySelector('input'),
    attachedEl = root.querySelector('.p-attached'), log = root.querySelector('.p-log'),
    form = root.querySelector('.p-form'), q = root.querySelector('textarea'),
    send = root.querySelector('.p-btn'), reset = root.querySelector('.p-link');
  var attachment = null, history = [], busy = false;

  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (m, t, u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
    return s;
  }
  function md(src) {
    var lines = src.replace(/\r/g, '').split('\n'), out = [], i = 0, list = null;
    function closeList() { if (list) { out.push('</' + list + '>'); list = null; } }
    while (i < lines.length) {
      var l = lines[i];
      if (/^\s*\|.*\|\s*$/.test(l) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        closeList();
        var row = function (r, tag) { return '<tr>' + r.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return '<' + tag + '>' + inline(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>'; };
        var t = '<table><thead>' + row(l, 'th') + '</thead><tbody>'; i += 2;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { t += row(lines[i], 'td'); i++; }
        out.push(t + '</tbody></table>'); continue;
      }
      var h = l.match(/^(#{1,4})\s+(.*)$/);
      if (h) { closeList(); var lv = h[1].length <= 2 ? 'h3' : 'h4'; out.push('<' + lv + '>' + inline(h[2]) + '</' + lv + '>'); i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { closeList(); out.push('<hr>'); i++; continue; }
      var ul = l.match(/^\s*[-*•]\s+(.*)$/), ol = l.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ul || ol) { var want = ul ? 'ul' : 'ol'; if (list !== want) { closeList(); out.push('<' + want + '>'); list = want; } out.push('<li>' + inline((ul || ol)[1]) + '</li>'); i++; continue; }
      if (!l.trim()) { closeList(); i++; continue; }
      closeList();
      var para = [l]; i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*•]\s|\s*\d+[.)]\s|\s*\|)/.test(lines[i])) { para.push(lines[i]); i++; }
      out.push('<p>' + para.map(inline).join('<br>') + '</p>');
    }
    closeList();
    return out.join('');
  }
  function addMsg(role, text) {
    log.hidden = false;
    var d = document.createElement('div'); d.className = 'p-msg ' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') d.textContent = text; else d.innerHTML = md(text);
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function addTools(el, text) {
    var row = document.createElement('div'); row.className = 'p-tools';
    var c = document.createElement('button'); c.type = 'button'; c.className = 'p-mini'; c.textContent = 'Copy';
    c.onclick = function () { navigator.clipboard.writeText(text).then(function () { c.textContent = 'Copied'; setTimeout(function () { c.textContent = 'Copy'; }, 1500); }); };
    row.appendChild(c);
    if (text.length > 1200) {
      var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'p-mini'; dl.textContent = 'Download as a file';
      dl.onclick = function () { var b = new Blob([text], { type: 'text/markdown' }); var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'plan-feedback.md'; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 500); };
      row.appendChild(dl);
    }
    el.appendChild(row);
  }

  // ---- reading files ----
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  async function readDocx(buf) {
    var dv = new DataView(buf), eocd = -1;
    for (var i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('not a zip');
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), entry = null;
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), fnl = dv.getUint16(p + 28, true), exl = dv.getUint16(p + 30, true), cml = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(new Uint8Array(buf, p + 46, fnl));
      if (name === 'word/document.xml') { entry = { method: method, csize: csize, off: off }; break; }
      p += 46 + fnl + exl + cml;
    }
    if (!entry) throw new Error('no document.xml');
    var lfnl = dv.getUint16(entry.off + 26, true), lexl = dv.getUint16(entry.off + 28, true);
    var data = new Uint8Array(buf, entry.off + 30 + lfnl + lexl, entry.csize), xml;
    if (entry.method === 0) xml = new TextDecoder().decode(data);
    else xml = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    var doc = new DOMParser().parseFromString(xml, 'application/xml'), W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    var out = [], paras = doc.getElementsByTagNameNS(W, 'p');
    for (var j = 0; j < paras.length; j++) {
      var t = '', walker = doc.createTreeWalker(paras[j], NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) { var el = walker.currentNode; if (el.namespaceURI !== W) continue; if (el.localName === 't') t += el.textContent; else if (el.localName === 'tab') t += '\t'; else if (el.localName === 'br') t += '\n'; }
      var inCell = paras[j].parentNode ? paras[j].parentNode.localName === 'tc' : false;
      if (t.trim()) out.push((inCell ? '| ' : '') + t);
    }
    return out.join('\n');
  }
  function readAsBase64(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result).split(',')[1] || ''); }; r.onerror = rej; r.readAsDataURL(file); }); }
  function showAttached(msg, isErr) {
    attachedEl.hidden = false; attachedEl.innerHTML = '';
    var s = document.createElement('span');
    if (isErr) { s.className = 'p-err'; s.textContent = msg; }
    else { s.innerHTML = 'Attached: <span class="p-nm"></span> <span style="color:var(--mut)"></span>'; s.querySelector('.p-nm').textContent = attachment.name; s.lastChild.textContent = '(' + msg + ')'; }
    attachedEl.appendChild(s);
    if (isErr || !history.length) {
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'p-mini'; rm.textContent = isErr ? 'Dismiss' : 'Remove';
      rm.onclick = function () { attachment = null; attachedEl.hidden = true; fileInput.value = ''; drop.hidden = history.length > 0; };
      attachedEl.appendChild(rm);
    }
  }
  async function takeFile(file) {
    if (!file) return;
    var name = file.name || 'plan', ext = (name.split('.').pop() || '').toLowerCase();
    if (file.size > MAX_BYTES) { showAttached(name + ' is ' + kb(file.size) + '. Please use a file under 10 MB.', true); return; }
    try {
      if (ext === 'pdf' || file.type === 'application/pdf') {
        attachment = { kind: 'pdf', name: name, data: await readAsBase64(file) };
        drop.hidden = true; showAttached('PDF, ' + kb(file.size));
      } else if (ext === 'docx') {
        var text = await readDocx(await file.arrayBuffer());
        if (!text.trim()) throw new Error('empty');
        attachment = { kind: 'text', name: name, text: text };
        drop.hidden = true; showAttached('Word, ' + text.split(/\s+/).length + ' words');
      } else if (ext === 'txt' || ext === 'md' || file.type.indexOf('text/') === 0) {
        var tx = await file.text();
        if (!tx.trim()) throw new Error('empty');
        attachment = { kind: 'text', name: name, text: tx };
        drop.hidden = true; showAttached('text, ' + tx.split(/\s+/).length + ' words');
      } else if (ext === 'doc') {
        showAttached("Older .doc files can't be read here. In Word, use File, Save As and choose .docx, or paste the plan below.", true);
      } else {
        showAttached("That file type can't be read here. Please use .docx, PDF or a text file, or paste the plan below.", true);
      }
    } catch (e) {
      attachment = null;
      showAttached("I couldn't read " + name + '. Try saving it as PDF, or paste the plan below.', true);
    }
    q.focus();
  }
  fileInput.addEventListener('change', function () { takeFile(fileInput.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) takeFile(e.dataTransfer.files[0]); });

  function startOver() {
    history = []; attachment = null; log.innerHTML = ''; log.hidden = true; attachedEl.hidden = true; fileInput.value = '';
    drop.hidden = false; reset.hidden = true; send.textContent = 'Get feedback';
    q.placeholder = 'Add a note (optional), or paste your plan here';
    markCards();
  }
  reset.onclick = function () { if (!history.length || confirm('Clear this feedback and start over?')) startOver(); };

  async function ask(text) {
    text = (text || '').trim();
    if (!text) { if (attachment) { if (!history.length) text = 'Please give me feedback on this plan.'; } }
    if (!text) { q.focus(); q.placeholder = 'Upload a plan above, or paste it here'; return; }
    if (busy) return;
    busy = true; send.disabled = true; drop.hidden = true;
    var first = !history.length;
    var um = addMsg('user', text);
    if (first) {
      if (attachment) { var fl = document.createElement('span'); fl.className = 'p-file'; fl.textContent = 'Attached: ' + attachment.name; um.insertBefore(fl, um.firstChild); var rmb = attachedEl.querySelector('.p-mini'); if (rmb) rmb.remove(); }
    }
    history.push({ role: 'user', content: text });
    q.value = ''; autosize();
    var bot = addMsg('assistant', ''); bot.innerHTML = '<span class="p-typing">Reading your plan and the library…</span>';
    var reply = '', pending = 0;
    try {
      var res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: history, attachment: attachment }) });
      if (res.status === 413) throw new Error('too_large');
      if (!res.ok || !res.body) throw new Error('status ' + res.status);
      var reader = res.body.getReader(), dec = new TextDecoder();
      while (true) {
        var r = await reader.read(); if (r.done) break;
        reply += dec.decode(r.value, { stream: true });
        if (!pending) pending = requestAnimationFrame(function () { pending = 0; bot.innerHTML = md(reply); });
      }
      reply += dec.decode();
      if (pending) { cancelAnimationFrame(pending); pending = 0; }
      if (!reply.trim()) throw new Error('empty');
      bot.innerHTML = md(reply); addTools(bot, reply);
      history.push({ role: 'assistant', content: reply });
      reset.hidden = false; send.textContent = 'Send';
      q.placeholder = 'Ask a follow-up, for example: rewrite my assessment section';
      if (first) markCards();
    } catch (e) {
      bot.innerHTML = md(e.message === 'too_large' ? 'That file is too large to send. Try a smaller PDF, a .docx, or paste the plan as text.' : "Sorry, I couldn't reach the partner just now. Please try again in a moment.");
      history.pop();
      if (!history.length) { drop.hidden = attachment ? true : false; }
    } finally { busy = false; send.disabled = false; }
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(q.value); });
  q.addEventListener('keydown', function (e) { if (e.key === 'Enter' ? !e.shiftKey : false) { e.preventDefault(); ask(q.value); } });
  function autosize() { q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 200) + 'px'; }
  q.addEventListener('input', autosize);

  // ---- a small button on each library card ----
  function markCards() {
    var cards = document.querySelectorAll('#tfaf .af-card');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], t = c.querySelector('h3');
      if (!t) continue;
      var b = c.querySelector('.af-pick');
      if (!b) {
        b = document.createElement('button'); b.type = 'button'; b.className = 'p-mini af-pick';
        b.style.alignSelf = 'flex-start';
        b.addEventListener('click', (function (title) {
          return function () {
            var line = history.length ? 'Look at my plan through "' + title + '". What is already working and what should I try?' : 'Please include "' + title + '" as one of the three frameworks.';
            q.value = (q.value ? q.value + '\n' : '') + line; autosize();
            root.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(function () { q.focus({ preventScroll: true }); }, 400);
          };
        })(t.textContent.trim()));
        c.appendChild(b);
      }
      b.textContent = history.length ? 'Look at my plan through this' : 'Include in my feedback';
    }
  }
  var cardCss = document.createElement('style');
  cardCss.textContent = '#tfaf .af-pick{font:600 13px/1 "Plus Jakarta Sans",system-ui,sans-serif;border:1px solid #eadfce;background:#fff;border-radius:8px;padding:8px 11px;cursor:pointer;color:#0B0B0F;margin-top:8px;align-self:flex-start}#tfaf .af-pick:hover{border-color:#0B0B0F}#tfaf .af-pick:focus-visible{outline:2px solid #FF6A00;outline-offset:2px}';
  document.head.appendChild(cardCss);
  markCards();
})();
