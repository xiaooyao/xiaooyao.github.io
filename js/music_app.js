(function () {
    var clean = function (v) { return (v == null ? '' : String(v)).replace(/[<>"'&]/g, ''); };
    var esc = function (v) { return (v == null ? '' : String(v)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
    var hasBadChar = function (s) {
        for (var i = 0; i < s.length; i++) {
            var c = s.charCodeAt(i);
            if (c <= 32 || c === 34 || c === 39 || c === 60 || c === 62) { return true; }
        }
        return false;
    };
    var isValidUrl = function (u) {
        var s = String(u || '').trim();
        return s.length > 0 && !hasBadChar(s);
    };
    var pickName = function (u) {
        var parts = String(u || '').split('/');
        var s = parts[parts.length - 1];
        if (!s) { s = u; }
        return s || 'Audio';
    };
    var splitLines = function (text) {
        var lines = String(text || '').split(String.fromCharCode(10));
        var out = [];
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            while (l.length && l.charCodeAt(l.length - 1) === 13) { l = l.substring(0, l.length - 1); }
            out.push(l.trim());
        }
        return out;
    };
    var STORE_KEY = 'icarus-music-import';
    var DEFAULT_NETEASE_ID = '18309787841';

    function ensureCore(frameHeight) {
        var M = window.__Music;
        if (M && M.park && M.park.isConnected) {
            if (frameHeight && frameHeight !== M.frameHeight) {
                M.frameHeight = frameHeight;
                M.park.style.height = frameHeight + 'px';
                if (M.frame) { M.frame.style.height = frameHeight + 'px'; }
            }
            return M;
        }
        var park = document.createElement('div');
        park.id = 'music-park';
        park.style.cssText = 'position:fixed;left:-99999px;top:0;width:400px;height:' + frameHeight + 'px;overflow:hidden;';
        document.body.appendChild(park);
        var audio = document.createElement('audio');
        audio.className = 'music-player-audio';
        audio.preload = 'none';
        park.appendChild(audio);

        M = window.__Music = {
            park: park,
            audio: audio,
            frame: null,
            mode: null,
            neteaseId: null,
            songs: [],
            current: -1,
            playing: false,
            frameHeight: frameHeight,
            bound: false,
            bootId: (Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)).slice(0, 8)
        };
        M.save = function (obj) {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { }
        };
        M.refresh = function () {
            var cards = Array.prototype.slice.call(document.querySelectorAll('.music-player-card'));
            var nowSong = M.mode === 'songs' ? (M.songs[M.current] || null) : null;
            Array.prototype.forEach.call(document.querySelectorAll('.music-player-audio'), function (a) {
                if (a !== M.audio) { a.remove(); }
            });
            if (M.mode === 'netease' && M.frame) {
                Array.prototype.forEach.call(document.querySelectorAll('.music-player-frame'), function (box) {
                    for (var k = box.children.length - 1; k >= 0; k--) {
                        if (box.children[k] !== M.frame) { box.removeChild(box.children[k]); }
                    }
                });
            }
            var target = -1;
            for (var ti = 0; ti < cards.length; ti++) {
                if (window.getComputedStyle(cards[ti]).display === 'none') { continue; }
                var holder = cards[ti].closest('[class*="shadow"]');
                if (!holder) { target = ti; break; }
            }
            if (target === -1) {
                for (var tj = 0; tj < cards.length; tj++) {
                    if (window.getComputedStyle(cards[tj]).display !== 'none') { target = tj; break; }
                }
            }
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                var st = c.querySelector('.music-player-status');
                var pb = c.querySelector('.music-play');
                var pc = c.querySelector('.music-player-custom');
                var fr = c.querySelector('.music-player-frame');
                if (pc) { pc.hidden = M.mode !== 'songs'; }
                if (fr) {
                    if (M.mode === 'netease' && M.frame) {
                        fr.hidden = false;
                        if (i === target) {
                            if (M.frame.parentNode !== fr) {
                                if (M.frame.parentNode) { M.frame.parentNode.removeChild(M.frame); }
                                fr.appendChild(M.frame);
                            }
                        } else if (M.frame.parentNode === fr) {
                            M.park.appendChild(M.frame);
                        }
                    } else {
                        fr.hidden = true;
                    }
                }
                if (pb) {
                    var active = M.mode === 'songs' && M.playing;
                    pb.classList.toggle('is-playing', active);
                    var icon = pb.querySelector('i');
                    if (icon) { icon.className = active ? 'fas fa-pause' : 'fas fa-play'; }
                }
                if (st) {
                    if (M.mode === 'netease') { st.textContent = '已加载网易云歌单 ' + M.neteaseId + '  会话:' + M.bootId; }
                    else if (nowSong) { st.textContent = nowSong.name + (nowSong.artist ? ' - ' + nowSong.artist : '') + '  会话:' + M.bootId; }
                    else { st.textContent = '已导入 ' + M.songs.length + ' 首，可开始播放'; }
                }
                var l = c.querySelector('.music-player-list');
                if (l) {
                    l.innerHTML = (M.songs || []).map(function (s, i) {
                        return '<li class="music-item' + (i === M.current ? ' is-active' : '') + '" data-index="' + i + '" data-url="' + esc(s.url) + '" data-title="' + esc(s.name) + '" data-author="' + esc(s.artist) + '">' +
                            '<span class="music-index">' + (i + 1) + '</span>' +
                            '<span class="music-meta"><span class="music-name">' + esc(s.name) + '</span></span>' +
                            '<span class="music-play-hint"><i class="fas fa-play"></i></span>' +
                        '</li>';
                    }).join('');
                    Array.prototype.forEach.call(l.children, function (li) {
                        li.addEventListener('click', function () {
                            M.goto(parseInt(li.getAttribute('data-index'), 10), true);
                        });
                    });
                }
                var tip = c.querySelector('.empty-tip');
                if (tip) { tip.hidden = M.songs.length > 0; }
            }
        };
        M.goto = function (index, playNow) {
            var s = M.songs[index];
            if (!s) { return; }
            M.current = index;
            M.playing = false;
            M.audio.src = s.url;
            if (M.mode === 'songs') { M.save({ type: 'songs', songs: M.songs, index: index }); }
            if (playNow) {
                var p = M.audio.play();
                if (p && p.then) {
                    p.then(function () { M.playing = true; M.refresh(); }).catch(function () { M.playing = false; M.refresh(); });
                }
            }
            M.refresh();
        };
        M.next = function (step) {
            if (!M.songs.length) { return; }
            var i = M.current === -1 ? 0 : (M.current + step + M.songs.length) % M.songs.length;
            M.goto(i, true);
        };
        M.togglePlay = function () {
            if (M.mode !== 'songs') { return; }
            if (!M.songs.length) { M.refresh(); return; }
            if (M.current === -1) { M.goto(0, true); return; }
            if (M.audio.src && !M.audio.paused) { M.audio.pause(); M.playing = false; M.refresh(); }
            else {
                var p = M.audio.play();
                if (p && p.then) { p.then(function () { M.playing = true; M.refresh(); }).catch(function () { }); }
            }
        };
        M.import = function (list, persist) {
            var imported = (list || []).map(function (s) {
                return { url: clean(s.url), name: String(s.name || pickName(s.url)), artist: String(s.artist || '') };
            }).filter(function (s) { return isValidUrl(s.url); });
            if (!imported.length) { return false; }
            M.mode = 'songs';
            M.audio.pause();
            M.songs = imported;
            M.current = -1;
            M.playing = false;
            if (M.frame) {
                if (M.frame.parentNode) { M.frame.parentNode.removeChild(M.frame); }
                M.frame = null;
            }
            if (persist) { M.save({ type: 'songs', songs: imported, index: -1 }); }
            M.refresh();
            return true;
        };
        M.loadNetease = function (id) {
            var cleanId = String(id || '').replace(/[^0-9]/g, '');
            if (!cleanId) { return false; }
            M.audio.pause();
            M.playing = false;
            if (!(M.mode === 'netease' && M.neteaseId === cleanId && M.frame)) {
                if (M.frame) {
                    if (M.frame.parentNode) { M.frame.parentNode.removeChild(M.frame); }
                    M.frame = null;
                }
                M.songs = [];
                M.current = -1;
                var f = document.createElement('iframe');
                f.setAttribute('frameborder', 'no');
                f.setAttribute('border', '0');
                f.setAttribute('marginwidth', '0');
                f.setAttribute('marginheight', '0');
                f.width = '100%';
                f.height = String(M.frameHeight);
                f.src = 'https://music.163.com/outchain/player?type=0&id=' + cleanId + '&auto=0&height=' + M.frameHeight;
                M.park.appendChild(f);
                M.frame = f;
                M.neteaseId = cleanId;
            }
            M.mode = 'netease';
            M.save({ type: 'netease', id: cleanId });
            M.refresh();
            return true;
        };
        M.reset = function () {
            try { localStorage.removeItem(STORE_KEY); } catch (e) { }
            M.audio.pause();
            M.audio.removeAttribute('src');
            if (M.frame) {
                if (M.frame.parentNode) { M.frame.parentNode.removeChild(M.frame); }
                M.frame = null;
            }
            M.songs = [];
            M.current = -1;
            M.playing = false;
            M.mode = null;
            if (getDefaults().length) { M.import(getDefaults(), false); }
            else { M.loadNetease(DEFAULT_NETEASE_ID); }
            M.refresh();
        };
        M.audio.addEventListener('ended', function () { M.next(1); });
        M.audio.addEventListener('pause', function () { if (M.playing && !M.audio.ended) { M.playing = false; M.refresh(); } });
        if (!M.bound) {
            M.bound = true;
            document.addEventListener('pjax:send', function () {
                if (M.frame && M.frame.parentNode && M.frame.parentNode !== M.park) { M.park.appendChild(M.frame); }
            });
            document.addEventListener('pjax:complete', function () { M.refresh(); });
            window.addEventListener('resize', function () { M.refresh(); });
            var mutTimer = null;
            var mutObs = new MutationObserver(function () {
                clearTimeout(mutTimer);
                mutTimer = setTimeout(function () {
                    var W = window.__Music;
                    if (W && W.park && W.park.isConnected) { W.refresh(); }
                }, 150);
            });
            if (document.body) { mutObs.observe(document.body, { childList: true, subtree: true }); }
        }
        return M;
    }

    function getDefaults() {
        var defEl = document.querySelector('.music-player-defaults');
        if (!defEl) { return []; }
        try {
            var raw = defEl.getAttribute('data-songs');
            if (raw) { return JSON.parse(raw) || []; }
        } catch (e) { }
        return [];
    }

    function parseNeteaseId(text) {
        var t = String(text || '').trim();
        if (!t) { return null; }
        var idIdx = t.indexOf('id=');
        if (idIdx >= 0) {
            var m = t.substring(idIdx + 3).match(/^[0-9]+/);
            if (m) { return m[0]; }
        }
        if (t.indexOf('playlist') >= 0 || /^[0-9]+$/.test(t)) {
            m = t.match(/[0-9]{5,}/);
            if (m) { return m[0]; }
        }
        return null;
    }

    function readFileText(file, cb, onErr) {
        var r = new FileReader();
        r.onload = function () { cb(r.result); };
        r.onerror = function () { onErr('读取文件失败'); };
        r.readAsText(file);
    }

    function parseM3U(text) {
        var out = [];
        var pending = null;
        var lines = splitLines(text);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line) { continue; }
            if (line.charAt(0) === '#') {
                if (line.toLowerCase().indexOf('#extinf:') === 0) {
                    var commaIdx = line.indexOf(',');
                    pending = commaIdx >= 0 ? line.substring(commaIdx + 1) : line.substring(8);
                }
                continue;
            }
            if (!isValidUrl(line)) { continue; }
            var meta = (pending || '').trim();
            pending = null;
            var artist = '';
            var title = meta;
            var sep = meta.indexOf(' - ');
            if (sep > 0) { artist = meta.slice(0, sep); title = meta.slice(sep + 3); }
            out.push({ url: line, name: title || pickName(line), artist: artist });
        }
        return out;
    }

    function parseJSONSongs(text) {
        var data = JSON.parse(text);
        var arr = Array.isArray(data) ? data : (data && Array.isArray(data.songs) ? data.songs : null);
        if (!arr) { throw new Error('JSON 结构未识别'); }
        return arr.map(function (it) {
            var o = it || {};
            return { url: o.url || o.src || o.file || '', name: o.name || o.title, artist: o.artist || o.author || o.singer || '' };
        });
    }

    function bindCard(card, M) {
        var playBtn = card.querySelector('.music-play');
        var prevBtn = card.querySelector('.music-prev');
        var nextBtn = card.querySelector('.music-next');
        var status = card.querySelector('.music-player-status');
        var listEl = card.querySelector('.music-player-list');
        var emptyTip = card.querySelector('.empty-tip');
        var toggleBtn = card.querySelector('.music-import-toggle');
        var panel = card.querySelector('.music-import-panel');
        var netInput = card.querySelector('.music-net-input');
        var netBtn = card.querySelector('.music-net-btn');
        var urlInput = card.querySelector('.music-url-input');
        var urlBtn = card.querySelector('.music-url-btn');
        var fileInput = card.querySelector('.music-file-input');
        var clearBtn = card.querySelector('.music-clear-btn');
        function setStatus(msg) { if (status) { status.textContent = msg; } }

        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', function () {
                var opening = panel.hidden;
                panel.hidden = !opening;
                var icon = toggleBtn.querySelector('i');
                if (icon) { icon.className = opening ? 'fas fa-times' : 'fas fa-download'; }
            });
        }
        if (netBtn && netInput) {
            netBtn.addEventListener('click', function () {
                var id = parseNeteaseId(netInput.value);
                if (!id) { setStatus('未能识别网易云歌单 ID'); return; }
                M.loadNetease(id);
            });
            netInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); netBtn.click(); } });
        }
        if (urlBtn && urlInput) {
            urlBtn.addEventListener('click', function () {
                var u = (urlInput.value || '').trim();
                if (!isValidUrl(u)) { setStatus('音频链接无效'); return; }
                var ok = M.import([{ url: u, name: pickName(u), artist: '' }], false);
                if (ok) { M.goto(0, true); }
            });
            urlInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); urlBtn.click(); } });
        }
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                var file = fileInput.files && fileInput.files[0];
                if (!file) { return; }
                readFileText(file, function (text) {
                    var trimmed = String(text || '').trim();
                    var looksJson = trimmed.charAt(0) === '[' || trimmed.charAt(0) === '{';
                    var isJsonName = file.name.toLowerCase().slice(-5) === '.json';
                    var list = [];
                    try {
                        list = (isJsonName || looksJson) ? parseJSONSongs(trimmed) : parseM3U(trimmed);
                        var ok = M.import(list, true);
                        if (!ok) { setStatus('没有可用的音频链接'); }
                    } catch (e) {
                        setStatus('解析歌单失败: ' + (e && e.message ? e.message : e));
                    }
                }, setStatus);
                fileInput.value = '';
            });
        }
        if (clearBtn) { clearBtn.addEventListener('click', function () { M.reset(); }); }
        if (playBtn) { playBtn.addEventListener('click', function () { M.togglePlay(); }); }
        if (prevBtn) { prevBtn.addEventListener('click', function () { M.next(-1); }); }
        if (nextBtn) { nextBtn.addEventListener('click', function () { M.next(1); }); }
    }

    function init() {
        var script = document.currentScript;
        var root = script && script.parentElement ? script.parentElement : null;
        var cards = [];
        if (root) {
            if (root.classList && root.classList.contains('music-player-card')) {
                cards.push(root);
            } else {
                cards = Array.prototype.slice.call(root.querySelectorAll('.music-player-card'));
            }
        }
        if (!cards.length) {
            cards = Array.prototype.slice.call(document.querySelectorAll('.music-player-card'));
        }
        var fh = 450;
        for (var i = 0; i < cards.length; i++) {
            var a = parseInt(cards[i].getAttribute('data-frame-height') || '0', 10);
            if (a) { fh = a; break; }
        }
        var M = ensureCore(fh);
        if (!M) { return; }
        for (i = 0; i < cards.length; i++) {
            if (cards[i].getAttribute('data-music-bound')) { continue; }
            bindCard(cards[i], M);
            cards[i].setAttribute('data-music-bound', '1');
        }
        if (!M.inited) {
            M.inited = true;
            var saved = null;
            try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { }
            if (M.mode === 'netease') {
                M.refresh();
            } else if (M.mode === 'songs') {
                M.refresh();
            } else {
                var defs = getDefaults();
                if (saved && saved.type === 'netease') {
                    M.loadNetease(String(saved.id));
                } else if (saved && saved.type === 'songs') {
                    M.import(saved.songs || [], true);
                    var si = parseInt(saved.index, 10);
                    if (!isNaN(si) && si >= 0 && si < M.songs.length) { M.goto(si, false); }
                } else if (defs.length) {
                    M.import(defs, false);
                } else {
                    M.loadNetease(DEFAULT_NETEASE_ID);
                }
                M.refresh();
            }
        } else {
            M.refresh();
        }
    }

    try {
        if (document.body) { init(); }
        else {
            document.addEventListener('DOMContentLoaded', function () { init(); });
        }
    } catch (e) {
        var st = document.querySelector('.music-player-card .music-player-status');
        if (st) { st.textContent = 'ERR: ' + (e && e.message ? e.message : e); }
    }
})();