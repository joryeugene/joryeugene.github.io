import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function teacherText(page) {
  return (await lines(page)).join('\n');
}

async function finishSafeEdit(page) {
  await press(page, 'Control+o');
  await press(page, 'j');
  await press(page, '$');
  await press(page, 'a');
  await type(page, 't');
  await press(page, 'Escape');
  for (const key of ['j', '0', '7', 'l', '4', 'x', 'a']) await press(page, key);
  await type(page, 'team');
  await press(page, 'Escape');
  for (const key of ['j', '$', 'x']) await press(page, key);
}

test('teacher resumes the first incomplete lesson after reload and ignores corrupt progress', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing'],
      completedProjectMissions: [],
      reviews: { 'safe-editing': [Date.now() + 86400000] },
      summaries: { hints: 0, retriedChecks: 0, observedSkills: ['safe mode changes'] }
    }));
  });
  await page.reload();
  await page.waitForSelector('#vim-content');
  await cmd(page, 'teacher');
  await cmd(page, 'teacher next');
  expect(await teacherText(page)).toContain('LESSON 2 OF 8');

  await page.evaluate(() => localStorage.setItem('vim_teacher_progress_v2', '{broken'));
  await page.reload();
  await page.waitForSelector('#vim-content');
  await cmd(page, 'teacher map');
  expect(await teacherText(page)).toContain('[ ] 1. Make one safe edit');
  expect(await teacherText(page)).toContain('Reviews due: 0');
});

test('teacher opens a due review and clears only elapsed review dates after real work', async ({ page }) => {
  const futureReview = Date.now() + 86400000;
  await page.addInitScript(({ future }) => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing'],
      completedProjectMissions: [],
      reviews: { 'safe-editing': [Date.now() - 1000, future] },
      summaries: { hints: 0, retriedChecks: 0, observedSkills: [] }
    }));
  }, { future: futureReview });
  await open(page);

  await cmd(page, 'teacher review');
  const reviewGuide = await teacherText(page);
  expect(reviewGuide).toContain('VIM TEACHER // REVIEW // LESSON 1 OF 8');
  expect(reviewGuide).toContain('RETRIEVAL TASK:');
  expect(reviewGuide).not.toContain('WORKED EXAMPLE:');
  expect((await state(page)).file).toBe('[Teacher]');
  await finishSafeEdit(page);
  expect(await lines(page)).toContain('recovery: ready');
  await cmd(page, 'teacher next');
  expect(await teacherText(page)).toContain('LESSON 2 OF 8');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vim_teacher_progress_v2')));
  expect(stored.completedLessons).toEqual(['safe-editing']);
  expect(stored.reviews['safe-editing']).toEqual([futureReview]);
});

test('teacher map counts each due lesson once', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing', 'vim-grammar'],
      completedProjectMissions: [],
      reviews: {
        'safe-editing': [Date.now() - 2000, Date.now() - 1000],
        'vim-grammar': [Date.now() - 500]
      },
      summaries: { hints: 0, retriedChecks: 0, observedSkills: [] }
    }));
  });
  await open(page);

  await cmd(page, 'teacher map');
  expect(await teacherText(page)).toContain('Reviews due: 2');
});

test('teacher preserves unfinished course work while switching tracks', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'teacher next');
  await press(page, 'Control+o');
  for (const key of ['j', '$', 'a']) await press(page, key);
  await type(page, 't');
  await press(page, 'Escape');
  expect(await lines(page)).toContain('status: draft');

  await cmd(page, 'teacher project');
  await cmd(page, 'teacher lesson 1');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('01-handoff.txt');
  expect(await lines(page)).toContain('status: draft');
});

test('teacher delayed review restores the unfinished retrieval task', async ({ page }) => {
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    window.__teacherNow = realNow();
    Date.now = () => window.__teacherNow;
    localStorage.removeItem('vim_teacher_progress_v2');
  });
  await open(page);

  await cmd(page, 'teacher');
  await cmd(page, 'teacher next');
  await finishSafeEdit(page);
  await cmd(page, 'teacher next');
  await page.evaluate(() => { window.__teacherNow += 2 * 86400000; });

  await cmd(page, 'teacher review');
  expect(await teacherText(page)).toContain('RETRIEVAL TASK:');
  await press(page, 'Control+o');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'owner: TOD0',
    'recovery: readyy',
    'keep: audit enabled'
  ]);
});

test('teacher write downloads a copy without storing lesson text', async ({ page }) => {
  await open(page);
  await cmd(page, 'teacher');
  await cmd(page, 'teacher next');
  await press(page, 'Control+o');

  const downloadPromise = page.waitForEvent('download');
  await cmd(page, 'w');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('01-handoff.txt');
  const stored = await page.evaluate(() => localStorage.getItem('vim_file_01-handoff.txt'));
  expect(stored).toBeNull();
});

test('teacher reset works before a track starts and preserves unrelated storage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing'],
      completedProjectMissions: [],
      reviews: {},
      summaries: { hints: 0, retriedChecks: 0, observedSkills: [] }
    }));
    localStorage.setItem('unrelated-setting', 'keep me');
  });
  await open(page);

  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');
  await expect(page.locator('#vim-cmdline')).toContainText('Teacher progress reset.');
  const storage = await page.evaluate(() => ({
    teacher: localStorage.getItem('vim_teacher_progress_v2'),
    unrelated: localStorage.getItem('unrelated-setting')
  }));
  expect(storage).toEqual({ teacher: null, unrelated: 'keep me' });
});

test('teacher exports only the progress schema and reset preserves unrelated storage', async ({ page }) => {
  const progress = {
    version: 2,
    completedLessons: ['safe-editing'],
    completedProjectMissions: ['timeline'],
    reviews: { 'safe-editing': [123456789] },
    summaries: { hints: 2, retriedChecks: 1, observedSkills: ['safe mode changes'] }
  };
  await page.addInitScript(({ stored }) => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify(stored));
    localStorage.setItem('vim_file_private-note', 'learner file contents');
    localStorage.setItem('unrelated-setting', 'keep me');
  }, { stored: progress });
  await open(page);

  const downloadPromise = page.waitForEvent('download');
  await cmd(page, 'teacher export');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('vim-teacher-progress.json');
  const exportedText = await readFile(await download.path(), 'utf8');
  expect(JSON.parse(exportedText)).toEqual(progress);
  expect(exportedText).not.toContain('learner file contents');
  expect(exportedText).not.toContain('private-note');

  await cmd(page, 'teacher map');
  expect(await teacherText(page)).toContain('[x] 1. Make one safe edit');
  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');
  await cmd(page, 'teacher map');
  expect(await teacherText(page)).toContain('[ ] 1. Make one safe edit');
  const storage = await page.evaluate(() => ({
    teacher: localStorage.getItem('vim_teacher_progress_v2'),
    unrelated: localStorage.getItem('unrelated-setting'),
    file: localStorage.getItem('vim_file_private-note')
  }));
  expect(storage).toEqual({
    teacher: null,
    unrelated: 'keep me',
    file: 'learner file contents'
  });
});
