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
        demo: '<h3>Open the working tool</h3><p>Edit tables, inspect generated SQL, query files, and join data across databases through DuckDB.</p><p class="proof-line"><a href="https://jorypestorious.com/dadbod-grip-web/">Open the walkthrough</a> · <a href="https://github.com/joryeugene/dadbod-grip.nvim">View source</a></p>',
        system: '<div class="system-path system-path--four" aria-label="Dadbod Grip system cross-section"><div class="system-node"><strong>Sources</strong><span class="system-detail system-detail--wide">PostgreSQL · MySQL · SQLite · MotherDuck · local files/HTTPS</span><span class="system-detail system-detail--compact">4 databases · files/HTTPS</span></div><span aria-hidden="true">to</span><div class="system-node"><strong>DuckDB hub</strong><span class="system-detail system-detail--wide">attach databases · scan files · cross-source joins</span><span class="system-detail system-detail--compact">attach · scan · cross-source JOIN</span></div><span aria-hidden="true">to</span><div class="system-node is-core"><strong>Dadbod Grip</strong><span class="system-detail system-detail--wide">edit grids · preview SQL · transaction script · compensating undo</span><span class="system-detail system-detail--compact">edit · preview SQL · apply · best-effort undo</span></div><span aria-hidden="true">to</span><div class="system-node"><strong>Neovim analysis</strong><span class="system-detail system-detail--wide">schemas/FKs · notebooks · profiling · Query Doctor · four AI providers</span><span class="system-detail system-detail--compact">schema · profile · notebook · AI SQL</span></div></div><p class="proof-line"><span class="system-detail system-detail--wide">One query can join attached PostgreSQL data with a local or HTTPS Parquet file. Direct-table edits use the same statement builders for preview and execution. After a CLI error, inspect database state before retrying because an earlier statement may have committed.</span><span class="system-detail system-detail--compact">JOIN PostgreSQL to Parquet. Preview SQL. Inspect state after an apply error.</span></p>',
        decisions: '<h3>Keep the data work inside Neovim.</h3><p>Dadbod handles connections, DuckDB federates sources, and the underlying database stays authoritative. The plugin adds the editing and analysis workflows between them.</p>',
        proof: '<h3>Test the database workbench</h3><p>The test matrix covers edits, generated SQL, query files, and regression paths on Neovim stable and 0.10.</p><p class="proof-line"><a href="/blog/dadbod-grip/">Read the build story</a> · <a href="https://github.com/joryeugene/dadbod-grip.nvim">View source</a></p>'
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
      title: 'How Dadbod Grip turns Neovim into a data workbench',
      kicker: 'Case: dadbod-grip.nvim',
      layers: {
        brief: '<h2>Edit, query, and analyze data without leaving Neovim.</h2><p>Dadbod Grip adds editable grids, generated SQL previews, cross-database queries, schema navigation, profiling, notebooks, and schema-aware AI to the editor.</p>',
        constraints: '<h2>Keep the database and existing connection tools authoritative.</h2><p>Dadbod manages connections. DuckDB joins databases and files. Dadbod Grip adds workflows without hiding the SQL or replacing either system.</p>',
        changes: '<h2>Make edits and federation inspectable.</h2><pre class="code-window" aria-label="Example staged SQL change"><code><span class="remove">- ALTER TABLE users ADD last_seen_at TIMESTAMP;</span>\n<span class="add">+ ALTER TABLE users ADD last_seen_at TIMESTAMPTZ;</span>\n<span class="add">+ CREATE INDEX idx_users_last_seen_at</span>\n<span class="add">+   ON users (last_seen_at DESC);</span></code></pre><div class="decision-note"><strong>Decision</strong>Show the generated mutation SQL before apply, then inspect database state after any CLI error.</div>',
        tests: '<h2>Run the workbench on both supported Neovim targets.</h2><p>The test matrix covers editing state, generated SQL, adapters, the interface, and regression paths on Neovim stable and 0.10 with DuckDB installed.</p><p class="proof-line"><a href="/blog/dadbod-grip/">Read the build story</a> · <a href="https://github.com/joryeugene/dadbod-grip.nvim">View source</a></p>',
        visual: '<h2>Keep the investigation visible in one frame.</h2><p>The Softrear demo database puts a 17-table schema tree, query editor, staged grid markers, and the generated Live SQL in one Neovim view. Review checks that the selected table, pending edits, and exact statement remain legible together before apply.</p>'
      },
      wrongTurns: [['Separate desktop app', 'It breaks editor flow and adds another interface to install, learn, and maintain.'], ['Hide generated SQL', 'Users need to inspect generated query or mutation SQL before it reaches a database.']]
    },
    'totally-reliable': {
      title: 'How four live ragdolls stay connected in flight',
      kicker: 'Case: Totally Reliable Delivery Service',
      layers: {
        brief: '<h2>Keep every grip, body, joint, and vehicle live online.</h2><p>Four players can grab one another into a physical chain while one flies a jetpack. The mechanic only works when the shared simulation stays responsive.</p>',
        constraints: '<h2>Network real ragdolls instead of canned reactions.</h2><p>Rigid bodies, joints, collisions, players, and vehicles affect one another continuously. Synchronization cost grows with every connected body and moving object.</p>',
        changes: '<h2>Profile the interactions players can feel.</h2><p>I led the Unity and C# multiplayer architecture with Photon and PlayFab.</p><div class="decision-note"><strong>Decision</strong>Spend network work on the bodies and interactions visible to players.</div><p class="proof-line"><a href="https://www.totallyreliable.com/post/pc-mac-2-03-03-update">Read a shipped update</a></p>',
        tests: '<h2>Test the combinations players create.</h2><p>I tested four-player grip chains, moving vehicles, joints, collisions, and physics objects in live multiplayer sessions under real network conditions.</p><div class="proof-strip"><span>Four live players</span><span>Grip chains</span><span>Moving physics</span></div>',
        visual: '<h2>Judge the chain as a player sees it.</h2><p>The captured scene keeps the jetpack wearer, three hanging ragdolls, their grips, and the delivery objective legible in one frame.</p>'
      },
      wrongTurns: [['Fake the ragdolls with canned animation', 'It would remove the live grip, chain, collision, and vehicle interactions that define the game.'], ['Synchronize every object equally', 'It spends the same bandwidth on sleeping scenery and the bodies players are actively controlling.']]
    },
    theosis: {
      title: 'How Pray Orthodox builds a daily prayer book from sourced Church texts',
      kicker: 'Case: Pray Orthodox',
      layers: {
        brief: '<h2>Support daily prayer in one focused reader.</h2><p>Pray Orthodox is an Orthodox prayer book and Scripture reader for daily prayer. The selected date opens the appointed services and readings in a calm reading surface.</p>',
        constraints: '<h2>Keep the calendar, sources, and reader roles accurate.</h2><p>The calendar changes the required material by date. Each spoken line needs a source and locator. The same content must work offline in the native apps and load in small files on the public web without a live application server.</p>',
        changes: '<h2>Compile sourced Church texts before publication.</h2><p>A source manifest records authority, checksum, rights, scope, and locator requirements. Importers prepare fixed services, changing calendar material, and Scripture. The resolver selects the required form while preserving source and role data. Publication stops when required material is unresolved or unsourced.</p><p>Python emits static calendar and Scripture files. Expo exports the shared interface, and the web reader loads the selected content without a runtime API.</p><div class="decision-note"><strong>Decision</strong>Publish only complete, sourced services and keep runtime delivery read-only.</div>',
        tests: '<h2>Keep incomplete services out of the public schedule.</h2><p>Publication checks resolve each public service and role across the supported calendar range. They reject unresolved material, unknown sources, missing locators, incorrect roles, and unappointed substitutions. Browser checks open the prayer reader on phone and desktop.</p>',
        visual: '<h2>Judge the result as a prayer book.</h2><p>Phone uses one focused reading column. Desktop places the church day beside the selected service. Reviews check date hierarchy, reading measure, touch controls, source display, and horizontal overflow. Prayer, directions, roles, and explanatory text remain visually distinct.</p><p class="proof-line"><a href="https://prayorthodox.com/">Open the live product</a></p>'
      },
      wrongTurns: [['Publish incomplete services', 'Unsupported appointments stay hidden until every required section resolves from a source.'], ['Send readers to source documents', 'The prayer book keeps the authorized text in the reader with its source and locator.'], ['Resolve the calendar at runtime', 'Building the files before publication lets checks inspect the same content readers receive and removes a server availability boundary during prayer.']]
    },
    workhelix: {
      title: 'How Nucleus presents AI-opportunity estimates to enterprise leaders',
      kicker: 'Workhelix · pre-seed to Series A',
      layers: {
        brief: '<h2>Show enterprise leaders estimated AI opportunities, savings, and gaps.</h2><p>Nucleus combines HRIS, AI-usage, prompt, assessment, and business-impact data to show adoption, rank estimated opportunities, identify effective users, estimate savings, expose gaps, and help leaders prioritize AI investment.</p>',
        constraints: '<h2>Replace the prototype while the product and customer work continued.</h2><p>I joined pre-seed as the sole frontend engineer. The production platform needed tenant-safe data, authentication, interfaces for analytics and assessment results, admin tools, and releases while the migration continued.</p>',
        changes: '<h2>Replace Bubble, then own the production path.</h2><p>I replaced Bubble with React and TypeScript, turned Figma designs into reusable components, and used ECharts to present the data science team\'s assessment outputs. I later owned FastAPI, PostgreSQL performance and migrations, authentication, admin tools, AWS, Terraform, and releases.</p>',
        tests: '<h2>Build review, release, and security checks into delivery.</h2><p>I built GitHub Actions and agent workflows for code review and releases, then implemented engineering controls that supported SOC 2 Type II. Authentication covered OAuth, WorkOS SSO, JWT, and multi-tenant isolation.</p><div class="proof-strip"><span>Review</span><span>Release</span><span>Tenant isolation</span></div>',
        visual: '<h2>Keep the opportunity model readable in one view.</h2><p>The current screenshot keeps the HRIS-powered baseline, three summary metrics, a business-unit opportunity chart with hover detail, and a measure-selectable use-case treemap visible in one view.</p>'
      },
      sidebarTitle: 'Scope of ownership',
      wrongTurns: [['Product migration', 'The React and TypeScript application replaced Bubble and remained in production through Series A.'], ['Backend and data', 'The work expanded into FastAPI, SQLAlchemy, PostgreSQL performance, and production data migrations.'], ['Delivery and trust', 'AWS, Terraform, GitHub Actions, authentication, tenant isolation, and SOC 2 controls became part of the same ownership path.']]
    }
  };

  let hoverSelectionEnabled = true;
  document.addEventListener('keydown', () => {
    hoverSelectionEnabled = false;
  }, true);
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse') hoverSelectionEnabled = true;
  }, { capture: true, passive: true });

  function shouldSelectOnHover(event) {
    return hoverSelectionEnabled
      && event.pointerType === 'mouse'
      && !window.matchMedia('(max-width: 760px)').matches;
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

  function initializeCopyrightYears() {
    const currentYear = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach((year) => {
      year.textContent = currentYear;
      year.setAttribute('datetime', currentYear);
    });
  }

  function init() {
    initializeCopyrightYears();
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
