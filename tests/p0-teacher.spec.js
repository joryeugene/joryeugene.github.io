import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function timedCmd(page, command) {
  await press(page, ':');
  await type(page, command);
  return page.evaluate(() => {
    const start = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true
    }));
    return performance.now() - start;
  });
}

test('teacher activation is immediate and leaves the learner buffer visible', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  const activationMs = await timedCmd(page, 'teacher');
  expect(activationMs).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('untitled.txt');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
});

test('teacher off hides the rail, returns from a Teacher view, and keeps progress', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 't');
  await press(page, 'Escape');
  await cmd(page, 'w');
  await cmd(page, 'teacher map');
  expect((await state(page)).file).toBe('[Teacher]');

  await cmd(page, 'teacher off');
  expect((await state(page)).file).toBe('01-handoff.txt');
  await expect(page.locator('#vim-teacher-next')).not.toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('vim_teacher_progress_v2')));
  expect(stored.completedLessons).toEqual(['safe-editing']);

  await cmd(page, 'w');
  expect((await state(page)).modified).toBe(false);

  const exported = page.waitForEvent('download');
  await cmd(page, 'download');
  expect((await exported).suggestedFilename()).toBe('01-handoff.txt');

  await cmd(page, 'teacher');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 2 OF 12');
});

test('teacher help and completion expose every Teacher command and the top rail', async ({ page }) => {
  await open(page);
  await cmd(page, 'help :teacher');
  const help = (await lines(page)).join('\n');
  for (const command of [
    ':teacher', ':teacher map', ':teacher lesson N', ':teacher retry',
    ':teacher hint', ':teacher review', ':teacher project', ':teacher score',
    ':teacher golf', ':teacher export', ':teacher reset', ':teacher off'
  ]) expect(help).toContain(command);
  expect(help).toContain('top of the editor');
  expect(help).not.toContain('below the editor');

  const teacherCopy = await page.evaluate(() => JSON.stringify(window.VIM_TEACHER));
  expect(teacherCopy).toContain('top of the editor');
  expect(teacherCopy).not.toContain('below the editor');

  await press(page, ':');
  await type(page, 'teacher o');
  await press(page, 'Tab');
  await expect(page.locator('#vim-cmdline')).toHaveText(':teacher off');
  await press(page, 'Escape');

  await cmd(page, 'teacher');
  await cmd(page, 'teacher score');
  const guide = (await lines(page)).join('\n');
  expect(guide).toContain('top of the editor');
  expect(guide).not.toContain('below the editor');
});

test('teacher optional views are read-only and stay out of jump history', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'teacher map');
  const map = (await lines(page)).join('\n');
  expect((await state(page)).file).toBe('[Teacher]');
  expect(map).toContain('VIM TEACHER // COURSE MAP');

  await page.evaluate(() => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text', 'BROKEN');
    document.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData
    }));
  });
  await expect(page.locator('#vim-cmdline')).toContainText("E21: Cannot make changes, 'modifiable' is off");
  expect((await lines(page)).join('\n')).toBe(map);

  await press(page, 'Control+o');
  await cmd(page, 'jumps');
  expect((await lines(page)).join('\n')).not.toContain('[Teacher]');
});

test('teacher records only real hint and retry use, then unlocks golf', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 'x');
  await press(page, 'Escape');
  await cmd(page, 'w');
  await expect(page.locator('#vim-teacher-next')).toContainText('NOT COMPLETE');

  await cmd(page, 'teacher retry');
  await cmd(page, 'teacher hint');
  await expect(page.locator('#vim-teacher-next')).toContainText('HINT 1');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 't');
  await press(page, 'Escape');
  await cmd(page, 'w');

  await cmd(page, 'teacher golf');
  expect((await lines(page)).join('\n')).toContain('VIM GOLF AFTER THE RESULT');
  expect((await lines(page)).join('\n')).toContain('Route: $at');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('01-handoff.txt');

  await cmd(page, 'teacher score');
  const score = (await lines(page)).join('\n');
  expect(score).toContain('Progress: 1/12 lessons');
  expect(score).toContain('Hints used: 1');
  expect(score).toContain('Retries used: 1');
  expect(score).not.toContain('First-pass checks');
  expect(score).not.toContain('Checks retried');
});
