// ========================================
// 网站数据配置文件
// ========================================
// 维护这个文件就能动态生成整个网站
// 首页6个主导航 -> 对应页面内容
// ========================================

window.APP_DATA = {
  // 首页轮播图配置
  banners: [
    { 
      img: "assets/img/banner-1.jpg", 
      alt: "WACKER 化学创新科技" 
    },
    { 
      img: "assets/img/banner-2.jpg", 
      alt: "WACKER 全球化工解决方案" 
    },
    { 
      img: "assets/img/banner-3.jpg", 
      alt: "WACKER 可持续发展理念" 
    },
  ],

  // 主导航配置（首页6个入口）
  mainNav: [
    // ========== 1. 公司介绍 ==========
    {
      id: "company",
      title: "公司介绍",
      subtitle: "关于我们 / 企业文化 / 发展历程",
      icon: "🏢",
      type: "page", // 类型：page=内容页面
      content: {
        title: "关于 WACKER",
        sections: [
          {
            heading: "公司简介",
            text: "瓦克化学股份有限公司（WACKER）总部位于德国慕尼黑，是全球领先的化学品制造商之一。作为创新驱动型企业，WACKER 专注于有机硅、聚合物、精细化学品及多晶硅业务，为全球客户提供高性能的产品和解决方案。",
          },
          {
            heading: "核心优势",
            text: "超过百年的化工技术积淀，遍布全球的研发和生产网络，领先的产品质量和技术标准，专业的技术支持和售后服务，可持续发展的绿色化工理念。",
          },
          {
            heading: "业务领域",
            text: "WACKER 的产品广泛应用于建筑、涂料、纺织、汽车、电子、能源等多个行业。我们致力于通过创新的化学技术改善人们的生活品质，为客户实现业务增长和可持续发展提供强有力的支持。",
          },
          {
            heading: "企业愿景",
            text: "成为全球最受信赖的化学品合作伙伴，通过持续创新和卓越品质，为客户创造价值，为社会贡献力量，共同构建更美好的未来。",
          },
        ],
      },
    },

    // ========== 2. 产品中心 ==========
    {
      id: "products",
      title: "产品中心",
      subtitle: "密封胶 / 涂料 / 胶粘剂 / 建材",
      icon: "📦",
      type: "products", // 类型：products=产品列表
      categories: [
        {
          id: "sealant",
          name: "密封胶系列",
          icon: "🧴",
          desc: "高性能建筑密封材料",
          banner: "assets/img/sealant-banner.jpg", // 分类顶部大图
          products: [
            {
              id: "sealant-101",
              name: "SILRES® Sealant 101",
              image: "assets/img/product-sealant-101.jpg", // 产品图片
              desc: "适用于建筑密封与防水的高性能产品，具有优异的耐候性和粘接力。",
              video: "assets/video/demo-1.mp4",
              pdf: "assets/pdf/sealant-101.pdf",
            },
            {
              id: "sealant-102",
              name: "SILRES® Sealant 102",
              image: "assets/img/product-sealant-102.jpg",
              desc: "耐候性更强，适配多种基材，适用于苛刻环境下的密封应用。",
              video: "assets/video/demo-2.mp4",
              pdf: "assets/pdf/sealant-102.pdf",
            },
          ],
        },
        {
          id: "coating",
          name: "涂料添加剂",
          icon: "🎨",
          desc: "提升涂料性能的专业配方",
          banner: "assets/img/coating-banner.jpg",
          products: [
            {
              id: "coat-201",
              name: "VINNAPAS® Additive 201",
              image: "assets/img/product-coating-201.jpg",
              desc: "提升涂膜性能与施工体验，增强耐擦洗性能和表面流平效果。",
              video: "assets/video/demo-1.mp4",
              pdf: "assets/pdf/coating-201.pdf",
            },
            {
              id: "coat-202",
              name: "VINNAPAS® Additive 202",
              image: "assets/img/product-coating-202.jpg",
              desc: "高效消泡剂，适用于水性涂料体系，不影响涂膜光泽。",
              video: "assets/video/demo-2.mp4",
              pdf: "assets/pdf/coating-202.pdf",
            },
          ],
        },
        {
          id: "adhesive",
          name: "胶粘剂系列",
          icon: "🧩",
          desc: "工业级粘接解决方案",
          banner: "assets/img/adhesive-banner.jpg",
          products: [
            {
              id: "adh-301",
              name: "VINNAPAS® Adhesive 301",
              image: "assets/img/product-adhesive-301.jpg",
              desc: "高强度粘接方案，适用工业与家装，具有优异的初粘力和持久粘接性。",
              video: "assets/video/demo-2.mp4",
              pdf: "assets/pdf/adhesive-301.pdf",
            },
          ],
        },
        {
          id: "construction",
          name: "建材体系",
          icon: "🧱",
          desc: "建筑材料专业配方",
          banner: "assets/img/construction-banner.jpg",
          products: [
            {
              id: "con-401",
              name: "VINNAPAS® 401",
              image: "assets/img/product-construction-401.jpg",
              desc: "改善砂浆和自流平材料的综合性能，提高施工性和最终强度。",
              video: "assets/video/demo-1.mp4",
              pdf: "assets/pdf/construction-401.pdf",
            },
          ],
        },
      ],
    },

    // ========== 3. 解决方案 ==========
    {
      id: "solutions",
      title: "解决方案",
      subtitle: "后续补充",
      icon: "💡",
      type: "coming-soon",
    },

    // ========== 4. 成功案例 ==========
    {
      id: "cases",
      title: "成功案例",
      subtitle: "后续补充",
      icon: "📊",
      type: "coming-soon",
    },

    // ========== 5. 新闻动态 ==========
    {
      id: "news",
      title: "新闻动态",
      subtitle: "后续补充",
      icon: "📰",
      type: "coming-soon",
    },

    // ========== 6. 联系我们 ==========
    {
      id: "contact",
      title: "联系我们",
      subtitle: "后续补充",
      icon: "📞",
      type: "coming-soon",
    },
  ],
};

// ========================================
// 数据验证（开发环境）
// ========================================
if (console && console.log) {
  console.log("✅ APP_DATA 加载成功");
  console.log("📋 轮播图数量:", window.APP_DATA.banners.length);
  console.log("🗂️ 主导航数量:", window.APP_DATA.mainNav.length);
}
