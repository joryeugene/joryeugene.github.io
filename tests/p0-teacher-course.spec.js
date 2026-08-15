import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function courseText(page) {
  return (await lines(page)).join('\n');
}

test('teacher starts at zero and completes the safe editing lesson', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  expect((await state(page)).file).toBe('[Teacher]');
  expect(await courseText(page)).toContain('VIM TEACHER // COURSE');
  expect(await courseText(page)).toContain('Start with one safe edit');

  await cmd(page, 'teacher next');
  expect((await state(page)).file).toBe('[Teacher]');
  expect(await courseText(page)).toContain('LESSON 1 OF 8');
  expect(await courseText(page)).toContain('WORKED EXAMPLE');
  expect(await courseText(page)).toContain('INDEPENDENT TRANSFER');

  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('01-handoff.txt');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'owner: TOD0',
    'recovery: readyy',
    'keep: audit enabled'
  ]);

  await cmd(page, 'teacher hint');
  expect(await courseText(page)).toContain('HINT 1 OF 3');
  expect(await courseText(page)).not.toContain('$at<Esc>');
  await press(page, 'Control+o');

  await cmd(page, 'teacher hint');
  expect(await courseText(page)).toContain('HINT 2 OF 3');
  expect(await courseText(page)).toContain('Normal mode');
  await press(page, 'Control+o');

  await cmd(page, 'teacher hint');
  expect(await courseText(page)).toContain('HINT 3 OF 3');
  expect(await courseText(page)).toContain('$at<Esc>');
  await press(page, 'Control+o');

  await press(page, 'j');
  await press(page, '$');
  await press(page, 'a');
  await type(page, 't');
  await press(page, 'Escape');

  await press(page, 'j');
  await press(page, '0');
  await press(page, '7');
  await press(page, 'l');
  await press(page, '4');
  await press(page, 'x');
  await press(page, 'a');
  await type(page, 'team');
  await press(page, 'Escape');

  await press(page, 'j');
  await press(page, '$');
  await press(page, 'x');
  await press(page, 'u');
  await press(page, 'Control+r');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draft',
    'owner: team',
    'recovery: ready',
    'keep: audit enabled'
  ]);
  await cmd(page, 'w');

  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 1 ready');

  await cmd(page, 'teacher next');
  expect((await state(page)).file).toBe('[Teacher]');
  expect(await courseText(page)).toContain('LESSON 2 OF 8');
});

test('teacher composes operators, motions, text objects, and counts in code', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 2');
  expect(await courseText(page)).toContain('LESSON 2 OF 8');
  expect(await courseText(page)).toContain('operator');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('02-service.js');

  for (const key of ['f', '"', 'c', 'i', '"']) await press(page, key);
  await type(page, 'production');
  await press(page, 'Escape');

  for (const key of ['0', '3', 'j', 'f', '(', '%', '%', 'f', '2', 'c', 'i', 'w']) await press(page, key);
  await type(page, '4');
  await press(page, 'Escape');

  for (const key of ['k', '0', 'f', '"', 'c', 'i', '"']) await press(page, key);
  await type(page, 'ready');
  await press(page, 'Escape');
  await press(page, 'k');
  await press(page, 'd');
  await press(page, 'd');

  expect(await lines(page)).toEqual([
    'export const environment = "production";',
    'export const title = "ready";',
    'export const retries = retryPolicy(4);'
  ]);

  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 2 ready');
});

test('teacher investigates a log with search, marks, jumps, and change history', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 3');
  expect(await courseText(page)).toContain('LESSON 3 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('03-requests.log');

  await press(page, '/');
  await type(page, 'req_42');
  await press(page, 'Enter');
  expect((await state(page)).pos).toMatch(/^2,/);
  await press(page, 'm');
  await press(page, 'a');

  await press(page, 'n');
  expect((await state(page)).pos).toMatch(/^4,/);
  await press(page, 'N');
  expect((await state(page)).pos).toMatch(/^2,/);
  await press(page, '*');
  expect((await state(page)).pos).toMatch(/^4,/);

  await press(page, 'G');
  for (const key of ['c', 'i', 'l']) await press(page, key);
  await type(page, 'SUMMARY: req_42 had a 910 ms warning before timeout');
  await press(page, 'Escape');
  await press(page, 'k');
  for (const key of ['c', 'i', 'l']) await press(page, key);
  await type(page, 'ANALYSIS: warning preceded timeout');
  await press(page, 'Escape');

  await press(page, 'g');
  await press(page, 'g');
  await press(page, '0');
  await press(page, 'g');
  await press(page, ';');
  expect((await state(page)).pos).toMatch(/^6,/);
  await press(page, 'g');
  await press(page, ';');
  expect((await state(page)).pos).toMatch(/^7,/);
  await press(page, 'g');
  await press(page, ',');
  expect((await state(page)).pos).toMatch(/^6,/);

  await press(page, '`');
  await press(page, 'a');
  expect((await state(page)).pos).toMatch(/^2,/);
  await press(page, 'Control+o');
  expect((await state(page)).pos).toMatch(/^6,/);
  await press(page, 'Control+i');
  expect((await state(page)).pos).toMatch(/^2,/);

  expect(await lines(page)).toContain('ANALYSIS: warning preceded timeout');
  expect(await lines(page)).toContain('SUMMARY: req_42 had a 910 ms warning before timeout');
  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 3 ready');
});

test('teacher repeats one verified change and recovers it as one action', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 4');
  expect(await courseText(page)).toContain('LESSON 4 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('04-status.txt');

  await press(page, '/');
  await type(page, ' : pending');
  await press(page, 'Enter');
  await press(page, 'c');
  await press(page, '$');
  await type(page, '=ready');
  await press(page, 'Escape');
  await press(page, 'n');
  await press(page, '.');
  await press(page, 'n');
  await press(page, '.');

  const normalized = [
    'api=ready',
    'worker=ready',
    'web=ready',
    'keep = enabled'
  ];
  expect(await lines(page)).toEqual(normalized);
  await press(page, 'u');
  expect(await lines(page)).toContain('web : pending');
  await press(page, 'Control+r');
  expect(await lines(page)).toEqual(normalized);

  await press(page, '/');
  await press(page, 'ArrowUp');
  await expect(page.locator('#vim-cmdline')).toHaveText('/ : pending');
  await press(page, 'Enter');
  expect(await lines(page)).toEqual(normalized);

  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 4 ready');
  await cmd(page, 'teacher golf');
  expect(await courseText(page)).toContain('VIM GOLF AFTER THE RESULT');
  expect(await courseText(page)).toContain(':%s/ : pending/=ready/g');
});

test('teacher carries exact evidence with named registers and completion', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 5');
  expect(await courseText(page)).toContain('LESSON 5 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('05-evidence.md');

  for (const key of ['2', 'j', '0', '"', 'a', 'y', 'i', 'w']) await press(page, key);
  for (const key of ['2', 'j', '0', '"', 'b', 'y', 'i', 'w']) await press(page, key);
  await cmd(page, 'registers a b');
  expect((await state(page)).file).toBe('[Registers]');
  expect(await courseText(page)).toContain('"a  char  req_42');
  expect(await courseText(page)).toContain('"b  char  platform');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('05-evidence.md');

  for (const key of ['2', 'j', '0', 'd', 'i', 'w', '"', 'a', 'p']) await press(page, key);
  for (const key of ['2', 'j', '0', 'd', 'i', 'w', '"', 'b', 'p']) await press(page, key);
  for (const key of ['4', 'j', 'A', 'Control+n', 'Escape']) await press(page, key);

  expect(await lines(page)).toContain('req_42');
  expect(await lines(page)).toContain('platform');
  expect(await lines(page)).toContain('REVIEWED_PRODUCTION_EVENTS');
  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 5 ready');
});

test('teacher inspects project files and returns to one working report', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 6');
  expect(await courseText(page)).toContain('LESSON 6 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('06-project.md');

  await cmd(page, 'Ex');
  expect((await state(page)).file).toBe('netrw');
  expect(await courseText(page)).toContain('06-api.js');
  expect(await courseText(page)).toContain('06-ui.js');
  for (let i = 0; i < 5; i++) await press(page, 'j');
  await press(page, 'Enter');
  expect((await state(page)).file).toBe('06-api.js');
  for (const key of ['f', '"', '"', 'a', 'y', 'i', '"']) await press(page, key);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('06-project.md');
  for (const key of ['j', '0', 'f', 'T', 'd', 'i', 'w', '"', 'a', 'p']) await press(page, key);

  await cmd(page, 'e 06-ui.js');
  expect((await state(page)).file).toBe('06-ui.js');
  for (const key of ['f', '"', '"', 'b', 'y', 'i', '"']) await press(page, key);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('06-project.md');
  await press(page, '/');
  await type(page, 'TODO');
  await press(page, 'Enter');
  for (const key of ['d', 'i', 'w', '"', 'b', 'p']) await press(page, key);
  await press(page, '/');
  await type(page, 'TODO');
  await press(page, 'Enter');
  for (const key of ['c', 'i', 'w']) await press(page, key);
  await type(page, '06-api.js, 06-ui.js');
  await press(page, 'Escape');

  expect(await lines(page)).toEqual([
    '# Project index',
    'API route: /v2/reports',
    'UI screen: review',
    'Sources: 06-api.js, 06-ui.js'
  ]);
  await cmd(page, 'jumps');
  expect((await state(page)).file).toBe('[Jumps]');
  expect(await courseText(page)).toContain('06-project.md');
  expect(await courseText(page)).toContain('06-ui.js');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('06-project.md');
  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 6 ready');
});

test('teacher makes reversible bulk changes to imported records', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 7');
  expect(await courseText(page)).toContain('LESSON 7 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('07-records.csv');
  const original = [
    'pending,acct_3',
    'ignore,test_account',
    'pending,acct_1',
    'pending,acct_1',
    'pending,acct_2'
  ];
  expect(await lines(page)).toEqual(original);

  await cmd(page, 'g/^ignore/d');
  await cmd(page, '%s/^pending/ready/');
  await press(page, ':');
  await press(page, 'ArrowUp');
  await expect(page.locator('#vim-cmdline')).toHaveText(':%s/^pending/ready/');
  await press(page, 'Escape');
  await cmd(page, 'sort u');
  for (const key of ['g', 'g', 'Control+v', 'G', 'I']) await press(page, key);
  await type(page, 'verified,');
  await press(page, 'Escape');

  const finalRecords = [
    'verified,ready,acct_1',
    'verified,ready,acct_2',
    'verified,ready,acct_3'
  ];
  expect(await lines(page)).toEqual(finalRecords);

  for (let i = 0; i < 4; i++) await press(page, 'u');
  expect(await lines(page)).toEqual(original);
  for (let i = 0; i < 4; i++) await press(page, 'Control+r');
  expect(await lines(page)).toEqual(finalRecords);

  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 7 ready');
});

test('teacher records one stable edit and replays it across matching routes', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 8');
  expect(await courseText(page)).toContain('LESSON 8 OF 8');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('08-routes.txt');

  await press(page, 'q');
  await press(page, 'q');
  for (const key of ['f', '1', 'r', '2', '$', 'b', 'c', 'i', 'w']) await press(page, key);
  await type(page, 'active');
  await press(page, 'Escape');
  await press(page, 'j');
  await press(page, '0');
  await press(page, 'q');
  await press(page, '@');
  await press(page, 'q');
  await press(page, '@');
  await press(page, '@');

  expect(await lines(page)).toEqual([
    'GET /v2/users active',
    'GET /v2/orders active',
    'GET /v2/reports active'
  ]);
  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 8 ready');
  await cmd(page, 'teacher golf');
  expect(await courseText(page)).toContain('Route: @q then Q');
  expect(await courseText(page)).toContain('follows Neovim');
  await press(page, 'Control+o');
  await cmd(page, 'teacher next');
  expect(await courseText(page)).toContain('LESSON 1 OF 8');
  await cmd(page, 'teacher map');
  expect(await courseText(page)).toContain('[ ] 1. Make one safe edit');
  expect(await courseText(page)).toContain('[x] 8. Automate a stable edit');
});

test('one fresh learner can finish the core course and applied project continuously', async ({ page }) => {
  test.setTimeout(120000);
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  const search = async pattern => {
    await press(page, '/');
    await type(page, pattern);
    await press(page, 'Enter');
  };
  const changeLine = async (pattern, replacement) => {
    await search(pattern);
    for (const key of ['c', 'i', 'l']) await press(page, key);
    await type(page, replacement);
    await press(page, 'Escape');
  };
  const changeFollowingLine = async (pattern, replacement) => {
    await search(pattern);
    await press(page, 'j');
    for (const key of ['c', 'i', 'l']) await press(page, key);
    await type(page, replacement);
    await press(page, 'Escape');
  };
  const openWork = async filename => {
    await press(page, 'Control+o');
    expect((await state(page)).file).toBe(filename);
  };

  await cmd(page, 'teacher');
  await cmd(page, 'teacher next');
  await openWork('01-handoff.txt');
  await changeLine('status:', 'status: draft');
  await changeLine('owner:', 'owner: team');
  await changeLine('recovery:', 'recovery: ready');

  await cmd(page, 'teacher next');
  await openWork('02-service.js');
  await changeLine('environment', 'export const environment = "production";');
  await search('obsolete');
  for (const key of ['d', 'd']) await press(page, key);
  await changeLine('title', 'export const title = "ready";');
  await changeLine('retries', 'export const retries = retryPolicy(4);');

  await cmd(page, 'teacher next');
  await openWork('03-requests.log');
  await changeLine('ANALYSIS:', 'ANALYSIS: warning preceded timeout');
  await changeLine('SUMMARY:', 'SUMMARY: req_42 had a 910 ms warning before timeout');

  await cmd(page, 'teacher next');
  await openWork('04-status.txt');
  await cmd(page, '%s/ : pending/=ready/g');

  await cmd(page, 'teacher next');
  await openWork('05-evidence.md');
  await changeFollowingLine('evidence_id', 'req_42');
  await changeFollowingLine('evidence_owner', 'platform');
  await changeFollowingLine('approved_metric', 'REVIEWED_PRODUCTION_EVENTS');

  await cmd(page, 'teacher next');
  await openWork('06-project.md');
  await changeLine('API route:', 'API route: /v2/reports');
  await changeLine('UI screen:', 'UI screen: review');
  await changeLine('Sources:', 'Sources: 06-api.js, 06-ui.js');

  await cmd(page, 'teacher next');
  await openWork('07-records.csv');
  await cmd(page, 'g/^ignore/d');
  await cmd(page, '%s/^pending/ready/');
  await cmd(page, 'sort u');
  for (const key of ['g', 'g', 'Control+v', 'G', 'I']) await press(page, key);
  await type(page, 'verified,');
  await press(page, 'Escape');

  await cmd(page, 'teacher next');
  await openWork('08-routes.txt');
  await cmd(page, '%s/v1/v2/g');
  await cmd(page, '%s/deprecated/active/g');
  await cmd(page, 'teacher next');
  expect(await courseText(page)).toContain('VIM TEACHER // CORE COURSE COMPLETE');
  await cmd(page, 'teacher map');
  for (let lesson = 1; lesson <= 8; lesson++) {
    expect(await courseText(page)).toContain(`[x] ${lesson}.`);
  }

  await cmd(page, 'teacher project');
  await cmd(page, 'teacher next');
  await openWork('incident.log');
  await changeLine('ANALYST_NOTE:', 'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online');

  await cmd(page, 'teacher next');
  await openWork('events.csv');
  await changeFollowingLine('# evidence_id', 'evt_014203');
  await changeFollowingLine('# evidence_source', 'demo_importer');

  await cmd(page, 'teacher next');
  await openWork('config.js');
  await changeLine('source:', 'source: "production-api",');
  await changeLine('CHANGE_NOTE:', '// CHANGE_NOTE: source corrected to production-api');

  await cmd(page, 'teacher next');
  await openWork('incident.log');
  await cmd(page, '%s/status : duplicated/status=duplicate/g');

  await cmd(page, 'teacher next');
  await openWork('launch-copy.md');
  await changeLine('Every imported', 'Claim review: The 14,203 demo-importer records are not production activity.');
  await changeLine('The dashboard recorded', 'Evidence note: evt_014203 occurred before production-api was online.');
  await changeLine('Approved copy:', 'Approved copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.');

  await cmd(page, 'teacher next');
  await openWork('runbook.md');
  await changeLine('1.', '1. Confirm the active event source in config.js.');
  await changeLine('2.', '2. Compare event time with deployedAt.');
  await changeLine('3.', '3. Quarantine pre-deployment events and notify on-call.');
  await changeLine('Operator action:', 'Operator action: Verify event source, deployment time, and event timestamp before publishing counts.');

  await cmd(page, 'teacher next');
  await openWork('postmortem.md');
  await changeLine('Impact:', 'Impact: Dashboard displayed 14,203 unverified pre-deployment records.');
  await changeLine('Evidence:', 'Evidence: evt_014203 occurred before production-api was online.');
  await changeLine('Root cause:', 'Root cause: The active source was demo-importer instead of production-api.');
  await changeLine('Repair:', 'Repair: Config now uses production-api.');
  await changeLine('Launch copy:', 'Launch copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.');
  await changeLine('Runbook:', 'Runbook: Verify event source, deployment time, and event timestamp before publishing counts.');
  await changeLine('Follow-up:', 'Follow-up: Add a deployment-time validation gate before ingest.');

  await cmd(page, 'teacher next');
  await openWork('postmortem.md');
  await changeLine('Verified sources:', 'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'teacher next');
  expect(await courseText(page)).toContain('APPLIED VIM PROJECT // COMPLETE');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('postmortem.md');
  expect(await lines(page)).toContain('Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'teacher map');
  expect(await courseText(page)).toContain('Applied project: 8/8 missions complete');
});
