Here's a self-contained script you can drop into any website's `<head>`. You'll just need to swap in your Botpress bot ID and optionally your bot's shareable URL.

```html
<script>
(function () {
  // ── CONFIGURATION ──────────────────────────────────────────────
  const BOT_ID   = '1f8e5ec1-8951-4b26-b78d-4f6986d3a3f1';          // from Botpress dashboard
  const BOT_URL  = `https://cdn.botpress.cloud/webchat/v2/shareable.html?botId=1f8e5ec1-8951-4b26-b78d-4f6986d3a3f1`;
  const BOT_IMG  = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'; // swap with your own image URL
  const BUBBLE_TEXT = 'Talk to my Digital Twin';
  // ───────────────────────────────────────────────────────────────

  const css = `
    #bp-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      font-family: sans-serif;
    }
    #bp-bubble {
      background: #fff;
      color: #222;
      border: 1px solid #ddd;
      border-radius: 20px 20px 4px 20px;
      padding: 9px 16px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      white-space: nowrap;
      animation: bp-fadeIn 0.4s ease forwards;
    }
    #bp-bubble.bp-hide {
      animation: bp-fadeOut 0.5s ease forwards;
    }
    #bp-icon-btn {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      padding: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      background: #1a73e8;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: bp-shake 0.6s ease 1.2s 2;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #bp-icon-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }
    #bp-icon-btn img {
      width: 40px;
      height: 40px;
      object-fit: contain;
    }
    #bp-window {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 380px;
      height: 560px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
      overflow: hidden;
      z-index: 99998;
      display: none;
      flex-direction: column;
      border: 1px solid #ddd;
      background: #fff;
      animation: bp-slideUp 0.3s ease;
    }
    #bp-window.bp-open {
      display: flex;
    }
    #bp-win-header {
      background: #1a73e8;
      color: #fff;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 15px;
      font-weight: 600;
      flex-shrink: 0;
    }
    #bp-win-header span { opacity: 0.85; font-size: 13px; font-weight: 400; }
    #bp-close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
      opacity: 0.85;
      transition: opacity 0.2s;
    }
    #bp-close-btn:hover { opacity: 1; }
    #bp-iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
    @keyframes bp-shake {
      0%  { transform: rotate(0deg); }
      20% { transform: rotate(-12deg); }
      40% { transform: rotate(12deg); }
      60% { transform: rotate(-8deg); }
      80% { transform: rotate(8deg); }
      100%{ transform: rotate(0deg); }
    }
    @keyframes bp-fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes bp-fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(6px); }
    }
    @keyframes bp-slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 440px) {
      #bp-window {
        width: calc(100vw - 16px);
        right: 8px;
        height: 70vh;
        bottom: 90px;
      }
    }
  `;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Build launcher
  const launcher = document.createElement('div');
  launcher.id = 'bp-launcher';

  const bubble = document.createElement('div');
  bubble.id = 'bp-bubble';
  bubble.textContent = BUBBLE_TEXT;

  const iconBtn = document.createElement('button');
  iconBtn.id = 'bp-icon-btn';
  iconBtn.setAttribute('aria-label', 'Open chat');
  const img = document.createElement('img');
  img.src = BOT_IMG;
  img.alt = 'AI Chat';
  iconBtn.appendChild(img);

  launcher.appendChild(bubble);
  launcher.appendChild(iconBtn);

  // Build chat window
  const chatWin = document.createElement('div');
  chatWin.id = 'bp-window';

  const header = document.createElement('div');
  header.id = 'bp-win-header';
  header.innerHTML = `<div>AI Assistant <span>Powered by Botpress</span></div>`;

  const closeBtn = document.createElement('button');
  closeBtn.id = 'bp-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close chat');
  header.appendChild(closeBtn);

  const iframe = document.createElement('iframe');
  iframe.id = 'bp-iframe';
  iframe.title = 'AI Chat';
  // Load lazily — only set src when first opened
  iframe.setAttribute('allow', 'microphone; camera');

  chatWin.appendChild(header);
  chatWin.appendChild(iframe);

  document.body.appendChild(chatWin);
  document.body.appendChild(launcher);

  // Bubble auto-dismiss after 4s
  let bubbleTimer = setTimeout(() => {
    bubble.classList.add('bp-hide');
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  }, 4000);

  let iframeLoaded = false;

  function openChat() {
    if (!iframeLoaded) {
      iframe.src = BOT_URL;
      iframeLoaded = true;
    }
    chatWin.classList.add('bp-open');
    clearTimeout(bubbleTimer);
    if (bubble.parentNode) bubble.remove();
  }

  function closeChat() {
    chatWin.classList.remove('bp-open');
  }

  iconBtn.addEventListener('click', () => {
    chatWin.classList.contains('bp-open') ? closeChat() : openChat();
  });
  closeBtn.addEventListener('click', closeChat);

})();
</script>
```

---

**How to set it up:**

1. **Find your Bot ID** — In your Botpress dashboard, go to your bot → *Webchat* → *Shareable link*. The `botId` parameter in that URL is what you paste into `BOT_ID`.

2. **Paste the script** into the `<head>` or just before `</body>` on your target site. If you're using a platform like Squarespace, Wix, or WordPress, paste it in the "Custom Code" / "Header Injection" section.

3. **Optionally swap the bot icon** — replace the `BOT_IMG` URL with your own hosted image (a headshot, your logo, etc.).

**What it does:**
- Loads invisibly, then after ~1 second the icon shakes twice to catch attention
- The "Talk to my AI!" bubble appears and auto-dismisses after 4 seconds
- Clicking the icon opens a polished floating window with your Botpress bot inside
- The iframe only loads when first opened (faster page load)
- Fully mobile-responsive