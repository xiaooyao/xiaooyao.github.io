(function() {
    function $() {
        return Array.prototype.slice.call(document.querySelectorAll.apply(document, arguments));
    }

    $('body > .navbar, body > .section, body > .footer').forEach(function(element) {
        element.style.transition = '0s';
        element.style.opacity = '0';
    });
    [
        '.column-main > .card, .column-main > .pagination, .column-main > .post-navigation',
        '.column-left > .card, .column-right-shadow > .card',
        '.column-right > .card'
    ].forEach(function(selector) {
        $(selector).forEach(function(element) {
            element.style.transition = '0s';
            element.style.opacity = '0';
        });
    });
    // disable jump to location.hash
    if (window.location.hash) {
        window.scrollTo(0, 0);
        setTimeout(function() { window.scrollTo(0, 0); }, 0);
    }

    setTimeout(function() {
        $('body > .navbar, body > .section, body > .footer').forEach(function(element) {
            element.style.opacity = '1';
            element.style.transition = 'opacity 0.3s ease-out';
        });

        var i = 1;
        [
            '.column-main > .card, .column-main > .pagination, .column-main > .post-navigation',
            '.column-left > .card, .column-right-shadow > .card',
            '.column-right > .card'
        ].forEach(function(selector) {
            $(selector).forEach(function(element) {
                setTimeout(function() {
                    element.style.opacity = '1';
                    element.style.transition = 'opacity 0.3s ease-out';
                }, i * 100);
                i++;
            });
        });

        // jump to location.hash
        if (window.location.hash) {
            setTimeout(function() {
                var id = '#' + CSS.escape(window.location.hash.substring(1));
                var target = document.querySelector(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }, i * 100);
        }
    });
}());
