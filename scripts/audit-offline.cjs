const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const context = { self: {}, window: { addEventListener() {} }, console };
vm.createContext(context);
vm.runInContext(read('js/data/speech-manifest.js') + '\n' + read('js/core/offline-speech.js'), context);
const data = vm.runInContext(read('js/data/study-data.js') + '\n' + read('js/data/app-data.js') + '\nDATA', context);
const missing = [];
let count = 0;
const speechKeys = new Set(['label', 'speech', 'title', 'completeSpeech', 'completeLabel', 'imageLabel', 'prompt', 'command', 'placeholder']);
function walk(object, location) {
  if (!object || typeof object !== 'object') return;
  for (const [key, value] of Object.entries(object)) {
    if (speechKeys.has(key) && typeof value === 'string' && /[가-힣ㄱ-ㅎㅏ-ㅣa-z0-9]/i.test(value)) {
      count++;
      if (!context.window.offlineSpeech.plan(value)) missing.push([location + '.' + key, value]);
    }
    if (value && typeof value === 'object') walk(value, location + '.' + key);
  }
}
walk(data, 'DATA');
for (const text of ['오늘은 2026년 9월 29일 화요일입니다. 날씨는 맑음입니다.',
  '우유 아니야. 사과를 주세요', '하나로마트에 가요 완료!', '양치하기 완료했어요', '월요일 스케줄 수정',
  '11. 장애인 콜택시 타요', 'ㄱㄴㄷ']) {
  if (!context.window.offlineSpeech.plan(text)) missing.push(['dynamic', text]);
}
const swContext = {
  self: { OFFLINE_SPEECH: context.self.OFFLINE_SPEECH, registration: { scope: 'https://example.test/app/' }, addEventListener() {} },
  importScripts() {}, URL
};
const assets = vm.runInNewContext(read('sw.js') + '\nPRECACHE_ASSETS', swContext);
for (const asset of assets) if (!fs.existsSync(path.join(root, asset))) missing.push(['file', asset]);
function assetsIn(object) {
  if (!object || typeof object !== 'object') return;
  for (const value of Object.values(object)) {
    if (typeof value === 'string' && /^\.\/(images|audio|video)\//.test(value) && !assets.includes(value)) missing.push(['uncached', value]);
    if (value && typeof value === 'object') assetsIn(value);
  }
}
assetsIn(data);
if (missing.length) { console.error(JSON.stringify(missing, null, 2)); process.exitCode = 1; }
else console.log(`PASS: ${count} data speech values, dynamic sentences, and ${assets.length} offline assets`);
