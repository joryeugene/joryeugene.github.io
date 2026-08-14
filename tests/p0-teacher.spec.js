import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

async function keys(page, values) {
  for (const value of values) await press(page, value);
}

async function search(page, pattern) {
  await press(page, '/');
  await type(page, pattern);
  await press(page, 'Enter');
}

async function replaceLine(page, text) {
  await keys(page, ['0', 'c', 'i', 'l']);
  await type(page, text);
  await press(page, 'Escape');
}

async function changeLine(page, text) {
  await keys(page, ['c', 'c']);
  await type(page, text);
  await press(page, 'Escape');
}

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

async function timedTeacherReturn(page) {
  return page.evaluate(() => {
    const start = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'o', ctrlKey: true, bubbles: true, cancelable: true
    }));
    return performance.now() - start;
  });
}

async function openMission(page, number, filename, expectedBrief = []) {
  const transitionMs = await timedCmd(page, 'teacher next');
  expect(transitionMs).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('[Teacher]');
  const brief = (await lines(page)).join('\n');
  expect(brief).toContain(`MISSION ${number} OF 8`);
  for (const text of expectedBrief) expect(brief).toContain(text);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe(filename);
  return transitionMs;
}

test('teacher turns a corrupt launch into a verified postmortem', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);
  const missionTransitionMs = [];

  await seed(page, 'header\nalpha\nbeta\ntail\nfifth\nsixth');
  await keys(page, ['j', 'c', 'c']);
  await type(page, 'ONE');
  await keys(page, ['Escape', 'j', 'c', 'c']);
  await type(page, 'TWO');
  await press(page, 'Escape');
  expect(await lines(page)).toEqual(['header', 'ONE', 'TWO', 'tail', 'fifth', 'sixth']);
  await keys(page, ['2', 'u']);
  expect(await lines(page)).toEqual(['header', 'alpha', 'beta', 'tail', 'fifth', 'sixth']);
  await press(page, 'j');
  expect((await state(page)).pos).toMatch(/^4,/);

  await keys(page, ['g', 'g', 'A']);
  await type(page, 'xyz');
  await keys(page, ['Escape', 'u']);
  expect((await lines(page))[0]).toBe('header');
  await keys(page, ['0', 'R']);
  await type(page, 'XYZ');
  await keys(page, ['Escape', 'u']);
  expect((await lines(page))[0]).toBe('header');

  await press(page, ':');
  await type(page, 'teacher');
  const activationMs = await page.evaluate(() => {
    const start = performance.now();
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, cancelable: true
    }));
    return performance.now() - start;
  });
  console.log(JSON.stringify({ teacherActivationMs: activationMs }));
  expect(activationMs).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain('PHALENE ANALYTICS // FIELD LAB');

  page.once('dialog', dialog => dialog.accept());
  await cmd(page, 'teacher reset');
  expect((await lines(page)).join('\n')).toContain('PHALENE ANALYTICS // FIELD LAB');

  missionTransitionMs.push(await timedCmd(page, 'teacher next'));
  expect(missionTransitionMs[0]).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('[Teacher]');
  const missionOneBrief = (await lines(page)).join('\n');
  expect(missionOneBrief).toContain('MISSION 1 OF 8');
  await press(page, 'i');
  await expect(page.locator('#vim-cmdline')).toContainText("E21: Cannot make changes, 'modifiable' is off");
  expect((await lines(page)).join('\n')).toBe(missionOneBrief);
  await cmd(page, '%s/PHALENE/BROKEN/');
  await expect(page.locator('#vim-cmdline')).toContainText("E21: Cannot make changes, 'modifiable' is off");
  expect((await lines(page)).join('\n')).toBe(missionOneBrief);
  const returnMs = await timedTeacherReturn(page);
  expect(returnMs).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('incident.log');
  await press(page, 'Control+i');
  expect((await state(page)).file).toBe('incident.log');
  await cmd(page, 'teacher hint');
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain('HINT:');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('incident.log');
  const lockedGolfMs = await timedCmd(page, 'teacher golf');
  expect(lockedGolfMs).toBeLessThanOrEqual(100);
  await expect(page.locator('#vim-cmdline')).toContainText('Finish the visible result');
  expect((await state(page)).file).toBe('incident.log');
  await search(page, 'landings=14203');
  await keys(page, ['Control+o', 'Control+i', 'G']);
  await replaceLine(page, 'ANALYST_NOTE: evt_014203 recorded 14203 landings before roof-array was online');
  await cmd(page, 'teacher check');
  await keys(page, [':', 'ArrowUp', 'Enter']);
  const golfMs = await timedCmd(page, 'teacher golf');
  expect(golfMs).toBeLessThanOrEqual(100);
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain('Gcil');
  expect((await lines(page)).join('\n')).toContain('after the timeline is understood');
  await press(page, 'Control+o');
  const scoreMs = await timedCmd(page, 'teacher score');
  expect(scoreMs).toBeLessThanOrEqual(100);
  expect((await lines(page)).join('\n')).toContain('MOTH FLIGHT RECORDER');
  await press(page, 'Control+o');

  missionTransitionMs.push(await openMission(page, 2, 'events.csv'));
  await search(page, 'candidate_id');
  await keys(page, ['/', 'ArrowUp', 'Enter', 'j', '0', '"', 'a', 'y', 'i', 'w']);
  await search(page, 'evidence_id');
  await keys(page, ['j', '0', 'd', 'i', 'w', '"', 'a', 'p']);
  await search(page, 'candidate_sensor');
  await keys(page, ['j', '0', '"', 'b', 'y', 'i', 'w']);
  await cmd(page, 'registers a b');
  expect((await state(page)).file).toBe('[Registers]');
  expect((await lines(page)).join('\n')).toContain('"a  char  evt_014203');
  expect((await lines(page)).join('\n')).toContain('"b  char  desk_lamp');
  await press(page, 'u');
  expect((await state(page)).file).toBe('events.csv');
  await search(page, 'evidence_sensor');
  await keys(page, ['j', '0', 'd', 'i', 'w', '"', 'b', 'p']);

  missionTransitionMs.push(await openMission(page, 3, 'config.js'));
  await search(page, 'desk-lamp');
  await keys(page, ['c', 'i', '"']);
  await type(page, 'roof-array');
  await press(page, 'Escape');
  await search(page, 'CHANGE_NOTE');
  await replaceLine(page, '// CHANGE_NOTE: source corrected to roof-array');
  await keys(page, ['g', 'g', 'g', ';', 'g', ',', '`', '.']);

  missionTransitionMs.push(await openMission(page, 4, 'incident.log'));
  await search(page, 'status : duplicated');
  await keys(page, ['c', '$']);
  await type(page, 'status=duplicate');
  await press(page, 'Escape');
  await press(page, 'n');
  await keys(page, ['q', 'z', '.', 'n', 'q', '@', 'z']);

  missionTransitionMs.push(await openMission(page, 5, 'launch-copy.md'));
  await search(page, 'We counted');
  await replaceLine(page, 'Claim review: Desk-lamp counts before deployment were excluded.');
  await search(page, 'The dashboard recorded');
  await replaceLine(page, 'Evidence note: 14,203 was a pre-deployment desk-lamp event, not verified launch activity.');
  await search(page, 'Approved copy');
  await keys(page, ['0', 'c', 'i', 'l']);
  await type(page, 'Approved copy: The dashboard reports REVIEWED_');
  await press(page, 'Control+n');
  await type(page, ' after deployment.');
  await press(page, 'Escape');

  missionTransitionMs.push(await openMission(page, 6, 'runbook.md', ['cc']));
  await press(page, 'j');
  await changeLine(page, '1. Confirm the active sensor source in config.js.');
  await press(page, 'j');
  await changeLine(page, '2. Compare event time with deployedAt.');
  await press(page, 'j');
  await changeLine(page, '3. Quarantine pre-deployment events and notify on-call.');
  await cmd(page, 'teacher check');
  await expect(page.locator('#vim-cmdline')).toContainText('Missing: Operator action:');
  await press(page, 'j');
  await changeLine(page, 'Operator action: Verify sensor source, deployment time, and event timestamp before publishing counts.');

  missionTransitionMs.push(await openMission(page, 7, 'postmortem.md', ['desk_lamp', 'f_', 'r-']));
  const reportLines = [
    'Impact: Dashboard displayed 14,203 impossible pre-deployment landings.',
    'Evidence: evt_014203 occurred before the roof-array was online.',
    'Root cause: The active source was desk-lamp instead of roof-array.',
    'Repair: Config now uses roof-array and excludes pre-deployment events.',
    'Launch copy: The dashboard reports REVIEWED_ROOF_ARRAY_EVENTS after deployment.',
    'Runbook: Verify sensor source, deployment time, and event timestamp before publishing counts.',
    'Follow-up: Add a deployment-time validation gate before ingest.'
  ];
  await search(page, 'Impact: TODO');
  for (let index = 0; index < reportLines.length; index++) {
    if (index > 0) await press(page, 'j');
    const reportLine = reportLines[index];
    if (index === 2) {
      await keys(page, ['0', 'c', 'i', 'l']);
      await type(page, 'Root cause: The active source was ');
      await keys(page, ['Escape', '"', 'b', 'p', 'a']);
      await type(page, ' instead of roof-array.');
      await press(page, 'Escape');
      await search(page, 'desk_lamp');
      await keys(page, ['f', '_', 'r', '-']);
    } else {
      await replaceLine(page, reportLine);
    }
  }
  await keys(page, ['y', 'a', 'l']);

  missionTransitionMs.push(await openMission(page, 8, 'postmortem.md', [
    'do not enter jump history', ':jumps'
  ]));
  await cmd(page, 'jumps');
  expect((await state(page)).file).toBe('[Jumps]');
  expect((await lines(page)).join('\n')).not.toContain('[Teacher]');
  await press(page, 'u');
  expect((await state(page)).file).toBe('postmortem.md');
  await keys(page, ['Control+o', 'Control+o', 'Control+i', 'Control+i', 'g', ';', 'g', ',']);
  expect((await state(page)).file).not.toBe('[Teacher]');
  await search(page, 'Verified sources');
  await replaceLine(page, 'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'teacher next');

  expect((await state(page)).file).toBe('[Teacher]');
  const completion = (await lines(page)).join('\n');
  expect(completion).toContain('PROJECT COMPLETE');
  expect(completion).toContain('MOTH FLIGHT RECORDER');
  expect(completion).toContain('Evidence: 8/8 missions');
  expect(completion).toContain('First-pass checks: 7/8');
  expect(completion).toContain('Lanterns used: 1');
  expect(completion).toContain('Course corrections: 1');
  expect(completion).toMatch(/Command strokes: [1-9]\d*/);
  expect(completion).toContain('Skills observed: jump history, named registers');
  expect(completion).toContain('line change, character normalization');
  console.log(JSON.stringify({
    missionTransitionMaxMs: Math.max(...missionTransitionMs),
    lockedGolfMs,
    golfMs,
    scoreMs,
    returnMs
  }));
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('postmortem.md');
  expect(await lines(page)).toEqual([
    '# Phalene Analytics Incident Postmortem',
    ' ',
    ...reportLines,
    'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'
  ]);
});
