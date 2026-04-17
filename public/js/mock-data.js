(function (w) {
  'use strict';

  var AGENT_NAMES = {
    GOLD: '金牌特約 · 北區',
    VIP: '尊榮代理 · 線上',
    IQOS: 'IQOS 官方渠道',
    VAPE: '霧化體驗店',
  };

  function resolveAgent(code) {
    if (w.VIPStore && typeof VIPStore.resolveAgentForLogin === 'function') {
      return VIPStore.resolveAgentForLogin(code);
    }
    var c = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!c) return null;
    return AGENT_NAMES[c] ? { code: c, name: AGENT_NAMES[c] } : null;
  }

  function thumb(label) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop stop-color="#0a0a0a"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#050505"/></linearGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#f5e6a8" font-size="36" font-family="system-ui,sans-serif" font-weight="800">' +
      label +
      '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /** @type {{id:string,name:string,price:number,originalPrice:number,stock:number,category:string,image:string}[]} */
  var PRODUCTS = [
    { id: 'iq1', name: 'IQOS ILUMA i', price: 4680, originalPrice: 5490, stock: 12, category: 'IQOS', image: thumb('IQ') },
    { id: 'iq2', name: 'IQOS 專用清潔組', price: 580, originalPrice: 720, stock: 8, category: 'IQOS', image: thumb('CL') },
    { id: 'vp1', name: '霧化主機 · 曜金', price: 3280, originalPrice: 3980, stock: 5, category: 'Vape', image: thumb('VP') },
    { id: 'vp2', name: '煙彈組 · 薄荷', price: 420, originalPrice: 520, stock: 18, category: 'Vape', image: thumb('P') },
    { id: 'ac1', name: '磁吸收納盒', price: 690, originalPrice: 890, stock: 11, category: 'Accessories', image: thumb('BX') },
    { id: 'ac2', name: 'Type‑C 快充線', price: 290, originalPrice: 390, stock: 24, category: 'Accessories', image: thumb('C') },
  ];

  w.MockData = {
    resolveAgent: resolveAgent,
    PRODUCTS: PRODUCTS,
  };
})(window);
