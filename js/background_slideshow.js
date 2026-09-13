(function () {
    if (document.getElementById('bg-slideshow')) {
        return;
    }
    var images = [];
    var i;
    for (i = 1; i <= 20; i += 1) {
        images.push('/img/bg/bg-' + (i < 10 ? '0' : '') + i + '.jpg');
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.textContent =
        '#bg-slideshow{position:fixed;top:0;left:0;width:100%;height:100%;overflow:hidden;z-index:-1;background:#0a0a14}' +
        '#bg-slideshow .bg-layer{position:absolute;top:0;left:0;width:100%;height:100%;background-size:cover;background-position:center;opacity:0;-webkit-transition:opacity 1.8s ease;transition:opacity 1.8s ease;will-change:opacity}' +
        '#bg-slideshow .bg-on{opacity:1}' +
        '#bg-slideshow .bg-veil{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(rgba(6,6,12,0.18),rgba(6,6,12,0.55))}' +
        (reduce ? '#bg-slideshow .bg-layer{-webkit-transition:none;transition:none}' : '');
    (document.head || document.documentElement).appendChild(style);

    var box = document.createElement('div');
    box.id = 'bg-slideshow';
    var layerA = document.createElement('div');
    layerA.className = 'bg-layer';
    var layerB = document.createElement('div');
    layerB.className = 'bg-layer';
    var veil = document.createElement('div');
    veil.className = 'bg-veil';
    var fog = document.createElement('div');
    fog.className = 'bg-fog';
    box.appendChild(layerA);
    box.appendChild(layerB);
    box.appendChild(veil);
    box.appendChild(fog);
    document.body.appendChild(box);

    var counter = 0;
    var total = images.length;
    function pick() {
        var url = images[counter % total];
        counter += 1;
        return url;
    }
    layerA.style.backgroundImage = 'url(' + pick() + ')';
    layerA.className = 'bg-layer bg-on';
    layerB.style.backgroundImage = 'url(' + pick() + ')';

    function preload(url) {
        var img = new Image();
        img.onload = img.onerror = function () {};
        img.src = url;
    }
    for (i = 0; i < total; i += 1) {
        preload(images[i]);
    }

    var activeA = true;
    var busy = false;
    function next() {
        if (busy) {
            return;
        }
        busy = true;
        var target = activeA ? layerB : layerA;
        target.style.backgroundImage = 'url(' + pick() + ')';
        target.className = 'bg-layer bg-on';
        if (activeA) {
            layerA.className = 'bg-layer';
        } else {
            layerB.className = 'bg-layer';
        }
        activeA = !activeA;
        setTimeout(function () {
            busy = false;
        }, 1900);
    }
    var intervalMs = 12000;
    var timer = null;
    function startTimer() {
        if (timer) {
            clearInterval(timer);
        }
        timer = setInterval(next, intervalMs);
    }
    try {
        var stored = JSON.parse(localStorage.getItem('bg_settings') || '{}');
        if (stored && typeof stored === 'object' && +stored.speed >= 3 && +stored.speed <= 120) {
            intervalMs = Math.round(+stored.speed) * 1000;
        }
    } catch (e) {}
    startTimer();
    window.BGSlideshow = window.BGSlideshow || {};
    window.BGSlideshow.setSpeed = function (seconds) {
        var s = Math.round(+seconds);
        if (!(s >= 3 && s <= 120)) {
            return;
        }
        intervalMs = s * 1000;
        startTimer();
    };
    window.BGSlideshow.getSpeed = function () {
        return Math.round(intervalMs / 1000);
    };
})();