/* 小问号科学周刊 — API 客户端模块 */

const API_BASE = 'https://shanhau-api.u202542459.workers.dev';

const api = {
  // 通用 fetch 封装
  async _fetch(path, options = {}) {
    let res;
    try {
      res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
    } catch (_err) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || '服务器出错了，请稍后再试');
    }
    return data;
  },

  // ---- 阅读量 ----
  getAllReadCounts() {
    return this._fetch('/api/stories/read-counts');
  },

  incrementRead(storyId) {
    return this._fetch('/api/stories/' + storyId + '/read', { method: 'POST' });
  },

  // ---- 留言 ----
  getComments(storyId) {
    return this._fetch('/api/comments/' + storyId);
  },

  postComment(storyId, emoji, content) {
    return this._fetch('/api/comments/' + storyId, {
      method: 'POST',
      body: JSON.stringify({ emoji: emoji, content: content }),
    });
  },

  // ---- 信件 ----
  postLetter(mood, content) {
    return this._fetch('/api/letters', {
      method: 'POST',
      body: JSON.stringify({ mood: mood, content: content }),
    });
  },

  // ---- 管理后台 ----
  setAdminToken(password) {
    sessionStorage.setItem('admin_token', password);
  },

  clearAdminToken() {
    sessionStorage.removeItem('admin_token');
  },

  _getAuthHeaders() {
    const token = sessionStorage.getItem('admin_token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  },

  getAdminLetters(page = 1) {
    return this._fetch('/api/admin/letters?page=' + page + '&limit=20', {
      headers: this._getAuthHeaders(),
    });
  },

  getAdminStats() {
    return this._fetch('/api/admin/stats', {
      headers: this._getAuthHeaders(),
    });
  },
};
