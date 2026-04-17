(function (w) {
  'use strict';

  function normalizeLine(it) {
    if (!it || typeof it !== 'object') return null;
    var id = String(it.id || '');
    var name = String(it.name || '');
    var price = Number(it.price);
    var qty = Math.max(0, Math.floor(Number(it.qty)) || 0);
    if (!id || qty < 1 || !Number.isFinite(price)) return null;
    var productId = it.product_id != null ? String(it.product_id) : id.split('::')[0] || id;
    var combo = Array.isArray(it.combo) ? it.combo.map(String) : [];
    return {
      id: id,
      product_id: productId,
      name: name,
      price: price,
      qty: qty,
      category: it.category != null ? String(it.category) : '',
      combo: combo,
      image: it.image != null ? String(it.image) : '',
    };
  }

  function getCart() {
    return VIPStore.getCart()
      .map(normalizeLine)
      .filter(Boolean);
  }

  function saveCart(items) {
    VIPStore.saveCart(items.map(normalizeLine).filter(Boolean));
  }

  /** 簡易商品（無規格）或已組好的 line */
  function addItem(p) {
    if (p && p.id && (p.product_id != null || p.combo)) {
      addLine({
        id: p.id,
        product_id: p.product_id,
        name: p.name,
        price: p.price,
        qty: p.qty || 1,
        category: p.category,
        combo: p.combo,
        image: p.image,
      });
      return;
    }
    var items = getCart();
    var pid = String(p.id);
    var f = items.find(function (x) {
      return x.id === pid && (!x.combo || !x.combo.length);
    });
    if (f) f.qty += 1;
    else
      items.push(
        normalizeLine({
          id: pid,
          product_id: pid,
          name: String(p.name),
          price: Number(p.price),
          qty: 1,
          category: p.category || '',
          combo: [],
          image: p.image || '',
        })
      );
    saveCart(items);
  }

  function addLine(line) {
    var normalized = normalizeLine({
      id: line.id,
      product_id: line.product_id,
      name: line.name,
      price: line.price,
      qty: line.qty || 1,
      category: line.category,
      combo: line.combo,
      image: line.image,
    });
    if (!normalized) return;
    var items = getCart();
    var f = items.find(function (x) {
      return x.id === normalized.id;
    });
    if (f) f.qty += normalized.qty;
    else items.push(normalized);
    saveCart(items);
  }

  function setQty(id, qty) {
    var q = Math.max(0, Math.floor(Number(qty)) || 0);
    var items = getCart()
      .map(function (x) {
        if (x.id !== id) return x;
        x.qty = q;
        return x;
      })
      .filter(function (x) {
        return x.qty > 0;
      });
    saveCart(items);
  }

  function inc(id) {
    var items = getCart();
    var f = items.find(function (x) {
      return x.id === id;
    });
    if (f) setQty(id, f.qty + 1);
  }

  function dec(id) {
    var items = getCart();
    var f = items.find(function (x) {
      return x.id === id;
    });
    if (f) setQty(id, f.qty - 1);
  }

  function remove(id) {
    saveCart(
      getCart().filter(function (x) {
        return x.id !== id;
      })
    );
  }

  function total() {
    return getCart().reduce(function (s, it) {
      return s + it.price * it.qty;
    }, 0);
  }

  function countItems() {
    return getCart().reduce(function (n, it) {
      return n + it.qty;
    }, 0);
  }

  function reorderFromOrder(order) {
    if (!order || !Array.isArray(order.items)) return;
    order.items.forEach(function (it) {
      var combo = it.combo || [];
      var pid = it.product_id || it.id;
      var lid =
        it.line_id ||
        (combo.length && w.ProductCatalog
          ? ProductCatalog.makeCartLineId(String(pid), combo)
          : String(it.id));
      var line = normalizeLine({
        id: lid,
        product_id: it.product_id || it.id,
        name: it.name,
        price: it.price,
        qty: it.qty,
        category: it.category,
        combo: it.combo || [],
        image: it.image || '',
      });
      if (!line) return;
      var items = getCart();
      var f = items.find(function (x) {
        return x.id === line.id;
      });
      if (f) f.qty += line.qty;
      else items.push(line);
      saveCart(items);
    });
  }

  w.CartAPI = {
    getCart: getCart,
    addItem: addItem,
    addLine: addLine,
    setQty: setQty,
    inc: inc,
    dec: dec,
    remove: remove,
    total: total,
    countItems: countItems,
    reorderFromOrder: reorderFromOrder,
    clear: function () {
      VIPStore.clearCart();
    },
  };
})(window);
