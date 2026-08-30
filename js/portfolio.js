(function () {
  'use strict';

  function initializeCommandPalette() {
    const palette = document.getElementById('command-palette');
    const openButtons = Array.from(document.querySelectorAll('[data-open-palette]'));
    const closeButton = document.querySelector('[data-close-palette]');
    if (!palette) return;
    const commands = window.BlogCommon?.SiteCommandPalette;
    commands?.mount(palette, 'portfolio-command-search');

    let previousFocus = null;

    function openPalette() {
      previousFocus = document.activeElement;
      if (!palette.open) palette.showModal();
      document.body.style.overflow = 'hidden';
      commands?.open(palette);
    }

    function closePalette() {
      if (palette.open) palette.close();
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    }

    openButtons.forEach((button) => button.addEventListener('click', openPalette));
    closeButton?.addEventListener('click', closePalette);
    palette.addEventListener('click', (event) => {
      if (event.target === palette) closePalette();
    });

    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        palette.open ? closePalette() : openPalette();
        return;
      }

      if (palette.open && event.key === 'Escape') {
        event.preventDefault();
        closePalette();
        return;
      }

      if (palette.open) commands?.handleKeydown(palette, event);
    }, true);
  }

  function initializeWritingIndex() {
    const search = document.getElementById('writing-search');
    const counter = document.getElementById('writing-counter');
    const showAll = document.getElementById('show-all-writing');
    const emptyState = document.getElementById('writing-empty');
    const featured = document.querySelector('.writing-feature');
    const featuredLink = featured?.querySelector('.writing-feature__link');
    const rows = Array.from(document.querySelectorAll('.writing-row'));
    if (!search || !rows.length) return;

    const collapsedLimit = 7;
    const totalCount = rows.length + (featuredLink ? 1 : 0);
    let expanded = false;
    let selectedIndex = -1;

    document.querySelectorAll('[data-pub-date]').forEach((entry) => {
      if (entry.querySelector('time')) return;
      const date = entry.dataset.pubDate;
      const title = entry.querySelector('.writing-row__title');
      const eyebrow = entry.querySelector('.writing-feature__copy .eyebrow');
      if (!date || (!title && !eyebrow)) return;
      const time = document.createElement('time');
      time.className = title ? 'writing-row__date' : 'writing-feature__date';
      time.dateTime = date;
      time.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
      if (title) title.insertAdjacentElement('afterend', time);
      else {
        eyebrow.append(' · ');
        eyebrow.append(time);
      }
    });

    function visibleTargets() {
      const targets = rows.filter((row) => !row.hidden);
      if (featuredLink && !featured.hidden) targets.unshift(featuredLink);
      if (showAll && !showAll.hidden) targets.push(showAll);
      return targets;
    }

    function setSelected(index) {
      const visible = visibleTargets();
      if (!visible.length) return;
      selectedIndex = (index + visible.length) % visible.length;
      rows.forEach((row) => row.classList.remove('is-selected'));
      const target = visible[selectedIndex];
      featured?.classList.toggle('is-selected', target === featuredLink);
      target.closest('.writing-row')?.classList.add('is-selected');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'nearest' });
    }

    function filterRows() {
      const query = search.value.trim().toLowerCase();
      const featuredMatches = Boolean(featuredLink && (!query || featured.textContent.toLowerCase().includes(query)));
      let rowMatches = 0;
      let shownRows = 0;

      rows.forEach((row, index) => {
        const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
        const withinCollapsedSet = expanded || query || index < collapsedLimit;
        row.hidden = !(matchesQuery && withinCollapsedSet);
        if (matchesQuery) rowMatches += 1;
        if (!row.hidden) shownRows += 1;
        row.classList.remove('is-selected');
      });

      if (featured) featured.hidden = !featuredMatches;
      selectedIndex = -1;
      featured?.classList.remove('is-selected');
      const resultCount = rowMatches + (featuredMatches ? 1 : 0);
      const shownCount = shownRows + (featuredMatches ? 1 : 0);
      counter.textContent = query
        ? `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
        : `${shownCount} shown · ${totalCount} total`;
      if (emptyState) emptyState.hidden = resultCount > 0;
      if (showAll) {
        showAll.hidden = Boolean(query) || expanded || rows.length <= collapsedLimit;
        showAll.textContent = `Show ${rows.length - collapsedLimit} more essays`;
        showAll.setAttribute('aria-expanded', String(expanded));
      }
    }

    search.addEventListener('input', filterRows);
    showAll?.addEventListener('click', () => {
      const firstHidden = rows.find((row) => row.hidden);
      expanded = true;
      filterRows();
      selectedIndex = visibleTargets().indexOf(firstHidden);
      firstHidden?.classList.add('is-selected');
      firstHidden?.focus({ preventScroll: true });
      firstHidden?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

    document.addEventListener('keydown', (event) => {
      if (document.activeElement === search) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelected(0);
          return;
        }
        if (event.key === 'Enter') {
          const visible = visibleTargets();
          if (visible.length) {
            event.preventDefault();
            visible[0].click();
          }
          return;
        }
        if (event.key === 'Escape') {
          search.blur();
          search.value = '';
          filterRows();
        }
        return;
      }

      if (event.key === '/') {
        event.preventDefault();
        search.focus();
        return;
      }

      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        const visibleCount = visibleTargets().length;
        if (!visibleCount) return;
        if (event.key === 'j') setSelected(selectedIndex + 1);
        else setSelected(selectedIndex < 0 ? visibleCount - 1 : selectedIndex - 1);
        return;
      }

      if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        const visible = visibleTargets();
        visible[selectedIndex]?.click();
      }
    }, true);

    filterRows();
  }

  function initializePageKeyboardShortcuts() {
    const isBlocked = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return true;
      if (document.getElementById('command-palette')?.open) return true;
      const target = event.target;
      return target instanceof HTMLElement
        && (target.matches('input, textarea, select') || target.isContentEditable);
    };

    if (document.body.classList.contains('page-writing')) return;

    const visibleMainActions = () => Array.from(document.querySelectorAll('main a[href], main button:not([disabled])'))
      .filter((element) => !element.matches('[data-georgie-egg]')
        && element.offsetParent !== null
        && getComputedStyle(element).visibility !== 'hidden');

    document.addEventListener('keydown', (event) => {
      if (isBlocked(event) || !['j', 'k'].includes(event.key)) return;
      const actions = visibleMainActions();
      if (!actions.length) return;
      event.preventDefault();
      const current = actions.indexOf(document.activeElement);
      const next = event.key === 'j'
        ? (current + 1 + actions.length) % actions.length
        : (current < 0 ? actions.length - 1 : (current - 1 + actions.length) % actions.length);
      actions[next].focus({ preventScroll: true });
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      actions[next].scrollIntoView({ block: 'nearest', behavior });
    }, true);
  }

  function initializeParallax() {
    const background = document.getElementById('portfolio-bg');
    if (!background) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function render() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      background.style.setProperty('--bg-x', `${currentX.toFixed(2)}px`);
      background.style.setProperty('--bg-y', `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) < 0.04) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(render);
    }

    function start() {
      if (!frame) frame = requestAnimationFrame(render);
    }

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      targetX = ((event.clientX / window.innerWidth) - 0.5) * -8;
      targetY = ((event.clientY / window.innerHeight) - 0.5) * -6;
      start();
    }, { passive: true });

    window.addEventListener('pointerout', (event) => {
      if (event.relatedTarget) return;
      targetX = 0;
      targetY = 0;
      start();
    }, { passive: true });
  }

  function initializeGeorgieEggs() {
    document.querySelectorAll('[data-georgie-egg]').forEach((egg) => {
      const surface = egg.closest('[data-georgie-surface]');
      if (!surface) return;
      const triggers = surface.matches('[data-georgie-trigger]')
        ? [surface]
        : [egg, ...surface.querySelectorAll('[data-georgie-trigger]')];
      let tapTimer = 0;

      const activate = () => {
        if (tapTimer) return;
        egg.classList.add('is-georgie-active');
        surface.classList.add('is-georgie-active');
        if (surface.classList.contains('contact-grid')) surface.classList.add('is-georgie-press');
      };
      const release = () => {
        window.clearTimeout(tapTimer);
        tapTimer = 0;
        egg.classList.remove('is-georgie-active');
        surface.classList.remove('is-georgie-active', 'is-georgie-press');
      };
      const play = () => {
        window.clearTimeout(tapTimer);
        tapTimer = 0;
        activate();
        tapTimer = window.setTimeout(() => {
          egg.classList.remove('is-georgie-active');
          surface.classList.remove('is-georgie-active', 'is-georgie-press');
        }, 720);
      };

      triggers.forEach((trigger) => {
        trigger.addEventListener('pointerenter', activate);
        trigger.addEventListener('pointerleave', release);
        trigger.addEventListener('focusin', activate);
        trigger.addEventListener('focusout', release);
        trigger.addEventListener('pointerdown', activate);
        trigger.addEventListener('pointercancel', release);
      });
      egg.addEventListener('click', (event) => {
        event.stopPropagation();
        play();
      });
      triggers.filter((trigger) => trigger !== egg).forEach((trigger) => {
        trigger.addEventListener('pointerup', () => {
          if (window.matchMedia('(pointer: coarse)').matches) play();
        });
      });
    });
  }

  function initializeCaseTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-case-tab]'));
    if (!tabs.length) return;

    function selectCase(tab, updateHash = false) {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      const panelId = tab.getAttribute('aria-controls');
      document.querySelectorAll('[data-case-panel]').forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
      if (updateHash) {
        const hash = tab.dataset.caseHash;
        if (hash) history.replaceState(null, '', `#${hash}`);
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        selectCase(tab, true);
      });
      tab.addEventListener('keydown', (event) => {
        const currentIndex = tabs.indexOf(tab);
        let nextIndex = null;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        const nextTab = tabs[nextIndex];
        selectCase(nextTab, true);
        nextTab.focus();
      });
    });

    const requested = window.location.hash.replace('#', '');
    const aliases = {
      'dadbod-grip': 'case-dadbod',
      'totally-reliable': 'case-totally-reliable',
      theosis: 'case-theosis',
      workhelix: 'case-workhelix'
    };
    const requestedPanel = aliases[requested];
    const requestedTab = tabs.find((tab) => tab.getAttribute('aria-controls') === requestedPanel);
    selectCase(requestedTab || tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  }

  function initializeCopyrightYears() {
    const currentYear = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach((year) => {
      year.textContent = currentYear;
      year.setAttribute('datetime', currentYear);
    });
  }

  function init() {
    initializeCopyrightYears();
    initializeCommandPalette();
    initializeWritingIndex();
    initializePageKeyboardShortcuts();
    initializeParallax();
    initializeGeorgieEggs();
    initializeCaseTabs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
