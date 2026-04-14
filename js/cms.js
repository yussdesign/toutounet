// Toutounet CMS injector
// Loads content/site.json and injects values into elements marked with data-cms="path.to.value"
// For collections (reviews, faq, gallery), uses data-cms-list="key" on a container
// with a <template data-cms-item> inside.
(function () {
    'use strict';

    function get(obj, path) {
        return path.split('.').reduce(function (o, k) {
            return (o && o[k] !== undefined) ? o[k] : undefined;
        }, obj);
    }

    function setValue(el, val) {
        var attr = el.getAttribute('data-cms-attr');
        if (attr) {
            el.setAttribute(attr, val);
        } else {
            el.textContent = val;
        }
    }

    function applyScalars(data) {
        document.querySelectorAll('[data-cms]').forEach(function (el) {
            var path = el.getAttribute('data-cms');
            var val = get(data, path);
            if (val === undefined) return;
            setValue(el, val);
        });
    }

    function applyLists(data) {
        document.querySelectorAll('[data-cms-list]').forEach(function (container) {
            var key = container.getAttribute('data-cms-list');
            var items = get(data, key);
            if (!Array.isArray(items)) return;
            var tpl = container.querySelector('template[data-cms-item]');
            if (!tpl) return;

            // Remove existing rendered items (keep only template)
            Array.from(container.children).forEach(function (child) {
                if (child !== tpl) container.removeChild(child);
            });

            items.forEach(function (item) {
                var clone = tpl.content.cloneNode(true);
                clone.querySelectorAll('[data-cms-field]').forEach(function (el) {
                    var field = el.getAttribute('data-cms-field');
                    var val = item[field];
                    if (val === undefined) return;
                    setValue(el, val);
                });
                // Inserted items should be visible immediately — the page's
                // IntersectionObserver has already finished its initial pass
                // before this JSON fetch resolves, so .reveal items would
                // otherwise stay invisible.
                clone.querySelectorAll('.reveal').forEach(function (el) {
                    el.classList.add('visible');
                });
                container.appendChild(clone);
            });
        });
    }

    function init() {
        fetch('/content/site.json', { cache: 'no-cache' })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                applyScalars(data);
                applyLists(data);
                document.dispatchEvent(new CustomEvent('cms:ready', { detail: data }));
            })
            .catch(function (err) {
                console.warn('CMS: content/site.json not loaded', err);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
