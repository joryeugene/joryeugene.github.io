(function() {
  'use strict';

  var courseFiles = {
    '01-handoff.txt': [
      '# Release handoff',
      'status: draf',
      'owner: TOD0',
      'recovery: readyy',
      'keep: audit enabled'
    ],
    '02-service.js': [
      'export const environment = "development";',
      'export const obsolete = "remove this line";',
      'export const title = "draft";',
      'export const retries = retryPolicy(2);'
    ],
    '03-requests.log': [
      '09:14:01 INFO request=req_17 status=ok latency=82',
      '09:14:03 WARN request=req_42 status=slow latency=910',
      '09:14:04 INFO request=req_18 status=ok latency=77',
      '09:14:05 ERROR request=req_42 status=timeout latency=1000',
      '09:14:06 INFO request=req_19 status=ok latency=91',
      'ANALYSIS: TODO',
      'SUMMARY: TODO'
    ],
    '04-status.txt': [
      'api : pending',
      'worker : pending',
      'web : pending',
      'keep = enabled'
    ],
    '05-evidence.md': [
      '# Evidence transfer',
      'candidate_id',
      'req_42',
      'candidate_owner',
      'platform',
      'evidence_id',
      'TODO',
      'evidence_owner',
      'TODO',
      'metric',
      'REVIEWED_PRODUCTION_EVENTS',
      'approved_metric',
      'REVIEWED_'
    ],
    '06-api.js': [
      'export const endpoint = "/v2/reports";',
      'export const timeoutMs = 1000;'
    ],
    '06-ui.js': [
      'export const screen = "review";',
      'export const refreshMs = 1000;'
    ],
    '06-project.md': [
      '# Project index',
      'API route: TODO',
      'UI screen: TODO',
      'Sources: TODO'
    ],
    '07-records.csv': [
      'pending,acct_3',
      'ignore,test_account',
      'pending,acct_1',
      'pending,acct_1',
      'pending,acct_2'
    ],
    '08-routes.txt': [
      'GET /v1/users deprecated',
      'GET /v1/orders deprecated',
      'GET /v1/reports deprecated'
    ]
  };

  var courseLessons = [
    {
      id: 'safe-editing',
      title: 'Make one safe edit',
      purpose: 'Change a small handoff file, recover a mistake, and preserve unrelated text.',
      file: '01-handoff.txt',
      worked: [
        'Before: status: draf',
        'Command: move to the line end with $, append with a, type t, then press Esc.',
        'After:  status: draft'
      ],
      request: [
        'Complete the status line with Normal mode, Insert mode, and Escape.',
        'Replace TOD0 with team using movement, x, and Insert mode.',
        'Delete the extra y in readyy. Undo that edit, then redo it.'
      ],
      transfer: [
        'Leave keep: audit enabled unchanged.',
        'Write the file after every required line is correct.'
      ],
      outcome: [
        'status: draft',
        'owner: team',
        'recovery: ready',
        'keep: audit enabled'
      ],
      reject: ['owner: TOD0', 'recovery: readyy'],
      rejectLines: ['status: draf'],
      hints: [
        'Work on one line at a time. Return to Normal mode after each edit.',
        'Use $ and a for the status. Use 0, counted l, 4x, and a for the owner. Use u and Ctrl-R for recovery.',
        'Status: $at<Esc>. Owner: j07l4xateam<Esc>. Recovery: j$x, then u and Ctrl-R.'
      ],
      golf: ['$at then j0wcwteam', 'Use a word change after the first safe pass.']
    },
    {
      id: 'vim-grammar',
      title: 'Edit code by meaning',
      purpose: 'Change values and remove a line without selecting characters manually.',
      file: '02-service.js',
      worked: [
        'Before: environment = "development"',
        'Command: ci"production<Esc>',
        'After:  environment = "production"'
      ],
      request: [
        'Change the environment string to production with a quote text object.',
        'Change the title string to ready.',
        'Delete the obsolete line with a line operator.'
      ],
      transfer: [
        'Before deleting a line, return to the first line and use 3j to reach retries.',
        'Use % to inspect the matching parentheses in retryPolicy(2).',
        'Change its argument from 2 to 4 without changing the call or semicolon.'
      ],
      outcome: [
        'environment = "production"',
        'title = "ready"',
        'retries = retryPolicy(4)'
      ],
      reject: ['environment = "development"', 'obsolete', 'title = "draft"', 'retryPolicy(2)'],
      hints: [
        'Treat each quoted value and each complete line as a text object.',
        'Use ci" for quoted values, % for the call pair, dd for the obsolete line, and ciw for the argument.',
        'Use f"ci"production<Esc>, 03jf(%%f2ciw4<Esc>, k0f"ci"ready<Esc>, then kdd.'
      ],
      golf: ['f"ci", 3j, f(%%, f2ciw, kf"ci", kdd', 'Inspect the call boundary, then use one operator for each semantic target.']
    },
    {
      id: 'search-navigation',
      title: 'Find evidence and return',
      purpose: 'Locate related log entries and write one supported summary.',
      file: '03-requests.log',
      worked: [
        'Search: /req_42',
        'Move between matches: n and N. Search the word under the cursor: *.',
        'Save a useful location with ma. Return to it with `a.'
      ],
      request: [
        'Find both req_42 entries and compare the warning with the timeout.',
        'Mark the warning line with ma.',
        'Use Ctrl-O and Ctrl-I to retrace one mark jump.'
      ],
      transfer: [
        'Replace ANALYSIS with: warning preceded timeout.',
        'Replace SUMMARY with the request ID, warning latency, and final status.',
        'Use g; and g, to revisit both edits without searching for them.'
      ],
      outcome: [
        'ANALYSIS: warning preceded timeout',
        'SUMMARY: req_42 had a 910 ms warning before timeout'
      ],
      reject: ['ANALYSIS: TODO', 'SUMMARY: TODO'],
      hints: [
        'Search by the shared request ID. Save the warning before you write the analysis.',
        'Use /req_42, n, N, *, ma, `a, Ctrl-O, Ctrl-I, g;, and g,.',
        'Find and mark the warning. Use G and cil for SUMMARY, then k and cil for ANALYSIS. Use g; and g, after both edits.'
      ],
      golf: ['/req_42, ma, n, Gcil, kcil', 'Search by the shared identifier and keep one evidence location marked.']
    },
    {
      id: 'repeat-recover',
      title: 'Repeat a verified change',
      purpose: 'Normalize repeated status text after checking one correct edit.',
      file: '04-status.txt',
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
        'Leave keep = enabled unchanged. Undo and redo the last repeat to verify recovery.',
        'Recall the search with / and Up. Run it once more to confirm no matching suffix remains.'
      ],
      outcome: ['api=ready', 'worker=ready', 'web=ready', 'keep = enabled'],
      reject: [' : pending'],
      hints: [
        'Make one complete change. Repeat it only after the first result is correct.',
        'Search for the shared suffix. Use c$ once, then n and dot repeat. Recall the search after the edits.',
        'Use / : pending<Enter>, c$=ready<Esc>, then n., then n. again. Undo and redo. Use /, Up, Enter to verify.'
      ],
      golf: [':%s/ : pending/=ready/g', 'Use one substitution when every target is identical.']
    },
    {
      id: 'registers-completion',
      title: 'Carry exact text',
      purpose: 'Reuse identifiers without retyping them.',
      file: '05-evidence.md',
      worked: [
        'Yank req_42 into register a with "ayiw.',
        'Inspect it with :registers a before changing a destination.',
        'Delete the destination TODO, then put register a with "ap.'
      ],
      request: [
        'Copy the candidate ID and owner into registers a and b.',
        'Put those values into the matching evidence fields.'
      ],
      transfer: [
        'Complete REVIEWED_ from another word in this file with Insert Ctrl-N.'
      ],
      outcome: ['evidence_id\nreq_42', 'evidence_owner\nplatform', 'approved_metric\nREVIEWED_PRODUCTION_EVENTS'],
      reject: ['evidence_id\nTODO', 'evidence_owner\nTODO'],
      rejectLines: ['REVIEWED_'],
      hints: [
        'Store each source value before you change its destination.',
        'Use named registers with yiw and p. Use Insert Ctrl-N for the metric.',
        'Use 2j0"ayiw, 2j0"byiw, and :registers a b. Return with Ctrl-O. Replace each TODO with its register. Use A and Ctrl-N on REVIEWED_.'
      ],
      golf: [':registers a b', 'Inspect stored text before you put it.']
    },
    {
      id: 'project-files',
      title: 'Work across files',
      purpose: 'Collect exact evidence from code files without losing the route back to the report.',
      file: '06-project.md',
      worked: [
        'Open :Ex, select 06-api.js, and press Enter.',
        'Yank the route with yi". Use Ctrl-O once to return to the report.'
      ],
      request: [
        'Read the endpoint in 06-api.js and the screen in 06-ui.js.',
        'Return to 06-project.md after each source.',
        'Run :jumps after both returns to inspect the route you took.'
      ],
      transfer: [
        'Replace every TODO in the project index and name both source files.'
      ],
      outcome: ['API route: /v2/reports', 'UI screen: review', 'Sources: 06-api.js, 06-ui.js'],
      reject: ['TODO'],
      hints: [
        'Use the file explorer or :e to inspect each source. Keep the report as your return point.',
        'Use :Ex for the API and :e for the UI. Yank each quoted value, then Ctrl-O and put it in the index.',
        'Open 06-api.js with :Ex and 06-ui.js with :e. Use yi" into registers a and b. Return with Ctrl-O, replace each TODO, then inspect :jumps.'
      ],
      golf: [':Ex plus Ctrl-O', 'Use the explorer and jump history as one file-navigation loop.']
    },
    {
      id: 'bulk-editing',
      title: 'Change many records safely',
      purpose: 'Normalize, sort, and deduplicate a small CSV file with reversible commands.',
      file: '07-records.csv',
      worked: [
        'Remove the test row with :g/^ignore/d.',
        'Change every leading pending value with :%s/^pending/ready/.',
        'Review each result before the next command.'
      ],
      request: [
        'Remove the ignored test account.',
        'Change pending to ready on every row.',
        'Sort the complete file and remove duplicate rows.',
        'Use block Visual insert to add verified, at the start of every remaining row.'
      ],
      transfer: [
        'Recall the substitution with command history before you sort.',
        'Undo every bulk step, then redo each step to recover the final file.'
      ],
      outcome: ['verified,ready,acct_1', 'verified,ready,acct_2', 'verified,ready,acct_3'],
      reject: ['pending,', 'ignore,', 'ready,acct_1\nready,acct_1'],
      hints: [
        'Remove the known test row. Normalize values before sorting and deduplicating.',
        'Use :g to delete the test row, a whole-file substitution, :sort u, and block Visual insert.',
        'Run :g/^ignore/d, :%s/^pending/ready/, and :sort u. Use gg, Ctrl-V, G, I, type verified,, then Escape.'
      ],
      golf: [':g, :%s, :sort u, then block I', 'Keep deletion, normalization, ordering, and annotation as separate recovery steps.']
    },
    {
      id: 'macros',
      title: 'Automate a stable edit',
      purpose: 'Record one correct route change and replay it on matching lines.',
      file: '08-routes.txt',
      worked: [
        'Start recording with qq. Change v1 to v2 and deprecated to active.',
        'Stop recording only after the cursor is ready for the next line.'
      ],
      request: [
        'Record the first complete change in register q.',
        'Replay it on the remaining two routes.'
      ],
      transfer: [
        'Inspect all three lines before accepting the result.'
      ],
      outcome: ['GET /v2/users active', 'GET /v2/orders active', 'GET /v2/reports active'],
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
      file: 'postmortem.md',
      worked: [
        ':jumps shows the file route.',
        'Ctrl-O and Ctrl-I traverse older and newer source locations.',
        'g; and g, revisit edits within the current file.'
      ],
      request: [
        'Ctrl-O returns to the report. Briefs do not enter jump history.',
        'Use :jumps, then jump and change history, to revisit the report sources.',
        'Replace Verified sources with the five files that support the conclusion.'
      ],
      transfer: ['Do not list postmortem.md as its own evidence source.'],
      outcome: ['Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'],
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
        'Start with one safe edit. Finish with an independent multi-file project.',
        '',
        'Each lesson has four parts:',
        '1. Read one complete worked example.',
        '2. Make a guided edit in a real file.',
        '3. Transfer the skill without an exact command prompt.',
        '4. Check the visible file and revisit the skill later.',
        '',
        'Commands:',
        '  :teacher next       open the next required lesson',
        '  :teacher check      show the first unmet file result',
        '  :teacher hint       advance through three hint levels',
        '  :teacher map        show course progress',
        '  :teacher lesson N   open a selected lesson',
        '  :teacher review     open the oldest due review',
        '  :teacher project    open the applied project',
        '  :teacher score      show private session progress',
        '  :teacher golf       compare a shorter route after success',
        '  :teacher export     download progress without files or key history',
        '  :teacher reset      clear teacher-owned progress after confirmation',
        '  Ctrl-O              return from a guide to the work file',
        '',
        'Progress stays in this browser. Incomplete lesson text resets after reload.',
        'Type :teacher next to begin Lesson 1.'
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
      'Alert: the dashboard reported 14,203 production records before the',
      'production collector was deployed.',
      '',
      'Answer three questions:',
      '1. What happened, and which event proves it?',
      '2. Why did the dashboard believe the count?',
      '3. What must change before anyone publishes the result?',
      '',
      'Your six work files:',
      '  incident.log     incident response and repeated records',
      '  events.csv       source comparison and evidence capture',
      '  config.js        software source repair',
      '  launch-copy.md   evidence-backed copywriting',
      '  runbook.md       executable operations guidance',
      '  postmortem.md    final synthesis and source verification',
      '',
      'Commands:',
      '  :teacher next    open the first or next ready mission',
      '  :teacher check   name the first unmet visible result',
      '  :teacher hint    advance through three hint levels',
      '  :teacher score   session summary',
      '  :teacher golf    shorter route after success',
      '  :teacher export  download progress without work files',
      '  :teacher reset   confirm and restore these six files only',
      '  :teacher         recall the current brief',
      '  Ctrl-O           return from a brief to your work',
      '',
      'These files live only in this session unless you explicitly write a copy.',
      'Type :teacher next to start.'
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
