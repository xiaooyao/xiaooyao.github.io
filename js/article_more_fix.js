(function () {
    function applyLive(el, on) {
        if (on) {
            el.style.setProperty('background-color', '#8a5cff', 'important');
            el.style.setProperty('color', '#ffffff', 'important');
            el.style.setProperty('box-shadow', '0 0 16px rgba(138, 92, 255, 0.8)', 'important');
            console.log('AMH v2 ON', getComputedStyle(el).backgroundColor, el.style.cssText);
        } else {
            el.style.removeProperty('background-color');
            el.style.removeProperty('color');
            el.style.removeProperty('box-shadow');
            console.log('AMH v2 OFF');
        }
    }
    document.addEventListener('DOMContentLoaded', function () {
        var btns = document.querySelectorAll('.article-more');
        for (var i = 0; i < btns.length; i++) {
            (function (btn) {
                var host = btn.closest('.card') || btn.closest('article');
                if (!host) return;
                host.addEventListener('mouseenter', function () { applyLive(btn, true); });
                host.addEventListener('mouseleave', function () { applyLive(btn, false); });
                btn.addEventListener('mouseenter', function () { applyLive(btn, true); });
                btn.addEventListener('mouseleave', function () { applyLive(btn, false); });
            })(btns[i]);
        }
        console.log('AMH v2 ready (' + btns.length + ')');
    });
})();