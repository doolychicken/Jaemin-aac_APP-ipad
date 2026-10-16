/* Validate authored coordinates and routes before publishing a catalog. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({window: {}});
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const file of ['sticker-book-data','home-sticker-data','storage-dress-data']) vm.runInContext(read(`js/data/${file}.js`), context);
const data = vm.runInContext(read('js/data/study-data.js') + '\n' + read('js/data/app-data.js') + '\nDATA.screens', context);
const ids = new Set(), keys = new Set(), assets = new Set();
let placements=0;
for (const book of context.window.STICKER_BOOKS) {
  assert(!ids.has(book.id), `Duplicate book ${book.id}`); ids.add(book.id);
  assert(!keys.has(book.storageKey), `Duplicate storage key ${book.id}`); keys.add(book.storageKey);
  assert(data[book.nav], `Missing book route ${book.nav}`);
  assets.add(book.room); assets.add(book.empty);
  const chapters = new Set();
  for (const chapter of book.chapters) {
    assert(!chapters.has(chapter.id), `Duplicate chapter ${book.id}/${chapter.id}`); chapters.add(chapter.id);
    const route = data[book.nav + '_' + chapter.id];
    assert(route && route.chapter === chapter.id, `Missing chapter route ${book.id}/${chapter.id}`);
    const pieces = new Set();
    for (const piece of chapter.pieces) {
      const name = `${book.id}/${chapter.id}/${piece.id}`;
      assert(!pieces.has(piece.id), `Duplicate piece ${name}`); pieces.add(piece.id);
      const [x,y,w,h] = piece.target;
      assert([x,y,w,h].every(Number.isFinite) && x>=0 && y>=0 && w>0 && h>0 && x+w<=1.001 && y+h<=1.001, `Target outside scene ${name}`);
      const [a,b,c,d] = piece.crop;
      assert(a>=0 && b>=0 && c>0 && d>0 && a+c<=piece.sheet[0] && b+d<=piece.sheet[1], `Crop outside source ${name}`);
      assets.add(piece.image); placements++;
    }
  }
  for (const activity of book.activities || []) assert(data[activity.nav], `Missing activity ${activity.nav}`);
}
for (const asset of assets) assert(fs.existsSync(path.join(root,asset)), `Missing asset ${asset}`);
console.log(`PASS: ${ids.size} books, ${placements} placements, ${assets.size} source assets; routes, bounds and save keys valid`);
