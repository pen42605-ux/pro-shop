/**
 * 與 pro-shop 後端同源 API（/auth/*），載入前須先有 VIPStore（storage.js）。
 */
(function (w) {
  'use strict';

  function parseJson(res) {
    return res.json().catch(function () {
      return {};
    });
  }

  function ProAPI() {}

  ProAPI.authLogin = function (email, password) {
    return fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      return parseJson(res).then(function (data) {
        if (!res.ok) {
          var e = new Error(data.error || '登入失敗');
          e.status = res.status;
          throw e;
        }
        return data;
      });
    });
  };

  ProAPI.authRegister = function (email, password) {
    return fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      return parseJson(res).then(function (data) {
        if (!res.ok) {
          var e = new Error(data.error || '註冊失敗');
          e.status = res.status;
          throw e;
        }
        return data;
      });
    });
  };

  ProAPI.authMe = function () {
    var store = w.VIPStore;
    var t = store && store.getApiToken ? store.getApiToken() : null;
    if (!t) {
      return Promise.reject(new Error('未登入'));
    }
    return fetch('/auth/me', {
      headers: { Authorization: 'Bearer ' + t },
    }).then(function (res) {
      return parseJson(res).then(function (data) {
        if (!res.ok) {
          var e = new Error(data.error || '驗證失敗');
          e.status = res.status;
          throw e;
        }
        return data;
      });
    });
  };

  ProAPI.health = function () {
    return fetch('/health').then(function (res) {
      return parseJson(res).then(function (data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    });
  };

  w.ProAPI = ProAPI;
})(window);
