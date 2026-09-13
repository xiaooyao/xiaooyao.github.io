(function () {
    if (document.getElementById('bg-settings-root')) {
        return;
    }
    var KEY = 'bg_settings';
    var DEFAULTS = { mode: 'neon', speed: 12, glass: false, fog: false };
    var SPEEDS = [4, 8, 12, 20, 30];
    var state = read();

    function read() {
        var o = { mode: DEFAULTS.mode, speed: DEFAULTS.speed, glass: false, fog: false };
        try {
            var raw = localStorage.getItem(KEY);
            if (raw) {
                var j = JSON.parse(raw);
                if (j && typeof j === 'object') {
                    o.mode = j.mode === 'pure' ? 'pure' : 'neon';
                    o.speed = SPEEDS.indexOf(+j.speed) >= 0 ? +j.speed : DEFAULTS.speed;
                    o.glass = !!j.glass;
                    o.fog = !!j.fog;
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
        body.classList.remove('bg-pure');
        if (state.mode === 'pure') {
            body.classList.add('bg-pure');
        }
        if (window.BGSlideshow && window.BGSlideshow.setSpeed) {
            window.BGSlideshow.setSpeed(state.speed);
        }
        body.classList.remove('glass-on');
        if (state.glass) {
            body.classList.add('glass-on');
        }
        var slides = document.getElementById('bg-slideshow');
        if (slides) {
            slides.classList.remove('fog-on');
            if (state.fog) {
                slides.classList.add('fog-on');
            }
        }
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
        var root = document.getElementById('bg-settings-root');
        if (!root) {
            return;
        }
        var modes = root.querySelectorAll('.bgctl-opt[data-mode]');
        for (var i = 0; i < modes.length; i += 1) {
            var onM = modes[i].getAttribute('data-mode') === state.mode;
            modes[i].className = 'bgctl-opt' + (onM ? ' is-sel' : '');
        }
        var spds = root.querySelectorAll('.bgctl-opt[data-speed]');
        for (var j = 0; j < spds.length; j += 1) {
            var onS = +spds[j].getAttribute('data-speed') === state.speed;
            spds[j].className = 'bgctl-opt' + (onS ? ' is-sel' : '');
        }
        var glass = document.getElementById('bgctl-glass');
        var fog = document.getElementById('bgctl-fog');
        if (glass) {
            glass.checked = state.glass;
        }
        if (fog) {
            fog.checked = state.fog;
        }
    }

    function build() {
        var end = document.querySelector('.navbar-main .navbar-end');
        if (!end) {
            return;
        }

        var root = el('div', 'bgctl');
        root.id = 'bg-settings-root';

        var trig = el('button', 'navbar-item bgctl-trigger', '<i class="fas fa-sliders-h"></i>');
        trig.type = 'button';
        trig.setAttribute('title', '背景设置');

        var panel = el('div', 'bgctl-panel');

        var secM = el('div', 'bgctl-sec');
        secM.appendChild(el('div', 'bgctl-label', '背景模式'));
        var rowM = el('div', 'bgctl-row');
        var optNeon = el('button', 'bgctl-opt', '霓虹轮播');
        optNeon.setAttribute('data-mode', 'neon');
        var optPure = el('button', 'bgctl-opt', '纯黑');
        optPure.setAttribute('data-mode', 'pure');
        rowM.appendChild(optNeon);
        rowM.appendChild(optPure);
        secM.appendChild(rowM);

        var secS = el('div', 'bgctl-sec');
        secS.appendChild(el('div', 'bgctl-label', '切换速度'));
        var rowS = el('div', 'bgctl-row');
        for (var k = 0; k < SPEEDS.length; k += 1) {
            var b = el('button', 'bgctl-opt', SPEEDS[k] + 's');
            b.setAttribute('data-speed', String(SPEEDS[k]));
            rowS.appendChild(b);
        }
        secS.appendChild(rowS);

        var secF = el('div', 'bgctl-sec');
        secF.appendChild(el('div', 'bgctl-label', '特效'));
        var swG = el('label', 'bgctl-switch', '<span>毛玻璃</span>');
        var inG = document.createElement('input');
        inG.type = 'checkbox';
        inG.id = 'bgctl-glass';
        swG.appendChild(inG);
        var swF = el('label', 'bgctl-switch', '<span>水雾</span>');
        var inF = document.createElement('input');
        inF.type = 'checkbox';
        inF.id = 'bgctl-fog';
        swF.appendChild(inF);
        secF.appendChild(swG);
        secF.appendChild(swF);

        panel.appendChild(secM);
        panel.appendChild(secS);
        panel.appendChild(secF);

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
            var pw = 236;
            var left = r.right - pw - 4;
            if (left < 8) {
                left = 8;
            }
            if (left + pw > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - pw - 8);
            }
            panel.style.position = 'fixed';
            panel.style.top = (r.bottom + 6) + 'px';
            panel.style.left = left + 'px';
            panel.style.right = 'auto';
        }

        function closePanel() {
            panel.classList.remove('is-open');
        }

        window.addEventListener('scroll', closePanel, true);
        window.addEventListener('resize', closePanel);

        var mkMode = panel.querySelectorAll('.bgctl-opt[data-mode]');
        for (var m = 0; m < mkMode.length; m += 1) {
            (function (btn) {
                btn.addEventListener('click', function () {
                    setState({ mode: btn.getAttribute('data-mode') });
                });
            }(mkMode[m]));
        }
        var mkSpeed = panel.querySelectorAll('.bgctl-opt[data-speed]');
        for (var s2 = 0; s2 < mkSpeed.length; s2 += 1) {
            (function (btn) {
                btn.addEventListener('click', function () {
                    setState({ speed: +btn.getAttribute('data-speed') });
                });
            }(mkSpeed[s2]));
        }

        function bindToggle(id, key) {
            var box = document.getElementById(id);
            if (box) {
                box.addEventListener('change', function () {
                    var patch = {};
                    patch[key] = box.checked;
                    setState(patch);
                });
            }
        }
        bindToggle('bgctl-glass', 'glass');
        bindToggle('bgctl-fog', 'fog');

        document.addEventListener('click', function (ev) {
            if (!root.contains(ev.target)) {
                panel.classList.remove('is-open');
            }
        });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' || ev.keyCode === 27) {
                panel.classList.remove('is-open');
            }
        });

        mark();
    }

    apply();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();