// Chinese search: keep Lunr's English behavior, but preserve CJK tokens
// through both tokenization and the default index/search pipelines.
(function() {
  if (typeof lunr === 'undefined') return;
  if (lunr.__cashewCjkPatched) return;
  lunr.__cashewCjkPatched = true;

  var cjkRe = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  var origTokenizer = lunr.tokenizer;
  var origTrimmer = lunr.trimmer;
  var origStopWordFilter = lunr.stopWordFilter;
  var origStemmer = lunr.stemmer;
  var origAdd = lunr.Builder.prototype.add;

  function hasCjk(str) {
    return cjkRe.test(str);
  }

  function tokenizeCjkRun(tokens, str, allowUnigrams, offset, indexState) {
    if (str.length === 1) {
      tokens.push(new lunr.Token(str, {
        position: [offset, 1],
        index: indexState.value++
      }));
      return;
    }

    for (var i = 0; i < str.length - 1; i++) {
      tokens.push(new lunr.Token(str.substring(i, i + 2), {
        position: [offset + i, 2],
        index: indexState.value++
      }));
    }

    if (!allowUnigrams) return;

    for (var j = 0; j < str.length; j++) {
      tokens.push(new lunr.Token(str[j], {
        position: [offset + j, 1],
        index: indexState.value++
      }));
    }
  }

  function wrapPipeline(fn, label) {
    var wrapped = function(token) {
      var value = token.toString();
      return hasCjk(value) ? token : fn(token);
    };

    lunr.Pipeline.registerFunction(wrapped, label);
    return wrapped;
  }

  lunr.__cashewIndexing = false;
  lunr.Builder.prototype.add = function(doc, attributes) {
    lunr.__cashewIndexing = true;

    try {
      return origAdd.call(this, doc, attributes);
    } finally {
      lunr.__cashewIndexing = false;
    }
  };

  lunr.tokenizer = function(obj, metadata) {
    if (obj == null || obj == undefined) return [];
    if (Array.isArray(obj)) return origTokenizer(obj, metadata);

    var str = obj.toString().toLowerCase();
    if (!hasCjk(str)) return origTokenizer(obj, metadata);

    // Keep unigram tokens while indexing so single-character search still works.
    // During user queries we prefer non-overlapping bigrams for multi-char input,
    // which prevents repeated highlights like "结果结果结果" in result previews.
    var allowUnigrams = lunr.__cashewIndexing || str.length === 1;
    var tokens = [];
    var indexState = { value: 0 };
    var latin = '';
    var sepRe = /[\s\-/]+/;

    function flushLatin() {
      if (!latin) return;

      var latinTokens = origTokenizer(latin, metadata);
      for (var j = 0; j < latinTokens.length; j++) {
        tokens.push(latinTokens[j]);
      }

      latin = '';
    }

    for (var i = 0; i < str.length; i++) {
      var ch = str[i];

      if (cjkRe.test(ch)) {
        flushLatin();

        var runStart = i;
        while (i + 1 < str.length && cjkRe.test(str[i + 1])) {
          i++;
        }

        tokenizeCjkRun(
          tokens,
          str.substring(runStart, i + 1),
          allowUnigrams,
          runStart,
          indexState
        );
      } else if (sepRe.test(ch)) {
        flushLatin();
      } else {
        latin += ch;
      }
    }

    flushLatin();
    return tokens;
  };

  lunr.trimmer = wrapPipeline(origTrimmer, 'cjkTrimmer');
  lunr.stopWordFilter = wrapPipeline(origStopWordFilter, 'cjkStopWordFilter');
  lunr.stemmer = wrapPipeline(origStemmer, 'cjkStemmer');
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
