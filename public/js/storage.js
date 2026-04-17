(function (w) {
  'use strict';

  /** DB：users, orders, cart；blacklist 與 blocked_phones 雙寫相容；後台 admin / admin_logged_in */

  var KEYS = {
    AGENT: 'agent',
    /** 後端 JWT（pro-shop /auth） */
    API_TOKEN: 'vip_api_token',
    USERS: 'users',
    ORDERS: 'orders',
    CART: 'cart',
    ADMIN: 'admin',
    BLOCKED_PHONES: 'blocked_phones',
    BLACKLIST: 'blacklist',
    ADMIN_LOGGED_IN: 'admin_logged_in',
    PRODUCTS: 'products',
    ANNOUNCEMENT: 'announcement',
    ADMIN_ACCOUNTS: 'admin_accounts',
    ADMIN_SESSION: 'admin_session',
    AGENTS_CATALOG: 'agents_catalog',
  };

  /** 前台代理驗證：僅此清單內代碼可登入（最上層於後台維護） */
  var AGENTS_CATALOG_SEED = [
    { code: 'GOLD', name: '金牌特約 · 北區' },
    { code: 'VIP', name: '尊榮代理 · 線上' },
    { code: 'IQOS', name: 'IQOS 官方渠道' },
    { code: 'VAPE', name: '霧化體驗店' },
  ];

  function normalizeAgentCatalogCode(raw) {
    return String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  function normalizeAgentCatalogRow(row) {
    var code = normalizeAgentCatalogCode(row && row.code);
    var name = String((row && row.name) || '').trim() || '代理';
    return { code: code, name: name };
  }

  function ensureAgentsCatalogSeeded() {
    if (getRaw(KEYS.AGENTS_CATALOG)) return;
    setJSON(KEYS.AGENTS_CATALOG, AGENTS_CATALOG_SEED.slice());
  }

  /** @returns {{ code: string, name: string }[]} */
  function getAgentsCatalog() {
    ensureAgentsCatalogSeeded();
    var a = getJSON(KEYS.AGENTS_CATALOG, []);
    if (!Array.isArray(a) || !a.length) {
      setJSON(KEYS.AGENTS_CATALOG, AGENTS_CATALOG_SEED.slice());
      a = AGENTS_CATALOG_SEED.slice();
    }
    var out = [];
    var seen = {};
    a.forEach(function (row) {
      var r = normalizeAgentCatalogRow(row);
      if (!r.code || seen[r.code]) return;
      seen[r.code] = true;
      out.push(r);
    });
    if (!out.length) {
      setJSON(KEYS.AGENTS_CATALOG, AGENTS_CATALOG_SEED.slice());
      return AGENTS_CATALOG_SEED.slice();
    }
    return out;
  }

  function saveAgentsCatalog(list) {
    var out = (list || []).map(normalizeAgentCatalogRow).filter(function (r) {
      return r.code;
    });
    var seen = {};
    out = out.filter(function (r) {
      if (seen[r.code]) return false;
      seen[r.code] = true;
      return true;
    });
    if (!out.length) return { ok: false, error: '至少須保留一筆代理' };
    setJSON(KEYS.AGENTS_CATALOG, out);
    return { ok: true };
  }

  /** 代理驗證頁用：代碼須在清單內，否則回傳 null */
  function resolveAgentForLogin(raw) {
    var c = normalizeAgentCatalogCode(raw);
    if (!c) return null;
    var list = getAgentsCatalog();
    var hit = list.find(function (a) {
      return a.code === c;
    });
    if (!hit) return null;
    return { code: hit.code, name: hit.name };
  }

  function addAgentCatalogEntry(row) {
    var r = normalizeAgentCatalogRow(row);
    if (!r.code) return { ok: false, error: '請輸入代理代碼' };
    if (!/^[A-Z0-9_-]{1,32}$/.test(r.code)) {
      return { ok: false, error: '代碼僅能使用英數、底線、連字（最多 32 字）' };
    }
    var list = getAgentsCatalog();
    if (list.some(function (a) { return a.code === r.code; })) {
      return { ok: false, error: '代碼已存在' };
    }
    list.push(r);
    return saveAgentsCatalog(list);
  }

  function updateAgentCatalogEntry(code, patch) {
    var c0 = normalizeAgentCatalogCode(code);
    var list = getAgentsCatalog();
    var idx = list.findIndex(function (a) {
      return a.code === c0;
    });
    if (idx < 0) return { ok: false, error: '找不到代理' };
    if (patch && patch.name != null) {
      list[idx].name = String(patch.name).trim() || list[idx].name;
    }
    return saveAgentsCatalog(list);
  }

  function removeAgentCatalogEntry(code) {
    var c0 = normalizeAgentCatalogCode(code);
    var list = getAgentsCatalog();
    if (list.length <= 1) return { ok: false, error: '須至少保留一筆代理' };
    var next = list.filter(function (a) {
      return a.code !== c0;
    });
    return saveAgentsCatalog(next);
  }

  /** 後台功能鍵：儀表板／用戶／商品／訂單（最上層管理者另有管理者管理） */
  var ADMIN_PERM_KEYS = ['dashboard', 'users', 'products', 'orders'];

  function defaultAdminPermissions() {
    var o = {};
    ADMIN_PERM_KEYS.forEach(function (k) {
      o[k] = true;
    });
    return o;
  }

  function ensureAdminAccountsSeeded() {
    if (getRaw(KEYS.ADMIN_ACCOUNTS)) return;
    setJSON(KEYS.ADMIN_ACCOUNTS, [
      {
        id: 'adm_super',
        username: 'superadmin',
        password: 'super123',
        role: 'super',
        permissions: defaultAdminPermissions(),
      },
      {
        id: 'adm_staff',
        username: 'staff',
        password: 'admin123',
        role: 'staff',
        permissions: defaultAdminPermissions(),
      },
    ]);
  }

  /** @returns {{ id: string, username: string, password: string, role: string, permissions?: object }[]} */
  function getAdminAccounts() {
    ensureAdminAccountsSeeded();
    var a = getJSON(KEYS.ADMIN_ACCOUNTS, []);
    return Array.isArray(a) ? a : [];
  }

  function saveAdminAccounts(list) {
    setJSON(KEYS.ADMIN_ACCOUNTS, Array.isArray(list) ? list : []);
  }

  function normalizeStaffPermissions(p) {
    var o = defaultAdminPermissions();
    if (p && typeof p === 'object') {
      ADMIN_PERM_KEYS.forEach(function (k) {
        if (p[k] != null) o[k] = !!p[k];
      });
    }
    return o;
  }

  function sessionFromAccount(acc) {
    if (!acc || !acc.id) return null;
    if (acc.role === 'super') {
      return {
        id: acc.id,
        username: acc.username,
        role: 'super',
        permissions: normalizeStaffPermissions(acc.permissions),
      };
    }
    return {
      id: acc.id,
      username: acc.username,
      role: 'staff',
      permissions: normalizeStaffPermissions(acc.permissions),
    };
  }

  function writeAdminSession(sessionObj) {
    if (!sessionObj || !sessionObj.id) {
      setRaw(KEYS.ADMIN_SESSION, null);
      return;
    }
    setJSON(KEYS.ADMIN_SESSION, sessionObj);
  }

  /** 從帳號列表同步目前登入者（權限變更後立即生效） */
  function syncAdminSessionFromAccounts() {
    var s = getJSON(KEYS.ADMIN_SESSION, null);
    if (!s || !s.id) return;
    var acc = getAdminAccounts().find(function (a) {
      return a.id === s.id;
    });
    if (!acc) {
      adminLogout();
      return;
    }
    writeAdminSession(sessionFromAccount(acc));
  }

  function legacyAdminLoggedIn() {
    try {
      if (localStorage.getItem(KEYS.ADMIN_LOGGED_IN) === 'true') return true;
    } catch (e) {
      /* ignore */
    }
    return getRaw(KEYS.ADMIN) === '1';
  }

  function migrateLegacyAdminSession() {
    ensureAdminAccountsSeeded();
    var accounts = getAdminAccounts();
    var staff = accounts.find(function (a) {
      return a.role === 'staff';
    });
    if (!staff) return;
    writeAdminSession(sessionFromAccount(staff));
    try {
      localStorage.setItem(KEYS.ADMIN_LOGGED_IN, 'true');
    } catch (e) {
      /* ignore */
    }
    setRaw(KEYS.ADMIN, '1');
  }

  /**
   * @returns {{ id: string, username: string, role: 'super'|'staff', permissions: object } | null}
   */
  function getAdminSession() {
    var s = getJSON(KEYS.ADMIN_SESSION, null);
    if ((!s || !s.id) && legacyAdminLoggedIn()) {
      migrateLegacyAdminSession();
      s = getJSON(KEYS.ADMIN_SESSION, null);
    }
    if (!s || !s.id) return null;
    var acc = getAdminAccounts().find(function (a) {
      return a.id === s.id;
    });
    if (!acc) {
      adminLogout();
      return null;
    }
    return sessionFromAccount(acc);
  }

  function isSuperAdmin() {
    var s = getAdminSession();
    return !!(s && s.role === 'super');
  }

  /** @param {string} key dashboard | users | products | orders | admins */
  function hasAdminPermission(key) {
    var s = getAdminSession();
    if (!s) return false;
    if (key === 'admins') return s.role === 'super';
    return !!(s.permissions && s.permissions[key]);
  }

  function adminLogin(username, password) {
    ensureAdminAccountsSeeded();
    var u = String(username || '').trim();
    var p = String(password || '');
    var acc = getAdminAccounts().find(function (a) {
      return a.username === u;
    });
    if (!acc || acc.password !== p) {
      return { ok: false, error: '帳號或密碼錯誤' };
    }
    if (acc.role === 'staff') {
      var sp = normalizeStaffPermissions(acc.permissions);
      var anyPerm = ADMIN_PERM_KEYS.some(function (k) {
        return sp[k];
      });
      if (!anyPerm) {
        return { ok: false, error: '此帳號尚未被指派任何後台權限' };
      }
    }
    writeAdminSession(sessionFromAccount(acc));
    try {
      localStorage.setItem(KEYS.ADMIN_LOGGED_IN, 'true');
    } catch (e) {
      /* ignore */
    }
    setRaw(KEYS.ADMIN, '1');
    return { ok: true };
  }

  function adminLogout() {
    setRaw(KEYS.ADMIN_SESSION, null);
    try {
      localStorage.removeItem(KEYS.ADMIN_LOGGED_IN);
    } catch (e) {
      /* ignore */
    }
    setRaw(KEYS.ADMIN, null);
  }

  function generateAdminId() {
    return 'adm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function addAdminStaffAccount(payload) {
    var username = String((payload && payload.username) || '').trim();
    var password = String((payload && payload.password) || '');
    if (!username) return { ok: false, error: '請輸入帳號' };
    if (!password) return { ok: false, error: '請輸入密碼' };
    var accounts = getAdminAccounts();
    if (accounts.some(function (a) { return a.username === username; })) {
      return { ok: false, error: '帳號已存在' };
    }
    var np = normalizeStaffPermissions(payload && payload.permissions);
    var anyNew = ADMIN_PERM_KEYS.some(function (k) {
      return np[k];
    });
    if (!anyNew) return { ok: false, error: '請至少勾選一項權限' };
    accounts.push({
      id: generateAdminId(),
      username: username,
      password: password,
      role: 'staff',
      permissions: np,
    });
    saveAdminAccounts(accounts);
    return { ok: true };
  }

  function updateAdminAccount(id, patch) {
    var accounts = getAdminAccounts();
    var idx = accounts.findIndex(function (a) {
      return a.id === id;
    });
    if (idx < 0) return { ok: false, error: '找不到帳號' };
    var acc = accounts[idx];
    if (acc.role === 'super') {
      if (patch.username != null) {
        var nuS = String(patch.username).trim();
        if (!nuS) return { ok: false, error: '帳號不可為空' };
        if (
          accounts.some(function (a, i) {
            return i !== idx && a.username === nuS;
          })
        ) {
          return { ok: false, error: '帳號已存在' };
        }
        acc.username = nuS;
      }
      if (patch.password) acc.password = String(patch.password);
      if (patch.permissions && typeof patch.permissions === 'object') {
        acc.permissions = normalizeStaffPermissions(patch.permissions);
      }
      accounts[idx] = acc;
      saveAdminAccounts(accounts);
      syncAdminSessionFromAccounts();
      return { ok: true };
    }
    if (patch.username != null) {
      var nu = String(patch.username).trim();
      if (!nu) return { ok: false, error: '帳號不可為空' };
      if (
        accounts.some(function (a, i) {
          return i !== idx && a.username === nu;
        })
      ) {
        return { ok: false, error: '帳號已存在' };
      }
      acc.username = nu;
    }
    if (patch.password) acc.password = String(patch.password);
    if (patch.permissions && typeof patch.permissions === 'object') {
      acc.permissions = normalizeStaffPermissions(patch.permissions);
      var anyP = ADMIN_PERM_KEYS.some(function (k) {
        return acc.permissions[k];
      });
      if (!anyP) return { ok: false, error: '請至少保留一項權限' };
    }
    accounts[idx] = acc;
    saveAdminAccounts(accounts);
    syncAdminSessionFromAccounts();
    return { ok: true };
  }

  function removeAdminStaff(id) {
    var accounts = getAdminAccounts();
    var acc = accounts.find(function (a) {
      return a.id === id;
    });
    if (!acc) return { ok: false, error: '找不到帳號' };
    if (acc.role === 'super') return { ok: false, error: '無法刪除最上層管理者' };
    saveAdminAccounts(
      accounts.filter(function (a) {
        return a.id !== id;
      })
    );
    var s = getJSON(KEYS.ADMIN_SESSION, null);
    if (s && s.id === id) adminLogout();
    return { ok: true };
  }

  /** 已登入但無權進入目前頁面時，依序導向第一個有權限的後台頁 */
  function goToFallbackAdminPage() {
    if (!getAdminSession()) {
      w.location.replace('admin-login.html');
      return;
    }
    var path = String(w.location.pathname || '').replace(/\\/g, '/');
    var cur = path.split('/').pop() || '';
    var chain = [
      ['dashboard', 'admin.html'],
      ['users', 'admin-users.html'],
      ['products', 'admin-products.html'],
      ['orders', 'admin-orders.html'],
    ];
    for (var i = 0; i < chain.length; i++) {
      var href = chain[i][1];
      if (hasAdminPermission(chain[i][0]) && href !== cur) {
        w.location.replace(href);
        return;
      }
    }
    if (isSuperAdmin() && cur !== 'admin-admins.html') {
      w.location.replace('admin-admins.html');
      return;
    }
    adminLogout();
    w.location.replace('admin-login.html');
  }

  function getRaw(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setRaw(key, val) {
    try {
      if (val == null) localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch {
      /* ignore */
    }
  }

  function getJSON(key, fallback) {
    var raw = getRaw(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function setJSON(key, obj) {
    setRaw(key, JSON.stringify(obj));
    w.dispatchEvent(new CustomEvent('vip-storage-change', { detail: { key: key } }));
  }

  /** @returns {{ code: string, name: string, user?: { id: string, displayName: string, loginAt: string } } | null} */
  function getAgent() {
    return getJSON(KEYS.AGENT, null);
  }

  function setAgent(data) {
    setJSON(KEYS.AGENT, data);
  }

  function getApiToken() {
    return getRaw(KEYS.API_TOKEN);
  }

  function setApiToken(token) {
    if (token == null || token === '') {
      setRaw(KEYS.API_TOKEN, null);
    } else {
      setRaw(KEYS.API_TOKEN, String(token));
    }
  }

  function clearApiToken() {
    setRaw(KEYS.API_TOKEN, null);
  }

  function clearAgent() {
    setRaw(KEYS.AGENT, null);
    clearApiToken();
    try {
      localStorage.removeItem('vip');
      localStorage.removeItem('role');
    } catch (e) {}
  }

  /** 與 login 頁代理碼一致：寫入 vip / role，並建立 active 會員 */
  function completePortalLogin(rawCode) {
    var resolved = resolveAgentForLogin(rawCode);
    if (!resolved) {
      return { ok: false, error: '代理碼錯誤或不在清單內' };
    }
    var uid = 'vip_portal_' + resolved.code;
    try {
      localStorage.setItem('vip', 'true');
      localStorage.setItem('role', resolved.code.toLowerCase());
    } catch (e) {
      return { ok: false, error: '無法儲存登入狀態' };
    }
    setAgent({
      code: resolved.code,
      name: resolved.name,
      user: {
        id: uid,
        displayName: 'VIP 會員',
        loginAt: new Date().toISOString(),
      },
    });
    var users = getUsers();
    var ix = users.findIndex(function (u) {
      return u.id === uid;
    });
    if (ix < 0) {
      users.push({
        id: uid,
        displayName: 'VIP 會員',
        agentCode: resolved.code,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    } else {
      users[ix].status = 'active';
      users[ix].agentCode = resolved.code;
      users[ix].displayName = users[ix].displayName || 'VIP 會員';
    }
    saveUsers(users);
    return { ok: true };
  }

  /** 刷新後若仅有 vip 無 agent，依 role 還原 session */
  function bootstrapVipPortalSession() {
    try {
      if (localStorage.getItem('vip') !== 'true') return;
    } catch (e) {
      return;
    }
    var ag = getAgent();
    if (ag && ag.user) return;
    var role = localStorage.getItem('role');
    var tryCode = role ? String(role).toUpperCase() : 'GOLD';
    var resolved = resolveAgentForLogin(tryCode);
    if (!resolved) resolved = resolveAgentForLogin('GOLD');
    if (!resolved) return;
    var uid = 'vip_portal_' + resolved.code;
    setAgent({
      code: resolved.code,
      name: resolved.name,
      user: {
        id: uid,
        displayName: 'VIP 會員',
        loginAt: new Date().toISOString(),
      },
    });
    var users = getUsers();
    var ix = users.findIndex(function (u) {
      return u.id === uid;
    });
    if (ix < 0) {
      users.push({
        id: uid,
        displayName: 'VIP 會員',
        agentCode: resolved.code,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    } else {
      users[ix].status = 'active';
    }
    saveUsers(users);
  }

  /** @returns {{ id: string, displayName: string, agentCode: string, status: string, createdAt: string, phone?: string }[]} */
  function getUsers() {
    var a = getJSON(KEYS.USERS, []);
    return Array.isArray(a) ? a : [];
  }

  function saveUsers(users) {
    setJSON(KEYS.USERS, users);
  }

  /** @returns {{ orderId: string, userId: string, name: string, phone: string, store_name: string, items: object[], total: number, payment: string, status: string, shipping_status?: string, createdAt: string }[]} */
  function getOrders() {
    var a = getJSON(KEYS.ORDERS, []);
    return Array.isArray(a) ? a : [];
  }

  function saveOrders(orders) {
    setJSON(KEYS.ORDERS, orders);
  }

  /** 固定運費（每筆訂單） */
  var SHIPPING_FEE_TWD = 70;

  /**
   * 訂單金額分解：新訂單含 subtotal、shipping_fee、total；
   * 舊資料僅有 total 時視為商品金額、運費 0（相容舊單）。
   */
  function getOrderDisplayTotals(o) {
    if (!o || typeof o !== 'object') {
      return { subtotal: 0, shipping_fee: 0, total: 0 };
    }
    if (o.subtotal != null && o.total != null) {
      return {
        subtotal: Number(o.subtotal) || 0,
        shipping_fee: o.shipping_fee != null ? Number(o.shipping_fee) || 0 : SHIPPING_FEE_TWD,
        total: Number(o.total) || 0,
      };
    }
    var legacy = Number(o.total) || 0;
    return { subtotal: legacy, shipping_fee: 0, total: legacy };
  }

  /** 後台／前台統一：pending → shipped → delivering → completed */
  var ORDER_STATUS_FLOW = ['pending', 'shipped', 'delivering', 'completed'];
  var AUTO_DELIVER_MS = 12 * 60 * 60 * 1000;

  function normalizeOrderStatus(o) {
    if (!o || typeof o !== 'object') return 'pending';
    var x = String(o.shipping_status != null ? o.shipping_status : o.status || 'pending').trim();
    var lower = x.toLowerCase();
    if (lower === 'completed' || x === '已完成') return 'completed';
    if (lower === 'delivering' || x === '配送中') return 'delivering';
    if (lower === 'shipped' || x === '已出貨') return 'shipped';
    if (lower === 'placed') return 'pending';
    return 'pending';
  }

  /** 相容舊 API：等同 normalizeOrderStatus */
  function inferShippingStatus(o) {
    return normalizeOrderStatus(o);
  }

  /**
   * 更新訂單狀態並補齊時間戳（依目標狀態階段回填尚未存在的欄位）。
   */
  function applyOrderStatusWithTimestamps(o, next) {
    if (!o || typeof o !== 'object') return;
    var rank = { pending: 0, shipped: 1, delivering: 2, completed: 3 };
    if (rank[next] == null) return;
    var iso = new Date().toISOString();
    o.status = next;
    o.shipping_status = next;
    if (!o.created_at && o.createdAt) o.created_at = o.createdAt;
    var t = rank[next];
    if (t >= 1 && !o.shipped_at) o.shipped_at = iso;
    if (t >= 2 && !o.delivering_at) o.delivering_at = iso;
    if (t >= 3 && !o.completed_at) o.completed_at = iso;
  }

  /** 已出貨滿 12 小時自動進入配送中（無外部 API 模擬物流） */
  function tryAutoAdvanceShippedToDelivering(orders) {
    var changed = false;
    var now = Date.now();
    orders.forEach(function (o) {
      if (normalizeOrderStatus(o) !== 'shipped') return;
      var at = o.shipped_at;
      if (!at) return;
      if (now - new Date(at).getTime() < AUTO_DELIVER_MS) return;
      applyOrderStatusWithTimestamps(o, 'delivering');
      changed = true;
    });
    return changed;
  }

  function shippingStatusLabel(key) {
    var k =
      typeof key === 'string' && ORDER_STATUS_FLOW.indexOf(key) >= 0
        ? key
        : normalizeOrderStatus({ shipping_status: key, status: key });
    var m = {
      pending: '訂單成立',
      shipped: '已出貨',
      delivering: '配送中',
      completed: '已完成',
    };
    return m[k] || m.pending;
  }

  function adminOrderStatusLabel(key) {
    var k =
      typeof key === 'string' && ORDER_STATUS_FLOW.indexOf(key) >= 0
        ? key
        : normalizeOrderStatus({ shipping_status: key, status: key });
    var m = {
      pending: '待處理',
      shipped: '已出貨',
      delivering: '配送中',
      completed: '已完成',
    };
    return m[k] || m.pending;
  }

  /** 遷移：四態、created_at、可選 12h 自動配送中 */
  function migrateOrdersShippingFields() {
    var orders = getOrders();
    var changed = false;
    orders.forEach(function (o) {
      if (!o.created_at && o.createdAt) {
        o.created_at = o.createdAt;
        changed = true;
      }
      var next = normalizeOrderStatus(o);
      if (o.shipping_status !== next || o.status !== next) {
        o.shipping_status = next;
        o.status = next;
        changed = true;
      }
    });
    if (tryAutoAdvanceShippedToDelivering(orders)) changed = true;
    if (changed) saveOrders(orders);
  }

  function normalizePhone(raw) {
    return String(raw || '').replace(/\D/g, '');
  }

  /** 黑名單（與 blocked_phones 同步） */
  function getBlacklist() {
    var b = getJSON(KEYS.BLACKLIST, null);
    if (Array.isArray(b) && b.length) {
      var out = [];
      var seen = {};
      b.forEach(function (p) {
        var n = normalizePhone(p);
        if (!n || seen[n]) return;
        seen[n] = true;
        out.push(n);
      });
      return out;
    }
    return getBlockedPhonesLegacy();
  }

  function getBlockedPhonesLegacy() {
    var a = getJSON(KEYS.BLOCKED_PHONES, []);
    if (!Array.isArray(a)) return [];
    var out = [];
    var seen = {};
    a.forEach(function (p) {
      var n = normalizePhone(p);
      if (!n || seen[n]) return;
      seen[n] = true;
      out.push(n);
    });
    return out;
  }

  function saveBlacklist(list) {
    var uniq = [];
    var seen = {};
    (list || []).forEach(function (p) {
      var n = normalizePhone(p);
      if (!n || seen[n]) return;
      seen[n] = true;
      uniq.push(n);
    });
    setJSON(KEYS.BLACKLIST, uniq);
    setJSON(KEYS.BLOCKED_PHONES, uniq);
  }

  /** @deprecated 使用 getBlacklist */
  function getBlockedPhones() {
    return getBlacklist();
  }

  /** @deprecated 使用 saveBlacklist */
  function saveBlockedPhones(list) {
    saveBlacklist(list);
  }

  function isPhoneBlocked(raw) {
    var n = normalizePhone(raw);
    if (!n) return false;
    return getBlacklist().indexOf(n) !== -1;
  }

  function addBlockedPhone(raw) {
    var n = normalizePhone(raw);
    if (!n) return false;
    var arr = getBlacklist().slice();
    if (arr.indexOf(n) !== -1) return false;
    arr.push(n);
    saveBlacklist(arr);
    return true;
  }

  function removeBlockedPhone(raw) {
    var n = normalizePhone(raw);
    saveBlacklist(
      getBlacklist().filter(function (x) {
        return x !== n;
      })
    );
  }

  function orderCountForUserId(userId) {
    if (!userId) return 0;
    return getOrders().filter(function (o) {
      return o.userId === userId;
    }).length;
  }

  /** 每位會員僅能建立一筆訂單（示範規則） */
  function canUserPlaceOrder(userId) {
    if (!userId) return false;
    return orderCountForUserId(userId) < 1;
  }

  /** @returns {{ id: string, name: string, price: number, qty: number, category?: string }[]} */
  function getCart() {
    var a = getJSON(KEYS.CART, []);
    return Array.isArray(a) ? a : [];
  }

  function saveCart(cart) {
    setJSON(KEYS.CART, cart);
  }

  function clearCart() {
    setJSON(KEYS.CART, []);
  }

  /** @returns {object[]} 商品目錄（後台／商城） */
  function getProducts() {
    var a = getJSON(KEYS.PRODUCTS, []);
    return Array.isArray(a) ? a : [];
  }

  function saveProducts(products) {
    setJSON(KEYS.PRODUCTS, products);
  }

  /** @returns {{ text: string, enabled: boolean }} */
  function getAnnouncement() {
    var d = getJSON(KEYS.ANNOUNCEMENT, null);
    if (!d || typeof d !== 'object') {
      return { text: '', enabled: false };
    }
    return {
      text: d.text != null ? String(d.text) : '',
      enabled: !!d.enabled,
    };
  }

  function saveAnnouncement(data) {
    setJSON(KEYS.ANNOUNCEMENT, {
      text: data && data.text != null ? String(data.text) : '',
      enabled: !!(data && data.enabled),
    });
  }

  function isAdmin() {
    return getAdminSession() != null;
  }

  /** 相容舊程式：傳入 true 僅寫入旗標；請優先使用 adminLogin */
  function setAdmin(ok) {
    if (ok) {
      try {
        localStorage.setItem(KEYS.ADMIN_LOGGED_IN, 'true');
      } catch (e) {
        /* ignore */
      }
      setRaw(KEYS.ADMIN, '1');
    } else {
      adminLogout();
    }
  }

  function getCurrentUser() {
    var ag = getAgent();
    return ag && ag.user ? ag.user : null;
  }

  /**
   * @returns {{ id: string, displayName: string, agentCode: string, status: string, createdAt: string } | null}
   */
  function getSessionUserRecord() {
    var ag = getAgent();
    if (!ag || !ag.user) return null;
    var users = getUsers();
    var r = users.find(function (u) {
      return u.id === ag.user.id;
    });
    if (r) return r;
    users.push({
      id: ag.user.id,
      displayName: ag.user.displayName || 'Member',
      agentCode: ag.code,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
    return users[users.length - 1];
  }

  function isUserApproved() {
    var r = getSessionUserRecord();
    return !!(r && r.status === 'active');
  }

  function isUserBlocked() {
    var r = getSessionUserRecord();
    return !!(r && r.status === 'blocked');
  }

  function requireApprovedCustomer() {
    try {
      if (localStorage.getItem('vip') !== 'true') {
        location.replace('login.html');
        return false;
      }
    } catch (e) {
      location.replace('login.html');
      return false;
    }
    bootstrapVipPortalSession();
    var ag = getAgent();
    if (!ag || !ag.user) {
      location.replace('login.html');
      return false;
    }
    if (isUserBlocked()) {
      location.replace('shop.html');
      return false;
    }
    if (!isUserApproved()) {
      location.replace('shop.html');
      return false;
    }
    return true;
  }

  w.VIPKeys = KEYS;
  function formatTWD(n) {
    return (
      'NT$ ' +
      (Number(n) || 0).toLocaleString('zh-TW', {
        maximumFractionDigits: 0,
      })
    );
  }

  w.formatTWD = formatTWD;
  w.VIPStore = {
    KEYS: KEYS,
    getAgent: getAgent,
    setAgent: setAgent,
    clearAgent: clearAgent,
    completePortalLogin: completePortalLogin,
    bootstrapVipPortalSession: bootstrapVipPortalSession,
    getApiToken: getApiToken,
    setApiToken: setApiToken,
    clearApiToken: clearApiToken,
    getUsers: getUsers,
    saveUsers: saveUsers,
    getOrders: getOrders,
    saveOrders: saveOrders,
    ORDER_STATUS_FLOW: ORDER_STATUS_FLOW,
    normalizeOrderStatus: normalizeOrderStatus,
    inferShippingStatus: inferShippingStatus,
    shippingStatusLabel: shippingStatusLabel,
    adminOrderStatusLabel: adminOrderStatusLabel,
    migrateOrdersShippingFields: migrateOrdersShippingFields,
    applyOrderStatusWithTimestamps: applyOrderStatusWithTimestamps,
    normalizePhone: normalizePhone,
    getBlacklist: getBlacklist,
    getBlockedPhones: getBlockedPhones,
    saveBlacklist: saveBlacklist,
    saveBlockedPhones: saveBlockedPhones,
    isPhoneBlocked: isPhoneBlocked,
    addBlockedPhone: addBlockedPhone,
    removeBlockedPhone: removeBlockedPhone,
    orderCountForUserId: orderCountForUserId,
    canUserPlaceOrder: canUserPlaceOrder,
    getCart: getCart,
    saveCart: saveCart,
    clearCart: clearCart,
    isAdmin: isAdmin,
    setAdmin: setAdmin,
    getAdminSession: getAdminSession,
    isSuperAdmin: isSuperAdmin,
    hasAdminPermission: hasAdminPermission,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    syncAdminSessionFromAccounts: syncAdminSessionFromAccounts,
    getAdminAccounts: getAdminAccounts,
    saveAdminAccounts: saveAdminAccounts,
    addAdminStaffAccount: addAdminStaffAccount,
    updateAdminAccount: updateAdminAccount,
    removeAdminStaff: removeAdminStaff,
    goToFallbackAdminPage: goToFallbackAdminPage,
    ADMIN_PERM_KEYS: ADMIN_PERM_KEYS,
    getCurrentUser: getCurrentUser,
    getSessionUserRecord: getSessionUserRecord,
    isUserApproved: isUserApproved,
    isUserBlocked: isUserBlocked,
    requireApprovedCustomer: requireApprovedCustomer,
    formatTWD: formatTWD,
    getProducts: getProducts,
    saveProducts: saveProducts,
    getAnnouncement: getAnnouncement,
    saveAnnouncement: saveAnnouncement,
    getAgentsCatalog: getAgentsCatalog,
    resolveAgentForLogin: resolveAgentForLogin,
    addAgentCatalogEntry: addAgentCatalogEntry,
    updateAgentCatalogEntry: updateAgentCatalogEntry,
    removeAgentCatalogEntry: removeAgentCatalogEntry,
    SHIPPING_FEE_TWD: SHIPPING_FEE_TWD,
    getOrderDisplayTotals: getOrderDisplayTotals,
  };
})(window);
