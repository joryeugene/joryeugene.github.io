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

  // Last-resort clipboard path used when navigator.clipboard.writeText rejects
  // (some Safari contexts, private browsing, etc.). document.execCommand is
  // deprecated but is the only synchronous fallback that still works on older
  // engines; swallowed errors are intentional because this is best-effort.
  function clipboardFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) { /* best effort */ }
    document.body.removeChild(ta);
  }

  var colorschemes = window.VIM_COLORSCHEMES || {};
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
    // Paired-delimiter text objects: i( a( i[ a[ i{ a{ i< a< i" a" i' a' i` a`
    // Brackets use balanced outward scanning across lines; quotes are line-local.
    var pairMap = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };
    var isBracket = Object.prototype.hasOwnProperty.call(pairMap, obj);
    var isQuote = obj === '"' || obj === "'" || obj === '`';
    if (isBracket) {
      // Find enclosing pair on the current line, or across lines if unbalanced.
      var openCh = obj in { '(':1, '[':1, '{':1, '<':1 } ? obj : pairMap[obj];
      var closeCh = pairMap[openCh];
      // Scan backward from cursor to find the opening delimiter.
      var brSRow = row, brSCol = -1;
      var depth = 0;
      outer_back: for (var r1 = row; r1 >= 0; r1--) {
        var ln1 = getLine(r1);
        var cstart = r1 === row ? col : ln1.length - 1;
        for (var c1 = cstart; c1 >= 0; c1--) {
          var ch1 = ln1[c1];
          if (ch1 === closeCh) depth++;
          else if (ch1 === openCh) {
            if (depth === 0) { brSRow = r1; brSCol = c1; break outer_back; }
            depth--;
          }
        }
      }
      if (brSCol === -1) return null;
      // Scan forward from cursor to find the matching close.
      var brERow = row, brECol = -1;
      depth = 0;
      outer_fwd: for (var r2 = brSRow; r2 < state.lines.length; r2++) {
        var ln2 = getLine(r2);
        var fstart = r2 === brSRow ? brSCol + 1 : 0;
        for (var c2 = fstart; c2 < ln2.length; c2++) {
          var ch2 = ln2[c2];
          if (ch2 === openCh) depth++;
          else if (ch2 === closeCh) {
            if (depth === 0) { brERow = r2; brECol = c2; break outer_fwd; }
            depth--;
          }
        }
      }
      if (brECol === -1) return null;
      if (prefix === 'i') {
        return { startRow: brSRow, startCol: brSCol + 1, endRow: brERow, endCol: brECol, linewise: false };
      }
      return { startRow: brSRow, startCol: brSCol, endRow: brERow, endCol: brECol + 1, linewise: false };
    }
    if (isQuote) {
      // Line-local: find the nearest enclosing pair. Track positions on this
      // line, pick the pair whose start is <= col and whose end is >= col.
      var qPositions = [];
      for (var qc = 0; qc < line.length; qc++) {
        if (line[qc] === obj) qPositions.push(qc);
      }
      if (qPositions.length < 2) return null;
      var qStart = -1, qEnd = -1;
      for (var qp = 0; qp + 1 < qPositions.length; qp += 2) {
        var a = qPositions[qp], b = qPositions[qp + 1];
        if (a <= col && b >= col) { qStart = a; qEnd = b; break; }
      }
      // If not strictly enclosed, prefer the nearest pair to the cursor on the
      // same line (vim behavior: ci" from outside a string still finds one).
      if (qStart === -1 && qPositions.length >= 2) {
        qStart = qPositions[0];
        qEnd = qPositions[1];
      }
      if (qStart === -1 || qEnd === -1) return null;
      if (prefix === 'i') {
        return { startRow: row, startCol: qStart + 1, endRow: row, endCol: qEnd, linewise: false };
      }
      return { startRow: row, startCol: qStart, endRow: row, endCol: qEnd + 1, linewise: false };
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
    // Vim's \< and \> word boundaries map to JavaScript's \b with lookarounds
    // to enforce start-of-word and end-of-word specifically.
    pattern = pattern.replace(/\\</g, '\\b(?=\\w)').replace(/\\>/g, '(?<=\\w)\\b');
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

  // Block (rectangular) selection. Each axis is independent: rows come from
  // Math.min/Math.max of anchor.row and cursor.row; columns likewise. Callers
  // must NOT use getVisualRange for block mode because that would treat the
  // selection as a linear run across rows.
  function getBlockRange() {
    var a = state.visualAnchor;
    var c = state.cursor;
    if (!a) return null;
    return {
      startRow: Math.min(a.row, c.row),
      endRow:   Math.max(a.row, c.row),
      startCol: Math.min(a.col, c.col),
      endCol:   Math.max(a.col, c.col)
    };
  }

  function exitVisual() {
    if (state.visualMode === 'block') {
      var br = getBlockRange();
      if (br) {
        br.linewise = false;
        br.blockwise = true;
        state.lastVisualRange = br;
      }
    } else {
      var lvr = getVisualRange();
      if (lvr) { lvr.linewise = state.visualMode === 'line'; lvr.blockwise = false; }
      state.lastVisualRange = lvr;
    }
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

  // Delete / yank the rectangle defined by the current block-visual selection.
  // Each row is sliced independently at [startCol, endCol+1] clamped to its
  // length. The register receives the columns joined by newlines (v1 treats
  // this as linewise for paste; a future revision can honor registerBlockwise).
  function deleteBlock() {
    var br = getBlockRange();
    if (!br) return;
    pushUndo();
    var blockLines = [];
    for (var r = br.startRow; r <= br.endRow; r++) {
      var ln = getLine(r);
      var bs = Math.min(br.startCol, ln.length);
      var be = Math.min(br.endCol + 1, ln.length);
      blockLines.push(ln.slice(bs, be));
      state.lines[r] = ln.slice(0, bs) + ln.slice(be);
    }
    setRegister(blockLines.join('\n'), false);
    state.cursor.row = br.startRow;
    state.cursor.col = clampCol(br.startRow, br.startCol);
  }
  function yankBlock() {
    var br = getBlockRange();
    if (!br) return;
    var blockLines = [];
    for (var r = br.startRow; r <= br.endRow; r++) {
      var ln = getLine(r);
      var bs = Math.min(br.startCol, ln.length);
      var be = Math.min(br.endCol + 1, ln.length);
      blockLines.push(ln.slice(bs, be));
    }
    setRegister(blockLines.join('\n'), false);
    state.cursor.row = br.startRow;
    state.cursor.col = clampCol(br.startRow, br.startCol);
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

    var range = (state.mode === 'visual' && state.visualMode !== 'block') ? getVisualRange() : null;
    var blockRange = (state.mode === 'visual' && state.visualMode === 'block') ? getBlockRange() : null;

    // Apply visual selection spans (char / line).
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
    // Apply block selection: every row in range gets the same column slice.
    if (blockRange && row >= blockRange.startRow && row <= blockRange.endRow) {
      var bsc = Math.max(0, Math.min(blockRange.startCol, line.length));
      var bec = Math.max(0, Math.min(blockRange.endCol + 1, line.length));
      if (bsc < bec) {
        var bBefore = escHtml(line.slice(0, bsc));
        var bSel    = escHtml(line.slice(bsc, bec));
        var bAfter  = escHtml(line.slice(bec));
        escaped = bBefore + '<span class="vsel">' + bSel + '</span>' + bAfter;
      } else {
        // row shorter than the rectangle start: render an empty placeholder
        // so the line keeps its height but has no highlight.
        escaped = escHtml(line) || ' ';
      }
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
      visual:  state.visualMode === 'block' ? '--VISUAL BLOCK--' : (state.visualMode === 'line' ? '--VISUAL LINE--' : '--VISUAL--'),
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

  // Tiny localStorage-backed filesystem so lesson 5 can actually roundtrip
  // (`:w FOO` followed later by `:r FOO` should receive the saved lines).
  // Keys are namespaced with vim_file_ so they do not collide with vim-prefs.
  // Any localStorage failure (private mode, quota) is swallowed silently.
  var LOCAL_FS_PREFIX = 'vim_file_';
  function saveToLocalFS(filename, content) {
    if (!filename) return;
    try { localStorage.setItem(LOCAL_FS_PREFIX + filename, content); } catch (e) {}
  }
  function readFromLocalFS(filename) {
    if (!filename) return null;
    try { return localStorage.getItem(LOCAL_FS_PREFIX + filename); } catch (e) { return null; }
  }
  function removeFromLocalFS(filename) {
    if (!filename) return false;
    try {
      if (localStorage.getItem(LOCAL_FS_PREFIX + filename) === null) return false;
      localStorage.removeItem(LOCAL_FS_PREFIX + filename);
      return true;
    } catch (e) { return false; }
  }
  function listLocalFS() {
    var out = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LOCAL_FS_PREFIX) === 0) out.push(k.slice(LOCAL_FS_PREFIX.length));
      }
    } catch (e) {}
    return out;
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
    if (bin === 'ls') {
      var lsArgs = argv.slice(1).filter(function(a) { return a.charAt(0) !== '-'; });
      var arg = lsArgs[0] || '';
      var blogSlugs = Object.keys(blogFiles).sort();
      if (arg === 'blog' || arg === 'blog/') {
        return blogSlugs.map(function(s) { return s + '/'; });
      }
      var listing = ['blog/'];
      for (var si = 0; si < blogSlugs.length; si++) {
        listing.push('  ' + blogSlugs[si] + '/');
      }
      listing.push('vim/', 'index.html', 'CNAME', 'favicon.png');
      // Include files saved via :w FOO so `:!ls` after `:w` verifies lesson 5.2.
      var savedFiles = listLocalFS();
      for (var lsi = 0; lsi < savedFiles.length; lsi++) {
        listing.push(savedFiles[lsi]);
      }
      return listing;
    }
    if (bin === 'cat') {
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
    }
    if (bin === 'rm') {
      // Only removes files saved by :w FOO in localStorage. Refuses anything else.
      var rmTarget = argv[1] || '';
      if (!rmTarget) return ['rm: missing operand'];
      if (removeFromLocalFS(rmTarget)) return ['"' + rmTarget + '" removed'];
      return ['rm: cannot remove "' + rmTarget + '": No such file or nice try.'];
    }
    var pure = (window.VIM_SHELL_PURE_HANDLERS || {})[bin];
    if (pure) return pure(argv);
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
  var helpTopics = window.VIM_HELP_TOPICS || {};

  function getHelpText(topic) {
    if (topic && helpTopics[topic]) {
      return ['*' + topic + '*', ''].concat(helpTopics[topic]).concat([
        '', 'Press u to return to your buffer.',
        'Type :help for the full reference.']);
    }
    // Main help screen (lives in js/vim-help.js).
    return (window.VIM_HELP_MAIN || function() { return ['help unavailable']; })(VIM_VERSION);
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
    if (cmd === 'w') {
      downloadText(state.lines.join('\n'), state.filename);
      saveToLocalFS(state.filename, state.lines.join('\n'));
      return;
    }
    if (cmd.slice(0, 2) === 'w ') {
      var fname = cmd.slice(2).trim();
      if (fname) {
        state.filename = fname;
        downloadText(state.lines.join('\n'), fname);
        saveToLocalFS(fname, state.lines.join('\n'));
      }
      return;
    }
    // :'<,'>w FILENAME - write visual selection to file
    var vwMatch = cmd.match(/^'<,'>w\s+(.+)$/);
    if (vwMatch) {
      var vwName = vwMatch[1].trim();
      var vwRange = state.lastVisualRange;
      if (vwRange) {
        var vwLines = state.lines.slice(vwRange.startRow, vwRange.endRow + 1);
        var vwContent = vwLines.join('\n') + '\n';
        downloadText(vwContent, vwName);
        saveToLocalFS(vwName, vwContent);
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
    // :set expandtab / noexpandtab
    if (cmd === 'set expandtab' || cmd === 'set et') {
      state.expandtab = true; savePrefs(); setStatus('expandtab on'); return;
    }
    if (cmd === 'set noexpandtab' || cmd === 'set noet' || cmd === 'unset et' || cmd === 'unset expandtab') {
      state.expandtab = false; savePrefs(); setStatus('expandtab off'); return;
    }
    // :set tabstop=N / :set ts=N
    var tsMatch = cmd.match(/^set (?:tabstop|ts)=(\d+)$/);
    if (tsMatch) {
      state.tabstop = Math.max(1, parseInt(tsMatch[1], 10));
      savePrefs(); setStatus('tabstop=' + state.tabstop); return;
    }
    // :set shiftwidth=N / :set sw=N
    var swMatch = cmd.match(/^set (?:shiftwidth|sw)=(\d+)$/);
    if (swMatch) {
      state.shiftwidth = Math.max(1, parseInt(swMatch[1], 10));
      savePrefs(); setStatus('shiftwidth=' + state.shiftwidth); return;
    }
    // :set autoindent / noautoindent
    if (cmd === 'set autoindent' || cmd === 'set ai') {
      state.autoindent = true; savePrefs(); setStatus('autoindent on'); return;
    }
    if (cmd === 'set noautoindent' || cmd === 'set noai' || cmd === 'unset ai' || cmd === 'unset autoindent') {
      state.autoindent = false; savePrefs(); setStatus('autoindent off'); return;
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
      state.lines = (window.VIM_TUTOR_LESSONS || []).slice();
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
      // Check localStorage-backed filesystem first (for lesson 5 roundtrip
      // and any file the user previously wrote via :w FOO).
      var rLocal = readFromLocalFS(rArg);
      if (rLocal !== null) {
        pushUndo();
        var localLines = rLocal.split('\n');
        // Strip a single trailing empty line so a saved file that ended in \n
        // does not inject a blank line on read (matches real vim behavior).
        if (localLines.length && localLines[localLines.length - 1] === '') localLines.pop();
        var localInsertAt = state.cursor.row + 1;
        for (var li = 0; li < localLines.length; li++) {
          state.lines.splice(localInsertAt + li, 0, localLines[li]);
        }
        state.cursor.row = localInsertAt;
        state.cursor.col = 0;
        setStatus('"' + rArg + '" ' + localLines.length + ' lines');
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
    // :g/pat/cmd and :v/pat/cmd - run cmd on matching (or non-matching) lines.
    // Supported sub-commands: d (delete) and s/from/to/[flags] (substitute).
    var globalMatch = cmd.match(/^(g|v)\/(.+?)\/(d|s\/.+)?$/);
    if (globalMatch) {
      var gNeg = globalMatch[1] === 'v';
      var gPat = globalMatch[2];
      var gSub = globalMatch[3] || 'd';
      var gRe;
      try { gRe = new RegExp(gPat); }
      catch (ex) { setStatus('E476: Invalid pattern: ' + gPat); return; }
      pushUndo();
      if (gSub === 'd') {
        var gKept = [];
        var gRemoved = 0;
        for (var gi = 0; gi < state.lines.length; gi++) {
          var gHit = gRe.test(state.lines[gi]);
          if ((gHit && !gNeg) || (!gHit && gNeg)) { gRemoved++; continue; }
          gKept.push(state.lines[gi]);
        }
        if (!gKept.length) gKept = [''];
        state.lines = gKept;
        state.cursor.row = Math.min(state.cursor.row, state.lines.length - 1);
        state.cursor.col = 0;
        setStatus(gRemoved + ' lines deleted');
        render();
        return;
      }
      var gSubMatch = gSub.match(/^s\/(.+?)\/(.*)\/([gc]*)$/);
      if (gSubMatch) {
        var gSubPat = gSubMatch[1], gSubRep = gSubMatch[2], gSubFlags = gSubMatch[3] || '';
        var gSubGlobal = gSubFlags.indexOf('g') !== -1;
        var gSubRe;
        try { gSubRe = new RegExp(gSubPat, gSubGlobal ? 'g' : ''); }
        catch (ex2) { setStatus('E476: Invalid pattern: ' + gSubPat); return; }
        var gSubCount = 0;
        for (var gsi = 0; gsi < state.lines.length; gsi++) {
          var gsHit = gRe.test(state.lines[gsi]);
          if ((gsHit && !gNeg) || (!gsHit && gNeg)) {
            var gsNew = state.lines[gsi].replace(gSubRe, gSubRep);
            if (gsNew !== state.lines[gsi]) { state.lines[gsi] = gsNew; gSubCount++; }
          }
        }
        setStatus(gSubCount + ' substitutions');
        render();
        return;
      }
      setStatus('Unsupported :g subcommand');
      return;
    }
    // :sort [u] and :%sort - sort buffer (or range) lexicographically.
    // The `u` flag removes duplicate adjacent lines after sort.
    var sortMatch = cmd.match(/^(\d+,\d+|%|'<,'>)?sort(\s+u)?$/);
    if (sortMatch) {
      var sortRange = sortMatch[1] || '';
      var sortUnique = !!sortMatch[2];
      var sortStart = 0, sortEnd = state.lines.length - 1;
      if (sortRange === '%') {
        // whole buffer, already default
      } else if (sortRange === "'<,'>") {
        if (state.lastVisualRange) {
          sortStart = state.lastVisualRange.startRow;
          sortEnd = state.lastVisualRange.endRow;
        }
      } else if (sortRange) {
        var srm = sortRange.match(/^(\d+),(\d+)$/);
        if (srm) {
          sortStart = Math.max(0, parseInt(srm[1], 10) - 1);
          sortEnd = Math.min(state.lines.length - 1, parseInt(srm[2], 10) - 1);
        }
      } else {
        // No range: sort the whole buffer (vim default for bare :sort).
      }
      pushUndo();
      var sortSlice = state.lines.slice(sortStart, sortEnd + 1).sort();
      if (sortUnique) {
        var sortDedup = [];
        for (var sdi = 0; sdi < sortSlice.length; sdi++) {
          if (sdi === 0 || sortSlice[sdi] !== sortSlice[sdi - 1]) sortDedup.push(sortSlice[sdi]);
        }
        sortSlice = sortDedup;
      }
      state.lines.splice(sortStart, sortEnd - sortStart + 1, ...sortSlice);
      setStatus(sortSlice.length + ' lines sorted' + (sortUnique ? ', unique' : ''));
      render();
      return;
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
        var acceptedObjs = { w:1, W:1, p:1, '(':1, ')':1, '[':1, ']':1, '{':1, '}':1, '<':1, '>':1, '"':1, "'":1, '`':1, 'b':1, 'B':1 };
        // `ib`/`ab` alias for `i(`/`a(`; `iB`/`aB` alias for `i{`/`a{`.
        var objKey = e.key;
        if (objKey === 'b') objKey = '(';
        else if (objKey === 'B') objKey = '{';
        if (acceptedObjs[e.key]) {
          var tobj = computeTextObject(toPrefix, objKey, pRow, pCol);
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
    // gv: reselect the last visual range.
    if (e.key === 'v' && gTimer) {
      clearTimeout(gTimer); gTimer = null;
      var gvRange = state.lastVisualRange;
      if (!gvRange) { setStatus('E19: No previous Visual range'); return; }
      state.mode = 'visual';
      state.visualMode = gvRange.blockwise ? 'block' : (gvRange.linewise ? 'line' : 'char');
      state.visualAnchor = { row: gvRange.startRow, col: gvRange.startCol };
      state.cursor.row = gvRange.endRow;
      state.cursor.col = gvRange.blockwise ? gvRange.endCol : Math.max(0, gvRange.endCol - 1);
      state.curswant = state.cursor.col;
      render();
      return;
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
      // Block-insert replay: apply the typed text to every other row in the
      // saved rectangle at the recorded column. Only replay single-line text;
      // newlines would desync the rectangle.
      if (state.blockInsertCols && state.insertText && state.insertText.indexOf('\n') === -1) {
        var bi = state.blockInsertCols;
        for (var bri = bi.startRow + 1; bri <= bi.endRow; bri++) {
          var briLine = getLine(bri);
          var briCol = Math.min(bi.col, briLine.length);
          state.lines[bri] = briLine.slice(0, briCol) + state.insertText + briLine.slice(briCol);
        }
      }
      state.blockInsertCols = null;
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
      // :set expandtab controls tab vs spaces; :set tabstop=N controls width.
      var tabWidth = state.tabstop || 4;
      var tabInsert;
      if (state.expandtab === false) {
        tabInsert = '\t';
      } else {
        tabInsert = '';
        for (var tabI = 0; tabI < tabWidth; tabI++) tabInsert += ' ';
      }
      state.lines[row] = line.slice(0, col) + tabInsert + line.slice(col);
      state.cursor.col = col + tabInsert.length;
      state.curswant = state.cursor.col;
      state.insertText += tabInsert;
      render(); return;
    }
    if (e.key === 'ArrowLeft')  { state.cursor.col = clampCol(row, col - 1); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'ArrowRight') { state.cursor.col = clampCol(row, col + 1); state.curswant = state.cursor.col; render(); return; }
    if (e.key === 'ArrowUp')    { state.cursor.row = clampRow(row - 1); state.cursor.col = clampCol(state.cursor.row, state.curswant); render(); return; }
    if (e.key === 'ArrowDown')  { state.cursor.row = clampRow(row + 1); state.cursor.col = clampCol(state.cursor.row, state.curswant); render(); return; }

    // Ctrl-h: same as Backspace.
    if (e.ctrlKey && e.key === 'h') {
      e.preventDefault();
      if (col > 0) {
        pushUndo();
        state.lines[row] = line.slice(0, col - 1) + line.slice(col);
        state.cursor.col = col - 1;
        state.curswant = state.cursor.col;
        state.insertText = state.insertText.slice(0, -1);
      } else if (row > 0) {
        pushUndo();
        var chPrev = getLine(row - 1);
        var chJoinCol = chPrev.length;
        state.lines[row - 1] = chPrev + line;
        state.lines.splice(row, 1);
        state.cursor.row = row - 1;
        state.cursor.col = chJoinCol;
        state.curswant = chJoinCol;
        state.insertText = state.insertText.slice(0, -1);
      }
      render(); return;
    }
    // Ctrl-w: delete the word before the cursor.
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (col === 0) return;
      pushUndo();
      // Walk backward past whitespace, then past a run of word/non-word chars
      // to mimic vim's Ctrl-w boundary.
      var cwEnd = col;
      var cwStart = cwEnd;
      while (cwStart > 0 && /\s/.test(line[cwStart - 1])) cwStart--;
      if (cwStart > 0) {
        var cwWord = /\w/.test(line[cwStart - 1]);
        while (cwStart > 0 && /\w/.test(line[cwStart - 1]) === cwWord && !/\s/.test(line[cwStart - 1])) cwStart--;
      }
      state.lines[row] = line.slice(0, cwStart) + line.slice(cwEnd);
      state.cursor.col = cwStart;
      state.curswant = cwStart;
      state.insertText = state.insertText.slice(0, -(cwEnd - cwStart));
      render(); return;
    }
    // Ctrl-u: delete everything from the start of the line to the cursor.
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      if (col === 0) return;
      pushUndo();
      state.lines[row] = line.slice(col);
      state.cursor.col = 0;
      state.curswant = 0;
      state.insertText = state.insertText.slice(0, -col);
      render(); return;
    }

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
        var vAcceptedObjs = { w:1, W:1, p:1, '(':1, ')':1, '[':1, ']':1, '{':1, '}':1, '<':1, '>':1, '"':1, "'":1, '`':1, 'b':1, 'B':1 };
        var vtKey = e.key;
        if (vtKey === 'b') vtKey = '(';
        else if (vtKey === 'B') vtKey = '{';
        if (vAcceptedObjs[e.key]) {
          var vtobj = computeTextObject(vtP, vtKey, row, col);
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
    if (e.key === 'V') {
      if (state.visualMode === 'line') {
        state.mode = 'normal'; exitVisual(); render(); return;
      }
      state.visualMode = 'line';
      state.visualAnchor = { row: state.visualAnchor.row, col: 0 };
      render(); return;
    }
    if (e.key === 'v' && state.visualMode !== 'char') {
      state.visualMode = 'char';
      render(); return;
    }
    if (e.key === 'v' && state.visualMode === 'char') {
      state.mode = 'normal'; exitVisual(); render(); return;
    }
    // `o` in visual mode swaps anchor and cursor so you can extend the other end.
    if (e.key === 'o' && state.visualAnchor) {
      var oRow = state.visualAnchor.row;
      var oCol = state.visualAnchor.col;
      state.visualAnchor = { row: state.cursor.row, col: state.cursor.col };
      state.cursor.row = oRow;
      state.cursor.col = oCol;
      state.curswant = oCol;
      render(); return;
    }
    if (e.key === 'd' || e.key === 'x') {
      if (state.visualMode === 'block') deleteBlock();
      else deleteVisual();
      state.mode = 'normal';
      exitVisual();
      render(); return;
    }
    if (e.key === 'c') {
      if (state.visualMode === 'block') deleteBlock();
      else deleteVisual();
      state.mode = 'insert';
      state.insertText = '';
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
      if (state.visualMode === 'block') yankBlock();
      else yankVisual();
      state.mode = 'normal';
      exitVisual();
      setStatus('yanked');
      render(); return;
    }
    // Block-visual I / A: prepend or append to every row in the rectangle.
    // Enter insert mode at the chosen column on the first row; on Escape,
    // replay the typed text into every other row at the same column.
    if (state.visualMode === 'block' && (e.key === 'I' || e.key === 'A')) {
      var biR = getBlockRange();
      if (!biR) return;
      var biCol = e.key === 'I' ? biR.startCol : biR.endCol + 1;
      state.blockInsertCols = { col: biCol, startRow: biR.startRow, endRow: biR.endRow, prepend: e.key === 'I' };
      state.cursor.row = biR.startRow;
      state.cursor.col = biCol;
      state.mode = 'insert';
      state.insertText = '';
      exitVisual();
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
    'set expandtab', 'set et', 'set noexpandtab', 'set noet',
    'set tabstop=2', 'set tabstop=4', 'set tabstop=8',
    'set ts=2', 'set ts=4', 'set ts=8',
    'set shiftwidth=2', 'set shiftwidth=4', 'set shiftwidth=8',
    'set sw=2', 'set sw=4', 'set sw=8',
    'set autoindent', 'set ai', 'set noautoindent', 'set noai',
    'unset nu', 'unset number', 'unset rnu', 'unset relativenumber',
    'unset ic', 'unset ignorecase', 'unset hls', 'unset hlsearch',
    'unset is', 'unset incsearch', 'unset scs', 'unset smartcase',
    'unset cul', 'unset cursorline', 'unset list', 'unset wrap',
    'unset et', 'unset expandtab', 'unset ai', 'unset autoindent',
    'nohlsearch', 'noh', 'nohl',
    'sort', 'sort u',
    'r', 'zen', 'enew', 'new', 'e', 'intro', 'help', 'h', 'tutor', 'Tutor', 'agents',
    'marks', 'pray',
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
      var ctrlHandled = { r: 1, R: 1, f: 1, b: 1, u: 1, d: 1, g: 1, a: 1, x: 1, o: 1, i: 1, h: 1, w: 1, v: 1 };
      if (!ctrlHandled[e.key]) return;
      e.preventDefault();

      // Ctrl-o in insert mode: one normal-mode command, then back to insert.
      if (state.mode === 'insert' && e.key === 'o') {
        if (state.pendingOneNormal) return; // swallow a second Ctrl-o
        state.pendingOneNormal = true;
        state.mode = 'normal';
        render();
        return;
      }

      // Ctrl-v from normal or visual mode enters block-visual selection.
      if (e.key === 'v' && (state.mode === 'normal' || state.mode === 'visual')) {
        if (state.mode === 'visual' && state.visualMode === 'block') {
          // Toggle off: block -> normal.
          state.mode = 'normal';
          exitVisual();
          render();
          return;
        }
        state.mode = 'visual';
        state.visualMode = 'block';
        state.visualAnchor = { row: state.cursor.row, col: state.cursor.col };
        render();
        return;
      }

      // Insert mode owns Ctrl-h / Ctrl-w / Ctrl-u for text editing.
      if (state.mode === 'insert' && (e.key === 'h' || e.key === 'w' || e.key === 'u')) {
        handleInsert(e);
        return;
      }

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

    // Ctrl-o one-shot: if we entered normal via insert-mode Ctrl-o and the
    // normal command fully resolved (no pending operator, count, g-chord, or
    // text-object state), flip back to insert. Escape while pending cancels.
    if (state.pendingOneNormal && state.mode === 'normal') {
      if (e.key === 'Escape') {
        state.pendingOneNormal = false;
      } else if (!pendingOperator && !state.pendingOp && !state.pendingTextObjOp && !state.pendingGForOp && countBuf === 0 && !gTimer) {
        state.pendingOneNormal = false;
        state.mode = 'insert';
        state.insertText = state.insertText || '';
        render();
      }
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
      if (!e.clipboardData) return;
      var text = e.clipboardData.getData('text');
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
