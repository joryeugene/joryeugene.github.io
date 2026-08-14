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

async function openMission(page, number, filename) {
  await cmd(page, 'teacher next');
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain(`MISSION ${number} OF 8`);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe(filename);
}

test('teacher turns a corrupt launch into a verified postmortem', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);

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

  await cmd(page, 'teacher next');
  expect((await state(page)).file).toBe('[Teacher]');
  const missionOneBrief = (await lines(page)).join('\n');
  expect(missionOneBrief).toContain('MISSION 1 OF 8');
  await press(page, 'i');
  await expect(page.locator('#vim-cmdline')).toContainText("E21: Cannot make changes, 'modifiable' is off");
  expect((await lines(page)).join('\n')).toBe(missionOneBrief);
  await cmd(page, '%s/PHALENE/BROKEN/');
  await expect(page.locator('#vim-cmdline')).toContainText("E21: Cannot make changes, 'modifiable' is off");
  expect((await lines(page)).join('\n')).toBe(missionOneBrief);
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('incident.log');
  await press(page, 'Control+i');
  expect((await state(page)).file).toBe('incident.log');
  await cmd(page, 'teacher hint');
  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain('HINT:');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('incident.log');
  await search(page, 'landings=14203');
  await keys(page, ['Control+o', 'Control+i', 'G']);
  await replaceLine(page, 'ANALYST_NOTE: evt_014203 recorded 14203 landings before roof-array was online');
  await cmd(page, 'teacher check');
  await keys(page, [':', 'ArrowUp', 'Enter']);

  await openMission(page, 2, 'events.csv');
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

  await openMission(page, 3, 'config.js');
  await search(page, 'desk-lamp');
  await keys(page, ['c', 'i', '"']);
  await type(page, 'roof-array');
  await press(page, 'Escape');
  await search(page, 'CHANGE_NOTE');
  await replaceLine(page, '// CHANGE_NOTE: source corrected to roof-array');
  await keys(page, ['g', 'g', 'g', ';', 'g', ',', '`', '.']);

  await openMission(page, 4, 'incident.log');
  await search(page, 'status : duplicated');
  await keys(page, ['c', '$']);
  await type(page, 'status=duplicate');
  await press(page, 'Escape');
  await press(page, 'n');
  await keys(page, ['q', 'z', '.', 'n', 'q', '@', 'z']);

  await openMission(page, 5, 'launch-copy.md');
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

  await openMission(page, 6, 'runbook.md');
  await press(page, 'j');
  await replaceLine(page, '1. Confirm the active sensor source in config.js.');
  await press(page, 'j');
  await replaceLine(page, '2. Compare event time with deployedAt.');
  await press(page, 'j');
  await replaceLine(page, '3. Quarantine pre-deployment events and notify on-call.');
  await press(page, 'j');
  await replaceLine(page, 'Operator action: Verify sensor source, deployment time, and event timestamp before publishing counts.');

  await openMission(page, 7, 'postmortem.md');
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
    await replaceLine(page, reportLine);
  }
  await keys(page, ['y', 'a', 'l']);

  await openMission(page, 8, 'postmortem.md');
  await keys(page, ['Control+o', 'Control+o', 'Control+i', 'Control+i', 'g', ';', 'g', ',']);
  await search(page, 'Verified sources');
  await replaceLine(page, 'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md');
  await cmd(page, 'teacher next');

  expect((await state(page)).file).toBe('[Teacher]');
  expect((await lines(page)).join('\n')).toContain('PROJECT COMPLETE');
  await press(page, 'Control+o');
  expect((await state(page)).file).toBe('postmortem.md');
  expect(await lines(page)).toEqual([
    '# Phalene Analytics Incident Postmortem',
    ' ',
    ...reportLines,
    'Verified sources: incident.log, events.csv, config.js, launch-copy.md, runbook.md'
  ]);
});
