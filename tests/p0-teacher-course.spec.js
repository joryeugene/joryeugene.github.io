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
