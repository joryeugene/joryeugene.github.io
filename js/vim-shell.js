window.VIM_SHELL_PURE_HANDLERS = {
  'pwd':      function() { return ['/home/visitor/jorypestorious.com']; },
  'whoami':   function() { return ['visitor']; },
  'date':     function() { return [new Date().toString()]; },
  'echo':     function(argv) { return [argv.slice(1).join(' ')]; },
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
  'cowsay':   function(argv) {
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
  'git':      function(argv) {
    if (argv[1] === 'status') return ['On branch master', 'nothing to commit, working tree clean'];
    if (argv[1] === 'log') return ['dba9f41 lets go', '0ebcb2a fix(vim): exit to saved referrer', 'fb3b083 fix(vim): word motions, cursor init'];
    return ['git: command requires a subcommand.'];
  },
  'node':     function() { return ['Welcome to Node.js v22.0.0', '(just kidding, this is vim)']; },
  'python':   function() { return ['Python 3.13.0', '>>> import antigravity', '(just kidding, this is vim)']; },
  'make':     function() { return ['make: *** No targets specified and no makefile found.  Stop.', '(there is no makefile. there is only vim.)']; },
  'ssh':      function(argv) { return ['ssh: connect to host ' + (argv[1] || 'localhost') + ': Connection refused', '(you are already where you need to be)']; }
};
