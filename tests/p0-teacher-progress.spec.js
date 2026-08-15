import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { open, press, type, cmd, lines, state } from './helpers.js';

async function teacherText(page) {
  return (await lines(page)).join('\n');
}

async function finishSafeEdit(page) {
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'A');
  await type(page, 't');
  await press(page, 'Escape');
  await cmd(page, 'w');
}

test('teacher resumes the first incomplete lesson after reload and ignores corrupt progress', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing'],
      completedProjectMissions: [],
      reviews: { 'safe-editing': [Date.now() + 86400000] },
      summaries: { hints: 0, retries: 0, observedSkills: ['safe mode changes'] }
    }));
  });
  await page.reload();
  await page.waitForSelector('#vim-content');
  await cmd(page, 'teacher');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 2 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');

  await page.evaluate(() => localStorage.setItem('vim_teacher_progress_v2', '{broken'));
  await page.reload();
  await page.waitForSelector('#vim-content');
  await cmd(page, 'teacher map');
  expect(await teacherText(page)).toContain('[ ] 1. Open, edit, and save one file');
  expect(await teacherText(page)).toContain('Reviews due: 0');
});

test('teacher migrates legacy version 2 retry summaries without losing them', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: [],
      completedProjectMissions: [],
      reviews: {},
      summaries: { hints: 2, retriedChecks: 7, observedSkills: ['safe mode changes'] }
    }));
  });
  await open(page);

  await cmd(page, 'teacher');
  await finishSafeEdit(page);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vim_teacher_progress_v2')));
  expect(stored.version).toBe(3);
  expect(stored.summaries).toMatchObject({
    hints: 2,
    retries: 7,
    observedSkills: ['safe mode changes']
  });
  expect(stored.summaries).not.toHaveProperty('retriedChecks');
});

test('teacher opens a due review and clears only elapsed review dates after real work', async ({ page }) => {
  const futureReview = Date.now() + 86400000;
  await page.addInitScript(({ future }) => {
    localStorage.setItem('vim_teacher_progress_v2', JSON.stringify({
      version: 2,
      completedLessons: ['safe-editing'],
      completedProjectMissions: [],
      reviews: { 'safe-editing': [Date.now() - 1000, future] },
      summaries: { hints: 0, retries: 0, observedSkills: [] }
    }));
  }, { future: futureReview });
  await open(page);

  await cmd(page, 'teacher review');
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 01-handoff.txt');
  await finishSafeEdit(page);
  expect(await lines(page)).toContain('status: draft');
  await expect(page.locator('#vim-teacher-next')).toContainText('SAVED · LESSON 1 COMPLETE');
  await expect(page.locator('#vim-teacher-next')).toContainText(':e 02-recovery.txt');

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
      summaries: { hints: 0, retries: 0, observedSkills: [] }
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
  await cmd(page, 'e 01-handoff.txt');
  for (const key of ['j', '$', 'a']) await press(page, key);
  await type(page, 't');
  await press(page, 'Escape');
  expect(await lines(page)).toContain('status: draft');

  await cmd(page, 'teacher project');
  await cmd(page, 'teacher lesson 1');
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
  await finishSafeEdit(page);
  await page.evaluate(() => { window.__teacherNow += 2 * 86400000; });

  await cmd(page, 'teacher review');
  await cmd(page, 'e 01-handoff.txt');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'keep: audit enabled'
  ]);
});

test('teacher write saves inside the lesson without downloading or storing file text', async ({ page }) => {
  await open(page);
  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');

  let downloads = 0;
  page.on('download', () => { downloads++; });
  await cmd(page, 'w');
  await page.waitForTimeout(100);
  expect(downloads).toBe(0);
  await expect(page.locator('#vim-cmdline')).toContainText('Lesson not complete.');
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
      summaries: { hints: 0, retries: 0, observedSkills: [] }
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

test('teacher reset restores the active damaged lesson buffer', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher');
  await cmd(page, 'e 01-handoff.txt');
  await press(page, 'j');
  await press(page, 'd');
  await press(page, 'd');
  expect(await lines(page)).not.toContain('status: draf');

  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');

  expect((await state(page)).file).toBe('01-handoff.txt');
  expect(await lines(page)).toEqual([
    '# Release handoff',
    'status: draf',
    'keep: audit enabled'
  ]);
  await expect(page.locator('#vim-teacher-next')).toContainText('LESSON 1 OF 12');
});

test('teacher reset restores a paused project file before another track can save it', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('vim_teacher_progress_v2'));
  await open(page);
  await cmd(page, 'teacher project');
  await cmd(page, 'e incident.log');
  await press(page, 'd');
  await press(page, 'd');
  expect((await lines(page))[0]).not.toContain('2026-08-14T02:11:04Z');

  await cmd(page, 'teacher off');
  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');

  expect((await state(page)).file).toBe('incident.log');
  expect((await lines(page))[0]).toBe(
    '2026-08-14T02:11:04Z INFO deploy source=production-api status=scheduled'
  );

  await cmd(page, 'teacher');
  await cmd(page, 'teacher project');
  await cmd(page, 'e incident.log');
  expect((await lines(page))[0]).toBe(
    '2026-08-14T02:11:04Z INFO deploy source=production-api status=scheduled'
  );
});

test('teacher exports only the progress schema and reset preserves unrelated storage', async ({ page }) => {
  const progress = {
    version: 3,
    completedLessons: ['safe-editing'],
    completedProjectMissions: ['timeline'],
    reviews: { 'safe-editing': [123456789] },
    summaries: { hints: 2, retries: 1, observedSkills: ['safe mode changes'] }
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
  expect(await teacherText(page)).toContain('[x] 1. Open, edit, and save one file');
  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');
  expect(await teacherText(page)).toContain('[ ] 1. Open, edit, and save one file');
  await expect(page.locator('#vim-cmdline')).toContainText('Teacher progress reset.');
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
