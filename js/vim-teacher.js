(function() {
  'use strict';

  var files = {
    'incident.log': [
      '2026-08-14T02:11:04Z INFO deploy sensor=roof-array status=scheduled',
      '2026-08-14T02:11:09Z EVENT id=evt_014203 sensor=desk_lamp landings=14203',
      '2026-08-14T02:12:00Z INFO deploy sensor=roof-array status=online',
      '2026-08-14T02:14:17Z WARN id=evt_014204 sensor=desk_lamp status : duplicated',
      '2026-08-14T02:14:18Z WARN id=evt_014205 sensor=desk_lamp status : duplicated',
      '2026-08-14T02:14:19Z WARN id=evt_014206 sensor=desk_lamp status : duplicated',
      '',
      'ANALYST_NOTE: replace me'
    ],
    'events.csv': [
      'event_id,sensor,observed_at,landings,deployed_at',
      'evt_014201,roof_array,2026-08-14T02:13:01Z,12,2026-08-14T02:12:00Z',
      'evt_014202,roof_array,2026-08-14T02:13:14Z,18,2026-08-14T02:12:00Z',
      'evt_014203,desk_lamp,2026-08-14T02:11:09Z,14203,2026-08-14T02:12:00Z',
      'evt_014204,desk_lamp,2026-08-14T02:14:17Z,14,2026-08-14T02:12:00Z',
      '',
      '# candidate_id',
      'evt_014203',
      '# candidate_sensor',
      'desk_lamp',
      '# evidence_id',
      'TODO',
      '# evidence_sensor',
      'TODO'
    ],
    'config.js': [
      'export const sensor = {',
      '  source: "desk-lamp",',
      '  deployedAt: "2026-08-14T02:12:00Z",',
      '  landingLimit: 200',
      '};',
      '',
      'export const labels = {',
      '  product: "Phalene Analytics",',
      '  channel: "moonlight"',
      '};',
      '',
      '// CHANGE_NOTE: replace me'
    ],
    'launch-copy.md': [
      '# Phalene Analytics',
      '',
      'We counted every moth in the moon before breakfast.',
      '',
      'The dashboard recorded 14,203 verified roof-array landings during launch.',
      '',
      'Qualified note: Counts are preliminary until sensor-source review is complete.',
      '',
      'Metric key: REVIEWED_ROOF_ARRAY_EVENTS',
      '',
      'Approved copy: replace me'
    ],
    'runbook.md': [
      '# Moth Count Incident Runbook',
      '1. Reboot the moon.',
      '2. Ask the nearest moth whether the dashboard feels correct.',
      '3. If counts remain weird, add more adjectives to launch copy.',
      'Operator action: replace me'
    ],
    'postmortem.md': [
      '# Phalene Analytics Incident Postmortem',
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

  var missions = [
    {
      title: 'Establish the timeline',
      file: 'incident.log',
      request: [
        'Find landings=14203 and compare its timestamp with status=online.',
        'Replace ANALYST_NOTE with the event ID, count, and timing conclusion.'
      ],
      outcome: ['ANALYST_NOTE: evt_014203 recorded 14203 landings before roof-array was online'],
      hint: 'Search /landings=14203, retrace with Ctrl-O and Ctrl-I, then use G and cil on ANALYST_NOTE.',
      expect: ['ANALYST_NOTE: evt_014203 recorded 14203 landings before roof-array was online'],
      reject: ['ANALYST_NOTE: replace me'],
      golf: ['Gcil', 'Use this after the timeline is understood to change the final note directly.']
    },
    {
      title: 'Compare the data',
      file: 'events.csv',
      request: [
        'Compare 14,203 with the ordinary counts of 12, 18, and 14.',
        'Yank the candidate ID into register a and the sensor into register b.',
        'Replace both TODO lines by putting those named registers.'
      ],
      outcome: ['# evidence_id', 'evt_014203', '# evidence_sensor', 'desk_lamp'],
      hint: 'Search candidate_id, move to its next line, and use "ayiw. Delete the evidence TODO and put with "ap. Repeat with b.',
      expect: ['# evidence_id\nevt_014203', '# evidence_sensor\ndesk_lamp'],
      reject: ['# evidence_id\nTODO', '# evidence_sensor\nTODO'],
      golf: [':registers a b', 'Inspect evidence before putting it.']
    },
    {
      title: 'Repair the source',
      file: 'config.js',
      request: [
        'Change only the quoted source from desk-lamp to roof-array.',
        'Replace CHANGE_NOTE, move away, then revisit the edits with the changelist.'
      ],
      outcome: ['  source: "roof-array",', '// CHANGE_NOTE: source corrected to roof-array'],
      hint: 'Search /desk-lamp and use ci". Use cil on CHANGE_NOTE, then try g;, g,, and `..',
      expect: ['source: "roof-array"', '// CHANGE_NOTE: source corrected to roof-array'],
      reject: ['source: "desk-lamp"', '// CHANGE_NOTE: replace me'],
      golf: ['`.', 'Jump to the latest edit.']
    },
    {
      title: 'Normalize the records',
      file: 'incident.log',
      request: [
        'Change all three malformed status fragments to status=duplicate.',
        'Fix one manually. Reuse the change with dot and a recorded macro.'
      ],
      outcome: [
        'id=evt_014204 sensor=desk_lamp status=duplicate',
        'id=evt_014205 sensor=desk_lamp status=duplicate',
        'id=evt_014206 sensor=desk_lamp status=duplicate'
      ],
      hint: 'Search /status : duplicated, use c$ once, then n. Record .n in qz and replay @z on the final record.',
      expect: [
        'id=evt_014204 sensor=desk_lamp status=duplicate',
        'id=evt_014205 sensor=desk_lamp status=duplicate',
        'id=evt_014206 sensor=desk_lamp status=duplicate'
      ],
      reject: ['status : duplicated'],
      golf: [':%s/status : duplicated/status=duplicate/g', 'Fix identical text once.']
    },
    {
      title: 'Correct the launch story',
      file: 'launch-copy.md',
      request: [
        'Replace both unsupported claims with the reviewed evidence.',
        'Write the approved sentence and complete REVIEWED_ from this document.'
      ],
      outcome: [
        'Claim review: Desk-lamp counts before deployment were excluded.',
        'Evidence note: 14,203 was a pre-deployment desk-lamp event, not verified launch activity.',
        'Approved copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.'
      ],
      hint: 'Use cil on each claim. On Approved copy, type through REVIEWED_, press Insert Ctrl-N, then finish the sentence.',
      expect: [
        'Claim review: Desk-lamp counts before deployment were excluded.',
        'Evidence note: 14,203 was a pre-deployment desk-lamp event, not verified launch activity.',
        'Approved copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.'
      ],
      reject: [
        'We counted every moth in the moon before breakfast.',
        'The dashboard recorded 14,203 verified roof-array landings during launch.'
      ],
      golf: ['REVIEWED_<C-N>', 'Complete the key instead of retyping it.']
    },
    {
      title: 'Fix operations',
      file: 'runbook.md',
      request: [
        'Replace the three guesses with checks another operator can perform.',
        'Use cc for each complete instruction line.',
        'Write one exact operator action that protects publication.'
      ],
      outcome: [
        '1. Confirm the active sensor source in config.js.',
        '2. Compare event time with deployedAt.',
        '3. Quarantine pre-deployment events and notify on-call.',
        'Operator action: Verify sensor source, deployment time, and event timestamp before publishing counts.'
      ],
      hint: 'Use j and cc. cc changes one whole line and preserves its neighbors.',
      expect: [
        '1. Confirm the active sensor source in config.js.',
        '2. Compare event time with deployedAt.',
        '3. Quarantine pre-deployment events and notify on-call.',
        'Operator action: Verify sensor source, deployment time, and event timestamp before publishing counts.'
      ],
      reject: ['Reboot the moon.', 'Ask the nearest moth', 'add more adjectives'],
      golf: ['cc', 'Change the whole instruction line.']
    },
    {
      title: 'Write the postmortem',
      file: 'postmortem.md',
      request: [
        'Replace the first seven TODO fields with the evidence and repairs.',
        'Paste desk_lamp from register b into Root cause.',
        'Use f_ and r- so the CSV value reads desk-lamp in prose.',
        'Keep every claim traceable to a file you edited.'
      ],
      outcome: [
        'Impact: Dashboard displayed 14,203 impossible pre-deployment landings.',
        'Evidence: evt_014203 occurred before the roof-array was online.',
        'Root cause: The active source was desk-lamp instead of roof-array.',
        'Repair: Config now uses roof-array and excludes pre-deployment events.',
        'Launch copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.',
        'Runbook: Verify sensor source, deployment time, and event timestamp before publishing counts.',
        'Follow-up: Add a deployment-time validation gate before ingest.'
      ],
      hint: 'Use cil. Put b with "bp, then use f_, r-, and yal.',
      expect: [
        'Impact: Dashboard displayed 14,203 impossible pre-deployment landings.',
        'Evidence: evt_014203 occurred before the roof-array was online.',
        'Root cause: The active source was desk-lamp instead of roof-array.',
        'Repair: Config now uses roof-array and excludes pre-deployment events.',
        'Launch copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.',
        'Runbook: Verify sensor source, deployment time, and event timestamp before publishing counts.',
        'Follow-up: Add a deployment-time validation gate before ingest.'
      ],
      reject: ['Impact: TODO', 'Evidence: TODO', 'Root cause: TODO', 'Repair: TODO', 'Launch copy: TODO', 'Runbook: TODO', 'Follow-up: TODO'],
      golf: ['"bp then f_r-', 'Reuse and normalize the sensor.']
    },
    {
      title: 'Retrace the work',
      file: 'postmortem.md',
      request: [
        'Ctrl-O returns to the report. Briefs do not enter jump history.',
        'Use :jumps, then jump and change history, to revisit the report sources.',
        'Replace Verified sources with the five files that support the conclusion.'
      ],
      outcome: ['Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'],
      hint: 'Use :jumps, u, Ctrl-O, Ctrl-I, g;, and g,. Finish with cil.',
      expect: ['Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'],
      reject: ['Verified sources: TODO'],
      golf: [':jumps', 'Inspect the source route.']
    }
  ];

  window.VIM_TEACHER = {
    intro: [
      'PHALENE ANALYTICS // FIELD LAB',
      '',
      'Role: on-call analyst and reluctant launch-copy editor.',
      '',
      'Alert: the dashboard counted 14,203 moth landings before the sensor',
      'was deployed. The moon has declined to join the incident bridge.',
      '',
      'Answer three questions:',
      '1. What happened, and which event proves it?',
      '2. Why did the dashboard believe the count?',
      '3. What must change before anyone publishes the result?',
      '',
      'Your six work files:',
      '  incident.log     incident response and repeated records',
      '  events.csv       data comparison and evidence capture',
      '  config.js        software source repair',
      '  launch-copy.md   evidence-backed copywriting',
      '  runbook.md       executable operations guidance',
      '  postmortem.md    final synthesis and source verification',
      '',
      'Commands:',
      '  :teacher next    open the first or next ready mission',
      '  :teacher check   name the first unmet visible result',
      '  :teacher hint    show one command hint without editing',
      '  :teacher score   session flight log',
      '  :teacher golf    shorter route after success',
      '  :teacher reset   confirm and restore these six files only',
      '  :teacher         recall the current brief',
      '  Ctrl-O           return from a brief to your work',
      '',
      'First applied pass: 20 to 30 minutes.',
      'With Vim muscle memory: under 10 minutes.',
      '',
      'These files live only in this session unless you explicitly write a copy.',
      'Type :teacher next to start.'
    ],
    done: [
      'PHALENE ANALYTICS // PROJECT COMPLETE',
      '',
      'You traced the impossible count to a desk-lamp source, repaired the',
      'configuration, removed unsupported copy, replaced the moon reboot',
      'runbook, and finished a source-backed postmortem.',
      '',
      'The final deliverable is in postmortem.md.',
      'Press Ctrl-O to return to it.',
      '',
      'What you practiced:',
      '  jump and change history across real files',
      '  named registers, dot-repeat, and macros',
      '  current-buffer completion and text objects',
      '  incident response, data analysis, software repair, copy, and operations',
      '',
      'The dashboard can publish again. The moth declined comment.'
    ],
    files: files,
    missions: missions
  };
})();
