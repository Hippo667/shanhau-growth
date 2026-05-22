/**
 * 小问号科学周刊 — Cloudflare Workers API
 * 阅读量 / 留言 / 信件 / 管理后台
 */

interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
}

// ====== 工具函数 ======

const ALLOWED_ORIGIN = 'https://hippo667.github.io';

// 允许自定义域名和本地开发
const ALLOWED_ORIGINS = [
  'https://hippo667.github.io',
  'https://dhmsweb.asia',
  'http://dhmsweb.asia',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
];

const ALLOWED_EMOJIS = ['😊', '🌟', '❤️', '👍', '🦊', '🌈'];
const ALLOWED_MOODS = ['😊', '😢', '🤔', '😴', '🥳', '😤'];

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function errorJson(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// Bearer token 认证
function verifyAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !env.ADMIN_PASSWORD) return false;
  return token === env.ADMIN_PASSWORD;
}

// URL 路径解析
interface ParsedPath {
  storiesReadCounts: boolean;       // GET /api/stories/read-counts
  storiesRead: number | null;       // POST /api/stories/:id/read
  comments: number | null;          // GET|POST /api/comments/:storyId
  letters: boolean;                 // POST /api/letters
  adminLetters: boolean;            // GET /api/admin/letters
  adminStats: boolean;              // GET /api/admin/stats
}

function parsePath(pathname: string): ParsedPath {
  const p = pathname.replace(/\/+$/, '');

  const storiesReadMatch = p.match(/^\/api\/stories\/(\d+)\/read$/);
  const commentsMatch = p.match(/^\/api\/comments\/(\d+)$/);

  return {
    storiesReadCounts: p === '/api/stories/read-counts',
    storiesRead: storiesReadMatch ? parseInt(storiesReadMatch[1]) : null,
    comments: commentsMatch ? parseInt(commentsMatch[1]) : null,
    letters: p === '/api/letters',
    adminLetters: p === '/api/admin/letters',
    adminStats: p === '/api/admin/stats',
  };
}

// ====== 路由处理 ======

// GET /api/stories/read-counts — 获取全部阅读量
async function handleGetReadCounts(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT story_id, read_count FROM story_stats ORDER BY story_id'
  ).all<{ story_id: number; read_count: number }>();
  return json({ counts: results });
}

// POST /api/stories/:id/read — 阅读量 +1（upsert）
async function handleIncrementRead(storyId: number, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    `INSERT INTO story_stats (story_id, read_count, updated_at)
     VALUES (?1, 1, datetime('now'))
     ON CONFLICT(story_id) DO UPDATE SET
       read_count = read_count + 1,
       updated_at = datetime('now')
     RETURNING story_id, read_count`
  ).bind(storyId).first<{ story_id: number; read_count: number }>();

  if (!result) return errorJson('Story not found', 404);
  return json(result, 200);
}

// GET /api/comments/:storyId — 获取留言
async function handleGetComments(storyId: number, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    'SELECT id, emoji, content, created_at FROM comments WHERE story_id = ?1 ORDER BY created_at DESC LIMIT 100'
  ).bind(storyId).all<{ id: number; emoji: string; content: string; created_at: string }>();
  return json({ comments: results });
}

// POST /api/comments/:storyId — 提交留言
async function handlePostComment(storyId: number, body: any, env: Env): Promise<Response> {
  const emoji = String(body?.emoji || '🌟').trim();
  const content = String(body?.content || '').trim();

  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return errorJson('请选择一个表情哦');
  }
  if (!content || content.length > 500) {
    return errorJson(content ? '留言内容太长了，最多500字哦' : '请输入留言内容');
  }

  const result = await env.DB.prepare(
    'INSERT INTO comments (story_id, emoji, content) VALUES (?1, ?2, ?3) RETURNING id, emoji, content, created_at'
  ).bind(storyId, emoji, content).first<{ id: number; emoji: string; content: string; created_at: string }>();

  return json(result, 201);
}

// POST /api/letters — 提交信件
async function handlePostLetter(body: any, env: Env): Promise<Response> {
  const mood = String(body?.mood || '').trim();
  const content = String(body?.content || '').trim();

  if (!ALLOWED_MOODS.includes(mood)) {
    return errorJson('请先选择一个心情表情哦');
  }
  if (!content || content.length > 2000) {
    return errorJson(content ? '信的内容太长了，最多2000字哦' : '请写信件内容');
  }

  const result = await env.DB.prepare(
    'INSERT INTO letters (mood, content) VALUES (?1, ?2) RETURNING id, mood, content, created_at'
  ).bind(mood, content).first<{ id: number; mood: string; content: string; created_at: string }>();

  return json(result, 201);
}

// GET /api/admin/letters — 查看所有信件（需认证）
async function handleAdminLetters(request: Request, env: Env): Promise<Response> {
  if (!verifyAuth(request, env)) {
    return errorJson('密码不对哦', 401);
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const [lettersResult, countResult] = await Promise.all([
    env.DB.prepare(
      'SELECT id, mood, content, created_at FROM letters ORDER BY created_at DESC LIMIT ?1 OFFSET ?2'
    ).bind(limit, offset).all<{ id: number; mood: string; content: string; created_at: string }>(),
    env.DB.prepare('SELECT COUNT(*) as total FROM letters').first<{ total: number }>(),
  ]);

  return json({
    letters: lettersResult.results,
    total: countResult?.total || 0,
    page,
    limit,
  });
}

// GET /api/admin/stats — 查看统计数据（需认证）
async function handleAdminStats(request: Request, env: Env): Promise<Response> {
  if (!verifyAuth(request, env)) {
    return errorJson('密码不对哦', 401);
  }

  const [storiesResult, commentsResult, lettersResult] = await Promise.all([
    env.DB.prepare('SELECT story_id, read_count FROM story_stats ORDER BY story_id').all(),
    env.DB.prepare('SELECT COUNT(*) as total FROM comments').first<{ total: number }>(),
    env.DB.prepare('SELECT COUNT(*) as total FROM letters').first<{ total: number }>(),
  ]);

  return json({
    stories: storiesResult.results,
    total_comments: commentsResult?.total || 0,
    total_letters: lettersResult?.total || 0,
  });
}

// ====== Worker 入口 ======

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = parsePath(url.pathname);

    let response: Response;

    try {
      // --- 阅读量 ---
      if (request.method === 'GET' && path.storiesReadCounts) {
        response = await handleGetReadCounts(env);
      } else if (request.method === 'POST' && path.storiesRead !== null) {
        response = await handleIncrementRead(path.storiesRead, env);

      // --- 留言 ---
      } else if (request.method === 'GET' && path.comments !== null) {
        response = await handleGetComments(path.comments, env);
      } else if (request.method === 'POST' && path.comments !== null) {
        const body = await request.json().catch(() => ({}));
        response = await handlePostComment(path.comments, body, env);

      // --- 信件 ---
      } else if (request.method === 'POST' && path.letters) {
        const body = await request.json().catch(() => ({}));
        response = await handlePostLetter(body, env);

      // --- 管理后台 ---
      } else if (request.method === 'GET' && path.adminLetters) {
        response = await handleAdminLetters(request, env);
      } else if (request.method === 'GET' && path.adminStats) {
        response = await handleAdminStats(request, env);

      // --- 404 ---
      } else {
        response = errorJson('Not Found', 404);
      }
    } catch (err: any) {
      console.error('API Error:', err?.message || err);
      response = errorJson('服务器出错了，请稍后再试', 500);
    }

    // 追加 CORS 头
    const cors = corsHeaders(request);
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(cors)) {
      newHeaders.set(k, v);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
