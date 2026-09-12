(function () {
    var GISCUS_SCRIPT = 'script[src*="giscus.app"]';
    var SKEY = 'giscus-session';
    var MARK = 'gclogin=1';
    var giscusScript = document.querySelector(GISCUS_SCRIPT);
    if (!giscusScript) {
        var giscusFrame = document.querySelector('.giscus');
        if (!giscusFrame) {
            return;
        }
    }

    function param(name) {
        var m = (location.search || '').match(new RegExp('[?&]' + name + '=([^&#]*)'));
        return m ? decodeURIComponent(m[1]) : null;
    }

    function stripFromUrl(key) {
        var q = location.search.replace(new RegExp('[?&]' + key + '=([^&#]*)', 'g'), '');
        if (q.indexOf('?') !== 0) {
            q = q ? '?' + q : '';
        }
        var base = location.pathname;
        if (q !== '' || location.search !== '') {
            history.replaceState(null, document.title, base + q + location.hash);
        }
    }

    function isLoginReturn() {
        return param('gclogin') === '1';
    }

    function giscusLoginUrl() {
        var clean = location.href.replace(/[?&]gclogin=1([&#]|$)/g, function (all, tail) {
            return tail;
        });
        clean = clean.replace(/[?&]giscus=([^&#]*)/, '');
        var url = new URL(clean, location.href);
        var sep = url.search ? '&' : '?';
        return 'https://giscus.app/api/oauth/authorize?redirect_uri=' +
            encodeURIComponent(url.toString().split('#')[0] + sep + MARK);
    }

    function handleLoginReturn() {
        var token = param('giscus');
        stripFromUrl('giscus');
        stripFromUrl('gclogin');
        if (token) {
            try {
                localStorage.setItem(SKEY, JSON.stringify(token));
            } catch (e) {
            }
        }
        setTimeout(function () {
            try { window.close(); } catch (e2) { }
        }, 600);
    }

    function injectLoginButton() {
        var container = giscusScript ? giscusScript.closest('.card') : giscusFrame.closest('.card');
        if (!container) {
            container = giscusFrame;
        }
        if (!container) {
            return;
        }
        var h3 = container.querySelector('h3.title');
        var cardContent = h3 ? h3.parentNode : container.parentNode;
        if (!cardContent) {
            return;
        }
        var wrap = document.createElement('div');
        wrap.style.setProperty('display', 'flex');
        wrap.style.setProperty('align-items', 'center');
        wrap.style.setProperty('justify-content', 'space-between');
        wrap.style.setProperty('gap', '0.5rem');
        if (h3) {
            cardContent.insertBefore(wrap, h3);
            wrap.appendChild(h3);
        } else {
            cardContent.insertBefore(wrap, cardContent.firstChild);
        }
        var btn = document.createElement('a');
        btn.className = 'button is-small is-light';
        btn.target = '_blank';
        btn.href = giscusLoginUrl();
        btn.setAttribute('title', 'Open GitHub login in a new tab');
        var icon = document.createElement('i');
        icon.className = 'fab fa-github';
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode('\u3000' + 'GitHub 登录'));
        wrap.appendChild(btn);
    }

    function storageHandler(e) {
        if (e.key === SKEY && e.newValue) {
            window.removeEventListener('storage', storageHandler, false);
            location.reload();
        }
    }

    if (isLoginReturn()) {
        handleLoginReturn();
        return;
    }

    window.addEventListener('storage', storageHandler, false);
    injectLoginButton();
})();