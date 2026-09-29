// Run with Node.js. No network services or private text uploads are used.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const normalize = text => String(text).normalize('NFC').toLowerCase().replace(/[①-⑳]/g, ch => String(ch.charCodeAt(0) - 0x2460 + 1))
  .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
const phrases = new Set();
function add(text) {
  if (typeof text !== 'string' || text.length > 120 || /[<>{}=;]|https?:|\.\//.test(text)) return;
  const clean = normalize(text);
  if (clean && clean !== 'ㄱㄴㄷ' && /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(clean)) phrases.add(clean);
}
const data = vm.runInNewContext(read('js/data/study-data.js') + '\n' + read('js/data/app-data.js') + '\nDATA');
const spokenKeys = new Set(['label', 'speech', 'title', 'completeSpeech', 'completeLabel', 'imageLabel', 'prompt', 'command', 'placeholder']);
function walk(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (spokenKeys.has(key)) add(child);
    if (child && typeof child === 'object') walk(child);
  }
}
walk(data);
const sourceFiles = ['js/main.js', ...fs.readdirSync(path.join(root, 'js/features')).filter(n => n.endsWith('.js')).map(n => 'js/features/' + n)];
for (const file of sourceFiles) {
  const source = read(file);
  for (const match of source.matchAll(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g)) {
    try { add(vm.runInNewContext(match[0])); } catch (_) {}
  }
  for (const match of source.matchAll(/`([^`]+)`/g)) {
    for (const part of match[1].split(/\$\{[^}]*\}/g)) add(part);
  }
}
for (let n = 0; n <= 100; n++) phrases.add(String(n));
for (let n = 2000; n <= 2100; n++) { phrases.add(String(n)); phrases.add(n + '년'); }
for (let n = 1; n <= 31; n++) phrases.add(n + '일');
for (let n = 1; n <= 12; n++) phrases.add(n + '월');
for (const word of ['오늘은', '날씨는', '입니다', '이에요', '에요', '완료', '완료했어요', '사요', '에 가요', '을 주세요', '를 주세요', '아니야', '정답', '자리']) add(word);
// Dynamic sentences can be assembled from recorded words; syllables are a last
// resort for the finite vocabulary shipped with the app, never silent omissions.
for (const text of [...phrases]) {
  for (const word of text.split(' ')) if (word) phrases.add(word);
  for (const char of text) if (/[가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]/.test(char)) phrases.add(char);
}
const output = [...phrases].sort();
fs.mkdirSync(path.join(root, '_local/speech'), { recursive: true });
fs.writeFileSync(path.join(root, '_local/speech/catalog.json'), JSON.stringify(output, null, 2));
console.log(`Speech catalog: ${output.length} phrases and sentence components`);
