(function () {
  function getDefaultPageSize() {
    const w = window.innerWidth || document.documentElement.clientWidth || 1024;
    const h = window.innerHeight || document.documentElement.clientHeight || 768;
    return Math.min(w, h) < 700 ? 4 : 6;
  }

  function hasManualPager(items) {
    return (items || []).some((item) => item && (item.label === "다음" || item.label === "이전"));
  }

  function createPagerButton(label, onClick) {
    const btn = document.createElement("button");
    btn.className = "tile tile-nav";
    btn.type = "button";

    const lbl = document.createElement("div");
    lbl.className = "tile-label";
    lbl.textContent = label;
    btn.appendChild(lbl);
    btn.addEventListener("click", onClick);
    return btn;
  }

  function createTilePager(options) {
    const pageByKey = {};
    const getScopeKey = options.getScopeKey || (() => "");
    const getPageSize = options.getPageSize || getDefaultPageSize;
    const render = options.render;
    const speak = options.speak || function () {};

    function stateKey(suffix) {
      const scope = getScopeKey();
      return `${scope}${suffix ? ":" + suffix : ""}`;
    }

    function reset(prefix) {
      Object.keys(pageByKey).forEach((key) => {
        if (!prefix || key.startsWith(prefix)) delete pageByKey[key];
      });
    }

    function paginate(items, suffix, options = {}) {
      const list = items || [];
      const pageSize = Math.max(1, getPageSize(options.layout || "main") - (options.reserveSlots || 0));
      const key = stateKey(suffix || "");

      if (list.length <= pageSize || hasManualPager(list)) {
        pageByKey[key] = 0;
        return { items: list, page: 0, totalPages: 1, key, paged: false };
      }

      const firstPageCapacity = Math.max(1, pageSize - 1);
      const middlePageCapacity = Math.max(1, pageSize - 2);
      const pageStarts = [];
      let start = 0;
      let pageIndex = 0;

      while (start < list.length) {
        pageStarts.push(start);
        start += pageIndex === 0 ? firstPageCapacity : middlePageCapacity;
        pageIndex += 1;
      }

      const totalPages = pageStarts.length;
      const page = Math.min(pageByKey[key] || 0, totalPages - 1);
      pageByKey[key] = page;

      const end = page + 1 < totalPages ? pageStarts[page + 1] : list.length;
      return { items: list.slice(pageStarts[page], end), page, totalPages, key, paged: true };
    }

    function append(container, pageInfo) {
      if (!pageInfo || !pageInfo.paged) return;

      if (pageInfo.page > 0) {
        container.appendChild(createPagerButton("이전", () => {
          speak("이전");
          pageByKey[pageInfo.key] = pageInfo.page - 1;
          render();
        }));
      }

      if (pageInfo.page < pageInfo.totalPages - 1) {
        container.appendChild(createPagerButton("다음", () => {
          speak("다음");
          pageByKey[pageInfo.key] = pageInfo.page + 1;
          render();
        }));
      }
    }

    return { paginate, append, reset };
  }

  window.createTilePager = createTilePager;
})();
