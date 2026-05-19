/* 小问号科学周刊 — 公共脚本 */

// 当前活跃的标签页高亮
(function highlightNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

// Toast 消息
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// 渲染故事卡片
function renderStoryCard(story) {
  const coverSvg = getCoverSvg(story);
  return `
    <div class="story-card" onclick="location.href='story.html?id=${story.id}'">
      <div class="card-cover">${coverSvg}</div>
      <div class="card-body">
        <span class="card-tag">${story.tag}</span>
        <h3>${story.title}</h3>
        <p class="hook">${story.hook}</p>
        <div class="card-footer">
          <span class="stars">⭐ ${story.stars} 人读过</span>
          <span style="color:var(--text-muted)">→</span>
        </div>
      </div>
    </div>`;
}

// 生成卡片封面 SVG 插图
function getCoverSvg(story) {
  switch (story.id) {
    case 1:
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7EC8E3"/><stop offset="100%" stop-color="#FFF8E7"/></linearGradient></defs>
        <rect width="400" height="180" fill="url(#sky1)"/>
        <circle cx="280" cy="50" r="32" fill="#FFD54F" opacity="0.9"/>
        <circle cx="285" cy="45" r="28" fill="#FFE082"/>
        <ellipse cx="140" cy="120" rx="60" ry="55" fill="#C8E6C9"/>
        <polygon points="70,120 210,120 180,70 140,60 100,70" fill="#A5D6A7"/>
        <rect x="60" y="120" width="160" height="60" fill="#81C784" rx="4"/>
        <circle cx="140" cy="140" r="8" fill="#4E342E"/>
        <circle cx="155" cy="140" r="8" fill="#4E342E"/>
        <ellipse cx="148" cy="153" rx="10" ry="6" fill="#4E342E"/>
        <circle cx="90" cy="100" r="16" fill="#FF9A56"/>
        <polygon points="82,92 78,84 98,84 94,92" fill="#FF9A56"/>
        <polygon points="103,92 99,84 119,84 115,92" fill="#FF9A56"/>
        <circle cx="80" cy="96" r="3" fill="#4E342E"/>
        <circle cx="96" cy="96" r="3" fill="#4E342E"/>
        <ellipse cx="55" cy="60" rx="16" ry="10" fill="white" opacity="0.7"/>
        <ellipse cx="340" cy="80" rx="20" ry="12" fill="white" opacity="0.6"/>
        <ellipse cx="360" cy="72" rx="14" ry="8" fill="white" opacity="0.5"/>
      </svg>`;
    case 2:
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#C8E8C0"/><stop offset="100%" stop-color="#FFF8E7"/></linearGradient></defs>
        <rect width="400" height="180" fill="url(#sky2)"/>
        <rect x="0" y="110" width="400" height="70" fill="#81C784" rx="2"/>
        <rect x="0" y="120" width="400" height="60" fill="#66BB6A"/>
        <line x1="60" y1="140" x2="60" y2="60" stroke="#795548" stroke-width="4"/>
        <circle cx="60" cy="55" r="18" fill="#FFD54F"/>
        <circle cx="60" cy="55" r="12" fill="#FFE082"/>
        <line x1="60" y1="37" x2="80" y2="22" stroke="#795548" stroke-width="2"/>
        <circle cx="80" cy="22" r="4" fill="#66BB6A"/>
        <line x1="60" y1="37" x2="40" y2="22" stroke="#795548" stroke-width="2"/>
        <circle cx="40" cy="22" r="4" fill="#66BB6A"/>
        <circle cx="136" cy="48" r="4" fill="white" opacity="0.8"/>
        <line x1="136" y1="52" x2="136" y2="54" stroke="white" stroke-width="1.5"/>
        <circle cx="160" cy="44" r="4" fill="white" opacity="0.6"/>
        <line x1="160" y1="48" x2="160" y2="50" stroke="white" stroke-width="1.5"/>
        <circle cx="180" cy="52" r="3" fill="white" opacity="0.7"/>
        <line x1="180" y1="55" x2="180" y2="56" stroke="white" stroke-width="1"/>
        <circle cx="280" cy="100" r="22" fill="#FF9A56"/>
        <polygon points="270,88 264,81 288,81 284,88" fill="#FF9A56"/>
        <polygon points="293,88 287,81 311,81 307,88" fill="#FF9A56"/>
        <circle cx="268" cy="94" r="3.5" fill="#4E342E"/>
        <circle cx="286" cy="94" r="3.5" fill="#4E342E"/>
        <ellipse cx="278" cy="108" rx="6" ry="4" fill="#4E342E"/>
      </svg>`;
    case 3:
      return `<svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="sky3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2C3E6B"/><stop offset="100%" stop-color="#5B7FA5"/></linearGradient></defs>
        <rect width="400" height="180" fill="url(#sky3)"/>
        <circle cx="60" cy="50" r="3" fill="white" opacity="0.7"/>
        <circle cx="120" cy="30" r="2" fill="white" opacity="0.5"/>
        <circle cx="200" cy="60" r="2.5" fill="white" opacity="0.6"/>
        <circle cx="300" cy="40" r="2" fill="white" opacity="0.5"/>
        <circle cx="350" cy="65" r="3" fill="white" opacity="0.7"/>
        <circle cx="160" cy="80" r="1.5" fill="white" opacity="0.4"/>
        <circle cx="260" cy="25" r="1.5" fill="white" opacity="0.4"/>
        <circle cx="330" cy="22" r="1.5" fill="white" opacity="0.4"/>
        <circle cx="100" cy="65" r="1.5" fill="white" opacity="0.3"/>
        <circle cx="40" cy="70" r="1.5" fill="white" opacity="0.4"/>
        <path d="M280 55 Q295 40 310 55 Q295 38 280 55Z" fill="#FFE082"/>
        <path d="M280 55 Q295 48 310 55Z" fill="#FFD54F" opacity="0.6"/>
        <rect x="0" y="130" width="400" height="50" fill="#3E2723"/>
        <rect x="0" y="130" width="400" height="8" fill="#4CAF50"/>
        <polygon points="280,130 300,80 320,130" fill="#4CAF50"/>
        <polygon points="310,130 325,95 340,130" fill="#388E3C"/>
        <circle cx="140" cy="110" r="20" fill="#FF9A56"/>
        <polygon points="132,98 126,91 150,91 146,98" fill="#FF9A56"/>
        <polygon points="155,98 149,91 173,91 169,98" fill="#FF9A56"/>
        <circle cx="130" cy="104" r="3.5" fill="#4E342E"/>
        <circle cx="148" cy="104" r="3.5" fill="#4E342E"/>
        <ellipse cx="140" cy="120" rx="6" ry="4" fill="#4E342E"/>
      </svg>`;
    default:
      return '';
  }
}

// 生成详情页大插图
function getIllustrationSvg(story) {
  switch (story.id) {
    case 1:
      return `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="300" fill="#7EC8E3"/>
        <rect y="220" width="600" height="80" fill="#81C784" rx="3"/>
        <circle cx="480" cy="70" r="45" fill="#FFD54F" opacity="0.95"/>
        <circle cx="485" cy="60" r="40" fill="#FFE082"/>
        <ellipse cx="300" cy="160" rx="110" ry="90" fill="#A5D6A7"/>
        <rect x="190" y="160" width="220" height="80" fill="#81C784" rx="6"/>
        <rect x="200" y="170" width="50" height="40" fill="#FFF8E7" rx="4" opacity="0.6"/>
        <rect x="270" y="170" width="50" height="40" fill="#FFF8E7" rx="4" opacity="0.6"/>
        <ellipse cx="200" cy="130" rx="40" ry="38" fill="#FF9A56"/>
        <polygon points="184,108 172,95 204,95 200,108" fill="#FF9A56"/>
        <polygon points="210,108 198,95 230,95 226,108" fill="#FF9A56"/>
        <circle cx="180" cy="120" r="6" fill="#4E342E"/>
        <circle cx="212" cy="120" r="6" fill="#4E342E"/>
        <ellipse cx="196" cy="142" rx="12" ry="7" fill="#4E342E"/>
        <ellipse cx="140" cy="260" rx="25" ry="8" fill="#66BB6A" opacity="0.4"/>
        <ellipse cx="380" cy="250" rx="30" ry="6" fill="#66BB6A" opacity="0.3"/>
        <ellipse cx="120" cy="100" rx="30" ry="15" fill="white" opacity="0.6"/>
        <ellipse cx="160" cy="85" rx="20" ry="10" fill="white" opacity="0.5"/>
        <ellipse cx="380" cy="120" rx="25" ry="12" fill="white" opacity="0.5"/>
        <ellipse cx="420" cy="105" rx="18" ry="9" fill="white" opacity="0.4"/>
        <circle cx="350" cy="60" r="2" fill="#FFF" opacity="0.4"/>
        <circle cx="250" cy="50" r="1.5" fill="#FFF" opacity="0.3"/>
      </svg>`;
    case 2:
      return `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="300" fill="#C8E8C0"/>
        <rect y="210" width="600" height="90" fill="#81C784"/>
        <rect y="220" width="600" height="80" fill="#66BB6A"/>
        <circle cx="500" cy="60" r="40" fill="#FFD54F" opacity="0.9"/>
        <circle cx="505" cy="55" r="35" fill="#FFE082"/>
        <line x1="200" y1="200" x2="200" y2="70" stroke="#795548" stroke-width="6"/>
        <circle cx="200" cy="60" r="30" fill="#FFD54F"/>
        <circle cx="200" cy="60" r="20" fill="#FFE082"/>
        <line x1="200" y1="30" x2="230" y2="10" stroke="#795548" stroke-width="3"/>
        <circle cx="232" cy="10" r="7" fill="#81C784"/>
        <line x1="200" y1="30" x2="170" y2="10" stroke="#795548" stroke-width="3"/>
        <circle cx="168" cy="10" r="7" fill="#81C784"/>
        <circle cx="260" cy="75" r="6" fill="white" opacity="0.9"/>
        <line x1="260" y1="81" x2="260" y2="85" stroke="white" stroke-width="2"/>
        <circle cx="290" cy="65" r="5" fill="white" opacity="0.7"/>
        <line x1="290" y1="70" x2="290" y2="74" stroke="white" stroke-width="1.5"/>
        <circle cx="320" cy="78" r="4" fill="white" opacity="0.6"/>
        <line x1="320" y1="82" x2="320" y2="84" stroke="white" stroke-width="1"/>
        <circle cx="440" cy="180" r="38" fill="#FF9A56"/>
        <polygon points="424,155 408,142 448,142 444,155" fill="#FF9A56"/>
        <polygon points="452,155 436,142 476,142 472,155" fill="#FF9A56"/>
        <circle cx="420" cy="170" r="6" fill="#4E342E"/>
        <circle cx="452" cy="170" r="6" fill="#4E342E"/>
        <ellipse cx="436" cy="198" rx="14" ry="8" fill="#4E342E"/>
        <ellipse cx="100" cy="100" rx="20" ry="10" fill="white" opacity="0.5"/>
        <ellipse cx="400" cy="80" rx="18" ry="9" fill="white" opacity="0.4"/>
      </svg>`;
    case 3:
      return `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="300" fill="#2C3E6B"/>
        <rect y="240" width="600" height="60" fill="#3E2723"/>
        <rect y="240" width="600" height="10" fill="#4CAF50"/>
        <polygon points="400,240 430,150 460,240" fill="#4CAF50"/>
        <polygon points="440,240 460,180 480,240" fill="#388E3C"/>
        <circle cx="80" cy="50" r="3" fill="white" opacity="0.7"/>
        <circle cx="180" cy="90" r="2" fill="white" opacity="0.5"/>
        <circle cx="280" cy="40" r="2.5" fill="white" opacity="0.6"/>
        <circle cx="450" cy="60" r="2" fill="white" opacity="0.5"/>
        <circle cx="520" cy="85" r="3" fill="white" opacity="0.7"/>
        <circle cx="350" cy="70" r="2" fill="white" opacity="0.4"/>
        <circle cx="550" cy="40" r="2" fill="white" opacity="0.4"/>
        <circle cx="130" cy="120" r="1.5" fill="white" opacity="0.3"/>
        <circle cx="380" cy="100" r="1.5" fill="white" opacity="0.4"/>
        <path d="M140 140 Q170 110 200 140 Q170 105 140 140Z" fill="#FFE082"/>
        <path d="M140 140 Q170 125 200 140Z" fill="#FFD54F" opacity="0.6"/>
        <ellipse cx="300" cy="220" rx="30" ry="22" fill="#FF9A56"/>
        <polygon points="282,200 270,187 306,187 302,200" fill="#FF9A56"/>
        <polygon points="310,200 298,187 334,187 330,200" fill="#FF9A56"/>
        <circle cx="278" cy="214" r="5" fill="#4E342E"/>
        <circle cx="310" cy="214" r="5" fill="#4E342E"/>
        <ellipse cx="294" cy="232" rx="10" ry="6" fill="#4E342E"/>
        <rect x="260" y="210" width="65" height="3" fill="#4E342E" rx="1.5"/>
      </svg>`;
    default:
      return '';
  }
}
