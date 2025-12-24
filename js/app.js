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

  // 首页 - 支持两种模式
  function renderHome(mode = 'pdf') {
    simulateLoading(() => {
      setHeaderMode("home");
      
      let categories = DATA.categories;
      let title = "产品分类";
      
      // 视频模式：只显示有视频类目的分类
      if (mode === 'video') {
        categories = DATA.categories.filter(cat => 
          cat.videoTopics && cat.videoTopics.length > 0
        );
        title = "产品视频";
      }
      
      const html = `
        <section class="grid" aria-label="${title}">
          <div class="grid-items" style="grid-template-columns: repeat(2, 1fr);">
            ${categories
              .map(
                (cat) => `
                <a class="grid-item" href="#/${mode === 'video' ? 'video-topics' : 'pdf-category'}/${htmlesc(cat.id)}" aria-label="进入${htmlesc(cat.name)}">
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

  // PDF产品列表页 - 只显示产品网格
  function renderCategory(catId) {
    const cat = findCategory(catId);
    if (!cat) {
      renderNotFound("未找到该产品类型");
      return;
    }

    simulateLoading(() => {
      setHeaderMode("inner", cat.name);

      // 将产品分组，每行2个
      const products = cat.products || [];
      const rows = [];
      for (let i = 0; i < products.length; i += 2) {
        rows.push(products.slice(i, i + 2));
      }

      const html = `
        <!-- 顶部大图 + 蓝色标签 -->
        <div class="category-header">
          ${cat.headerImage ? `
            <img src="${htmlesc(cat.headerImage)}" alt="${htmlesc(cat.name)}" class="category-header-img" />
          ` : ''}
          <div class="category-title-wrapper">
            <div class="category-title">${htmlesc(cat.nameCN || cat.name)}</div>
          </div>
        </div>
        
        <!-- 产品网格（按行排列）-->
        ${products.length > 0 ? `
        <div class="product-list-grid">
          ${rows.map(row => `
            <div class="product-list-row">
              ${row.map(p => `
                <a class="product-list-card" href="#/pdf-download/${htmlesc(catId)}/${htmlesc(p.id)}" aria-label="查看${htmlesc(p.name)}">
                  <div class="product-list-image">
                    ${p.image ? `<img src="${htmlesc(p.image)}" alt="${htmlesc(p.name)}" />` : ''}
                  </div>
                  <div class="product-list-info">
                    <div class="product-list-model">${htmlesc(p.model || p.name)}</div>
                    <div class="product-list-name">${htmlesc(p.nameCN || p.name)}</div>
                  </div>
                </a>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : '<div class="empty-state" style="padding: 60px 20px;">该分类暂无产品</div>'}
      `;
      app.innerHTML = html;
      scrollToTop(false);

      // 添加点击反馈
      document.querySelectorAll(".product-list-card").forEach((item) => {
        item.addEventListener("click", () => hapticFeedback("medium"));
      });
      
      // 更新底部导航状态
      updateBottomNav();
    });
  }

  // PDF下载页 - 显示PDF文件列表和下载按钮
  function renderPdfDownload(catId, productId) {
    const result = findProduct(productId);
    if (!result) {
      renderNotFound("未找到该产品");
      return;
    }

    const { category, product } = result;

    simulateLoading(() => {
      setHeaderMode("inner", product.nameCN || product.name);

      const html = `
        <section class="pdf-download-page">
          <!-- 大红色PDF图标 -->
          <div class="pdf-download-icon">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#DC3545" stroke="#DC3545" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 13H8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 17H8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 13H12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17H12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <!-- 产品信息 -->
          <div class="pdf-download-info">
            <div class="pdf-download-model">${htmlesc(product.model || product.name)}</div>
            <div class="pdf-download-name">${htmlesc(product.nameCN || product.name)}</div>
          </div>

          <!-- PDF文件列表 -->
          ${product.pdfs && product.pdfs.length > 0 ? `
            <div class="pdf-download-list">
              ${product.pdfs.map((pdf, index) => `
                <div class="pdf-download-item">
                  <div class="pdf-download-item-info">
                    <div class="pdf-download-item-title">${htmlesc(pdf.title)}</div>
                    ${pdf.desc ? `<div class="pdf-download-item-desc">${htmlesc(pdf.desc)}</div>` : ''}
                    ${pdf.size ? `<div class="pdf-download-item-size">${htmlesc(pdf.size)}</div>` : ''}
                  </div>
                  <a href="${htmlesc(pdf.file)}" target="_blank" class="pdf-download-btn" aria-label="下载${htmlesc(pdf.title)}">
                    点击下载产品说明书
                  </a>
                  <div class="pdf-download-hint">下载按钮</div>
                </div>
              `).join('')}
            </div>
          ` : '<div class="empty-state">暂无文档资料</div>'}
        </section>
      `;
      app.innerHTML = html;
      scrollToTop(false);
      updateBottomNav();

      // 添加点击反馈
      document.querySelectorAll(".pdf-download-btn").forEach((btn) => {
        btn.addEventListener("click", () => hapticFeedback("medium"));
      });
    });
  }

  // 视频类目列表页 - 显示该分类下的视频类目
  function renderVideoTopics(catId) {
    const cat = findCategory(catId);
    if (!cat) {
      renderNotFound("未找到该产品类型");
      return;
    }

    const videoTopics = cat.videoTopics || [];
    
    // 将类目分组，每行2个
    const rows = [];
    for (let i = 0; i < videoTopics.length; i += 2) {
      rows.push(videoTopics.slice(i, i + 2));
    }

    simulateLoading(() => {
      setHeaderMode("inner", cat.name);

      const html = `
        <!-- 蓝色顶部标题栏 -->
        <div class="video-topics-header">
          <h2 class="video-topics-title">${htmlesc(cat.nameCN || cat.name)}</h2>
        </div>
        
        <!-- 类目网格（按行排列）-->
        ${videoTopics.length > 0 ? `
        <div class="video-topics-grid">
          ${rows.map(row => `
            <div class="video-topics-row">
              ${row.map(topic => `
                <a class="video-topic-card" href="#/video-play/${htmlesc(catId)}/${htmlesc(topic.id)}" aria-label="查看${htmlesc(topic.name)}视频">
                  <div class="video-topic-image">
                    ${topic.image ? `<img src="${htmlesc(topic.image)}" alt="${htmlesc(topic.name)}" />` : ''}
                  </div>
                  <div class="video-topic-name">${htmlesc(topic.name)}</div>
                </a>
              `).join('')}
            </div>
          `).join('')}
        </div>
        ` : '<div class="empty-state" style="padding: 60px 20px;">该分类暂无视频类目</div>'}
      `;
      app.innerHTML = html;
      scrollToTop(false);

      // 添加点击反馈
      document.querySelectorAll(".video-topic-card").forEach((item) => {
        item.addEventListener("click", () => hapticFeedback("medium"));
      });
      
      // 更新底部导航状态
      updateBottomNav();
    });
  }

  // 视频播放页 - 显示该类目下的所有视频
  function renderVideoPlay(catId, topicId) {
    const cat = findCategory(catId);
    if (!cat) {
      renderNotFound("未找到该产品类型");
      return;
    }

    const topic = cat.videoTopics?.find(t => t.id === topicId);
    if (!topic) {
      renderNotFound("未找到该视频类目");
      return;
    }

    simulateLoading(() => {
      setHeaderMode("inner", topic.name);

      const html = `
        <section class="video-play-page">
          <!-- 类目名称标题 -->
          <h2 class="video-play-title">${htmlesc(topic.name)}</h2>
          
          <!-- 视频列表 -->
          ${topic.videos && topic.videos.length > 0 ? `
            <div class="video-play-list">
              ${topic.videos.map((video, index) => `
                <div class="video-play-item ${video.orientation === 'vertical' ? 'vertical' : 'horizontal'}">
                  <div class="video-play-wrapper loading" id="video-play-${index}">
                    <video
                      src="${htmlesc(video.file)}"
                      controls
                      playsinline
                      webkit-playsinline
                      preload="metadata"
                      poster="${htmlesc(video.thumbnail || '')}"
                      class="video-play-player"
                    ></video>
                    <div class="video-play-overlay">
                      <div class="video-play-btn">▶</div>
                    </div>
                  </div>
                  <div class="video-play-info">
                    <div class="video-play-video-title">${htmlesc(video.title)}</div>
                    ${video.duration ? `<div class="video-play-duration">⏱ ${htmlesc(video.duration)}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div class="empty-state">暂无视频内容</div>'}
        </section>
      `;
      app.innerHTML = html;
      scrollToTop(false);
      updateBottomNav();

      // 视频加载和播放控制
      if (topic.videos) {
        topic.videos.forEach((video, index) => {
          const wrapper = document.getElementById(`video-play-${index}`);
          if (wrapper) {
            const videoEl = wrapper.querySelector("video");
            const overlay = wrapper.querySelector(".video-play-overlay");
            
            if (videoEl && overlay) {
              // 视频加载完成
              videoEl.addEventListener("loadeddata", () => {
                wrapper.classList.remove("loading");
              });
              
              // 视频加载失败
              videoEl.addEventListener("error", () => {
                wrapper.classList.remove("loading");
                wrapper.classList.add("error");
              });
              
              // 点击播放按钮
              overlay.addEventListener("click", () => {
                videoEl.play();
                overlay.style.display = "none";
                hapticFeedback("medium");
              });
              
              // 视频开始播放
              videoEl.addEventListener("play", () => {
                overlay.style.display = "none";
              });
              
              // 视频暂停
              videoEl.addEventListener("pause", () => {
                if (videoEl.currentTime > 0 && videoEl.currentTime < videoEl.duration) {
                  overlay.style.display = "flex";
                }
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

    if (parts.length === 0) return { name: "home", mode: "pdf" };
    
    // #/video - 视频首页
    if (parts[0] === "video" && parts.length === 1) {
      return { name: "home", mode: "video" };
    }
    
    // #/pdf - PDF首页（默认）
    if (parts[0] === "pdf" && parts.length === 1) {
      return { name: "home", mode: "pdf" };
    }
    
    // #/video-topics/{categoryId} - 视频类目列表页
    if (parts[0] === "video-topics" && parts[1]) {
      return { name: "video-topics", categoryId: parts[1] };
    }
    
    // #/video-play/{categoryId}/{topicId} - 视频播放页
    if (parts[0] === "video-play" && parts[1] && parts[2]) {
      return { name: "video-play", categoryId: parts[1], topicId: parts[2] };
    }
    
    // #/pdf-category/{categoryId} - PDF产品列表页
    if (parts[0] === "pdf-category" && parts[1]) {
      return { name: "pdf-category", categoryId: parts[1] };
    }
    
    // #/pdf-download/{categoryId}/{productId} - PDF下载页
    if (parts[0] === "pdf-download" && parts[1] && parts[2]) {
      return { name: "pdf-download", categoryId: parts[1], productId: parts[2] };
    }
    
    // 兼容旧路由 #/category/{categoryId}
    if (parts[0] === "category" && parts[1]) {
      return { name: "pdf-category", categoryId: parts[1] };
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
      renderHome(route.mode || "pdf");
    } 
    else if (route.name === "pdf-category") {
      renderCategory(route.categoryId);
    }
    else if (route.name === "pdf-download") {
      renderPdfDownload(route.categoryId, route.productId);
    }
    else if (route.name === "video-topics") {
      renderVideoTopics(route.categoryId);
    }
    else if (route.name === "video-play") {
      renderVideoPlay(route.categoryId, route.topicId);
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
