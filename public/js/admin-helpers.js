(function (w) {
  'use strict';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  /** 7-11 / 出貨備註用純文字區塊 */
  function formatShippingBlock(o) {
    if (!o) return '';
    var lines = [];
    lines.push('Name: ' + (o.name || '—'));
    lines.push('Phone: ' + (o.phone || '—'));
    lines.push('Store: ' + (o.store_name || '—'));
    lines.push('Items:');
    (o.items || []).forEach(function (it) {
      lines.push('  - ' + (it.name || '—') + ' ×' + (Number(it.qty) || 0) + ' @' + (w.VIPStore ? VIPStore.formatTWD(it.price) : it.price));
    });
    if (w.VIPStore && typeof VIPStore.getOrderDisplayTotals === 'function') {
      var m = VIPStore.getOrderDisplayTotals(o);
      lines.push('Subtotal: ' + VIPStore.formatTWD(m.subtotal));
      lines.push('Shipping: ' + VIPStore.formatTWD(m.shipping_fee));
      lines.push('Total: ' + VIPStore.formatTWD(m.total));
    } else {
      lines.push('Total: ' + (o.total != null ? o.total : '—'));
    }
    lines.push('Order: ' + (o.orderId || '—'));
    lines.push('Status: ' + (w.VIPStore ? VIPStore.adminOrderStatusLabel(VIPStore.normalizeOrderStatus(o)) : '—'));
    return lines.join('\n');
  }

  w.AdminHelpers = {
    esc: esc,
    escAttr: escAttr,
    formatShippingBlock: formatShippingBlock,
  };
})(window);
