/**
 * 商城相關頁面：僅允許手機瀏覽器（依 User-Agent）。
 * 開發除錯：在 console 執行 localStorage.setItem('vip_mall_desktop_bypass','1') 後重新整理（本機測試用）。
 */
(function (w) {
  'use strict';

  var BYPASS_KEY = 'vip_mall_desktop_bypass';

  function pathBasename() {
    var p = String(w.location.pathname || '').replace(/\\/g, '/');
    var i = p.lastIndexOf('/');
    return i >= 0 ? p.slice(i + 1) : p;
  }

  /** @returns {boolean} 是否為允許進入商城的用戶端（手機） */
  function isMallMobileClient() {
    try {
      if (w.localStorage.getItem(BYPASS_KEY) === '1') return true;
    } catch (e) {
      /* ignore */
    }

    var ua = String(navigator.userAgent || '');

    if (/iPad/i.test(ua)) return false;
    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return false;

    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return false;

    if (/iPhone|iPod/i.test(ua)) return true;
    if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
    if (/webOS|BlackBerry|IEMobile|Opera Mini|Opera Mobi|Mobile.*Firefox|FxiOS|EdgiOS/i.test(ua)) return true;

    return false;
  }

  function shouldRedirect() {
    if (/^mobile-required\.html$/i.test(pathBasename())) return false;
    return !isMallMobileClient();
  }

  function run() {
    if (!shouldRedirect()) return;
    var from = w.location.pathname + (w.location.search || '') + (w.location.hash || '');
    w.location.replace('mobile-required.html?from=' + encodeURIComponent(from));
  }

  run();

  w.VIPMallMobileGuard = {
    isMallMobileClient: isMallMobileClient,
  };
})(window);
