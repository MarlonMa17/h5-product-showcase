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

  let DATA = null; // 数据将异步加载

  // ========== 状态管理 ==========
  let currentRoute = { name: "home" };
  let history = [];

  // ========== 数据加载 ==========
  async function loadData() {
    try {
      const response = await fetch('js/data.json');
      if (!response.ok) {
        throw new Error('数据加载失败');
      }
      DATA = await response.json();
      console.log('✅ 数据加载成功', DATA);
      return true;
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
      app.innerHTML = `
        <div style="text-align:center; padding:60px 20px; color:#999;">
          <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
          <h2 style="font-size:18px; margin-bottom:8px;">数据加载失败</h2>
          <p style="font-size:14px;">请检查网络连接或联系管理员</p>
        </div>
      `;
      return false;
    }
  }

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
    return DATA.categories.find((c) => c.id === catId) || null;
  }

  function findProduct(productId) {
    for (const c of DATA.categories) {
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
  // 动态生成底部面包屑导航
  function updateBottomNav() {
    const bottomNav = document.getElementById("bottomNav");
    if (!bottomNav) return;
    
    const breadcrumbs = [];
    
    // 首页按钮（始终存在）
    breadcrumbs.push({
      icon: "🏠",
      label: "首页",
      href: "#/",
      active: currentRoute.name === "home"
    });
    
    // 根据当前路由添加面包屑
    if (currentRoute.name === "category" && currentRoute.categoryId) {
      const category = findCategory(currentRoute.categoryId);
      if (category) {
        breadcrumbs.push({
          icon: category.icon || "📦",
          label: category.name,
          href: `#/category/${category.id}`,
          active: true  // 当前位置
        });
      }
    }
    
    if (currentRoute.name === "product" && currentRoute.productId) {
      const result = findProduct(currentRoute.productId);
      if (result) {
        const { category, product } = result;
        
        // 添加分类按钮
        breadcrumbs.push({
          icon: category.icon || "📦",
          label: category.name,
          href: `#/category/${category.id}`,
          active: false
        });
        
        // 添加产品按钮
        breadcrumbs.push({
          icon: "📋",
          label: product.name.length > 12 ? product.name.substring(0, 12) + "..." : product.name,
          href: `#/category/${category.id}/${product.id}`,
          active: true  // 当前位置
        });
      }
    }
    
    // 生成HTML
    const html = breadcrumbs.map(crumb => `
      ${crumb.active 
        ? `<div class="breadcrumb-btn active">
             <div class="nav-icon">${crumb.icon}</div>
             <div class="nav-label">${htmlesc(crumb.label)}</div>
           </div>`
        : `<a class="breadcrumb-btn" href="${crumb.href}" aria-label="前往${htmlesc(crumb.label)}">
             <div class="nav-icon">${crumb.icon}</div>
             <div class="nav-label">${htmlesc(crumb.label)}</div>
           </a>`
      }
    `).join('');
    
    bottomNav.innerHTML = html;
    
    // 添加点击反馈
    bottomNav.querySelectorAll('.breadcrumb-btn:not(.active)').forEach(btn => {
      btn.addEventListener('click', () => hapticFeedback('medium'));
    });
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

  // 首页 - 6个产品分类
  function renderHome() {
    simulateLoading(() => {
      setHeaderMode("home");
      const html = `
        <section class="grid" aria-label="产品分类">
          <div class="grid-items">
            ${DATA.categories
              .map(
                (cat) => `
                <a class="grid-item" href="#/category/${htmlesc(cat.id)}" aria-label="进入${htmlesc(cat.name)}">
                  <div class="iconbox" aria-hidden="true">
                    <div style="font-size:22px">${htmlesc(cat.icon || "📦")}</div>
                  </div>
                  <div class="grid-title">${htmlesc(cat.name)}</div>
                  <div class="grid-sub">${htmlesc(cat.desc || "")}</div>
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
  // 产品列表页
  function renderCategory(catId) {
    const cat = findCategory(catId);
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
              <a class="product-card" href="#/category/${htmlesc(catId)}/${htmlesc(p.id)}" aria-label="查看${htmlesc(p.name)}详情">
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
  // 产品详情页 - 标签切换设计
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
          <h1 class="h1">${htmlesc(product.name)}</h1>
          <p class="p">${htmlesc(product.desc || "")}</p>

          <!-- 标签页导航 -->
          <div class="tabs-nav">
            <button class="tab-btn active" data-tab="videos">
              <span class="tab-icon">🎬</span>
              <span class="tab-text">产品视频</span>
            </button>
            <button class="tab-btn" data-tab="pdfs">
              <span class="tab-icon">📄</span>
              <span class="tab-text">产品文档</span>
            </button>
          </div>

          <!-- 标签页内容 -->
          <div class="tabs-content">
            <!-- 视频标签页 -->
            <div class="tab-pane active" id="paneVideos">
              ${product.videos && product.videos.length > 0 ? `
                <div class="video-list">
                  ${product.videos.map((video, index) => `
                    <div class="video-item" data-index="${index}">
                      <div class="video loading" id="video-${index}">
                        <video
                          src="${htmlesc(video.file)}"
                          controls
                          playsinline
                          webkit-playsinline
                          preload="metadata"
                          poster="${htmlesc(video.thumbnail || '')}"
                        ></video>
                      </div>
                      <div class="video-info">
                        <div class="video-title">${htmlesc(video.title)}</div>
                        ${video.desc ? `<div class="video-desc">${htmlesc(video.desc)}</div>` : ''}
                        ${video.duration ? `<div class="video-duration">⏱ ${htmlesc(video.duration)}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<div class="empty-state">暂无视频内容</div>'}
            </div>

            <!-- 文档标签页 -->
            <div class="tab-pane" id="panePdfs">
              ${product.pdfs && product.pdfs.length > 0 ? `
                <div class="pdf-list">
                  ${product.pdfs.map(pdf => `
                    <a class="pdf-item" href="${htmlesc(pdf.file)}" download aria-label="下载${htmlesc(pdf.title)}">
                      <div class="pdf-icon">📥</div>
                      <div class="pdf-info">
                        <div class="pdf-title">${htmlesc(pdf.title)}</div>
                        ${pdf.desc ? `<div class="pdf-desc">${htmlesc(pdf.desc)}</div>` : ''}
                        ${pdf.size ? `<div class="pdf-size">${htmlesc(pdf.size)}</div>` : ''}
                      </div>
                      <div class="pdf-arrow">→</div>
                    </a>
                  `).join('')}
                </div>
              ` : '<div class="empty-state">暂无文档资料</div>'}
            </div>
          </div>
        </section>
      `;
      app.innerHTML = html;
      scrollToTop(false);
      updateBottomNav();

      // 标签切换功能
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabPanes = document.querySelectorAll('.tab-pane');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabName = btn.getAttribute('data-tab');
          
          // 更新按钮状态
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // 更新内容显示
          tabPanes.forEach(pane => {
            if (pane.id === `pane${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`) {
              pane.classList.add('active');
            } else {
              pane.classList.remove('active');
            }
          });
          
          // 触感反馈
          hapticFeedback('light');
        });
      });

      // 视频加载状态管理
      if (product.videos) {
        product.videos.forEach((video, index) => {
          const videoContainer = document.getElementById(`video-${index}`);
          if (videoContainer) {
            const videoEl = videoContainer.querySelector("video");
            if (videoEl) {
              videoEl.addEventListener("loadeddata", () => {
                videoContainer.classList.remove("loading");
              });
              videoEl.addEventListener("error", () => {
                videoContainer.classList.remove("loading");
                videoContainer.classList.add("error");
              });
            }
          }
        });
      }
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
    
    // #/category/{categoryId}
    if (parts[0] === "category" && parts[1]) {
      if (parts[2]) {
        // #/category/{categoryId}/{productId}
        return { name: "product", categoryId: parts[1], productId: parts[2] };
      } else {
        // #/category/{categoryId}
        return { name: "category", categoryId: parts[1] };
      }
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
    else if (route.name === "category") {
      renderCategory(route.categoryId);
    } 
    else if (route.name === "product") {
      renderProduct(route.productId);
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
  async function init() {
    // 显示加载中
    showLoading();
    
    // 加载数据
    const loaded = await loadData();
    if (!loaded) {
      hideLoading();
      return; // 数据加载失败，不继续初始化
    }
    
    hideLoading();
    
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
