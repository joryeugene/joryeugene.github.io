(function () {
  'use strict';

  const projectDepthCases = {
    'phalene-vim': {
      name: 'Phalene-Vim',
      panels: {
        demo: '<h3>Open the working editor</h3><p>Use motions, macros, search, undo, registers, the command palette, and the built-in tutor without installing anything.</p><p class="proof-line"><a href="/vim/">Try Phalene-Vim</a></p>',
        system: '<div class="system-path" aria-label="Phalene-Vim system cross-section"><div class="system-node"><strong>Browser</strong>keyboard, pointer, responsive viewport</div><span aria-hidden="true">to</span><div class="system-node is-core"><strong>Phalene-Vim</strong>editor state and command model</div><span aria-hidden="true">to</span><div class="system-node"><strong>Vim behavior</strong>motions, registers, macros</div></div><p class="proof-line">The interface is a working editor, not a dashboard mockup.</p>',
        decisions: '<h3>Make the browser obey Vim before decorating it.</h3><p>Normal, insert, visual, and command modes share one interaction model. Discoverability comes from the tutor and command palette instead of weakening the Vim controls.</p>',
        proof: '<h3>Exercise the real loop</h3><p>Motions, macros, search, undo, command history, simultaneous navigation keys, mobile input, and the tutor are covered by browser interaction tests.</p><p class="proof-line"><a href="/vim/">Open the tested editor</a></p>'
      }
    },
    'dadbod-grip': {
      name: 'dadbod-grip.nvim',
      panels: {
        demo: '<h3>Open the working tool</h3><p>Browse a schema, edit rows with Vim motions, preview the SQL, then apply the change in one transaction.</p><p class="proof-line"><a href="https://github.com/joryeugene/dadbod-grip.nvim">View source and installation</a></p>',
        system: '<div class="system-path" aria-label="Dadbod Grip system cross-section"><div class="system-node"><strong>PostgreSQL</strong>tables, views, indexes</div><span aria-hidden="true">to</span><div class="system-node is-core"><strong>dadbod-grip.nvim</strong>staging and SQL preview</div><span aria-hidden="true">to</span><div class="system-node"><strong>Vim</strong>buffers, diffs, motions</div></div><p class="proof-line">The plugin applies every staged change in one transaction.</p>',
        decisions: '<h3>Keep the work inside the editor.</h3><p>The database remains the source of truth. Vim supplies the interaction model. Existing tools handle connections instead of a new database layer.</p>',
        proof: '<h3>Inspectable before execution</h3><p>Every staged mutation becomes visible SQL. The final apply runs atomically, with staged changes and SQL preview covered by the repository tests.</p><p class="proof-line"><a href="https://jorypestorious.com/dadbod-grip-web/">Open the walkthrough</a></p>'
      }
    },
    georgie: {
      name: 'Georgie',
      panels: {
        demo: '<h3>Meet the actual Codex pet</h3><p>Georgie stays at the edge of Codex as a quiet focus buddy and offers a small paw when a task needs attention.</p><p class="proof-line"><a href="https://github.com/joryeugene/georgie-phalene-codex-pet">View Georgie and installation</a></p>',
        system: '<div class="system-path" aria-label="Georgie system cross-section"><div class="system-node"><strong>Codex</strong>task and attention states</div><span aria-hidden="true">to</span><div class="system-node is-core"><strong>Georgie</strong>versioned sprite atlas</div><span aria-hidden="true">to</span><div class="system-node"><strong>Pet motion</strong>idle, working, check-in</div></div><p class="proof-line">One cohesive animation package drives every visible state.</p>',
        decisions: '<h3>Signal softly instead of demanding attention.</h3><p>Georgie stays calm during focused work. The animation uses a small paw lift instead of a loud alert or constant motion.</p>',
        proof: '<h3>A raised paw has one meaning</h3><p>His tail moves while Codex works; one raised paw means Codex needs me. The sprite matrix, timing, baseline, and packaging checks are validated in the pet repository.</p><p class="proof-line"><a href="https://github.com/joryeugene/georgie-phalene-codex-pet">Inspect the pet source</a></p>'
      }
    }
  };

  const processCases = {
    'dadbod-grip': {
      title: 'How dadbod-grip.nvim stays inspectable',
      kicker: 'Case: dadbod-grip.nvim',
      layers: {
        brief: '<h2>Edit database tables without leaving Vim.</h2><p>The core job is preserving editor flow while making mutations reviewable before execution.</p>',
        constraints: '<h2>Keep existing connection and query tools.</h2><p>Vim provides the interaction model. Dadbod owns connections. The database remains authoritative.</p>',
        changes: '<h2>Keep each mutation inspectable.</h2><pre class="code-window" aria-label="Example staged SQL change"><code><span class="remove">- ALTER TABLE users ADD last_seen_at TIMESTAMP;</span>\n<span class="add">+ ALTER TABLE users ADD last_seen_at TIMESTAMPTZ;</span>\n<span class="add">+ CREATE INDEX idx_users_last_seen_at</span>\n<span class="add">+   ON users (last_seen_at DESC);</span></code></pre><div class="decision-note"><strong>Decision</strong>Keep changes staged until the SQL is reviewable.</div><div class="proof-strip"><span>Staged changes</span><span>SQL preview</span><span>Single transaction</span></div>',
        tests: '<h2>Test the mutation workflow.</h2><p>Preview the SQL before execution. Apply staged mutations inside one transaction. Verify database state after commit and rollback.</p><div class="proof-strip"><span>Preview</span><span>Apply</span><span>Verify state</span></div>',
        visual: '<h2>Inspect the real interface.</h2><p>Tables, diffs, floating SQL previews, focus order, and empty states are checked in Neovim. Screenshots support the review but do not replace interaction.</p>'
      },
      wrongTurns: [['Separate desktop app', 'It breaks editor flow and adds another interface to install, learn, and maintain.'], ['Custom database layer', 'It rebuilds reliable connection and query behavior that existing tools already provide.']]
    },
    'totally-reliable': {
      title: 'How Totally Reliable kept physics playful online',
      kicker: 'Case: Totally Reliable Delivery Service',
      layers: {
        brief: '<h2>Keep a physics sandbox responsive in multiplayer.</h2><p>The job was to preserve the game\'s ragdoll chaos while players shared the same world across console, PC, and mobile.</p>',
        constraints: '<h2>Support unpredictable objects and uneven networks.</h2><p>Players, vehicles, joints, and physics objects all interact. The backend had to carry those interactions across real network conditions and different platforms.</p>',
        changes: '<h2>Build networking around the game feel.</h2><p>The networked backend treated local responsiveness and shared state as simultaneous requirements instead of forcing the simulation into a rigid product model.</p><div class="decision-note"><strong>Decision</strong>Protect the playful physics while making the world legible to every player.</div>',
        tests: '<h2>Test the collisions people actually create.</h2><p>Multiplayer sessions exercise ragdolls, vehicles, jointed objects, reconnects, and cross-platform behavior under network conditions.</p><div class="proof-strip"><span>Physics</span><span>Multiplayer</span><span>Cross-platform</span></div>',
        visual: '<h2>Watch whether the chaos still feels responsive.</h2><p>Logs can confirm state transfer. Play sessions reveal whether collisions, vehicles, and ragdolls still feel immediate.</p>'
      },
      wrongTurns: [['Desktop-only assumptions', 'The shipped game had to serve console, PC, and mobile rather than optimizing around one input or hardware profile.'], ['Networking that dictates the fun', 'A rigid synchronization model would make the physics easier to reason about while removing the behavior players came for.']]
    },
    theosis: {
      title: 'How Theosis serves native and web without one dragging the other down',
      kicker: 'Case: Theosis',
      layers: {
        brief: '<h2>Make daily prayer calm on a phone and fast on the public web.</h2><p>The same product needs full offline native behavior and a public web experience that opens quickly on any screen.</p>',
        constraints: '<h2>Keep native offline and remove web startup costs.</h2><p>Native keeps bundled SQLite and offline use. Web must avoid database and WASM startup while preserving the liturgical folio and long-form reading experience.</p>',
        changes: '<h2>Ship immutable route-sized data on the web.</h2><p>The public build emits daily and Bible data as generated assets, defers heavy reference routes, and caps the gzip entry at 650 KB.</p><div class="decision-note"><strong>Decision</strong>Share the product model without forcing both platforms through one startup path.</div>',
        tests: '<h2>Make performance budgets fail the build.</h2><p>Checks reject database or WASM leakage, oversized route shards, an entry above 650 KB gzip, missing SPA fallback, and broken content routes.</p><div class="proof-strip"><span>Bundle budget</span><span>Route data</span><span>Content integrity</span></div>',
        visual: '<h2>Read the folio at real phone and desktop widths.</h2><p>Daily prayers, long readings, Bible anchors, search, and navigation are inspected for overflow, clipped text, and console errors.</p>'
      },
      wrongTurns: [['One heavyweight bundle everywhere', 'It would preserve implementation symmetry while making the public web pay the native offline startup cost.'], ['A runtime database for deterministic web content', 'The public routes can ship immutable generated data without adding database and WASM startup to every visit.']]
    },
    workhelix: {
      title: 'How Workhelix moved from Bubble to a production platform used through Series A',
      kicker: 'Workhelix · pre-seed to Series A',
      layers: {
        brief: '<h2>Replace the Bubble.io prototype while the product kept moving.</h2><p>I joined Workhelix pre-seed as the sole frontend engineer. The React and TypeScript application that replaced the prototype remained the production product through Series A.</p>',
        constraints: '<h2>The rebuild crossed frontend, backend, data, and infrastructure.</h2><p>The product depended on FastAPI services, SQLAlchemy and PostgreSQL performance, tenant boundaries, production data migrations, AWS infrastructure, release workflows, analytics, admin tools, and assessment results.</p>',
        changes: '<h2>Expand the production stack after replacing the prototype.</h2><p>I took substantial ownership of the Python and FastAPI backend, database performance and migrations, AWS and Terraform, OAuth, WorkOS SSO, JWT, multi-tenant isolation, analytics, admin tools, and interactive assessment views.</p><div class="decision-note"><strong>Scope</strong>React and TypeScript, FastAPI and PostgreSQL, AWS and Terraform, authentication, analytics, and admin tools.</div><div class="proof-strip"><span>React + TypeScript</span><span>FastAPI + PostgreSQL</span><span>AWS + Terraform</span></div>',
        tests: '<h2>Build review, release, and security checks into delivery.</h2><p>I built GitHub Actions and agent workflows for code review and releases, then implemented engineering controls that supported SOC 2 Type II. Authentication covered OAuth, WorkOS SSO, JWT, and multi-tenant isolation.</p><div class="proof-strip"><span>Review</span><span>Release</span><span>Tenant isolation</span></div>',
        visual: '<h2>Turn production data into product views.</h2><p>I delivered analytics, admin tools, and interactive assessment-result views so the product could expose dense data through interfaces people could use.</p>'
      },
      sidebarTitle: 'Scope of ownership',
      wrongTurns: [['Production adoption', 'The React and TypeScript application replaced Bubble.io and remained in production through Series A.'], ['Backend and data', 'The work expanded into FastAPI, SQLAlchemy and PostgreSQL performance, and production data migrations.'], ['Delivery and trust', 'AWS, Terraform, GitHub Actions, agent workflows, authentication, tenant isolation, and SOC 2 controls became part of the same ownership path.']]
    }
  };

  function shouldSelectOnHover(event) {
    return event.pointerType === 'mouse' && !window.matchMedia('(max-width: 760px)').matches;
  }

  function initializeDepthTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-depth-tab]'));
    if (!tabs.length) return;

    function selectTab(tab) {
      const panelId = tab.getAttribute('aria-controls');
      tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      document.querySelectorAll('[data-depth-panel]').forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('pointerenter', (event) => {
        if (shouldSelectOnHover(event)) selectTab(tab);
      });
      tab.addEventListener('focus', () => selectTab(tab));
      tab.addEventListener('click', () => selectTab(tab));
    });
  }

  function initializeProjectDepth() {
    const drawer = document.getElementById('project-depth');
    const buttons = Array.from(document.querySelectorAll('[data-project-inspect]'));
    const cards = Array.from(document.querySelectorAll('[data-project-card]'));
    const name = drawer?.querySelector('[data-depth-project-name]');
    const tablist = drawer?.querySelector('.depth-tabs');
    if (!drawer || !buttons.length || !cards.length || !name) return;

    let pinnedKey = buttons.find((button) => button.getAttribute('aria-expanded') === 'true')?.dataset.projectInspect || 'dadbod-grip';
    let renderedKey = '';

    function selectProject(key, { shouldScroll = false, shouldPin = false } = {}) {
      const project = projectDepthCases[key];
      if (!project) return;
      if (shouldPin) pinnedKey = key;

      const activePanelId = drawer.querySelector('[data-depth-tab][aria-selected="true"]')?.getAttribute('aria-controls') || 'depth-system';

      cards.forEach((card) => {
        card.classList.toggle('is-selected', card.dataset.projectCard === key);
      });
      buttons.forEach((button) => {
        button.setAttribute('aria-expanded', String(button.dataset.projectInspect === key));
      });
      name.textContent = project.name;
      drawer.dataset.project = key;
      if (tablist) tablist.setAttribute('aria-label', `${project.name} project layers`);

      Object.entries(project.panels).forEach(([panelName, content]) => {
        const panel = document.getElementById(`depth-${panelName}`);
        if (panel) panel.innerHTML = content;
      });

      document.querySelectorAll('[data-depth-tab]').forEach((tab) => {
        const selected = tab.getAttribute('aria-controls') === activePanelId;
        tab.setAttribute('aria-selected', String(selected));
      });
      document.querySelectorAll('[data-depth-panel]').forEach((panel) => {
        panel.hidden = panel.id !== activePanelId;
      });

      if (renderedKey && renderedKey !== key && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const activePanel = document.getElementById(activePanelId);
        activePanel?.classList.remove('is-refreshing');
        if (activePanel) {
          void activePanel.offsetWidth;
          activePanel.classList.add('is-refreshing');
          activePanel.addEventListener('animationend', () => activePanel.classList.remove('is-refreshing'), { once: true });
        }
      }
      renderedKey = key;

      if (shouldScroll) {
        drawer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    }

    cards.forEach((card) => {
      const key = card.dataset.projectCard;
      card.addEventListener('pointerenter', (event) => {
        if (shouldSelectOnHover(event)) selectProject(key, { shouldPin: true });
      });
      card.addEventListener('focusin', () => selectProject(key, { shouldPin: true }));
    });

    buttons.forEach((button) => button.addEventListener('click', () => {
      selectProject(button.dataset.projectInspect, { shouldScroll: true, shouldPin: true });
    }));
    selectProject(pinnedKey);
  }

  function initializeProcessLayers() {
    const buttons = Array.from(document.querySelectorAll('[data-layer-button]'));
    if (!buttons.length) return;

    function selectLayer(button) {
      const panelId = button.getAttribute('aria-controls');
      buttons.forEach((item) => item.setAttribute('aria-selected', String(item === button)));
      document.querySelectorAll('[data-layer-content]').forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
    }

    buttons.forEach((button) => {
      button.addEventListener('pointerenter', (event) => {
        if (shouldSelectOnHover(event)) selectLayer(button);
      });
      button.addEventListener('focus', () => selectLayer(button));
      button.addEventListener('click', () => selectLayer(button));
    });
  }

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
      palette.hidden = false;
      document.body.style.overflow = 'hidden';
      commands?.open(palette);
    }

    function closePalette() {
      palette.hidden = true;
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
        palette.hidden ? openPalette() : closePalette();
        return;
      }

      if (!palette.hidden && event.key === 'Escape') {
        event.preventDefault();
        closePalette();
        return;
      }

      if (!palette.hidden) commands?.handleKeydown(palette, event);
    }, true);
  }

  function initializeWritingIndex() {
    const search = document.getElementById('writing-search');
    const counter = document.getElementById('writing-counter');
    const showAll = document.getElementById('show-all-writing');
    const featured = document.querySelector('.writing-feature');
    const featuredLink = featured?.querySelector('a[href]');
    const rows = Array.from(document.querySelectorAll('.writing-row'));
    if (!search || !rows.length) return;

    const collapsedLimit = 7;
    let expanded = false;
    let selectedIndex = -1;

    function visibleTargets() {
      const targets = rows.filter((row) => !row.hidden);
      if (featuredLink && !search.value.trim()) targets.unshift(featuredLink);
      return targets;
    }

    function setSelected(index) {
      const visible = visibleTargets();
      if (!visible.length) return;
      selectedIndex = Math.max(0, Math.min(index, visible.length - 1));
      rows.forEach((row) => row.classList.remove('is-selected'));
      const target = visible[selectedIndex];
      featured?.classList.toggle('is-selected', target === featuredLink);
      target.closest('.writing-row')?.classList.add('is-selected');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'nearest' });
      counter.textContent = `${selectedIndex + 1} / ${visible.length}`;
    }

    function filterRows() {
      const query = search.value.trim().toLowerCase();
      let matches = 0;

      rows.forEach((row, index) => {
        const matchesQuery = !query || row.textContent.toLowerCase().includes(query);
        const withinCollapsedSet = expanded || query || index < collapsedLimit;
        row.hidden = !(matchesQuery && withinCollapsedSet);
        if (!row.hidden) matches += 1;
        row.classList.remove('is-selected');
      });

      selectedIndex = -1;
      featured?.classList.remove('is-selected');
      const targetCount = matches + (featuredLink && !query ? 1 : 0);
      counter.textContent = targetCount ? `1 / ${targetCount}` : '0 / 0';
      if (showAll) {
        showAll.hidden = Boolean(query) || expanded || rows.length <= collapsedLimit;
      }
    }

    search.addEventListener('input', filterRows);
    showAll?.addEventListener('click', () => {
      expanded = true;
      filterRows();
      showAll.hidden = true;
    });

    document.addEventListener('keydown', (event) => {
      if (document.activeElement === search) {
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
        else setSelected(selectedIndex <= 0 ? visibleCount - 1 : selectedIndex - 1);
        return;
      }

      if (event.key === 'Enter' && selectedIndex >= 0) {
        const visible = visibleTargets();
        visible[selectedIndex]?.click();
      }
    }, true);

    filterRows();
  }

  function initializePageKeyboardShortcuts() {
    const isBlocked = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return true;
      if (!document.getElementById('command-palette')?.hidden) return true;
      const target = event.target;
      return target instanceof HTMLElement
        && (target.matches('input, textarea, select') || target.isContentEditable);
    };

    if (document.body.classList.contains('page-writing')) return;

    const visibleMainActions = () => Array.from(document.querySelectorAll('main a[href], main button:not([disabled])'))
      .filter((element) => element.offsetParent !== null && getComputedStyle(element).visibility !== 'hidden');

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
        window.clearTimeout(tapTimer);
        egg.classList.add('is-georgie-active');
        surface.classList.add('is-georgie-active');
        if (surface.classList.contains('contact-grid')) surface.classList.add('is-georgie-press');
      };
      const release = () => {
        egg.classList.remove('is-georgie-active');
        surface.classList.remove('is-georgie-active', 'is-georgie-press');
      };
      const play = () => {
        activate();
        tapTimer = window.setTimeout(release, 720);
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

    function renderProcessCase(key) {
      const processCase = processCases[key];
      if (!processCase) return;
      document.querySelector('[data-process-deep-title]').textContent = processCase.title;
      document.querySelector('[data-process-kicker]').textContent = processCase.kicker;
      Object.entries(processCase.layers).forEach(([layerName, content]) => {
        const layer = document.getElementById(`layer-${layerName}`);
        if (layer) layer.innerHTML = content;
      });

      const wrongTurns = document.querySelector('.wrong-turns');
      if (wrongTurns) {
        wrongTurns.dataset.activeCase = key;
        wrongTurns.innerHTML = `<h2 id="wrong-turns-title">${processCase.sidebarTitle || 'Rejected approaches'}</h2>${processCase.wrongTurns.map(([title, body]) => `<article class="wrong-turn"><h3>${title}</h3><p>${body}</p></article>`).join('')}`;
      }

      document.querySelectorAll('[data-layer-button]').forEach((button) => {
        button.setAttribute('aria-selected', String(button.getAttribute('aria-controls') === 'layer-changes'));
      });
      document.querySelectorAll('[data-layer-content]').forEach((panel) => {
        panel.hidden = panel.id !== 'layer-changes';
      });
    }

    function selectCase(tab, updateHash = false) {
      tabs.forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      const panelId = tab.getAttribute('aria-controls');
      document.querySelectorAll('[data-case-panel]').forEach((panel) => {
        panel.hidden = panel.id !== panelId;
      });
      renderProcessCase(tab.dataset.caseHash);
      if (updateHash) {
        const hash = tab.dataset.caseHash;
        if (hash) history.replaceState(null, '', `#${hash}`);
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener('pointerenter', (event) => {
        if (shouldSelectOnHover(event)) selectCase(tab);
      });
      tab.addEventListener('focus', () => selectCase(tab));
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        selectCase(tab, true);
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

  function init() {
    initializeDepthTabs();
    initializeProjectDepth();
    initializeProcessLayers();
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
