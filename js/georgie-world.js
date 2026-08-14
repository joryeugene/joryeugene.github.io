(function initializeGeorgieWorld() {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (params.get('georgie-world') !== '1' || document.querySelector('[data-georgie-world]')) return;

  const requestedVisitors = Number.parseInt(params.get('georgies') || '1', 10);
  const requestedScene = params.get('scene');
  const visitorCount = Number.isFinite(requestedVisitors)
    ? Math.min(4, Math.max(0, requestedVisitors))
    : 1;

  function findResident() {
    return document.querySelector('#vim-dashboard-pet, .reader-georgie, [data-georgie-egg]');
  }

  function addStylesheet() {
    if (document.querySelector('link[data-georgie-world-styles]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/css/georgie-world.css?v=porch-1';
    stylesheet.dataset.georgieWorldStyles = '';
    document.head.append(stylesheet);
  }

  function render() {
    const resident = findResident();
    if (!resident) return;

    addStylesheet();
    resident.dataset.georgieResident = '';
    resident.dataset.georgieState = 'peeking';

    const world = document.createElement('div');
    world.className = 'georgie-world';
    world.dataset.georgieWorld = '';
    world.setAttribute('aria-label', 'Anonymous visitors sharing Georgie\'s porch');

    const count = document.createElement('span');
    count.className = 'georgie-world__count';
    count.dataset.roomCount = '';
    count.setAttribute('aria-live', 'polite');
    count.textContent = visitorCount === 0 ? 'quiet room' : `${visitorCount} here`;
    world.append(count);

    for (let index = 0; index < visitorCount; index += 1) {
      const light = document.createElement('span');
      light.className = 'georgie-world__visitor';
      light.dataset.visitorLight = '';
      light.style.setProperty('--visitor-index', String(index));
      light.setAttribute('role', 'img');
      light.setAttribute('aria-label', `Anonymous visitor ${index + 1}`);
      if (requestedScene === 'missed-pounce' && index === 0) {
        const residentBox = resident.getBoundingClientRect();
        light.classList.add('georgie-world__visitor--target');
        light.dataset.visitorRole = 'target';
        light.dataset.visitorState = 'waiting';
        light.style.setProperty('--visitor-x', String(Math.max(16, residentBox.left - 24)));
        light.style.setProperty('--visitor-y', String(Math.max(96, residentBox.top + 54)));
      }
      world.append(light);
    }

    document.body.append(world);

    if (requestedScene === 'missed-pounce' && visitorCount > 0) {
      const target = world.querySelector('[data-visitor-role="target"]');
      const setScene = (scene, visitorState) => {
        world.dataset.georgieScene = scene;
        resident.dataset.georgieState = scene;
        target.dataset.visitorState = visitorState;
      };

      setScene('watching', 'teasing');
      window.setTimeout(() => setScene('pouncing', 'waiting'), 600);
      window.setTimeout(() => setScene('missed', 'escaped'), 1100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
})();
