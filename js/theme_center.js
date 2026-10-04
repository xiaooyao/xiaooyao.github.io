(function () {
    if (document.getElementById('theme-settings-root')) {
        return;
    }
    var KEY = 'theme_settings';
    var DEFAULTS = { material: 'glass', ambience: 'grid', accent: 'gold', width: 'standard' };
    var ACCENTS = ['gold', 'cyan', 'purple', 'green'];
    var state = read();

    function read() {
        var o = { material: DEFAULTS.material, ambience: DEFAULTS.ambience, accent: DEFAULTS.accent, width: DEFAULTS.width };
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                var j = JSON.parse(raw);
                if (j && typeof j === 'object') {
                    o.material = j.material === 'solid' ? 'solid' : 'glass';
                    o.ambience = (j.ambience === 'glow' || j.ambience === 'black') ? j.ambience : 'grid';
                    o.accent = ACCENTS.indexOf(j.accent) >= 0 ? j.accent : DEFAULTS.accent;
                    o.width = (j.width === 'narrow' || j.width === 'wide') ? j.width : 'standard';
                }
            }
        } catch (e) {}
        return o;
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function setState(patch) {
        var keys = Object.keys(patch);
        for (var i = 0; i < keys.length; i += 1) {
            if (typeof state[keys[i]] !== 'undefined') {
                state[keys[i]] = patch[keys[i]];
            }
        }
        save();
        apply();
    }

    function apply() {
        var body = document.body;
        body.dataset.material = state.material;
        body.dataset.ambience = state.ambience;
        body.dataset.accent = state.accent;
        body.dataset.width = state.width;
        mark();
    }

    function el(tag, cls, html) {
        var node = document.createElement(tag);
        if (cls) {
            node.className = cls;
        }
        if (html) {
            node.innerHTML = html;
        }
        return node;
    }

    function mark() {
        var root = document.getElementById('theme-settings-root');
        if (!root) {
            return;
        }
        var segs = root.querySelectorAll('.tc-seg');
        for (var i = 0; i < segs.length; i += 1) {
            var group = segs[i].getAttribute('data-group');
            var spans = segs[i].querySelectorAll('span');
            for (var j = 0; j < spans.length; j += 1) {
                var on = spans[j].getAttribute('data-value') === state[group];
                spans[j].className = on ? 'on' : '';
            }
        }
        var dots = root.querySelectorAll('.tc-dot');
        for (var k = 0; k < dots.length; k += 1) {
            var act = dots[k].getAttribute('data-value') === state.accent;
            dots[k].className = 'tc-dot' + (act ? ' on' : '');
        }
    }

    function ensureAmbience() {
        if (document.getElementById('bg-ambience')) {
            return;
        }
        var box = el('div', '');
        box.id = 'bg-ambience';
        box.setAttribute('aria-hidden', 'true');
        box.appendChild(el('div', 'amb-glow'));
        box.appendChild(el('div', 'amb-grid'));
        box.appendChild(el('div', 'amb-stars'));
        box.appendChild(el('div', 'amb-data amb-data-left'));
        box.appendChild(el('div', 'amb-data amb-data-right'));
        document.body.appendChild(box);
    }

    function buildSeg(label, group, options) {
        var sec = el('div', '');
        sec.appendChild(el('div', 'tc-label', label));
        var seg = el('div', 'tc-seg');
        seg.setAttribute('data-group', group);
        for (var i = 0; i < options.length; i += 1) {
            var s = el('span', '', options[i][1]);
            s.setAttribute('data-value', options[i][0]);
            seg.appendChild(s);
        }
        sec.appendChild(seg);
        return sec;
    }

    function build() {
        var end = document.querySelector('.navbar-main .navbar-end');
        if (!end) {
            return;
        }

        var root = el('div', 'tc-center');
        root.id = 'theme-settings-root';

        var trig = el('button', 'navbar-item tc-trigger', '<i class="fas fa-sliders-h"></i>');
        trig.type = 'button';
        trig.setAttribute('title', '主题中心');

        var panel = el('div', 'tc-panel');
        panel.appendChild(el('div', 'tc-title', '主题中心'));

        panel.appendChild(buildSeg('卡片材质', 'material', [['glass', '毛玻璃'], ['solid', '纯色']]));
        panel.appendChild(buildSeg('氛围', 'ambience', [['glow', '鎏金微光'], ['grid', '网格星点'], ['black', '纯黑']]));
        panel.appendChild(buildSeg('阅读宽度', 'width', [['narrow', '窄'], ['standard', '标准'], ['wide', '宽']]));

        var secA = el('div', '');
        secA.appendChild(el('div', 'tc-label', '强调色'));
        var dots = el('div', 'tc-dots');
        var accentColors = { gold: '#c8a25a', cyan: '#4e9daa', purple: '#8d7fc9', green: '#5f9e6e' };
        for (var a = 0; a < ACCENTS.length; a += 1) {
            var dot = el('span', 'tc-dot');
            dot.setAttribute('data-value', ACCENTS[a]);
            dot.style.background = accentColors[ACCENTS[a]];
            dots.appendChild(dot);
        }
        secA.appendChild(dots);
        panel.appendChild(secA);

        root.appendChild(trig);
        root.appendChild(panel);
        end.appendChild(root);

        trig.addEventListener('click', function (ev) {
            ev.stopPropagation();
            positionPanel();
            panel.classList.toggle('is-open');
        });

        function positionPanel() {
            var r = trig.getBoundingClientRect();
            var pw = 248;
            var left = r.right - pw - 4;
            if (left < 8) {
                left = 8;
            }
            if (left + pw > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - pw - 8);
            }
            panel.style.top = (r.bottom + 6) + 'px';
            panel.style.left = left + 'px';
        }

        function closePanel() {
            panel.classList.remove('is-open');
        }

        window.addEventListener('scroll', closePanel, true);
        window.addEventListener('resize', closePanel);

        var segs = panel.querySelectorAll('.tc-seg');
        for (var s1 = 0; s1 < segs.length; s1 += 1) {
            (function (seg) {
                var group = seg.getAttribute('data-group');
                var items = seg.querySelectorAll('span');
                for (var i2 = 0; i2 < items.length; i2 += 1) {
                    (function (item) {
                        item.addEventListener('click', function () {
                            var patch = {};
                            patch[group] = item.getAttribute('data-value');
                            setState(patch);
                        });
                    }(items[i2]));
                }
            }(segs[s1]));
        }

        var dotsAll = panel.querySelectorAll('.tc-dot');
        for (var d = 0; d < dotsAll.length; d += 1) {
            (function (dot) {
                dot.addEventListener('click', function () {
                    setState({ accent: dot.getAttribute('data-value') });
                });
            }(dotsAll[d]));
        }

        document.addEventListener('click', function (ev) {
            if (!root.contains(ev.target)) {
                closePanel();
            }
        });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' || ev.keyCode === 27) {
                closePanel();
            }
        });

        mark();
    }

    window.ThemeCenter = {
        get: function () {
            return { material: state.material, ambience: state.ambience, accent: state.accent, width: state.width };
        },
        set: function (patch) {
            setState(patch);
        }
    };

    ensureAmbience();
    apply();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ensureAmbience();
            if (!document.getElementById('theme-settings-root')) {
                build();
            }
            apply();
        });
    } else {
        build();
    }
})();
