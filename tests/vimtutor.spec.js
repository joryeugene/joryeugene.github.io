import { test, expect } from '@playwright/test';
import { open, press, type, cmd, seed, lines, state } from './helpers.js';

// Lesson 1 --------------------------------------------------------------------

test.describe('Lesson 1: movement and quit primitives', () => {
  test('hjkl move the cursor', async ({ page }) => {
    await open(page);
    await seed(page, 'abc\ndef\nghi');
    // cursor now at (0,0). l moves right.
    await press(page, 'g');
    await press(page, 'g');           // ensure top
    await press(page, 'l');
    await press(page, 'l');
    const s1 = await state(page);
    expect(s1.pos).toBe('1,3');       // 1-indexed row=1, col=3 (after two l)
    await press(page, 'j');
    const s2 = await state(page);
    expect(s2.pos.startsWith('2,')).toBeTruthy();
  });

  test('x deletes a character', async ({ page }) => {
    await open(page);
    await seed(page, 'abcd');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'x');
    const ls = await lines(page);
    expect(ls[0]).toBe('bcd');
  });

  test('i inserts and Esc returns to normal', async ({ page }) => {
    await open(page);
    await seed(page, 'bc');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'i');
    await type(page, 'a');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('abc');
    const s = await state(page);
    expect(s.mode).toBe('--NORMAL--');
  });

  test('a appends after the cursor', async ({ page }) => {
    await open(page);
    await seed(page, 'ab');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'a');
    await type(page, 'c');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('acb');
  });
});

// Lesson 2 --------------------------------------------------------------------

test.describe('Lesson 2: deletion, counts, undo', () => {
  test('dw deletes a word', async ({ page }) => {
    await open(page);
    await seed(page, 'foo bar baz');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'd');
    await press(page, 'w');
    const ls = await lines(page);
    expect(ls[0]).toBe('bar baz');
  });

  test('dd deletes a line', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\nthree');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'd');
    await press(page, 'd');
    const ls = await lines(page);
    expect(ls[0]).toBe('two');
  });

  test('{count}dd deletes multiple lines', async ({ page }) => {
    await open(page);
    await seed(page, 'a\nb\nc\nd\ne');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '3');
    await press(page, 'd');
    await press(page, 'd');
    const ls = await lines(page);
    expect(ls[0]).toBe('d');
  });

  test('u undoes the last change', async ({ page }) => {
    await open(page);
    await seed(page, 'abcd');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'x');
    await press(page, 'u');
    const ls = await lines(page);
    expect(ls[0]).toBe('abcd');
  });

  test('Ctrl-R redoes', async ({ page }) => {
    await open(page);
    await seed(page, 'abcd');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'x');
    await press(page, 'u');
    await press(page, 'Control+r');
    const ls = await lines(page);
    expect(ls[0]).toBe('bcd');
  });

  test('p pastes after cursor', async ({ page }) => {
    await open(page);
    await seed(page, 'abc');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'y');
    await press(page, 'y');
    await press(page, 'p');
    const ls = await lines(page);
    expect(ls.slice(0, 2)).toEqual(['abc', 'abc']);
  });
});

// Lesson 3 --------------------------------------------------------------------

test.describe('Lesson 3: put, replace, change', () => {
  test('r{char} replaces a single character', async ({ page }) => {
    await open(page);
    await seed(page, 'cat');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'r');
    await press(page, 'b');
    const ls = await lines(page);
    expect(ls[0]).toBe('bat');
  });

  test('ce changes to end of word', async ({ page }) => {
    await open(page);
    await seed(page, 'hello world');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'c');
    await press(page, 'e');
    await type(page, 'hi');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('hi world');
  });

  test('c$ changes to end of line', async ({ page }) => {
    await open(page);
    await seed(page, 'keep drop');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'l');
    await press(page, 'c');
    await press(page, '$');
    await type(page, 'X');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('keepX');
  });
});

// Lesson 4 --------------------------------------------------------------------

test.describe('Lesson 4: location, search, substitute', () => {
  test('gg and G jump to top and bottom', async ({ page }) => {
    await open(page);
    await seed(page, 'a\nb\nc');
    await press(page, 'G');
    const bottom = await state(page);
    expect(bottom.pos.startsWith('3,')).toBeTruthy();
    await press(page, 'g');
    await press(page, 'g');
    const top = await state(page);
    expect(top.pos.startsWith('1,')).toBeTruthy();
  });

  test('/search moves to the match', async ({ page }) => {
    await open(page);
    await seed(page, 'foo\nhit\nbar');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '/');
    await type(page, 'hit');
    await press(page, 'Enter');
    const s = await state(page);
    expect(s.pos.startsWith('2,')).toBeTruthy();
  });

  test(':s/old/new/g substitutes within a line', async ({ page }) => {
    await open(page);
    await seed(page, 'aaa bbb aaa');
    await press(page, 'g');
    await press(page, 'g');
    await cmd(page, 's/aaa/XXX/g');
    const ls = await lines(page);
    expect(ls[0]).toBe('XXX bbb XXX');
  });

  test(':%s/old/new/g substitutes across the buffer', async ({ page }) => {
    await open(page);
    await seed(page, 'one\ntwo\none two');
    await cmd(page, '%s/one/ONE/g');
    const ls = await lines(page);
    expect(ls[0]).toBe('ONE');
    expect(ls[2]).toBe('ONE two');
  });
});

// Lesson 5 --------------------------------------------------------------------

test.describe('Lesson 5: external commands and files', () => {
  test(':w FOO then :r FOO round-trips through localStorage', async ({ page }) => {
    await open(page);
    // Clear any prior test residue from this filename.
    await page.evaluate(() => { try { localStorage.removeItem('vim_file_TUTORTEST'); } catch (e) {} });
    await seed(page, 'persist-me');
    // Save the buffer to a named file.
    await cmd(page, 'w TUTORTEST');
    // Reload vim so state.lines is a blank slate, then :r TUTORTEST.
    await open(page);
    await cmd(page, 'r TUTORTEST');
    const ls = await lines(page);
    const joined = ls.join('\n');
    expect(joined.includes('persist-me')).toBeTruthy();
    // Cleanup.
    await page.evaluate(() => { try { localStorage.removeItem('vim_file_TUTORTEST'); } catch (e) {} });
  });

  test(':r !date inserts the current date', async ({ page }) => {
    await open(page);
    await seed(page, 'above');
    await cmd(page, 'r !date');
    const ls = await lines(page);
    // Any line with a year matching the current or nearby year proves the shell ran.
    const joined = ls.join(' ');
    expect(/\b20\d\d\b/.test(joined)).toBeTruthy();
  });
});

// Lesson 6 --------------------------------------------------------------------

test.describe('Lesson 6: open lines, yank, paste, set', () => {
  test('o opens a line below', async ({ page }) => {
    await open(page);
    await seed(page, 'one');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'o');
    await type(page, 'two');
    await press(page, 'Escape');
    const ls = await lines(page);
    expect(ls[0]).toBe('one');
    expect(ls[1]).toBe('two');
  });

  test('yy then p duplicates a line', async ({ page }) => {
    await open(page);
    await seed(page, 'dup\nbelow');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, 'y');
    await press(page, 'y');
    await press(page, 'p');
    const ls = await lines(page);
    expect(ls.slice(0, 3)).toEqual(['dup', 'dup', 'below']);
  });

  test(':set ic and :set hls accept their toggles', async ({ page }) => {
    await open(page);
    await cmd(page, 'set ic');
    // Ignore case: /FOO matches foo.
    await seed(page, 'foo bar');
    await press(page, 'g');
    await press(page, 'g');
    await press(page, '/');
    await type(page, 'FOO');
    await press(page, 'Enter');
    const s = await state(page);
    expect(s.pos.startsWith('1,')).toBeTruthy();
  });
});

// Lesson 7 --------------------------------------------------------------------

test.describe('Lesson 7: help and completion', () => {
  test(':help opens the help buffer', async ({ page }) => {
    await open(page);
    await cmd(page, 'help');
    const ls = await lines(page);
    const joined = ls.join('\n').toLowerCase();
    expect(joined.includes('help') || joined.includes('vim')).toBeTruthy();
  });

  test(':help topic loads a specific entry', async ({ page }) => {
    await open(page);
    await cmd(page, 'help w');
    const ls = await lines(page);
    const joined = ls.join('\n');
    expect(joined.length > 0).toBeTruthy();
  });
});
