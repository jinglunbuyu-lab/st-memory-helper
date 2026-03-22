(async () => {
  const MODULE_NAME = '记忆助手';
  const TRIGGER_EVERY = 30;
  let messageCount = 0;

  function log(msg) {
    console.log(`[${MODULE_NAME}] ${msg}`);
  }

  async function summarizeAndShow() {
    const context = SillyTavern.getContext();
    const chat = context.chat;
    if (!chat || chat.length < 5) return;

    const recent = chat.slice(-30).map(m =>
      `${m.is_user ? '用户' : '角色'}：${m.mes}`
    ).join('\n');

    const prompt = `请用以下格式总结这段对话，语言简洁：

事件：（一句话描述发生了什么）
关键词：（2-4个关键词，用顿号分隔）
情感变化：（角色的情绪变化）
重要细节：（需要记住的细节）

对话内容：
${recent}`;

    try {
      const response = await fetch('/api/backends/chat-completions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        })
      });
      const data = await response.json();
      const summary = data?.choices?.[0]?.message?.content || '总结失败';

      const box = document.createElement('div');
      box.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:#1a1a2e; color:#e0e0e0; padding:20px; border-radius:12px;
        width:85%; max-height:70vh; overflow-y:auto; z-index:99999;
        border:1px solid #4a4a8a; font-size:14px; line-height:1.6;
      `;
      box.innerHTML = `
        <div style="font-size:16px;font-weight:bold;margin-bottom:12px;color:#a0a0ff">
          📖 记忆总结（复制到世界书）
        </div>
        <pre style="white-space:pre-wrap;margin:0 0 12px 0">${summary}</pre>
        <button onclick="navigator.clipboard.writeText(\`${summary.replace(/`/g, '\\`')}\`);this.textContent='已复制✓'"
          style="background:#4a4a8a;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-right:8px">
          复制内容
        </button>
        <button onclick="this.parentElement.remove()"
          style="background:#6a3a3a;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer">
          关闭
        </button>
      `;
      document.body.appendChild(box);
    } catch (e) {
      log('总结失败：' + e);
    }
  }

  eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
    messageCount++;
    if (messageCount % TRIGGER_EVERY === 0) {
      log(`已达${messageCount}条消息，开始总结`);
      await summarizeAndShow();
    }
  });

  log('记忆助手已加载，每30条消息自动总结');
})();
