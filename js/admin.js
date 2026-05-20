/* 小问号科学周刊 — 管理后台脚本 */

(function() {
  const loginDiv = document.getElementById('adminLogin');
  const dashboardDiv = document.getElementById('adminDashboard');
  const loginError = document.getElementById('loginError');
  let currentPage = 1;

  // 检查是否已登录
  if (sessionStorage.getItem('admin_token')) {
    loginDiv.classList.add('hidden');
    dashboardDiv.classList.remove('hidden');
    loadLetters();
  }

  // === 登录 ===
  document.getElementById('btnLogin').addEventListener('click', function() {
    const pwd = document.getElementById('adminPassword').value.trim();
    if (!pwd) {
      loginError.style.display = 'block';
      loginError.textContent = '请输入密码';
      return;
    }

    api.setAdminToken(pwd);

    // 验证密码（请求 stats 接口）
    api.getAdminStats().then(data => {
      loginDiv.classList.add('hidden');
      dashboardDiv.classList.remove('hidden');
      loginError.style.display = 'none';
      loadLetters();
    }).catch(err => {
      api.clearAdminToken();
      loginError.style.display = 'block';
      loginError.textContent = err.message || '密码不对哦，请重试';
    });
  });

  // 回车登录
  document.getElementById('adminPassword').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('btnLogin').click();
  });

  // === 退出 ===
  document.getElementById('btnLogout').addEventListener('click', function() {
    api.clearAdminToken();
    sessionStorage.removeItem('admin_token');
    loginDiv.classList.remove('hidden');
    dashboardDiv.classList.add('hidden');
    document.getElementById('adminPassword').value = '';
  });

  // === 标签切换 ===
  document.querySelectorAll('#adminDashboard .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#adminDashboard .tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const tab = this.dataset.tab;
      document.getElementById('tab-adminLetters').classList.toggle('hidden', tab !== 'adminLetters');
      document.getElementById('tab-adminStats').classList.toggle('hidden', tab !== 'adminStats');
      document.getElementById('adminPagination').classList.toggle('hidden', tab !== 'adminLetters');
      if (tab === 'adminStats') loadStats();
    });
  });

  // === 加载信件 ===
  function loadLetters(page) {
    page = page || 1;
    currentPage = page;

    const container = document.getElementById('tab-adminLetters');
    container.innerHTML = '<p style="text-align:center;padding:30px;color:var(--text-muted);">加载中...</p>';

    api.getAdminLetters(page).then(data => {
      if (!data.letters || data.letters.length === 0) {
        container.innerHTML = '<div class="about-section text-center"><p style="color:var(--text-muted);padding:20px;">还没有收到孩子的来信 📭</p></div>';
        document.getElementById('adminPagination').classList.add('hidden');
        return;
      }

      container.innerHTML = data.letters.map(l => `
        <div class="letter-card">
          <span class="letter-mood">${l.mood}</span>
          <div>
            <p class="letter-content">${escapeHtml(l.content)}</p>
            <span class="letter-date">${formatDate(l.created_at)}</span>
          </div>
        </div>
      `).join('');

      // 分页
      const totalPages = Math.ceil(data.total / data.limit);
      if (totalPages > 1) {
        const pagDiv = document.getElementById('adminPagination');
        pagDiv.classList.remove('hidden');
        let pagHTML = '';
        for (let i = 1; i <= totalPages; i++) {
          pagHTML += `<button class="page-btn${i === page ? ' active' : ''}" data-page="${i}">${i}</button>`;
        }
        pagDiv.innerHTML = pagHTML;
        pagDiv.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            loadLetters(parseInt(this.dataset.page));
          });
        });
      } else {
        document.getElementById('adminPagination').classList.add('hidden');
      }
    }).catch(err => {
      container.innerHTML = '<p style="text-align:center;padding:30px;color:#FF6B6B;">加载失败：' + err.message + '</p>';
    });
  }

  // === 加载统计 ===
  function loadStats() {
    api.getAdminStats().then(data => {
      // 故事阅读量
      const storiesDiv = document.getElementById('statsStories');
      if (data.stories && data.stories.length > 0) {
        storiesDiv.innerHTML = data.stories.map(s => `
          <div class="stat-card">
            <div class="stat-num">${s.read_count}</div>
            <div class="stat-label">故事 #${s.story_id} 阅读量</div>
          </div>
        `).join('');
      }

      // 总体数据
      document.getElementById('statsSummary').innerHTML = `
        <div class="stat-card">
          <div class="stat-num">${data.total_comments}</div>
          <div class="stat-label">总留言数</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${data.total_letters}</div>
          <div class="stat-label">总信件数</div>
        </div>
      `;
    }).catch(err => {
      document.getElementById('statsStories').innerHTML = '<p style="color:#FF6B6B;">加载失败</p>';
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
        String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    } catch (_) { return dateStr; }
  }
})();
