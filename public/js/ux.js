(function (w) {
  'use strict';

  function skRowHtml() {
    return (
      '<div class="vip-loader-sk-row">' +
      '<span class="vip-loader-sk-thumb"></span>' +
      '<span class="vip-loader-sk-body">' +
      '<span class="vip-loader-sk-line"></span>' +
      '<span class="vip-loader-sk-line vip-loader-sk-line--short"></span>' +
      '<span class="vip-loader-sk-line vip-loader-sk-line--btn"></span>' +
      '</span></div>'
    );
  }

  function ensureLoader() {
    var el = document.getElementById('vip-page-loader');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'vip-page-loader';
    el.className = 'vip-page-loader';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="vip-page-loader__panel" role="status" aria-live="polite" aria-busy="false">' +
      '<p class="vip-page-loader__label">載入商品與資源</p>' +
      '<div class="vip-loader-skeleton" aria-hidden="true">' +
      skRowHtml() +
      skRowHtml() +
      skRowHtml() +
      '</div>' +
      '<div class="vip-page-loader__inner">' +
      '<div class="vip-page-loader__spinner" aria-hidden="true">' +
      '<span class="vip-page-loader__ring vip-page-loader__ring--outer"></span>' +
      '<span class="vip-page-loader__ring vip-page-loader__ring--inner"></span>' +
      '</div>' +
      '<p class="vip-page-loader__text">載入中…</p>' +
      '</div>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function showLoader() {
    var el = ensureLoader();
    el.setAttribute('aria-hidden', 'false');
    el.classList.add('is-visible');
    document.body.classList.add('vip-loading');
    var panel = el.querySelector('.vip-page-loader__panel');
    if (panel) panel.setAttribute('aria-busy', 'true');
  }

  function hideLoader() {
    var el = document.getElementById('vip-page-loader');
    if (!el) return;
    el.setAttribute('aria-hidden', 'true');
    el.classList.remove('is-visible');
    document.body.classList.remove('vip-loading');
    var panel = el.querySelector('.vip-page-loader__panel');
    if (panel) panel.setAttribute('aria-busy', 'false');
  }

  /** 等 window load 後淡出（首屏圖片等資源）。 */
  function bootLoader() {
    showLoader();
    function done() {
      hideLoader();
      document.body.classList.add('vip-boot-ready');
    }
    if (document.readyState === 'complete') {
      w.setTimeout(done, 140);
    } else {
      w.addEventListener('load', function () {
        w.setTimeout(done, 140);
      });
    }
  }

  function initSwalTheme() {
    if (!w.Swal) return;
    w.Swal.mixin({
      confirmButtonColor: '#c9a227',
      cancelButtonColor: '#6a6560',
      background: '#111015',
      color: '#f4f1ea',
      backdrop: 'rgba(0,0,0,0.78)',
      customClass: {
        popup: 'vip-swal-popup',
        confirmButton: 'vip-swal-confirm',
      },
    });
  }

  function initCartBadge() {
    if (!w.CartAPI) return;
    var els = document.querySelectorAll('[data-cart-count]');
    if (!els.length) return;

    var prevCount = null;

    function triggerCartBadgePulse() {
      els.forEach(function (bdg) {
        bdg.classList.remove('cart-badge-pulse');
        bdg.offsetWidth;
        bdg.classList.add('cart-badge-pulse');
        function onPulseEnd(ev) {
          if (ev.animationName && ev.animationName !== 'cartBadgePulse') return;
          bdg.removeEventListener('animationend', onPulseEnd);
          bdg.classList.remove('cart-badge-pulse');
        }
        bdg.addEventListener('animationend', onPulseEnd);
      });
    }

    function sync() {
      var n = w.CartAPI.countItems();
      var increased = prevCount !== null && n > prevCount && n > 0;
      prevCount = n;
      els.forEach(function (bdg) {
        bdg.textContent = String(n);
        bdg.classList.toggle('is-empty', n === 0);
      });
      if (increased) {
        triggerCartBadgePulse();
      }
    }
    sync();
    w.addEventListener('vip-storage-change', function (e) {
      if (e.detail && e.detail.key === 'cart') sync();
    });
  }

  var REF_KEY = 'vip_referral_source';

  /** 從網址 ?ref= / ?utm_source= / ?source= 寫入 sessionStorage（UI 用）。 */
  function syncReferralFromUrl() {
    try {
      if (!w.location || !w.location.search) return;
      var p = new URLSearchParams(w.location.search);
      var ref = p.get('ref') || p.get('utm_source') || p.get('source');
      if (!ref || !w.sessionStorage) return;
      ref = String(ref).trim();
      if (!ref) return;
      w.sessionStorage.setItem(REF_KEY, ref.slice(0, 80));
    } catch (e) {
      /* ignore */
    }
  }

  function getReferralSourceLabel() {
    try {
      if (w.sessionStorage) {
        var v = w.sessionStorage.getItem(REF_KEY);
        if (v) return v;
      }
    } catch (e1) {
      /* ignore */
    }
    try {
      if (w.document && w.document.referrer) {
        var u = new URL(w.document.referrer);
        var host = u.hostname;
        if (host && host !== w.location.hostname) return '自 ' + host + ' 連結';
      }
    } catch (e2) {
      /* ignore */
    }
    return '直接造訪';
  }

  function escapeContextHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function isAdminLikePath() {
    var p = (w.location && w.location.pathname) || '';
    return /admin/i.test(p);
  }

  /** 在 `.topbar` 下方顯示專屬代理名稱與推薦來源（無代理時於代理頁僅顯示推薦來源）。 */
  function initAgentContextBar() {
    if (isAdminLikePath()) return;
    syncReferralFromUrl();
    var tb = document.querySelector('.topbar');
    if (!tb) return;

    var ag = w.VIPStore && w.VIPStore.getAgent ? w.VIPStore.getAgent() : null;
    var hasAgent = !!(ag && ag.code && ag.name);
    var refLbl = escapeContextHtml(getReferralSourceLabel());

    var bar = document.getElementById('vip-agent-context');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'vip-agent-context';
      tb.insertAdjacentElement('afterend', bar);
    }
    bar.className = 'vip-context-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '代理與推薦來源');

    if (!hasAgent) {
      bar.hidden = false;
      bar.innerHTML =
        '<div class="vip-context-bar__inner">' +
        '<span class="vip-context-bar__item">推薦來源 <strong>' +
        refLbl +
        '</strong></span>' +
        '<span class="vip-context-bar__item vip-context-bar__hint">完成專屬代理代碼驗證後，將顯示專屬代理名稱。</span></div>';
      return;
    }

    bar.hidden = false;
    bar.innerHTML =
      '<div class="vip-context-bar__inner">' +
      '<span class="vip-context-bar__item">專屬代理 <strong>' +
      escapeContextHtml(ag.name) +
      '</strong><span class="vip-context-bar__code">（' +
      escapeContextHtml(ag.code) +
      '）</span></span>' +
      '<span class="vip-context-bar__item">推薦來源 <strong>' +
      refLbl +
      '</strong></span></div>';
  }

  var EXIT_INTENT_KEY = 'vip-exit-intent';

  /** 滑鼠移向視窗頂端（離開意圖）時顯示一次挽留對話（需 SweetAlert2）。 */
  function initExitIntentPopup() {
    if (!w.Swal) return;
    if (w.matchMedia && w.matchMedia('(pointer: coarse)').matches) return;

    var memShown = false;
    function alreadyShown() {
      if (memShown) return true;
      try {
        return w.sessionStorage && w.sessionStorage.getItem(EXIT_INTENT_KEY) === '1';
      } catch (e) {
        return false;
      }
    }

    function markShown() {
      memShown = true;
      try {
        if (w.sessionStorage) w.sessionStorage.setItem(EXIT_INTENT_KEY, '1');
      } catch (e) {
        /* ignore */
      }
    }

    var root = document.documentElement;
    function onMouseLeave(e) {
      if (alreadyShown()) return;
      if (typeof e.clientY !== 'number' || e.clientY > 8) return;
      markShown();
      root.removeEventListener('mouseleave', onMouseLeave);
      Swal.fire({
        icon: 'warning',
        title: '商品即將售完，確定離開？',
        showCancelButton: true,
        confirmButtonText: '留下來逛逛',
        cancelButtonText: '仍要離開',
        reverseButtons: true,
      });
    }

    root.addEventListener('mouseleave', onMouseLeave);
  }

  initSwalTheme();

  w.addEventListener('vip-storage-change', function (e) {
    if (e.detail && e.detail.key === 'agent') initAgentContextBar();
  });

  /**
   * 從 srcEl（或 {x,y} 座標）位置彈出金色「+1」，飄向 #vip-cart-link 後消失。
   * 同時觸發購物車按鈕的 bounce 動畫。
   * @param {HTMLElement|{x:number,y:number}} from
   * @param {string} [label] 預設 '+1'
   */
  function popPlusOneToCart(from, label) {
    try {
      var cart = document.getElementById('vip-cart-link');
      var sx, sy;
      if (from && typeof from.getBoundingClientRect === 'function') {
        var r = from.getBoundingClientRect();
        sx = r.left + r.width / 2;
        sy = r.top + r.height / 2;
      } else if (from && typeof from.x === 'number') {
        sx = from.x;
        sy = from.y;
      } else {
        sx = w.innerWidth / 2;
        sy = w.innerHeight / 2;
      }
      var dx = 0, dy = -64;
      if (cart) {
        var cr = cart.getBoundingClientRect();
        dx = cr.left + cr.width / 2 - sx;
        dy = cr.top + cr.height / 2 - sy;
      }
      var el = document.createElement('div');
      el.className = 'vip-plus-one';
      el.textContent = label || '+1';
      el.style.left = sx + 'px';
      el.style.top = sy + 'px';
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      document.body.appendChild(el);
      el.addEventListener('animationend', function () {
        el.remove();
      });
      if (cart) {
        cart.classList.remove('cart-icon-bounce');
        void cart.offsetWidth;
        cart.classList.add('cart-icon-bounce');
        cart.addEventListener(
          'animationend',
          function () {
            cart.classList.remove('cart-icon-bounce');
          },
          { once: true }
        );
      }
    } catch (err) {
      /* ignore */
    }
  }

  w.VIPUX = {
    showLoader: showLoader,
    hideLoader: hideLoader,
    bootLoader: bootLoader,
    initCartBadge: initCartBadge,
    initSwalTheme: initSwalTheme,
    initExitIntentPopup: initExitIntentPopup,
    syncReferralFromUrl: syncReferralFromUrl,
    getReferralSourceLabel: getReferralSourceLabel,
    initAgentContextBar: initAgentContextBar,
    popPlusOneToCart: popPlusOneToCart,
  };
})(window);
