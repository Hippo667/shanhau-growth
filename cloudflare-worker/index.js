// ============================================================
// 山花成长记 - Cloudflare Worker API
// 部署：wrangler deploy
// ============================================================

// ---- JWT helpers ----
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function createJWT(payload, secret) {
  const enc = new TextEncoder();
  const header = base64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))));
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ---- Password hashing (PBKDF2) ----
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  return `pbkdf2:100000:${base64url(salt)}:${base64url(new Uint8Array(hash))}`;
}

async function verifyPassword(password, stored) {
  const parts = stored.split(':');
  if (parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1]);
  const salt = base64urlDecode(parts[2]);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return base64url(new Uint8Array(hash)) === parts[3];
}

// ---- CORS ----
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

function cors(response) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

function json(data, status = 200) {
  return cors(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  }));
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

// ---- Auth middleware ----
async function authenticate(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  // Look up user
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
  return user || null;
}

// ---- Route helpers ----
function parsePath(pathname) {
  // /auth/* or /api/<table>[/<id>]
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/');
  return parts;
}

// ---- Request handlers ----
async function handleAuth(path, request, env) {
  const method = request.method;
  const body = method !== 'GET' ? await request.json().catch(() => ({})) : {};

  // POST /auth/register
  if (path[1] === 'register' && method === 'POST') {
    const { email, password, name, role } = body;
    if (!email || !password || !name || !role) return error('缺少必填字段');
    if (password.length < 6) return error('密码至少6位');
    if (!['teacher', 'volunteer', 'parent', 'child'].includes(role)) return error('无效角色');

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return error('该邮箱已被注册', 409);

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const avatarColor = ['#E8915C','#5B9A6B','#5B7F9A','#C8A52B','#E85C5C','#8B5CF6'][Math.floor(Math.random() * 6)];

    await env.DB.prepare('INSERT INTO users (id, email, password_hash, name, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, passwordHash, name, role, avatarColor).run();

    const user = { id, email, name, role, avatar_color: avatarColor, linked_children: '[]', created_at: new Date().toISOString() };
    const token = await createJWT({ sub: id, exp: Math.floor(Date.now() / 1000) + 86400 * 30 }, env.JWT_SECRET);
    return json({ token, user });
  }

  // POST /auth/login
  if (path[1] === 'login' && method === 'POST') {
    const { email, password } = body;
    if (!email || !password) return error('请输入邮箱和密码');

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) return error('邮箱或密码错误', 401);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return error('邮箱或密码错误', 401);

    const token = await createJWT({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 86400 * 30 }, env.JWT_SECRET);
    // Don't expose password_hash
    const { password_hash, ...safeUser } = user;
    return json({ token, user: safeUser });
  }

  // GET /auth/me
  if (path[1] === 'me' && method === 'GET') {
    const user = await authenticate(request, env);
    if (!user) return error('未登录', 401);
    const { password_hash, ...safeUser } = user;
    return json({ user: safeUser });
  }

  return error('Not found', 404);
}

async function handleAPI(path, request, env) {
  const user = await authenticate(request, env);
  if (!user) return error('未登录', 401);

  const table = path[1]; // e.g., 'children', 'growth-records', etc.
  const id = path[2];    // optional row ID
  const method = request.method;
  const url = new URL(request.url);

  // Map API path to DB table name
  const TABLE_MAP = {
    'children': 'children',
    'growth-records': 'growth_records',
    'messages': 'messages',
    'qa-posts': 'qa_posts',
    'qa-answers': 'qa_answers',
    'comments': 'comments',
    'profiles': 'users'  // profiles → users table
  };

  const dbTable = TABLE_MAP[table];
  if (!dbTable) return error('表不存在', 404);

  // ---- GET /api/<table> ----
  if (method === 'GET' && !id) {
    let query = `SELECT * FROM ${dbTable}`;
    const params = [];
    const conditions = [];

    // Filters
    for (const [key, value] of url.searchParams.entries()) {
      if (key === '_order') continue;
      if (key === '_asc') continue;
      if (key === 'include_comments') continue;
      if (key === 'include_answers') continue;
      conditions.push(`${key} = ?`);
      params.push(value);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ordering
    const orderCol = url.searchParams.get('_order') || 'created_at';
    const asc = url.searchParams.get('_asc') === 'true';
    query += ` ORDER BY ${orderCol} ${asc ? 'ASC' : 'DESC'}`;

    const result = await env.DB.prepare(query).bind(...params).all();
    let rows = result.results || [];

    // Parse JSON fields
    rows = rows.map(r => parseRow(r, dbTable));

    // Include nested data
    if (url.searchParams.get('include_comments') === 'true') {
      for (const row of rows) {
        const parentType = dbTable === 'growth_records' ? 'growth' : 'message';
        const comments = await env.DB.prepare('SELECT * FROM comments WHERE parent_type = ? AND parent_id = ? ORDER BY created_at ASC')
          .bind(parentType, row.id).all();
        row.comments = (comments.results || []).map(c => parseRow(c, 'comments'));
      }
    }
    if (url.searchParams.get('include_answers') === 'true') {
      for (const row of rows) {
        const answers = await env.DB.prepare('SELECT * FROM qa_answers WHERE post_id = ? ORDER BY created_at ASC')
          .bind(row.id).all();
        row.answers = (answers.results || []).map(a => parseRow(a, 'qa_answers'));
      }
    }

    return json(rows);
  }

  // ---- GET /api/<table>/<id> ----
  if (method === 'GET' && id) {
    const result = await env.DB.prepare(`SELECT * FROM ${dbTable} WHERE id = ?`).bind(id).first();
    if (!result) return error('记录不存在', 404);
    return json(parseRow(result, dbTable));
  }

  // ---- POST /api/<table> ----
  if (method === 'POST') {
    const body = await request.json().catch(() => ({}));
    // Exclude nested fields from direct insert
    delete body.comments;
    delete body.answers;

    // Add id and created_by if not provided
    if (!body.id) body.id = crypto.randomUUID();
    if (dbTable !== 'users' && !body.created_by) body.created_by = user.id;
    if (dbTable === 'messages' && !body.author_id) body.author_id = user.id;
    if (dbTable === 'qa_posts' && !body.author_id) body.author_id = user.id;
    if (dbTable === 'qa_answers' && !body.author_id) body.author_id = user.id;
    if (dbTable === 'comments' && !body.author_id) body.author_id = user.id;
    if (dbTable === 'users' && body.password) {
      // Handle user creation via profiles endpoint
      const pw = body.password;
      delete body.password;
      body.password_hash = await hashPassword(pw);
    }

    // Stringify JSON array fields
    const data = serializeRow(body, dbTable);

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(c => data[c]);

    await env.DB.prepare(`INSERT INTO ${dbTable} (${columns.join(', ')}) VALUES (${placeholders})`)
      .bind(...values).run();

    const result = await env.DB.prepare(`SELECT * FROM ${dbTable} WHERE id = ?`).bind(data.id).first();
    return json(parseRow(result, dbTable), 201);
  }

  // ---- PUT /api/<table>/<id> ----
  if (method === 'PUT' && id) {
    const body = await request.json().catch(() => ({}));
    delete body.comments;
    delete body.answers;
    delete body.id;

    const data = serializeRow(body, dbTable);
    const setClauses = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);

    await env.DB.prepare(`UPDATE ${dbTable} SET ${setClauses} WHERE id = ?`)
      .bind(...values, id).run();

    const result = await env.DB.prepare(`SELECT * FROM ${dbTable} WHERE id = ?`).bind(id).first();
    return json(parseRow(result, dbTable));
  }

  // ---- DELETE /api/<table>/<id> ----
  if (method === 'DELETE' && id) {
    await env.DB.prepare(`DELETE FROM ${dbTable} WHERE id = ?`).bind(id).run();
    return json({ success: true });
  }

  return error('Not found', 404);
}

// Parse JSON string fields back to JS
function parseRow(row, table) {
  if (!row) return row;
  const r = { ...row };
  const jsonFields = {
    'growth_records': ['media', 'liked_by'],
    'messages': ['liked_by'],
    'qa_posts': ['liked_by'],
    'users': ['linked_children']
  };
  const fields = jsonFields[table] || [];
  for (const f of fields) {
    if (typeof r[f] === 'string') {
      try { r[f] = JSON.parse(r[f]); } catch { /* keep as string */ }
    }
  }
  return r;
}

// Serialize JS arrays/objects to JSON strings for DB storage
function serializeRow(data, table) {
  const d = { ...data };
  const jsonFields = {
    'growth_records': ['media', 'liked_by'],
    'messages': ['liked_by'],
    'qa_posts': ['liked_by'],
    'users': ['linked_children']
  };
  const fields = jsonFields[table] || [];
  for (const f of fields) {
    if (d[f] !== undefined && typeof d[f] !== 'string') {
      d[f] = JSON.stringify(d[f]);
    }
  }
  return d;
}

// ---- Main entry ----
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = parsePath(url.pathname);

    try {
      if (path[0] === 'auth') {
        return await handleAuth(path, request, env);
      }
      if (path[0] === 'api') {
        return await handleAPI(path, request, env);
      }
      // Health check
      if (path[0] === '' || path[0] === 'health') {
        return json({ status: 'ok', name: 'shanhau-api' });
      }
      return error('Not found', 404);
    } catch (e) {
      console.error(e);
      return error(e.message || 'Internal server error', 500);
    }
  }
};
