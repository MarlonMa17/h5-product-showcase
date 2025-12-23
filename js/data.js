// 你只需要维护这个数据，就能动态生成：
// 首页6类 -> 分类列表 -> 产品详情（视频 + PDF下载）

window.APP_DATA = {
  banners: [
    { img: "assets/img/banner-1.jpg", alt: "Banner 1" },
    { img: "assets/img/banner-2.jpg", alt: "Banner 2" },
    { img: "assets/img/banner-3.jpg", alt: "Banner 3" },
  ],

  categories: [
    {
      id: "sealant",
      title: "密封胶",
      subtitle: "密封 / 防水 / 粘接",
      icon: "🧴",
      products: [
        {
          id: "sealant-101",
          name: "SILRES® Sealant 101",
          desc: "适用于建筑密封与防水的高性能产品。",
          video: "assets/video/demo-1.mp4",
          pdf: "assets/pdf/demo-1.pdf",
        },
        {
          id: "sealant-102",
          name: "SILRES® Sealant 102",
          desc: "耐候性更强，适配多种基材。",
          video: "assets/video/demo-2.mp4",
          pdf: "assets/pdf/demo-2.pdf",
        },
      ],
    },
    {
      id: "coating",
      title: "涂料添加剂",
      subtitle: "耐擦洗 / 消泡 / 流平",
      icon: "🎨",
      products: [
        {
          id: "coat-201",
          name: "Additive 201",
          desc: "提升涂膜性能与施工体验。",
          video: "assets/video/demo-1.mp4",
          pdf: "assets/pdf/demo-1.pdf",
        },
      ],
    },
    {
      id: "adhesive",
      title: "胶粘剂",
      subtitle: "结构粘接 / 快固化",
      icon: "🧩",
      products: [
        {
          id: "adh-301",
          name: "Adhesive 301",
          desc: "高强度粘接方案，适用工业与家装。",
          video: "assets/video/demo-2.mp4",
          pdf: "assets/pdf/demo-2.pdf",
        },
      ],
    },
    {
      id: "construction",
      title: "建材体系",
      subtitle: "砂浆 / 自流平 / 界面剂",
      icon: "🧱",
      products: [
        {
          id: "con-401",
          name: "VINNAPAS® 401",
          desc: "改善砂浆和自流平材料的综合性能。",
          video: "assets/video/demo-1.mp4",
          pdf: "assets/pdf/demo-1.pdf",
        },
      ],
    },
    {
      id: "textile",
      title: "纺织与无纺",
      subtitle: "粘合 / 涂层 / 手感",
      icon: "🧵",
      products: [
        {
          id: "tex-501",
          name: "VINNAPAS® 501",
          desc: "用于纺织品贴合的高性能乳液方案。",
          video: "assets/video/demo-2.mp4",
          pdf: "assets/pdf/demo-2.pdf",
        },
      ],
    },
    {
      id: "special",
      title: "特种化学品",
      subtitle: "定制化解决方案",
      icon: "⚗️",
      products: [
        {
          id: "sp-601",
          name: "Special 601",
          desc: "面向特定行业的定制化产品组合。",
          video: "assets/video/demo-1.mp4",
          pdf: "assets/pdf/demo-1.pdf",
        },
      ],
    },
  ],
};
