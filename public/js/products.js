(function (w) {
  'use strict';

  var DEFAULT_CATS = ['IQOS', 'Vape', 'Accessories'];

  function combosMatch(a, b) {
    var x = a || [];
    var y = b || [];
    if (x.length !== y.length) return false;
    for (var i = 0; i < x.length; i++) {
      if (String(x[i]) !== String(y[i])) return false;
    }
    return true;
  }

  /** 笛卡爾積：每個元素為一組選項值的陣列（順序同 options） */
  function cartesianOptionValues(options) {
    if (!options || !options.length) return [[]];
    var valArrays = options.map(function (o) {
      return (o.values || [])
        .map(function (v) {
          return String(v).trim();
        })
        .filter(Boolean);
    });
    if (valArrays.some(function (a) {
      return !a.length;
    }))
      return [];
    return valArrays.reduce(function (acc, vals) {
      if (!acc.length) {
        return vals.map(function (v) {
          return [v];
        });
      }
      var next = [];
      acc.forEach(function (row) {
        vals.forEach(function (v) {
          next.push(row.concat([v]));
        });
      });
      return next;
    }, []);
  }

  function makeCartLineId(productId, combo) {
    try {
      return (
        String(productId) +
        '::' +
        btoa(unescape(encodeURIComponent(JSON.stringify(combo || []))))
      );
    } catch (e) {
      return String(productId) + '::' + String(Math.random()).slice(2, 12);
    }
  }

  function findVariation(product, combo) {
    var vars = product && product.variations ? product.variations : [];
    var c = combo || [];
    for (var i = 0; i < vars.length; i++) {
      if (combosMatch(vars[i].combo, c)) return vars[i];
    }
    return null;
  }

  function displayProductName(product, combo) {
    var base = (product && product.name) || '商品';
    var c = combo || [];
    if (!c.length) return base;
    return base + ' · ' + c.join(' / ');
  }

  function ensureProductShape(p) {
    if (!p || typeof p !== 'object') return null;
    var o = {
      id: String(p.id || ''),
      name: String(p.name || ''),
      description: p.description != null ? String(p.description) : '',
      category: String(p.category || 'Accessories'),
      base_price: Number(p.base_price) || 0,
      original_price: Number(p.original_price != null ? p.original_price : p.base_price) || 0,
      images: Array.isArray(p.images) ? p.images.filter(Boolean).map(String) : [],
      options: Array.isArray(p.options)
        ? p.options.map(function (opt) {
            return {
              name: String(opt.name || '').trim(),
              values: Array.isArray(opt.values)
                ? opt.values
                    .map(function (v) {
                      return String(v).trim();
                    })
                    .filter(Boolean)
                : [],
            };
          })
        : [],
      variations: Array.isArray(p.variations)
        ? p.variations.map(function (v) {
            return {
              combo: Array.isArray(v.combo) ? v.combo.map(String) : [],
              price: Number(v.price) || 0,
              stock: Math.max(0, Math.floor(Number(v.stock)) || 0),
            };
          })
        : [],
      status: p.status === 'hidden' ? 'hidden' : 'active',
    };
    if (!o.options.length && !o.variations.length) {
      o.variations = [
        {
          combo: [],
          price: o.base_price,
          stock: Math.max(0, Math.floor(Number(p.stock)) || 0),
        },
      ];
    }
    return o;
  }

  function seedFromMockIfEmpty() {
    var list = VIPStore.getProducts();
    if (list.length || !w.MockData || !MockData.PRODUCTS) return;
    var seeded = MockData.PRODUCTS.map(function (p) {
      return ensureProductShape({
        id: p.id,
        name: p.name,
        description: '',
        category: p.category,
        base_price: p.price,
        original_price: p.originalPrice,
        images: [p.image],
        options: [],
        variations: [{ combo: [], price: p.price, stock: p.stock }],
        status: 'active',
      });
    });
    VIPStore.saveProducts(seeded);
  }

  function getActiveForShop() {
    seedFromMockIfEmpty();
    return VIPStore.getProducts().filter(function (p) {
      return (p.status || 'active') === 'active';
    });
  }

  function getById(id) {
    seedFromMockIfEmpty();
    var sid = String(id);
    return (
      VIPStore.getProducts().find(function (p) {
        return String(p.id) === sid;
      }) || null
    );
  }

  function categoriesInUse() {
    var s = {};
    DEFAULT_CATS.forEach(function (c) {
      s[c] = true;
    });
    VIPStore.getProducts().forEach(function (p) {
      if (p.category) s[p.category] = true;
    });
    return Object.keys(s).sort();
  }

  function nextId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function variationStockRemaining(product, combo, cartLines) {
    var v = findVariation(product, combo);
    if (!v) return 0;
    var lid = makeCartLineId(product.id, combo);
    var used = 0;
    (cartLines || []).forEach(function (ln) {
      if (ln && ln.id === lid) used += Number(ln.qty) || 0;
    });
    return Math.max(0, v.stock - used);
  }

  w.ProductCatalog = {
    DEFAULT_CATS: DEFAULT_CATS,
    combosMatch: combosMatch,
    cartesianOptionValues: cartesianOptionValues,
    makeCartLineId: makeCartLineId,
    findVariation: findVariation,
    displayProductName: displayProductName,
    ensureProductShape: ensureProductShape,
    seedFromMockIfEmpty: seedFromMockIfEmpty,
    getActiveForShop: getActiveForShop,
    getById: getById,
    categoriesInUse: categoriesInUse,
    nextId: nextId,
    variationStockRemaining: variationStockRemaining,
  };
})(window);
