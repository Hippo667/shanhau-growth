/* 小问号科学周刊 — 故事详情页逻辑 */

(function() {
  // 获取 URL 参数中的故事 ID
  const params = new URLSearchParams(location.search);
  const storyId = parseInt(params.get('id')) || 1;
  const autoListen = params.get('mode') === 'listen';

  const story = STORIES.find(s => s.id === storyId) || STORIES[0];
  if (!story) {
    document.body.innerHTML = '<div class="page-container text-center"><h2>故事未找到</h2><a href="index.html">返回首页</a></div>';
    return;
  }

  // 更新页面标题
  document.title = story.title + ' - 小问号科学周刊';

  // 阅读量 +1（fire-and-forget，不影响页面渲染）
  api.incrementRead(storyId).then(data => {
    if (data && data.read_count) {
      const countEl = document.querySelector('#storyHeader p');
      if (countEl) countEl.innerHTML = '⭐ ' + data.read_count + ' 人读过';
    }
  }).catch(() => {});

  // 故事索引（用于上下篇导航）
  const storyIndex = STORIES.findIndex(s => s.id === storyId);
  const prevStory = storyIndex > 0 ? STORIES[storyIndex - 1] : null;
  const nextStory = storyIndex < STORIES.length - 1 ? STORIES[storyIndex + 1] : null;

  // === 渲染故事头部 ===
  document.getElementById('storyHeader').innerHTML = `
    <span class="story-tag">${story.tag}</span>
    <h2>${story.title}</h2>
    <p style="color:var(--text-muted);margin-top:4px;">⭐ ${story.stars} 人读过</p>
  `;

  // === 渲染插画 ===
  document.getElementById('storyIllustration').innerHTML = getIllustrationSvg(story);

  // === 渲染上下篇导航 ===
  const navDiv = document.getElementById('storyNav');
  navDiv.innerHTML = `
    ${prevStory
      ? `<a href="story.html?id=${prevStory.id}" class="prev">← ${prevStory.title}</a>`
      : '<span class="nav-placeholder"></span>'}
    ${nextStory
      ? `<a href="story.html?id=${nextStory.id}" class="next">${nextStory.title} →</a>`
      : '<span class="nav-placeholder"></span>'}
  `;

  // === 渲染正文（含科学词和句子高亮支持） ===
  const contentDiv = document.getElementById('storyContent');
  story.content.forEach(paragraph => {
    const p = document.createElement('p');
    // 按句子分割（中文句号、问号、感叹号）
    const sentences = paragraph.split(/(?<=[。！？])/);
    sentences.forEach(sentence => {
      if (!sentence.trim()) return;
      const span = document.createElement('span');
      span.className = 'sentence';
      // 处理科学词
      let html = sentence;
      story.sciTerms.forEach(term => {
        const escaped = term.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'g');
        html = html.replace(regex, `<span class="sci-term">$1<span class="tooltip">${term.explain}</span></span>`);
      });
      span.innerHTML = html;
      p.appendChild(span);
    });
    contentDiv.appendChild(p);
  });

  // === 渲染 Q&A ===
  const qaCardsDiv = document.getElementById('qaCards');
  story.qa.forEach((item, i) => {
    qaCardsDiv.insertAdjacentHTML('beforeend', `
      <div class="qa-card" onclick="this.classList.toggle('flipped')">
        <div class="qa-question">
          <span><span class="emoji">${['🌱','🔍','💡'][i] || '❓'}</span> ${item.q}</span>
          <span class="qa-arrow">▼</span>
        </div>
        <div class="qa-answer">${item.a}</div>
      </div>
    `);
  });

  // === 语音合成 TTS ===
  const btnListen = document.getElementById('btnListen');
  let isPlaying = false;
  let utterance = null;
  let currentRate = 1.0;

  // 收集所有句子 DOM 元素
  const sentenceEls = Array.from(contentDiv.querySelectorAll('.sentence'));

  // 获取纯文本句子列表
  function getPlainSentences() {
    return story.content.join('').split(/(?<=[。！？])/).filter(s => s.trim());
  }

  const plainSentences = getPlainSentences();

  function stopSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isPlaying = false;
    btnListen.classList.remove('playing');
    btnListen.innerHTML = '<span class="icon">🔊</span> 听故事';
    // 清除高亮
    sentenceEls.forEach(el => el.classList.remove('highlight'));
  }

  function speakSentence(index) {
    if (index >= plainSentences.length || !isPlaying) {
      stopSpeech();
      return;
    }

    // 高亮当前句子
    sentenceEls.forEach(el => el.classList.remove('highlight'));
    if (sentenceEls[index]) {
      sentenceEls[index].classList.add('highlight');
      sentenceEls[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    utterance = new SpeechSynthesisUtterance(plainSentences[index]);
    utterance.lang = 'zh-CN';
    utterance.rate = currentRate;
    utterance.pitch = 1.05;

    utterance.onend = function() {
      if (isPlaying) {
        speakSentence(index + 1);
      }
    };

    utterance.onerror = function(e) {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('TTS error:', e.error);
        if (isPlaying) speakSentence(index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  btnListen.addEventListener('click', function() {
    if (!window.speechSynthesis) {
      showToast('你的手机暂不支持语音朗读功能，请让爸爸妈妈帮忙读给你听吧 📖');
      return;
    }

    if (isPlaying) {
      stopSpeech();
      return;
    }

    // 检查是否有可用语音
    const voices = window.speechSynthesis.getVoices();
    const hasChineseVoice = voices.some(v => v.lang.startsWith('zh'));

    if (voices.length > 0 && !hasChineseVoice) {
      console.warn('No Chinese voice available, using default voice');
    }

    isPlaying = true;
    btnListen.classList.add('playing');
    btnListen.innerHTML = '<span class="icon">⏸</span> 暂停';

    // 从头开始或继续
    const currentHighlight = contentDiv.querySelector('.sentence.highlight');
    let startIndex = 0;
    if (currentHighlight) {
      startIndex = sentenceEls.indexOf(currentHighlight);
      if (startIndex < 0) startIndex = 0;
    }

    speakSentence(startIndex);
  });

  // 语速按钮
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentRate = parseFloat(this.dataset.rate);
      // 如果正在播放，重启当前句子
      if (isPlaying) {
        const currentHighlight = contentDiv.querySelector('.sentence.highlight');
        let currentIndex = currentHighlight ? sentenceEls.indexOf(currentHighlight) : 0;
        if (currentIndex < 0) currentIndex = 0;
        window.speechSynthesis.cancel();
        speakSentence(currentIndex);
      }
    });
  });

  // 确保语音列表加载
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function() {
      window.speechSynthesis.getVoices();
    };
  }

  // === 留言功能（API 优先，localStorage 兜底） ===
  const STORAGE_KEY = 'wks_comments_' + story.id;
  let selectedEmoji = '🌟';

  // 表情选择
  document.getElementById('emojiPicker').addEventListener('click', function(e) {
    const opt = e.target.closest('.emoji-option');
    if (!opt) return;
    document.querySelectorAll('#emojiPicker .emoji-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedEmoji = opt.dataset.emoji;
  });

  // 默认选中第一个
  document.querySelector('#emojiPicker .emoji-option[data-emoji="🌟"]').classList.add('selected');

  function loadLocalComments() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveLocalComments(comments) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  // 格式化时间
  function fmtDate(dateStr) {
    if (!dateStr) return '';
    // ISO: "2026-05-20T08:30:00Z" → "5/20 08:30"
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    } catch (_) { return dateStr; }
  }

  function renderComments(comments) {
    const container = document.getElementById('commentsList');
    if (!comments || comments.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:10px;font-size:0.9rem;">还没有留言，来做第一个留言的小朋友吧 ✨</p>';
      return;
    }
    container.innerHTML = comments.map(c => `
      <div class="comment-item">
        <span class="comment-emoji">${escapeHtml(c.emoji)}</span>
        <div>
          <p class="comment-text">${escapeHtml(c.content || c.text)}</p>
          <span class="comment-time">${fmtDate(c.created_at) || c.date}</span>
        </div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // 从 API 加载留言，失败则从 localStorage 加载
  function loadComments() {
    api.getComments(storyId).then(data => {
      const apiComments = (data.comments || []).map(c => ({
        emoji: c.emoji,
        content: c.content,
        created_at: c.created_at,
        text: c.content,
        date: fmtDate(c.created_at),
      }));
      renderComments(apiComments);
      // 同步到 localStorage 作为缓存
      saveLocalComments(apiComments);
    }).catch(() => {
      // API 失败，用 localStorage 兜底
      const local = loadLocalComments();
      renderComments(local);
    });
  }

  // 发送留言：先发 API，同时存 localStorage
  document.getElementById('btnSend').addEventListener('click', function() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) {
      showToast('请先写点想说的话吧 ✍️');
      return;
    }

    api.postComment(storyId, selectedEmoji, text).then(data => {
      // API 成功：重新加载留言
      input.value = '';
      loadComments();
      showToast('留言发送成功！谢谢你的话 ❤️');
    }).catch(err => {
      // API 失败：存到 localStorage
      const comments = loadLocalComments();
      comments.unshift({
        emoji: selectedEmoji,
        text: text,
        content: text,
        date: new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      });
      saveLocalComments(comments);
      input.value = '';
      renderComments(comments);
      showToast('留言已保存到本地，联网后会自动同步 📡');
    });
  });

  // 初始加载留言
  loadComments();

  // === 自动播放（从首页听故事入口进入） ===
  if (autoListen) {
    setTimeout(() => btnListen.click(), 500);
  }

  // 页面离开时停止语音
  window.addEventListener('beforeunload', stopSpeech);
})();
