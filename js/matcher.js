/**
 * 职途星图 · 简历语义匹配引擎 v2.0
 *
 * 基于关键词的客户端匹配算法，无需外部 API。
 * 分析用户简历的 技能 / 经验 / 教育 / 地域 四个维度，
 * 与岗位数据进行智能匹配。
 */

// ===== 职位-技能知识库 =====
const POSITION_SKILLS = {
  'AI产品经理': {
    keywords: ['AI', '人工智能', '大模型', '机器学习', '深度学习', '产品设计', 'PRD', '需求分析', '数据分析', '产品规划', '用户研究', 'A/B测试', '原型设计', 'Axure', 'Figma', '产品路线图', '市场分析', '竞品分析', '用户增长', '产品策略', 'AI产品', '智能产品', 'NLP', '计算机视觉', '推荐系统', '智能客服', '策略产品'],
    edu: ['计算机', '人工智能', '产品设计', '统计学', '数学', '信息管理', '数据科学'],
    related: ['产品经理', '数据分析师', '用户研究']
  },
  '产品经理': {
    keywords: ['产品设计', '需求分析', 'PRD', '原型设计', 'Axure', 'Figma', '产品规划', '用户研究', '数据分析', 'A/B测试', '用户增长', '竞品分析', '市场分析', '产品策略', '项目管理', '敏捷开发', '用户调研', '产品运营', '用户画像', 'MVP', 'roadmap'],
    edu: ['计算机', '产品设计', '工商管理', '市场营销', '信息管理'],
    related: ['AI产品经理', '产品运营', '数据分析师']
  },
  '产品助理': {
    keywords: ['产品设计', 'PRD', '原型设计', '数据分析', 'Axure', 'Figma', '需求文档', '用户调研', '竞品分析', '办公软件', '团队协作', '流程设计'],
    edu: ['计算机', '产品设计', '工商管理', '电子商务', '信息管理'],
    related: ['产品经理', '产品运营']
  },
  '产品运营': {
    keywords: ['用户运营', '内容运营', '活动运营', '数据分析', '增长黑客', '用户增长', '社群运营', 'A/B测试', '渠道推广', '转化率', '留存', '拉新', '促活', '运营策略', '用户画像', '生命周期'],
    edu: ['市场营销', '电子商务', '工商管理', '统计学', '新闻传播'],
    related: ['产品经理', '用户研究', '数据分析师']
  },
  '数据分析师': {
    keywords: ['SQL', 'Python', '数据分析', '数据挖掘', '数据可视化', 'Tableau', 'Power BI', '统计学', '机器学习', 'Excel', '数据清洗', 'ETL', 'A/B测试', '回归分析', '指标体系', '用户分析', '商业分析', 'FineBI', 'SPSS'],
    edu: ['统计学', '数学', '计算机', '数据科学', '信息管理', '经济学'],
    related: ['数据工程师', 'AI产品经理', '商业分析']
  },
  '用户研究': {
    keywords: ['用户研究', '用户访谈', '可用性测试', '问卷调查', '用户画像', '体验设计', '定性研究', '定量研究', '数据分析', '用户行为', '焦点小组', '人机交互', '心理学', '眼动实验', 'A/B测试'],
    edu: ['心理学', '社会学', '人机交互', '工业设计', '统计学', '市场营销'],
    related: ['UX设计师', '产品经理', '数据分析师']
  },
  '项目经理': {
    keywords: ['项目管理', '敏捷开发', 'Scrum', 'PMP', 'Jira', '项目规划', '风险管理', '跨部门协作', 'Gantt', '进度管理', '资源协调', '敏捷', '瀑布模型', '沟通管理', '质量管理', '项目交付'],
    edu: ['计算机', '工商管理', '项目管理', '工程管理'],
    related: ['产品经理', '技术研发']
  },
  'AI算法工程师': {
    keywords: ['机器学习', '深度学习', 'Python', 'PyTorch', 'TensorFlow', '自然语言处理', '计算机视觉', 'NLP', 'CV', '算法', '模型训练', '强化学习', '推荐算法', 'Transformer', 'BERT', 'GPT', '神经网络', 'CNN', 'RNN', '数据处理', '特征工程', '模型部署', 'MLOps', 'C++', 'Linux'],
    edu: ['计算机', '人工智能', '数学', '统计学', '自动化', '电子信息'],
    related: ['数据分析师', '数据工程师', 'AI产品经理']
  },
  '前端开发': {
    keywords: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML', 'CSS', 'Webpack', 'Vite', 'Node.js', '前端', '移动端', '响应式', '小程序', '组件化', '前端工程化', 'WebGL', 'Canvas', '性能优化', 'ES6', 'Tailwind', 'Sass', 'Less'],
    edu: ['计算机', '软件工程', '信息工程', '通信工程'],
    related: ['后端开发', '全栈开发']
  },
  '后端开发': {
    keywords: ['Java', 'Python', 'Go', 'Spring', 'Spring Boot', 'MySQL', 'Redis', 'Kafka', '微服务', 'Docker', 'Kubernetes', '分布式', '高并发', 'API', 'RESTful', '消息队列', 'MongoDB', 'PostgreSQL', 'Nginx', 'Linux', '设计模式', '系统架构'],
    edu: ['计算机', '软件工程', '信息工程', '通信工程'],
    related: ['前端开发', '全栈开发', '数据工程师']
  }
};

// ===== 行业关键词映射 =====
const INDUSTRY_KEYWORDS = {
  '互联网/科技': ['互联网', '科技', '软件', 'SaaS', 'PaaS', '云', '数字化', 'IT', '编程', '开发', '上线', '产品', '用户数', 'DAU', 'MAU'],
  '金融/银行': ['金融', '银行', '风控', '支付', '保险', '基金', '证券', '财富管理', '数字银行', '合规', '审计'],
  '医疗/医药': ['医疗', '医药', '生物', '健康', '药', '临床', '基因', '医疗器械'],
  '制造/工业': ['制造', '工业', '生产', '供应链', '设备', '自动化', '精益'],
  '教育/培训': ['教育', '培训', '课程', '教学', '学习', '在线教育', 'K12', '知识'],
  '新能源/汽车': ['新能源', '汽车', '电动', '电池', '充电', '光伏', '储能', '智能驾驶'],
  '消费/零售': ['消费', '零售', '电商', '品牌', '市场', '营销', '销售', '渠道'],
  '游戏/文娱': ['游戏', '文娱', '娱乐', '内容', '直播', '短视频', '漫画', '音乐', '传媒'],
  '物流/运输': ['物流', '运输', '供应链', '仓储', '配送', '快递', '货运'],
  '通信/5G': ['通信', '5G', '4G', '网络', '基站', '信号', '光通信', '协议'],
  '半导体/芯片': ['半导体', '芯片', '集成电路', 'EDA', '制造', '封测', '设计', '工艺'],
  '房地产/建筑': ['房地产', '建筑', '地产', '工程', '土木', '造价', '设计院', '物业']
};

// ===== 城市区域分类 =====
const CITY_TIERS = {
  '北京': '一线', '上海': '一线', '广州': '一线', '深圳': '一线',
  '杭州': '新一线', '成都': '新一线', '南京': '新一线', '苏州': '新一线',
  '武汉': '新一线', '西安': '新一线', '重庆': '新一线', '天津': '新一线',
  '长沙': '新一线', '郑州': '新一线', '青岛': '新一线', '东莞': '新一线',
  '宁波': '新一线', '昆明': '新一线', '合肥': '新一线', '沈阳': '新一线',
  '佛山': '二线', '福州': '二线', '无锡': '二线', '厦门': '二线', '济南': '二线',
  '大连': '二线', '哈尔滨': '二线', '贵阳': '二线', '珠海': '二线', '常州': '二线'
};

// ===== 匹配引擎 =====
const MatchEngine = {
  /**
   * 对一份简历进行全量公司匹配
   * @param {Object} resume - 简历对象
   * @param {Array} companies - 公司数组 (AC)
   * @returns {Array} 匹配结果，按总分排序
   */
  matchAll(resume, companies) {
    const results = companies.map(company => {
      const detail = this.computeMatch(resume, company);
      return {
        ...company,
        match: detail.total,
        breakdown: detail.breakdown,
        matchedKeywords: detail.matchedKeywords
      };
    });
    return results.sort((a, b) => b.match - a.match);
  },

  /**
   * 计算一份简历与一个岗位的四维匹配度
   */
  computeMatch(resume, company) {
    const breakdown = {};

    // 维度1: 技能匹配 (权重 40%)
    breakdown.skill = this.matchSkills(resume, company);

    // 维度2: 经验匹配 (权重 25%)
    breakdown.experience = this.matchExperience(resume, company);

    // 维度3: 教育匹配 (权重 20%)
    breakdown.education = this.matchEducation(resume, company);

    // 维度4: 地理匹配 (权重 15%)
    breakdown.location = this.matchLocation(resume, company);

    // 总分 = 加权平均 (技能权重提高，地域降低)
    const total = Math.round(
      breakdown.skill * 0.40 +
      breakdown.experience * 0.27 +
      breakdown.education * 0.20 +
      breakdown.location * 0.13
    );

    // 小修正：如果简历城市匹配且职位精准匹配，额外加点
    let precisionBonus = 0;
    const resumeText = [resume.skills, resume.experience].filter(Boolean).join(' ').toLowerCase();
    const posWords = company.pos.replace(/[AI/]/g, '').toLowerCase().trim();
    if (resumeText.includes(posWords.slice(0, 2)) && posWords.length > 1) {
      precisionBonus = 3;
    }

    // 收集匹配到的关键词
    const matchedKeywords = this.extractKeywords(resume, company);

    return { total: Math.min(99, Math.max(10, total + precisionBonus)), breakdown, matchedKeywords };
  },

  /**
   * 维度1: 技能匹配
   * 提取简历中的技能关键词，与岗位的要求做匹配
   */
  matchSkills(resume, company) {
    const skillText = [resume.skills, resume.experience, resume.projects].filter(Boolean).join(' ').toLowerCase();
    const jobText = [company.pos, company.dept, ...company.tags].filter(Boolean).join(' ').toLowerCase();

    // 获取该职位的技能知识库
    const skillProfile = POSITION_SKILLS[company.pos];
    if (!skillProfile) return 60;

    // 简历文本与职位关键词匹配
    const skillSet = skillProfile.keywords;
    let matchCount = 0;
    let totalCheck = Math.min(skillSet.length, 25);

    for (let i = 0; i < totalCheck; i++) {
      const kw = skillSet[i].toLowerCase();
      if (skillText.includes(kw)) matchCount++;
    }

    // 基础分 + 命中率得分 (放大命中率权重)
    const hitRate = totalCheck > 0 ? matchCount / totalCheck : 0;
    let score = 25 + Math.round(hitRate * 60);

    // 职位完全匹配时的额外加分
    const resumePosHint = skillText.includes('产品') || skillText.includes('AI');
    const posName = company.pos.toLowerCase();
    if (resumePosHint && (posName.includes('产品') || posName.includes('AI'))) {
      score += 10;
    }

    // 公司tag命中加分
    const tagHits = company.tags.filter(t => skillText.includes(t.toLowerCase())).length;
    score += Math.min(12, tagHits * 4);

    return Math.min(99, Math.max(15, score));
  },

  /**
   * 维度2: 经验匹配
   */
  matchExperience(resume, company) {
    const expText = [resume.experience, resume.projects, resume.skills].filter(Boolean).join(' ').toLowerCase();

    // 行业关键词匹配
    const industryKeywords = INDUSTRY_KEYWORDS[company.industry] || [];
    const industryHits = industryKeywords.filter(kw => expText.includes(kw.toLowerCase())).length;

    // 公司Tag匹配
    const tagHits = company.tags.filter(tag => expText.includes(tag.toLowerCase())).length;

    // 基础分 - 有实习经历就有不错基础
    const hasInternship = expText.includes('实习') || expText.includes('项目');
    const baseScore = hasInternship ? 30 : 10;

    // 行业匹配度
    let industryMatchBonus = 0;
    if (company.industry === '互联网/科技' && (expText.includes('互联网') || expText.includes('软件') || expText.includes('产品') || expText.includes('数据'))) {
      industryMatchBonus = 15;
    } else if (company.industry === '金融/银行' && (expText.includes('金融') || expText.includes('银行') || expText.includes('风控'))) {
      industryMatchBonus = 15;
    } else if (company.industry === '新能源/汽车' && (expText.includes('新能源') || expText.includes('汽车'))) {
      industryMatchBonus = 15;
    }

    // 职位相关度 - 简历里的内容是否与这个职位匹配
    const posText = company.pos.toLowerCase();
    let posMatchBonus = 0;
    if ((posText.includes('产品') && expText.includes('产品')) ||
        (posText.includes('算法') && (expText.includes('算法') || expText.includes('机器学习'))) ||
        (posText.includes('数据') && expText.includes('数据')) ||
        (posText.includes('开发') && (expText.includes('开发') || expText.includes('编程') || expText.includes('代码')))) {
      posMatchBonus = 12;
    }

    const experienceScore = industryHits * 4;
    const tagScore = tagHits * 6;

    const total = baseScore + Math.min(30, experienceScore) + Math.min(20, tagScore) + industryMatchBonus + posMatchBonus;
    return Math.min(99, Math.round(total));
  },

  /**
   * 维度3: 教育匹配
   */
  matchEducation(resume, company) {
    const major = (resume.major || '').toLowerCase();
    const degree = (resume.degree || '').toLowerCase();

    const skillProfile = POSITION_SKILLS[company.pos];

    let eduScore = 30;

    // 专业匹配 - 匹配到推荐专业大幅加分
    let majorMatched = false;
    if (skillProfile && skillProfile.edu) {
      for (const e of skillProfile.edu) {
        if (major.includes(e.toLowerCase())) {
          eduScore += 30;
          majorMatched = true;
          break;
        }
      }
    }

    // 技术大类专业对产品/数据类岗位也有价值
    const techMajors = ['计算机', '软件', '信息', '通信', '电子', '自动化', '数学', '统计', '物理', '物联网'];
    const isTechMajor = techMajors.some(m => major.includes(m));

    if (!majorMatched && isTechMajor) {
      // Tech major but not exact match
      const techFriendlyRoles = ['AI算法工程师', '前端开发', '后端开发', '数据分析师', '数据工程师', '安全工程师',
        'AI产品经理', '产品经理', '项目经理', '产品助理'];
      if (techFriendlyRoles.includes(company.pos)) {
        eduScore += 20;
      }
    } else if (!majorMatched && (major.includes('产品') || major.includes('设计') || major.includes('市场') || major.includes('管理'))) {
      // Business/design majors for product/运营 roles
      const bizFriendlyRoles = ['产品经理', 'AI产品经理', '产品助理', '产品运营', '用户研究', '项目经理'];
      if (bizFriendlyRoles.includes(company.pos)) {
        eduScore += 20;
      }
    }

    // 学历加分
    if (degree.includes('博士')) eduScore += 15;
    else if (degree.includes('硕士') || degree.includes('研究生')) eduScore += 10;
    else if (degree.includes('本科')) eduScore += 5;
    else if (degree.includes('大专')) eduScore += 0;

    return Math.min(99, eduScore);
  },

  /**
   * 维度4: 地理匹配
   * 如果简历中有城市信息，匹配城市
   */
  matchLocation(resume, company) {
    const cityText = (resume.city || '').toLowerCase();
    if (!cityText) return 70; // 无城市默认70%

    const targetCity = company.city.toLowerCase();

    // 完全匹配
    if (cityText === targetCity) return 98;

    // 同一城市
    if (cityText.includes(targetCity) || targetCity.includes(cityText)) return 90;

    // 同城等级
    const tier1 = CITY_TIERS[resume.city] || '';
    const tier2 = CITY_TIERS[company.city] || '';

    // 同省或同区
    const sameProvinceMap = {
      '广州': ['深圳', '东莞', '佛山', '珠海'], '深圳': ['广州', '东莞', '佛山', '珠海'],
      '杭州': ['宁波', '温州'], '南京': ['苏州', '无锡', '常州'],
      '成都': ['重庆'], '重庆': ['成都'],
      '北京': ['天津'], '天津': ['北京'],
      '上海': ['苏州', '杭州', '宁波'],
      '苏州': ['上海', '南京', '无锡', '常州'],
      '武汉': ['长沙'], '长沙': ['武汉'],
      '西安': ['郑州'], '郑州': ['西安'],
    };

    if (sameProvinceMap[resume.city]?.includes(company.city)) return 80;
    if (sameProvinceMap[company.city]?.includes(resume.city)) return 80;

    // 同等级城市
    if (tier1 && tier2 && tier1 === tier2) return 70;

    return 50;
  },

  /**
   * 提取匹配到的关键词（用于展示）
   */
  extractKeywords(resume, company) {
    const allText = [
      resume.skills, resume.experience, resume.projects, resume.major
    ].filter(Boolean).join(' ').toLowerCase();

    const matched = [];
    const skillProfile = POSITION_SKILLS[company.pos];
    if (skillProfile) {
      for (const kw of skillProfile.keywords) {
        if (allText.includes(kw.toLowerCase())) {
          matched.push(kw);
        }
      }
    }

    // 再加一些行业tags匹配
    for (const tag of company.tags) {
      if (allText.includes(tag.toLowerCase())) {
        matched.push(tag);
      }
    }

    return [...new Set(matched)].slice(0, 10);
  },

  /**
   * 模拟简历优化（纯前端，无 API 调用）
   */
  optimizeResume(resumeText, jdText) {
    // 智能提取简历各部分
    const resume = this.parseResume(resumeText);

    // 提取 JD 中的关键词
    const jdKeywords = this.extractJDKeywords(jdText);

    // 生成优化建议
    const suggestions = this.generateSuggestions(resume, jdKeywords);

    return {
      optimized: this.buildOptimizedResume(resume, jdKeywords, suggestions),
      suggestions,
      matchedKeywords: jdKeywords.slice(0, 8)
    };
  },

  /**
   * 解析简历文本
   */
  parseResume(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const result = { education: [], experience: [], projects: [], skills_list: [] };
    let currentSection = 'other';

    for (const line of lines) {
      const trimmed = line.trim();
      if (/教育|学校|大学|专业|学历|本科|硕士|博士|课程/.test(trimmed)) {
        currentSection = 'education';
        result.education.push(trimmed);
      } else if (/项目|比赛|竞赛|课题/.test(trimmed) && !/项目经历/.test(currentSection)) {
        currentSection = 'projects';
        result.projects.push(trimmed);
      } else if (/实习|工作|经历|经验|就职/.test(trimmed) && currentSection !== 'education' && currentSection !== 'projects') {
        currentSection = 'experience';
        result.experience.push(trimmed);
      } else if (/技能|工具|掌握|熟练/.test(trimmed) && currentSection !== 'education' && currentSection !== 'projects' && currentSection !== 'experience') {
        currentSection = 'skills_list';
        result.skills_list.push(trimmed);
      } else {
        if (currentSection === 'education') result.education.push(trimmed);
        else if (currentSection === 'experience') result.experience.push(trimmed);
        else if (currentSection === 'projects') result.projects.push(trimmed);
        else if (currentSection === 'skills_list') result.skills_list.push(trimmed);
      }
    }

    return result;
  },

  /**
   * 从 JD 中提取关键词
   */
  extractJDKeywords(jdText) {
    const allKeywords = new Set();

    // 收集所有职位的关键词
    Object.values(POSITION_SKILLS).forEach(profile => {
      profile.keywords.forEach(kw => allKeywords.add(kw));
    });

    const jdLower = jdText.toLowerCase();
    return [...allKeywords].filter(kw => jdLower.includes(kw.toLowerCase()));
  },

  /**
   * 生成优化建议
   */
  generateSuggestions(resume, jdKeywords) {
    const tips = [];

    if (jdKeywords.length === 0) {
      tips.push('建议在目标岗位JD中补充更详细的技术要求关键词，帮助AI更精准分析');
    }

    if (resume.skills_list.length < 2) {
      tips.push('建议补充技能清单部分，列出与目标岗位相关的技术栈和工具');
    }

    if (resume.projects.length < 2) {
      tips.push('建议补充项目经历，特别是与目标岗位相关的实践项目');
    }

    tips.push('使用数据量化成果（如"提升效率30%"而非"提升效率"）');
    tips.push('突出与目标岗位JD重合的关键词，提高ATS系统筛选通过率');

    return tips;
  },

  /**
   * 构建优化后的简历文本
   */
  buildOptimizedResume(resume, jdKeywords, suggestions) {
    const parts = [];

    // 教育背景
    if (resume.education.length > 0) {
      parts.push('📌 教育背景');
      parts.push(...resume.education.map(l => l.trim()));
      parts.push('');
    }

    // 技能清单（优化后加粗匹配关键词）
    const skillSection = resume.skills_list.length > 0
      ? resume.skills_list.join('\n')
      : '技能清单：' + (jdKeywords.length > 0 ? jdKeywords.slice(0, 6).join('、') : '请补充与目标岗位相关的技能');
    parts.push('📌 专业技能');
    parts.push(skillSection);
    parts.push('');

    // 项目经历
    if (resume.projects.length > 0) {
      parts.push('📌 项目经历');
      parts.push(...resume.projects.map(l => l.trim()));
      parts.push('');
    }

    // 实习经历
    if (resume.experience.length > 0) {
      parts.push('📌 实习/工作经历');
      parts.push(...resume.experience.map(l => l.trim()));
      parts.push('');
    }

    // 优化建议附在末尾
    parts.push('---');
    parts.push('💡 AI优化建议');
    suggestions.forEach((s, i) => parts.push(`${i + 1}. ${s}`));

    return parts.join('\n');
  }
};
