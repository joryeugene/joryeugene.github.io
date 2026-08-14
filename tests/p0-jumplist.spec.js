import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

async function delayedBlog(page, url, body) {
  let release;
  let markRequested;
  let markFulfilled;
  const gate = new Promise(resolve => { release = resolve; });
  const requested = new Promise(resolve => { markRequested = resolve; });
  const fulfilled = new Promise(resolve => { markFulfilled = resolve; });

  await page.route(url, async route => {
    markRequested();
    await gate;
    await route.fulfill({ status: 200, contentType: 'text/plain', body });
    markFulfilled();
  });

  return { release, requested, fulfilled };
}

async function settleFetch(page, request) {
  request.release();
  await request.fulfilled;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test.describe('P0 jumplist', () => {
  test('search, Ctrl-O, Ctrl-I, and Tab traverse significant jumps', async ({ page }) => {
    await open(page);
    await seed(page, 'start\nmiddle target\nend target');

    await press(page, '/');
    await type(page, 'target');
    await press(page, 'Enter');
    expect((await state(page)).pos).toBe('2,8');

    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'Control+i');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+o');
    await press(page, 'Tab');
    expect((await state(page)).pos).toBe('2,8');
    await press(page, 'Control+i');
    await expect(page.locator('#vim-cmdline')).toContainText('E663: At end of jumplist');
  });

  test('Visual mode survives Ctrl-O and Tab traversal', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');
    await press(page, 'v');

    await press(page, 'Control+o');
    expect((await state(page)).mode).toContain('VISUAL');
    expect((await state(page)).pos).toBe('1,1');
    await press(page, 'Tab');
    expect((await state(page)).mode).toContain('VISUAL');
    expect((await state(page)).pos).toBe('3,1');
  });

  test('jumplist keeps only the newest 100 entries', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await cmd(page, 'clearjumps');

    for (let i = 0; i < 51; i++) {
      await press(page, 'G', 0);
      await press(page, 'g', 0); await press(page, 'g', 0);
    }
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries).toHaveLength(100);
  });

  test('ordinary motions do not enter the jumplist', async ({ page }) => {
    await open(page);
    await seed(page, 'one two\nthree four\nfive six\nseven eight');
    await cmd(page, 'clearjumps');
    await press(page, '2'); await press(page, 'j');
    await press(page, 'k'); await press(page, 'l'); await press(page, 'h');
    await press(page, 'w'); await press(page, 'b');
    const before = (await state(page)).pos;
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe(before);
    await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
  });

  test('counts traverse jumps and do not leak', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, '3'); await press(page, 'G');

    await press(page, '2'); await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('5,1');
    await press(page, '2'); await press(page, 'Control+i');
    expect((await state(page)).pos).toBe('3,1');
    await press(page, '2'); await press(page, 'j');
    expect((await state(page)).pos).toBe('5,1');
  });

  test('saved jump rows follow inserted and deleted lines', async ({ page }) => {
    await open(page);
    await seed(page, 'top\nanchor\nbottom');
    await press(page, '/'); await type(page, 'anchor'); await press(page, 'Enter');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');

    await press(page, 'o'); await type(page, 'inserted'); await press(page, 'Escape');
    await press(page, 'G');
    await press(page, '3'); await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('3,1');
    expect((await lines(page))[2]).toBe('anchor');

    await press(page, 'g'); await press(page, 'g');
    await press(page, 'd'); await press(page, 'd');
    await press(page, 'G');
    await press(page, '2'); await press(page, 'Control+o');
    expect((await lines(page))[(parseInt((await state(page)).pos, 10) - 1)]).toBe('anchor');
  });

  test('multi-line characterwise delete collapses saved rows onto the merged line', async ({ page }) => {
    await open(page);
    await seed(page, '(\ninside\n)');
    await press(page, '/'); await type(page, 'inside'); await press(page, 'Enter');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'k'); await press(page, 'k');

    await press(page, 'd'); await press(page, '%');
    expect(await lines(page)).toHaveLength(1);
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatch(/^>\s+0\s+1\s+/);
  });

  test('multi-line characterwise change collapses saved rows onto the merged line', async ({ page }) => {
    await open(page);
    await seed(page, '(\ninside\n)');
    await press(page, '/'); await type(page, 'inside'); await press(page, 'Enter');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'k'); await press(page, 'k');

    await press(page, 'c'); await press(page, '%');
    await type(page, 'changed'); await press(page, 'Escape');
    expect(await lines(page)).toHaveLength(1);
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatch(/^>\s+0\s+1\s+/);
  });

  test('row adjustments deduplicate consecutive saved jump lines', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'j');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, 'j');

    await press(page, 'd'); await press(page, 'd');
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatch(/^>\s+0\s+2\s+/);
  });

  test('undo and redo keep jump rows distinct across multi-line substitution', async ({ page }) => {
    await open(page);
    await seed(page, 'foo one\nmiddle\nfoo three');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');

    await cmd(page, '%s/foo/bar/');
    expect(await lines(page)).toEqual(['bar one', 'middle', 'bar three']);
    await press(page, 'u');
    expect(await lines(page)).toEqual(['foo one', 'middle', 'foo three']);
    await press(page, 'Control+r');
    expect(await lines(page)).toEqual(['bar one', 'middle', 'bar three']);

    await cmd(page, 'jumps');
    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries.some(line => /^\s+\S+\s+1\s+/.test(line))).toBe(true);
    expect(entries.some(line => /^\s+\S+\s+3\s+/.test(line))).toBe(true);
  });

  test('undo and redo replay disjoint global-delete row transforms exactly', async ({ page }) => {
    await open(page);
    await seed(page, 'keep a\ndrop one\nkeep b\ndrop two\nkeep c');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, '3'); await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');

    await cmd(page, 'g/drop/d');
    expect(await lines(page)).toEqual(['keep a', 'keep b', 'keep c']);
    await press(page, 'u');
    expect(await lines(page)).toEqual(['keep a', 'drop one', 'keep b', 'drop two', 'keep c']);
    await press(page, 'Control+r');
    expect(await lines(page)).toEqual(['keep a', 'keep b', 'keep c']);
    await press(page, 'u');

    await cmd(page, 'jumps');
    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries.some(line => /^\s+\S+\s+1\s+/.test(line))).toBe(true);
    expect(entries.some(line => /^\s+\S+\s+3\s+/.test(line))).toBe(true);
    expect(entries.some(line => /^\s+\S+\s+5\s+/.test(line))).toBe(true);
  });

  test('whole-buffer deletion leaves one valid deduplicated jump row', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');

    await press(page, 'd'); await press(page, 'G');
    const deleted = await lines(page);
    expect(deleted).toHaveLength(1);
    expect(deleted[0].trim()).toBe('');
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatch(/^>\s+0\s+1\s+/);
    await press(page, 'u');
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
  });

  test(':sort u leaves every inspected and traversed jump row valid', async ({ page }) => {
    await open(page);
    await seed(page, 'a\na\nz');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, '2'); await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');

    await cmd(page, 'sort u');
    expect(await lines(page)).toEqual(['a', 'z']);
    await cmd(page, 'jumps');

    const entries = (await lines(page)).filter(line => line.includes('untitled.txt'));
    const rows = entries.map(line => Number(line.match(/^[ >]\s+-?\d+\s+(\d+)\s+/)?.[1]));
    expect(rows.every(row => row >= 1 && row <= 2)).toBe(true);
    expect(rows.some((row, index) => index > 0 && row === rows[index - 1])).toBe(false);
    await press(page, 'u');
    await press(page, '2'); await press(page, 'Control+o');
    expect(parseInt((await state(page)).pos, 10)).toBeLessThanOrEqual(2);
  });

  test('a new jump after Ctrl-O preserves newer entries', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, 'Control+o');
    await press(page, '3'); await press(page, 'G');
    await press(page, '2'); await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('1,1');
  });

  test('a tail-deduplicated departure resumes traversal from the newest entry', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await cmd(page, 'clearjumps');
    await press(page, 'G');
    await press(page, 'g'); await press(page, 'g');
    await press(page, '3'); await press(page, 'G');
    await press(page, 'Control+o');
    await press(page, '2'); await press(page, 'j');

    await press(page, 'G');
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe('3,1');
  });

  test('Ctrl-O cancels a pending operator before the next motion', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');

    await press(page, 'd');
    await press(page, 'Control+o');
    await press(page, 'j');

    expect(await lines(page)).toEqual(['one', 'two', 'three']);
    expect((await state(page)).pos).toBe('2,1');
  });

  test('Ctrl-O cancels a pending single-key command before the next edit', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');

    await press(page, 'r');
    await press(page, 'Control+o');
    await press(page, 'x');

    expect((await lines(page))[0]).toBe('ne');
  });

  test('Ctrl-O cancels a pending bracket chord before the next chord', async ({ page }) => {
    await open(page);
    await seed(page, 'start\n{ section\nend');
    await press(page, 'G');

    await press(page, '[');
    await press(page, 'Control+o');
    await press(page, ']'); await press(page, ']');

    expect((await state(page)).pos).toBe('2,1');
  });

  test('Ctrl-O cancels a pending g chord before the next g key', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree\nfour\nfive');
    await press(page, '2'); await press(page, 'j');
    await press(page, 'G');

    await press(page, 'g');
    await press(page, 'Control+o');
    await press(page, 'g');

    expect((await state(page)).pos).toBe('3,1');
  });

  test('Ctrl-O and Ctrl-I restore edited browser documents', async ({ page }) => {
    await open(page);
    await seed(page, 'beta one\nbeta two');
    await cmd(page, 'w beta');

    await cmd(page, 'enew');
    await press(page, 'i'); await type(page, 'alpha one\nalpha two'); await press(page, 'Escape');
    await cmd(page, 'w alpha');
    await press(page, 'G');
    await press(page, 'A'); await type(page, ' unsaved'); await press(page, 'Escape');

    await cmd(page, 'e beta');

    await press(page, 'Control+o');
    expect((await state(page)).file).toContain('alpha');
    expect(await lines(page)).toEqual(['alpha one', 'alpha two unsaved']);
    expect((await state(page)).pos).toBe('2,17');

    await press(page, 'Control+i');
    expect((await state(page)).file).toContain('beta');
    expect(await lines(page)).toEqual(['beta one', 'beta two']);
  });

  test('undo saves a help document so Ctrl-O can return to it', async ({ page }) => {
    await open(page);
    await seed(page, 'source one\nsource two');
    await cmd(page, 'clearjumps');

    await cmd(page, 'help');
    await press(page, 'G');
    await press(page, 'u');
    expect(await lines(page)).toEqual(['source one', 'source two']);

    await press(page, 'Control+o');
    expect((await state(page)).file).toContain('[Help]');
    await expect(page.locator('#vim-cmdline')).not.toContainText('E92');
  });

  test('save-as migrates undo snapshots and remains reachable after undo', async ({ page }) => {
    await open(page);
    await seed(page, 'source');
    await press(page, 'A'); await type(page, 'x'); await press(page, 'Escape');
    await cmd(page, 'w renamed-source');

    await press(page, 'u');
    expect(await lines(page)).toEqual(['source']);
    expect((await state(page)).file).toContain('renamed-source');

    await cmd(page, 'enew');
    await press(page, 'Control+o');
    expect((await state(page)).file).toContain('renamed-source');
    await expect(page.locator('#vim-cmdline')).not.toContainText('E92');
  });

  test('a delayed :e response cannot replace a document opened while it was pending', async ({ page }) => {
    await open(page);
    await seed(page, 'source one\nsource two');
    const request = await delayedBlog(page, '**/blog/calmhive/calmhive.md', 'delayed blog');

    await cmd(page, 'e calmhive');
    await request.requested;
    await cmd(page, 'enew');
    await press(page, 'i'); await type(page, 'new document'); await press(page, 'Escape');
    await settleFetch(page, request);

    expect((await state(page)).file).toContain('untitled.txt');
    expect(await lines(page)).toEqual(['new document']);
    await press(page, 'Control+o');
    expect(await lines(page)).toEqual(['source one', 'source two']);
    await press(page, 'Control+i');
    expect(await lines(page)).toEqual(['new document']);
  });

  test('a pending :e keeps its renamed source reachable when it completes', async ({ page }) => {
    await open(page);
    await seed(page, 'source one\nsource two');
    const request = await delayedBlog(page, '**/blog/calmhive/calmhive.md', 'delayed blog');

    await cmd(page, 'e calmhive');
    await request.requested;
    await cmd(page, 'w renamed-source');
    await settleFetch(page, request);

    expect((await state(page)).file).toContain('calmhive.md');
    await press(page, 'Control+o');
    expect((await state(page)).file).toContain('renamed-source');
    expect(await lines(page)).toEqual(['source one', 'source two']);
    await expect(page.locator('#vim-cmdline')).not.toContainText('E92');
  });

  test(':w name keeps existing jumps attached to the renamed document', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');

    await cmd(page, 'w beta');
    await press(page, 'Control+o');

    expect((await state(page)).file).toContain('beta');
    expect((await state(page)).pos).toBe('1,1');
    expect(await lines(page)).toEqual(['one', 'two', 'three']);
  });

  test(':jumps displays entries and :clearjumps resets traversal', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'G');
    await cmd(page, 'jumps');
    await expect(page.locator('#vim-content')).toContainText('jump line  col file');
    await expect(page.locator('#vim-content')).toContainText('untitled.txt');
    await press(page, 'u');
    await cmd(page, 'clearjumps');
    const before = (await state(page)).pos;
    await press(page, 'Control+o');
    expect((await state(page)).pos).toBe(before);
    await expect(page.locator('#vim-cmdline')).toContainText('E662: At start of jumplist');
  });
});
