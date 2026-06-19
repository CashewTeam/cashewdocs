(function() {
  var tocNav = document.getElementById('toc');
  if (!tocNav) return;

  var tocSidebar = tocNav.closest('.toc-sidebar');
  var mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  var minLevel = parseInt(tocSidebar.getAttribute('data-toc-min')) || 2;
  var maxLevel = parseInt(tocSidebar.getAttribute('data-toc-max')) || 4;

  var selector = [];
  for (var i = minLevel; i <= maxLevel; i++) {
    selector.push('h' + i);
  }
  var headings = mainContent.querySelectorAll(selector.join(','));
  if (headings.length === 0) return;

  var stack = [{ el: tocNav, level: minLevel - 1 }];

  headings.forEach(function(heading) {
    var level = parseInt(heading.tagName.charAt(1));
    var id = heading.id;
    if (!id) return;

    var text = heading.textContent.trim();
    if (!text) return;

    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = text;
    li.appendChild(a);

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    if (stack.length === 0) {
      stack.push({ el: tocNav, level: minLevel - 1 });
    }

    if (stack[stack.length - 1].level < level) {
      var parentEl = stack[stack.length - 1].el;
      var lastLi = parentEl.lastElementChild;
      var existingUl = lastLi ? lastLi.querySelector(':scope > ul') : null;
      if (existingUl) {
        stack.push({ el: existingUl, level: level });
      } else {
        var ul = document.createElement('ul');
        if (lastLi && lastLi.tagName === 'LI') {
          lastLi.appendChild(ul);
        } else {
          parentEl.appendChild(ul);
        }
        stack.push({ el: ul, level: level });
      }
    }

    stack[stack.length - 1].el.appendChild(li);
  });

  // Remove empty initial ul wrapper if only one level of headings
  var firstUl = tocNav.querySelector('ul');
  if (firstUl && tocNav.children.length === 1 && tocNav.firstElementChild === firstUl) {
    if (!firstUl.querySelector('ul')) {
      while (firstUl.firstChild) {
        tocNav.appendChild(firstUl.firstChild);
      }
      tocNav.removeChild(firstUl);
    }
  }

  var activeLink = null;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.id;
        if (activeLink) {
          activeLink.classList.remove('active');
        }
        activeLink = tocNav.querySelector('a[href="#' + CSS.escape(id) + '"]');
        if (activeLink) {
          activeLink.classList.add('active');
          var sticky = tocNav.closest('.toc-sticky');
          if (sticky) {
            var linkTop = activeLink.offsetTop;
            var stickyTop = sticky.scrollTop;
            var stickyHeight = sticky.clientHeight;
            if (linkTop < stickyTop || linkTop > stickyTop + stickyHeight) {
              sticky.scrollTop = linkTop - stickyHeight / 3;
            }
          }
        }
      }
    });
  }, {
    rootMargin: '-64px 0px -70% 0px',
    threshold: 0
  });

  headings.forEach(function(h) {
    if (h.id) observer.observe(h);
  });
})();
