(function() {
  'use strict';

  var courseFiles = {
    '01-handoff.txt': [
      '# Release handoff',
      'status: draf',
      'keep: audit enabled'
    ],
    '02-recovery.txt': [
      '# Deployment note',
      'status: draftt',
      'keep: rollback ready'
    ],
    '03-release-note.txt': [
      'draft: release notes',
      'REMOVE: temporary placeholder',
      'keep: audit link'
    ],
    '04-requests.log': [
      '09:14:01 req_17 ok 82ms',
      '09:14:03 req_42 warning 910ms',
      '09:14:04 req_18 ok 77ms',
      '09:14:05 req_42 timeout 1000ms',
      'finding: TODO'
    ],
    '05-status.txt': [
      'api : pending',
      'worker : pending',
      'web : pending',
      'keep = enabled'
    ],
    '06-evidence.txt': [
      'source req_42',
      'evidence ',
      'keep reviewed'
    ],
    '07-api.js': [
      '# API source',
      '/v2/reports'
    ],
    '07-project.md': [
      '# Project index',
      'reference: /blog/friction-economy/',
      'keep: reviewed'
    ],
    '08-report.md': [
      '# Comparison',
      'source: 08-source.log',
      'keep: source visible'
    ],
    '08-source.log': [
      'warning before timeout'
    ],
    '09-review.md': [
      '# Retry review',
      'keep: compare change and test'
    ],
    '09-change.diff': [
      'change: retry limit 3',
      'tests: 09-tests.log'
    ],
    '09-tests.log': [
      'test: retries stay bounded'
    ],
    '10-trace.log': [
      '09:14:01 request started',
      '09:14:02 timeout req_42',
      '09:14:03 retry recovered',
      'finding: TODO'
    ],
    '11-records.csv': [
      'pending,acct_3',
      'ignore,test_account',
      'pending,acct_1',
      'pending,acct_1',
      'pending,acct_2'
    ],
    '12-routes.txt': [
      'GET /v1/users deprecated',
      'GET /v1/orders deprecated',
      'GET /v1/reports deprecated'
    ]
  };

  var courseLessons = [
    {
      id: 'safe-editing',
      title: 'Open, edit, and save one file',
      purpose: 'Complete one small edit from opening the file through checking the saved result.',
      panelTarget: 'status: draf  →  status: draft',
      file: '01-handoff.txt',
      firstJourney: true,
      requireSave: true,
      worked: [
        'Before: status: draf',
        'Move down with j. Press A to insert at the end. Type t. Press Esc.',
        'After:  status: draft'
      ],
      request: [
        'Open 01-handoff.txt with :e.',
        'Complete status: draft, return to Normal mode, and save with :w.',
        'Save the finished file. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave keep: audit enabled unchanged.'
      ],
      outcome: [
        'status: draft',
        'keep: audit enabled'
      ],
      answer: ['# Release handoff', 'status: draft', 'keep: audit enabled'],
      reject: [],
      rejectLines: ['status: draf'],
      hints: [
        'The Teacher panel at the top of the editor keeps the current action visible.',
        'From the first line, press j. On the status line, A enters Insert mode at the end.',
        'Use j, A, t, Esc, then :w.'
      ],
      golf: ['$at', 'After the guided pass, $ and a can reach the same insertion point.']
    },
    {
      id: 'recover-edit',
      title: 'Correct and recover one edit',
      purpose: 'Fix one extra character, practice undo and redo, then save the recovered result.',
      panelTarget: 'status: draftt  →  status: draft',
      file: '02-recovery.txt',
      recoveryJourney: true,
      requireSave: true,
      worked: [
        'Before: status: draftt',
        'Move to the end with $, delete with x, undo with u, then redo with Ctrl-R.',
        'After:  status: draft'
      ],
      request: [
        'Delete the extra t in draftt.',
        'Undo the correction, then redo it.',
        'Save the recovered result. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave keep: rollback ready unchanged.'
      ],
      outcome: [
        'status: draft',
        'keep: rollback ready'
      ],
      answer: ['# Deployment note', 'status: draft', 'keep: rollback ready'],
      reject: [],
      rejectLines: ['status: draftt'],
      hints: [
        'The Teacher panel follows the cursor and the undo state.',
        'Use $ for line end, x to delete, u to undo, and Ctrl-R to redo.',
        'Use j, $, x, u, Ctrl-R, then :w.'
      ],
      golf: ['$x', 'The direct correction is short; undo and redo are the safety practice.']
    },
    {
      id: 'vim-grammar',
      title: 'Change a word and remove a line',
      purpose: 'Use one operator with a motion, then use one line command.',
      panelTarget: 'draft → ready; remove the REMOVE line',
      file: '03-release-note.txt',
      grammarJourney: true,
      requireSave: true,
      worked: [
        'Before: draft: release notes',
        'Use cw to change the first word to ready.',
        'After:  ready: release notes'
      ],
      request: [
        'Change draft to ready with cw.',
        'Delete the REMOVE line with dd.',
        'Save the finished result. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave keep: audit link unchanged.'
      ],
      outcome: [
        'ready: release notes',
        'keep: audit link'
      ],
      answer: ['ready: release notes', 'keep: audit link'],
      reject: ['REMOVE: temporary placeholder'],
      rejectLines: ['draft: release notes'],
      hints: [
        'The Teacher panel builds each command one key at a time.',
        'c starts a change. w makes that change cover one word. dd deletes one whole line.',
        'Use c, w, ready, Esc, j, d, d, then :w.'
      ],
      golf: ['cwready<Esc>jdd', 'One word change and one line deletion match the two visible targets.']
    },
    {
      id: 'search-navigation',
      title: 'Find evidence in a log',
      purpose: 'Find two related log lines and write one supported finding.',
      panelTarget: 'finding: warning before timeout',
      file: '04-requests.log',
      searchJourney: true,
      requireSave: true,
      worked: [
        'Search for req_42 with /req_42 and Enter.',
        'Use n to inspect the next matching line.',
        'The warning appears before the timeout.'
      ],
      request: [
        'Find both req_42 lines.',
        'Replace finding: TODO with finding: warning before timeout.',
        'Save the supported finding. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave every log line unchanged.'
      ],
      outcome: [
        'finding: warning before timeout'
      ],
      answer: [
        '09:14:01 req_17 ok 82ms',
        '09:14:03 req_42 warning 910ms',
        '09:14:04 req_18 ok 77ms',
        '09:14:05 req_42 timeout 1000ms',
        'finding: warning before timeout'
      ],
      reject: ['finding: TODO'],
      hints: [
        'The Teacher panel builds the search and the finding one action at a time.',
        '/ starts a search. n moves to the next match. G moves to the last line. cc changes that line.',
        'Use /, req_42, Enter, n, G, c, c, the finding, Esc, then :w.'
      ],
      golf: ['/req_42<Enter>nGcc', 'Search the shared ID before writing the conclusion.']
    },
    {
      id: 'repeat-recover',
      title: 'Repeat a verified change',
      purpose: 'Normalize repeated status text after checking one correct edit.',
      panelTarget: 'api, worker, and web → =ready',
      file: '05-status.txt',
      repeatJourney: true,
      requireSave: true,
      worked: [
        'Before: api : pending',
        'Command: find the suffix, change it to =ready, then press Esc.',
        'Repeat: move to the next match and press .'
      ],
      request: [
        'Change the first pending suffix to =ready.',
        'Reuse the verified change on the next two lines.'
      ],
      transfer: [
        'Leave keep = enabled unchanged.'
      ],
      outcome: ['api=ready', 'worker=ready', 'web=ready', 'keep = enabled'],
      answer: ['api=ready', 'worker=ready', 'web=ready', 'keep = enabled'],
      reject: [' : pending'],
      hints: [
        'Make one complete change. Repeat it only after the first result is correct.',
        'Search for the shared suffix. Use c$ once, then n and dot repeat.',
        'Use / : pending, Enter, c, $, =ready, Esc, n, dot, n, dot, then :w.'
      ],
      golf: [':%s/ : pending/=ready/g', 'Use one substitution when every target is identical.']
    },
    {
      id: 'registers-completion',
      title: 'Copy exact text without retyping',
      purpose: 'Select one word, yank it, and put the exact value into an evidence field.',
      panelTarget: 'copy req_42 into the evidence field',
      file: '06-evidence.txt',
      copyJourney: true,
      requireSave: true,
      worked: [
        'Move to req_42 with w.',
        'Use viw to show the inner-word selection, then y to yank it.',
        'Use p to put the copied word at the destination.',
        'In a : or / prompt, Ctrl-R 0 inserts the most recent yank.'
      ],
      request: [
        'Visually select and copy req_42 from the source field.',
        'Put it after evidence without retyping it.',
        'Save the exact copied result. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave keep reviewed unchanged.'
      ],
      outcome: ['source req_42', 'evidence req_42', 'keep reviewed'],
      answer: ['source req_42', 'evidence req_42', 'keep reviewed'],
      reject: [],
      rejectLines: ['evidence '],
      hints: [
        'Ctrl-R 0 inserts the most recent yank into a : or / prompt.',
        'v starts a selection. iw selects the inner word. y yanks it. p puts the copied text.',
        'Use w, v, i, w, y, j, p, then :w.'
      ],
      golf: ['wyiwj$p', 'After the guided selection, yiw yanks the inner word without entering Visual mode.']
    },
    {
      id: 'project-files',
      title: 'Open a source file and return to your report',
      purpose: 'Use the explorer to find a source, then return to an existing report buffer.',
      panelTarget: 'copy /v2/reports into the project index',
      file: '07-project.md',
      fileJourney: true,
      requireSkills: ['URL opening'],
      requiredOpenedUrl: '/blog/friction-economy/',
      requireSave: true,
      worked: [
        'Open the explorer with :Ex.',
        'Put the cursor on 07-api.js and press gf to edit it.',
        'Yank the endpoint, use Ctrl-O to retrace the jump, then choose the report from :buffers.'
      ],
      request: [
        'Find and open 07-api.js from :Ex.',
        'Copy /v2/reports without retyping it.',
        'Return to 07-project.md and put the copied line after the heading.',
        'Open the reference route with gx, then return to Vim.'
      ],
      transfer: [
        'Leave keep: reviewed unchanged. Save the report.'
      ],
      outcome: ['# Project index', '/v2/reports', 'reference: /blog/friction-economy/', 'keep: reviewed'],
      answer: ['# Project index', '/v2/reports', 'reference: /blog/friction-economy/', 'keep: reviewed'],
      reject: [],
      hints: [
        'The explorer lists files. Search for the source name, then use gf on that filename.',
        'Ctrl-O retraces a jump. :buffers lists loaded files. gx opens a URL or site route in the browser.',
        'Use :Ex, search 07-api.js, gf, j, yy, Ctrl-O, :buffers, search 07-project.md, gf, p, j, gx, then :w.'
      ],
      golf: ['gf, Ctrl-O, :buffers', 'Discover a file, retrace the jump, then select an already loaded buffer.']
    },
    {
      id: 'split-windows',
      title: 'Compare a source in another window',
      purpose: 'Keep source evidence visible while you add it to a report.',
      panelTarget: 'copy warning before timeout into the report',
      file: '08-report.md',
      windowJourney: true,
      requireSave: true,
      worked: [
        'Search for 08-source.log in the report, then use :wincmd f so both buffers stay visible.',
        'Copy the source line with yy.',
        'Use :wincmd w to move to the report window without triggering the browser shortcut.'
      ],
      request: [
        'Put warning before timeout after the report heading.',
        'Use :only to close the extra view after the comparison.',
        'Save the report. Teacher validates it automatically.'
      ],
      transfer: [
        'Leave keep: source visible unchanged.'
      ],
      outcome: ['# Comparison', 'warning before timeout', 'source: 08-source.log', 'keep: source visible'],
      answer: ['# Comparison', 'warning before timeout', 'source: 08-source.log', 'keep: source visible'],
      reject: [],
      hints: [
        'A window is a view onto a buffer. Both files remain loaded when one view closes.',
        ':wincmd f opens the filename under the cursor in a split. :wincmd w changes the active window. :only keeps the active view.',
        'Search 08-source.log, use :wincmd f, yy, :wincmd w, k, p, :only, then :w.'
      ],
      golf: [':wincmd f, :wincmd w, :only', 'Keep both files visible only while the comparison needs both views.']
    },
    {
      id: 'tab-workspaces',
      title: 'Keep a separate task in another tab page',
      purpose: 'Preserve a comparison layout while you inspect temporary test output elsewhere.',
      panelTarget: 'copy the bounded-retry test result into the review',
      file: '09-review.md',
      tabJourney: true,
      requireSave: true,
      worked: [
        'Build one review layout with :vsplit 09-change.diff.',
        'Open 09-tests.log with :tabedit so it gets a separate tab page.',
        'Use gt to move between the two workspaces.'
      ],
      request: [
        'Confirm that the review split remains intact after a tab round trip.',
        'Copy the test result, close its tab page, and put the result in the review.',
        'Close the extra window and save the review.'
      ],
      transfer: [
        'Use a split for simultaneous comparison. Use a tab page for a separate workspace.'
      ],
      outcome: ['# Retry review', 'test: retries stay bounded', 'keep: compare change and test'],
      answer: ['# Retry review', 'test: retries stay bounded', 'keep: compare change and test'],
      reject: [],
      hints: [
        'A tab page stores a window layout. It is not one file with a decorative tab.',
        ':tabedit opens a file in a separate tab page. gt moves to the next tab page.',
        'Use :vsplit 09-change.diff, :tabedit 09-tests.log, gt, gt, yy, :tabclose, :wincmd w, p, :only, then :w.'
      ],
      golf: [':tabedit, gt, :tabclose', 'Keep the temporary test task separate, then close its tab page when the result is captured.']
    },
    {
      id: 'navigation-history',
      title: 'Retrace evidence and recent changes',
      purpose: 'Return to a distant source or edit without rebuilding the route from memory.',
      panelTarget: 'finding: timeout recovered after retry',
      file: '10-trace.log',
      historyJourney: true,
      requireSkills: ['jump history', 'changelist'],
      requireSave: true,
      worked: [
        'Search for timeout, then jump to the final finding with G.',
        'Ctrl-O returns to the older source. Ctrl-I returns to the newer location.',
        'After an edit, g; returns to the latest changed location.'
      ],
      request: [
        'Retrace the timeout and finding with the jump list.',
        'Write finding: timeout recovered after retry.',
        'Move away, use the change list to return, then save.'
      ],
      transfer: [
        'Small h, j, k, and l moves do not belong in jump history.'
      ],
      outcome: ['finding: timeout recovered after retry'],
      answer: [
        '09:14:01 request started',
        '09:14:02 timeout req_42',
        '09:14:03 retry recovered',
        'finding: timeout recovered after retry'
      ],
      reject: ['finding: TODO'],
      hints: [
        'The jump list records meaningful jumps, not every cursor step.',
        'Ctrl-O goes to an older jump. Ctrl-I goes to a newer jump. g; goes to an older change.',
        'Use /timeout, Enter, G, Ctrl-O, Ctrl-I, cc, the finding, Esc, gg, g;, then :w.'
      ],
      golf: ['Ctrl-O, Ctrl-I, and g;', 'Use jump history for locations and change history for edits.']
    },
    {
      id: 'bulk-editing',
      title: 'Clean a small data file safely',
      purpose: 'Remove one excluded row, normalize one field, then sort and deduplicate the reviewed result.',
      panelTarget: 'three unique ready account rows',
      file: '11-records.csv',
      bulkJourney: true,
      requireSave: true,
      worked: [
        'Remove the excluded test row with :g/^ignore/d.',
        'Change each leading pending value with :%s/^pending/ready/.',
        'Use :sort u only after the remaining rows are correct.'
      ],
      request: [
        'Remove the ignored test account.',
        'Change pending to ready on every remaining row.',
        'Sort the file, remove duplicates, then save it.'
      ],
      transfer: [
        'Review the result after each command. Undo immediately if a command changes the wrong rows.'
      ],
      outcome: ['ready,acct_1', 'ready,acct_2', 'ready,acct_3'],
      answer: ['ready,acct_1', 'ready,acct_2', 'ready,acct_3'],
      reject: ['pending,', 'ignore,', 'ready,acct_1\nready,acct_1'],
      hints: [
        'Each command has one job. Check the visible rows before the next command.',
        ':g deletes matching rows. :%s changes matching text across the file. :sort u sorts and removes duplicate lines.',
        'Run :g/^ignore/d, then :%s/^pending/ready/, then :sort u and :w.'
      ],
      golf: [':g, :%s, then :sort u', 'Keep exclusion, normalization, and deduplication as separate reviewable steps.']
    },
    {
      id: 'macros',
      title: 'Replay one verified route migration',
      purpose: 'Record one structure-aware edit and replay it only after the first result is correct.',
      panelTarget: 'all three routes use /v2/ and active',
      file: '12-routes.txt',
      macroJourney: true,
      requireSkills: ['macros'],
      requireSave: true,
      worked: [
        'Start recording with qq. Change v1 to v2 and deprecated to active.',
        'Stop recording only after the cursor is ready for the next line.'
      ],
      request: [
        'Record the first complete change in register q.',
        'Replay it on the remaining two routes, then save the file.'
      ],
      transfer: [
        'Inspect all three lines before accepting the result.'
      ],
      outcome: ['GET /v2/users active', 'GET /v2/orders active', 'GET /v2/reports active'],
      answer: ['GET /v2/users active', 'GET /v2/orders active', 'GET /v2/reports active'],
      reject: ['/v1/', 'deprecated'],
      hints: [
        'Make the cursor path repeatable before you record it.',
        'Use qq to record in q. Complete one line, move to the next line, stop with q, and replay with @q.',
        'Record f1r2, then $bciwactive<Esc>, then j0. Stop with q. Replay with @q and @@.'
      ],
      golf: ['@q then Q', 'This web editor follows Neovim: Q repeats the last recorded macro. Use substitutions when every line has the same structure.']
    }
  ];

  var projectFiles = {
    'incident.log': [
      '2026-08-14T02:11:04Z INFO deploy source=production-api status=scheduled',
      '2026-08-14T02:11:09Z EVENT id=evt_014203 source=demo_importer records=14203',
      '2026-08-14T02:12:00Z INFO deploy source=production-api status=online',
      '2026-08-14T02:14:17Z WARN id=evt_014204 source=demo_importer status : duplicated',
      '2026-08-14T02:14:18Z WARN id=evt_014205 source=demo_importer status : duplicated',
      '2026-08-14T02:14:19Z WARN id=evt_014206 source=demo_importer status : duplicated',
      '',
      'ANALYST_NOTE: replace me'
    ],
    'events.csv': [
      'event_id,source,observed_at,records,deployed_at',
      'evt_014201,production_api,2026-08-14T02:13:01Z,12,2026-08-14T02:12:00Z',
      'evt_014202,production_api,2026-08-14T02:13:14Z,18,2026-08-14T02:12:00Z',
      'evt_014203,demo_importer,2026-08-14T02:11:09Z,14203,2026-08-14T02:12:00Z',
      'evt_014204,demo_importer,2026-08-14T02:14:17Z,14,2026-08-14T02:12:00Z',
      '',
      '# candidate_id',
      'evt_014203',
      '# candidate_source',
      'demo_importer',
      '# evidence_id',
      'TODO',
      '# evidence_source',
      'TODO'
    ],
    'config.js': [
      'export const ingestion = {',
      '  source: "demo-importer",',
      '  deployedAt: "2026-08-14T02:12:00Z",',
      '  recordLimit: 200',
      '};',
      '',
      'export const labels = {',
      '  report: "Launch metrics",',
      '  channel: "production"',
      '};',
      '',
      '// CHANGE_NOTE: replace me'
    ],
    'launch-copy.md': [
      '# Launch Metrics',
      '',
      'Every imported record was verified before publication.',
      '',
      'The dashboard recorded 14,203 verified production records during launch.',
      '',
      'Qualified note: Counts are preliminary until source review is complete.',
      '',
      'Metric key: REVIEWED_PRODUCTION_EVENTS',
      '',
      'Approved copy: replace me'
    ],
    'runbook.md': [
      '# Analytics Incident Runbook',
      '1. Restart the dashboard and check whether the number changes.',
      '2. Treat a green status as proof that the source is correct.',
      '3. Add a disclaimer if the source cannot be verified.',
      'Operator action: replace me'
    ],
    'postmortem.md': [
      '# Analytics Incident Postmortem',
      '',
      'Impact: TODO',
      'Evidence: TODO',
      'Root cause: TODO',
      'Repair: TODO',
      'Launch copy: TODO',
      'Runbook: TODO',
      'Follow-up: TODO',
      'Verified sources: TODO'
    ]
  };

  var projectMissions = [
    {
      id: 'timeline',
      title: 'Establish the timeline',
      purpose: 'Decide whether the large record count belongs to the production deployment.',
      panelTarget: 'record the event, count, and pre-production timing',
      file: 'incident.log',
      worked: [
        'Evidence: evt_014203 recorded 14,203 rows at 02:11:09.',
        'Comparison: production-api became online at 02:12:00.',
        'Conclusion: the large count arrived before production was online.'
      ],
      request: [
        'Find records=14203 and compare its timestamp with status=online.',
        'Replace ANALYST_NOTE with the event ID, count, and timing conclusion.'
      ],
      transfer: ['Preserve the raw log lines. Put the conclusion only in ANALYST_NOTE.'],
      outcome: ['ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online'],
      answer: [
        '2026-08-14T02:11:04Z INFO deploy source=production-api status=scheduled',
        '2026-08-14T02:11:09Z EVENT id=evt_014203 source=demo_importer records=14203',
        '2026-08-14T02:12:00Z INFO deploy source=production-api status=online',
        '2026-08-14T02:14:17Z WARN id=evt_014204 source=demo_importer status : duplicated',
        '2026-08-14T02:14:18Z WARN id=evt_014205 source=demo_importer status : duplicated',
        '2026-08-14T02:14:19Z WARN id=evt_014206 source=demo_importer status : duplicated',
        '',
        'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online'
      ],
      hints: [
        'Find the count event and the deployment event before writing a conclusion.',
        'Use search and jump history for evidence. Use a line text object for the note.',
        'Search /records=14203, retrace with Ctrl-O and Ctrl-I, then use G and cil on ANALYST_NOTE.'
      ],
      reject: ['ANALYST_NOTE: replace me'],
      golf: ['Gcil', 'Use this after the timeline is understood to change the final note directly.']
    },
    {
      id: 'data-evidence',
      title: 'Compare the data',
      purpose: 'Separate the anomalous import from ordinary production counts and carry exact evidence.',
      panelTarget: 'fill the evidence ID and source from named registers',
      file: 'events.csv',
      worked: [
        'Ordinary production counts are 12 and 18.',
        'The 14,203 row uses demo_importer and predates deployedAt.',
        'Named registers preserve the exact ID and source while destinations change.'
      ],
      request: [
        'Compare 14,203 with the ordinary counts of 12, 18, and 14.',
        'Yank the candidate ID into register a and the source into register b.',
        'Replace both TODO lines by putting those named registers.'
      ],
      transfer: ['Inspect registers a and b before putting them into the evidence fields.'],
      outcome: ['# evidence_id', 'evt_014203', '# evidence_source', 'demo_importer'],
      answer: [
        'event_id,source,observed_at,records,deployed_at',
        'evt_014201,production_api,2026-08-14T02:13:01Z,12,2026-08-14T02:12:00Z',
        'evt_014202,production_api,2026-08-14T02:13:14Z,18,2026-08-14T02:12:00Z',
        'evt_014203,demo_importer,2026-08-14T02:11:09Z,14203,2026-08-14T02:12:00Z',
        'evt_014204,demo_importer,2026-08-14T02:14:17Z,14,2026-08-14T02:12:00Z',
        '',
        '# candidate_id',
        'evt_014203',
        '# candidate_source',
        'demo_importer',
        '# evidence_id',
        'evt_014203',
        '# evidence_source',
        'demo_importer'
      ],
      hints: [
        'Store the exact source values before changing either destination.',
        'Use named registers with yiw and p. Inspect them with :registers a b.',
        'Search candidate_id, move to its next line, and use "ayiw. Delete the evidence TODO and put with "ap. Repeat with b.'
      ],
      expect: ['# evidence_id\nevt_014203', '# evidence_source\ndemo_importer'],
      reject: ['# evidence_id\nTODO', '# evidence_source\nTODO'],
      golf: [':registers a b', 'Inspect evidence before putting it.']
    },
    {
      id: 'source-repair',
      title: 'Repair the source',
      purpose: 'Correct the configured ingestion source without changing nearby settings.',
      panelTarget: 'demo-importer → production-api',
      file: 'config.js',
      worked: [
        'Target: the text inside source: "demo-importer".',
        'Command shape: change inside quotes.',
        'Preserve deployedAt, recordLimit, and labels.'
      ],
      request: [
        'Change only the quoted source from demo-importer to production-api.',
        'Replace CHANGE_NOTE, move away, then revisit the edits with the changelist.'
      ],
      transfer: ['Use the changelist and latest-change mark to verify both edit locations.'],
      outcome: ['  source: "production-api",', '// CHANGE_NOTE: source corrected to production-api'],
      answer: [
        'export const ingestion = {',
        '  source: "production-api",',
        '  deployedAt: "2026-08-14T02:12:00Z",',
        '  recordLimit: 200',
        '};',
        '',
        'export const labels = {',
        '  report: "Launch metrics",',
        '  channel: "production"',
        '};',
        '',
        '// CHANGE_NOTE: source corrected to production-api'
      ],
      hints: [
        'Change the value, not the assignment or surrounding object.',
        'Use a quote text object, a line text object, and change-history motions.',
        'Search /demo-importer and use ci". Use cil on CHANGE_NOTE, then try g;, g,, and `..'
      ],
      expect: ['source: "production-api"', '// CHANGE_NOTE: source corrected to production-api'],
      reject: ['source: "demo-importer"', '// CHANGE_NOTE: replace me'],
      golf: ['`.', 'Jump to the latest edit.']
    },
    {
      id: 'normalize-records',
      title: 'Normalize the records',
      purpose: 'Turn three malformed status fragments into one consistent field.',
      panelTarget: 'three status=duplicate records',
      file: 'incident.log',
      worked: [
        'First result: status : duplicated becomes status=duplicate.',
        'A verified first edit becomes the repeat source.',
        'The macro must end ready for the next matching line.'
      ],
      request: [
        'Change all three malformed status fragments to status=duplicate.',
        'Fix one manually. Reuse the change with dot and a recorded macro.'
      ],
      transfer: ['Inspect all three event IDs after replay. Preserve their timestamps and sources.'],
      outcome: [
        'id=evt_014204 source=demo_importer status=duplicate',
        'id=evt_014205 source=demo_importer status=duplicate',
        'id=evt_014206 source=demo_importer status=duplicate'
      ],
      answer: [
        '2026-08-14T02:11:04Z INFO deploy source=production-api status=scheduled',
        '2026-08-14T02:11:09Z EVENT id=evt_014203 source=demo_importer records=14203',
        '2026-08-14T02:12:00Z INFO deploy source=production-api status=online',
        '2026-08-14T02:14:17Z WARN id=evt_014204 source=demo_importer status=duplicate',
        '2026-08-14T02:14:18Z WARN id=evt_014205 source=demo_importer status=duplicate',
        '2026-08-14T02:14:19Z WARN id=evt_014206 source=demo_importer status=duplicate',
        '',
        'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online'
      ],
      hints: [
        'Make one correct normalization before you automate it.',
        'Use search, one change, dot-repeat, then a short macro for the final match.',
        'Search /status : duplicated and use c$ once. Record qzn.q to find and repeat on the next match. Replay @z for the final match.'
      ],
      reject: ['status : duplicated'],
      golf: [':%s/status : duplicated/status=duplicate/g', 'Fix identical text once.']
    },
    {
      id: 'launch-copy',
      title: 'Correct the launch story',
      purpose: 'Replace unsupported launch claims with statements supported by the reviewed files.',
      panelTarget: 'replace unsupported claims with reviewed evidence',
      file: 'launch-copy.md',
      worked: [
        'Unsupported: the 14,203 records were verified production activity.',
        'Evidence: they came from demo-importer before production-api was online.',
        'Approved copy names the reviewed metric without inflating the count.'
      ],
      request: [
        'Replace both unsupported claims with the reviewed evidence.',
        'Write the approved sentence and complete REVIEWED_ from this document.'
      ],
      transfer: ['Keep the preliminary-count qualification unchanged.'],
      outcome: [
        'Claim review: The 14,203 demo-importer records are not production activity.',
        'Evidence note: evt_014203 occurred before production-api was online.',
        'Approved copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.'
      ],
      answer: [
        '# Launch Metrics',
        '',
        'Claim review: The 14,203 demo-importer records are not production activity.',
        '',
        'Evidence note: evt_014203 occurred before production-api was online.',
        '',
        'Qualified note: Counts are preliminary until source review is complete.',
        '',
        'Metric key: REVIEWED_PRODUCTION_EVENTS',
        '',
        'Approved copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.'
      ],
      hints: [
        'Replace only claims that the evidence disproves. Preserve the qualification.',
        'Use line text objects for claims and current-buffer completion for the metric key.',
        'Use cil on each claim. On Approved copy, type through REVIEWED_, press Insert Ctrl-N, then finish the sentence.'
      ],
      reject: [
        'Every imported record was verified before publication.',
        'The dashboard recorded 14,203 verified production records during launch.'
      ],
      golf: ['REVIEWED_<C-N>', 'Complete the key instead of retyping it.']
    },
    {
      id: 'operations',
      title: 'Fix operations',
      purpose: 'Replace guesses with checks an on-call operator can perform from the available files.',
      panelTarget: 'three observable checks and one publication safeguard',
      file: 'runbook.md',
      worked: [
        'A restart does not establish source correctness.',
        'A green status does not prove event provenance.',
        'The repaired steps verify source, deployment time, and event time.'
      ],
      request: [
        'Replace the three guesses with checks another operator can perform.',
        'Use cc for each complete instruction line.',
        'Write one exact operator action that protects publication.'
      ],
      transfer: ['Make each line independently actionable for an operator who did not investigate the incident.'],
      outcome: [
        '1. Confirm the active event source in config.js.',
        '2. Compare event time with deployedAt.',
        '3. Quarantine pre-deployment events and notify on-call.',
        'Operator action: Verify event source, deployment time, and event timestamp before publishing counts.'
      ],
      answer: [
        '# Analytics Incident Runbook',
        '1. Confirm the active event source in config.js.',
        '2. Compare event time with deployedAt.',
        '3. Quarantine pre-deployment events and notify on-call.',
        'Operator action: Verify event source, deployment time, and event timestamp before publishing counts.'
      ],
      hints: [
        'Replace each guess with an observable check.',
        'Use a whole-line change for each numbered instruction.',
        'Use j and cc. cc changes one whole line and preserves its neighbors.'
      ],
      reject: ['Restart the dashboard', 'green status as proof', 'Add a disclaimer'],
      golf: ['cc', 'Change the whole instruction line.']
    },
    {
      id: 'postmortem',
      title: 'Write the postmortem',
      purpose: 'Assemble the verified impact, evidence, repair, and follow-up into one source-backed report.',
      panelTarget: 'complete seven evidence-backed postmortem fields',
      file: 'postmortem.md',
      worked: [
        'Impact states what the dashboard displayed.',
        'Evidence names the event and its timing.',
        'Root cause distinguishes demo-importer from production-api.'
      ],
      request: [
        'Replace the first seven TODO fields with the evidence and repairs.',
        'Paste demo_importer from register b into Root cause.',
        'Use f_ and r- so the CSV value reads demo-importer in prose.',
        'Keep every claim traceable to a file you edited.'
      ],
      transfer: ['Write the follow-up as a concrete prevention step, not a general recommendation.'],
      outcome: [
        'Impact: Dashboard displayed 14,203 unverified pre-deployment records.',
        'Evidence: evt_014203 occurred before production-api was online.',
        'Root cause: The active source was demo-importer instead of production-api.',
        'Repair: Config now uses production-api.',
        'Launch copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.',
        'Runbook: Verify event source, deployment time, and event timestamp before publishing counts.',
        'Follow-up: Add a deployment-time validation gate before ingest.'
      ],
      answer: [
        '# Analytics Incident Postmortem',
        '',
        'Impact: Dashboard displayed 14,203 unverified pre-deployment records.',
        'Evidence: evt_014203 occurred before production-api was online.',
        'Root cause: The active source was demo-importer instead of production-api.',
        'Repair: Config now uses production-api.',
        'Launch copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.',
        'Runbook: Verify event source, deployment time, and event timestamp before publishing counts.',
        'Follow-up: Add a deployment-time validation gate before ingest.',
        'Verified sources: TODO'
      ],
      hints: [
        'Write one evidence-backed statement per field.',
        'Use line text objects, named register b, and a character replacement.',
        'Use cil for each field. Put b with "bp, then use f_ and r-.'
      ],
      reject: ['Impact: TODO', 'Evidence: TODO', 'Root cause: TODO', 'Repair: TODO', 'Launch copy: TODO', 'Runbook: TODO', 'Follow-up: TODO'],
      golf: ['"bp then f_r-', 'Reuse and normalize the source value.']
    },
    {
      id: 'retrace',
      title: 'Retrace the work',
      purpose: 'Verify that every postmortem claim can be traced back to an edited source file.',
      panelTarget: 'list the five edited evidence sources',
      file: 'postmortem.md',
      worked: [
        ':jumps shows the file route.',
        'Ctrl-O and Ctrl-I traverse older and newer source locations.',
        'g; and g, revisit edits within the current file.'
      ],
      request: [
        'Optional Teacher views do not enter jump history.',
        'Use :jumps, then jump and change history, to revisit the report sources.',
        'Replace Verified sources with the five files that support the conclusion.'
      ],
      transfer: ['Do not list postmortem.md as its own evidence source.'],
      outcome: ['Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'],
      answer: [
        '# Analytics Incident Postmortem',
        '',
        'Impact: Dashboard displayed 14,203 unverified pre-deployment records.',
        'Evidence: evt_014203 occurred before production-api was online.',
        'Root cause: The active source was demo-importer instead of production-api.',
        'Repair: Config now uses production-api.',
        'Launch copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.',
        'Runbook: Verify event source, deployment time, and event timestamp before publishing counts.',
        'Follow-up: Add a deployment-time validation gate before ingest.',
        'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'
      ],
      hints: [
        'Inspect the route before writing the source list.',
        'Use jump history across files and change history within the report.',
        'Use :jumps, Ctrl-O, Ctrl-I, g;, and g,. Finish with cil.'
      ],
      reject: ['Verified sources: TODO'],
      golf: [':jumps', 'Inspect the source route.']
    }
  ];

  window.VIM_TEACHER = {
    version: 2,
    course: {
      intro: [
        'VIM TEACHER // COURSE',
        '',
        'Learn Vim by completing one real edit at a time.',
        '',
        'Teacher will explain one action, keep it visible while you work,',
        'and validate the saved result before you continue.',
        '',
        'DO THIS NOW',
        '  Type :teacher, then follow the Teacher panel at the top of the editor.'
      ],
      done: [
        'VIM TEACHER // CORE COURSE COMPLETE',
        '',
        'You completed the required editing units.',
        'The next step is the applied multi-file project.',
        '',
        'Type :teacher project to start it.'
      ],
      files: courseFiles,
      lessons: courseLessons
    },
    project: {
      intro: [
      'APPLIED VIM PROJECT',
      '',
      'Role: on-call engineer reviewing an analytics incident.',
      '',
      'The dashboard reported 14,203 production records before the',
      'production collector was online.',
      '',
      'Trace the source, repair the configuration, correct the launch claims,',
      'and deliver a postmortem that names its evidence.',
      '',
      'You will work across a log, CSV, JavaScript configuration, launch copy,',
      'runbook, and postmortem. Teacher shows one work request at a time.',
      '',
      'DO THIS NOW',
      '  Type :teacher project, then follow the Teacher panel at the top of the editor.',
      '',
      'Project files and saves stay in this session. :teacher export downloads',
      'progress only, never the work files.'
      ],
      done: [
      'APPLIED VIM PROJECT // COMPLETE',
      '',
      'You traced the incorrect count to a demo data source, repaired the',
      'configuration, removed unsupported claims, corrected the runbook,',
      'and finished a source-backed postmortem.',
      '',
      'The final deliverable is in postmortem.md.',
      'Press Ctrl-O to return to it.',
      '',
      'What you practiced:',
      '  jump and change history across real files',
      '  named registers, dot-repeat, and macros',
      '  current-buffer completion and text objects',
      '  incident response, data analysis, software repair, copy, and operations'
      ],
      files: projectFiles,
      missions: projectMissions
    }
  };
})();
