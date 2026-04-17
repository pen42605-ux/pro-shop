/**
 * 依權限顯示後台側欄連結（需在 VIPStore 載入後執行）。
 */
(function () {
  function apply() {
    if (!window.VIPStore) return;
    var navs = document.querySelectorAll('.admin-sidebar__nav, .admin-side nav');
    navs.forEach(function (nav) {
      nav.querySelectorAll('a[data-admin-perm]').forEach(function (a) {
        var k = a.getAttribute('data-admin-perm');
        if (!VIPStore.hasAdminPermission(k)) {
          a.style.display = 'none';
          a.setAttribute('aria-hidden', 'true');
        }
      });
      nav.querySelectorAll('a[data-super-only]').forEach(function (a) {
        if (!VIPStore.isSuperAdmin()) {
          a.style.display = 'none';
          a.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
