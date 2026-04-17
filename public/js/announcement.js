(function (w) {
  'use strict';

  var DISMISS_KEY = 'vip_announcement_dismiss_fp';

  function isHomeIndexPage() {
    try {
      if (document.body && document.body.getAttribute('data-vip-home') === '1') return true;
    } catch (e) {
      /* ignore */
    }
    var p = String(w.location.pathname || '').replace(/\\/g, '/');
    return /(^|\/)index\.html$/i.test(p) || p === '/' || p === '';
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function fingerprint(a) {
    try {
      return JSON.stringify({ text: a.text || '', enabled: !!a.enabled });
    } catch (e) {
      return '';
    }
  }

  function isDismissed(a) {
    try {
      return w.localStorage.getItem(DISMISS_KEY) === fingerprint(a);
    } catch (e) {
      return false;
    }
  }

  function dismiss(a) {
    try {
      w.localStorage.setItem(DISMISS_KEY, fingerprint(a));
    } catch (e) {
      /* ignore */
    }
  }

  function removeExistingBars() {
    document.querySelectorAll('.vip-announcement-bar').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function initIndexAnnouncementPopup() {
    if (!w.VIPStore || typeof VIPStore.getAnnouncement !== 'function') return;
    var a = VIPStore.getAnnouncement();
    if (!a.enabled || !String(a.text || '').trim()) return;
    if (isDismissed(a)) return;

    var swalAttempts = 0;
    function tryOpenPopup() {
      if (typeof w.Swal === 'undefined' || typeof w.Swal.fire !== 'function') {
        swalAttempts += 1;
        if (swalAttempts < 80) {
          window.setTimeout(tryOpenPopup, 50);
        }
        return;
      }
      window.setTimeout(function () {
        var body =
          '<div class="vip-announcement-popup-body">' +
          escHtml(String(a.text).trim()).replace(/\n/g, '<br />') +
          '</div>';
        w.Swal.fire({
          title: '最新公告',
          html: body,
          confirmButtonText: '我知道了',
          allowOutsideClick: true,
          customClass: {
            popup: 'vip-swal-popup vip-announcement-popup',
            confirmButton: 'vip-swal-confirm',
            htmlContainer: 'vip-announcement-popup-html',
          },
          didClose: function () {
            dismiss(a);
          },
        });
      }, 280);
    }
    tryOpenPopup();
  }

  function initAnnouncementBar() {
    if (!w.VIPStore || typeof VIPStore.getAnnouncement !== 'function') return;
    if (isHomeIndexPage()) return;
    removeExistingBars();
    var a = VIPStore.getAnnouncement();
    if (!a.enabled || !String(a.text || '').trim()) return;
    if (isDismissed(a)) return;

    var bar = document.createElement('div');
    bar.className = 'vip-announcement-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', '網站公告');
    bar.innerHTML =
      '<div class="vip-announcement-bar__inner">' +
      '<p class="vip-announcement-bar__text"></p>' +
      '<button type="button" class="vip-announcement-bar__close" aria-label="關閉公告"><span aria-hidden="true">×</span></button>' +
      '</div>';
    bar.querySelector('.vip-announcement-bar__text').textContent = String(a.text).trim();

    var skip = document.querySelector('a.skip');
    if (skip && skip.parentNode) {
      skip.parentNode.insertBefore(bar, skip.nextSibling);
    } else {
      document.body.insertBefore(bar, document.body.firstChild);
    }

    w.requestAnimationFrame(function () {
      bar.classList.add('is-open');
    });

    bar.querySelector('.vip-announcement-bar__close').addEventListener('click', function () {
      bar.classList.remove('is-open');
      dismiss(a);
      window.setTimeout(function () {
        if (bar.parentNode) bar.parentNode.removeChild(bar);
      }, 420);
    });
  }

  function boot() {
    if (isHomeIndexPage()) {
      initIndexAnnouncementPopup();
    } else {
      initAnnouncementBar();
    }
    if (!w.__vipAnnouncementStorageBound) {
      w.__vipAnnouncementStorageBound = true;
      w.addEventListener('vip-storage-change', function (e) {
        if (e.detail && e.detail.key === 'announcement') {
          if (isHomeIndexPage()) initIndexAnnouncementPopup();
          else initAnnouncementBar();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  w.VIPAnnouncement = {
    init: initAnnouncementBar,
    initHomePopup: initIndexAnnouncementPopup,
    boot: boot,
  };
})(window);
