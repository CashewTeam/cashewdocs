// Chinese search: override Lunr tokenizer with CJK bigram support
(function() {
  if (typeof lunr === 'undefined') return;

  var origTokenizer = lunr.tokenizer;
  var cjkRe = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

  lunr.tokenizer = function(obj, metadata) {
    if (obj == null || obj == undefined) return [];
    if (Array.isArray(obj)) return origTokenizer(obj, metadata);

    var str = obj.toString().toLowerCase();
    var len = str.length;
    if (len === 0) return [];

    // No CJK characters: use original tokenizer (English search untouched)
    if (!cjkRe.test(str)) return origTokenizer(obj, metadata);

    // Has CJK: custom bigram tokenization
    var tokens = [];
    var idx = 0;
    var sepRe = lunr.tokenizer.separator || /[\s\-/]+/;

    for (var i = 0; i < len; i++) {
      var ch = str[i];
      if (cjkRe.test(ch)) {
        // Bigram (overlapping 2-char)
        if (i + 1 < len && cjkRe.test(str[i + 1])) {
          var bm = {};
          bm.position = [i, 2];
          bm.index = idx++;
          tokens.push(new lunr.Token(str.substring(i, i + 2), bm));
        }
        // Unigram (single char)
        var um = {};
        um.position = [i, 1];
        um.index = idx++;
        tokens.push(new lunr.Token(ch, um));
      } else if (sepRe.test(ch)) {
        continue;
      } else {
        // Non-CJK, non-separator: accumulate word
        var start = i;
        while (i + 1 < len && !cjkRe.test(str[i + 1]) && !sepRe.test(str[i + 1])) {
          i++;
        }
        var word = str.substring(start, i + 1);
        if (word) {
          var wm = {};
          wm.position = [start, word.length];
          wm.index = idx++;
          tokens.push(new lunr.Token(word, wm));
        }
      }
    }
    return tokens;
  };

  lunr.tokenizer.separator = /[\s\-/]+/;
})();

// TOC: build table of contents from page headings
(function initToc() {
  // Wait for DOM — try theme's onReady, fallback to DOMContentLoaded
  if (typeof jtd !== 'undefined' && jtd.onReady) {
    jtd.onReady(buildToc);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToc);
  } else {
    buildToc();
  }
})();

function buildToc() {
  var tocNav = document.getElementById('toc');
  if (!tocNav) return;

  var tocSidebar = tocNav.closest('.toc-sidebar');
  if (!tocSidebar) return;

  var mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  var minLevel = parseInt(tocSidebar.getAttribute('data-toc-min')) || 2;
  var maxLevel = parseInt(tocSidebar.getAttribute('data-toc-max')) || 4;

  var tags = [];
  for (var i = minLevel; i <= maxLevel; i++) { tags.push('h' + i); }
  var headings = mainContent.querySelectorAll(tags.join(','));
  if (!headings || headings.length === 0) return;

  var root = { el: tocNav, level: minLevel - 1 };
  var stack = [root];

  for (var i = 0; i < headings.length; i++) {
    var heading = headings[i];
    var id = heading.getAttribute('id');
    if (!id) continue;

    var text = heading.textContent.replace(/^\s+|\s+$/g, '');
    if (!text) continue;

    var level = parseInt(heading.tagName.charAt(1));

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.setAttribute('href', '#' + id);
    a.textContent = text;
    li.appendChild(a);

    // Pop stack until we find a parent with level < current
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    var parent = stack[stack.length - 1];
    if (parent.level < level) {
      var lastLi = parent.el.lastElementChild;
      var subUl = null;
      if (lastLi && lastLi.tagName === 'LI') {
        subUl = lastLi.querySelector(':scope > ul');
      }
      if (subUl) {
        stack.push({ el: subUl, level: level });
      } else {
        var ul = document.createElement('ul');
        if (lastLi && lastLi.tagName === 'LI') {
          lastLi.appendChild(ul);
        } else {
          parent.el.appendChild(ul);
        }
        stack.push({ el: ul, level: level });
      }
    }

    stack[stack.length - 1].el.appendChild(li);
  }

  // Flatten single-level wrapper: <nav><ul><li>...</li></ul></nav> → <nav><li>...</li></nav>
  var firstUl = tocNav.querySelector(':scope > ul');
  if (firstUl && !firstUl.querySelector(':scope li > ul')) {
    while (firstUl.firstChild) {
      tocNav.appendChild(firstUl.firstChild);
    }
    tocNav.removeChild(firstUl);
  }

  // Scroll spy
  var tocLinks = tocNav.querySelectorAll('a');
  var activeLink = null;
  var headingIds = [];

  for (var i = 0; i < headings.length; i++) {
    var hid = headings[i].getAttribute('id');
    if (hid) headingIds.push(hid);
  }

  function escapeSel(id) {
    return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  var observer = new IntersectionObserver(function(entries) {
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].isIntersecting) {
        var hitId = entries[j].target.id;
        if (activeLink) activeLink.classList.remove('active');
        var sel = 'a[href="#' + escapeSel(hitId) + '"]';
        activeLink = tocNav.querySelector(sel);
        if (activeLink) {
          activeLink.classList.add('active');
          // Auto-scroll TOC to keep active link visible
          var scroller = tocNav.closest('.toc-sidebar');
          if (scroller) {
            var top = activeLink.offsetTop;
            var st = scroller.scrollTop;
            var sh = scroller.clientHeight;
            if (top < st + 30 || top > st + sh - 30) {
              scroller.scrollTop = top - sh / 3;
            }
          }
        }
      }
    }
  }, {
    rootMargin: '-60px 0px -70% 0px',
    threshold: 0
  });

  for (var i = 0; i < headings.length; i++) {
    if (headings[i].id) observer.observe(headings[i]);
  }
}
