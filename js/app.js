(function () {
  "use strict";

  // ========== DOM 元素 ==========
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

  // ========== 状态管理 ==========
  let currentRoute = { name: "home" };
  let history = [];

  // ========== 工具函数 ==========
  function htmlesc(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Loading 状态管理
  function showLoading() {
    const existing = document.querySelector(".loading-overlay");
    if (existing) return;

    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    const overlay = document.querySelector(".loading-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 200);
    }
  }

  // 模拟异步加载（可根据实际需求调整）
  function simulateLoading(callback, delay = 150) {
    showLoading();
    setTimeout(() => {
      callback();
      hideLoading();
    }, delay);
  }

  // 页面头部模式切换（修复 bug）
  function setHeaderMode(mode, title) {
    if (mode === "home") {
      hero.hidden = false;
      pagebar.hidden = true;
      pageTitle.textContent = "";
      document.title = "产品展示 - WACKER";
    } else {
      hero.hidden = true;
      pagebar.hidden = false;
      pageTitle.textContent = title || "";
      document.title = title ? `${title} - WACKER` : "产品展示 - WACKER";
    }
  }

  // 路由导航
  function go(hash) {
    window.location.hash = hash;
  }

  // 数据查询
  function findCategory(catId) {
    const productsNav = DATA.mainNav.find(nav => nav.id === "products");
    if (!productsNav || !productsNav.categories) return null;
    return productsNav.categories.find((c) => c.id === catId) || null;
  }

  function findProduct(productId) {
    const productsNav = DATA.mainNav.find(nav => nav.id === "products");
    if (!productsNav || !productsNav.categories) return null;
    
    for (const c of productsNav.categories) {
      const p = c.products.find((x) => x.id === productId);
      if (p) return { category: c, product: p };
    }
    return null;
  }

  // 平滑滚动到顶部
  function scrollToTop(smooth = true) {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Haptic Feedback（iOS支持）
  function hapticFeedback(style = "light") {
    if (window.navigator && window.navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      window.navigator.vibrate(patterns[style] || patterns.light);
    }
  }

  // 底部导航栏控制
  function updateBottomNav() {
    const navBack = document.getElementById("navBack");
    const navHome = document.getElementById("navHome");
    
    if (!navBack || !navHome) return;
    
    // 首页：只显示首页按钮（高亮）
    if (currentRoute.name === "home") {
      navBack.style.display = "none";
      navHome.classList.add("active");
    } 
    // 其他页面：显示首页+返回按钮
    else {
      navBack.style.display = "flex";
      navHome.classList.remove("active");
    }
  }

  // ========== 轮播功能优化 ==========
  let slideIndex = 0;
  let timer = null;
  let isCarouselReady = false;

  function renderCarousel() {
    if (!track || !dotsWrap || !DATA.banners.length) return;

    // 预加载首图
    const firstImg = new Image();
    firstImg.src = DATA.banners[0].img;

    track.innerHTML = DATA.banners
      .map(
        (b, i) => `
        <div class="slide">
          <img 
            src="${htmlesc(b.img)}" 
            alt="${htmlesc(b.alt || "")}" 
            loading="${i === 0 ? "eager" : "lazy"}"
            decoding="async"
          />
        </div>
      `
      )
      .join("");

    dotsWrap.innerHTML = DATA.banners
      .map((_, i) => `<div class="dot ${i === 0 ? "active" : ""}" data-i="${i}"></div>`)
      .join("");

    // 点指示器点击
    dotsWrap.addEventListener("click", (e) => {
      const dot = e.target.closest(".dot");
      if (!dot) return;
      const i = Number(dot.dataset.i);
      if (Number.isFinite(i)) {
        slideIndex = i;
        updateCarousel();
        restartAuto();
        hapticFeedback("light");
      }
    });

    // 按钮控制
    btnPrev.addEventListener("click", () => {
      slideIndex = (slideIndex - 1 + DATA.banners.length) % DATA.banners.length;
      updateCarousel();
      restartAuto();
      hapticFeedback("medium");
    });

    btnNext.addEventListener("click", () => {
      slideIndex = (slideIndex + 1) % DATA.banners.length;
      updateCarousel();
      restartAuto();
      hapticFeedback("medium");
    });

    // 触摸滑动优化
    const viewport = document.getElementById("carouselViewport");
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let touching = false;
    let moved = false;

    viewport.addEventListener("touchstart", (e) => {
      touching = true;
      moved = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dx = 0;
      dy = 0;
      stopAuto();
    });

    viewport.addEventListener("touchmove", (e) => {
      if (!touching) return;
      dx = e.touches[0].clientX - startX;
      dy = e.touches[0].clientY - startY;
      
      // 判断是否为横向滑动
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
        moved = true;
      }
    });

    viewport.addEventListener("touchend", () => {
      touching = false;
      if (moved && Math.abs(dx) > 50) {
        if (dx > 0) {
          slideIndex = (slideIndex - 1 + DATA.banners.length) % DATA.banners.length;
        } else {
          slideIndex = (slideIndex + 1) % DATA.banners.length;
        }
        updateCarousel();
        hapticFeedback("medium");
      }
      restartAuto();
    });

    isCarouselReady = true;
    updateCarousel();
    startAuto();
  }

  function updateCarousel() {
    if (!isCarouselReady) return;

    const vw = track.parentElement.clientWidth;
    track.style.transform = `translateX(${-slideIndex * vw}px)`;

    const dots = dotsWrap.querySelectorAll(".dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === slideIndex));
  }

  function startAuto() {
    if (DATA.banners.length <= 1) return;
    stopAuto();
    timer = setInterval(() => {
      slideIndex = (slideIndex + 1) % DATA.banners.length;
      updateCarousel();
    }, 4000); // 增加到4秒，体验更好
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function restartAuto() {
    startAuto();
  }

  // 响应式更新
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateCarousel();
    }, 100);
  });

  // ========== 页面渲染 ==========

  // 首页
  function renderHome() {
    simulateLoading(() => {
      setHeaderMode("home");
      const html = `
        <section class="grid" aria-label="网站导航">
          <div class="grid-items">
            ${DATA.mainNav
              .map(
                (nav) => `
                <a class="grid-item" href="#/nav/${htmlesc(nav.id)}" aria-label="进入${htmlesc(nav.title)}">
                  <div class="iconbox" aria-hidden="true">
                    <div style="font-size:22px">${htmlesc(nav.icon || "📦")}</div>
                  </div>
                  <div class="grid-title">${htmlesc(nav.title)}</div>
                  <div class="grid-sub">${htmlesc(nav.subtitle || "")}</div>
                </a>
              `
              )
              .join("")}
          </div>
        </section>
      `;
      app.innerHTML = html;
      scrollToTop(false);
      
      // 添加点击反馈
      document.querySelectorAll(".grid-item").forEach((item) => {
        item.addEventListener("click", () => hapticFeedback("medium"));
      });
      
      // 更新底部导航状态
      updateBottomNav();
    });
  }

  // 内容页（如公司介绍）
  function renderContentPage(nav) {
    simulateLoading(() => {
      setHeaderMode("inner", nav.title);
      
      if (!nav.content || !nav.content.sections) {
        renderNotFound("内容加载失败");
        return;
      }
      
      const html = `
        <section class="card" style="margin-top: 16px;">
          <h1 class="h1">${htmlesc(nav.content.title || nav.title)}</h1>
          ${nav.content.sections
            .map(
              (section) => `
              <h2 style="font-size: 18px; font-weight: 700; margin: 20px 0 12px 0; color: var(--primary);">
                ${htmlesc(section.heading)}
              </h2>
              <p class="p" style="white-space: pre-line;">${htmlesc(section.text)}</p>
            `
            )
            .join("")}
        </section>
      `;
      app.innerHTML = html;
      scrollToTop();
      updateBottomNav();
    });
  }

  // 产品分类列表页
  function renderProductCategories() {
    const productsNav = DATA.mainNav.find(nav => nav.id === "products");
    if (!productsNav || !productsNav.categories) {
      renderNotFound("产品分类加载失败");
      return;
    }

    simulateLoading(() => {
      setHeaderMode("inner", productsNav.title);

      const html = `
        <section class="list" aria-label="产品分类列表">
          ${productsNav.categories
            .map(
              (cat) => `
              <a class="list-item" href="#/nav/products/${htmlesc(cat.id)}" aria-label="查看${htmlesc(cat.name)}">
                <div class="thumb">${htmlesc(cat.icon || "📦")}</div>
                <div class="li-text">
                  <div class="li-title">${htmlesc(cat.name)}</div>
                  <div class="li-desc">${htmlesc(cat.desc || "")}</div>
                </div>
                <div class="arrow">›</div>
              </a>
            `
            )
            .join("")}
        </section>
      `;
      app.innerHTML = html;
      scrollToTop();
      updateBottomNav();

      // 添加点击反馈
      document.querySelectorAll(".list-item").forEach((item) => {
        item.addEventListener("click", () => hapticFeedback("light"));
      });
    });
  }

  // 敬请期待页
  function renderComingSoon(nav) {
    simulateLoading(() => {
      setHeaderMode("inner", nav.title);
      
      const html = `
        <section class="card" style="margin-top: 16px; text-align: center; padding: 60px 20px;">
          <div style="font-size: 64px; margin-bottom: 20px;">🚧</div>
          <h1 class="h1" style="margin-bottom: 12px;">敬请期待</h1>
          <p class="p" style="color: var(--muted); margin-bottom: 30px;">
            该功能正在开发中<br>感谢您的关注与支持
          </p>
          <a href="#/" class="btn primary" onclick="window.hapticFeedback?.('medium')" style="display: inline-block; text-decoration: none; max-width: 200px;">
            返回首页
          </a>
        </section>
      `;
      app.innerHTML = html;
      scrollToTop();
      updateBottomNav();
    });
  }

  // 分类页（改名为产品列表页）
  function renderCategory(catId) {
    // 从产品中心找分类
    const productsNav = DATA.mainNav.find(nav => nav.id === "products");
    if (!productsNav || !productsNav.categories) {
      renderNotFound("产品分类加载失败");
      return;
    }
    
    const cat = productsNav.categories.find(c => c.id === catId);
    if (!cat) {
      renderNotFound("未找到该产品类型");
      return;
    }

    simulateLoading(() => {
      setHeaderMode("inner", cat.name);

      const html = `
        <!-- 顶部场景大图 -->
        ${cat.banner ? `
        <div class="product-banner">
          <img src="${htmlesc(cat.banner)}" alt="${htmlesc(cat.name)}" />
          <div class="product-banner-title">${htmlesc(cat.name)}</div>
        </div>
        ` : `<h1 class="h1" style="margin: 16px 16px 8px;">${htmlesc(cat.name)}</h1>`}
        
        <!-- 产品网格 -->
        <div class="product-grid">
          ${cat.products
            .map(
              (p) => `
              <a class="product-card" href="#/nav/products/${htmlesc(catId)}/${htmlesc(p.id)}" aria-label="查看${htmlesc(p.name)}详情">
                <div class="product-card-image">
                  ${p.image ? `<img src="${htmlesc(p.image)}" alt="${htmlesc(p.name)}" />` : `<div style="display:grid; place-items:center; height:100%; color:var(--muted);">📦</div>`}
                </div>
                <div class="product-card-body">
                  <div class="product-card-title">${htmlesc(p.name)}</div>
                </div>
              </a>
            `
            )
            .join("")}
        </div>
      `;
      app.innerHTML = html;
      scrollToTop(false);

      // 添加点击反馈
      document.querySelectorAll(".product-card").forEach((item) => {
        item.addEventListener("click", () => hapticFeedback("medium"));
      });
      
      // 更新底部导航状态
      updateBottomNav();
    });
  }

  // 详情页
  function renderProduct(productId) {
    const result = findProduct(productId);
    if (!result) {
      renderNotFound("未找到该产品");
      return;
    }

    const { category, product } = result;

    simulateLoading(() => {
      setHeaderMode("inner", product.name);

      const html = `
        <section class="card">
          <div class="h1">${htmlesc(product.name)}</div>
          <p class="p">${htmlesc(product.desc || "")}</p>

          <div class="video loading" id="productVideo" aria-label="产品视频">
            <video
              src="${htmlesc(product.video)}"
              controls
              playsinline
              webkit-playsinline
              preload="metadata"
              poster=""
            ></video>
          </div>

          <div class="btnrow" style="justify-content: center;">
            <a class="btn primary" href="${htmlesc(product.pdf)}" download aria-label="下载产品PDF" style="min-width: 200px;">
              📥 下载产品资料
            </a>
          </div>
        </section>
      `;
      app.innerHTML = html;
      scrollToTop(false);
      updateBottomNav();

      // 视频加载状态管理
      const videoContainer = document.getElementById("productVideo");
      const video = videoContainer.querySelector("video");

      video.addEventListener("loadeddata", () => {
        videoContainer.classList.remove("loading");
      });

      video.addEventListener("error", () => {
        videoContainer.classList.remove("loading");
        video.poster = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='%23999'%3E视频加载失败%3C/text%3E%3C/svg%3E";
      });

      // 按钮反馈
      document.querySelectorAll(".btn").forEach((btn) => {
        btn.addEventListener("click", () => hapticFeedback("medium"));
      });
    });
  }

  // 404页面
  function renderNotFound(msg) {
    simulateLoading(() => {
      setHeaderMode("inner", "提示");
      app.innerHTML = `
        <section class="card">
          <div class="h1">⚠️ 页面不存在</div>
          <p class="p">${htmlesc(msg || "请返回首页重试")}</p>
          <div class="btnrow">
            <a class="btn primary" href="#/">返回首页</a>
            <a class="btn ghost" href="javascript:history.back()">返回上一页</a>
          </div>
        </section>
      `;
      scrollToTop(false);
    });
  }

  // ========== 路由系统 ==========
  function parseHash() {
    const h = (window.location.hash || "#/").replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);

    if (parts.length === 0) return { name: "home" };
    
    // 新路由格式: #/nav/{navId}[/{categoryId}][/{productId}]
    if (parts[0] === "nav" && parts[1]) {
      const navId = parts[1];
      if (parts[2]) {
        // #/nav/products/sealant 或 #/nav/products/sealant/101
        if (parts[3]) {
          return { name: "product", navId, categoryId: parts[2], productId: parts[3] };
        } else {
          return { name: "product-list", navId, categoryId: parts[2] };
        }
      } else {
        // #/nav/company 或 #/nav/products
        return { name: "nav", navId };
      }
    }
    
    // 兼容旧路由
    if (parts[0] === "category" && parts[1]) {
      return { name: "product-list", navId: "products", categoryId: parts[1] };
    }
    if (parts[0] === "product" && parts[1]) {
      return { name: "product", productId: parts[1] };
    }
    
    return { name: "notfound" };
  }

  function router() {
    const route = parseHash();
    currentRoute = route;

    // 保存历史记录（简单实现）
    if (history.length === 0 || history[history.length - 1] !== window.location.hash) {
      history.push(window.location.hash);
      if (history.length > 50) history.shift(); // 限制历史记录数量
    }

    if (route.name === "home") {
      renderHome();
    } 
    else if (route.name === "nav") {
      // 处理主导航点击
      const nav = DATA.mainNav.find(n => n.id === route.navId);
      if (!nav) {
        renderNotFound("页面不存在");
        return;
      }
      
      if (nav.type === "page") {
        renderContentPage(nav);
      }
      else if (nav.type === "products") {
        renderProductCategories();
      }
      else if (nav.type === "coming-soon") {
        renderComingSoon(nav);
      }
      else {
        renderNotFound("页面类型未知");
      }
    }
    else if (route.name === "product-list") {
      renderCategory(route.categoryId);
    } 
    else if (route.name === "product") {
      renderProduct(route.productId || route.parts?.[3]);
    } 
    else {
      renderNotFound("路由无效");
    }

    // 更新返回顶部按钮
    updateBackToTop();
  }

  // 返回按钮优化
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hapticFeedback("medium");
    
    // 智能返回逻辑
    if (history.length > 1) {
      history.pop(); // 移除当前
      const prev = history.pop(); // 获取上一个
      if (prev) {
        window.location.hash = prev;
      } else {
        window.location.hash = "#/";
      }
    } else {
      window.location.hash = "#/";
    }
  });

  // ========== 返回顶部按钮 ==========
  function createBackToTop() {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.innerHTML = "↑";
    btn.setAttribute("aria-label", "返回顶部");
    btn.addEventListener("click", () => {
      scrollToTop(true);
      hapticFeedback("medium");
    });
    document.body.appendChild(btn);
    return btn;
  }

  const backToTopBtn = createBackToTop();

  function updateBackToTop() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  }

  // 滚动监听（节流优化）
  let scrollTimer = null;
  window.addEventListener("scroll", () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateBackToTop, 100);
  });

  // ========== 初始化 ==========
  function init() {
    // 确保有默认路由
    if (!window.location.hash || window.location.hash === "#") {
      window.location.replace("#/");
    }

    // 渲染轮播
    renderCarousel();

    // 路由监听
    window.addEventListener("hashchange", router);

    // 首次渲染
    router();

    // 底部导航返回按钮
    const navBack = document.getElementById("navBack");
    if (navBack) {
      navBack.addEventListener("click", () => {
        window.history.back();
        hapticFeedback("medium");
      });
    }

    // 页面可见性变化时暂停/恢复轮播
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAuto();
      } else if (currentRoute.name === "home") {
        startAuto();
      }
    });

    console.log("✅ 应用初始化完成");
  }

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
