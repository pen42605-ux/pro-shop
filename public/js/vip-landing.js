/**
 * 首頁／登入頁：倒數、配送日、捲動顯現（高轉換版型用）。
 */
(function (w) {
  'use strict';

  /** 今日訂單截止（本地時間，可改） */
  var CUTOFF_HOUR = 18;

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function formatSlashMD(d) {
    return pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
  }

  function nextOrderCutoff() {
    var now = new Date();
    var c = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CUTOFF_HOUR, 0, 0, 0);
    if (now.getTime() >= c.getTime()) {
      c.setDate(c.getDate() + 1);
    }
    return c;
  }

  function tickCountdown() {
    var el =
      document.getElementById('vip-countdown-digits') ||
      document.getElementById('vip-countdown-digits-login');
    if (!el) return;
    var end = nextOrderCutoff();
    function upd() {
      var now = Date.now();
      var diff = end.getTime() - now;
      if (diff <= 0) {
        end = nextOrderCutoff();
        diff = Math.max(0, end.getTime() - now);
      }
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      el.textContent = pad2(h) + ':' + pad2(m) + ':' + pad2(s);
    }
    upd();
    w.setInterval(upd, 1000);
  }

  function setDeliveryRange() {
    var el =
      document.getElementById('vip-delivery-range') ||
      document.getElementById('vip-delivery-range-login');
    if (!el) return;
    var a = new Date();
    a.setDate(a.getDate() + 1);
    var b = new Date();
    b.setDate(b.getDate() + 2);
    el.textContent = formatSlashMD(a) + ' - ' + formatSlashMD(b);
  }

  function initReveal() {
    var els = document.querySelectorAll('.is-vip-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in w)) {
      els.forEach(function (x) {
        x.classList.add('is-vip-visible');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('is-vip-visible');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function init() {
    initReveal();
    tickCountdown();
    setDeliveryRange();
  }

  w.VIPLanding = { init: init };
})(window);
