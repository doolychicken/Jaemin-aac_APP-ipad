(function () {
  // Every feature owns its delayed work and cancels it when it is closed/reset.
  window.createTaskScope = function () {
    const timers = new Set();
    return {
      setTimeout(callback, delay) {
        const id = window.setTimeout(() => {
          timers.delete(id);
          callback();
        }, delay);
        timers.add(id);
        return id;
      },
      clear() {
        timers.forEach((id) => window.clearTimeout(id));
        timers.clear();
      }
    };
  };

  window.appStorage = {
    warn(message) {
      const notice = document.getElementById("storageNotice");
      if (notice) {
        notice.textContent = message;
        notice.hidden = false;
      }
    },
    load(key, fallback, validate) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const value = JSON.parse(raw);
        if (!validate(value)) throw new Error("Invalid saved data");
        return value;
      } catch (_) {
        this.warn("저장된 내용을 불러오지 못했어요. 기본 내용으로 시작합니다.");
        return fallback;
      }
    },
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        this.warn("변경 내용을 저장하지 못했어요. 앱을 다시 열면 사라질 수 있습니다.");
        return false;
      }
    }
  };
})();
