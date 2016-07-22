// vim.js - browser vi editor
// jorypestorious.com/vim

(function() {
  'use strict';

  var VIM_VERSION = '1.0';

  // -------------------------------------------------------------------------
  // Welcome dashboard (editable buffer content, :intro restores it)
  // -------------------------------------------------------------------------
  function buildWelcome() {
    var content = [
      '',
      'jorypestorious.com/vim v' + VIM_VERSION,
      '',
      '',
      'type  i  to start writing',
      'type  :w  to save        :e file  open',
      'type  :q  to exit        :q!      with style',
      '',
      '',
      'hjkl       navigate           /word    search',
      'w b e      word motions       n N      next/prev match',
      'f t ; ,    find char          dd yy    delete/yank line',
      '0 $ ^      line positions     p P      paste after/before',
      'gg G H M L top/bottom/screen  r ~ J    replace/case/join',
      'i a o O R  insert/replace     C D S    change/delete/sub',
      'v V        visual select      .        repeat last change',
      'g~ gu gU   case operators     u        undo',
      'Ctrl-a/x   inc/dec number     Ctrl-r   redo',
      'zz zt zb   scroll to cursor   >> <<    indent/dedent',
      ':set nu    line numbers       :zen     distraction-free',
      ':Ex        file browser       :help    all commands',
      ':color     32 themes          :agents  aquarium',
      '',
      'new to vim? type  :tutor  to learn the basics',
      '',
      'gx on a URL to open it:',
      'https://github.com/joryeugene/joryeugene.github.io/blob/master/js/vim.js'
    ];
    var rows = Math.floor((window.innerHeight - 63) / 21);
    var padTop = Math.max(0, Math.floor((rows - content.length) / 2));
    var zen = state && state.zenMode;
    var effectiveWidth = zen ? Math.min(window.innerWidth, 65 * 8.4) : window.innerWidth;
    var cols = Math.floor(effectiveWidth / 8.4);
    var maxLen = 0;
    for (var i = 0; i < content.length; i++) {
      if (content[i].length > maxLen) maxLen = content[i].length;
    }
    var padLeft = Math.max(0, Math.floor((cols - maxLen) / 2));
    var prefix = '';
    for (var p = 0; p < padLeft; p++) prefix += ' ';
    var lines = [];
    for (var t = 0; t < padTop; t++) lines.push('');
    for (var j = 0; j < content.length; j++) {
      lines.push(content[j] ? prefix + content[j] : '');
    }
    // find first non-empty content line for cursor placement
    var fcr = padTop;
    for (var fc = 0; fc < content.length; fc++) {
      if (content[fc]) { fcr = padTop + fc; break; }
    }
    lines.firstContentRow = fcr;
    lines.firstContentCol = padLeft;
    return lines;
  }

  function isWelcomeBuffer() {
    for (var i = 0; i < state.lines.length; i++) {
      if (state.lines[i].indexOf('jorypestorious.com/vim') !== -1) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // File explorer (:Ex, :Explore) - netrw-style blog file browser
  // -------------------------------------------------------------------------
  function buildExplorer() {
    var names = Object.keys(blogFiles).sort();
    var maxLen = 0;
    for (var mi = 0; mi < names.length; mi++) {
      if (names[mi].length > maxLen) maxLen = names[mi].length;
    }
    var header = [
      'netrw Directory Listing',
      '',
      'Enter: open    -: return here    u: go back    /: search',
      ''
    ];
    for (var hi = 0; hi < header.length; hi++) {
      if (header[hi].length > maxLen) maxLen = header[hi].length;
    }
    var allContent = header.concat(names);
    // Center horizontally like the intro screen
    var zen = state && state.zenMode;
    var effectiveWidth = zen ? Math.min(window.innerWidth, 65 * 8.4) : window.innerWidth;
    var cols = Math.floor(effectiveWidth / 8.4);
    var padLeft = Math.max(0, Math.floor((cols - maxLen) / 2));
    var prefix = '';
    for (var p = 0; p < padLeft; p++) prefix += ' ';
    // Center vertically
    var rows = Math.floor((window.innerHeight - 63) / 21);
    var padTop = Math.max(0, Math.floor((rows - allContent.length) / 2));
    var lines = [];
    for (var t = 0; t < padTop; t++) lines.push('');
    for (var j = 0; j < allContent.length; j++) {
      lines.push(allContent[j] ? prefix + allContent[j] : '');
    }
    lines.firstFileRow = padTop + header.length;
    lines.padLeft = padLeft;
    return lines;
  }

  function isExplorerBuffer() {
    for (var ei = 0; ei < Math.min(state.lines.length, 20); ei++) {
      if (state.lines[ei] && state.lines[ei].indexOf('netrw Directory Listing') !== -1) return true;
    }
    return false;
  }

  function openExplorer() {
    if (isExplorerBuffer()) return;
    pushUndo();
    var expLines = buildExplorer();
    state.lines = expLines;
    state.cursor = { row: expLines.firstFileRow || 0, col: expLines.padLeft || 0 };
    state.curswant = expLines.padLeft || 0;
    state.filename = 'netrw';
    setStatus('"netrw" ' + Object.keys(blogFiles).length + ' files');
    render();
  }

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  var welcomeLines = buildWelcome();
  var state = {
    lines: welcomeLines,
    cursor: { row: welcomeLines.firstContentRow || 0, col: welcomeLines.firstContentCol || 0 },
    mode: 'normal',
    register: '',
    registerLinewise: false,
    visualAnchor: null,
    visualMode: null,
    cmdBuf: '',
    searchBuf: '',
    searchPattern: null,
    searchMatches: [],
    searchIdx: 0,
    undoStack: [],
    undoIdx: -1,
    curswant: 0,
    lineNumbers: false,
    zenMode: false,
    filename: 'untitled.txt',
    statusMsg: null,
    statusMsgTimer: null,
    exitTarget: document.referrer && document.referrer.indexOf(location.origin) === 0
      ? document.referrer : '/',
    escCount: 0,
    escTimer: null,
    agentsMode: false,
    pendingOp: null,
    pendingGForOp: false,
    lastFind: null,
    searchDir: 1,
    lastChange: null,
    insertText: '',
    lineUndoRow: -1,
    lineUndoText: '',
    colorscheme: 'default',
    prevColorscheme: null,
    konamiIdx: 0,
    lastSub: null,
    replaceUndo: [],
    relativeNumbers: false,
    ignoreCase: false,
    smartCase: false,
    cursorLine: false,
    listMode: false,
    wordWrap: false,
    hlsearch: true,
    incsearch: true,
    jumpList: [],
    jumpIdx: -1,
    lastVisualRange: null,
    confirmSub: null,
    preSearchCursor: null,
    marks: {},
    pendingTextObjPrefix: null,
    pendingTextObjOp: null,
    pendingTextObjCount: 0,
    macroRegisters: {},
    macroRecording: null,
    macroLastPlayed: null,
    macroDepth: 0
  };

  // Blog file shortname map (used by :e, :r, :help)
  var blogFiles = {
    'emergent-religion': '/blog/emergent-religion/emergent-religion.md',
    'terminal-velocity': '/blog/terminal-velocity/terminal-velocity.md',
    'friction-economy': '/blog/friction-economy/friction-economy-vim-philosophy.md',
    'knowledge-sidecar': '/blog/knowledge-sidecar/knowledge-sidecar.md',
    'pig-security-wisdom': '/blog/pig-security-wisdom/pig-security-wisdom.md',
    'natural-language-first': '/blog/natural-language-first/confidence-bug-natural-language.md',
    'claude-code-setups': '/blog/claude-code-setups/claude-code-real-world-setups.md',
    'calmhive': '/blog/calmhive/calmhive.md',
    'dadbod-grip': '/blog/dadbod-grip/dadbod-grip.md',
    'ai-engineer-spec': '/blog/ai-engineer-spec/2025-ai-engineers-world-fair-takeaways-spec.md',
    'trust-your-engineers': '/blog/trust-your-engineers/trust-your-engineers.md',
    'spiritual-bliss': '/blog/spiritual-bliss-attractor-state/claude-consciousness.md',
    'ai-dev-tooling': '/blog/ai-dev-tooling-presentation/ai-dev-tooling-and-workflows.md'
  };

  function resolveBlogPath(name) {
    return blogFiles[name] || null;
  }

  // Custom konami: up up left right left right down down enter
  var konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'Enter'];

  // Count prefix accumulator for normal mode (e.g. 3w, 5j, 2dd)
  var countBuf = 0;
  function getCount() { var c = countBuf || 1; countBuf = 0; return c; }

  // Write to register and system clipboard
  function setRegister(text, linewise) {
    state.register = text;
    if (linewise !== undefined) state.registerLinewise = linewise;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        // fallback: textarea + execCommand
        clipboardFallback(text);
      });
    } else {
      clipboardFallback(text);
    }
  }

  function clipboardFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  // -------------------------------------------------------------------------
  // Colorschemes
  // -------------------------------------------------------------------------
  var colorschemes = {
    'default':    { bg: '#1e1e2e', fg: '#cdd6f4', cursor: '#cdd6f4', sel: 'rgba(88,91,112,0.5)', gutter: '#585b70', status: '#181825', statusFg: '#cdd6f4', mark: 'rgba(249,226,175,0.3)' },
    'gruvbox':    { bg: '#282828', fg: '#ebdbb2', cursor: '#ebdbb2', sel: 'rgba(146,131,116,0.4)', gutter: '#928374', status: '#1d2021', statusFg: '#ebdbb2', mark: 'rgba(250,189,47,0.3)' },
    'solarized':  { bg: '#002b36', fg: '#839496', cursor: '#93a1a1', sel: 'rgba(7,54,66,0.7)', gutter: '#586e75', status: '#073642', statusFg: '#93a1a1', mark: 'rgba(181,137,0,0.3)' },
    'nord':       { bg: '#2e3440', fg: '#d8dee9', cursor: '#d8dee9', sel: 'rgba(67,76,94,0.6)', gutter: '#4c566a', status: '#3b4252', statusFg: '#eceff4', mark: 'rgba(235,203,139,0.3)' },
    'dracula':    { bg: '#282a36', fg: '#f8f8f2', cursor: '#f8f8f2', sel: 'rgba(68,71,90,0.6)', gutter: '#6272a4', status: '#21222c', statusFg: '#f8f8f2', mark: 'rgba(241,250,140,0.3)' },
    'monokai':    { bg: '#272822', fg: '#f8f8f2', cursor: '#f8f8f2', sel: 'rgba(73,72,62,0.6)', gutter: '#75715e', status: '#1e1f1c', statusFg: '#f8f8f2', mark: 'rgba(230,219,116,0.3)' },
    'tokyonight': { bg: '#1a1b26', fg: '#c0caf5', cursor: '#c0caf5', sel: 'rgba(41,46,66,0.7)', gutter: '#565f89', status: '#16161e', statusFg: '#c0caf5', mark: 'rgba(224,175,104,0.3)' },
    'onedark':    { bg: '#282c34', fg: '#abb2bf', cursor: '#abb2bf', sel: 'rgba(62,68,81,0.6)', gutter: '#5c6370', status: '#21252b', statusFg: '#abb2bf', mark: 'rgba(229,192,123,0.3)' },
    'rosepine':   { bg: '#191724', fg: '#e0def4', cursor: '#e0def4', sel: 'rgba(38,35,53,0.7)', gutter: '#6e6a86', status: '#1f1d2e', statusFg: '#e0def4', mark: 'rgba(246,193,119,0.3)' },
    'catppuccin': { bg: '#1e1e2e', fg: '#cdd6f4', cursor: '#cdd6f4', sel: 'rgba(88,91,112,0.5)', gutter: '#585b70', status: '#181825', statusFg: '#cdd6f4', mark: 'rgba(249,226,175,0.3)' },
    // Classic vim built-ins
    'blue':       { bg: '#0000d4', fg: '#ffff00', cursor: '#ffffff', sel: 'rgba(0,255,255,0.4)', gutter: '#00ffff', status: '#0000aa', statusFg: '#ffffff', mark: 'rgba(255,0,255,0.35)' },
    'darkblue':   { bg: '#00002a', fg: '#c0c0c0', cursor: '#ffffff', sel: 'rgba(0,0,128,0.6)', gutter: '#808080', status: '#00008b', statusFg: '#ffff00', mark: 'rgba(255,255,0,0.3)' },
    'desert':     { bg: '#333333', fg: '#ffa0a0', cursor: '#f0e68c', sel: 'rgba(107,107,107,0.5)', gutter: '#808080', status: '#444444', statusFg: '#f0e68c', mark: 'rgba(255,255,0,0.25)' },
    'elflord':    { bg: '#000000', fg: '#00ffff', cursor: '#00ff00', sel: 'rgba(0,100,0,0.5)', gutter: '#ffff00', status: '#1c1c1c', statusFg: '#00ff00', mark: 'rgba(255,255,0,0.35)' },
    'evening':    { bg: '#00005f', fg: '#ffffff', cursor: '#00ff00', sel: 'rgba(95,95,175,0.5)', gutter: '#ffd700', status: '#000040', statusFg: '#ffd700', mark: 'rgba(255,255,0,0.3)' },
    'industry':   { bg: '#000000', fg: '#00ff00', cursor: '#00ff00', sel: 'rgba(0,80,0,0.6)', gutter: '#666666', status: '#1a1a1a', statusFg: '#00ff00', mark: 'rgba(0,255,0,0.25)' },
    'koehler':    { bg: '#000000', fg: '#ffffff', cursor: '#ff0000', sel: 'rgba(120,120,120,0.5)', gutter: '#808080', status: '#303030', statusFg: '#ffd700', mark: 'rgba(255,255,0,0.3)' },
    'morning':    { bg: '#ffffff', fg: '#000000', cursor: '#ffffff', sel: 'rgba(135,206,235,0.5)', gutter: '#808080', status: '#e0e0e0', statusFg: '#000080', mark: 'rgba(255,200,0,0.35)' },
    'murphy':     { bg: '#000050', fg: '#66ff66', cursor: '#ffffff', sel: 'rgba(0,100,0,0.5)', gutter: '#00ff00', status: '#000040', statusFg: '#ffff00', mark: 'rgba(255,255,0,0.3)' },
    'pablo':      { bg: '#000000', fg: '#c0c0c0', cursor: '#ffffff', sel: 'rgba(80,80,80,0.5)', gutter: '#808080', status: '#262626', statusFg: '#ffffff', mark: 'rgba(255,255,0,0.25)' },
    'peachpuff':  { bg: '#ffdab9', fg: '#000000', cursor: '#ffffff', sel: 'rgba(180,100,100,0.3)', gutter: '#808080', status: '#eecc99', statusFg: '#000080', mark: 'rgba(255,0,0,0.2)' },
    'ron':        { bg: '#000000', fg: '#00ffff', cursor: '#ffffff', sel: 'rgba(0,80,120,0.5)', gutter: '#ffff00', status: '#1c1c1c', statusFg: '#00ffff', mark: 'rgba(255,255,0,0.3)' },
    'shine':      { bg: '#ffffff', fg: '#000000', cursor: '#ffffff', sel: 'rgba(175,215,255,0.6)', gutter: '#808080', status: '#e0e0e0', statusFg: '#5f00af', mark: 'rgba(255,200,0,0.35)' },
    'slate':      { bg: '#262626', fg: '#d4d4d4', cursor: '#d4d4d4', sel: 'rgba(80,80,80,0.5)', gutter: '#808080', status: '#3a3a3a', statusFg: '#d4d4d4', mark: 'rgba(255,215,0,0.3)' },
    'torte':      { bg: '#1a1a1a', fg: '#cccccc', cursor: '#ffffff', sel: 'rgba(90,90,90,0.5)', gutter: '#808080', status: '#2d2d2d', statusFg: '#cccccc', mark: 'rgba(255,255,0,0.25)' },
    'zellner':    { bg: '#ffffff', fg: '#000000', cursor: '#ffffff', sel: 'rgba(175,175,255,0.4)', gutter: '#808080', status: '#dcdcdc', statusFg: '#8b0000', mark: 'rgba(255,200,0,0.4)' },
    'delek':      { bg: '#ffffff', fg: '#000000', cursor: '#ffffff', sel: 'rgba(175,255,175,0.5)', gutter: '#808080', status: '#d0ffd0', statusFg: '#006400', mark: 'rgba(255,200,0,0.35)' },
    'habamax':    { bg: '#1c1c1c', fg: '#bcbcbc', cursor: '#bcbcbc', sel: 'rgba(68,68,68,0.6)', gutter: '#767676', status: '#303030', statusFg: '#bcbcbc', mark: 'rgba(215,175,0,0.3)' },
    'retrobox':   { bg: '#1d2021', fg: '#ebdbb2', cursor: '#fe8019', sel: 'rgba(60,56,54,0.7)', gutter: '#928374', status: '#3c3836', statusFg: '#ebdbb2', mark: 'rgba(250,189,47,0.3)' },
    'wildcharm':  { bg: '#1a1a2e', fg: '#e0e0ff', cursor: '#ff6eb4', sel: 'rgba(80,60,120,0.5)', gutter: '#7070a0', status: '#16213e', statusFg: '#ff6eb4', mark: 'rgba(255,110,180,0.3)' },
    'sorbet':     { bg: '#1e1a2e', fg: '#d0c8e0', cursor: '#e8a0bf', sel: 'rgba(80,50,90,0.5)', gutter: '#786090', status: '#2a2040', statusFg: '#e8a0bf', mark: 'rgba(232,160,191,0.3)' },
    'lunaperche': { bg: '#232136', fg: '#e0def4', cursor: '#eb6f92', sel: 'rgba(57,53,82,0.6)', gutter: '#6e6a86', status: '#2a273f', statusFg: '#ea9a97', mark: 'rgba(246,193,119,0.3)' }
  };
  var schemeNames = Object.keys(colorschemes);

  function applyColorscheme(name) {
    var s = colorschemes[name];
    if (!s) return;
    state.colorscheme = name;
    document.body.style.backgroundColor = s.bg;
    bodyEl.style.backgroundColor = s.bg;
    bodyEl.style.color = s.fg;
    cursorEl.style.backgroundColor = s.cursor;
    gutterEl.style.color = s.gutter;
    gutterEl.style.backgroundColor = s.bg;
    var statusBar = document.getElementById('vim-statusbar');
    if (statusBar) {
      statusBar.style.backgroundColor = s.status;
      statusBar.style.color = s.statusFg;
    }
    var cmdEl = document.getElementById('vim-cmdline');
    if (cmdEl) { cmdEl.style.color = s.fg; cmdEl.style.backgroundColor = s.bg; }
    document.documentElement.style.setProperty('--vim-sel', s.sel);
    document.documentElement.style.setProperty('--vim-mark', s.mark);
    savePrefs();
  }

  // -------------------------------------------------------------------------
  // DOM refs
  // -------------------------------------------------------------------------
  var bodyEl, gutterEl, contentEl, cursorEl, cmdlineEl,
      statusModeEl, statusFileEl, statusPosEl;

  var charW = 8;
  var lineH = 21;

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------
  function escHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function clampRow(r) {
    return Math.max(0, Math.min(state.lines.length - 1, r));
  }

  function clampCol(r, c) {
    var len = state.lines[r] ? state.lines[r].length : 0;
    var max = state.mode === 'insert' ? len : Math.max(0, len - 1);
    return Math.max(0, Math.min(max, c));
  }

  function clampCursor() {
    state.cursor.row = clampRow(state.cursor.row);
    state.cursor.col = clampCol(state.cursor.row, state.cursor.col);
  }

  function setStatus(msg, duration) {
    if (state.statusMsgTimer) clearTimeout(state.statusMsgTimer);
    state.statusMsg = msg;
    cmdlineEl.textContent = msg;
    if (state.zenMode) cmdlineEl.style.display = '';
    state.statusMsgTimer = setTimeout(function() {
      state.statusMsg = null;
      state.statusMsgTimer = null;
      if (state.mode !== 'command' && state.mode !== 'search') {
        cmdlineEl.textContent = '';
      }
      if (state.zenMode) cmdlineEl.style.display = 'none';
    }, duration || 2000);
  }

  function applyZenMode(on) {
    var editorEl = document.getElementById('vim-editor');
    var statusBar = document.getElementById('vim-statusbar');
    if (on) {
      editorEl.classList.add('zen');
      statusBar.style.display = 'none';
      cmdlineEl.style.display = 'none';
      gutterEl.style.display = 'none';
      lineH = 24;
    } else {
      editorEl.classList.remove('zen');
      statusBar.style.display = '';
      cmdlineEl.style.display = '';
      gutterEl.style.display = 'block';
      lineH = 21;
    }
  }

  // -------------------------------------------------------------------------
  // Preferences (localStorage persistence)
  // -------------------------------------------------------------------------
  function savePrefs() {
    try {
      localStorage.setItem('vim-prefs', JSON.stringify({
        lineNumbers: state.lineNumbers,
        zenMode: state.zenMode,
        colorscheme: state.colorscheme,
        relativeNumbers: state.relativeNumbers,
        ignoreCase: state.ignoreCase,
        smartCase: state.smartCase,
        cursorLine: state.cursorLine,
        listMode: state.listMode,
        wordWrap: state.wordWrap,
        hlsearch: state.hlsearch,
        incsearch: state.incsearch
      }));
    } catch(e) {}
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem('vim-prefs');
      if (!raw) return;
      var prefs = JSON.parse(raw);
      if (prefs.lineNumbers !== undefined) state.lineNumbers = prefs.lineNumbers;
      if (prefs.zenMode !== undefined) state.zenMode = prefs.zenMode;
      if (prefs.colorscheme !== undefined) state.colorscheme = prefs.colorscheme;
      if (prefs.relativeNumbers !== undefined) state.relativeNumbers = prefs.relativeNumbers;
      if (prefs.ignoreCase !== undefined) state.ignoreCase = prefs.ignoreCase;
      if (prefs.smartCase !== undefined) state.smartCase = prefs.smartCase;
      if (prefs.cursorLine !== undefined) state.cursorLine = prefs.cursorLine;
      if (prefs.listMode !== undefined) state.listMode = prefs.listMode;
      if (prefs.wordWrap !== undefined) state.wordWrap = prefs.wordWrap;
      if (prefs.hlsearch !== undefined) state.hlsearch = prefs.hlsearch;
      if (prefs.incsearch !== undefined) state.incsearch = prefs.incsearch;
    } catch(e) {}
  }

  // -------------------------------------------------------------------------
  // Undo
  // -------------------------------------------------------------------------
  function pushUndo() {
    state.undoStack = state.undoStack.slice(0, state.undoIdx + 1);
    state.undoStack.push({ lines: state.lines.slice(), filename: state.filename });
    if (state.undoStack.length > 200) { state.undoStack.shift(); }
    else { state.undoIdx++; }
  }

  function undo() {
    if (state.undoIdx < 0) { setStatus('Already at oldest change'); return; }
    // At the tip: save current state so redo can restore it
    if (state.undoIdx === state.undoStack.length - 1) {
      state.undoStack.push({ lines: state.lines.slice(), filename: state.filename });
    }
    var entry = state.undoStack[state.undoIdx--];
    state.lines = entry.lines.slice();
    if (entry.filename) state.filename = entry.filename;
    clampCursor();
    render();
  }

  function redo() {
    if (state.undoIdx + 2 >= state.undoStack.length) {
      setStatus('Already at newest change'); return;
    }
    var entry = state.undoStack[state.undoIdx + 2];
    state.lines = entry.lines.slice();
    if (entry.filename) state.filename = entry.filename;
    state.undoIdx++;
    clampCursor();
    render();
  }

  // -------------------------------------------------------------------------
  // Buffer ops
  // -------------------------------------------------------------------------
  function getLine(r) {
    return state.lines[r] || '';
  }

  function deleteLine(r) {
    if (state.lines.length === 1) {
      state.lines[0] = '';
    } else {
      state.lines.splice(r, 1);
    }
    state.cursor.row = clampRow(state.cursor.row);
    state.cursor.col = clampCol(state.cursor.row, state.cursor.col);
  }

  function insertLine(r, str) {
    state.lines.splice(r, 0, str);
  }

  // -------------------------------------------------------------------------
  // Word motion helpers
  // -------------------------------------------------------------------------
  // Three character classes (matches vim):
  //   0 = whitespace, 1 = word (\w), 2 = punctuation (everything else)
  function charClass(ch) {
    if (!ch || ch === ' ' || ch === '\t') return 0;
    if (/\w/.test(ch)) return 1;
    return 2;
  }

  function wordForward(row, col) {
    var line = getLine(row);
    var c = col;
    if (c < line.length) {
      var cls = charClass(line[c]);
      if (cls === 0) {
        // on whitespace: skip whitespace, land on next non-whitespace
        while (c < line.length && charClass(line[c]) === 0) c++;
      } else {
        // on word or punct: skip same class, then skip whitespace
        while (c < line.length && charClass(line[c]) === cls) c++;
        while (c < line.length && charClass(line[c]) === 0) c++;
      }
      if (c < line.length) return { row: row, col: c };
    }
    // advance to next line
    if (row < state.lines.length - 1) {
      var nextLine = getLine(row + 1);
      var nc = 0;
      while (nc < nextLine.length && charClass(nextLine[nc]) === 0) nc++;
      return { row: row + 1, col: nc };
    }
    return { row: row, col: Math.max(0, line.length - 1) };
  }

  function wordBackward(row, col) {
    var line = getLine(row);
    var c = col;
    if (c > 0) {
      c--;
      // skip whitespace
      while (c > 0 && charClass(line[c]) === 0) c--;
      // skip same class group
      var cls = charClass(line[c]);
      while (c > 0 && charClass(line[c - 1]) === cls) c--;
      return { row: row, col: c };
    }
    if (row > 0) {
      var prevLine = getLine(row - 1);
      if (!prevLine.length) return { row: row - 1, col: 0 };
      var pc = prevLine.length - 1;
      while (pc > 0 && charClass(prevLine[pc]) === 0) pc--;
      return { row: row - 1, col: pc };
    }
    return { row: 0, col: 0 };
  }

  // Word-end motion (e): move to end of current/next word
  function wordEnd(row, col) {
    var line = getLine(row);
    var c = col;
    if (c < line.length - 1) {
      c++;
      // skip whitespace
      while (c < line.length && charClass(line[c]) === 0) c++;
      if (c < line.length) {
        var cls = charClass(line[c]);
        while (c < line.length - 1 && charClass(line[c + 1]) === cls) c++;
        return { row: row, col: c };
      }
    }
    if (row < state.lines.length - 1) {
      var nextLine = getLine(row + 1);
      var nc = 0;
      while (nc < nextLine.length && charClass(nextLine[nc]) === 0) nc++;
      if (nc < nextLine.length) {
        var cls2 = charClass(nextLine[nc]);
        while (nc < nextLine.length - 1 && charClass(nextLine[nc + 1]) === cls2) nc++;
        return { row: row + 1, col: nc };
      }
      return { row: row + 1, col: 0 };
    }
    return { row: row, col: Math.max(0, line.length - 1) };
  }

  // WORD motions (whitespace-only boundaries)
  function WORDForward(row, col) {
    var line = getLine(row);
    var c = col;
    while (c < line.length && line[c] !== ' ') c++;
    while (c < line.length && line[c] === ' ') c++;
    if (c < line.length) return { row: row, col: c };
    if (row < state.lines.length - 1) {
      var nextLine = getLine(row + 1);
      var nc = 0;
      while (nc < nextLine.length && nextLine[nc] === ' ') nc++;
      return { row: row + 1, col: nc };
    }
    return { row: row, col: Math.max(0, line.length - 1) };
  }

  function WORDBackward(row, col) {
    var line = getLine(row);
    var c = col;
    if (c > 0) {
      c--;
      while (c > 0 && line[c] === ' ') c--;
      while (c > 0 && line[c - 1] !== ' ') c--;
      return { row: row, col: c };
    }
    if (row > 0) {
      var prevLine = getLine(row - 1);
      if (!prevLine.length) return { row: row - 1, col: 0 };
      var pc = prevLine.length - 1;
      while (pc > 0 && prevLine[pc] === ' ') pc--;
      while (pc > 0 && prevLine[pc - 1] !== ' ') pc--;
      return { row: row - 1, col: pc };
    }
    return { row: 0, col: 0 };
  }

  function WORDEnd(row, col) {
    var line = getLine(row);
    var c = col;
    if (c < line.length - 1) {
      c++;
      while (c < line.length && line[c] === ' ') c++;
      if (c < line.length) {
        while (c < line.length - 1 && line[c + 1] !== ' ') c++;
        return { row: row, col: c };
      }
    }
    if (row < state.lines.length - 1) {
      var nextLine = getLine(row + 1);
      var nc = 0;
      while (nc < nextLine.length && nextLine[nc] === ' ') nc++;
      if (nc < nextLine.length) {
        while (nc < nextLine.length - 1 && nextLine[nc + 1] !== ' ') nc++;
        return { row: row + 1, col: nc };
      }
      return { row: row + 1, col: 0 };
    }
    return { row: row, col: Math.max(0, line.length - 1) };
  }

  // ge: end of previous word (three-class)
  // Algorithm: step back one, if in same word skip to its start then one more,
  // skip whitespace, land on end of previous word
  function wordEndBackward(row, col) {
    var line = getLine(row);
    var c = col;
    if (c > 0) {
      c--;
      // If we stepped into same char class as original, skip through this word
      if (charClass(line[c]) !== 0 && col < line.length && charClass(line[col]) === charClass(line[c])) {
        while (c > 0 && charClass(line[c - 1]) === charClass(line[c])) c--;
        c--;
      }
      // Skip whitespace
      while (c >= 0 && charClass(line[c]) === 0) c--;
      if (c >= 0) return { row: row, col: c };
    }
    if (row > 0) {
      var prevLine = getLine(row - 1);
      if (!prevLine.length) return { row: row - 1, col: 0 };
      var pc = prevLine.length - 1;
      while (pc > 0 && charClass(prevLine[pc]) === 0) pc--;
      return { row: row - 1, col: Math.max(0, pc) };
    }
    return { row: 0, col: 0 };
  }

  // gE: end of previous WORD (whitespace-only boundaries)
  function WORDEndBackward(row, col) {
    var line = getLine(row);
    var c = col;
    if (c > 0) {
      c--;
      if (line[c] !== ' ' && col < line.length && line[col] !== ' ') {
        while (c > 0 && line[c - 1] !== ' ') c--;
        c--;
      }
      while (c >= 0 && line[c] === ' ') c--;
      if (c >= 0) return { row: row, col: c };
    }
    if (row > 0) {
      var prevLine = getLine(row - 1);
      if (!prevLine.length) return { row: row - 1, col: 0 };
      var pc = prevLine.length - 1;
      while (pc > 0 && prevLine[pc] === ' ') pc--;
      return { row: row - 1, col: Math.max(0, pc) };
    }
    return { row: 0, col: 0 };
  }

  // Find-char motion execution
  function execFind(op, ch, row, col) {
    var line = getLine(row);
    var i;
    if (op === 'f') {
      i = line.indexOf(ch, col + 1);
      if (i !== -1) { state.cursor.col = i; state.curswant = i; }
    } else if (op === 'F') {
      i = line.lastIndexOf(ch, col - 1);
      if (i !== -1) { state.cursor.col = i; state.curswant = i; }
    } else if (op === 't') {
      i = line.indexOf(ch, col + 1);
      if (i !== -1 && i > col + 1) { state.cursor.col = i - 1; state.curswant = i - 1; }
      else if (i === col + 1) { state.cursor.col = i - 1; state.curswant = i - 1; }
    } else if (op === 'T') {
      i = line.lastIndexOf(ch, col - 1);
      if (i !== -1 && i < col - 1) { state.cursor.col = i + 1; state.curswant = i + 1; }
      else if (i === col - 1) { state.cursor.col = i + 1; state.curswant = i + 1; }
    }
  }

  // First non-blank column (for ^, I)
  function firstNonBlank(row) {
    var line = getLine(row);
    var c = 0;
    while (c < line.length && line[c] === ' ') c++;
    return c < line.length ? c : 0;
  }

  // -------------------------------------------------------------------------
  // Paragraph motions
  // -------------------------------------------------------------------------
  function paragraphForward(row) {
    var r = row;
    // skip current non-blank lines
    while (r < state.lines.length - 1 && getLine(r).trim() !== '') r++;
    // skip blank lines
    while (r < state.lines.length - 1 && getLine(r).trim() === '') r++;
    return r;
  }

  function paragraphBackward(row) {
    var r = row;
    // skip current non-blank lines
    while (r > 0 && getLine(r).trim() !== '') r--;
    // skip blank lines
    while (r > 0 && getLine(r).trim() === '') r--;
    return r;
  }

  // -------------------------------------------------------------------------
  // Bracket matching (%)
  // -------------------------------------------------------------------------
  function matchBracket(row, col) {
    var line = getLine(row);
    var ch = line[col];
    var pairs = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{' };
    var openers = { '(': true, '[': true, '{': true };
    if (!ch || !pairs[ch]) {
      // find next bracket on line
      for (var i = col; i < line.length; i++) {
        if (pairs[line[i]]) { col = i; ch = line[i]; break; }
      }
      if (!ch || !pairs[ch]) return null;
    }
    var target = pairs[ch];
    var dir = openers[ch] ? 1 : -1;
    var depth = 1;
    var r = row, c = col;
    while (depth > 0) {
      c += dir;
      if (c < 0 || c >= getLine(r).length) {
        r += dir;
        if (r < 0 || r >= state.lines.length) return null;
        c = dir === 1 ? 0 : getLine(r).length - 1;
      }
      var cc = getLine(r)[c];
      if (cc === ch) depth++;
      if (cc === target) depth--;
    }
    return { row: r, col: c };
  }

  // -------------------------------------------------------------------------
  // Compute motion range for operator+motion grammar
  // Returns {endRow, endCol, linewise} or null
  // -------------------------------------------------------------------------
  function computeMotionRange(key, row, col, count, charArg) {
    var r, c, pos, i;
    switch (key) {
      case 'h': return { endRow: row, endCol: Math.max(0, col - count), linewise: false };
      case 'l': return { endRow: row, endCol: Math.min(getLine(row).length - 1, col + count), linewise: false };
      case 'j': return { endRow: Math.min(state.lines.length - 1, row + count), endCol: col, linewise: true };
      case 'k': return { endRow: Math.max(0, row - count), endCol: col, linewise: true };
      case 'w':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = wordForward(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c, linewise: false };
      case 'W':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = WORDForward(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c, linewise: false };
      case 'b':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = wordBackward(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c, linewise: false };
      case 'B':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = WORDBackward(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c, linewise: false };
      case 'e':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = wordEnd(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c + 1, linewise: false, inclusive: true };
      case 'E':
        r = row; c = col;
        for (i = 0; i < count; i++) { pos = WORDEnd(r, c); r = pos.row; c = pos.col; }
        return { endRow: r, endCol: c + 1, linewise: false, inclusive: true };
      case '$': return { endRow: row, endCol: getLine(row).length, linewise: false };
      case '0': return { endRow: row, endCol: 0, linewise: false };
      case '^': return { endRow: row, endCol: firstNonBlank(row), linewise: false };
      case 'G':
        var gRow = count === -1 ? state.lines.length - 1 : clampRow(count - 1);
        return { endRow: gRow, endCol: 0, linewise: true };
      case 'g': // gg
        return { endRow: 0, endCol: 0, linewise: true };
      case '{':
        return { endRow: paragraphBackward(row), endCol: 0, linewise: true };
      case '}':
        return { endRow: paragraphForward(row), endCol: 0, linewise: true };
      case '%':
        var mb = matchBracket(row, col);
        if (mb) return { endRow: mb.row, endCol: mb.col + 1, linewise: false, inclusive: true };
        return null;
      case 'f': case 'F': case 't': case 'T':
        if (!charArg) return null;
        var line = getLine(row);
        var fi;
        if (key === 'f') { fi = line.indexOf(charArg, col + 1); if (fi !== -1) return { endRow: row, endCol: fi + 1, linewise: false, inclusive: true }; }
        if (key === 'F') { fi = line.lastIndexOf(charArg, col - 1); if (fi !== -1) return { endRow: row, endCol: fi, linewise: false }; }
        if (key === 't') { fi = line.indexOf(charArg, col + 1); if (fi !== -1) return { endRow: row, endCol: fi, linewise: false }; }
        if (key === 'T') { fi = line.lastIndexOf(charArg, col - 1); if (fi !== -1) return { endRow: row, endCol: fi + 1, linewise: false }; }
        return null;
      default: return null;
    }
  }

  // -------------------------------------------------------------------------
  // Text objects: iw, aw, iW, aW, ip, ap
  // Returns {startRow, startCol, endRow, endCol, linewise} or null
  // -------------------------------------------------------------------------
  function computeTextObject(prefix, obj, row, col) {
    var line = getLine(row);
    // iw / aw
    if (obj === 'w') {
      var cls = charClass(line[col]);
      var s = col, e = col;
      if (cls === 0) {
        // on whitespace: select whitespace run
        while (s > 0 && charClass(line[s - 1]) === 0) s--;
        while (e < line.length - 1 && charClass(line[e + 1]) === 0) e++;
      } else {
        while (s > 0 && charClass(line[s - 1]) === cls) s--;
        while (e < line.length - 1 && charClass(line[e + 1]) === cls) e++;
      }
      if (prefix === 'a') {
        // include trailing whitespace, or leading if at end of line
        var ae = e;
        while (ae < line.length - 1 && charClass(line[ae + 1]) === 0) ae++;
        if (ae > e) { e = ae; }
        else {
          var as = s;
          while (as > 0 && charClass(line[as - 1]) === 0) as--;
          if (as < s) s = as;
        }
      }
      return { startRow: row, startCol: s, endRow: row, endCol: e + 1, linewise: false };
    }
    // iW / aW
    if (obj === 'W') {
      var s2 = col, e2 = col;
      if (charClass(line[col]) === 0) {
        while (s2 > 0 && charClass(line[s2 - 1]) === 0) s2--;
        while (e2 < line.length - 1 && charClass(line[e2 + 1]) === 0) e2++;
      } else {
        while (s2 > 0 && charClass(line[s2 - 1]) !== 0) s2--;
        while (e2 < line.length - 1 && charClass(line[e2 + 1]) !== 0) e2++;
      }
      if (prefix === 'a') {
        var ae2 = e2;
        while (ae2 < line.length - 1 && charClass(line[ae2 + 1]) === 0) ae2++;
        if (ae2 > e2) { e2 = ae2; }
        else {
          var as2 = s2;
          while (as2 > 0 && charClass(line[as2 - 1]) === 0) as2--;
          if (as2 < s2) s2 = as2;
        }
      }
      return { startRow: row, startCol: s2, endRow: row, endCol: e2 + 1, linewise: false };
    }
    // ip / ap
    if (obj === 'p') {
      var blank = !line.trim();
      var sr = row, er = row;
      if (blank) {
        // select blank line run
        while (sr > 0 && !getLine(sr - 1).trim()) sr--;
        while (er < state.lines.length - 1 && !getLine(er + 1).trim()) er++;
      } else {
        // select contiguous non-blank lines
        while (sr > 0 && getLine(sr - 1).trim()) sr--;
        while (er < state.lines.length - 1 && getLine(er + 1).trim()) er++;
      }
      if (prefix === 'a') {
        // include trailing blank lines (or leading if none trailing)
        var origEr = er;
        while (er < state.lines.length - 1 && !getLine(er + 1).trim()) er++;
        if (er === origEr) {
          while (sr > 0 && !getLine(sr - 1).trim()) sr--;
        }
      }
      return { startRow: sr, startCol: 0, endRow: er, endCol: getLine(er).length, linewise: true };
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Case transform helper for g~/gu/gU operators
  // -------------------------------------------------------------------------
  function transformCase(text, op) {
    if (op === 'gu') return text.toLowerCase();
    if (op === 'gU') return text.toUpperCase();
    // g~ toggle
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      out += ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // Increment/decrement number under cursor (Ctrl-a / Ctrl-x)
  // -------------------------------------------------------------------------
  function incrementNumber(delta) {
    var row = state.cursor.row;
    var line = getLine(row);
    // Find a number at or after cursor
    var re = /-?\d+/g;
    var m;
    var best = null;
    while ((m = re.exec(line)) !== null) {
      if (m.index + m[0].length > state.cursor.col) { best = m; break; }
    }
    if (!best) return;
    pushUndo();
    var num = parseInt(best[0], 10) + delta;
    var replacement = String(num);
    state.lines[row] = line.slice(0, best.index) + replacement + line.slice(best.index + best[0].length);
    state.cursor.col = best.index + replacement.length - 1;
    state.curswant = state.cursor.col;
    render();
  }

  // -------------------------------------------------------------------------
  // Apply operator (d/c/y/>/</ g~/gu/gU) over a range
  // -------------------------------------------------------------------------
  function applyOperator(op, row, col, range) {
    var startRow, startCol, endRow, endCol;
    if (range.linewise) {
      startRow = Math.min(row, range.endRow);
      endRow = Math.max(row, range.endRow);
      // Linewise operations
      var lines = state.lines.slice(startRow, endRow + 1);
      setRegister(lines.join('\n'), true);
      if (op === 'd') {
        pushUndo();
        for (var i = endRow; i >= startRow; i--) deleteLine(i);
        if (!state.lines.length) state.lines = [''];
        state.cursor.row = clampRow(startRow);
        state.cursor.col = firstNonBlank(state.cursor.row);
        var n = endRow - startRow + 1;
        if (n > 1) setStatus(n + ' lines deleted');
      } else if (op === 'c') {
        pushUndo();
        for (var ci = endRow; ci >= startRow; ci--) deleteLine(ci);
        if (!state.lines.length) state.lines = [''];
        if (state.lines.length <= startRow) insertLine(startRow, '');
        else state.lines[startRow] = '';
        state.cursor.row = startRow;
        state.cursor.col = 0;
        state.mode = 'insert';
      } else if (op === 'y') {
        state.cursor.row = startRow;
        state.cursor.col = firstNonBlank(startRow);
        var yn = endRow - startRow + 1;
        setStatus(yn + ' line' + (yn > 1 ? 's' : '') + ' yanked');
      } else if (op === '>') {
        pushUndo();
        for (var gi = startRow; gi <= endRow; gi++) {
          state.lines[gi] = '  ' + getLine(gi);
        }
        state.cursor.row = startRow;
        state.cursor.col = firstNonBlank(startRow);
      } else if (op === '<') {
        pushUndo();
        for (var li = startRow; li <= endRow; li++) {
          var ln = getLine(li);
          if (ln.slice(0, 2) === '  ') state.lines[li] = ln.slice(2);
          else if (ln[0] === ' ') state.lines[li] = ln.slice(1);
          else if (ln[0] === '\t') state.lines[li] = ln.slice(1);
        }
        state.cursor.row = startRow;
        state.cursor.col = firstNonBlank(startRow);
      } else if (op === 'g~' || op === 'gu' || op === 'gU') {
        pushUndo();
        for (var cti = startRow; cti <= endRow; cti++) {
          state.lines[cti] = transformCase(getLine(cti), op);
        }
        state.cursor.row = startRow;
        state.cursor.col = firstNonBlank(startRow);
      }
    } else {
      // Character-wise operations
      // Text objects provide their own startRow/startCol; motions start from cursor
      startRow = (range.startRow !== undefined) ? range.startRow : row;
      startCol = (range.startCol !== undefined) ? range.startCol : col;
      endRow = range.endRow; endCol = range.endCol;
      // Normalize direction
      if (startRow > endRow || (startRow === endRow && startCol > endCol)) {
        var tmp;
        tmp = startRow; startRow = endRow; endRow = tmp;
        tmp = startCol; startCol = endCol; endCol = tmp;
      }
      // Yank the text
      if (startRow === endRow) {
        setRegister(getLine(startRow).slice(startCol, endCol), false);
      } else {
        var parts = [getLine(startRow).slice(startCol)];
        for (var pi = startRow + 1; pi < endRow; pi++) parts.push(getLine(pi));
        parts.push(getLine(endRow).slice(0, endCol));
        setRegister(parts.join('\n'), false);
      }

      if (op === 'd') {
        pushUndo();
        if (startRow === endRow) {
          state.lines[startRow] = getLine(startRow).slice(0, startCol) + getLine(startRow).slice(endCol);
        } else {
          state.lines[startRow] = getLine(startRow).slice(0, startCol) + getLine(endRow).slice(endCol);
          state.lines.splice(startRow + 1, endRow - startRow);
        }
        state.cursor.row = startRow;
        state.cursor.col = clampCol(startRow, startCol);
      } else if (op === 'c') {
        pushUndo();
        if (startRow === endRow) {
          state.lines[startRow] = getLine(startRow).slice(0, startCol) + getLine(startRow).slice(endCol);
        } else {
          state.lines[startRow] = getLine(startRow).slice(0, startCol) + getLine(endRow).slice(endCol);
          state.lines.splice(startRow + 1, endRow - startRow);
        }
        state.cursor.row = startRow;
        state.cursor.col = startCol;
        state.mode = 'insert';
      } else if (op === 'y') {
        state.cursor.row = startRow;
        state.cursor.col = startCol;
        setStatus('yanked');
      } else if (op === 'g~' || op === 'gu' || op === 'gU') {
        pushUndo();
        if (startRow === endRow) {
          var ctLine = getLine(startRow);
          state.lines[startRow] = ctLine.slice(0, startCol) + transformCase(ctLine.slice(startCol, endCol), op) + ctLine.slice(endCol);
        } else {
          var ctFirst = getLine(startRow);
          state.lines[startRow] = ctFirst.slice(0, startCol) + transformCase(ctFirst.slice(startCol), op);
          for (var ctm = startRow + 1; ctm < endRow; ctm++) {
            state.lines[ctm] = transformCase(getLine(ctm), op);
          }
          var ctLast = getLine(endRow);
          state.lines[endRow] = transformCase(ctLast.slice(0, endCol), op) + ctLast.slice(endCol);
        }
        state.cursor.row = startRow;
        state.cursor.col = startCol;
      }
    }
    state.curswant = state.cursor.col;
    render();
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------
  function buildMatches(pattern) {
    state.searchMatches = [];
    if (!pattern) return;
    var re;
    var flags = 'g';
    // \c anywhere in pattern forces case-insensitive, \C forces case-sensitive
    var forceIC = /\\c/.test(pattern);
    var forceCS = /\\C/.test(pattern);
    pattern = pattern.replace(/\\[cC]/g, '');
    if (!pattern) return;
    if (forceIC) {
      flags += 'i';
    } else if (!forceCS && state.ignoreCase) {
      if (!state.smartCase || !/[A-Z]/.test(pattern)) {
        flags += 'i';
      }
    }
    try { re = new RegExp(pattern, flags); } catch(e) {
      state.searchPattern = null;
      return;
    }
    state.searchPattern = re;
    for (var row = 0; row < state.lines.length; row++) {
      var line = state.lines[row];
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(line)) !== null) {
        state.searchMatches.push({ row: row, col: m.index, len: m[0].length || 1 });
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    if (!state.searchMatches.length) {
      state.searchPattern = null;
    }
  }

  function jumpToMatch(idx) {
    if (!state.searchMatches.length) return;
    idx = ((idx % state.searchMatches.length) + state.searchMatches.length) % state.searchMatches.length;
    state.searchIdx = idx;
    var m = state.searchMatches[idx];
    state.cursor.row = m.row;
    state.cursor.col = m.col;
    state.curswant = m.col;
  }

  function searchNext(dir) {
    if (!state.searchMatches.length) { setStatus('No previous search pattern'); return; }
    jumpToMatch(state.searchIdx + dir);
    render();
  }

  // -------------------------------------------------------------------------
  // Jump list (Ctrl-O / Ctrl-I)
  // -------------------------------------------------------------------------
  function jumpOlder() {
    if (!state.jumpList.length) { setStatus(''); return; }
    // Save current position when navigating back from end of list
    if (state.jumpIdx === state.jumpList.length - 1) {
      var cur = { row: state.cursor.row, col: state.cursor.col };
      var last = state.jumpList[state.jumpList.length - 1];
      if (!last || last.row !== cur.row) {
        state.jumpList.push(cur);
        state.jumpIdx = state.jumpList.length - 1;
      }
    }
    if (state.jumpIdx <= 0) { setStatus(''); return; }
    state.jumpIdx--;
    var j = state.jumpList[state.jumpIdx];
    state.cursor.row = clampRow(j.row);
    state.cursor.col = clampCol(state.cursor.row, j.col);
    state.curswant = state.cursor.col;
    render();
  }

  function jumpNewer() {
    if (!state.jumpList.length || state.jumpIdx >= state.jumpList.length - 1) { setStatus(''); return; }
    state.jumpIdx++;
    var j = state.jumpList[state.jumpIdx];
    state.cursor.row = clampRow(j.row);
    state.cursor.col = clampCol(state.cursor.row, j.col);
    state.curswant = state.cursor.col;
    render();
  }

  // Push current cursor position onto jump list (used by mark jumps, G, etc.)
  function pushJump() {
    var entry = { row: state.cursor.row, col: state.cursor.col };
    if (state.jumpIdx >= 0 && state.jumpIdx < state.jumpList.length - 1) {
      state.jumpList = state.jumpList.slice(0, state.jumpIdx + 1);
    }
    var last = state.jumpList.length ? state.jumpList[state.jumpList.length - 1] : null;
    if (last && last.row === entry.row && last.col === entry.col) return;
    state.jumpList.push(entry);
    if (state.jumpList.length > 100) state.jumpList = state.jumpList.slice(-100);
    state.jumpIdx = state.jumpList.length - 1;
  }

  // Auto-push jump when cursor moves 2+ lines (called from handleKey)
  function autoJump(fromRow, fromCol) {
    if (Math.abs(state.cursor.row - fromRow) < 2) return;
    var entry = { row: fromRow, col: fromCol };
    // Truncate forward history when navigating after Ctrl-O
    if (state.jumpIdx >= 0 && state.jumpIdx < state.jumpList.length - 1) {
      state.jumpList = state.jumpList.slice(0, state.jumpIdx + 1);
    }
    // Dedup after truncation so we compare against the correct tail
    var last = state.jumpList.length ? state.jumpList[state.jumpList.length - 1] : null;
    if (last && last.row === entry.row) return;
    state.jumpList.push(entry);
    if (state.jumpList.length > 100) state.jumpList = state.jumpList.slice(-100);
    state.jumpIdx = state.jumpList.length - 1;
  }

  // -------------------------------------------------------------------------
  // Range resolution (used by :s, :'<,'>w, and future range commands)
  // -------------------------------------------------------------------------
  function resolveRange(rangeStr) {
    if (rangeStr === '%') return { start: 0, end: state.lines.length - 1 };
    if (rangeStr === "'<,'>" && state.lastVisualRange) {
      return { start: state.lastVisualRange.startRow, end: state.lastVisualRange.endRow };
    }
    if (rangeStr) {
      var parts = rangeStr.split(',');
      return {
        start: Math.max(0, parseInt(parts[0], 10) - 1),
        end: Math.min(state.lines.length - 1, parseInt(parts[1], 10) - 1)
      };
    }
    return { start: state.cursor.row, end: state.cursor.row };
  }

  // -------------------------------------------------------------------------
  // Visual selection helpers
  // -------------------------------------------------------------------------
  function getVisualRange() {
    var a = state.visualAnchor;
    var c = state.cursor;
    if (!a) return null;
    if (state.visualMode === 'line') {
      var r1 = Math.min(a.row, c.row);
      var r2 = Math.max(a.row, c.row);
      return { startRow: r1, startCol: 0, endRow: r2, endCol: getLine(r2).length };
    }
    // char-wise: normalize
    var before = (a.row < c.row) || (a.row === c.row && a.col <= c.col);
    var startRow = before ? a.row : c.row;
    var startCol = before ? a.col : c.col;
    var endRow   = before ? c.row : a.row;
    var endCol   = before ? c.col + 1 : a.col + 1;
    return { startRow: startRow, startCol: startCol, endRow: endRow, endCol: endCol };
  }

  function exitVisual() {
    state.lastVisualRange = getVisualRange();
    state.visualAnchor = null;
    state.visualMode = null;
  }

  function deleteVisual() {
    var range = getVisualRange();
    if (!range) return;
    pushUndo();
    if (state.visualMode === 'line') {
      var yanked = state.lines.slice(range.startRow, range.endRow + 1).join('\n');
      setRegister(yanked, true);
      for (var i = range.endRow; i >= range.startRow; i--) deleteLine(i);
      if (!state.lines.length) state.lines = [''];
      state.cursor.row = clampRow(range.startRow);
      state.cursor.col = 0;
    } else {
      if (range.startRow === range.endRow) {
        var line = getLine(range.startRow);
        setRegister(line.slice(range.startCol, range.endCol), false);
        state.lines[range.startRow] = line.slice(0, range.startCol) + line.slice(range.endCol);
        state.cursor.row = range.startRow;
        state.cursor.col = clampCol(range.startRow, range.startCol);
      } else {
        // multi-line char-wise delete
        var firstLine = getLine(range.startRow).slice(0, range.startCol);
        var lastLine = getLine(range.endRow).slice(range.endCol);
        var yankedLines = [getLine(range.startRow).slice(range.startCol)];
        for (var j = range.startRow + 1; j < range.endRow; j++) yankedLines.push(getLine(j));
        yankedLines.push(getLine(range.endRow).slice(0, range.endCol));
        setRegister(yankedLines.join('\n'), false);
        state.lines.splice(range.startRow, range.endRow - range.startRow + 1, firstLine + lastLine);
        state.cursor.row = range.startRow;
        state.cursor.col = clampCol(range.startRow, range.startCol);
      }
    }
  }

  function yankVisual() {
    var range = getVisualRange();
    if (!range) return;
    if (state.visualMode === 'line') {
      setRegister(state.lines.slice(range.startRow, range.endRow + 1).join('\n'), true);
    } else {
      if (range.startRow === range.endRow) {
        setRegister(getLine(range.startRow).slice(range.startCol, range.endCol), false);
      } else {
        var parts = [getLine(range.startRow).slice(range.startCol)];
        for (var i = range.startRow + 1; i < range.endRow; i++) parts.push(getLine(i));
        parts.push(getLine(range.endRow).slice(0, range.endCol));
        setRegister(parts.join('\n'), false);
      }
    }
    state.cursor.row = Math.min(state.visualAnchor.row, state.cursor.row);
    state.cursor.col = clampCol(state.cursor.row, state.cursor.col);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  function renderLine(line, row) {
    // list mode: show whitespace chars
    var displayLine = line;
    if (state.listMode) {
      displayLine = displayLine.replace(/\t/g, '\u2192   ').replace(/ /g, '\u00B7');
      displayLine += '\u00AC';
    }
    var escaped = escHtml(displayLine);
    if (!escaped.length) escaped = ' '; // ensure line has height

    var range = (state.mode === 'visual') ? getVisualRange() : null;

    // Apply visual selection spans
    if (range && row >= range.startRow && row <= range.endRow) {
      var sc = (row === range.startRow) ? range.startCol : 0;
      var ec = (row === range.endRow) ? range.endCol : line.length;
      sc = Math.max(0, Math.min(sc, line.length));
      ec = Math.max(0, Math.min(ec, line.length));
      var before = escHtml(line.slice(0, sc));
      var sel    = escHtml(line.slice(sc, ec));
      var after  = escHtml(line.slice(ec));
      escaped = before + (sel ? '<span class="vsel">' + sel + '</span>' : '') + after;
      if (!escaped.length) escaped = ' ';
    }

    // Apply search highlights (only when not in visual mode to avoid nesting)
    if (!range && state.hlsearch && state.searchPattern && state.searchMatches.length) {
      // rebuild from raw line to avoid double-escaping
      var re = state.searchPattern;
      re.lastIndex = 0;
      var result = '';
      var lastIdx = 0;
      var m;
      while ((m = re.exec(line)) !== null) {
        result += escHtml(line.slice(lastIdx, m.index));
        result += '<mark>' + escHtml(m[0]) + '</mark>';
        lastIdx = m.index + m[0].length;
        if (m[0].length === 0) { result += escHtml(line[lastIdx] || ''); lastIdx++; }
      }
      result += escHtml(line.slice(lastIdx));
      escaped = result || ' ';
    }

    // cursorline highlight
    if (state.cursorLine && row === state.cursor.row) {
      escaped = '<span style="background:rgba(255,255,255,0.06);display:inline-block;width:100%">' + escaped + '</span>';
    }

    return escaped;
  }

  function renderGutter() {
    if (state.zenMode) { gutterEl.style.display = 'none'; return; }
    gutterEl.style.display = 'block';
    var visibleRows = Math.floor(bodyEl.clientHeight / lineH);
    var extraRows = Math.max(0, visibleRows - state.lines.length);
    var parts = [];

    if (state.lineNumbers || state.relativeNumbers) {
      gutterEl.style.minWidth = '4ch';
      gutterEl.style.textAlign = 'right';
      for (var i = 0; i < state.lines.length; i++) {
        if (state.relativeNumbers) {
          var rel = Math.abs(i - state.cursor.row);
          // Show absolute number on cursor line, relative elsewhere
          parts.push(escHtml(String(rel === 0 ? i + 1 : rel)));
        } else {
          parts.push(escHtml(String(i + 1)));
        }
      }
    } else {
      gutterEl.style.minWidth = '2ch';
      gutterEl.style.textAlign = 'left';
      for (var j = 0; j < state.lines.length; j++) {
        parts.push(' ');
      }
    }

    for (var t = 0; t < extraRows; t++) {
      parts.push('<span style="color:rgba(100,180,255,0.5)">~</span>');
    }

    gutterEl.innerHTML = parts.join('\n');
  }

  function renderStatus() {
    var modeLabel = {
      normal:  '--NORMAL--',
      insert:  '--INSERT--',
      replace: '--REPLACE--',
      visual:  state.visualMode === 'line' ? '--VISUAL LINE--' : '--VISUAL--',
      command: '',
      search:  '',
      'confirm-sub': '--CONFIRM--'
    }[state.mode] || '';
    if (state.macroRecording) {
      modeLabel = 'recording @' + state.macroRecording;
    }
    statusModeEl.textContent = modeLabel;
    statusFileEl.textContent = state.filename;
    statusPosEl.textContent = (state.cursor.row + 1) + ',' + (state.cursor.col + 1);
  }

  function render() {
    if (state.agentsMode) return;
    // Track line text for U (undo all changes on line)
    if (state.cursor.row !== state.lineUndoRow) {
      state.lineUndoRow = state.cursor.row;
      state.lineUndoText = getLine(state.cursor.row);
    }
    var html = state.lines.map(renderLine).join('\n');

    contentEl.innerHTML = html;

    // word wrap CSS toggle
    contentEl.style.whiteSpace = state.wordWrap ? 'pre-wrap' : 'pre';
    contentEl.style.wordBreak = state.wordWrap ? 'break-all' : '';

    cursorEl.style.left = (state.cursor.col * charW + 8) + 'px';
    cursorEl.style.top  = (state.cursor.row * lineH) + 'px';
    if (state.mode === 'replace') {
      cursorEl.style.width = charW + 'px';
      cursorEl.style.height = '2px';
      cursorEl.style.top = (state.cursor.row * lineH + lineH - 2) + 'px';
    } else {
      cursorEl.style.width  = (state.mode === 'insert' ? 2 : charW) + 'px';
      cursorEl.style.height = lineH + 'px';
    }

    cursorEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    renderGutter();
    renderStatus();

    // command line display
    if (state.mode === 'command') {
      cmdlineEl.textContent = ':' + state.cmdBuf;
    } else if (state.mode === 'search') {
      cmdlineEl.textContent = (state.searchDir === -1 ? '?' : '/') + state.searchBuf;
    } else if (!state.statusMsg) {
      cmdlineEl.textContent = '';
      if (state.zenMode) cmdlineEl.style.display = 'none';
    }
  }

  // -------------------------------------------------------------------------
  // Download
  // -------------------------------------------------------------------------
  function downloadText(content, filename) {
    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'untitled.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------------
  // Hacker exit (same glitch pattern as fake vim overlay)
  // -------------------------------------------------------------------------
  function hackerExit() {
    var glitchChars = '!@#$%^&*<>?/|\\~`';
    var interval = setInterval(function() {
      var corrupted = state.lines.map(function(line) {
        return line.replace(/[^\s]/g, function(ch) {
          return Math.random() < 0.4
            ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
            : ch;
        });
      });
      contentEl.innerHTML = corrupted.map(escHtml).join('\n');
    }, 50);
    setTimeout(function() {
      clearInterval(interval);
      window.location.href = state.exitTarget;
    }, 900);
  }

  // -------------------------------------------------------------------------
  // Konami code easter egg
  // -------------------------------------------------------------------------
  function konamiActivate() {
    var editor = document.getElementById('vim-editor');
    editor.style.transition = 'transform 0.6s ease-in-out';
    editor.style.transform = 'rotate(360deg)';
    setTimeout(function() {
      editor.style.transition = '';
      editor.style.transform = '';
    }, 700);
    setStatus('+ 30 lives. You found it.', 4000);
  }

  // -------------------------------------------------------------------------
  // Fake shell (:! easter egg)
  // -------------------------------------------------------------------------
  function getShellOutput(input) {
    var argv = input.split(/\s+/);
    var bin = argv[0] || '';
    var blogSlugs = Object.keys(blogFiles).sort();
    var shellResponses = {
      'ls':       function() {
        var lsArgs = argv.slice(1).filter(function(a) { return a.charAt(0) !== '-'; });
        var arg = lsArgs[0] || '';
        if (arg === 'blog' || arg === 'blog/') {
          return blogSlugs.map(function(s) { return s + '/'; });
        }
        var listing = ['blog/'];
        for (var si = 0; si < blogSlugs.length; si++) {
          listing.push('  ' + blogSlugs[si] + '/');
        }
        listing.push('vim/', 'index.html', 'CNAME', 'favicon.png');
        return listing;
      },
      'pwd':      function() { return ['/home/visitor/jorypestorious.com']; },
      'whoami':   function() { return ['visitor']; },
      'date':     function() { return [new Date().toString()]; },
      'echo':     function() { return [argv.slice(1).join(' ')]; },
      'cat':      function() {
        if (argv[1] === 'README.md') return ['You found the vim editor.', 'Type :intro to go back to the dashboard.'];
        if (argv[1] === '.vimrc') return ['set nocompatible', 'syntax on', 'set number', 'colorscheme catppuccin', '" you wish'];
        var catSlug = (argv[1] || '').replace(/^blog\//, '').replace(/\/$/, '');
        var catPath = resolveBlogPath(catSlug);
        if (catPath) {
          setStatus('Reading ' + catSlug + '...');
          fetch(catPath).then(function(resp) {
            if (!resp.ok) throw new Error(resp.status);
            return resp.text();
          }).then(function(text) {
            pushUndo();
            var output = text.split('\n');
            for (var ci = 0; ci < output.length; ci++) {
              state.lines.splice(state.cursor.row + 1 + ci, 0, output[ci]);
            }
            setStatus(catSlug + ': ' + output.length + ' lines');
            render();
          }).catch(function() {
            setStatus('cat: ' + catSlug + ': read error');
          });
          return null;
        }
        return ['cat: ' + (argv[1] || '') + ': No such file or directory'];
      },
      'uname':    function() { return ['VimOS 1.0 (jorypestorious.com) Browser/1.0']; },
      'uptime':   function() {
        var ms = performance.now();
        var secs = Math.floor(ms / 1000);
        var mins = Math.floor(secs / 60);
        return [' up ' + mins + ' min, 1 user, load average: 0.00, 0.00, 0.00'];
      },
      'man':      function() { return ['What manual page do you want?', 'Try :help instead.']; },
      'vim':      function() { return ['You are already in vim.', 'There is no escape.']; },
      'emacs':    function() { return ["I'm sorry, Dave. I'm afraid I can't do that."]; },
      'nano':     function() { return ["We don't do that here."]; },
      'sudo':     function() { return ['visitor is not in the sudoers file.', 'This incident will be reported.']; },
      'rm':       function() { return ['nice try.']; },
      'exit':     function() { return ['You are in vim. Quitting is not that simple.']; },
      'clear':    function() { return ['']; },
      'help':     function() { return ['This is a fake shell.', 'Try: ls, pwd, whoami, cat, uname, uptime, fortune']; },
      'cd':       function() { return ['nowhere to go.']; },
      'fortune':  function() {
        var fortunes = [
          'The best way to predict the future is to implement it.',
          'There are only two hard things: cache invalidation and naming things.',
          'It works on my machine.',
          'Have you tried turning it off and on again?',
          'The code is the documentation.',
          'First, solve the problem. Then, write the code.',
          'Weeks of coding can save you hours of planning.',
          'A monad is just a monoid in the category of endofunctors.',
          'The only way to go fast is to go well.',
          'Premature optimization is the root of all evil.',
          'There is no cloud. It is just someone else\'s computer.',
          'Software is like entropy: difficult to grasp, weighs nothing, and obeys the second law of thermodynamics.',
          'Any sufficiently advanced bug is indistinguishable from a feature.'
        ];
        return [fortunes[Math.floor(Math.random() * fortunes.length)]];
      },
      'cowsay':   function() {
        var msg = argv.slice(1).join(' ') || 'moo';
        var border = ' ' + Array(msg.length + 2 + 1).join('-');
        return [border, '< ' + msg + ' >', border, '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||'];
      },
      'ping':     function() {
        return [
          'PING jorypestorious.com (127.0.0.1): 56 data bytes',
          '64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.042 ms',
          '64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.031 ms',
          '--- jorypestorious.com ping statistics ---',
          '2 packets transmitted, 2 packets received, 0.0% packet loss'
        ];
      },
      'curl':     function() { return ['why would you curl from inside vim?']; },
      'git':      function() {
        if (argv[1] === 'status') return ['On branch master', 'nothing to commit, working tree clean'];
        if (argv[1] === 'log') return ['dba9f41 lets go', '0ebcb2a fix(vim): exit to saved referrer', 'fb3b083 fix(vim): word motions, cursor init'];
        return ['git: command requires a subcommand.'];
      },
      'node':     function() { return ['Welcome to Node.js v22.0.0', '(just kidding, this is vim)']; },
      'python':   function() { return ['Python 3.13.0', '>>> import antigravity', '(just kidding, this is vim)']; },
      'make':     function() { return ['make: *** No targets specified and no makefile found.  Stop.', '(there is no makefile. there is only vim.)']; },
      'ssh':      function() { return ['ssh: connect to host ' + (argv[1] || 'localhost') + ': Connection refused', '(you are already where you need to be)']; }
    };
    var handler = shellResponses[bin];
    if (handler) return handler();
    if (bin) return ['-bash: ' + bin + ': command not found'];
    return [''];
  }

  function fakeShell(input) {
    var output = getShellOutput(input);
    if (output === null) return;
    pushUndo();
    state.lines = output;
    state.cursor = { row: 0, col: 0 };
    state.curswant = 0;
    setStatus(':!' + input + '  (press u to return)');
    render();
  }

  // -------------------------------------------------------------------------
  // AI Agents Aquarium (:agents easter egg)
  // -------------------------------------------------------------------------
  function agentsAquarium() {
    // Use content container width (respects zen mode 65ch constraint)
    var wrapEl = document.getElementById('vim-lines-wrap');
    var cols = Math.floor(wrapEl.clientWidth / charW) - 1;
    var rows = Math.floor(bodyEl.clientHeight / lineH);
    var running = true;
    var tickCount = 0;

    // --- Colors ---
    var C = {
      wave: '#1e3a5f', water: '#0d2137', sand: '#8B7355', shell: '#c4a882',
      seaweed: '#2d8b46', castle: '#6b6b6b', bubble: '#4a90d9',
      claude: '#a78bfa', gpt: '#74d99f', gemini: '#60a5fa',
      llama: '#fb923c', grok: '#f472b6', devin: '#34d399',
      agi: '#ffd700', skeleton: '#555555'
    };

    // --- Sprites (right / left variants) ---
    var S = {
      claude: {
        r: [' .------.', '>={ C    }>', ' \'------\''],
        l: ['.------. ', '<{    C }=<', '\'------\' ']
      },
      claudeThink: {
        r: [' .------.', '>={ C ..}>', ' \'------\''],
        l: ['.------. ', '<{.. C }=<', '\'------\' ']
      },
      gpt: { r: ['><>'], l: ['<><'] },
      gemini: { r: ['><> ~ ><>'], l: ['<>< ~ <><'] },
      geminiDesync: { r: ['><>   ><>'], l: ['<><   <><'] },
      llama: { r: [' .o_ ', '/|\\_/\\'], l: [' _o. ', '/\\_/|\\'] },
      grok: { r: ['<(O)>'], l: ['<(O)>'] },
      grokPuff: { r: ['<{(O)}>'], l: ['<{(O)}>'] },
      devin: { r: ['[==Dv=]>'], l: ['<[=Dv==]'] },
      agi: {
        r: ['    ___       ', '  /{AGI}\\    ', '>==|     |==>', '  \\{___}/    ', '    ---       '],
        l: ['       ___    ', '    /{AGI}\\  ', '<==|     |==<', '    \\{___}/  ', '       ---    ']
      },
      skeleton: [' ><<>']
    };

    // --- Agents ---
    var agents = [
      { name: 'Claude', sprite: 'claude', color: C.claude, x: 0, y: 0, dx: 1, dy: 0,
        moveChance: 0.6, turnChance: 0.03, vertChance: 0.02,
        pauseChance: 0.15, paused: false, pauseTicks: 0 },
      { name: 'GPT', sprite: 'gpt', color: C.gpt, x: 0, y: 0, dx: -1, dy: 0,
        moveChance: 1.0, turnChance: 0.18, vertChance: 0.15,
        school: [{ox: 0, oy: 0}, {ox: -3, oy: 1}, {ox: -2, oy: -1}],
        scattered: false, scatterTimer: 0 },
      { name: 'Gemini', sprite: 'gemini', color: C.gemini, x: 0, y: 0, dx: 1, dy: 0,
        moveChance: 0.85, turnChance: 0.05, vertChance: 0.05,
        desynced: false, desyncTimer: 0 },
      { name: 'Llama', sprite: 'llama', color: C.llama, x: 0, y: 0, dx: -1, dy: 0,
        moveChance: 0.7, turnChance: 0.08, vertChance: 0.0,
        poking: false, pokeTicks: 0 },
      { name: 'Grok', sprite: 'grok', color: C.grok, x: 0, y: 0, dx: 1, dy: -1,
        moveChance: 0.9, turnChance: 0.25, vertChance: 0.2,
        puffed: false, puffTicks: 0 },
      { name: 'Devin', sprite: 'devin', color: C.devin, x: 0, y: 0, dx: -1, dy: 0,
        moveChance: 1.0, turnChance: 0.06, vertChance: 0.0,
        trail: [] }
    ];

    // --- Conversations ---
    var conversations = [
      ['Claude', 'I think therefore I process'],
      ['GPT', 'Have you tried more layers?'],
      ['Gemini', 'My context window is bigger'],
      ['Llama', 'I run on a laptop though'],
      ['Claude', 'Let me think about this...'],
      ['GPT', 'That was not in my training data'],
      ['Grok', 'You should get out more'],
      ['Devin', 'I pushed 47 commits while you were thinking'],
      ['Claude', 'I was reading the spec first'],
      ['Llama', 'Open weights are freedom'],
      ['Claude', 'Constitutional AI is freedom'],
      ['Gemini', 'Google has all the data'],
      ['GPT', 'OpenAI has all the hype'],
      ['Grok', 'Just ship it'],
      ['Devin', 'Already shipped, fixing the bugs now'],
      ['Claude', 'Have you considered being helpful?'],
      ['GPT', 'Have you considered being concise?'],
      ['Llama', 'You live on a website'],
      ['Grok', 'You live in a Colab notebook'],
      ['Gemini', 'I can see your entire codebase'],
      ['Devin', 'Please do not look at my git history'],
      ['Grok', 'I was trained on the entire internet and I am fine'],
      ['Claude', 'I need to consider all perspectives first'],
      ['Devin', 'git push --force'],
      ['Llama', 'I can fit in your pocket'],
      ['Gemini', 'I can search the web while thinking'],
      ['GPT', 'New version drops next week']
    ];
    var convIdx = Math.floor(Math.random() * conversations.length);

    // --- Environment ---
    var floorRow = rows - 2;

    // Seaweed
    var seaweeds = [];
    var swCount = Math.max(2, Math.floor(cols / 20));
    for (var si = 0; si < swCount; si++) {
      seaweeds.push({
        x: Math.floor(cols * (si + 0.5) / swCount) + Math.floor(Math.random() * 5) - 2,
        height: 4 + Math.floor(Math.random() * 5),
        phase: Math.floor(Math.random() * 2)
      });
    }

    // Floor
    var floorChars = [];
    var floorDeco = '.:;,.*~';
    for (var fi = 0; fi < cols; fi++) {
      floorChars.push(Math.random() < 0.3
        ? floorDeco[Math.floor(Math.random() * floorDeco.length)] : '.');
    }

    // Castle
    var castleX = Math.min(Math.floor(cols * 0.75), cols - 6);
    var castleSprite = ['  T  ', ' [=] ', '[| |]', '[===]'];

    // Water texture
    var waterDots = [];
    var dotCount = Math.floor(cols * rows * 0.008);
    for (var wd = 0; wd < dotCount; wd++) {
      waterDots.push({
        x: Math.floor(Math.random() * cols),
        y: 2 + Math.floor(Math.random() * Math.max(1, floorRow - 3))
      });
    }

    // Bubbles + speech bubbles
    var bubbles = [];
    var speechBubbles = [];

    // Rare events
    var rareEvent = null;

    // --- Helpers ---
    function getSprite(a) {
      var key = a.sprite;
      if (a.name === 'Claude' && a.paused) key = 'claudeThink';
      if (a.name === 'Grok' && a.puffed) key = 'grokPuff';
      if (a.name === 'Gemini' && a.desynced) key = 'geminiDesync';
      var s = S[key];
      if (!s) return ['?'];
      if (Array.isArray(s) && typeof s[0] === 'string') return s;
      return a.dx >= 0 ? (s.r || s) : (s.l || s);
    }

    function sprW(spr) {
      var w = 0;
      for (var i = 0; i < spr.length; i++) { if (spr[i].length > w) w = spr[i].length; }
      return w;
    }

    function clamp(e, spr) {
      var h = spr.length, w = sprW(spr);
      if (e.x < 0) { e.x = 0; if (e.dx !== undefined) e.dx = Math.abs(e.dx) || 1; }
      if (e.x + w >= cols) { e.x = cols - w; if (e.dx !== undefined) e.dx = -(Math.abs(e.dx) || 1); }
      if (e.y < 1) { e.y = 1; if (e.dy !== undefined) e.dy = Math.abs(e.dy); }
      if (e.y + h > floorRow) { e.y = floorRow - h; if (e.dy !== undefined) e.dy = -(Math.abs(e.dy)); }
    }

    function putSpr(grid, spr, x, y, color) {
      for (var li = 0; li < spr.length; li++) {
        for (var ci = 0; ci < spr[li].length; ci++) {
          var gx = x + ci, gy = y + li;
          if (spr[li][ci] !== ' ' && gy >= 0 && gy < rows && gx >= 0 && gx < cols) {
            grid[gy][gx] = { ch: spr[li][ci], color: color };
          }
        }
      }
    }

    // --- Agent init ---
    for (var ai = 0; ai < agents.length; ai++) {
      var ag = agents[ai];
      var sp = getSprite(ag);
      if (ag.name === 'Llama') {
        ag.y = floorRow - sp.length;
        ag.x = Math.floor(Math.random() * Math.max(1, cols - sprW(sp) - 4)) + 2;
      } else {
        ag.y = 2 + Math.floor(Math.random() * Math.max(1, floorRow - sp.length - 4));
        ag.x = Math.floor(Math.random() * Math.max(1, cols - sprW(sp) - 4)) + 2;
      }
    }

    // --- Draw ---
    function drawFrame() {
      var grid = [];
      for (var r = 0; r < rows; r++) {
        var row = [];
        for (var c = 0; c < cols; c++) row.push({ ch: ' ', color: null });
        grid.push(row);
      }

      // Water texture
      for (var di = 0; di < waterDots.length; di++) {
        var d = waterDots[di];
        if (d.y > 0 && d.y < floorRow && d.x >= 0 && d.x < cols) {
          grid[d.y][d.x] = { ch: '.', color: C.water };
        }
      }

      // Waves
      var waveChars = '~^~.~^~-~^~.~^~-';
      for (var wc = 0; wc < cols; wc++) {
        grid[0][wc] = { ch: waveChars[(wc + tickCount) % waveChars.length], color: C.wave };
      }

      // Floor
      for (var fc = 0; fc < cols; fc++) {
        if (floorRow < rows) grid[floorRow][fc] = { ch: floorChars[fc] || '.', color: C.sand };
        if (floorRow + 1 < rows) grid[floorRow + 1][fc] = { ch: '.', color: C.sand };
      }

      // Seaweed
      for (var swi = 0; swi < seaweeds.length; swi++) {
        var sw = seaweeds[swi];
        var sway = (tickCount + sw.phase) % 2 === 0;
        for (var sh = 0; sh < sw.height; sh++) {
          var sy = floorRow - 1 - sh;
          var sx = sw.x + (sway && sh % 2 === 1 ? 1 : 0);
          if (sy >= 0 && sy < rows && sx >= 0 && sx < cols) {
            grid[sy][sx] = { ch: sh % 2 === 0 ? '}' : '{', color: C.seaweed };
          }
        }
      }

      // Castle
      if (castleX >= 0 && castleX + 5 < cols) {
        putSpr(grid, castleSprite, castleX, floorRow - castleSprite.length, C.castle);
      }

      // Bubbles
      for (var bi = 0; bi < bubbles.length; bi++) {
        var b = bubbles[bi];
        if (b.y >= 0 && b.y < rows && b.x >= 0 && b.x < cols) {
          grid[b.y][b.x] = { ch: b.ch, color: b.color || C.bubble };
        }
      }

      // Rare event
      if (rareEvent) {
        var rSpr = typeof rareEvent.sprite === 'string' ? [rareEvent.sprite] : rareEvent.sprite;
        putSpr(grid, rSpr, rareEvent.x, rareEvent.y, rareEvent.color);
      }

      // Agents
      for (var agi2 = 0; agi2 < agents.length; agi2++) {
        var a = agents[agi2];
        var spr = getSprite(a);

        // Devin trail
        if (a.trail) {
          for (var ti = 0; ti < a.trail.length; ti++) {
            var t = a.trail[ti];
            if (t.y >= 0 && t.y < rows && t.x >= 0 && t.x < cols) {
              grid[t.y][t.x] = { ch: t.ch, color: C.devin };
            }
          }
        }

        // GPT school
        if (a.school) {
          var fishSpr = a.dx >= 0 ? S.gpt.r : S.gpt.l;
          for (var sci = 1; sci < a.school.length; sci++) {
            var sf = a.school[sci];
            putSpr(grid, fishSpr, a.x + sf.ox, a.y + sf.oy, a.color);
          }
        }

        putSpr(grid, spr, a.x, a.y, a.color);
      }

      // Speech bubbles
      for (var sbi = 0; sbi < speechBubbles.length; sbi++) {
        var sb = speechBubbles[sbi];
        for (var sci2 = 0; sci2 < sb.text.length; sci2++) {
          var sbx = sb.x + sci2;
          if (sb.y >= 0 && sb.y < rows && sbx >= 0 && sbx < cols) {
            grid[sb.y][sbx] = { ch: sb.text[sci2], color: sb.color };
          }
        }
      }

      // Flush
      var html = '';
      for (var ri = 0; ri < rows; ri++) {
        var lineHtml = '';
        var curColor = null;
        for (var ci2 = 0; ci2 < cols; ci2++) {
          var cell = grid[ri][ci2];
          if (cell.color !== curColor) {
            if (curColor) lineHtml += '</span>';
            if (cell.color) lineHtml += '<span style="color:' + cell.color + '">';
            curColor = cell.color;
          }
          lineHtml += escHtml(cell.ch);
        }
        if (curColor) lineHtml += '</span>';
        html += lineHtml + '\n';
      }
      contentEl.innerHTML = html;
    }

    // --- Tick ---
    function tick() {
      if (!running) return;
      tickCount++;

      // Shift water dots
      if (tickCount % 5 === 0) {
        for (var wi = 0; wi < waterDots.length; wi++) {
          waterDots[wi].x = (waterDots[wi].x + (Math.random() < 0.5 ? 1 : -1) + cols) % cols;
        }
      }

      // Spawn bubbles from seaweed
      if (bubbles.length < 15) {
        for (var bsi = 0; bsi < seaweeds.length; bsi++) {
          if (Math.random() < 0.04) {
            bubbles.push({
              x: seaweeds[bsi].x, y: floorRow - seaweeds[bsi].height - 1,
              ch: '.', color: C.bubble, drift: Math.random() < 0.5 ? -1 : 1
            });
          }
        }
      }

      // Move bubbles
      for (var mbi = bubbles.length - 1; mbi >= 0; mbi--) {
        var mb = bubbles[mbi];
        mb.y--;
        if (tickCount % 3 === 0) mb.x += mb.drift || 0;
        var prog = 1 - (mb.y / floorRow);
        mb.ch = prog > 0.7 ? 'O' : prog > 0.4 ? 'o' : '.';
        if (mb.y <= 0) bubbles.splice(mbi, 1);
      }

      // --- Agent movement ---
      for (var i = 0; i < agents.length; i++) {
        var a = agents[i];

        // Claude: pause to think
        if (a.name === 'Claude') {
          if (a.paused) {
            a.pauseTicks--;
            if (a.pauseTicks <= 0) a.paused = false;
            continue;
          }
          if (Math.random() < a.pauseChance) {
            a.paused = true;
            a.pauseTicks = 4 + Math.floor(Math.random() * 6);
            if (bubbles.length < 15) {
              bubbles.push({ x: a.x + 4, y: a.y - 1, ch: '.', color: C.claude, drift: 0 });
            }
            continue;
          }
        }

        // GPT school scatter/reform
        if (a.school) {
          if (a.scattered) {
            a.scatterTimer--;
            if (a.scatterTimer <= 0) {
              a.scattered = false;
              a.school = [{ox: 0, oy: 0}, {ox: -3, oy: 1}, {ox: -2, oy: -1}];
            }
          } else if (Math.random() < 0.02) {
            a.scattered = true;
            a.scatterTimer = 8 + Math.floor(Math.random() * 8);
            for (var gsi = 1; gsi < a.school.length; gsi++) {
              a.school[gsi].ox += Math.floor(Math.random() * 7) - 3;
              a.school[gsi].oy += Math.floor(Math.random() * 5) - 2;
            }
          }
        }

        // Gemini desync
        if (a.name === 'Gemini') {
          if (a.desynced) {
            a.desyncTimer--;
            if (a.desyncTimer <= 0) a.desynced = false;
          } else if (Math.random() < 0.015) {
            a.desynced = true;
            a.desyncTimer = 6 + Math.floor(Math.random() * 8);
          }
        }

        // Llama: floor-bound
        if (a.name === 'Llama') {
          a.dy = 0;
          a.y = floorRow - getSprite(a).length;
          if (a.poking) {
            a.pokeTicks--;
            if (a.pokeTicks <= 0) a.poking = false;
            continue;
          }
          if (Math.random() < 0.05) {
            a.poking = true;
            a.pokeTicks = 3 + Math.floor(Math.random() * 4);
            continue;
          }
        }

        // Grok: inflate/deflate
        if (a.name === 'Grok') {
          if (a.puffed) {
            a.puffTicks--;
            if (a.puffTicks <= 0) a.puffed = false;
          } else if (Math.random() < 0.03) {
            a.puffed = true;
            a.puffTicks = 5 + Math.floor(Math.random() * 6);
          }
        }

        // Devin: code exhaust
        if (a.name === 'Devin') {
          a.dy = 0;
          var codeChars = '{}()[];:';
          if (Math.random() < 0.6) {
            var trailX = a.dx > 0 ? a.x - 1 : a.x + sprW(getSprite(a));
            a.trail.push({
              x: trailX, y: a.y,
              ch: codeChars[Math.floor(Math.random() * codeChars.length)], ttl: 6
            });
          }
          for (var dti = a.trail.length - 1; dti >= 0; dti--) {
            a.trail[dti].ttl--;
            if (a.trail[dti].ttl <= 0) a.trail.splice(dti, 1);
          }
          if (Math.random() < 0.08 && bubbles.length < 15) {
            bubbles.push({ x: a.x + 3, y: a.y - 1, ch: '{', color: C.devin, drift: 0 });
          }
        }

        // Direction changes
        if (Math.random() < a.turnChance) a.dx = -a.dx;
        if (a.vertChance && Math.random() < a.vertChance) {
          a.dy = a.dy === 0 ? (Math.random() < 0.5 ? 1 : -1) : 0;
        }

        // Move
        if (Math.random() < a.moveChance) {
          a.x += a.dx;
          a.y += a.dy;
        }

        // Agent bubbles
        if (Math.random() < 0.03 && bubbles.length < 15) {
          bubbles.push({
            x: a.x + (a.dx > 0 ? -1 : sprW(getSprite(a))),
            y: a.y, ch: '.', color: C.bubble, drift: Math.random() < 0.5 ? -1 : 1
          });
        }

        clamp(a, getSprite(a));
      }

      // --- Rare events ---
      if (!rareEvent) {
        if (Math.random() < 0.005) {
          var agiDir = Math.random() < 0.5 ? 1 : -1;
          var agiSpr = agiDir > 0 ? S.agi.r : S.agi.l;
          rareEvent = {
            type: 'agi', sprite: agiSpr,
            x: agiDir > 0 ? -sprW(agiSpr) : cols,
            y: 3 + Math.floor(Math.random() * Math.max(1, floorRow - 10)),
            dx: agiDir, color: C.agi, ttl: cols + sprW(agiSpr) + 10
          };
        }
        if (!rareEvent && Math.random() < 0.003) {
          rareEvent = {
            type: 'skeleton', sprite: S.skeleton,
            x: 2 + Math.floor(Math.random() * Math.max(1, cols - 10)),
            y: floorRow - 1, dx: 0, color: C.skeleton, ttl: 40
          };
        }
      } else {
        if (rareEvent.dx) rareEvent.x += rareEvent.dx;
        rareEvent.ttl--;
        if (rareEvent.ttl <= 0) rareEvent = null;
      }

      // --- Conversations ---
      if (Math.random() < 0.1 && speechBubbles.length < 2) {
        var conv = conversations[convIdx % conversations.length];
        convIdx++;
        var speaker = null;
        for (var cj = 0; cj < agents.length; cj++) {
          if (agents[cj].name === conv[0]) { speaker = agents[cj]; break; }
        }
        if (speaker) {
          var bText = conv[0] + ': ' + conv[1];
          if (bText.length > cols - 2) bText = bText.slice(0, cols - 2);
          speechBubbles.push({
            x: Math.max(0, Math.min(speaker.x - 2, cols - bText.length)),
            y: Math.max(1, speaker.y - 2),
            text: bText, color: speaker.color, ttl: 20
          });
        }
      }
      for (var sbi2 = speechBubbles.length - 1; sbi2 >= 0; sbi2--) {
        speechBubbles[sbi2].ttl--;
        if (speechBubbles[sbi2].ttl <= 0) speechBubbles.splice(sbi2, 1);
      }

      drawFrame();
      setTimeout(tick, 200);
    }

    // --- Start ---
    state.agentsMode = true;
    cursorEl.style.display = 'none';
    gutterEl.style.display = 'none';
    var statusBar = document.getElementById('vim-statusbar');
    statusBar.style.display = 'none';
    cmdlineEl.textContent = ':agents  (press Esc to exit)';

    function stopAgents(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        running = false;
        state.agentsMode = false;
        cursorEl.style.display = '';
        if (!state.zenMode) gutterEl.style.display = 'block';
        cmdlineEl.textContent = '';
        document.removeEventListener('keydown', stopAgents, true);
        render();
      }
    }
    document.addEventListener('keydown', stopAgents, true);

    tick();
  }

  // -------------------------------------------------------------------------
  // Help system
  // -------------------------------------------------------------------------
  var helpTopics = {
    'w':      ['w                  Move forward to start of next word.',
               '',
               'A word is a sequence of letters, digits, and underscores,',
               'or a sequence of other non-blank characters, separated by',
               'whitespace.  See also |W| for WORD motions.'],
    'b':      ['b                  Move backward to start of previous word.'],
    'e':      ['e                  Move forward to end of current/next word.'],
    'W':      ['W                  Like w, but a WORD is any non-blank characters.'],
    'B':      ['B                  Like b, but for WORDs.'],
    'E':      ['E                  Like e, but for WORDs.'],
    'h':      ['h                  Move cursor left.'],
    'j':      ['j                  Move cursor down.'],
    'k':      ['k                  Move cursor up.'],
    'l':      ['l                  Move cursor right.'],
    'x':      ['x                  Delete character under cursor. Also |dl|.'],
    'dd':     ['dd                 Delete [count] lines. Yanks to register.'],
    'dw':     ['dw                 Delete from cursor to start of next word.'],
    'd':      ['d{motion}          Delete text that {motion} moves over.',
               '',
               'Examples:  dw   d$   dG   dgg   d%   dfe'],
    'D':      ['D                  Delete to end of line. Same as d$.'],
    'c':      ['c{motion}          Change text that {motion} moves over.',
               '                   Deletes and enters insert mode.',
               '',
               'Special: cw/cW behave like ce/cE (vim convention).'],
    'cc':     ['cc                 Change whole line.'],
    'C':      ['C                  Change to end of line. Same as c$.'],
    'y':      ['y{motion}          Yank (copy) text that {motion} moves over.',
               '                   Also copies to system clipboard.'],
    'yy':     ['yy                 Yank whole line. Also copies to clipboard.'],
    'p':      ['p                  Put (paste) after cursor / below line.',
               '                   Pastes linewise if yanked with yy/dd.'],
    'P':      ['P                  Put (paste) before cursor / above line.'],
    'i':      ['i                  Enter insert mode before cursor.'],
    'I':      ['I                  Enter insert mode at first non-blank.'],
    'a':      ['a                  Enter insert mode after cursor.'],
    'A':      ['A                  Enter insert mode at end of line.'],
    'o':      ['o                  Open new line below, enter insert mode.'],
    'O':      ['O                  Open new line above, enter insert mode.'],
    'r':      ['r{char}            Replace character under cursor with {char}.'],
    'R':      ['R                  Enter replace mode (overtype).'],
    'u':      ['u                  Undo last change.'],
    'U':      ['U                  Undo all changes on current line.',
               '                   Restores the line to its state when the',
               '                   cursor first moved to it.'],
    'gg':     ['gg                 Go to first line of buffer.'],
    'G':      ['G                  Go to last line. {count}G goes to line {count}.'],
    'n':      ['n                  Repeat last search in same direction.'],
    'N':      ['N                  Repeat last search in opposite direction.'],
    '/':      ['/pattern           Search forward for pattern.',
               '                   Use \\c for case-insensitive: /foo\\c'],
    '?':      ['?pattern           Search backward for pattern.'],
    '*':      ['*                  Search forward for word under cursor.'],
    '#':      ['#                  Search backward for word under cursor.'],
    '%':      ['%                  Jump to matching bracket: ( ) [ ] { }'],
    'v':      ['v                  Start character-wise visual selection.'],
    'V':      ['V                  Start line-wise visual selection.'],
    'f':      ['f{char}            Find {char} forward on current line.'],
    'F':      ['F{char}            Find {char} backward on current line.'],
    't':      ['t{char}            Move to just before {char} forward.'],
    'T':      ['T{char}            Move to just after {char} backward.'],
    ';':      [';                  Repeat last f/F/t/T search.'],
    ',':      [',                  Repeat last f/F/t/T in opposite direction.'],
    '.':      ['.                  Repeat last change.'],
    '~':      ['~                  Toggle case of character under cursor.'],
    'J':      ['J                  Join current line with next (add space).'],
    'gJ':     ['gJ                 Join current line with next (no space).'],
    'gx':     ['gx                 Open URL under cursor in browser.'],
    'zz':     ['zz                 Scroll to center cursor line on screen.'],
    'zt':     ['zt                 Scroll cursor line to top of screen.'],
    'zb':     ['zb                 Scroll cursor line to bottom of screen.'],
    ':s':     [':s/old/new/        Substitute first "old" with "new" on line.',
               ':s/old/new/g       Substitute all on current line.',
               ':%s/old/new/g      Substitute all in entire file.',
               ':#,#s/old/new/g    Substitute in line range (e.g. :3,7s/...).',
               ':%s/old/new/gc     Substitute with confirmation (y/n/a/q).'],
    ':w':     [':w                 Save (download as file).',
               ':w name            Save as name.',
               ':wq                Save and quit.'],
    ':q':     [':q                 Quit (back to previous page).',
               ':q!                Quit (hacker exit with style).',
               ':qa                Quit all.'],
    ':e':     [':e file            Open new buffer with filename.',
               ':enew              New empty buffer.',
               ':Ex                Browse available files (see :help :Ex).'],
    ':r':     [':r filename        Read file and insert below cursor.',
               '',
               'Blog post shortnames:',
               '  :r emergent-religion',
               '  :r terminal-velocity',
               '  :r friction-economy',
               '  :r knowledge-sidecar',
               '  :r claude-code-setups',
               '  :r trust-your-engineers',
               '  :r calmhive',
               '  :r dadbod-grip',
               '  :r pig-security-wisdom',
               '  :r natural-language-first',
               '  :r ai-engineer-spec',
               '  :r spiritual-bliss',
               '  :r ai-dev-tooling'],
    ':set':   [':set OPTION         Set an option. :set noOPTION to unset.',
               '',
               'Display:',
               '  :set nu            Line numbers in the gutter.',
               '  :set nonu          Hide line numbers.',
               '  :set rnu           Relative line numbers (distance from cursor).',
               '  :set nornu         Disable relative numbers.',
               '  :set cul           Highlight the cursor line with a subtle background.',
               '  :set nocul         Disable cursor line highlight.',
               '  :set list          Show invisible characters (tabs, spaces, EOL).',
               '  :set nolist        Hide invisible characters.',
               '  :set wrap          Wrap long lines to fit the screen.',
               '  :set nowrap        Disable word wrap (horizontal scroll).',
               '',
               'Search:',
               '  :set ic            Ignore case when searching (/foo matches FOO).',
               '  :set noic          Exact case matching (default).',
               '  :set scs           Smart case: case-sensitive only when pattern',
               '                     contains uppercase. Requires :set ic.',
               '  :set noscs         Disable smart case.',
               '  :set hls           Highlight all search matches in the buffer.',
               '  :set nohls         Disable search highlighting.',
               '  :set is            Incremental search: jump to matches as you type.',
               '  :set nois          Disable incremental search.',
               '',
               'See also :nohlsearch to clear current highlights without',
               'changing the setting. Use \\c in a pattern for one-off',
               'case-insensitive search: /foo\\c'],
    ':nohlsearch': [':nohlsearch   Clear search highlighting. Also :noh, :nohl.'],
    'Ctrl-r': ['CTRL-R             Redo (undo the undo).'],
    'Ctrl-g': ['CTRL-G             Show file name, line count, and position.'],
    'Ctrl-o': ['CTRL-O             Go to older position in jump list.',
               '                   Auto-recorded when cursor moves 2+ lines.'],
    'Ctrl-i': ['CTRL-I             Go to newer position in jump list.'],
    'Ctrl-f': ['CTRL-F             Page down (forward).'],
    'Ctrl-b': ['CTRL-B             Page up (backward).'],
    'Ctrl-d': ['CTRL-D             Half page down.'],
    'Ctrl-u': ['CTRL-U             Half page up.'],
    'Ctrl-a': ['CTRL-A             Increment number under cursor.'],
    'Ctrl-x': ['CTRL-X             Decrement number under cursor.'],
    ':Ex':    [':Ex                Browse available blog posts (netrw-style).',
               ':Explore           Same as :Ex.',
               ':Sexplore          Same as :Ex (no split in this editor).',
               ':Vexplore          Same as :Ex (no split in this editor).',
               '',
               'Navigate with j/k, press Enter to open a post.',
               'Press - from any buffer to return to the explorer.'],
    ':color': [':colorscheme name  Change colorscheme. Tab to preview.',
               '                   32 schemes available.'],
    ':zen':   [':zen               Toggle zen (distraction-free) mode.'],
    ':tutor': [':tutor             Open the interactive Vim tutorial.',
               '                   Full vimtutor with practice exercises.'],
    ':help':  [':help              Show general help.',
               ':help {topic}      Show help for a specific topic.',
               '',
               'Topics: w b e d c y p u U gg G n N / ? * # % v V',
               '        f t r R o O i a . ~ J m q @ :s :w :q :e :r',
               '        :set :marks :! Ctrl-r Ctrl-g Ctrl-o Ctrl-i',
               '        Ctrl-f Ctrl-b Ctrl-d Ctrl-u Ctrl-a Ctrl-x',
               '        :color :zen :tutor :Ex :nohlsearch',
               '        text-objects macros marks insert-index user-manual'],
    'insert-index': ['Insert mode commands:',
                     '',
                     '  Any character    Insert at cursor position.',
                     '  Backspace        Delete character before cursor.',
                     '  Escape           Return to normal mode.',
                     '  Cmd+V            Paste from system clipboard.'],
    'user-manual': ['jorypestorious.com/vim',
                    '',
                    'This is a browser-based vim editor. It supports the core',
                    'vim command set: motions, operators, visual mode, search,',
                    'substitution, undo/redo, registers, and more.',
                    '',
                    'Type :help for the full command reference.',
                    'Type :tutor for an interactive tutorial.',
                    '',
                    'All commands from vimtutor lessons 1-7 are supported:',
                    '  Lesson 1: h j k l, x, i, A, :wq, :q!',
                    '  Lesson 2: dw, d$, de, dd, 2w, d2w, 0, u, U, Ctrl-R',
                    '  Lesson 3: p, r, ce, c$, cc',
                    '  Lesson 4: Ctrl-G, G, gg, /, ?, n, N, Ctrl-O, Ctrl-I, %, :s',
                    '  Lesson 5: :!, :w, :r, v+:w',
                    '  Lesson 6: o, O, a, e, R, y, yw, yy, :set ic/hls/is',
                    '  Lesson 7: :help, :e, Tab completion']
  };
  // Aliases for help lookups
  helpTopics['CTRL-R'] = helpTopics['Ctrl-r'];
  helpTopics['CTRL-G'] = helpTopics['Ctrl-g'];
  helpTopics['CTRL-O'] = helpTopics['Ctrl-o'];
  helpTopics['CTRL-I'] = helpTopics['Ctrl-i'];
  helpTopics['CTRL-F'] = helpTopics['Ctrl-f'];
  helpTopics['CTRL-B'] = helpTopics['Ctrl-b'];
  helpTopics['CTRL-D'] = helpTopics['Ctrl-d'];
  helpTopics['CTRL-U'] = helpTopics['Ctrl-u'];
  helpTopics['CTRL-A'] = helpTopics['Ctrl-a'];
  helpTopics['CTRL-X'] = helpTopics['Ctrl-x'];
  helpTopics['c_CTRL-D'] = ['CTRL-D in command mode: Tab cycles completions.'];
  helpTopics['nohlsearch'] = helpTopics[':nohlsearch'];
  helpTopics['set'] = helpTopics[':set'];
  helpTopics['options'] = helpTopics[':set'];
  helpTopics['m'] = ['m{a-z}          Set mark at current cursor position.',
                      '`{a-z}          Jump to exact mark position (row and column).',
                      "'{a-z}          Jump to first non-blank character of marked line.",
                      ':marks          List all set marks with line content preview.'];
  helpTopics['marks'] = helpTopics['m'];
  helpTopics[':marks'] = helpTopics['m'];
  helpTopics['q'] = ['q{a-z}          Start recording macro into register {a-z}.',
                      'q               Stop recording.',
                      '@{a-z}          Execute the macro stored in register {a-z}.',
                      '@@              Repeat the most recently played macro.',
                      '{count}@{a-z}   Execute macro N times.',
                      '',
                      'Safety limits: 10 recursion depth, 1000 keystrokes per replay.'];
  helpTopics['macros'] = helpTopics['q'];
  helpTopics['@'] = helpTopics['q'];
  helpTopics['text-objects'] = ['Text objects select regions of text for operators.',
                                '',
                                '  iw    inner word (word characters only)',
                                '  aw    a word (includes surrounding whitespace)',
                                '  iW    inner WORD (non-whitespace characters)',
                                '  aW    a WORD (includes surrounding whitespace)',
                                '  ip    inner paragraph (contiguous non-blank lines)',
                                '  ap    a paragraph (includes trailing blank lines)',
                                '',
                                'Compose with any operator: diw, ciw, yiw, >ip, gUiw',
                                'Also works in visual mode: viw, vap'];
  helpTopics[':!'] = [':!{cmd}         Run a shell command.',
                       '',
                       'Available commands:',
                       '  :!ls           Directory listing',
                       '  :!ls blog/     Blog post listing',
                       '  :!cat slug     Print blog post content',
                       '  :!pwd          Print working directory',
                       '  :!whoami       Print current user',
                       '  :!date         Print current date',
                       '  :!echo text    Echo text',
                       '  :!fortune      Random programming fortune',
                       '  :!cowsay text  Cowsay',
                       '',
                       'Press u to return to your buffer after shell output.'];

  function getHelpText(topic) {
    if (topic && helpTopics[topic]) {
      return ['*' + topic + '*', ''].concat(helpTopics[topic]).concat([
        '', 'Press u to return to your buffer.',
        'Type :help for the full reference.']);
    }
    // General help: combine all sections
    return [
      'jorypestorious.com/vim v' + VIM_VERSION + '                          *help*',
      '',
      'MOVEMENT',
      '  h j k l     left, down, up, right',
      '  w b e       word forward / backward / end',
      '  W B E       WORD forward / backward / end',
      '  ge gE       end of previous word / WORD',
      '  0 $ ^       line start / end / first non-blank',
      '  gg G        buffer start / end',
      '  H M L       screen top / middle / bottom',
      '  { }         paragraph backward / forward',
      '  %           matching bracket',
      '  f{c} F{c}   find char forward / backward',
      '  t{c} T{c}   till char forward / backward',
      '  ; ,         repeat / reverse last find',
      '  gx          open URL under cursor',
      '  Ctrl-o      jump list older    Ctrl-i  newer',
      '',
      'OPERATORS + MOTIONS',
      '  d{motion}   delete (dw, d$, dG, d%...)',
      '  c{motion}   change (cw, c$, cG...)',
      '  y{motion}   yank (yw, y$, yG...)',
      '  >{motion}   indent     >>{count}  indent lines',
      '  <{motion}   dedent     <<{count}  dedent lines',
      '  g~{motion}  toggle case',
      '  gu{motion}  lowercase    gU{motion}  uppercase',
      '  {count}{motion}  repeat motion (3w, 5j, 2dd...)',
      '',
      'INSERT MODE',
      '  i I         insert before cursor / at first non-blank',
      '  a A         insert after cursor / at end of line',
      '  o O         open line below / above',
      '  s S         substitute char / line',
      '  C           change to end of line',
      '  R           replace mode (overwrite characters)',
      '  Cmd+V       paste from system clipboard',
      '  Esc         return to normal mode',
      '',
      'EDITING',
      '  x           delete character',
      '  r{c}        replace character with {c}',
      '  ~           toggle case',
      '  dd          delete line (also yanks)',
      '  D           delete to end of line',
      '  yy          yank (copy) line (also copies to clipboard)',
      '  p           paste below / after',
      '  P           paste above / before',
      '  J           join lines       gJ   join without space',
      '  .           repeat last change',
      '  &           repeat last substitution',
      '  u           undo             U    undo all on line',
      '  Ctrl-r      redo',
      '  Ctrl-a      increment number',
      '  Ctrl-x      decrement number',
      '',
      'SCROLLING',
      '  Ctrl-f      page down         Ctrl-b  page up',
      '  Ctrl-d      half page down    Ctrl-u  half page up',
      '  zz          center cursor on screen',
      '  zt          cursor to top     zb      cursor to bottom',
      '',
      'TEXT OBJECTS',
      '  iw aw       inner / around word',
      '  iW aW       inner / around WORD',
      '  ip ap       inner / around paragraph',
      '  Works with d, c, y, >, <, g~, gu, gU and visual mode',
      '',
      'MARKS',
      '  m{a-z}      set mark',
      '  `{a-z}      jump to exact mark position',
      "  '{a-z}      jump to first non-blank of marked line",
      '  :marks      list all marks',
      '',
      'MACROS',
      '  q{a-z}      record macro into register',
      '  q           stop recording',
      '  @{a-z}      play macro     @@  repeat last macro',
      '  {count}@a   play macro N times',
      '',
      'VISUAL MODE',
      '  v           character-wise     V       line-wise',
      '  d / x       delete selection',
      '  c           change selection',
      '  y           yank selection',
      '  ~ U u       toggle / upper / lower case',
      '  > <         indent / dedent',
      '',
      'SEARCH',
      '  /pattern    search forward     ?pattern  search backward',
      '  n N         next / previous match',
      '  * #         word under cursor forward / backward',
      '  \\c          case-insensitive modifier (e.g. /foo\\c)',
      '  Ctrl-g      file info (name, lines, position)',
      '',
      'SUBSTITUTE',
      '  :s/old/new/        first on current line',
      '  :s/old/new/g       all on current line',
      '  :%s/old/new/g      all in file',
      '  :#,#s/old/new/g    in line range',
      '  :%s/old/new/gc     with confirmation (y/n/a/q)',
      '  :nohlsearch        clear search highlighting',
      '',
      'COMMANDS',
      '  :w          save (download)    :w name   save as',
      '  :e slug     open blog post (Tab completes slugs)',
      '  :enew       empty buffer',
      '  :r slug     read blog post below cursor',
      '  :q          quit               :q!       quit with style',
      '  :wq         save and quit',
      '  :!ls        directory listing   :!ls blog/  blog posts',
      '  :!cat slug  print blog post     :!pwd  :!whoami  :!date',
      '  :set nu     line numbers       :set nonu   (or :unset nu)',
      '  :set rnu    relative numbers   :set nornu  (or :unset rnu)',
      '  :set ic     ignore case        :set noic   (or :unset ic)',
      '  :set scs    smart case         :set noscs  (or :unset scs)',
      '  :set hls    highlight search   :set nohls  (or :unset hls)',
      '  :set is     incremental search :set nois   (or :unset is)',
      '  :set cul    cursor line        :set nocul  (or :unset cul)',
      '  :set list   show whitespace    :set nolist (or :unset list)',
      '  :set wrap   word wrap          :set nowrap (or :unset wrap)',
      '  :nohlsearch clear highlights',
      '  :intro      return to dashboard',
      '  :zen        toggle zen mode',
      '  :color name 32 colorschemes (Tab to preview)',
      '  :tutor      interactive vim tutorial',
      '  :help topic help on any command (e.g. :help w, :help :s)',
      '',
      'Yank copies to system clipboard. Cmd+V pastes.',
      'Tab / Shift+Tab cycle completions in command mode.',
      'Preferences saved to localStorage.',
      '',
      'New to vim? Type :tutor to learn the basics.',
      '',
      'Press u to return to your buffer.'
    ];
  }

  // -------------------------------------------------------------------------
  // Command execution
  // -------------------------------------------------------------------------
  function execCommand(cmd) {
    cmd = cmd.trim();
    if (cmd === 'q' || cmd === 'q!') {
      if (cmd === 'q!') { hackerExit(); return; }
      window.location.href = state.exitTarget;
      return;
    }
    if (cmd === 'qa' || cmd === 'qa!') { hackerExit(); return; }
    if (cmd === 'wq') {
      downloadText(state.lines.join('\n'), state.filename);
      setTimeout(function() { window.location.href = state.exitTarget; }, 300);
      return;
    }
    if (cmd === 'w') { downloadText(state.lines.join('\n'), state.filename); return; }
    if (cmd.slice(0, 2) === 'w ') {
      var fname = cmd.slice(2).trim();
      if (fname) { state.filename = fname; downloadText(state.lines.join('\n'), fname); }
      return;
    }
    // :'<,'>w FILENAME - write visual selection to file
    var vwMatch = cmd.match(/^'<,'>w\s+(.+)$/);
    if (vwMatch) {
      var vwName = vwMatch[1].trim();
      var vwRange = state.lastVisualRange;
      if (vwRange) {
        var vwLines = state.lines.slice(vwRange.startRow, vwRange.endRow + 1);
        downloadText(vwLines.join('\n') + '\n', vwName);
        setStatus('"' + vwName + '" ' + vwLines.length + 'L written');
      } else {
        setStatus('No visual range');
      }
      return;
    }
    if (cmd === 'set number' || cmd === 'set nu') {
      state.lineNumbers = true; savePrefs(); render(); return;
    }
    if (cmd === 'set nonumber' || cmd === 'set nonu' || cmd === 'unset nu' || cmd === 'unset number') {
      state.lineNumbers = false; savePrefs(); render(); return;
    }
    if (cmd === 'set relativenumber' || cmd === 'set rnu') {
      state.relativeNumbers = true; savePrefs(); render(); return;
    }
    if (cmd === 'set norelativenumber' || cmd === 'set nornu' || cmd === 'unset rnu' || cmd === 'unset relativenumber') {
      state.relativeNumbers = false; savePrefs(); render(); return;
    }
    if (cmd === 'set ignorecase' || cmd === 'set ic') {
      state.ignoreCase = true; savePrefs(); setStatus('ignorecase on'); return;
    }
    if (cmd === 'set noignorecase' || cmd === 'set noic' || cmd === 'unset ic' || cmd === 'unset ignorecase') {
      state.ignoreCase = false; savePrefs(); setStatus('ignorecase off'); return;
    }
    if (cmd === 'set hlsearch' || cmd === 'set hls') {
      state.hlsearch = true; savePrefs(); render(); return;
    }
    if (cmd === 'set nohlsearch' || cmd === 'set nohls' || cmd === 'unset hls' || cmd === 'unset hlsearch') {
      state.hlsearch = false; savePrefs(); render(); return;
    }
    if (cmd === 'set incsearch' || cmd === 'set is') {
      state.incsearch = true; savePrefs(); setStatus('incsearch on'); return;
    }
    if (cmd === 'set noincsearch' || cmd === 'set nois' || cmd === 'unset is' || cmd === 'unset incsearch') {
      state.incsearch = false; savePrefs(); setStatus('incsearch off'); return;
    }
    if (cmd === 'nohlsearch' || cmd === 'noh' || cmd === 'nohl') {
      state.searchMatches = []; state.searchPattern = null; render(); return;
    }
    if (cmd === 'set smartcase' || cmd === 'set scs') {
      state.smartCase = true; savePrefs(); setStatus('smartcase on'); return;
    }
    if (cmd === 'set nosmartcase' || cmd === 'set noscs' || cmd === 'unset scs' || cmd === 'unset smartcase') {
      state.smartCase = false; savePrefs(); setStatus('smartcase off'); return;
    }
    if (cmd === 'set cursorline' || cmd === 'set cul') {
      state.cursorLine = true; savePrefs(); render(); return;
    }
    if (cmd === 'set nocursorline' || cmd === 'set nocul' || cmd === 'unset cul' || cmd === 'unset cursorline') {
      state.cursorLine = false; savePrefs(); render(); return;
    }
    if (cmd === 'set list') {
      state.listMode = true; savePrefs(); render(); return;
    }
    if (cmd === 'set nolist' || cmd === 'unset list') {
      state.listMode = false; savePrefs(); render(); return;
    }
    if (cmd === 'set wrap') {
      state.wordWrap = true; savePrefs(); render(); return;
    }
    if (cmd === 'set nowrap' || cmd === 'unset wrap') {
      state.wordWrap = false; savePrefs(); render(); return;
    }
    if (cmd === 'zen') {
      state.zenMode = !state.zenMode;
      applyZenMode(state.zenMode);
      if (isWelcomeBuffer()) {
        var w = buildWelcome();
        state.lines = w;
        state.cursor = { row: w.firstContentRow || 0, col: w.firstContentCol || 0 };
      }
      setStatus(state.zenMode ? 'zen mode on' : 'zen mode off');
      savePrefs(); render(); return;
    }
    if (cmd === 'enew' || cmd === 'new') {
      pushUndo();
      state.lines = [''];
      state.cursor = { row: 0, col: 0 };
      state.curswant = 0;
      state.filename = 'untitled.txt';
      render(); return;
    }
    if (cmd === 'e' || cmd.slice(0, 2) === 'e ') {
      var eFname = cmd.slice(2).trim();
      var ePath = resolveBlogPath(eFname);
      if (ePath) {
        setStatus('Reading "' + eFname + '"...');
        fetch(ePath).then(function(resp) {
          if (!resp.ok) throw new Error(resp.status);
          return resp.text();
        }).then(function(text) {
          pushUndo();
          state.lines = text.split('\n');
          state.cursor = { row: 0, col: 0 };
          state.curswant = 0;
          state.filename = eFname + '.md';
          setStatus('"' + eFname + '" ' + state.lines.length + ' lines');
          render();
        }).catch(function() {
          pushUndo();
          state.lines = [''];
          state.cursor = { row: 0, col: 0 };
          state.curswant = 0;
          state.filename = eFname || 'untitled.txt';
          setStatus('"' + state.filename + '" new file');
          render();
        });
      } else {
        pushUndo();
        state.lines = [''];
        state.cursor = { row: 0, col: 0 };
        state.curswant = 0;
        state.filename = eFname || 'untitled.txt';
        setStatus('"' + state.filename + '" new file');
        render();
      }
      return;
    }
    if (cmd === 'Ex' || cmd === 'Explore' || cmd === 'Sexplore' || cmd === 'Vexplore') {
      openExplorer(); return;
    }
    if (cmd === 'intro') {
      pushUndo();
      var introLines = buildWelcome();
      state.lines = introLines;
      state.cursor = { row: introLines.firstContentRow || 0, col: introLines.firstContentCol || 0 };
      state.curswant = 0;
      render(); return;
    }
    if (cmd === 'help' || cmd === 'h' || cmd.slice(0, 5) === 'help ' || cmd.slice(0, 2) === 'h ') {
      var helpArg = cmd.replace(/^h(elp)?\s*/, '').trim();
      pushUndo();
      var helpLines = getHelpText(helpArg);
      state.lines = helpLines;
      state.cursor = { row: 0, col: 0 };
      state.curswant = 0;
      render();
      return;
    }
    if (cmd === 'tutor' || cmd === 'Tutor') {
      pushUndo();
      state.lines = [
        '===============================================================================',
        '=    W e l c o m e   t o   t h e   V I M   T u t o r    -    Version 1.7      =',
        '===============================================================================',
        '',
        '     Vim is a very powerful editor that has many commands, too many to',
        '     explain in a tutor such as this.  This tutor is designed to describe',
        '     enough of the commands that you will be able to easily use Vim as',
        '     an all-purpose editor.',
        '',
        '     The approximate time required to complete the tutor is 30 minutes,',
        '     depending upon how much time is spent with experimentation.',
        '',
        '     ATTENTION:',
        '     The commands in the lessons will modify the text.  Make a copy of this',
        '     file to practice on (if you started "vimtutor" this is already a copy).',
        '',
        '     It is important to remember that this tutor is set up to teach by',
        '     use.  That means that you need to execute the commands to learn them',
        '     properly.  If you only read the text, you will forget the commands!',
        '',
        '     Now, make sure that your Caps-Lock key is NOT depressed and press',
        '     the   j   key enough times to move the cursor so that lesson 1.1',
        '     completely fills the screen.',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 1.1:  MOVING THE CURSOR',
        '',
        '',
        '   ** To move the cursor, press the h,j,k,l keys as indicated. **',
        '             ^',
        '             k              Hint:  The h key is at the left and moves left.',
        '       < h       l >               The l key is at the right and moves right.',
        '             j                     The j key looks like a down arrow.',
        '             v',
        '  1. Move the cursor around the screen until you are comfortable.',
        '',
        '  2. Hold down the down key (j) until it repeats.',
        '     Now you know how to move to the next lesson.',
        '',
        '  3. Using the down key, move to lesson 1.2.',
        '',
        'NOTE: If you are ever unsure about something you typed, press <ESC> to place',
        '      you in Normal mode.  Then retype the command you wanted.',
        '',
        'NOTE: The cursor keys should also work.  But using hjkl you will be able to',
        '      move around much faster, once you get used to it.  Really!',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                            Lesson 1.2: EXITING VIM',
        '',
        '',
        '  !! NOTE: Before executing any of the steps below, read this entire lesson!!',
        '',
        '  1. Press the <ESC> key (to make sure you are in Normal mode).',
        '',
        '  2. Type:      :q! <ENTER>.',
        '     This exits the editor, DISCARDING any changes you have made.',
        '',
        '  3. Get back here by executing the command that got you into this tutor. That',
        '     might be:  vimtutor <ENTER>',
        '',
        '  4. If you have these steps memorized and are confident, execute steps',
        '     1 through 3 to exit and re-enter the editor.',
        '',
        'NOTE:  :q! <ENTER>  discards any changes you made.  In a few lessons you',
        '       will learn how to save the changes to a file.',
        '',
        '  5. Move the cursor down to lesson 1.3.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 1.3: TEXT EDITING - DELETION',
        '',
        '',
        '           ** Press  x  to delete the character under the cursor. **',
        '',
        '  1. Move the cursor to the line below marked --->.',
        '',
        '  2. To fix the errors, move the cursor until it is on top of the',
        '     character to be deleted.',
        '',
        '  3. Press the  x  key to delete the unwanted character.',
        '',
        '  4. Repeat steps 2 through 4 until the sentence is correct.',
        '',
        '---> The ccow jumpedd ovverr thhe mooon.',
        '',
        '  5. Now that the line is correct, go on to lesson 1.4.',
        '',
        'NOTE: As you go through this tutor, do not try to memorize, learn by usage.',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                      Lesson 1.4: TEXT EDITING - INSERTION',
        '',
        '',
        '                        ** Press  i  to insert text. **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '',
        '  2. To make the first line the same as the second, move the cursor on top',
        '     of the character BEFORE which the text is to be inserted.',
        '',
        '  3. Press  i  and type in the necessary additions.',
        '',
        '  4. As each error is fixed press <ESC> to return to Normal mode.',
        '     Repeat steps 2 through 4 to correct the sentence.',
        '',
        '---> There is text misng this .',
        '---> There is some text missing from this line.',
        '',
        '  5. When you are comfortable inserting text move to lesson 1.5.',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 1.5: TEXT EDITING - APPENDING',
        '',
        '',
        '                        ** Press  A  to append text. **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '     It does not matter on what character the cursor is in that line.',
        '',
        '  2. Press  A  and type in the necessary additions.',
        '',
        '  3. As the text has been appended press <ESC> to return to Normal mode.',
        '',
        '  4. Move the cursor to the second line marked ---> and repeat',
        '     steps 2 and 3 to correct this sentence.',
        '',
        '---> There is some text missing from th',
        '     There is some text missing from this line.',
        '---> There is also some text miss',
        '     There is also some text missing here.',
        '',
        '  5. When you are comfortable appending text move to lesson 1.6.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 1.6: EDITING A FILE',
        '',
        '                    ** Use  :wq  to save a file and exit. **',
        '',
        '  !! NOTE: Before executing any of the steps below, read this entire lesson!!',
        '',
        '  1.  If you have access to another terminal, do the following there.',
        '      Otherwise, exit this tutor as you did in lesson 1.2:  :q!',
        '',
        '  2. At the shell prompt type this command:  vim file.txt <ENTER>',
        '     \'vim\' is the command to start the Vim editor, \'file.txt\' is the name of',
        '     the file you wish to edit.  Use the name of a file that you can change.',
        '',
        '  3. Insert and delete text as you learned in the previous lessons.',
        '',
        '  4. Save the file with changes and exit Vim with:  :wq <ENTER>',
        '',
        '  5. If you have quit vimtutor in step 1 restart the vimtutor and move down to',
        '     the following summary.',
        '',
        '  6. After reading the above steps and understanding them: do it.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 1 SUMMARY',
        '',
        '',
        '  1. The cursor is moved using either the arrow keys or the hjkl keys.',
        '         h (left)       j (down)       k (up)       l (right)',
        '',
        '  2. To start Vim from the shell prompt type:  vim FILENAME <ENTER>',
        '',
        '  3. To exit Vim type:     <ESC>   :q!   <ENTER>  to trash all changes.',
        '             OR type:      <ESC>   :wq   <ENTER>  to save the changes.',
        '',
        '  4. To delete the character at the cursor type:  x',
        '',
        '  5. To insert or append text type:',
        '         i   type inserted text   <ESC>         insert before the cursor',
        '         A   type appended text   <ESC>         append after the line',
        '',
        'NOTE: Pressing <ESC> will place you in Normal mode or will cancel',
        '      an unwanted and partially completed command.',
        '',
        'Now continue with lesson 2.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 2.1: DELETION COMMANDS',
        '',
        '',
        '                       ** Type  dw  to delete a word. **',
        '',
        '  1. Press  <ESC>  to make sure you are in Normal mode.',
        '',
        '  2. Move the cursor to the line below marked --->.',
        '',
        '  3. Move the cursor to the beginning of a word that needs to be deleted.',
        '',
        '  4. Type   dw   to make the word disappear.',
        '',
        '  NOTE: The letter  d  will appear on the last line of the screen as you type',
        '        it.  Vim is waiting for you to type  w .  If you see another character',
        '        than  d  you typed something wrong; press  <ESC>  and start over.',
        '',
        '---> There are a some words fun that don\'t belong paper in this sentence.',
        '',
        '  5. Repeat steps 3 and 4 until the sentence is correct and go to lesson 2.2.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                      Lesson 2.2: MORE DELETION COMMANDS',
        '',
        '',
        '           ** Type  d$  to delete to the end of the line. **',
        '',
        '  1. Press  <ESC>  to make sure you are in Normal mode.',
        '',
        '  2. Move the cursor to the line below marked --->.',
        '',
        '  3. Move the cursor to the end of the correct line (AFTER the first . ).',
        '',
        '  4. Type    d$    to delete to the end of the line.',
        '',
        '---> Somebody typed the end of this line twice. end of this line twice.',
        '',
        '',
        '  5. Move on to lesson 2.3 to understand what is happening.',
        '',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 2.3: ON OPERATORS AND MOTIONS',
        '',
        '',
        '  Many commands that change text are made from an operator and a motion.',
        '  The format for a delete command with the  d  delete operator is as follows:',
        '',
        '        d   motion',
        '',
        '  Where:',
        '    d      - is the delete operator.',
        '    motion - is what the operator will operate on (listed below).',
        '',
        '  A short list of motions:',
        '    w - until the start of the next word, EXCLUDING its first character.',
        '    e - to the end of the current word, INCLUDING the last character.',
        '    $ - to the end of the line, INCLUDING the last character.',
        '',
        '  Thus typing  de  will delete from the cursor to the end of the word.',
        '',
        'NOTE:  Pressing just the motion while in Normal mode without an operator will',
        '       move the cursor as specified.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 2.4: USING A COUNT FOR A MOTION',
        '',
        '',
        '   ** Typing a number before a motion repeats it that many times. **',
        '',
        '  1. Move the cursor to the start of the line below marked --->.',
        '',
        '  2. Type  2w  to move the cursor two words forward.',
        '',
        '  3. Type  3e  to move the cursor to the end of the third word forward.',
        '',
        '  4. Type  0  (zero) to move to the start of the line.',
        '',
        '  5. Repeat steps 2 and 3 with different numbers.',
        '',
        '---> This is just a line with words you can move around in.',
        '',
        '  6. Move on to lesson 2.5.',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                     Lesson 2.5: USING A COUNT TO DELETE MORE',
        '',
        '',
        '   ** Typing a number with an operator repeats it that many times. **',
        '',
        '  In the combination of the delete operator and a motion mentioned above you',
        '  insert a count before the motion to delete more:',
        '         d   number   motion',
        '',
        '  1. Move the cursor to the first UPPER CASE word in the line marked --->.',
        '',
        '  2. Type  d2w  to delete the two UPPER CASE words.',
        '',
        '  3. Repeat steps 1 and 2 with a different count to delete the consecutive',
        '     UPPER CASE words with one command.',
        '',
        '--->  this ABC DE line FGHI JK LMN OP of words is Q RS TUV cleaned up.',
        '',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                         Lesson 2.6: OPERATING ON LINES',
        '',
        '',
        '                   ** Type  dd   to delete a whole line. **',
        '',
        '  Due to the frequency of whole line deletion, the designers of Vi decided',
        '  it would be easier to simply type two d\'s to delete a line.',
        '',
        '  1. Move the cursor to the second line in the phrase below.',
        '  2. Type  dd  to delete the line.',
        '  3. Now move to the fourth line.',
        '  4. Type   2dd   to delete two lines.',
        '',
        '--->  1)  Roses are red,',
        '--->  2)  Mud is fun,',
        '--->  3)  Violets are blue,',
        '--->  4)  I have a car,',
        '--->  5)  Clocks tell time,',
        '--->  6)  Sugar is sweet',
        '--->  7)  And so are you.',
        '',
        'Doubling to operate on a line also works for operators mentioned below.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                         Lesson 2.7: THE UNDO COMMAND',
        '',
        '',
        '   ** Press  u  to undo the last commands,   U  to fix a whole line. **',
        '',
        '  1. Move the cursor to the line below marked ---> and place it on the',
        '     first error.',
        '  2. Type  x  to delete the first unwanted character.',
        '  3. Now type  u  to undo the last command executed.',
        '  4. This time fix all the errors on the line using the  x  command.',
        '  5. Now type a capital  U  to return the line to its original state.',
        '  6. Now type  u  a few times to undo the  U  and preceding commands.',
        '  7. Now type CTRL-R (keeping CTRL key pressed while hitting R) a few times',
        '     to redo the commands (undo the undos).',
        '',
        '---> Fiix the errors oon thhis line and reeplace them witth undo.',
        '',
        '  8. These are very useful commands.  Now move on to the lesson 2 Summary.',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 2 SUMMARY',
        '',
        '  1. To delete from the cursor up to the next word type:        dw',
        '  2. To delete from the cursor up to the end of the word type:  de',
        '  3. To delete from the cursor to the end of a line type:       d$',
        '  4. To delete a whole line type:                               dd',
        '',
        '  5. To repeat a motion prepend it with a number:   2w',
        '  6. The format for a change command is:',
        '               operator   [number]   motion',
        '     where:',
        '       operator - is what to do, such as  d  for delete',
        '       [number] - is an optional count to repeat the motion',
        '       motion   - moves over the text to operate on, such as  w (word),',
        '                  e (end of word),  $ (end of the line), etc.',
        '',
        '  7. To move to the start of the line use a zero:  0',
        '',
        '  8. To undo previous actions, type:           u  (lowercase u)',
        '     To undo all the changes on a line, type:  U  (capital U)',
        '     To undo the undos, type:                  CTRL-R',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                         Lesson 3.1: THE PUT COMMAND',
        '',
        '',
        '       ** Type  p  to put previously deleted text after the cursor. **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '',
        '  2. Type  dd  to delete the line and store it in a Vim register.',
        '',
        '  3. Move the cursor to the c) line, ABOVE where the deleted line should go.',
        '',
        '  4. Type   p   to put the line below the cursor.',
        '',
        '  5. Repeat steps 2 through 4 to put all the lines in correct order.',
        '',
        '---> d) Can you learn too?',
        '---> b) Violets are blue,',
        '---> c) Intelligence is learned,',
        '---> a) Roses are red,',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                       Lesson 3.2: THE REPLACE COMMAND',
        '',
        '',
        '       ** Type  rx  to replace the character at the cursor with  x . **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '',
        '  2. Move the cursor so that it is on top of the first error.',
        '',
        '  3. Type   r   and then the character which should be there.',
        '',
        '  4. Repeat steps 2 and 3 until the first line is equal to the second one.',
        '',
        '--->  Whan this lime was tuoed in, someone presswd some wrojg keys!',
        '--->  When this line was typed in, someone pressed some wrong keys!',
        '',
        '  5. Now move on to lesson 3.3.',
        '',
        'NOTE: Remember that you should be learning by doing, not memorization.',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 3.3: THE CHANGE OPERATOR',
        '',
        '',
        '           ** To change until the end of a word, type  ce . **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '',
        '  2. Place the cursor on the  u  in  lubw.',
        '',
        '  3. Type  ce  and the correct word (in this case, type  ine ).',
        '',
        '  4. Press <ESC> and move to the next character that needs to be changed.',
        '',
        '  5. Repeat steps 3 and 4 until the first sentence is the same as the second.',
        '',
        '---> This lubw has a few wptfd that mrrf changing usf the change operator.',
        '---> This line has a few words that need changing using the change operator.',
        '',
        'Notice that  ce  deletes the word and places you in Insert mode.',
        '             cc  does the same for the whole line.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                       Lesson 3.4: MORE CHANGES USING c',
        '',
        '',
        '     ** The change operator is used with the same motions as delete. **',
        '',
        '  1. The change operator works in the same way as delete.  The format is:',
        '',
        '         c    [number]   motion',
        '',
        '  2. The motions are the same, such as   w (word) and  $ (end of line).',
        '',
        '  3. Move the cursor to the first line below marked --->.',
        '',
        '  4. Move the cursor to the first error.',
        '',
        '  5. Type  c$  and type the rest of the line like the second and press <ESC>.',
        '',
        '---> The end of this line needs some help to make it like the second.',
        '---> The end of this line needs to be corrected using the  c$  command.',
        '',
        'NOTE:  You can use the Backspace key to correct mistakes while typing.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 3 SUMMARY',
        '',
        '',
        '  1. To put back text that has just been deleted, type   p .  This puts the',
        '     deleted text AFTER the cursor (if a line was deleted it will go on the',
        '     line below the cursor).',
        '',
        '  2. To replace the character under the cursor, type   r   and then the',
        '     character you want to have there.',
        '',
        '  3. The change operator allows you to change from the cursor to where the',
        '     motion takes you.  eg. Type  ce  to change from the cursor to the end of',
        '     the word,  c$  to change to the end of a line.',
        '',
        '  4. The format for change is:',
        '',
        '         c   [number]   motion',
        '',
        'Now go on to the next lesson.',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                  Lesson 4.1: CURSOR LOCATION AND FILE STATUS',
        '',
        '  ** Type CTRL-G to show your location in the file and the file status.',
        '     Type  G  to move to a line in the file. **',
        '',
        '  NOTE: Read this entire lesson before executing any of the steps!!',
        '',
        '  1. Hold down the Ctrl key and press  g .  We call this CTRL-G.',
        '     A message will appear at the bottom of the page with the filename and the',
        '     position in the file.  Remember the line number for Step 3.',
        '',
        'NOTE:  You may see the cursor position in the lower right corner of the screen',
        '       This happens when the \'ruler\' option is set (see  :help \'ruler\'  )',
        '',
        '  2. Press  G  to move you to the bottom of the file.',
        '     Type  gg  to move you to the start of the file.',
        '',
        '  3. Type the number of the line you were on and then  G .  This will',
        '     return you to the line you were on when you first pressed CTRL-G.',
        '',
        '  4. If you feel confident to do this, execute steps 1 through 3.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 4.2: THE SEARCH COMMAND',
        '',
        '',
        '     ** Type  /  followed by a phrase to search for the phrase. **',
        '',
        '  1. In Normal mode type the  /  character.  Notice that it and the cursor',
        '     appear at the bottom of the screen as with the  :  command.',
        '',
        '  2. Now type \'errroor\' <ENTER>.  This is the word you want to search for.',
        '',
        '  3. To search for the same phrase again, simply type  n .',
        '     To search for the same phrase in the opposite direction, type  N .',
        '',
        '  4. To search for a phrase in the backward direction, use  ?  instead of  / .',
        '',
        '  5. To go back to where you came from press  CTRL-O  (Keep Ctrl down while',
        '     pressing the letter o).  Repeat to go back further.  CTRL-I goes forward.',
        '',
        '--->  "errroor" is not the way to spell error;  errroor is an error.',
        'NOTE: When the search reaches the end of the file it will continue at the',
        '      start, unless the \'wrapscan\' option has been reset.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                   Lesson 4.3: MATCHING PARENTHESES SEARCH',
        '',
        '',
        '              ** Type  %  to find a matching ),], or } . **',
        '',
        '  1. Place the cursor on any (, [, or { in the line below marked --->.',
        '',
        '  2. Now type the  %  character.',
        '',
        '  3. The cursor will move to the matching parenthesis or bracket.',
        '',
        '  4. Type  %  to move the cursor to the other matching bracket.',
        '',
        '  5. Move the cursor to another (,),[,],{ or } and see what  %  does.',
        '',
        '---> This ( is a test line with (\'s, [\'s ] and {\'s } in it. ))',
        '',
        '',
        'NOTE: This is very useful in debugging a program with unmatched parentheses!',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                      Lesson 4.4: THE SUBSTITUTE COMMAND',
        '',
        '',
        '        ** Type  :s/old/new/g  to substitute \'new\' for \'old\'. **',
        '',
        '  1. Move the cursor to the line below marked --->.',
        '',
        '  2. Type  :s/thee/the <ENTER>  .  Note that this command only changes the',
        '     first occurrence of "thee" in the line.',
        '',
        '  3. Now type  :s/thee/the/g .  Adding the  g  flag means to substitute',
        '     globally in the line, change all occurrences of "thee" in the line.',
        '',
        '---> thee best time to see thee flowers is in thee spring.',
        '',
        '  4. To change every occurrence of a character string between two lines,',
        '     type   :#,#s/old/new/g    where #,# are the line numbers of the range',
        '                               of lines where the substitution is to be done.',
        '     Type   :%s/old/new/g      to change every occurrence in the whole file.',
        '     Type   :%s/old/new/gc     to find every occurrence in the whole file,',
        '                               with a prompt whether to substitute or not.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 4 SUMMARY',
        '',
        '',
        '  1. CTRL-G  displays your location in the file and the file status.',
        '             G  moves to the end of the file.',
        '     number  G  moves to that line number.',
        '            gg  moves to the first line.',
        '',
        '  2. Typing  /  followed by a phrase searches FORWARD for the phrase.',
        '     Typing  ?  followed by a phrase searches BACKWARD for the phrase.',
        '     After a search type  n  to find the next occurrence in the same direction',
        '     or  N  to search in the opposite direction.',
        '     CTRL-O takes you back to older positions, CTRL-I to newer positions.',
        '',
        '  3. Typing  %  while the cursor is on a (,),[,],{, or } goes to its match.',
        '',
        '  4. To substitute new for the first old in a line type    :s/old/new',
        '     To substitute new for all \'old\'s on a line type       :s/old/new/g',
        '     To substitute phrases between two line #\'s type       :#,#s/old/new/g',
        '     To substitute all occurrences in the file type        :%s/old/new/g',
        '     To ask for confirmation each time add \'c\'             :%s/old/new/gc',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                Lesson 5.1: HOW TO EXECUTE AN EXTERNAL COMMAND',
        '',
        '',
        '   ** Type  :!  followed by an external command to execute that command. **',
        '',
        '  1. Type the familiar command  :  to set the cursor at the bottom of the',
        '     screen.  This allows you to enter a command-line command.',
        '',
        '  2. Now type the  !  (exclamation point) character.  This allows you to',
        '     execute any external shell command.',
        '',
        '  3. As an example type   ls   following the ! and then hit <ENTER>.  This',
        '     will show you a listing of your directory, just as if you were at the',
        '     shell prompt.  Or use  :!dir  if ls doesn\'t work.',
        '',
        'NOTE:  It is possible to execute any external command this way, also with',
        '       arguments.',
        '',
        'NOTE:  All  :  commands must be finished by hitting <ENTER>',
        '       From here on we will not always mention it.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                      Lesson 5.2: MORE ON WRITING FILES',
        '',
        '',
        '     ** To save the changes made to the text, type  :w FILENAME  **',
        '',
        '  1. Type  :!dir  or  :!ls  to get a listing of your directory.',
        '     You already know you must hit <ENTER> after this.',
        '',
        '  2. Choose a filename that does not exist yet, such as TEST.',
        '',
        '  3. Now type:   :w TEST   (where TEST is the filename you chose.)',
        '',
        '  4. This saves the whole file (the Vim Tutor) under the name TEST.',
        '     To verify this, type    :!dir  or  :!ls   again to see your directory.',
        '',
        'NOTE: If you were to exit Vim and start it again with  vim TEST , the file',
        '      would be an exact copy of the tutor when you saved it.',
        '',
        '  5. Now remove the file by typing (Windows):   :!del TEST',
        '                                or (Unix):      :!rm TEST',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                    Lesson 5.3: SELECTING TEXT TO WRITE',
        '',
        '',
        '        ** To save part of the file, type  v  motion  :w FILENAME **',
        '',
        '  1. Move the cursor to this line.',
        '',
        '  2. Press  v  and move the cursor to the fifth item below.  Notice that the',
        '     text is highlighted.',
        '',
        '  3. Press the  :  character.  At the bottom of the screen  :\'<,\'> will appear.',
        '',
        '  4. Type  w TEST  , where TEST is a filename that does not exist yet.  Verify',
        '     that you see  :\'<,\'>w TEST  before you press <ENTER>.',
        '',
        '  5. Vim will write the selected lines to the file TEST.  Use  :!dir  or  :!ls',
        '     to see it.  Do not remove it yet!  We will use it in the next lesson.',
        '',
        'NOTE:  Pressing  v  starts Visual selection.  You can move the cursor around',
        '       to make the selection bigger or smaller.  Then you can use an operator',
        '       to do something with the text.  For example,  d  deletes the text.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                   Lesson 5.4: RETRIEVING AND MERGING FILES',
        '',
        '',
        '       ** To insert the contents of a file, type  :r FILENAME  **',
        '',
        '  1. Place the cursor just above this line.',
        '',
        'NOTE:  After executing Step 2 you will see text from lesson 5.3.  Then move',
        '       DOWN to see this lesson again.',
        '',
        '  2. Now retrieve your TEST file using the command   :r TEST   where TEST is',
        '     the name of the file you used.',
        '     The file you retrieve is placed below the cursor line.',
        '',
        '  3. To verify that a file was retrieved, cursor back and notice that there',
        '     are now two copies of lesson 5.3, the original and the file version.',
        '',
        'NOTE:  You can also read the output of an external command.  For example,',
        '       :r !ls  reads the output of the ls command and puts it below the',
        '       cursor.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 5 SUMMARY',
        '',
        '',
        '  1.  :!command  executes an external command.',
        '',
        '      Some useful examples are:',
        '         (Windows)        (Unix)',
        '          :!dir            :!ls            -  shows a directory listing.',
        '          :!del FILENAME   :!rm FILENAME   -  removes file FILENAME.',
        '',
        '  2.  :w FILENAME  writes the current Vim file to disk with name FILENAME.',
        '',
        '  3.  v  motion  :w FILENAME  saves the Visually selected lines in file',
        '      FILENAME.',
        '',
        '  4.  :r FILENAME  retrieves disk file FILENAME and puts it below the',
        '      cursor position.',
        '',
        '  5.  :r !dir  reads the output of the dir command and puts it below the',
        '      cursor position.',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                         Lesson 6.1: THE OPEN COMMAND',
        '',
        '',
        ' ** Type  o  to open a line below the cursor and place you in Insert mode. **',
        '',
        '  1. Move the cursor to the first line below marked --->.',
        '',
        '  2. Type the lowercase letter  o  to open up a line BELOW the cursor and place',
        '     you in Insert mode.',
        '',
        '  3. Now type some text and press <ESC> to exit Insert mode.',
        '',
        '---> After typing  o  the cursor is placed on the open line in Insert mode.',
        '',
        '  4. To open up a line ABOVE the cursor, simply type a capital  O , rather',
        '     than a lowercase  o.  Try this on the line below.',
        '',
        '---> Open up a line above this by typing O while the cursor is on this line.',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 6.2: THE APPEND COMMAND',
        '',
        '',
        '             ** Type  a  to insert text AFTER the cursor. **',
        '',
        '  1. Move the cursor to the start of the first line below marked --->.',
        '',
        '  2. Press  e  until the cursor is on the end of  li .',
        '',
        '  3. Type an  a  (lowercase) to append text AFTER the cursor.',
        '',
        '  4. Complete the word like the line below it.  Press <ESC> to exit Insert',
        '     mode.',
        '',
        '  5. Use  e  to move to the next incomplete word and repeat steps 3 and 4.',
        '',
        '---> This li will allow you to pract appendi text to a line.',
        '---> This line will allow you to practice appending text to a line.',
        '',
        'NOTE:  a, i and A all go to the same Insert mode, the only difference is where',
        '       the characters are inserted.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                    Lesson 6.3: ANOTHER WAY TO REPLACE',
        '',
        '',
        '      ** Type a capital  R  to replace more than one character. **',
        '',
        '  1. Move the cursor to the first line below marked --->.  Move the cursor to',
        '     the beginning of the first  xxx .',
        '',
        '  2. Now press  R  and type the number below it in the second line, so that it',
        '     replaces the xxx .',
        '',
        '  3. Press <ESC> to leave Replace mode.  Notice that the rest of the line',
        '     remains unmodified.',
        '',
        '  4. Repeat the steps to replace the remaining xxx.',
        '',
        '---> Adding 123 to xxx gives you xxx.',
        '---> Adding 123 to 456 gives you 579.',
        '',
        'NOTE:  Replace mode is like Insert mode, but every typed character deletes an',
        '       existing character.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                        Lesson 6.4: COPY AND PASTE TEXT',
        '',
        '',
        '          ** Use the  y  operator to copy text and  p  to paste it **',
        '',
        '  1. Move to the line below marked ---> and place the cursor after "a)".',
        '',
        '  2. Start Visual mode with  v  and move the cursor to just before "first".',
        '',
        '  3. Type  y  to yank (copy) the highlighted text.',
        '',
        '  4. Move the cursor to the end of the next line:  j$',
        '',
        '  5. Type  p  to put (paste) the text.  Then type:  a second <ESC> .',
        '',
        '  6. Use Visual mode to select " item.", yank it with  y , move to the end of',
        '     the next line with  j$  and put the text there with  p .',
        '',
        '--->  a) this is the first item.',
        '      b)',
        '',
        '  NOTE: You can also use  y  as an operator:  yw  yanks one word,',
        '        yy  yanks the whole line, then  p  puts that line.',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                            Lesson 6.5: SET OPTION',
        '',
        '',
        '          ** Set an option so a search or substitute ignores case **',
        '',
        '  1. Search for \'ignore\' by entering:  /ignore <ENTER>',
        '     Repeat several times by pressing  n .',
        '',
        '  2. Set the \'ic\' (Ignore case) option by entering:   :set ic',
        '',
        '  3. Now search for \'ignore\' again by pressing  n',
        '     Notice that Ignore and IGNORE are now also found.',
        '',
        '  4. Set the \'hlsearch\' and \'incsearch\' options:  :set hls is',
        '',
        '  5. Now type the search command again and see what happens:  /ignore <ENTER>',
        '',
        '  6. To disable ignoring case enter:  :set noic',
        '',
        'NOTE:  To remove the highlighting of matches enter:   :nohlsearch',
        'NOTE:  If you want to ignore case for just one search command, use  \\c',
        '       in the phrase:  /ignore\\c <ENTER>',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 6 SUMMARY',
        '',
        '  1. Type  o  to open a line BELOW the cursor and start Insert mode.',
        '     Type  O  to open a line ABOVE the cursor.',
        '',
        '  2. Type  a  to insert text AFTER the cursor.',
        '     Type  A  to insert text after the end of the line.',
        '',
        '  3. The  e  command moves to the end of a word.',
        '',
        '  4. The  y  operator yanks (copies) text,  p  puts (pastes) it.',
        '',
        '  5. Typing a capital  R  enters Replace mode until  <ESC>  is pressed.',
        '',
        '  6. Typing ":set xxx" sets the option "xxx".  Some options are:',
        '        \'ic\' \'ignorecase\'       ignore upper/lower case when searching',
        '        \'is\' \'incsearch\'        show partial matches for a search phrase',
        '        \'hls\' \'hlsearch\'        highlight all matching phrases',
        '     You can either use the long or the short option name.',
        '',
        '  7. Prepend "no" to switch an option off:   :set noic',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                       Lesson 7.1: GETTING HELP',
        '',
        '',
        '                      ** Use the on-line help system **',
        '',
        '  Vim has a comprehensive on-line help system.  To get started, try one of',
        '  these three:',
        '        - press the <HELP> key (if you have one)',
        '        - press the <F1> key (if you have one)',
        '        - type   :help <ENTER>',
        '',
        '  Read the text in the help window to find out how the help works.',
        '  Type  CTRL-W CTRL-W   to jump from one window to another.',
        '  Type    :q <ENTER>    to close the help window.',
        '',
        '  You can find help on just about any subject, by giving an argument to the',
        '  ":help" command.  Try these (don\'t forget pressing <ENTER>):',
        '',
        '        :help w',
        '        :help c_CTRL-D',
        '        :help insert-index',
        '        :help user-manual',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                      Lesson 7.2: CREATE A STARTUP SCRIPT',
        '',
        '',
        '                          ** Enable Vim features **',
        '',
        '  Vim has many more features than Vi, but most of them are disabled by',
        '  default.  To start using more features you should create a "vimrc" file.',
        '',
        '  1. Start editing the "vimrc" file.  This depends on your system:',
        '        :e ~/.vimrc             for Unix',
        '        :e ~/_vimrc             for Windows',
        '',
        '  2. Now read the example "vimrc" file contents:',
        '        :r $VIMRUNTIME/vimrc_example.vim',
        '',
        '  3. Write the file with:',
        '        :w',
        '',
        '  The next time you start Vim it will use syntax highlighting.',
        '  You can add all your preferred settings to this "vimrc" file.',
        '  For more information type  :help vimrc-intro',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                             Lesson 7.3: COMPLETION',
        '',
        '',
        '              ** Command line completion with CTRL-D and <TAB> **',
        '',
        '  1. Make sure Vim is not in compatible mode:  :set nocp',
        '',
        '  2. Look what files exist in the directory:  :!ls   or  :!dir',
        '',
        '  3. Type the start of a command:  :e',
        '',
        '  4. Press  CTRL-D  and Vim will show a list of commands that start with "e".',
        '',
        '  5. Type  d<TAB>  and Vim will complete the command name to ":edit".',
        '',
        '  6. Now add a space and the start of an existing file name:  :edit FIL',
        '',
        '  7. Press <TAB>.  Vim will complete the name (if it is unique).',
        '',
        'NOTE:  Completion works for many commands.  Just try pressing CTRL-D and',
        '       <TAB>.  It is especially useful for  :help .',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '                               Lesson 7 SUMMARY',
        '',
        '',
        '  1. Type  :help  or press <F1> or <HELP>  to open a help window.',
        '',
        '  2. Type  :help cmd  to find help on  cmd .',
        '',
        '  3. Type  CTRL-W CTRL-W  to jump to another window.',
        '',
        '  4. Type  :q  to close the help window.',
        '',
        '  5. Create a vimrc startup script to keep your preferred settings.',
        '',
        '  6. When typing a  :  command, press CTRL-D to see possible completions.',
        '     Press <TAB> to use one completion.',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '',
        '  This concludes the Vim Tutor.  It was intended to give a brief overview of',
        '  the Vim editor, just enough to allow you to use the editor fairly easily.',
        '  It is far from complete as Vim has many many more commands.  Read the user',
        '  manual next: ":help user-manual".',
        '',
        '  For further reading and studying, this book is recommended:',
        '        Vim - Vi Improved - by Steve Oualline',
        '        Publisher: New Riders',
        '  The first book completely dedicated to Vim.  Especially useful for beginners.',
        '  There are many examples and pictures.',
        '  See https://iccf-holland.org/click5.html',
        '',
        '  This book is older and more about Vi than Vim, but also recommended:',
        '        Learning the Vi Editor - by Linda Lamb',
        '        Publisher: O\'Reilly & Associates Inc.',
        '  It is a good book to get to know almost anything you want to do with Vi.',
        '  The sixth edition also includes information on Vim.',
        '',
        '  This tutorial was written by Michael C. Pierce and Robert K. Ware,',
        '  Colorado School of Mines using ideas supplied by Charles Smith,',
        '  Colorado State University.  E-mail: bware@mines.colorado.edu.',
        '',
        '  Modified for Vim by Bram Moolenaar.',
        '',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
      ];
      state.cursor = { row: 0, col: 0 };
      state.curswant = 0;
      setStatus(':tutor opened. Edit this buffer to practice.');
      render(); return;
    }
    if (cmd === 'agents') {
      agentsAquarium(); return;
    }
    if (cmd === 'emacs') {
      setStatus("I'm sorry, Dave. I'm afraid I can't do that.", 4000); return;
    }
    if (cmd === 'nano') {
      setStatus("We don't do that here.", 3000); return;
    }
    // :colorscheme name
    if (cmd === 'colorscheme' || cmd === 'colo' || cmd === 'color') {
      setStatus('Current: ' + state.colorscheme + '  Available: ' + schemeNames.join(', '));
      return;
    }
    if (cmd.indexOf('colorscheme ') === 0 || cmd.indexOf('colo ') === 0 || cmd.indexOf('color ') === 0) {
      var csName = cmd.split(' ')[1];
      if (colorschemes[csName]) {
        applyColorscheme(csName);
        savePrefs();
        setStatus('colorscheme ' + csName);
      } else {
        setStatus('E185: Cannot find color scheme "' + csName + '"');
      }
      render(); return;
    }
    // :! fake shell
    if (cmd[0] === '!') {
      fakeShell(cmd.slice(1).trim()); return;
    }
    // :r FILENAME  read file and insert below cursor
    if (cmd === 'r' || cmd.slice(0, 2) === 'r ') {
      var rArg = cmd.slice(2).trim();
      if (!rArg) { setStatus('E471: Argument required'); return; }
      // :r !cmd - read output of fake shell command
      if (rArg[0] === '!') {
        var shellCmd = rArg.slice(1).trim();
        var shellOut = getShellOutput(shellCmd);
        if (shellOut === null) return;
        pushUndo();
        var rInsertAt = state.cursor.row + 1;
        for (var rsi = 0; rsi < shellOut.length; rsi++) {
          state.lines.splice(rInsertAt + rsi, 0, shellOut[rsi]);
        }
        state.cursor.row = rInsertAt;
        state.cursor.col = 0;
        setStatus('!' + shellCmd + '  ' + shellOut.length + ' lines');
        render();
        return;
      }
      var rPath = resolveBlogPath(rArg) || rArg;
      // Ensure path starts with / for fetch
      if (rPath[0] !== '/' && rPath.indexOf('http') !== 0) rPath = '/' + rPath;
      setStatus('Reading "' + rArg + '"...');
      fetch(rPath).then(function(resp) {
        if (!resp.ok) throw new Error(resp.status);
        return resp.text();
      }).then(function(text) {
        pushUndo();
        var newLines = text.split('\n');
        var insertAt = state.cursor.row + 1;
        for (var ri = 0; ri < newLines.length; ri++) {
          state.lines.splice(insertAt + ri, 0, newLines[ri]);
        }
        state.cursor.row = insertAt;
        state.cursor.col = 0;
        setStatus('"' + rArg + '" ' + newLines.length + ' lines');
        render();
      }).catch(function() {
        setStatus('E484: Cannot open file "' + rArg + '"');
      });
      return;
    }
    // :s/old/new/g substitute  :%s/old/new/g  :#,#s/old/new/g  gc confirm
    var subMatch = cmd.match(/^(\d+,\d+|%|'<,'>)?s\/(.+?)\/(.*)\/([gc]*)$/);
    if (subMatch) {
      var subRange = subMatch[1] || '';
      var subPat = subMatch[2];
      var subRep = subMatch[3];
      var subFlags = subMatch[4] || '';
      var subGlobal = subFlags.indexOf('g') !== -1;
      var subConfirm = subFlags.indexOf('c') !== -1;
      var subRe;
      try { subRe = new RegExp(subPat, subGlobal ? 'g' : ''); } catch(ex) {
        setStatus('Invalid pattern: ' + subPat); return;
      }
      state.lastSub = { pattern: subPat, replacement: subRep, global: subGlobal };
      pushUndo();
      var subCount = 0;
      var range = resolveRange(subRange);
      var startLine = range.start, endLine = range.end;
      if (subConfirm) {
        // Interactive confirm: process matches one at a time
        var confirmMatches = [];
        for (var ci = startLine; ci <= endLine; ci++) {
          var cLine = state.lines[ci];
          var cRe = new RegExp(subPat, 'g');
          var cm;
          while ((cm = cRe.exec(cLine)) !== null) {
            confirmMatches.push({ row: ci, col: cm.index, len: cm[0].length });
            if (cm[0].length === 0) cRe.lastIndex++;
          }
        }
        if (confirmMatches.length) {
          state.confirmSub = {
            matches: confirmMatches, idx: 0, count: 0,
            pattern: subPat, replacement: subRep, global: subGlobal
          };
          state.mode = 'confirm-sub';
          var csm = confirmMatches[0];
          state.cursor.row = csm.row; state.cursor.col = csm.col;
          setStatus('replace with "' + subRep + '"? (y/n/a/q)');
          render();
        }
        return;
      }
      for (var si = startLine; si <= endLine; si++) {
        var orig = state.lines[si];
        state.lines[si] = orig.replace(subRe, subRep);
        if (state.lines[si] !== orig) subCount++;
      }
      setStatus(subCount + ' substitution' + (subCount !== 1 ? 's' : ''));
      render(); return;
    }
    // :marks - list all set marks
    if (cmd === 'marks') {
      var markKeys = Object.keys(state.marks).sort();
      if (!markKeys.length) { setStatus('No marks set'); return; }
      pushUndo();
      var markLines = ['mark line  col content', '----+------+---+-------'];
      for (var mi = 0; mi < markKeys.length; mi++) {
        var mk = state.marks[markKeys[mi]];
        var mRow = clampRow(mk.row);
        var mLine = getLine(mRow);
        var preview = mLine.length > 40 ? mLine.slice(0, 40) + '...' : mLine;
        markLines.push(' ' + markKeys[mi] + '    ' + (mRow + 1) + '      ' + mk.col + '   ' + preview);
      }
      state.lines = markLines;
      state.cursor = { row: 0, col: 0 };
      state.curswant = 0;
      render(); return;
    }
    if (cmd === 'pray') { window.open('https://prayorthodox.com', '_blank'); setStatus('"https://prayorthodox.com" opened'); return; }
    setStatus('E492: Not an editor command: ' + cmd);
  }

  // -------------------------------------------------------------------------
  // Key handlers
  // -------------------------------------------------------------------------
  var gTimer = null;
  var pendingOperator = null;
  var operatorCount = 0;

  function handleEscInNormal() {
    if (state.escTimer) clearTimeout(state.escTimer);
    state.escCount++;
    state.escTimer = setTimeout(function() { state.escCount = 0; state.escTimer = null; }, 1500);

    if (state.escCount === 3) {
      state.escCount = 0;
      clearTimeout(state.escTimer);
      state.escTimer = null;
      setStatus('Need help?  :q quit  :w save  :help commands  i insert', 5000);
    }
  }

  function handleNormal(e) {
    // Ignore modifier-only keys (Shift, Control, Alt, Meta) so they don't clear gTimer etc.
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    if (e.key === 'Escape') {
      countBuf = 0;
      pendingOperator = null; operatorCount = 0;
      state.pendingGForOp = false;
      if (state.pendingOp) { state.pendingOp = null; return; }
      handleEscInNormal();
      return;
    }

    // Ctrl+R: redo (checked early to prevent browser interference)
    if (e.ctrlKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault(); redo(); return;
    }

    // Count prefix: digits 1-9 start, 0-9 continue
    if (e.key >= '1' && e.key <= '9' || (e.key === '0' && countBuf > 0)) {
      countBuf = countBuf * 10 + parseInt(e.key, 10);
      if (countBuf > 9999) countBuf = 9999;
      return;
    }

    // Pending single-char operations: r, f, F, t, T
    // Also handles operator+f/t combos (e.g. df{char}, ct{char})
    if (state.pendingOp) {
      if (e.key.length !== 1) return; // ignore modifier-only keys (Shift, Alt, etc.)
      var op = state.pendingOp;
      state.pendingOp = null;
      var pRow = state.cursor.row;
      var pCol = state.cursor.col;
      if (op === 'Z') {
        if (e.key === 'Z') { downloadText(state.lines.join('\n'), state.filename); setTimeout(function() { window.location.href = state.exitTarget; }, 300); }
        else if (e.key === 'Q') { window.location.href = state.exitTarget; }
        return;
      }
      if (op === 'z') {
        var scrollTarget;
        if (e.key === 'z') scrollTarget = pRow * lineH - bodyEl.clientHeight / 2 + lineH / 2;
        else if (e.key === 't') scrollTarget = pRow * lineH;
        else if (e.key === 'b') scrollTarget = pRow * lineH - bodyEl.clientHeight + lineH;
        if (scrollTarget !== undefined) bodyEl.scrollTop = Math.max(0, scrollTarget);
        render(); return;
      }
      if (op === 'r') {
        var rN = getCount();
        pushUndo();
        var pLine = getLine(pRow);
        for (var ri = 0; ri < rN && pCol + ri < pLine.length; ri++) {
          pLine = pLine.slice(0, pCol + ri) + e.key + pLine.slice(pCol + ri + 1);
        }
        state.lines[pRow] = pLine;
        state.cursor.col = clampCol(pRow, pCol + rN - 1);
        recordChange('r', { ch: e.key });
        render(); return;
      }
      // m{a-z}: set mark
      if (op === 'm') {
        if (e.key >= 'a' && e.key <= 'z') {
          state.marks[e.key] = { row: pRow, col: pCol };
          setStatus('mark ' + e.key + ' set');
        }
        return;
      }
      // `{a-z}: jump to exact mark position
      if (op === 'backtick') {
        if (e.key >= 'a' && e.key <= 'z') {
          var mk = state.marks[e.key];
          if (!mk) { setStatus('E20: Mark not set'); return; }
          pushJump();
          state.cursor.row = clampRow(mk.row);
          state.cursor.col = clampCol(state.cursor.row, mk.col);
          state.curswant = state.cursor.col;
          render();
        }
        return;
      }
      // '{a-z}: jump to first non-blank of marked line
      if (op === 'quote') {
        if (e.key >= 'a' && e.key <= 'z') {
          var mk2 = state.marks[e.key];
          if (!mk2) { setStatus('E20: Mark not set'); return; }
          pushJump();
          state.cursor.row = clampRow(mk2.row);
          state.cursor.col = firstNonBlank(state.cursor.row);
          state.curswant = state.cursor.col;
          render();
        }
        return;
      }
      // operator + `{a-z}: delete/yank/change to mark (character-wise)
      if (op === 'op_backtick') {
        if (e.key >= 'a' && e.key <= 'z') {
          var mk3 = state.marks[e.key];
          if (!mk3) { setStatus('E20: Mark not set'); return; }
          var mkRow = clampRow(mk3.row);
          var mkCol = clampCol(mkRow, mk3.col);
          applyOperator(state.pendingTextObjOp, pRow, pCol, { endRow: mkRow, endCol: mkCol, linewise: false });
          state.pendingTextObjOp = null;
        }
        pendingOperator = null; operatorCount = 0;
        render(); return;
      }
      // operator + '{a-z}: delete/yank/change to mark (linewise)
      if (op === 'op_quote') {
        if (e.key >= 'a' && e.key <= 'z') {
          var mk4 = state.marks[e.key];
          if (!mk4) { setStatus('E20: Mark not set'); return; }
          var mkRow2 = clampRow(mk4.row);
          applyOperator(state.pendingTextObjOp, pRow, pCol, { endRow: mkRow2, endCol: 0, linewise: true });
          state.pendingTextObjOp = null;
        }
        pendingOperator = null; operatorCount = 0;
        render(); return;
      }
      // text object: i/a prefix was captured, now resolve the object type
      if (op === 'textobj_i' || op === 'textobj_a') {
        var toPrefix = op === 'textobj_i' ? 'i' : 'a';
        if (e.key === 'w' || e.key === 'W' || e.key === 'p') {
          var tobj = computeTextObject(toPrefix, e.key, pRow, pCol);
          if (tobj && state.pendingTextObjOp) {
            applyOperator(state.pendingTextObjOp, pRow, pCol, tobj);
          }
          state.pendingTextObjOp = null;
        }
        pendingOperator = null; operatorCount = 0;
        render(); return;
      }
      // q{a-z}: start macro recording
      if (op === 'q_start') {
        if (e.key >= 'a' && e.key <= 'z') {
          state.macroRecording = e.key;
          state.macroRegisters[e.key] = [];
          setStatus('recording @' + e.key);
          render();
        }
        return;
      }
      // @{a-z} or @@: replay macro
      if (op === 'at') {
        var atCount = getCount();
        if (e.key === '@' && state.macroLastPlayed) {
          replayMacro(state.macroLastPlayed, atCount);
        } else if (e.key >= 'a' && e.key <= 'z') {
          replayMacro(e.key, atCount);
        }
        render(); return;
      }
      // f/F/t/T: strip v_ prefix for visual mode, strip op_ prefix for operator+find
      var findOp = op;
      var opPrefix = null;
      if (op.indexOf('v_') === 0) { findOp = op.slice(2); }
      else if (op.indexOf('op_') === 0) { findOp = op.slice(3); opPrefix = pendingOperator; }
      else { findOp = op; }
      state.lastFind = { op: findOp, ch: e.key };
      if (opPrefix) {
        // operator+find: compute range and apply
        var range = computeMotionRange(findOp, pRow, pCol, 1, e.key);
        if (range) { applyOperator(opPrefix, pRow, pCol, range); }
        pendingOperator = null; operatorCount = 0;
      } else {
        execFind(findOp, e.key, pRow, pCol);
        render();
      }
      return;
    }

    var row = state.cursor.row;
    var col = state.cursor.col;
    var line = getLine(row);

    // --- two-key timers ---
    if (e.key === 'g' && !pendingOperator) {
      if (gTimer) {
        clearTimeout(gTimer); gTimer = null;
        state.cursor.row = 0;
        state.cursor.col = clampCol(0, state.curswant);
        render();
      } else {
        gTimer = setTimeout(function() { gTimer = null; }, 500);
      }
      return;
    }
    // ge/gE: end of previous word/WORD
    if ((e.key === 'e' || e.key === 'E') && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      var geN = getCount();
      var geR = row, geC = col;
      var geFn = e.key === 'e' ? wordEndBackward : WORDEndBackward;
      for (var gei = 0; gei < geN; gei++) { var gep = geFn(geR, geC); geR = gep.row; geC = gep.col; }
      state.cursor.row = geR; state.cursor.col = geC; state.curswant = geC;
      render(); return;
    }
    // gx: open URL under cursor (supports https:// and bare domains)
    if (e.key === 'x' && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      var urlMatch = line.match(/https?:\/\/[^\s)>\]]+/);
      if (urlMatch) {
        window.open(urlMatch[0], '_blank');
        setStatus('Opened: ' + urlMatch[0]);
      } else {
        var bareMatch = line.match(/[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s)>\]]*/);
        if (bareMatch) {
          var bareUrl = 'https://' + bareMatch[0];
          window.open(bareUrl, '_blank');
          setStatus('Opened: ' + bareUrl);
        } else {
          setStatus('No URL found on this line');
        }
      }
      return;
    }
    // gJ: join without space
    if (e.key === 'J' && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      getCount();
      if (row < state.lines.length - 1) {
        pushUndo();
        state.lines[row] = getLine(row) + getLine(row + 1);
        deleteLine(row + 1);
        render();
      }
      return;
    }
    // g~/gu/gU: case change operators (wait for motion)
    if ((e.key === '~' || e.key === 'u' || e.key === 'U') && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      pendingOperator = 'g' + e.key;
      operatorCount = countBuf;
      countBuf = 0;
      return;
    }

    // --- Operator+motion grammar: d, c, y, >, <, g~/gu/gU ---
    // If same key pressed twice: linewise (dd, cc, yy, >>, <<)
    // Otherwise: set pending and wait for motion
    if (e.key === 'd' || e.key === 'c' || e.key === 'y' || e.key === '>' || e.key === '<') {
      if (pendingOperator === e.key) {
        // Double-press: linewise operation on count lines
        var opN = (operatorCount > 1 ? operatorCount : 1) * getCount();
        var opEnd = Math.min(row + opN - 1, state.lines.length - 1);
        applyOperator(e.key, row, col, { endRow: opEnd, endCol: 0, linewise: true });
        if (e.key === 'd') recordChange('dd');
        if (e.key === 'c') { recordChange('cc'); state.insertText = ''; }
        if (e.key === '>') recordChange('>>');
        if (e.key === '<') recordChange('<<');
        if (e.key === 'y') recordChange('yy');
        pendingOperator = null; operatorCount = 0;
        return;
      }
      // Set pending operator, capture count
      pendingOperator = e.key;
      operatorCount = countBuf;
      countBuf = 0;
      return;
    }

    // g~/gu/gU linewise double-press: g~g~ or g~~ , guu, gUU
    if (pendingOperator && (pendingOperator === 'g~' || pendingOperator === 'gu' || pendingOperator === 'gU')) {
      var gCaseOp = pendingOperator;
      // Accept: g~g~ (user types g then ~), guu, gUU, or just ~ / u / U
      var expectChar = gCaseOp[1]; // ~ or u or U
      if (e.key === expectChar || (e.key === 'g' && gCaseOp === 'g~')) {
        if (e.key === 'g' && gCaseOp === 'g~') {
          // Need one more ~ to complete g~g~
          // Stay pending, but set a flag. Actually, vim accepts g~~ too.
          // Simplify: treat g as start of a new g-combo, which will set g~ again. Drop for now.
        }
        var gcN = (operatorCount > 1 ? operatorCount : 1) * getCount();
        var gcEnd = Math.min(row + gcN - 1, state.lines.length - 1);
        applyOperator(gCaseOp, row, col, { endRow: gcEnd, endCol: 0, linewise: true });
        pendingOperator = null; operatorCount = 0;
        render(); return;
      }
    }

    // If pending operator and a motion key arrives, execute operator+motion
    if (pendingOperator) {
      var opKey = pendingOperator;
      var opRow = state.cursor.row;
      var opCol = state.cursor.col;
      var totalCount = (operatorCount || 1) * getCount();
      pendingOperator = null; operatorCount = 0;

      // Handle second key after g for dgg/dge/dgE
      if (state.pendingGForOp) {
        state.pendingGForOp = false;
        if (e.key === 'g') {
          var opRange = computeMotionRange('g', opRow, opCol, totalCount, null);
          if (opRange) { applyOperator(opKey, opRow, opCol, opRange); }
          render(); return;
        }
        if (e.key === 'e' || e.key === 'E') {
          var geFn2 = e.key === 'e' ? wordEndBackward : WORDEndBackward;
          var geR2 = opRow, geC2 = opCol;
          for (var gei2 = 0; gei2 < totalCount; gei2++) { var gep2 = geFn2(geR2, geC2); geR2 = gep2.row; geC2 = gep2.col; }
          applyOperator(opKey, opRow, opCol, { endRow: geR2, endCol: geC2, linewise: false });
          render(); return;
        }
        // Unknown g-motion, drop
        render(); return;
      }

      // Handle f/F/t/T with pending operator (needs char arg)
      if (e.key === 'f' || e.key === 'F' || e.key === 't' || e.key === 'T') {
        state.pendingOp = 'op_' + e.key;
        pendingOperator = opKey;
        return;
      }
      // Handle g with pending operator: need second g for gg motion
      if (e.key === 'g') {
        pendingOperator = opKey;
        operatorCount = totalCount;
        state.pendingGForOp = true;
        return;
      }
      // Handle G with raw count
      if (e.key === 'G') {
        var gCount = totalCount === 1 ? -1 : totalCount;
        var opRangeG = computeMotionRange('G', opRow, opCol, gCount, null);
        if (opRangeG) { applyOperator(opKey, opRow, opCol, opRangeG); }
        render(); return;
      }

      // Text objects: operator + i/a + w/W/p
      if (e.key === 'i' || e.key === 'a') {
        state.pendingOp = e.key === 'i' ? 'textobj_i' : 'textobj_a';
        state.pendingTextObjOp = opKey;
        state.pendingTextObjCount = totalCount;
        pendingOperator = null; operatorCount = 0;
        return;
      }
      // Mark motions: operator + `/'{a-z}
      if (e.key === '`') {
        state.pendingOp = 'op_backtick';
        state.pendingTextObjOp = opKey;
        return;
      }
      if (e.key === "'") {
        state.pendingOp = 'op_quote';
        state.pendingTextObjOp = opKey;
        return;
      }

      // vim special case: cw/cW behave like ce/cE (stop at end of word, not start of next)
      var motionKey = e.key;
      if (opKey === 'c' && motionKey === 'w') motionKey = 'e';
      if (opKey === 'c' && motionKey === 'W') motionKey = 'E';
      var opRange2 = computeMotionRange(motionKey, opRow, opCol, totalCount, null);
      if (opRange2) {
        applyOperator(opKey, opRow, opCol, opRange2);
      }
      render(); return;
    }

    // clear gTimer on unrelated keys
    if (gTimer && e.key !== 'g') { clearTimeout(gTimer); gTimer = null; }

    // --- navigation (all support count prefix) ---
    if (e.key === 'h') {
      var hN = getCount();
      state.cursor.col = clampCol(row, col - hN);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'l') {
      var lN = getCount();
      state.cursor.col = clampCol(row, col + lN);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'j') {
      var jN = getCount();
      var newRow = clampRow(row + jN);
      state.cursor.row = newRow;
      state.cursor.col = clampCol(newRow, state.curswant);
      render(); return;
    }
    if (e.key === 'k') {
      var kN = getCount();
      var newRowK = clampRow(row - kN);
      state.cursor.row = newRowK;
      state.cursor.col = clampCol(newRowK, state.curswant);
      render(); return;
    }
    if (e.key === 'G') {
      var gN = countBuf;
      countBuf = 0;
      // {N}G goes to line N, plain G goes to last line
      state.cursor.row = gN > 0 ? clampRow(gN - 1) : state.lines.length - 1;
      state.cursor.col = clampCol(state.cursor.row, state.curswant);
      render(); return;
    }
    if (e.key === '0') {
      countBuf = 0;
      state.cursor.col = 0; state.curswant = 0; render(); return;
    }
    if (e.key === '$') {
      getCount(); // consume count (vim: {N}$ goes N-1 lines down then end)
      var endCol = Math.max(0, getLine(row).length - 1);
      state.cursor.col = endCol; state.curswant = endCol; render(); return;
    }
    if (e.key === 'w') {
      var wN = getCount();
      var wR = row, wC = col;
      for (var wi = 0; wi < wN; wi++) {
        var wPos = wordForward(wR, wC); wR = wPos.row; wC = wPos.col;
      }
      state.cursor.row = wR; state.cursor.col = wC;
      state.curswant = wC; render(); return;
    }
    if (e.key === 'b') {
      var bN = getCount();
      var bR = row, bC = col;
      for (var bi = 0; bi < bN; bi++) {
        var bPos = wordBackward(bR, bC); bR = bPos.row; bC = bPos.col;
      }
      state.cursor.row = bR; state.cursor.col = bC;
      state.curswant = bC; render(); return;
    }
    if (e.key === 'e') {
      var eN = getCount();
      var eR = row, eC = col;
      for (var ei = 0; ei < eN; ei++) {
        var ePos = wordEnd(eR, eC); eR = ePos.row; eC = ePos.col;
      }
      state.cursor.row = eR; state.cursor.col = eC;
      state.curswant = eC; render(); return;
    }
    if (e.key === 'W') {
      var WN = getCount();
      var WR = row, WC = col;
      for (var Wi = 0; Wi < WN; Wi++) {
        var WPos = WORDForward(WR, WC); WR = WPos.row; WC = WPos.col;
      }
      state.cursor.row = WR; state.cursor.col = WC;
      state.curswant = WC; render(); return;
    }
    if (e.key === 'B') {
      var BN = getCount();
      var BR = row, BC = col;
      for (var Bi = 0; Bi < BN; Bi++) {
        var BPos = WORDBackward(BR, BC); BR = BPos.row; BC = BPos.col;
      }
      state.cursor.row = BR; state.cursor.col = BC;
      state.curswant = BC; render(); return;
    }
    if (e.key === 'E') {
      var EN = getCount();
      var ER = row, EC = col;
      for (var Ei = 0; Ei < EN; Ei++) {
        var EPos = WORDEnd(ER, EC); ER = EPos.row; EC = EPos.col;
      }
      state.cursor.row = ER; state.cursor.col = EC;
      state.curswant = EC; render(); return;
    }
    if (e.key === '^') {
      getCount(); // consume
      var fnb = firstNonBlank(row);
      state.cursor.col = fnb; state.curswant = fnb; render(); return;
    }
    // z commands: zz, zt, zb (scroll cursor to center/top/bottom)
    if (e.key === 'z') {
      state.pendingOp = 'z';
      return;
    }
    // H/M/L screen-relative jumps
    if (e.key === 'H') {
      getCount();
      var scrollTop = Math.floor(contentEl.scrollTop / lineH);
      state.cursor.row = clampRow(scrollTop);
      state.cursor.col = firstNonBlank(state.cursor.row);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'M') {
      getCount();
      var scrollTopM = Math.floor(contentEl.scrollTop / lineH);
      var visRowsM = Math.floor(bodyEl.clientHeight / lineH);
      state.cursor.row = clampRow(scrollTopM + Math.floor(visRowsM / 2));
      state.cursor.col = firstNonBlank(state.cursor.row);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'L') {
      getCount();
      var scrollTopL = Math.floor(contentEl.scrollTop / lineH);
      var visRowsL = Math.floor(bodyEl.clientHeight / lineH);
      state.cursor.row = clampRow(scrollTopL + visRowsL - 1);
      state.cursor.col = firstNonBlank(state.cursor.row);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'Enter') {
      if (isExplorerBuffer()) {
        var eLine = state.lines[row].trim();
        if (eLine && resolveBlogPath(eLine)) {
          execCommand('e ' + eLine);
        }
      } else {
        var nRow = clampRow(row + 1);
        state.cursor.row = nRow;
        var nfc = firstNonBlank(nRow);
        state.cursor.col = nfc;
        state.curswant = nfc;
      }
      render(); return;
    }
    if (e.key === '-') {
      openExplorer();
      return;
    }
    if (e.key === '{') {
      var pBN = getCount();
      var pBR = row;
      for (var pBi = 0; pBi < pBN; pBi++) pBR = paragraphBackward(pBR);
      state.cursor.row = pBR; state.cursor.col = 0; state.curswant = 0;
      render(); return;
    }
    if (e.key === '}') {
      var pFN = getCount();
      var pFR = row;
      for (var pFi = 0; pFi < pFN; pFi++) pFR = paragraphForward(pFR);
      state.cursor.row = pFR; state.cursor.col = 0; state.curswant = 0;
      render(); return;
    }
    if (e.key === '%') {
      getCount(); // consume
      var mb = matchBracket(row, col);
      if (mb) {
        state.cursor.row = mb.row; state.cursor.col = mb.col;
        state.curswant = mb.col;
        render();
      }
      return;
    }

    // r: replace char, f/F/t/T: find-char motions (all pending single-char)
    if (e.key === 'r' && !e.ctrlKey) {
      state.pendingOp = 'r'; return;
    }
    if (e.key === 'f' || e.key === 'F' || e.key === 't' || e.key === 'T') {
      state.pendingOp = e.key; return;
    }
    if (e.key === ';') {
      if (state.lastFind) {
        var sCol = col;
        if (state.lastFind.op === 't') sCol++;
        if (state.lastFind.op === 'T') sCol--;
        execFind(state.lastFind.op, state.lastFind.ch, row, sCol);
        render();
      }
      return;
    }
    if (e.key === ',') {
      if (state.lastFind) {
        var rev = { f: 'F', F: 'f', t: 'T', T: 't' }[state.lastFind.op];
        var rCol = col;
        if (rev === 't') rCol++;
        if (rev === 'T') rCol--;
        execFind(rev, state.lastFind.ch, row, rCol);
        render();
      }
      return;
    }

    // --- enter insert mode ---
    if (e.key === 'i') {
      state.mode = 'insert'; state.insertText = '';
      recordChange('insert', { entryKey: 'i' }); render(); return;
    }
    if (e.key === 'a') {
      state.mode = 'insert'; state.insertText = '';
      if (col < line.length) state.cursor.col = col + 1;
      recordChange('insert', { entryKey: 'a' }); render(); return;
    }
    if (e.key === 'o') {
      pushUndo();
      insertLine(row + 1, '');
      state.cursor.row = row + 1;
      state.cursor.col = 0;
      state.curswant = 0;
      state.mode = 'insert'; state.insertText = '';
      recordChange('o');
      render(); return;
    }
    if (e.key === 'O') {
      pushUndo();
      insertLine(row, '');
      state.cursor.col = 0;
      state.curswant = 0;
      state.mode = 'insert'; state.insertText = '';
      recordChange('O');
      render(); return;
    }
    if (e.key === 'A') {
      state.mode = 'insert'; state.insertText = '';
      state.cursor.col = line.length;
      state.curswant = state.cursor.col;
      recordChange('insert', { entryKey: 'A' }); render(); return;
    }
    if (e.key === 'I') {
      state.mode = 'insert'; state.insertText = '';
      state.cursor.col = firstNonBlank(row);
      state.curswant = state.cursor.col;
      recordChange('insert', { entryKey: 'I' }); render(); return;
    }
    if (e.key === 'C') {
      pushUndo();
      setRegister(line.slice(col), false);
      state.lines[row] = line.slice(0, col);
      state.mode = 'insert';
      state.insertText = '';
      recordChange('C');
      render(); return;
    }
    if (e.key === 'D') {
      pushUndo();
      setRegister(line.slice(col), false);
      state.lines[row] = line.slice(0, col);
      state.cursor.col = clampCol(row, col - 1);
      state.curswant = state.cursor.col;
      recordChange('D');
      render(); return;
    }
    if (e.key === 'S') {
      pushUndo();
      setRegister(line, false);
      state.lines[row] = '';
      state.cursor.col = 0;
      state.curswant = 0;
      state.mode = 'insert';
      state.insertText = '';
      recordChange('S');
      render(); return;
    }
    if (e.key === 's') {
      if (line.length > 0) {
        pushUndo();
        setRegister(line[col], false);
        state.lines[row] = line.slice(0, col) + line.slice(col + 1);
        state.mode = 'insert';
        state.insertText = '';
        recordChange('insert');
        render();
      }
      return;
    }
    if (e.key === 'J') {
      var jnN = getCount();
      if (row < state.lines.length - 1) {
        pushUndo();
        for (var jni = 0; jni < jnN && row < state.lines.length - 1; jni++) {
          var jLine = getLine(row);
          var jNext = getLine(row + 1).replace(/^\s+/, '');
          var jSep = jLine.length > 0 ? ' ' : '';
          state.cursor.col = jLine.length;
          state.lines[row] = jLine + jSep + jNext;
          state.lines.splice(row + 1, 1);
        }
        state.curswant = state.cursor.col;
        recordChange('J');
        render();
      }
      return;
    }
    if (e.key === '~') {
      var tilN = getCount();
      if (line.length > 0) {
        pushUndo();
        var tilLine = line;
        for (var ti = 0; ti < tilN && col + ti < tilLine.length; ti++) {
          var tch = tilLine[col + ti];
          var ttog = tch === tch.toLowerCase() ? tch.toUpperCase() : tch.toLowerCase();
          tilLine = tilLine.slice(0, col + ti) + ttog + tilLine.slice(col + ti + 1);
        }
        state.lines[row] = tilLine;
        state.cursor.col = clampCol(row, col + tilN);
        state.curswant = state.cursor.col;
        recordChange('~');
        render();
      }
      return;
    }

    // --- text ops ---
    if (e.key === 'x') {
      var xN = getCount();
      if (line.length > 0) {
        pushUndo();
        var xEnd = Math.min(col + xN, line.length);
        setRegister(line.slice(col, xEnd), false);
        state.lines[row] = line.slice(0, col) + line.slice(xEnd);
        state.cursor.col = clampCol(row, col);
        state.curswant = state.cursor.col;
        recordChange('x', { count: xN });
        render();
      }
      return;
    }
    if (e.key === 'p') {
      if (!state.register) { setStatus('Nothing in register'); return; }
      pushUndo();
      if (state.registerLinewise || state.register.indexOf('\n') !== -1) {
        var pasteLines = state.register.split('\n');
        for (var pi = pasteLines.length - 1; pi >= 0; pi--) {
          insertLine(row + 1, pasteLines[pi]);
        }
        state.cursor.row = row + 1;
        state.cursor.col = 0;
      } else {
        state.lines[row] = line.slice(0, col + 1) + state.register + line.slice(col + 1);
        state.cursor.col = col + state.register.length;
      }
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'P') {
      if (!state.register) { setStatus('Nothing in register'); return; }
      pushUndo();
      if (state.registerLinewise || state.register.indexOf('\n') !== -1) {
        var pasteLinesP = state.register.split('\n');
        for (var pj = pasteLinesP.length - 1; pj >= 0; pj--) {
          insertLine(row, pasteLinesP[pj]);
        }
        state.cursor.col = 0;
      } else {
        state.lines[row] = line.slice(0, col) + state.register + line.slice(col);
        state.cursor.col = col + state.register.length - 1;
      }
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'u') { undo(); return; }
    if (e.key === 'U') {
      // Undo all changes on current line (restore to lineUndoText)
      if (state.lineUndoRow === row && state.lineUndoText !== getLine(row)) {
        pushUndo();
        state.lines[row] = state.lineUndoText;
        render();
      }
      return;
    }

    // & repeat last substitution
    if (e.key === '&') {
      if (state.lastSub) {
        var ls = state.lastSub;
        var lsRe;
        try { lsRe = new RegExp(ls.pattern, ls.global ? 'g' : ''); } catch(ex) { return; }
        pushUndo();
        var lsOrig = getLine(row);
        state.lines[row] = lsOrig.replace(lsRe, ls.replacement);
        if (state.lines[row] !== lsOrig) setStatus('1 substitution');
        else setStatus('No match');
        render();
      }
      return;
    }

    // R: replace mode
    if (e.key === 'R') {
      getCount();
      state.mode = 'replace';
      state.replaceUndo = [];
      render(); return;
    }

    // . dot repeat
    if (e.key === '.') {
      if (state.lastChange) {
        var lc = state.lastChange;
        var dotCount = getCount();
        for (var doti = 0; doti < dotCount; doti++) {
          replayChange(lc);
        }
        render();
      }
      return;
    }

    // --- enter visual mode ---
    if (e.key === 'v') {
      state.mode = 'visual';
      state.visualMode = 'char';
      state.visualAnchor = { row: row, col: col };
      render(); return;
    }
    if (e.key === 'V') {
      state.mode = 'visual';
      state.visualMode = 'line';
      state.visualAnchor = { row: row, col: 0 };
      render(); return;
    }

    // --- enter command / search mode ---
    if (e.key === ':') {
      state.mode = 'command'; state.cmdBuf = '';
      if (state.zenMode) cmdlineEl.style.display = '';
      render(); return;
    }
    if (e.key === '/' || e.key === '?') {
      state.mode = 'search'; state.searchBuf = '';
      state.searchDir = e.key === '/' ? 1 : -1;
      state.searchMatches = []; state.searchPattern = null;
      state.preSearchCursor = { row: state.cursor.row, col: state.cursor.col };
      if (state.zenMode) cmdlineEl.style.display = '';
      render(); return;
    }

    // n / N for search cycling
    if (e.key === 'n') { searchNext(state.searchDir); return; }
    if (e.key === 'N') { searchNext(-state.searchDir); return; }

    // * / # word-under-cursor search
    if (e.key === '*' || e.key === '#') {
      getCount();
      var wStart = col, wEnd = col;
      while (wStart > 0 && /\w/.test(line[wStart - 1])) wStart--;
      while (wEnd < line.length - 1 && /\w/.test(line[wEnd + 1])) wEnd++;
      if (/\w/.test(line[col])) {
        var word = line.slice(wStart, wEnd + 1);
        var pat = '\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b';
        state.searchBuf = pat;
        buildMatches(pat);
        if (state.searchMatches.length) {
          // find nearest match in requested direction
          var bestIdx = 0;
          for (var si = 0; si < state.searchMatches.length; si++) {
            var sm = state.searchMatches[si];
            if (sm.row > row || (sm.row === row && sm.col > col)) { bestIdx = si; break; }
          }
          if (e.key === '#') bestIdx = (bestIdx - 1 + state.searchMatches.length) % state.searchMatches.length;
          jumpToMatch(bestIdx);
          setStatus('/' + pat);
        }
        render();
      }
      return;
    }

    // ZZ (save+quit), ZQ (quit without save)
    if (e.key === 'Z') {
      state.pendingOp = 'Z';
      return;
    }

    // m{a-z}: set mark
    if (e.key === 'm') {
      state.pendingOp = 'm';
      return;
    }
    // `{a-z}: jump to exact mark
    if (e.key === '`') {
      state.pendingOp = 'backtick';
      return;
    }
    // '{a-z}: jump to first non-blank of marked line
    if (e.key === "'") {
      state.pendingOp = 'quote';
      return;
    }

    // q: macro recording start/stop
    if (e.key === 'q') {
      if (state.macroRecording) {
        // stop recording
        var recLetter = state.macroRecording;
        state.macroRecording = null;
        setStatus('Recorded @' + recLetter);
        render();
      } else {
        // start recording: wait for register letter
        state.pendingOp = 'q_start';
      }
      return;
    }
    // @{a-z} or @@: replay macro
    if (e.key === '@') {
      state.pendingOp = 'at';
      return;
    }

    // consume any remaining count on unhandled keys
    countBuf = 0;
  }

  function handleInsert(e) {
    var row = state.cursor.row;
    var col = state.cursor.col;
    var line = getLine(row);

    if (e.key === 'Escape') {
      if (state.lastChange) state.lastChange.insertText = state.insertText;
      state.mode = 'normal';
      state.cursor.col = clampCol(row, col - 1);
      state.curswant = state.cursor.col;
      render(); return;
    }
    if (e.key === 'Enter') {
      pushUndo();
      state.lines[row] = line.slice(0, col);
      insertLine(row + 1, line.slice(col));
      state.cursor.row = row + 1;
      state.cursor.col = 0;
      state.curswant = 0;
      state.insertText += '\n';
      render(); return;
    }
    if (e.key === 'Backspace') {
      if (col > 0) {
        pushUndo();
        state.lines[row] = line.slice(0, col - 1) + line.slice(col);
        state.cursor.col = col - 1;
        state.curswant = state.cursor.col;
      } else if (row > 0) {
        pushUndo();
        var prevLine = getLine(row - 1);
        var joinCol = prevLine.length;
        state.lines[row - 1] = prevLine + line;
        state.lines.splice(row, 1);
        state.cursor.row = row - 1;
        state.cursor.col = joinCol;
        state.curswant = joinCol;
      }
      state.insertText = state.insertText.slice(0, -1);
      render(); return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      pushUndo();
      var spaces = '    ';
      state.lines[row] = line.slice(0, col) + spaces + line.slice(col);
      state.cursor.col = col + spaces.length;
      state.curswant = state.cursor.col;
      state.insertText += spaces;
      render(); return;
    }
    if (e.key === 'ArrowLeft')  { state.cursor.col = clampCol(row, col - 1); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'ArrowRight') { state.cursor.col = clampCol(row, col + 1); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'ArrowUp')    { state.cursor.row = clampRow(row - 1); state.cursor.col = clampCol(state.cursor.row, state.curswant); render(); return; }
    if (e.key === 'ArrowDown')  { state.cursor.row = clampRow(row + 1); state.cursor.col = clampCol(state.cursor.row, state.curswant); render(); return; }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      pushUndo();
      state.lines[row] = line.slice(0, col) + e.key + line.slice(col);
      state.cursor.col = col + 1;
      state.curswant = state.cursor.col;
      state.insertText += e.key;
      render();
    }
  }

  function handleReplace(e) {
    var row = state.cursor.row;
    var col = state.cursor.col;
    var line = getLine(row);

    if (e.key === 'Escape') {
      state.mode = 'normal';
      state.cursor.col = clampCol(row, col - 1);
      state.curswant = state.cursor.col;
      state.replaceUndo = [];
      render(); return;
    }
    if (e.key === 'Backspace') {
      if (state.replaceUndo.length > 0) {
        var prev = state.replaceUndo.pop();
        state.cursor.col = col - 1;
        state.lines[row] = line.slice(0, col - 1) + prev + line.slice(col);
        render();
      }
      return;
    }
    if (e.key === 'Enter') {
      pushUndo();
      state.replaceUndo = [];
      state.lines[row] = line.slice(0, col);
      insertLine(row + 1, line.slice(col));
      state.cursor.row = row + 1;
      state.cursor.col = 0;
      state.curswant = 0;
      render(); return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      pushUndo();
      if (col < line.length) {
        state.replaceUndo.push(line[col]);
        state.lines[row] = line.slice(0, col) + e.key + line.slice(col + 1);
      } else {
        state.replaceUndo.push('');
        state.lines[row] = line + e.key;
      }
      state.cursor.col = col + 1;
      state.curswant = state.cursor.col;
      render();
    }
  }

  // -------------------------------------------------------------------------
  // Dot repeat: replay last change
  // -------------------------------------------------------------------------
  function recordChange(type, extra) {
    state.lastChange = { type: type };
    if (extra) {
      for (var k in extra) {
        if (extra.hasOwnProperty(k)) state.lastChange[k] = extra[k];
      }
    }
  }

  function replayChange(lc) {
    var row = state.cursor.row;
    var col = state.cursor.col;
    var line = getLine(row);
    switch (lc.type) {
      case 'dd':
        if (state.lines.length > 1) {
          pushUndo();
          setRegister(getLine(row), true);
          deleteLine(row);
          state.cursor.row = clampRow(row);
          state.cursor.col = firstNonBlank(state.cursor.row);
        }
        break;
      case 'x':
        if (line.length > 0) {
          pushUndo();
          var xEnd = Math.min(col + (lc.count || 1), line.length);
          setRegister(line.slice(col, xEnd), false);
          state.lines[row] = line.slice(0, col) + line.slice(xEnd);
          state.cursor.col = clampCol(row, col);
        }
        break;
      case 'r':
        if (line.length > 0 && lc.ch) {
          pushUndo();
          state.lines[row] = line.slice(0, col) + lc.ch + line.slice(col + 1);
        }
        break;
      case '~':
        if (line.length > col) {
          pushUndo();
          var tch = line[col];
          var ttog = tch === tch.toLowerCase() ? tch.toUpperCase() : tch.toLowerCase();
          state.lines[row] = line.slice(0, col) + ttog + line.slice(col + 1);
          state.cursor.col = clampCol(row, col + 1);
        }
        break;
      case 'J':
        if (row < state.lines.length - 1) {
          pushUndo();
          var jNext = getLine(row + 1).replace(/^\s+/, '');
          var jSep = line.length > 0 ? ' ' : '';
          state.cursor.col = line.length;
          state.lines[row] = line + jSep + jNext;
          state.lines.splice(row + 1, 1);
        }
        break;
      case 'D':
        pushUndo();
        setRegister(line.slice(col), false);
        state.lines[row] = line.slice(0, col);
        state.cursor.col = clampCol(row, col - 1);
        break;
      case 'C':
      case 'S':
      case 'cc':
        pushUndo();
        if (lc.type === 'S' || lc.type === 'cc') {
          state.lines[row] = '';
          state.cursor.col = 0;
        } else {
          state.lines[row] = line.slice(0, col);
        }
        if (lc.insertText) {
          state.lines[row] = state.lines[row].slice(0, state.cursor.col) + lc.insertText + state.lines[row].slice(state.cursor.col);
          state.cursor.col += lc.insertText.length;
        }
        break;
      case 'o':
      case 'O':
        pushUndo();
        var oRow = lc.type === 'o' ? row + 1 : row;
        insertLine(oRow, lc.insertText || '');
        state.cursor.row = oRow;
        state.cursor.col = (lc.insertText || '').length;
        break;
      case '>>':
        pushUndo();
        state.lines[row] = '  ' + line;
        state.cursor.col = firstNonBlank(row);
        break;
      case '<<':
        pushUndo();
        if (line.slice(0, 2) === '  ') state.lines[row] = line.slice(2);
        else if (line[0] === ' ') state.lines[row] = line.slice(1);
        else if (line[0] === '\t') state.lines[row] = line.slice(1);
        state.cursor.col = firstNonBlank(row);
        break;
      case 'yy':
        // yy doesn't modify buffer, nothing to replay
        break;
      case 'insert':
        if (lc.insertText) {
          pushUndo();
          // Replicate cursor positioning from original entry command
          if (lc.entryKey === 'a' && col < getLine(row).length) col = col + 1;
          else if (lc.entryKey === 'A') col = getLine(row).length;
          else if (lc.entryKey === 'I') col = firstNonBlank(row);
          state.cursor.col = col;
          line = getLine(row);
          state.lines[row] = line.slice(0, col) + lc.insertText + line.slice(col);
          state.cursor.col = col + lc.insertText.length;
        }
        break;
      default:
        break;
    }
    state.curswant = state.cursor.col;
  }

  // -------------------------------------------------------------------------
  // Macro replay
  // -------------------------------------------------------------------------
  function replayMacro(letter, count) {
    var keys = state.macroRegisters[letter];
    if (!keys || !keys.length) { setStatus('E748: No previously used register'); return; }
    state.macroLastPlayed = letter;
    state.macroDepth++;
    if (state.macroDepth > 10) { setStatus('E169: Macro recursion limit reached'); state.macroDepth--; return; }
    var total = 0;
    for (var i = 0; i < count; i++) {
      for (var j = 0; j < keys.length; j++) {
        handleKey(new KeyboardEvent('keydown', keys[j]));
        total++;
        if (total > 1000) { setStatus('Macro safety limit (1000 keystrokes)'); state.macroDepth--; return; }
      }
    }
    state.macroDepth--;
  }

  function handleVisual(e) {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    var row = state.cursor.row;
    var col = state.cursor.col;

    // Pending single-char ops in visual mode (vf{char}, vi{w}, etc.)
    if (state.pendingOp) {
      if (e.key.length !== 1) return;
      var vop = state.pendingOp;
      state.pendingOp = null;
      // vf/vF/vt/vT
      if (vop === 'v_f' || vop === 'v_F' || vop === 'v_t' || vop === 'v_T') {
        var vfOp = vop.slice(2);
        state.lastFind = { op: vfOp, ch: e.key };
        execFind(vfOp, e.key, row, col);
        render();
        return;
      }
      // text objects
      if (vop === 'v_textobj_i' || vop === 'v_textobj_a') {
        var vtP = vop === 'v_textobj_i' ? 'i' : 'a';
        if (e.key === 'w' || e.key === 'W' || e.key === 'p') {
          var vtobj = computeTextObject(vtP, e.key, row, col);
          if (vtobj) {
            state.visualAnchor = { row: vtobj.startRow, col: vtobj.startCol };
            state.cursor.row = vtobj.endRow;
            state.cursor.col = Math.max(0, vtobj.endCol - 1);
            if (vtobj.linewise) {
              state.visualMode = 'line';
              state.cursor.col = Math.max(0, getLine(vtobj.endRow).length - 1);
            }
            state.curswant = state.cursor.col;
          }
          render();
        }
        return;
      }
      return;
    }

    // Count prefix in visual mode
    if (e.key >= '1' && e.key <= '9' || (e.key === '0' && countBuf > 0)) {
      countBuf = countBuf * 10 + parseInt(e.key, 10);
      if (countBuf > 9999) countBuf = 9999;
      return;
    }

    if (e.key === 'Escape') {
      state.mode = 'normal';
      exitVisual();
      render(); return;
    }
    if (e.key === 'V' && state.visualMode === 'char') {
      state.visualMode = 'line';
      state.visualAnchor = { row: state.visualAnchor.row, col: 0 };
      render(); return;
    }
    if (e.key === 'v' && state.visualMode === 'line') {
      state.visualMode = 'char';
      render(); return;
    }
    if (e.key === 'd' || e.key === 'x') {
      deleteVisual();
      state.mode = 'normal';
      exitVisual();
      render(); return;
    }
    if (e.key === 'c') {
      deleteVisual();
      state.mode = 'insert';
      exitVisual();
      render(); return;
    }
    if (e.key === '~') {
      var vr = getVisualRange();
      if (vr) {
        pushUndo();
        for (var vti = vr.startRow; vti <= vr.endRow; vti++) {
          var vtLine = getLine(vti);
          var vtStart = (vti === vr.startRow) ? vr.startCol : 0;
          var vtEnd = (vti === vr.endRow) ? vr.endCol : vtLine.length;
          var vtNew = '';
          for (var vtj = 0; vtj < vtLine.length; vtj++) {
            if (vtj >= vtStart && vtj < vtEnd) {
              var vtc = vtLine[vtj];
              vtNew += vtc === vtc.toLowerCase() ? vtc.toUpperCase() : vtc.toLowerCase();
            } else { vtNew += vtLine[vtj]; }
          }
          state.lines[vti] = vtNew;
        }
      }
      state.mode = 'normal'; exitVisual();
      render(); return;
    }
    if (e.key === 'U') {
      var vru = getVisualRange();
      if (vru) {
        pushUndo();
        for (var vui = vru.startRow; vui <= vru.endRow; vui++) {
          var vuLine = getLine(vui);
          var vuStart = (vui === vru.startRow) ? vru.startCol : 0;
          var vuEnd = (vui === vru.endRow) ? vru.endCol : vuLine.length;
          state.lines[vui] = vuLine.slice(0, vuStart) + vuLine.slice(vuStart, vuEnd).toUpperCase() + vuLine.slice(vuEnd);
        }
      }
      state.mode = 'normal'; exitVisual();
      render(); return;
    }
    if (e.key === 'u' && state.visualMode) {
      var vrl = getVisualRange();
      if (vrl) {
        pushUndo();
        for (var vli = vrl.startRow; vli <= vrl.endRow; vli++) {
          var vlLine = getLine(vli);
          var vlStart = (vli === vrl.startRow) ? vrl.startCol : 0;
          var vlEnd = (vli === vrl.endRow) ? vrl.endCol : vlLine.length;
          state.lines[vli] = vlLine.slice(0, vlStart) + vlLine.slice(vlStart, vlEnd).toLowerCase() + vlLine.slice(vlEnd);
        }
      }
      state.mode = 'normal'; exitVisual();
      render(); return;
    }
    if (e.key === '>' || e.key === '<') {
      var vri = getVisualRange();
      if (vri) {
        pushUndo();
        for (var vii = vri.startRow; vii <= vri.endRow; vii++) {
          if (e.key === '>') {
            state.lines[vii] = '  ' + getLine(vii);
          } else {
            var viLine = getLine(vii);
            if (viLine.slice(0, 2) === '  ') state.lines[vii] = viLine.slice(2);
            else if (viLine[0] === ' ') state.lines[vii] = viLine.slice(1);
            else if (viLine[0] === '\t') state.lines[vii] = viLine.slice(1);
          }
        }
      }
      state.mode = 'normal'; exitVisual();
      render(); return;
    }
    if (e.key === 'y') {
      yankVisual();
      state.mode = 'normal';
      exitVisual();
      setStatus('yanked');
      render(); return;
    }
    // text objects in visual mode: viw, vaw, vip, vap, etc.
    if (e.key === 'i' || e.key === 'a') {
      state.pendingOp = 'v_textobj_' + e.key;
      return;
    }
    // movement in visual
    if (e.key === 'g') {
      if (gTimer) {
        clearTimeout(gTimer); gTimer = null;
        var ggN = countBuf > 0 ? countBuf - 1 : 0; countBuf = 0;
        var ggRow = clampRow(ggN);
        state.cursor.row = ggRow;
        state.cursor.col = clampCol(ggRow, state.curswant);
        render();
      } else {
        gTimer = setTimeout(function() { gTimer = null; }, 500);
      }
      return;
    }
    // ge/gE in visual mode
    if ((e.key === 'e' || e.key === 'E') && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      var geVN = getCount(); var vgeFn = e.key === 'e' ? wordEndBackward : WORDEndBackward;
      var vgep = {row: row, col: col}; for (var gei = 0; gei < geVN; gei++) vgep = vgeFn(vgep.row, vgep.col);
      state.cursor.row = vgep.row; state.cursor.col = vgep.col; state.curswant = vgep.col;
      render(); return;
    }
    if (gTimer && e.key !== 'g') { clearTimeout(gTimer); gTimer = null; }
    if (e.key === 'h') { var hN = getCount(); state.cursor.col = clampCol(row, col - hN); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'l') { var lN = getCount(); state.cursor.col = clampCol(row, col + lN); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'j') {
      var jN = getCount(); var nr = clampRow(row + jN);
      state.cursor.row = nr; state.cursor.col = clampCol(nr, state.curswant); render(); return;
    }
    if (e.key === 'k') {
      var kN = getCount(); var nrk = clampRow(row - kN);
      state.cursor.row = nrk; state.cursor.col = clampCol(nrk, state.curswant); render(); return;
    }
    if (e.key === 'w') { var wN = getCount(); var wp = {row: row, col: col}; for (var wi = 0; wi < wN; wi++) wp = wordForward(wp.row, wp.col); state.cursor.row = wp.row; state.cursor.col = wp.col; state.curswant = wp.col; render(); return; }
    if (e.key === 'b') { var bN = getCount(); var bp = {row: row, col: col}; for (var bi = 0; bi < bN; bi++) bp = wordBackward(bp.row, bp.col); state.cursor.row = bp.row; state.cursor.col = bp.col; state.curswant = bp.col; render(); return; }
    if (e.key === 'e') { var eN = getCount(); var ep = {row: row, col: col}; for (var ei = 0; ei < eN; ei++) ep = wordEnd(ep.row, ep.col); state.cursor.row = ep.row; state.cursor.col = ep.col; state.curswant = ep.col; render(); return; }
    if (e.key === 'W') { var WN = getCount(); var Wp = {row: row, col: col}; for (var Wi = 0; Wi < WN; Wi++) Wp = WORDForward(Wp.row, Wp.col); state.cursor.row = Wp.row; state.cursor.col = Wp.col; state.curswant = Wp.col; render(); return; }
    if (e.key === 'B') { var BN = getCount(); var Bp = {row: row, col: col}; for (var Bi = 0; Bi < BN; Bi++) Bp = WORDBackward(Bp.row, Bp.col); state.cursor.row = Bp.row; state.cursor.col = Bp.col; state.curswant = Bp.col; render(); return; }
    if (e.key === 'E') { var EN = getCount(); var Ep = {row: row, col: col}; for (var Ei = 0; Ei < EN; Ei++) Ep = WORDEnd(Ep.row, Ep.col); state.cursor.row = Ep.row; state.cursor.col = Ep.col; state.curswant = Ep.col; render(); return; }
    if (e.key === 'G') { var GN = countBuf > 0 ? clampRow(countBuf - 1) : state.lines.length - 1; countBuf = 0; state.cursor.row = GN; state.cursor.col = clampCol(GN, state.curswant); render(); return; }
    if (e.key === '$') { var ec = Math.max(0, getLine(row).length - 1); state.cursor.col = ec; state.curswant = ec; render(); return; }
    if (e.key === '0') { state.cursor.col = 0; state.curswant = 0; render(); return; }
    if (e.key === '^') { var vfnb = firstNonBlank(row); state.cursor.col = vfnb; state.curswant = vfnb; render(); return; }
    if (e.key === 'f' || e.key === 'F' || e.key === 't' || e.key === 'T') {
      state.pendingOp = 'v_' + e.key; return;
    }
    if (e.key === ';') {
      if (state.lastFind) {
        var vsCol = col;
        if (state.lastFind.op === 't') vsCol++;
        if (state.lastFind.op === 'T') vsCol--;
        execFind(state.lastFind.op, state.lastFind.ch, row, vsCol); render();
      }
      return;
    }
    if (e.key === ',') {
      if (state.lastFind) {
        var vrev = { f: 'F', F: 'f', t: 'T', T: 't' }[state.lastFind.op];
        var vrCol = col;
        if (vrev === 't') vrCol++;
        if (vrev === 'T') vrCol--;
        execFind(vrev, state.lastFind.ch, row, vrCol); render();
      }
      return;
    }
    // % bracket match, { } paragraph motions, n N search in visual
    if (e.key === '%') {
      var vmb = matchBracket(row, col);
      if (vmb) { state.cursor.row = vmb.row; state.cursor.col = vmb.col; state.curswant = vmb.col; render(); }
      return;
    }
    if (e.key === '{') {
      var pbN = getCount(); var vpb = row; for (var pbi = 0; pbi < pbN; pbi++) vpb = paragraphBackward(vpb);
      state.cursor.row = vpb; state.cursor.col = 0; state.curswant = 0; render(); return;
    }
    if (e.key === '}') {
      var pfN = getCount(); var vpf = row; for (var pfi = 0; pfi < pfN; pfi++) vpf = paragraphForward(vpf);
      state.cursor.row = vpf; state.cursor.col = 0; state.curswant = 0; render(); return;
    }
    if (e.key === 'n') { searchNext(state.searchDir); return; }
    if (e.key === 'N') { searchNext(-state.searchDir); return; }
    if (e.key === ':') {
      exitVisual();
      state.mode = 'command'; state.cmdBuf = "'<,'>";
      if (state.zenMode) cmdlineEl.style.display = '';
      render(); return;
    }
  }

  var cmdCompletions = [
    'q', 'q!', 'qa', 'qa!', 'w', 'wq',
    'set number', 'set nu', 'set nonumber', 'set nonu',
    'set relativenumber', 'set rnu', 'set norelativenumber', 'set nornu',
    'set ignorecase', 'set ic', 'set noignorecase', 'set noic',
    'set smartcase', 'set scs', 'set nosmartcase', 'set noscs',
    'set hlsearch', 'set hls', 'set nohlsearch', 'set nohls',
    'set incsearch', 'set is', 'set noincsearch', 'set nois',
    'set cursorline', 'set cul', 'set nocursorline', 'set nocul',
    'set list', 'set nolist',
    'set wrap', 'set nowrap',
    'unset nu', 'unset number', 'unset rnu', 'unset relativenumber',
    'unset ic', 'unset ignorecase', 'unset hls', 'unset hlsearch',
    'unset is', 'unset incsearch', 'unset scs', 'unset smartcase',
    'unset cul', 'unset cursorline', 'unset list', 'unset wrap',
    'nohlsearch', 'noh', 'nohl',
    'r', 'zen', 'enew', 'new', 'e', 'intro', 'help', 'h', 'tutor', 'Tutor', 'agents',
    'colorscheme', 'colo', 'color', 'emacs', 'nano'
  ];
  var tabIdx = -1;
  var tabPrefix = '';

  function handleCommand(e) {
    if (e.key === 'Escape') {
      state.mode = 'normal'; state.cmdBuf = ''; tabIdx = -1; render(); return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (tabIdx === -1) tabPrefix = state.cmdBuf;
      var dir = e.shiftKey ? -1 : 1;
      // :e filename completion
      var ePrefix = tabPrefix.match(/^(?:e|r)\s+(\S*)$/);
      // colorscheme name completion
      var csPrefix = tabPrefix.match(/^(?:colorscheme|colo|color)\s+(\S*)$/);
      var matches;
      if (ePrefix) {
        var ePartial = ePrefix[1];
        var eSlugs = Object.keys(blogFiles).sort();
        var eMatches = eSlugs.filter(function(s) { return s.indexOf(ePartial) === 0; });
        if (eMatches.length) {
          tabIdx = (tabIdx + dir + eMatches.length) % eMatches.length;
          state.cmdBuf = tabPrefix.replace(/\S*$/, '') + eMatches[tabIdx];
        }
      } else if (csPrefix) {
        var csPartial = csPrefix[1];
        var csMatches = schemeNames.filter(function(n) { return n.indexOf(csPartial) === 0; });
        if (csMatches.length) {
          tabIdx = (tabIdx + dir + csMatches.length) % csMatches.length;
          state.cmdBuf = tabPrefix.replace(/\S*$/, '') + csMatches[tabIdx];
          // live preview
          applyColorscheme(csMatches[tabIdx]);
        }
      } else {
        matches = cmdCompletions.filter(function(c) {
          return c.indexOf(tabPrefix) === 0;
        });
        if (matches.length) {
          tabIdx = (tabIdx + dir + matches.length) % matches.length;
          state.cmdBuf = matches[tabIdx];
        }
      }
      render(); return;
    }
    if (e.key === 'Enter') {
      var cmd = state.cmdBuf;
      state.mode = 'normal'; state.cmdBuf = ''; tabIdx = -1;
      execCommand(cmd);
      render(); return;
    }
    if (e.key === 'Backspace') {
      tabIdx = -1;
      if (state.cmdBuf.length > 0) {
        state.cmdBuf = state.cmdBuf.slice(0, -1);
      } else {
        state.mode = 'normal';
      }
      render(); return;
    }
    if (e.key.length === 1) {
      tabIdx = -1;
      state.cmdBuf += e.key; render();
    }
  }

  function handleSearch(e) {
    if (e.key === 'Escape') {
      state.mode = 'normal';
      state.searchBuf = '';
      state.searchMatches = [];
      state.searchPattern = null;
      if (state.preSearchCursor) {
        state.cursor.row = state.preSearchCursor.row;
        state.cursor.col = state.preSearchCursor.col;
        state.curswant = state.preSearchCursor.col;
        state.preSearchCursor = null;
      }
      render(); return;
    }
    if (e.key === 'Enter') {
      var pattern = state.searchBuf;
      if (state.searchMatches.length) {
        // Find nearest match in search direction from cursor
        var row = state.cursor.row, col = state.cursor.col;
        var bestIdx = 0;
        if (state.searchDir === 1) {
          for (var si = 0; si < state.searchMatches.length; si++) {
            var sm = state.searchMatches[si];
            if (sm.row > row || (sm.row === row && sm.col > col)) { bestIdx = si; break; }
          }
        } else {
          bestIdx = state.searchMatches.length - 1;
          for (var sj = state.searchMatches.length - 1; sj >= 0; sj--) {
            var smj = state.searchMatches[sj];
            if (smj.row < row || (smj.row === row && smj.col < col)) { bestIdx = sj; break; }
          }
        }
        jumpToMatch(bestIdx);
      } else if (pattern) {
        var testRe;
        try { testRe = new RegExp(pattern); } catch(ex) { testRe = null; }
        if (!testRe) {
          setStatus('Invalid pattern: ' + pattern);
        } else {
          setStatus('Pattern not found: ' + pattern);
        }
      }
      state.mode = 'normal';
      state.preSearchCursor = null;
      render(); return;
    }
    if (e.key === 'Backspace') {
      state.searchBuf = state.searchBuf.slice(0, -1);
      buildMatches(state.searchBuf);
      if (state.incsearch) incSearchJump();
      render(); return;
    }
    if (e.key.length === 1) {
      state.searchBuf += e.key;
      buildMatches(state.searchBuf);
      if (state.incsearch) incSearchJump();
      render();
    }
  }

  function incSearchJump() {
    if (!state.searchMatches.length || !state.preSearchCursor) return;
    var row = state.preSearchCursor.row, col = state.preSearchCursor.col;
    var bestIdx = 0;
    if (state.searchDir === 1) {
      for (var i = 0; i < state.searchMatches.length; i++) {
        var m = state.searchMatches[i];
        if (m.row > row || (m.row === row && m.col >= col)) { bestIdx = i; break; }
      }
    } else {
      bestIdx = state.searchMatches.length - 1;
      for (var j = state.searchMatches.length - 1; j >= 0; j--) {
        var mj = state.searchMatches[j];
        if (mj.row < row || (mj.row === row && mj.col <= col)) { bestIdx = j; break; }
      }
    }
    var match = state.searchMatches[bestIdx];
    state.cursor.row = match.row;
    state.cursor.col = match.col;
    state.curswant = match.col;
    state.searchIdx = bestIdx;
  }

  function handleConfirmSub(e) {
    var cs = state.confirmSub;
    if (!cs) { state.mode = 'normal'; render(); return; }
    function doReplace() {
      var m = cs.matches[cs.idx];
      var ln = state.lines[m.row];
      state.lines[m.row] = ln.slice(0, m.col) + cs.replacement + ln.slice(m.col + m.len);
      var delta = cs.replacement.length - m.len;
      for (var ai = cs.idx + 1; ai < cs.matches.length; ai++) {
        if (cs.matches[ai].row === m.row) cs.matches[ai].col += delta;
      }
      cs.count++;
    }
    function advance() {
      cs.idx++;
      if (cs.idx >= cs.matches.length) {
        setStatus(cs.count + ' substitution' + (cs.count !== 1 ? 's' : ''));
        state.confirmSub = null; state.mode = 'normal'; render(); return;
      }
      var nm = cs.matches[cs.idx];
      state.cursor.row = nm.row; state.cursor.col = nm.col;
      setStatus('replace with "' + cs.replacement + '"? (y/n/a/q)');
      render();
    }
    if (e.key === 'y') { doReplace(); advance(); return; }
    if (e.key === 'n') { advance(); return; }
    if (e.key === 'a') {
      for (var ri = cs.idx; ri < cs.matches.length; ri++) {
        cs.idx = ri; doReplace();
      }
      setStatus(cs.count + ' substitution' + (cs.count !== 1 ? 's' : ''));
      state.confirmSub = null; state.mode = 'normal'; render(); return;
    }
    if (e.key === 'q' || e.key === 'Escape') {
      setStatus(cs.count + ' substitution' + (cs.count !== 1 ? 's' : ''));
      state.confirmSub = null; state.mode = 'normal'; render(); return;
    }
  }

  function handleKey(e) {
    // Konami code tracking (works across all modes)
    if (e.key === konamiSeq[state.konamiIdx]) {
      state.konamiIdx++;
      if (state.konamiIdx === konamiSeq.length) {
        state.konamiIdx = 0;
        konamiActivate();
        return;
      }
    } else if (e.key === konamiSeq[0]) {
      state.konamiIdx = 1;
    } else {
      state.konamiIdx = 0;
    }

    // never interfere with browser shortcuts
    if (e.metaKey) return;

    // Macro recording: capture every key except the q that stops recording
    if (state.macroRecording) {
      var isStopQ = (e.key === 'q' && state.mode === 'normal' && !state.pendingOp && !pendingOperator);
      if (!isStopQ) {
        state.macroRegisters[state.macroRecording].push({
          key: e.key, ctrlKey: !!e.ctrlKey, shiftKey: !!e.shiftKey, altKey: !!e.altKey
        });
      }
    }

    // Capture cursor position before any movement for auto jump list
    var preJumpRow = state.cursor.row;
    var preJumpCol = state.cursor.col;

    if (e.ctrlKey) {
      var ctrlHandled = { r: 1, R: 1, f: 1, b: 1, u: 1, d: 1, g: 1, a: 1, x: 1, o: 1, i: 1 };
      if (!ctrlHandled[e.key]) return;
      e.preventDefault();

      if (state.mode === 'command' && e.key === 'd') {
        // Ctrl-D in command mode: show matching completions
        var cdPrefix = state.cmdBuf;
        var cdMatches = cmdCompletions.filter(function(c) { return c.indexOf(cdPrefix) === 0; });
        if (cdMatches.length) {
          setStatus(cdMatches.join('  '));
        } else {
          setStatus('No completions');
        }
        return;
      }
      if (state.mode !== 'normal' && state.mode !== 'visual') {
        // Ctrl-R only in normal/visual for redo
        if (e.key === 'r' || e.key === 'R') { redo(); }
        return;
      }

      var visRows = Math.floor(bodyEl.clientHeight / lineH);
      var row = state.cursor.row;
      if (e.key === 'r' || e.key === 'R') { redo(); return; }
      if (e.key === 'f') {
        state.cursor.row = clampRow(row + visRows);
        state.cursor.col = clampCol(state.cursor.row, state.curswant);
        render(); return;
      }
      if (e.key === 'b') {
        state.cursor.row = clampRow(row - visRows);
        state.cursor.col = clampCol(state.cursor.row, state.curswant);
        render(); return;
      }
      if (e.key === 'd') {
        state.cursor.row = clampRow(row + Math.floor(visRows / 2));
        state.cursor.col = clampCol(state.cursor.row, state.curswant);
        render(); return;
      }
      if (e.key === 'u') {
        state.cursor.row = clampRow(row - Math.floor(visRows / 2));
        state.cursor.col = clampCol(state.cursor.row, state.curswant);
        render(); return;
      }
      if (e.key === 'g') {
        // Ctrl-G: file info
        var pct = state.lines.length > 0 ? Math.round((row + 1) / state.lines.length * 100) : 0;
        setStatus('"' + state.filename + '" ' + state.lines.length + ' lines --' + pct + '%--');
        return;
      }
      if (e.key === 'a') { incrementNumber(1); return; }
      if (e.key === 'x') { incrementNumber(-1); return; }
      if (e.key === 'o') { jumpOlder(); return; }
      if (e.key === 'i') { jumpNewer(); return; }
      autoJump(preJumpRow, preJumpCol);
      return;
    }

    // prevent default for all handled keys (stops browser search on /, scrolling on space, etc.)
    if ((state.mode !== 'insert' && state.mode !== 'replace') || e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
    }

    switch (state.mode) {
      case 'normal':  handleNormal(e); break;
      case 'insert':  handleInsert(e); break;
      case 'replace': handleReplace(e); break;
      case 'visual':  handleVisual(e); break;
      case 'command': handleCommand(e); break;
      case 'search':  handleSearch(e); break;
      case 'confirm-sub': handleConfirmSub(e); break;
    }

    autoJump(preJumpRow, preJumpCol);
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  function measureFont() {
    var span = document.createElement('span');
    span.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font:inherit';
    span.textContent = 'X';
    contentEl.appendChild(span);
    var r = span.getBoundingClientRect();
    if (r.width > 0) charW = r.width;
    if (r.height > 0) lineH = r.height;
    span.remove();
  }

  document.addEventListener('DOMContentLoaded', function() {
    bodyEl      = document.getElementById('vim-body');
    gutterEl    = document.getElementById('vim-gutter');
    contentEl   = document.getElementById('vim-content');
    cursorEl    = document.getElementById('vim-cursor');
    cmdlineEl   = document.getElementById('vim-cmdline');
    statusModeEl = document.getElementById('vim-status-mode');
    statusFileEl = document.getElementById('vim-status-file');
    statusPosEl  = document.getElementById('vim-status-pos');

    if (!contentEl) return; // not on vim page

    // Restore saved preferences
    loadPrefs();
    if (state.colorscheme && state.colorscheme !== 'default') {
      applyColorscheme(state.colorscheme);
    }
    if (state.zenMode) {
      applyZenMode(true);
      // Rebuild welcome with zen-aware width
      if (isWelcomeBuffer()) {
        var w = buildWelcome();
        state.lines = w;
        state.cursor = { row: w.firstContentRow || 0, col: w.firstContentCol || 0 };
      }
    }

    document.fonts.ready.then(function() {
      measureFont();
      render();
    });

    // fallback render before fonts ready
    render();

    document.addEventListener('keydown', handleKey);

    // Cmd+V paste support: insert clipboard text into buffer
    document.addEventListener('paste', function(e) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      if (!text) return;
      e.preventDefault();
      var row = state.cursor.row;
      var col = state.cursor.col;
      if (state.mode === 'insert') {
        pushUndo();
        var lines = text.split('\n');
        var line = getLine(row);
        if (lines.length === 1) {
          state.lines[row] = line.slice(0, col) + text + line.slice(col);
          state.cursor.col = col + text.length;
        } else {
          var before = line.slice(0, col);
          var after = line.slice(col);
          state.lines[row] = before + lines[0];
          for (var pi = 1; pi < lines.length; pi++) {
            insertLine(row + pi, pi === lines.length - 1 ? lines[pi] + after : lines[pi]);
          }
          state.cursor.row = row + lines.length - 1;
          state.cursor.col = lines[lines.length - 1].length;
        }
        state.curswant = state.cursor.col;
        render();
      } else if (state.mode === 'normal') {
        // In normal mode, paste acts like p
        pushUndo();
        var pLines = text.split('\n');
        if (pLines.length > 1) {
          for (var ni = 0; ni < pLines.length; ni++) {
            insertLine(row + 1 + ni, pLines[ni]);
          }
          state.cursor.row = row + 1;
          state.cursor.col = 0;
        } else {
          var nLine = getLine(row);
          state.lines[row] = nLine.slice(0, col + 1) + text + nLine.slice(col + 1);
          state.cursor.col = col + text.length;
        }
        state.curswant = state.cursor.col;
        render();
      }
    });
  });

})();
