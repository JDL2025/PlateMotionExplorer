// =====================================================================
// "Read to me": reads cards and help boxes out loud with the iPad's
// built-in voice (no internet needed). Each part lights up while it is read.
// =====================================================================
export function createSpeech() {
  const synth = window.speechSynthesis;
  const ok = !!synth && 'SpeechSynthesisUtterance' in window;
  let voice = null, running = false, queue = [], btn = null, lit = null, keep = [];

  function pickVoice() {
    if (!ok) return;
    const vs = synth.getVoices().filter(v => /^en(-|_)?US/i.test(v.lang) || /^en$/i.test(v.lang));
    const all = vs.length ? vs : synth.getVoices().filter(v => /^en/i.test(v.lang));
    const prefer = ['Samantha', 'Ava', 'Allison', 'Susan', 'Nicky', 'Karen', 'Google US English'];
    voice = null;
    for (const name of prefer) { voice = all.find(v => v.name.includes(name) && /enhanced|premium/i.test(v.name)) || all.find(v => v.name.includes(name)); if (voice) break; }
    if (!voice) voice = all.find(v => v.localService) || all[0] || null;
  }
  if (ok) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  // make the words easier to say
  function clean(t) {
    return t.replace(/\s+/g, ' ')
      .replace(/°F/g, ' degrees Fahrenheit').replace(/°C/g, ' degrees Celsius')
      .replace(/(\d)\s?km\b/g, '$1 kilometers').replace(/(\d)\s?cm\b/g, '$1 centimeters')
      .replace(/(\d)\s?m\b/g, '$1 meters').replace(/(\d)\s?ft\b/g, '$1 feet').replace(/(\d)\s?kg\b/g, '$1 kilograms')
      .replace(/½/g, ' and a half').replace(/(\d+) M\b/g, '$1 million years ago').replace(/✓|→|←/g, '')
      .trim();
  }
  function setBtn(on) { if (btn) { btn.classList.toggle('on', on); const s = btn.querySelector('span'); if (s) s.textContent = on ? 'Stop reading' : 'Read to me'; } }
  function light(el) { if (lit) lit.classList.remove('saying'); lit = el; if (el) { el.classList.add('saying'); try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} } }

  function stop() {
    running = false; queue = [];
    if (ok) synth.cancel();
    light(null); setBtn(false); btn = null; keep = [];
  }
  function next() {
    if (!running) return;
    const item = queue.shift();
    if (!item) { stop(); return; }
    const u = new SpeechSynthesisUtterance(item.text);
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) || 'en-US';
    u.rate = 0.9; u.pitch = 1;
    u.onstart = () => light(item.el);
    u.onend = () => setTimeout(next, 120);
    u.onerror = () => setTimeout(next, 120);
    keep.push(u);
    synth.speak(u);
  }
  // read every part of `root` that has words. `button` toggles between Read and Stop.
  function read(root, button) {
    if (!ok || !root) return;
    if (running && btn === button) { stop(); return; }
    const wasRunning = running || synth.speaking;
    stop();
    btn = button || null;
    const sel = 'h2, h3, h4, .lead, .short, .bul li, .steps-list li, .box p, .qf, .gestures li, .start-row, p.say, .legend div';
    queue = [];
    root.querySelectorAll(sel).forEach(el => {
      if (el.closest('.no-say, button.say-btn, figcaption')) return;
      if (el.matches('.box p') && el.closest('.box') !== el.parentElement) return;
      const t = clean(el.dataset.say || el.innerText || '');
      if (t) queue.push({ el, text: t });
    });
    if (!queue.length) return;
    running = true; setBtn(true);
    if (wasRunning) setTimeout(next, 80); else next();
  }
  return { ok, read, stop, isOn: () => running };
}
