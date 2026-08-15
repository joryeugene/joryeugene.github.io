import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function courseText(page) {
  return (await lines(page)).join('\n');
}

test('teacher guides a first learner through open, edit, save, and automatic advance', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('teacher_first_journey_initialized')) return;
    localStorage.removeItem('vim_teacher_progress_v2');
    sessionStorage.setItem('teacher_first_journey_initialized', '1');
  });
  await open(page);

  await cmd(page, 'teacher');
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText('TARGET  status: draf');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');

  await page.locator('#vim-content').click();
  expect(await page.evaluate(() => document.activeElement.id)).toBe('vim-mobile-input');
  await page.keyboard.type(':x');
  await expect(page.locator('#vim-teacher-next')).toContainText('Press Esc to cancel');
  await page.keyboard.press('Escape');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');

  await page.keyboard.type(':');
  await expect(page.locator('#vim-teacher-next')).toContainText('Type e 01-handoff.txt');
  await page.keyboard.type('e 01-handoff.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('Press Enter to run :e 01-handoff.txt');
  await page.keyboard.press('Enter');
  expect((await state(page)).file).toBe('01-handoff.txt');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'keep: audit enabled'
  ]);
  await expect(page.locator('.vim-teacher-target')).toContainText('status: draf');
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');

  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press A');
  await press(page, 'A');
  await expect(page.locator('#vim-teacher-next')).toContainText('type t');
  await type(page, 't');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Esc');
  await press(page, 'Escape');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draft',
    'keep: audit enabled'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');

  await cmd(page, 'w');
  expect((await state(page)).file).toBe('01-handoff.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 COMPLETE');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');

  await page.reload();
  await cmd(page, 'teacher');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 2 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');
});

test('teacher restores a mistaken first lesson without requiring undo', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 1');
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 'x');
  await press(page, 'Escape');
  expect((await lines(page))[1]).toBe('status: drafx');

  await cmd(page, 'w');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson not complete.');
  await expect(page.locator('#vim-teacher-next')).toContainText('Missing: status: draft');
  await expect(page.locator('#vim-teacher-next')).toContainText(':teacher retry');

  await cmd(page, 'teacher retry');
  expect((await state(page)).file).toBe('01-handoff.txt');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'keep: audit enabled'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');

  await press(page, 'j');
  await press(page, 'A');
  await type(page, 't');
  await press(page, 'Escape');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 COMPLETE');
});

test('applied project keeps the answer hidden and shows one file-opening action', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher project');
  await expect(page.locator('#vim-teacher-next')).toContainText('MISSION 1 OF 8');
  await expect(page.locator('#vim-teacher-next')).not.toContainText('ANALYST_NOTE: evt_014203');
  await expect(page.locator('#vim-teacher-next')).toContainText('incident.log');

  await cmd(page, 'e incident.log');
  await press(page, 'G');
  await press(page, 'c');
  await press(page, 'c');
  await type(page, 'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online');
  await press(page, 'Escape');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · MISSION 1 COMPLETE');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e events.csv');
});

test('teacher guides one correction through undo, redo, and save', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'teacher lesson 2');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 2 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText('status: draftt');
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson 2 ready. Follow the Teacher panel.');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');

  await cmd(page, 'e 02-recovery.txt');
  expect(await lines(page)).toEqual([
    '# Deployment note',
    'status: draftt',
    'keep: rollback ready'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');

  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press $');
  await press(page, '$');
  await expect(page.locator('#vim-teacher-next')).toContainText('press x');
  await press(page, 'x');
  expect((await lines(page))[1]).toBe('status: draft');
  await expect(page.locator('#vim-teacher-next')).toContainText('press u');

  await press(page, 'u');
  expect((await lines(page))[1]).toBe('status: draftt');
  await expect(page.locator('#vim-teacher-next')).toContainText('Ctrl-R redoes the correction');
  await press(page, 'Control+r');
  expect((await lines(page))[1]).toBe('status: draft');
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');

  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 2 COMPLETE');
});

test('teacher builds one word change and one line deletion a key at a time', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 3');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 3 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 03-release-note.txt');

  await cmd(page, 'e 03-release-note.txt');
  expect(await lines(page)).toEqual([
    'draft: release notes',
    'REMOVE: temporary placeholder',
    'keep: audit link'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText('press c');

  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('press w');
  await press(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('type ready');
  await type(page, 'ready');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Esc');
  await press(page, 'Escape');
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');
  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press d');
  await press(page, 'd');
  await expect(page.locator('#vim-teacher-next')).toContainText('press d again');
  await press(page, 'd');

  expect(await lines(page)).toEqual([
    'ready: release notes',
    'keep: audit link'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 3 COMPLETE');
});

test('teacher finds two related log lines and writes one supported finding', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 4');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 4 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 04-requests.log');

  await cmd(page, 'e 04-requests.log');
  await expect(page.locator('#vim-teacher-next')).toContainText('press /');

  await press(page, '/');
  await expect(page.locator('#vim-teacher-next')).toContainText('type req_42');
  await type(page, 'req_42');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Enter');
  await press(page, 'Enter');
  expect((await state(page)).pos).toMatch(/^2,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press n');

  await press(page, 'n');
  expect((await state(page)).pos).toMatch(/^4,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press G');

  await press(page, 'G');
  expect((await state(page)).pos).toMatch(/^5,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press c');
  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('press c again');
  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('type finding: warning before timeout');
  await type(page, 'finding: warning before timeout');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Esc');
  await press(page, 'Escape');

  expect(await lines(page)).toContain('finding: warning before timeout');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 4 COMPLETE');
});

test('teacher repeats one verified change on the next two matches', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 5');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 5 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 05-status.txt');
  await cmd(page, 'e 05-status.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('press /');

  await press(page, '/');
  await expect(page.locator('#vim-teacher-next')).toContainText('search text " : pending"');
  await type(page, ' : pending');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Enter');
  await press(page, 'Enter');
  await expect(page.locator('#vim-teacher-next')).toContainText('press c');
  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('press $');
  await press(page, '$');
  await expect(page.locator('#vim-teacher-next')).toContainText('type =ready');
  await type(page, '=ready');
  await press(page, 'Escape');
  await expect(page.locator('#vim-teacher-next')).toContainText('press n');
  await press(page, 'n');
  await expect(page.locator('#vim-teacher-next')).toContainText('press the . key');
  await press(page, '.');
  await expect(page.locator('#vim-teacher-next')).toContainText('press n');
  await press(page, 'n');
  await expect(page.locator('#vim-teacher-next')).toContainText('press the . key');
  await press(page, '.');

  const normalized = [
    'api=ready',
    'worker=ready',
    'web=ready',
    'keep = enabled'
  ];
  expect(await lines(page)).toEqual(normalized);
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 5 COMPLETE');
});

test('teacher yanks one exact word and puts it into an evidence field', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 6');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 6 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 06-evidence.txt');
  await cmd(page, 'teacher hint');
  await expect(page.locator('#vim-teacher-next')).toContainText(
    'Ctrl-R 0 inserts the most recent yank into a : or / prompt.'
  );
  await cmd(page, 'e 06-evidence.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('press w');
  await press(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('press v');
  await press(page, 'v');
  await expect(page.locator('#vim-teacher-next')).toContainText('press i');
  await press(page, 'i');
  await expect(page.locator('#vim-teacher-next')).toContainText('press w again');
  await press(page, 'w');
  expect((await state(page)).mode).toBe('--VISUAL--');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');
  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press p');
  await press(page, 'p');

  expect(await lines(page)).toEqual([
    'source req_42',
    'evidence req_42',
    'keep reviewed'
  ]);
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 6 COMPLETE');
});

test('teacher opens a source with Ex and returns to the report buffer', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 7');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 7 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 07-project.md');
  await cmd(page, 'e 07-project.md');
  await expect(page.locator('#vim-teacher-next')).toContainText(':Ex');

  await cmd(page, 'Ex');
  expect((await state(page)).file).toBe('netrw');
  expect(await courseText(page)).toContain('07-api.js');
  await expect(page.locator('#vim-teacher-next')).toContainText('press /');
  await press(page, '/');
  await expect(page.locator('#vim-teacher-next')).toContainText('type 07-api.js');
  await type(page, '07-api.js');
  await press(page, 'Enter');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Enter to open');
  await press(page, 'Enter');
  expect((await state(page)).file).toBe('07-api.js');
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');
  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y again');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText(':buffer 07-project.md');

  await cmd(page, 'buffer 07-project.md');
  expect((await state(page)).file).toBe('07-project.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('press p');
  await press(page, 'p');

  expect(await lines(page)).toEqual([
    '# Project index',
    '/v2/reports',
    'keep: reviewed'
  ]);
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 7 COMPLETE');
});

test('teacher keeps source evidence visible while updating a report', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 8');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 8 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 08-report.md');

  await cmd(page, 'e 08-report.md');
  await expect(page.locator('#vim-teacher-next')).toContainText(':vsplit 08-source.log');
  await cmd(page, 'vsplit 08-source.log');
  expect((await state(page)).file).toBe('08-source.log');
  await expect(page.locator('#vim-split-peer')).toBeVisible();
  await expect(page.locator('#vim-split-peer-file')).toContainText('08-report.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y');

  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y again');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText('hold Ctrl and press w');
  await press(page, 'Control+w');
  await expect(page.locator('#vim-teacher-next')).toContainText('press w again');
  await press(page, 'w');
  expect((await state(page)).file).toBe('08-report.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('press p');

  await press(page, 'p');
  expect(await lines(page)).toEqual([
    '# Comparison',
    'warning before timeout',
    'keep: source visible'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText(':only');
  await cmd(page, 'only');
  await expect(page.locator('#vim-split-peer')).toBeHidden();
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 8 COMPLETE');
});

test('teacher preserves a review layout while visiting a separate tab page', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 9');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 9 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 09-review.md');
  await cmd(page, 'e 09-review.md');
  await expect(page.locator('#vim-teacher-next')).toContainText(':vsplit 09-change.diff');
  await cmd(page, 'vsplit 09-change.diff');
  await expect(page.locator('#vim-teacher-next')).toContainText(':tabedit 09-tests.log');

  await cmd(page, 'tabedit 09-tests.log');
  expect((await state(page)).file).toBe('09-tests.log');
  await expect(page.locator('#vim-tabbar')).toBeVisible();
  await expect(page.locator('#vim-teacher-next')).toContainText('press g');
  await press(page, 'g');
  await expect(page.locator('#vim-teacher-next')).toContainText('press t');
  await press(page, 't');
  expect((await state(page)).file).toBe('09-change.diff');
  await expect(page.locator('#vim-split-peer-file')).toContainText('09-review.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('press g');
  await press(page, 'g');
  await expect(page.locator('#vim-teacher-next')).toContainText('press t');
  await press(page, 't');
  expect((await state(page)).file).toBe('09-tests.log');

  await expect(page.locator('#vim-teacher-next')).toContainText('press y');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText('press y again');
  await press(page, 'y');
  await expect(page.locator('#vim-teacher-next')).toContainText(':tabclose');
  await cmd(page, 'tabclose');
  expect((await state(page)).file).toBe('09-change.diff');
  await expect(page.locator('#vim-tabbar')).toBeHidden();
  await expect(page.locator('#vim-split-peer-file')).toContainText('09-review.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('hold Ctrl and press w');

  await press(page, 'Control+w');
  await expect(page.locator('#vim-teacher-next')).toContainText('press w again');
  await press(page, 'w');
  expect((await state(page)).file).toBe('09-review.md');
  await expect(page.locator('#vim-teacher-next')).toContainText('press p');
  await press(page, 'p');
  expect(await lines(page)).toEqual([
    '# Retry review',
    'test: retries stay bounded',
    'keep: compare change and test'
  ]);
  await cmd(page, 'only');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 9 COMPLETE');
});

test('teacher retraces meaningful jumps and the latest change', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 10');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 10 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 10-trace.log');
  await cmd(page, 'e 10-trace.log');
  await expect(page.locator('#vim-teacher-next')).toContainText('press /');

  await press(page, '/');
  await expect(page.locator('#vim-teacher-next')).toContainText('type timeout');
  await type(page, 'timeout');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Enter');
  await press(page, 'Enter');
  expect((await state(page)).pos).toMatch(/^2,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press G');
  await press(page, 'G');
  expect((await state(page)).pos).toMatch(/^4,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('Ctrl-O');

  await press(page, 'Control+o');
  expect((await state(page)).pos).toMatch(/^2,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('Ctrl-I');
  await press(page, 'Control+i');
  expect((await state(page)).pos).toMatch(/^4,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press c');
  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('press c again');
  await press(page, 'c');
  await expect(page.locator('#vim-teacher-next')).toContainText('type finding: timeout recovered after retry');
  await type(page, 'finding: timeout recovered after retry');
  await press(page, 'Escape');

  await expect(page.locator('#vim-teacher-next')).toContainText('press g');
  await press(page, 'g');
  await expect(page.locator('#vim-teacher-next')).toContainText('press g again');
  await press(page, 'g');
  expect((await state(page)).pos).toMatch(/^1,/);
  await expect(page.locator('#vim-teacher-next')).toContainText('press g');
  await press(page, 'g');
  await expect(page.locator('#vim-teacher-next')).toContainText('press ;');
  await press(page, ';');
  expect((await state(page)).pos).toMatch(/^4,/);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');

  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 10 COMPLETE');
});

test('teacher reviews each bulk data change before the next command', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 11');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 11 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 11-records.csv');
  await cmd(page, 'e 11-records.csv');
  const original = [
    'pending,acct_3',
    'ignore,test_account',
    'pending,acct_1',
    'pending,acct_1',
    'pending,acct_2'
  ];
  expect(await lines(page)).toEqual(original);
  await expect(page.locator('#vim-teacher-next')).toContainText(':g/^ignore/d');

  await cmd(page, 'g/^ignore/d');
  expect(await lines(page)).not.toContain('ignore,test_account');
  await expect(page.locator('#vim-teacher-next')).toContainText(':%s/^pending/ready/');
  await cmd(page, '%s/^pending/ready/');
  await expect(page.locator('#vim-teacher-next')).toContainText(':sort u');
  await cmd(page, 'sort u');

  const finalRecords = [
    'ready,acct_1',
    'ready,acct_2',
    'ready,acct_3'
  ];
  expect(await lines(page)).toEqual(finalRecords);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 11 COMPLETE');
});

test('teacher records one stable edit and replays it across matching routes', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher lesson 12');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 12 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 12-routes.txt');
  await cmd(page, 'e 12-routes.txt');
  expect((await state(page)).file).toBe('12-routes.txt');

  await expect(page.locator('#vim-teacher-next')).toContainText('press q');
  await press(page, 'q');
  await expect(page.locator('#vim-teacher-next')).toContainText('press q again');
  await press(page, 'q');
  await expect(page.locator('#vim-teacher-next')).toContainText('press f');
  for (const [key, next] of [
    ['f', 'press 1'],
    ['1', 'press r'],
    ['r', 'press 2'],
    ['2', 'press $'],
    ['$', 'press b'],
    ['b', 'press c'],
    ['c', 'press i'],
    ['i', 'press w'],
    ['w', 'type active']
  ]) {
    await press(page, key);
    await expect(page.locator('#vim-teacher-next')).toContainText(next);
  }
  await type(page, 'active');
  await expect(page.locator('#vim-teacher-next')).toContainText('press Esc');
  await press(page, 'Escape');
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');
  await press(page, 'j');
  await expect(page.locator('#vim-teacher-next')).toContainText('press 0');
  await press(page, '0');
  await expect(page.locator('#vim-teacher-next')).toContainText('press q');
  await press(page, 'q');
  await expect(page.locator('#vim-teacher-next')).toContainText('press @');
  await press(page, '@');
  await expect(page.locator('#vim-teacher-next')).toContainText('press q');
  await press(page, 'q');
  await expect(page.locator('#vim-teacher-next')).toContainText('press @');
  await press(page, '@');
  await expect(page.locator('#vim-teacher-next')).toContainText('press @ again');
  await press(page, '@');

  expect(await lines(page)).toEqual([
    'GET /v2/users active',
    'GET /v2/orders active',
    'GET /v2/reports active'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 12 COMPLETE');
  await cmd(page, 'teacher golf');
  expect(await courseText(page)).toContain('Route: @q then Q');
  expect(await courseText(page)).toContain('follows Neovim');
  await press(page, 'Control+o');
  await expect(page.locator('#vim-teacher-next')).toContainText('NEXT LESSON');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
  await cmd(page, 'teacher map');
  expect(await courseText(page)).toContain('[ ] 1. Open, edit, and save one file');
  expect(await courseText(page)).toContain('[x] 12. Replay one verified route migration');
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
    await cmd(page, `e ${filename}`);
    expect((await state(page)).file).toBe(filename);
  };

  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');
  for (const key of ['j', 'A']) await press(page, key);
  await type(page, 't');
  await press(page, 'Escape');
  await cmd(page, 'w');

  await cmd(page, 'e 02-recovery.txt');
  for (const key of ['j', '$', 'x', 'u', 'Control+r']) await press(page, key);
  await cmd(page, 'w');

  await cmd(page, 'e 03-release-note.txt');
  await press(page, 'c');
  await press(page, 'w');
  await type(page, 'ready');
  await press(page, 'Escape');
  for (const key of ['j', 'd', 'd']) await press(page, key);
  await cmd(page, 'w');

  await cmd(page, 'e 04-requests.log');
  await search('req_42');
  await press(page, 'n');
  await press(page, 'G');
  await press(page, 'c');
  await press(page, 'c');
  await type(page, 'finding: warning before timeout');
  await press(page, 'Escape');
  await cmd(page, 'w');

  await cmd(page, 'e 05-status.txt');
  await search(' : pending');
  await press(page, 'c');
  await press(page, '$');
  await type(page, '=ready');
  await press(page, 'Escape');
  for (const key of ['n', '.', 'n', '.']) await press(page, key);
  await cmd(page, 'w');

  await cmd(page, 'e 06-evidence.txt');
  for (const key of ['w', 'v', 'i', 'w', 'y', 'j', 'p']) await press(page, key);
  await cmd(page, 'w');

  await cmd(page, 'e 07-project.md');
  await cmd(page, 'Ex');
  await search('07-api.js');
  await press(page, 'Enter');
  for (const key of ['j', 'y', 'y']) await press(page, key);
  await cmd(page, 'buffer 07-project.md');
  await press(page, 'p');
  await cmd(page, 'w');

  await cmd(page, 'e 08-report.md');
  await cmd(page, 'vsplit 08-source.log');
  for (const key of ['y', 'y', 'Control+w', 'w', 'p']) await press(page, key);
  await cmd(page, 'only');
  await cmd(page, 'w');

  await cmd(page, 'e 09-review.md');
  await cmd(page, 'vsplit 09-change.diff');
  await cmd(page, 'tabedit 09-tests.log');
  for (const key of ['g', 't', 'g', 't', 'y', 'y']) await press(page, key);
  await cmd(page, 'tabclose');
  for (const key of ['Control+w', 'w', 'p']) await press(page, key);
  await cmd(page, 'only');
  await cmd(page, 'w');

  await cmd(page, 'e 10-trace.log');
  await search('timeout');
  for (const key of ['G', 'Control+o', 'Control+i', 'c', 'c']) await press(page, key);
  await type(page, 'finding: timeout recovered after retry');
  await press(page, 'Escape');
  for (const key of ['g', 'g', 'g', ';']) await press(page, key);
  await cmd(page, 'w');

  await cmd(page, 'e 11-records.csv');
  await cmd(page, 'g/^ignore/d');
  await cmd(page, '%s/^pending/ready/');
  await cmd(page, 'sort u');
  await cmd(page, 'w');

  await cmd(page, 'e 12-routes.txt');
  for (const key of ['q', 'q', 'f', '1', 'r', '2', '$', 'b', 'c', 'i', 'w']) await press(page, key);
  await type(page, 'active');
  for (const key of ['Escape', 'j', '0', 'q', '@', 'q', '@', '@']) await press(page, key);
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('CORE COURSE COMPLETE');
  await cmd(page, 'teacher map');
  for (let lesson = 1; lesson <= 12; lesson++) {
    expect(await courseText(page)).toContain(`[x] ${lesson}.`);
  }

  await cmd(page, 'teacher project');
  await openWork('incident.log');
  await changeLine('ANALYST_NOTE:', 'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online');
  await cmd(page, 'w');

  await openWork('events.csv');
  await changeFollowingLine('# evidence_id', 'evt_014203');
  await changeFollowingLine('# evidence_source', 'demo_importer');
  await cmd(page, 'w');

  await openWork('config.js');
  await changeLine('source:', 'source: "production-api",');
  await changeLine('CHANGE_NOTE:', '// CHANGE_NOTE: source corrected to production-api');
  await cmd(page, 'w');

  await openWork('incident.log');
  await cmd(page, '%s/status : duplicated/status=duplicate/g');
  await cmd(page, 'w');

  await openWork('launch-copy.md');
  await changeLine('Every imported', 'Claim review: The 14,203 demo-importer records are not production activity.');
  await changeLine('The dashboard recorded', 'Evidence note: evt_014203 occurred before production-api was online.');
  await changeLine('Approved copy:', 'Approved copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.');
  await cmd(page, 'w');

  await openWork('runbook.md');
  await changeLine('1.', '1. Confirm the active event source in config.js.');
  await changeLine('2.', '2. Compare event time with deployedAt.');
  await changeLine('3.', '3. Quarantine pre-deployment events and notify on-call.');
  await changeLine('Operator action:', 'Operator action: Verify event source, deployment time, and event timestamp before publishing counts.');
  await cmd(page, 'w');

  await openWork('postmortem.md');
  await changeLine('Impact:', 'Impact: Dashboard displayed 14,203 unverified pre-deployment records.');
  await changeLine('Evidence:', 'Evidence: evt_014203 occurred before production-api was online.');
  await changeLine('Root cause:', 'Root cause: The active source was demo-importer instead of production-api.');
  await changeLine('Repair:', 'Repair: Config now uses production-api.');
  await changeLine('Launch copy:', 'Launch copy: The dashboard reports REVIEWED_PRODUCTION_EVENTS after deployment.');
  await changeLine('Runbook:', 'Runbook: Verify event source, deployment time, and event timestamp before publishing counts.');
  await changeLine('Follow-up:', 'Follow-up: Add a deployment-time validation gate before ingest.');
  await cmd(page, 'w');

  await openWork('postmortem.md');
  await changeLine('Verified sources:', 'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('APPLIED PROJECT COMPLETE');
  expect((await state(page)).file).toBe('postmortem.md');
  expect(await lines(page)).toContain('Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'teacher map');
  expect(await courseText(page)).toContain('Applied project: 8/8 missions complete');
});
