(function () {
  const app = document.getElementById("app");
  const hero = document.getElementById("hero");
  const pagebar = document.getElementById("pagebar");
  const pageTitle = document.getElementById("pageTitle");
  const backBtn = document.getElementById("backBtn");

  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  const DATA = window.APP_DATA;

  // ---------- 小工具 ----------
  function htmlesc(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setHeaderMode(mode, title) {
  if (mode === "home") {
    hero.hidden = false;
    pagebar.hidden = true;
    pageTitle.textContent = ""; // ✅ 回首页清空标题
    document.title = "产品展示";
  } else {
    hero.hidden = true;
    pagebar.hidden = false;
    pageTitle.textContent = title || "";
    document.title = title ? `${title} - 产品展示` : "产品展示";
  }
}


  function go(hash) {
    window.location.hash = hash;
  }

  function findCategory(catId) {
    return DATA.categories.find((c) => c.id === catId) || null;
  }

  function findProduct(productId) {
    for (const c of DATA.categories) {
      const p = c.products.find((x) => x.id === productId);
      if (p) return { category: c, product: p };
    }
    return null;
  }

  // ---------- 轮播 ----------
  let slideIndex = 0;
  let timer = null;

  function renderCarousel() {
    if (!track || !dotsWrap) return;

    track.innerHTML = DATA.banners
      .map(
        (b) => `
        <div class="slide">
          <img src="${htmlesc(b.img)}" alt="${htmlesc(b.alt || "")}" loading="lazy" />
        </div>
      `
      )
      .join("");

    dotsWrap.innerHTML = DATA.banners
      .map((_, i) => `<div class="dot ${i === 0 ? "active" : ""}" data-i="${i}"></div>`)
      .join("");

    dotsWrap.addEventListener("click", (e) => {
      const dot = e.target.closest(".dot");
      if (!dot) return;
      const i = Number(dot.dataset.i);
      if (Number.isFinite(i)) {
        slideIndex = i;
        updateCarousel();
        restartAuto();
      }
    });

    btnPrev.addEventListener("click", () => {
      slideIndex = (slideIndex - 1 + DATA.banners.length) % DATA.banners.length;
      updateCarousel();
      restartAuto();
    });
    btnNext.addEventListener("click", () => {
      slideIndex = (slideIndex + 1) % DATA.banners.length;
      updateCarousel();
      restartAuto();
    });

    // 简单触摸滑动
    const viewport = document.getElementById("carouselViewport");
    let startX = 0;
    let dx = 0;
    let touching = false;

    viewport.addEventListener("touchstart", (e) => {
      touching = true;
      startX = e.touches[0].clientX;
      dx = 0;
    });
    viewport.addEventListener("touchmove", (e) => {
      if (!touching) return;
      dx = e.touches[0].clientX - startX;
    });
    viewport.addEventListener("touchend", () => {
      touching = false;
      if (Math.abs(dx) > 40) {
        if (dx > 0) {
          slideIndex = (slideIndex - 1 + DATA.banners.length) % DATA.banners.length;
        } else {
          slideIndex = (slideIndex + 1) % DATA.banners.length;
        }
        updateCarousel();
        restartAuto();
      }
    });

    updateCarousel();
    startAuto();
  }

  function updateCarousel() {
    const w = track.clientWidth; // track 宽度 = viewport 宽 * slides
    const vw = w / DATA.banners.length || 0;
    track.style.transform = `translateX(${-slideIndex * vw}px)`;

    const dots = dotsWrap.querySelectorAll(".dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === slideIndex));
  }

  function startAuto() {
    stopAuto();
    timer = setInterval(() => {
      slideIndex = (slideIndex + 1) % DATA.banners.length;
      updateCarousel();
    }, 3500);
  }
  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAuto() {
    startAuto();
  }

  window.addEventListener("resize", () => {
    // 防止 resize 后位移不对
    updateCarousel();
  });

  // ---------- 页面渲染 ----------
  function renderHome() {
    setHeaderMode("home");
    const html = `
      <section class="grid" aria-label="产品类型">
        <div class="grid-items">
          ${DATA.categories
            .map(
              (c) => `
              <a class="grid-item" href="#/category/${htmlesc(c.id)}">
                <div class="iconbox" aria-hidden="true">
                  <div style="font-size:22px">${htmlesc(c.icon || "📦")}</div>
                </div>
                <div class="grid-title">${htmlesc(c.title)}</div>
                <div class="grid-sub">${htmlesc(c.subtitle || "")}</div>
              </a>
            `
            )
            .join("")}
        </div>
      </section>
    `;
    app.innerHTML = html;
  }

  function renderCategory(catId) {
    const cat = findCategory(catId);
    if (!cat) {
      renderNotFound("未找到该产品类型");
      return;
    }
    setHeaderMode("inner", cat.title);

    const html = `
      <section class="list" aria-label="${htmlesc(cat.title)} 产品列表">
        ${cat.products
          .map(
            (p) => `
            <a class="list-item" href="#/product/${htmlesc(p.id)}">
              <div class="thumb">${htmlesc((cat.title || "").slice(0, 2) || "产品")}</div>
              <div class="li-main">
                <div class="li-title">${htmlesc(p.name)}</div>
                <div class="li-desc">${htmlesc(p.desc || "")}</div>
              </div>
              <div class="chev">›</div>
            </a>
          `
          )
          .join("")}
      </section>
    `;
    app.innerHTML = html;
  }

  function renderProduct(productId) {
    const result = findProduct(productId);
    if (!result) {
      renderNotFound("未找到该产品");
      return;
    }
    const { category, product } = result;
    setHeaderMode("inner", product.name);

    // 注意：移动端 H5 视频建议 mp4(H.264/AAC)；iOS 需要用户点击播放，controls 就够用了
    const html = `
      <section class="card">
        <div class="h1">${htmlesc(product.name)}</div>
        <p class="p">${htmlesc(product.desc || "")}</p>

        <div class="video" aria-label="产品视频">
          <video
            src="${htmlesc(product.video)}"
            controls
            playsinline
            webkit-playsinline
            preload="metadata"
          ></video>
        </div>

        <div class="btnrow">
          <a class="btn primary" href="${htmlesc(product.pdf)}" download>
            下载 PDF
          </a>
          <a class="btn ghost" href="#/category/${htmlesc(category.id)}">
            返回分类
          </a>
        </div>
      </section>
    `;
    app.innerHTML = html;
  }

  function renderNotFound(msg) {
    setHeaderMode("inner", "提示");
    app.innerHTML = `
      <section class="card">
        <div class="h1">页面不存在</div>
        <p class="p">${htmlesc(msg || "请返回首页重试")}</p>
        <div class="btnrow">
          <a class="btn primary" href="#/">返回首页</a>
          <a class="btn ghost" href="javascript:history.back()">返回上一页</a>
        </div>
      </section>
    `;
  }

  // ---------- Hash 路由 ----------
  function parseHash() {
    // 支持：
    // #/                 首页
    // #/category/:id      分类页
    // #/product/:id       详情页
    const h = (window.location.hash || "#/").replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);

    if (parts.length === 0) return { name: "home" };
    if (parts[0] === "category" && parts[1]) return { name: "category", id: parts[1] };
    if (parts[0] === "product" && parts[1]) return { name: "product", id: parts[1] };
    return { name: "notfound" };
  }

  function router() {
    const r = parseHash();
    if (r.name === "home") renderHome();
    else if (r.name === "category") renderCategory(r.id);
    else if (r.name === "product") renderProduct(r.id);
    else renderNotFound("路由无效");
  }

  // 返回按钮逻辑
  backBtn.addEventListener("click", () => {
  history.back();
  setTimeout(() => {
    if (!location.hash || location.hash === "#") location.hash = "#/";
  }, 0);
});


  window.addEventListener("hashchange", router);

  // ---------- 初始化 ----------
  // 默认进首页
  if (!window.location.hash || window.location.hash !== "#/") {
  window.location.replace("#/");
}
  renderCarousel();
  router();
})();

