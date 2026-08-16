import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function progress(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('vim_teacher_progress_v2')));
}

test('a correct save completes once and exposes the next real Vim action', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText('status: draf');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
  await expect(page.locator('#vim-teacher-next')).not.toContainText(':teacher check');
  await expect(page.locator('#vim-teacher-next')).not.toContainText(':teacher next');
  const desktopLayout = await page.evaluate(() => {
    const panel = document.querySelector('#vim-teacher-next').getBoundingClientRect();
    const body = document.querySelector('#vim-body').getBoundingClientRect();
    return { panelBottom: panel.bottom, bodyTop: body.top };
  });
  expect(desktopLayout.panelBottom).toBeLessThanOrEqual(desktopLayout.bodyTop);

  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 't');
  await press(page, 'Escape');

  expect((await progress(page))?.completedLessons || []).toEqual([]);
  await expect(page.locator('#vim-teacher-next')).toContainText(':w');

  await cmd(page, 'w');

  expect((await state(page)).file).toBe('01-handoff.txt');
  expect((await progress(page)).completedLessons).toEqual(['safe-editing']);
  await expect(page.locator('#vim-teacher-next')).toHaveClass(/completed/);
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 COMPLETE');
  await expect(page.locator('#vim-teacher-next')).toContainText('NEXT LESSON');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');

  await cmd(page, 'w');
  expect((await progress(page)).completedLessons).toEqual(['safe-editing']);
  expect((await state(page)).file).toBe('01-handoff.txt');

  await cmd(page, 'e 02-recovery.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 2 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText('status: draftt');
});

test('an incorrect save stays in the exercise and gives one repair path', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 'x');
  await press(page, 'Escape');
  await cmd(page, 'w');

  expect((await state(page)).file).toBe('01-handoff.txt');
  expect((await lines(page))[1]).toBe('status: drafx');
  expect((await progress(page))?.completedLessons || []).toEqual([]);
  await expect(page.locator('#vim-teacher-next')).toHaveClass(/repair/);
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 NOT COMPLETE');
  await expect(page.locator('#vim-teacher-next')).toContainText('status: draft');
  await expect(page.locator('#vim-teacher-next')).toContainText(':teacher retry');

  await cmd(page, 'teacher retry');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'keep: audit enabled'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText('press j');
});

test('inactivity and work in the wrong file never create progress', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  const initialPanel = await page.locator('#vim-teacher-next').innerText();
  await page.waitForTimeout(350);
  await press(page, 'h');
  await press(page, 'j');
  expect((await progress(page))?.completedLessons || []).toEqual([]);
  expect(await page.locator('#vim-teacher-next').innerText()).toBe(initialPanel);

  let downloaded = false;
  page.on('download', () => { downloaded = true; });
  await cmd(page, 'e 02-recovery.txt');
  await cmd(page, 'w');

  expect(downloaded).toBe(false);
  expect((await progress(page))?.completedLessons || []).toEqual([]);
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
});

test('teacher-taught g chords survive a novice reading pause', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher lesson 10');
  await cmd(page, 'e 10-trace.log');
  await press(page, 'G');

  await press(page, 'g');
  await page.waitForTimeout(650);
  await press(page, 'g');

  expect((await state(page)).pos).toBe('1,1');
});

test('lesson 3 sends an overshooting learner back toward the REMOVE line', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher lesson 3');
  await cmd(page, 'e 03-release-note.txt');

  await press(page, 'c');
  await press(page, 'w');
  await type(page, 'ready');
  await press(page, 'Escape');
  await press(page, 'j');
  await press(page, 'j');

  await expect(page.locator('#vim-teacher-next')).toContainText('press k');
  await expect(page.locator('#vim-teacher-next')).toContainText('REMOVE line');
  await press(page, 'k');
  await expect(page.locator('#vim-teacher-next')).toContainText('press d');
});

test('lesson 12 returns to the first route before recording a macro', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher lesson 12');
  await cmd(page, 'e 12-routes.txt');
  await press(page, 'G');

  await expect(page.locator('#vim-teacher-next')).toContainText('press g');
  await expect(page.locator('#vim-teacher-next')).toContainText('first route');
  await press(page, 'g');
  await press(page, 'g');
  await expect(page.locator('#vim-teacher-next')).toContainText('press q');
});

test('project validation rejects a correct note after evidence lines are deleted', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher project');
  await cmd(page, 'e incident.log');
  await press(page, 'G');
  await press(page, 'c');
  await press(page, 'c');
  await type(page, 'ANALYST_NOTE: evt_014203 recorded 14203 records before production-api was online');
  await press(page, 'Escape');
  await press(page, 'g');
  await press(page, 'g');
  await press(page, 'd');
  await press(page, 'd');
  await cmd(page, 'w');

  const stored = await progress(page);
  expect(stored?.completedProjectMissions || []).toEqual([]);
  await expect(page.locator('#vim-teacher-next')).toHaveClass(/repair/);
  await expect(page.locator('#vim-teacher-next')).toContainText('NOT COMPLETE');
  expect((await state(page)).file).toBe('incident.log');
});
