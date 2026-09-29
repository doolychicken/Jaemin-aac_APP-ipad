(function () {
  const VERSION = 'v397';
  const status = document.getElementById('offlineStatus');
  const label = document.getElementById('offlineStatusText');
  const retry = document.getElementById('offlineRetry');
  let registration;
  let ready = false;
  let refreshing = false;

  function show(text, canRetry = false) {
    label.textContent = text;
    status.hidden = false;
    retry.hidden = !canRetry;
  }
  function showReady() {
    show(navigator.onLine ? '오프라인 준비 완료 · 유튜브 제외' : '오프라인 사용 중 · 유튜브 제외');
  }
  function checkStatus() {
    if (ready) showReady();
    navigator.serviceWorker.controller?.postMessage({ type: 'GET_OFFLINE_STATUS' });
  }

  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    show('현재 접속 주소에서는 오프라인 저장을 사용할 수 없어요.');
    return;
  }

  show('오프라인 준비 중 · 완료될 때까지 인터넷을 연결해 주세요');
  navigator.serviceWorker.addEventListener('message', event => {
    const data = event.data;
    if (data?.type !== 'OFFLINE_STATUS' || data.version !== VERSION) return;
    ready = !!data.ready;
    if (ready) showReady();
    else if (data.error) show('오프라인 저장을 완료하지 못했어요. 연결·저장 공간을 확인한 뒤 다시 준비해 주세요.', true);
    else if (data.total && data.completed < data.total) show(`오프라인 준비 중 ${Math.floor(data.completed / data.total * 100)}% · 인터넷을 연결해 주세요`);
    else show('오프라인 파일이 부족해요. 인터넷에 연결해서 다시 준비해 주세요.', true);
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  async function register() {
    try {
      registration = await navigator.serviceWorker.register('./sw.js?v=397', { updateViaCache: 'none' });
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'redundant') show('오프라인 저장이 중단됐어요. 인터넷에 연결해서 다시 준비해 주세요.', true);
        });
      });
      checkStatus();
      if (navigator.onLine) await registration.update();
    } catch (_) {
      if (!ready) show('오프라인 준비 상태를 확인하지 못했어요. 인터넷에 연결해서 다시 준비해 주세요.', true);
    }
  }

  retry.addEventListener('click', async () => {
    if (!navigator.onLine) { show('인터넷에 연결한 뒤 다시 준비해 주세요.', true); return; }
    show('오프라인 파일을 다시 준비하고 있어요');
    try { await navigator.storage?.persist?.(); } catch (_) {}
    await register();
    if (registration?.active?.scriptURL.endsWith('sw.js?v=397')) {
      registration.active.postMessage({ type: 'REPAIR_OFFLINE' });
    }
  });
  window.addEventListener('online', () => { checkStatus(); register(); });
  window.addEventListener('offline', checkStatus);
  window.addEventListener('load', register);
})();
