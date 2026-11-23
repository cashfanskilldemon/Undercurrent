(function () {
  'use strict';

  // 仅在精确指针设备启用；触屏 / 减少动效偏好回退到系统光标
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduced) return;

  // 默认使用 B 版（Tabler 矢量）
  var STYLE = (window.__UC_CURSOR_STYLE__ === 'pixel') ? 'pixel' : 'tabler';

  // 两版中指 SVG：A=像素白掌黑边（沿用已生成的资源），B=Tabler 矢量图标改造
  var SVG_PIXEL = '<svg viewBox="0 0 30 32" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">__PIXEL_BODY__</svg>';
  // B 版：先铺一层白色粗描边做衬底（深色背景上不糊），再叠深色细描边，明暗主题都清晰
  var TABLER_PATHS =
    '<path d="M8 13v-2.5a1.5 1.5 0 0 1 3 0v1.5" />' +
    '<path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />' +
    '<path d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />' +
    '<path d="M11 11.5v-8a1.5 1.5 0 1 1 3 0v8.5" />';
  var SVG_TABLER =
    '<svg viewBox="-2 -2 28 28" width="100%" height="100%" fill="none" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">' +
    '<g stroke="#f5f5f1" stroke-width="4.2">' + TABLER_PATHS + '</g>' +
    '<g stroke="#0f0e0c" stroke-width="1.9">' + TABLER_PATHS + '</g>' +
    '</svg>';

  var SVG_ARROW =
    '<svg viewBox="0 0 28 32" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">__ARROW_BODY__</svg>';

  function svgBody(file) {
    // 由构建脚本注入，运行时从 <template> 读取
    var t = document.getElementById(file);
    return t ? t.innerHTML : '';
  }
  SVG_PIXEL = SVG_PIXEL.replace('__PIXEL_BODY__', svgBody('uc-pixel-body'));
  SVG_ARROW = SVG_ARROW.replace('__ARROW_BODY__', svgBody('uc-arrow-body'));

  // 隐藏系统光标
  var style = document.createElement('style');
  style.textContent =
    '@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference) {' +
    'html,body,body *{cursor:none !important}' +
    '}';
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;' +
    'pointer-events:none;user-select:none;';
  var dot = document.createElement('div');
  dot.style.cssText =
    'position:absolute;left:0;top:0;display:grid;place-items:center;' +
    'transform:translate(-50%,-50%);transition:width .18s ease,height .18s ease;' +
    'will-change:transform,width,height;';
  root.appendChild(dot);
  document.body.appendChild(root);

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var cx = mx, cy = my;
  var hovering = false, pressed = false;
  var raf = null;

  function icon() {
    if (hovering) {
      dot.style.width = STYLE === 'tabler' ? '44px' : '40px';
      dot.style.height = STYLE === 'tabler' ? '44px' : '44px';
      dot.innerHTML = STYLE === 'tabler' ? SVG_TABLER : SVG_PIXEL;
    } else {
      dot.style.width = pressed ? '22px' : '28px';
      dot.style.height = pressed ? '22px' : '32px';
      dot.innerHTML = SVG_ARROW;
    }
    place();
  }

  function tick() {
    var dx = mx - cx, dy = my - cy;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      cx = mx; cy = my;
      place();
      raf = null; // 静止时停止 rAF，避免持续重绘
      return;
    }
    cx += dx * 0.22;
    cy += dy * 0.22;
    place();
    raf = requestAnimationFrame(tick);
  }

  function place() {
    var w = parseFloat(dot.style.width) || 28;
    var h = parseFloat(dot.style.height) || 32;
    dot.style.transform =
      'translate(' + (cx - w / 2) + 'px,' + (cy - h / 2) + 'px)';
  }

  function start() { if (!raf) raf = requestAnimationFrame(tick); }

  function move(e) {
    mx = e.clientX;
    my = e.clientY;
    var t = e.target;
    var hit = t && t.closest && t.closest('a,button,[role="button"],[role="tab"],summary,input[type="button"],input[type="submit"],label[for],select');
    if (!!hit !== hovering) {
      hovering = !!hit;
      icon();
    }
    start();
  }

  function down() { pressed = true; if (!hovering) icon(); }
  function up() { pressed = false; if (!hovering) icon(); }

  document.addEventListener('mousemove', move, { passive: true });
  document.addEventListener('mousedown', down, { passive: true });
  document.addEventListener('mouseup', up, { passive: true });
  document.addEventListener('mouseleave', function () { root.style.opacity = '0'; });
  document.addEventListener('mouseenter', function () { root.style.opacity = '1'; });

  icon();
  place();

  // 供对比/切换使用的全局方法
  window.__UC_CURSOR__ = {
    setStyle: function (s) {
      STYLE = s === 'tabler' ? 'tabler' : 'pixel';
      icon();
      return STYLE;
    },
    getStyle: function () { return STYLE; },
    destroy: function () {
      if (raf) cancelAnimationFrame(raf);
      root.remove();
      style.remove();
      delete window.__UC_CURSOR__;
    },
  };
})();
