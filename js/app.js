/**
 * 职途星图 · 主应用 v2.0
 * 无外部依赖，纯前端匹配引擎，本地模拟 AI 优化
 */
(function () {
  'use strict';

  // ===== DOM Helpers =====
  const $ = id => document.getElementById(id);
  const bd = () => $('body');
  const body = bd;

  // ===== Toast =====
  const toast = $('toast');
  function showToast(msg, isError) {
    toast.textContent = msg;
    toast.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
  }

  // ===== Escape HTML (XSS prevention) =====
  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Tab System =====
  let currentTab = 'resume';
  let matchState = 0; // 0=welcome, 1=results, 2=detail
  let matchPage = 1;
  let matchQuery = '';
  let matchFilter = '';
  const PAGE_SIZE = 20;
  let resumeCache = null; // Cached parsed resume for match
  let optimizedCache = null; // Cache for optimized result text and parsed fields

  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      if (tabName === currentTab) return;
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentTab = tabName;
      bd().scrollTop = 0;
      render(tabName);
    });
  });

  // Keyboard navigation for tabs
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const active = document.querySelector('.tab.active');
    const idx = [...tabs].indexOf(active);
    const next = e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    tabs[next].focus();
    tabs[next].click();
    e.preventDefault();
  });

  // ===== Render Router =====
  function render(tab) {
    switch (tab) {
      case 'resume': renderResume(); break;
      case 'match': renderMatch(); break;
      case 'leaders': renderLeaders(); break;
      case 'salary': renderSalary(); break;
    }
  }

  // ======================================================================
  // TAB 1: 简历优化 (模拟 AI, 无外部 API)
  // ======================================================================
  function renderResume() {
    body().innerHTML = `
      <div class="card hero" style="background:var(--gradient-primary)">
        <h3>📄 AI 简历优化</h3>
        <p>输入简历和目标岗位JD，AI帮你优化 · 本地智能引擎</p>
      </div>
      <div class="card">
        <div class="api-status" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;font-size:0.72rem;background:var(--green-bg);color:var(--green);margin-bottom:12px">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block"></span>
          离线优化引擎已就绪 · 无需外部API
        </div>
        <div class="input-group">
          <label>📝 你的简历</label>
          <textarea id="ri" rows="6" placeholder="粘贴或输入简历内容...">教育背景
岭南师范学院 · 物联网工程 · 本科 · 2027届
核心课程：数据结构、数据库原理、嵌入式系统、传感器原理

项目经历
AI求职匹配分析平台（智联招聘AI创新大赛）
- 使用Claude Code搭建推荐系统原型，设计岗位-简历语义匹配算法
- 收集用户行为数据进行清洗分析，优化推荐算法
- 负责产品Demo演示与项目路演

实习经历
易事达光电广东股份有限公司 · 财务数据助理
- 运用Excel高级函数处理数百条交易记录，提升数据处理效率40%
- 独立编制盘点差异分析报告

技能
Python, SQL, Excel, Axure, Figma, 数据分析, 产品设计</textarea>
        </div>
        <div class="input-group">
          <label>🎯 目标岗位JD</label>
          <textarea id="ji" rows="5" placeholder="粘贴职位描述…">AI产品经理（校招）

岗位职责：
1. 负责AI产品的需求分析、产品规划和功能设计
2. 撰写产品需求文档（PRD），协调研发团队推进产品落地
3. 跟踪行业动态和竞品，进行市场调研与分析
4. 通过数据分析驱动产品迭代优化

任职要求：
- 本科及以上学历，计算机/AI/产品设计相关专业
- 对AI技术有深入了解，熟悉大模型产品应用
- 具备优秀的逻辑分析能力和产品思维
- 有数据分析能力，熟练使用SQL/Python优先</textarea>
        </div>
        <button class="btn btn-primary btn-block" style="margin:8px 0" id="di">✨ AI 帮我优化简历</button>
      </div>
      <div class="card" id="rc" style="display:none">
        <h3>📄 AI 优化结果</h3>
        <div id="rco" class="optimize-result"></div>
        <div id="rsug" style="margin-top:12px;padding:12px;background:var(--amber-bg);border-radius:10px;display:none">
          <div style="font-weight:600;font-size:0.78rem;color:var(--amber);margin-bottom:6px">💡 优化建议</div>
          <div id="rsugc" style="font-size:0.75rem;color:var(--text-2);line-height:1.7"></div>
        </div>
        <div id="rmatch" style="margin-top:12px;display:none">
          <button class="btn btn-outline btn-block" id="goMatch">🎯 用这份简历去匹配岗位</button>
        </div>
      </div>`;

    $('di').addEventListener('click', handleOptimize);
    $('goMatch')?.addEventListener('click', () => {
      // 从优化结果解析结构化信息 → 填充匹配表单
      if (optimizedCache) {
        applyOptimizedToCache(optimizedCache);
      }
      document.querySelector('.tab[data-tab="match"]').click();
    });
  }

  function saveResumeFromForm() {
    const text = $('ri')?.value || '';
    const jdText = $('ji')?.value || '';
    resumeCache = MatchEngine.parseResume(text);
    resumeCache._raw = text;
    resumeCache._jdText = jdText;
    // 也从表单中抽取结构化字段
    resumeCache._skills = extractSkillsFromText(text);
    resumeCache._experience = extractExpFromText(text);
    resumeCache._major = extractMajorFromText(text);
    resumeCache._degree = extractDegreeFromText(text);
  }

  /**
   * 从优化结果文本中提取结构化字段
   */
  function extractSkillsFromText(text) {
    const m = text.match(/(?:技能|Skill|掌握|熟练)[：: ]+([^\n]+)/i);
    return m ? m[1].trim() : '';
  }

  function extractExpFromText(text) {
    // 找实习/项目经历段落，取前200字
    const lines = text.split('\n');
    const expLines = [];
    let inExp = false;
    for (const line of lines) {
      if (/(?:项目|实习|工作|经历|实践)/.test(line) && !inExp) { inExp = true; continue; }
      if (inExp) {
        if (/^(?:教育|技能|---)/.test(line)) break;
        if (line.trim()) expLines.push(line.trim());
      }
    }
    return expLines.slice(0, 5).join('\n');
  }

  function extractMajorFromText(text) {
    const m = text.match(/([^，。\n]{2,8}(?:工程|科学|技术|管理|经济|设计|文学|教育|理学|工学))/);
    return m ? m[1] : '';
  }

  function extractDegreeFromText(text) {
    const m = text.match(/(博士|硕士|研究生|本科|大专)/);
    return m ? m[1] : '本科';
  }

  /**
   * 从优化结果解析并更新 resumeCache
   */
  function applyOptimizedToCache(optimizedText) {
    if (!optimizedText) return;
    resumeCache = resumeCache || {};
    resumeCache._raw = optimizedText;
    resumeCache._fromOptimized = true;
    resumeCache._skills = extractSkillsFromText(optimizedText);
    resumeCache._experience = extractExpFromText(optimizedText);
    resumeCache._major = extractMajorFromText(optimizedText);
    resumeCache._degree = extractDegreeFromText(optimizedText);
    // 兼容原有结构
    resumeCache.skills = resumeCache._skills;
    resumeCache.experience = resumeCache._experience;
    resumeCache.major = resumeCache._major;
    resumeCache.degree = resumeCache._degree;
  }

  async function handleOptimize() {
    const r = $('ri').value.trim();
    const j = $('ji').value.trim();
    if (!r || !j) { showToast('请填写简历和JD', true); return; }

    const btn = $('di');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:6px"></span> AI优化中...';

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800));

    try {
      saveResumeFromForm();
      const result = MatchEngine.optimizeResume(r, j);

      // 保存优化结果文本
      optimizedCache = result.optimized;

      $('rc').style.display = 'block';
      $('rco').textContent = result.optimized;

      if (result.suggestions.length > 0) {
        $('rsug').style.display = 'block';
        $('rsugc').innerHTML = result.suggestions.map(s => '• ' + esc(s)).join('<br>');
      }

      // Show the "go match" button
      const matchBtn = $('rmatch');
      if (matchBtn) {
        matchBtn.style.display = 'block';
        // Show matched keywords
        const kwDiv = document.createElement('div');
        kwDiv.style.cssText = 'margin-top:8px;font-size:0.72rem;color:var(--text-2)';
        kwDiv.innerHTML = '🔑 已识别关键词：' + (result.matchedKeywords.length > 0
          ? result.matchedKeywords.map(k => `<span class="segment blue" style="margin:2px">${esc(k)}</span>`).join(' ')
          : '暂无');
        matchBtn.prepend(kwDiv);
      }

      showToast('✅ 简历优化完成');
    } catch (e) {
      showToast('优化失败: ' + e.message, true);
    }

    btn.disabled = false;
    btn.textContent = '✨ AI 帮我优化简历';
  }

  // ======================================================================
  // TAB 2: 智能匹配 (先填简历 → 再计算匹配)
  // ======================================================================
  function renderMatch() {
    matchState = 0;
    matchPage = 1;
    matchQuery = '';
    matchFilter = '';

    body().innerHTML = `
      <div class="card hero" style="background:var(--gradient-pink)">
        <h3>🎯 智能岗位匹配</h3>
        <p>${resumeCache?._fromOptimized ? '✅ 已从优化结果自动填充，可继续修改或直接匹配' : '先填写/修改简历，系统自动计算四维匹配度'}</p>
      </div>
      <div class="card">
        <div class="input-group">
          <label>✏️ 你的姓名</label>
          <input id="mn" placeholder="例如: 张三" value="${esc(resumeCache?.name || '')}">
        </div>
        <div class="input-group">
          <label>🎓 学校</label>
          <input id="msc" placeholder="例如: 岭南师范学院" value="${esc(resumeCache?._school || '')}">
        </div>
        <div class="grid2">
          <div class="input-group">
            <label>📚 专业</label>
            <input id="mm" placeholder="例如: 物联网工程" value="${esc(resumeCache?.major || resumeCache?._major || '')}">
          </div>
          <div class="input-group">
            <label>🎖️ 学历</label>
            <select id="md" style="width:100%;padding:9px 10px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font);background:var(--card);color:var(--text)">
              <option value="本科" ${(resumeCache?.degree || resumeCache?._degree || '本科') === '本科' ? 'selected' : ''}>本科</option>
              <option value="硕士" ${(resumeCache?.degree || resumeCache?._degree) === '硕士' ? 'selected' : ''}>硕士</option>
              <option value="博士" ${(resumeCache?.degree || resumeCache?._degree) === '博士' ? 'selected' : ''}>博士</option>
              <option value="大专" ${(resumeCache?.degree || resumeCache?._degree) === '大专' ? 'selected' : ''}>大专</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label>📍 意向城市</label>
          <input id="mct" placeholder="例如: 北京、上海、广州..." value="${esc(resumeCache?._city || '')}">
        </div>
        <div class="input-group">
          <label>🔧 技能（逗号分隔）</label>
          <textarea id="msk" rows="2" placeholder="例如: Python, SQL, 数据分析, 产品设计...">${esc(resumeCache?.skills || resumeCache?._skills || '')}</textarea>
        </div>
        <div class="input-group">
          <label>💼 经历简述</label>
          <textarea id="mexp" rows="3" placeholder="简述你的实习和项目经历...">${esc(resumeCache?.experience || resumeCache?._experience || '')}</textarea>
        </div>
        <button class="btn btn-primary btn-block" id="mstart">🚀 开始匹配分析</button>
      </div>
      <div id="mresults"></div>`;

    $('mstart').addEventListener('click', startMatching);
  }

  function collectResumeFromMatchForm() {
    const name = $('mn')?.value || '';
    const school = $('msc')?.value || '';
    const major = $('mm')?.value || '';
    const degree = $('md')?.value || '本科';
    const city = $('mct')?.value || '';
    const skills = $('msk')?.value || '';
    const exp = $('mexp')?.value || '';

    // If no detailed input, try to use cached resume from tab1
    if (!skills && !exp && resumeCache) {
      return resumeCache;
    }

    const resume = {
      name,
      _school: school,
      major,
      _major: major,
      degree,
      _degree: degree,
      city,
      _city: city,
      skills,
      _skills: skills,
      experience: exp,
      projects: exp,
      _experience: exp,
      _raw: [skills, exp, major].filter(Boolean).join('\n')
    };

    resumeCache = resume;
    return resume;
  }

  function startMatching() {
    const resume = collectResumeFromMatchForm();

    // Check if we have enough info
    const allText = [resume.skills, resume.experience, resume.major].filter(Boolean).join('');
    if (!allText || allText.length < 10) {
      showToast('请至少填写技能或经历信息', true);
      return;
    }

    matchState = 1;
    matchPage = 1;
    matchQuery = '';
    matchFilter = '';

    const btn = $('mstart');
    btn.disabled = true;
    btn.textContent = '⏳ 计算匹配中...';

    // Simulate computation delay
    setTimeout(() => {
      btn.style.display = 'none';
      renderMatchResults(resume);
    }, 500);
  }

  function renderMatchResults(resume) {
    const allResults = MatchEngine.matchAll(resume, AC);
    matchState = 1;

    // Store results globally for pagination
    window._matchResults = allResults;

    renderMatchList(allResults);
  }

  function renderMatchList(allResults, resetPage = true) {
    if (resetPage) { matchPage = 1; }

    let filtered = allResults;
    if (matchQuery) {
      const q = matchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.company.toLowerCase().includes(q) ||
        c.pos.toLowerCase().includes(q) ||
        c.dept?.toLowerCase().includes(q)
      );
    }
    if (matchFilter) {
      filtered = filtered.filter(c => c.industry === matchFilter);
    }

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const start = (matchPage - 1) * PAGE_SIZE;
    const page = filtered.slice(start, start + PAGE_SIZE);

    const top = filtered[0];

    // Build filter buttons
    let filterBtns = `<button class="filter-btn${matchFilter === '' ? ' active' : ''}" data-mfi="">全部行业</button>`;
    AI.forEach(i => {
      filterBtns += `<button class="filter-btn${matchFilter === i ? ' active' : ''}" data-mfi="${esc(i)}">${esc(i)}</button>`;
    });

    let html = `
      <div class="card" style="border-left:3px solid var(--primary)">
        <h3>🎯 匹配结果 (${allResults.length} 个岗位)</h3>
        ${top ? `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--border);margin-top:6px">
          <span style="font-size:2rem;font-weight:700;color:var(--green)">${top.match}%</span>
          <div>
            <div style="font-weight:600;font-size:0.85rem">最佳匹配：${esc(top.company)} · ${esc(top.pos)}</div>
            <div style="font-size:0.72rem;color:var(--text-2)">${esc(top.city)} · ${esc(top.industry)}</div>
          </div>
        </div>` : ''}
        <div class="search-bar" style="margin-top:10px">
          <input placeholder="搜索公司、职位…" id="msi" value="${esc(matchQuery)}">
          <button class="btn btn-primary btn-sm" id="msb">🔍</button>
        </div>
        <div class="filter-row">${filterBtns}</div>
        <div style="font-size:0.72rem;color:var(--text-3);margin-bottom:6px">
          共匹配 <strong>${filtered.length}</strong> 个岗位 · 第 ${matchPage}/${totalPages} 页
        </div>
        <div id="mlc"></div>
      </div>`;

    body().innerHTML = html;

    const mc = $('mlc');
    if (!page.length) {
      mc.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有匹配的公司</p></div>';
      attachMatchEvents(allResults);
      return;
    }

    mc.innerHTML = page.map(c => {
      const cl = c.match >= 80 ? 'high' : c.match >= 65 ? 'mid' : 'low';
      const borderColor = c.match >= 80 ? 'var(--green)' : c.match >= 65 ? 'var(--amber)' : 'var(--border)';
      return `<div class="match-card" data-cid="${c.id}" style="border-left:3px solid ${borderColor}">
        <div class="top">
          <span class="company">${esc(c.company)}</span>
          <span class="score ${cl}">${c.match}%</span>
        </div>
        <div class="pos">${esc(c.pos)} · ${esc(c.dept)} · ${esc(c.city)}</div>
        <div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap">
          <span class="segment gray">${esc(c.industry)}</span>
          <span class="segment green">${esc(c.stage)}</span>
          <span class="segment gray">${esc(c.size)}</span>
        </div>
        ${c.matchedKeywords?.length ? `
        <div style="margin-top:6px;display:flex;gap:3px;flex-wrap:wrap">
          ${c.matchedKeywords.slice(0, 4).map(k => `<span class="segment blue">${esc(k)}</span>`).join('')}
        </div>` : ''}
      </div>`;
    }).join('');

    // Pagination
    if (totalPages > 1) {
      let pdiv = '<div class="pagination">';
      pdiv += `<button class="page-btn" id="mpp" ${matchPage <= 1 ? 'disabled' : ''}>‹</button>`;
      for (let i = Math.max(1, matchPage - 2); i <= Math.min(totalPages, matchPage + 2); i++) {
        pdiv += `<button class="page-btn${i === matchPage ? ' active' : ''}" data-pg="${i}">${i}</button>`;
      }
      pdiv += `<button class="page-btn" id="mpn" ${matchPage >= totalPages ? 'disabled' : ''}>›</button></div>`;
      mc.insertAdjacentHTML('afterend', pdiv);
    }

    // Go to detail button
    mc.insertAdjacentHTML('afterend', `
      <button class="btn btn-outline btn-block" style="margin-top:8px" id="showDetail">
        📊 查看 ${esc(top?.company || '')} 详细匹配分析
      </button>`);

    attachMatchEvents(allResults);

    // Detail button
    $('showDetail')?.addEventListener('click', () => {
      if (top) showCompanyDetail(top, allResults);
    });

    // Click match card to see detail
    mc.querySelectorAll('.match-card').forEach(el => {
      el.addEventListener('click', () => {
        const cid = parseInt(el.dataset.cid);
        const company = allResults.find(c => c.id === cid);
        if (company) showCompanyDetail(company, allResults);
      });
    });
  }

  function attachMatchEvents(allResults) {
    // Search
    const inp = $('msi');
    const btn = $('msb');
    if (inp) inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { matchQuery = inp.value; renderMatchList(allResults, true); }
    });
    if (btn) btn.addEventListener('click', () => { matchQuery = inp.value; renderMatchList(allResults, true); });

    // Industry filter
    document.querySelectorAll('[data-mfi]').forEach(el => {
      el.addEventListener('click', () => {
        matchFilter = el.dataset.mfi || '';
        renderMatchList(allResults, true);
      });
    });

    // Pagination
    document.querySelectorAll('[data-pg]').forEach(el => {
      el.addEventListener('click', () => {
        matchPage = parseInt(el.dataset.pg);
        renderMatchList(allResults, false);
      });
    });

    const pp = $('mpp');
    if (pp) pp.addEventListener('click', () => {
      const total = Math.ceil(allResults.length / PAGE_SIZE);
      // Apply current filters to get total
      let filtered = allResults;
      if (matchQuery) {
        const q = matchQuery.toLowerCase();
        filtered = filtered.filter(c => c.company.toLowerCase().includes(q) || c.pos.toLowerCase().includes(q));
      }
      if (matchFilter) {
        filtered = filtered.filter(c => c.industry === matchFilter);
      }
      const tp = Math.ceil(filtered.length / PAGE_SIZE);
      if (matchPage > 1) { matchPage--; renderMatchList(allResults, false); }
    });

    const pn = $('mpn');
    if (pn) pn.addEventListener('click', () => {
      let filtered = allResults;
      if (matchQuery) {
        const q = matchQuery.toLowerCase();
        filtered = filtered.filter(c => c.company.toLowerCase().includes(q) || c.pos.toLowerCase().includes(q));
      }
      if (matchFilter) {
        filtered = filtered.filter(c => c.industry === matchFilter);
      }
      const tp = Math.ceil(filtered.length / PAGE_SIZE);
      if (matchPage < tp) { matchPage++; renderMatchList(allResults, false); }
    });
  }

  // ======================================================================
  // Company Detail Modal
  // ======================================================================
  function showCompanyDetail(company, allResults) {
    const breakdown = company.breakdown || { skill: 65, experience: 60, education: 55, location: 70 };

    // Get top N for comparison
    const ranked = allResults.sort((a, b) => b.match - a.match);
    const rank = ranked.findIndex(c => c.id === company.id) + 1;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="modalClose">✕</button>
        <h2>${esc(company.company)}</h2>
        <div style="display:flex;gap:6px;margin:6px 0 12px;flex-wrap:wrap">
          <span class="segment blue">${esc(company.pos)}</span>
          <span class="segment green">${esc(company.stage)}</span>
          <span class="segment gray">${esc(company.city)}</span>
        </div>

        <div style="text-align:center;padding:16px;background:var(--bg-alt);border-radius:var(--radius-sm);margin-bottom:12px">
          <div style="font-size:2.5rem;font-weight:700;color:var(--green)">${company.match}%</div>
          <div style="font-size:0.75rem;color:var(--text-2)">综合匹配 · 排名 #${rank}/${allResults.length}</div>
        </div>

        <div class="breakdown-grid">
          <div class="breakdown-item">
            <div class="bd-score" style="color:var(--green)">${breakdown.skill}%</div>
            <div class="bd-label">技能匹配</div>
          </div>
          <div class="breakdown-item">
            <div class="bd-score" style="color:var(--primary)">${breakdown.experience}%</div>
            <div class="bd-label">经验匹配</div>
          </div>
          <div class="breakdown-item">
            <div class="bd-score" style="color:#7c3aed">${breakdown.education}%</div>
            <div class="bd-label">教育匹配</div>
          </div>
          <div class="breakdown-item">
            <div class="bd-score" style="color:var(--amber)">${breakdown.location}%</div>
            <div class="bd-label">地域匹配</div>
          </div>
        </div>

        <div class="modal-detail-row"><span class="label">行业</span><span>${esc(company.industry)}</span></div>
        <div class="modal-detail-row"><span class="label">部门</span><span>${esc(company.dept)}</span></div>
        <div class="modal-detail-row"><span class="label">规模</span><span>${esc(company.size)}</span></div>
        <div class="modal-detail-row"><span class="label">融资阶段</span><span>${esc(company.stage)}</span></div>

        <h3 style="margin-top:14px;font-size:0.82rem">🏷️ 业务标签</h3>
        <div class="modal-tags">
          ${company.tags.map(t => `<span class="segment blue">${esc(t)}</span>`).join('')}
        </div>

        ${company.matchedKeywords?.length ? `
        <h3 style="margin-top:14px;font-size:0.82rem">✅ 匹配的关键词</h3>
        <div class="modal-tags">
          ${company.matchedKeywords.map(k => `<span class="segment green">✓ ${esc(k)}</span>`).join('')}
        </div>` : ''}

        <div class="bar-wrap" style="margin-top:16px">
          <div class="bar-label"><span>综合匹配</span><span class="val">${company.match}%</span></div>
          <div class="bar-track"><div class="bar-fill green" style="width:${company.match}%"></div></div>
        </div>

        <button class="btn btn-outline btn-block" style="margin-top:12px" id="backToList">← 返回列表</button>
      </div>`;

    body().appendChild(overlay);

    $('modalClose').addEventListener('click', () => overlay.remove());
    $('backToList').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ======================================================================
  // TAB 3: 龙头榜单 (v2.0 - 多榜单 + 领奖台 + 排序)
  // ======================================================================
  let leaderFilterIndustry = '';
  let leaderSortBy = 'composite';
  let leaderSubTab = 'all';

  // 公司声望评分 (纯基于融资阶段与公司规模)
  function calcCompanyPrestige(c) {
    const stageScore = {
      '世界500强': 95, '行业龙头': 85, '已上市': 70, 'C轮': 60,
      'D轮': 65, 'B轮': 55, '成长': 50, '初创': 35
    }[c.stage] || 40;

    const sizeScore = {
      '10000人以上': 95, '5000-10000人': 80, '1000-5000人': 65,
      '500-1000人': 50, '200-500人': 40, '50-200人': 30, '少于50人': 20
    }[c.size] || 35;

    return Math.round(stageScore * 0.60 + sizeScore * 0.40);
  }

  // 行业龙头标签统计数据
  function getLeaderStats() {
    const stats = {};
    AI.forEach(ind => {
      const companies = AC.filter(c => c.industry === ind && (c.stage === '行业龙头' || c.stage === '世界500强'));
      stats[ind] = { count: companies.length, avgScore: Math.round(companies.reduce((s, c) => s + calcCompanyPrestige(c), 0) / (companies.length || 1)) };
    });
    return stats;
  }

  function renderLeaders() {
    const stats = getLeaderStats();
    const allCount = AI.reduce((s, ind) => s + stats[ind].count, 0);

    // 副导航栏: 精选榜单切换
    const subTabs = [
      { key: 'all', label: '综合总榜', icon: '👑' },
      { key: 'fortune500', label: '世界500强', icon: '🌍' },
      { key: 'industryLeader', label: '行业龙头', icon: '🏢' },
      { key: 'rising', label: '高潜新秀', icon: '🚀' }
    ];

    const subNavHTML = subTabs.map(t =>
      `<button class="filter-btn${leaderSubTab === t.key ? ' active' : ''}" data-lsub="${t.key}">${t.icon} ${t.label}</button>`
    ).join('');

    // 排序控制
    const sortOptions = [
      { key: 'composite', label: '声望排名' },
      { key: 'stage', label: '企业规模' }
    ];
    const sortHTML = sortOptions.map(s =>
      `<button class="segment gray" style="cursor:pointer;font-size:0.65rem;padding:3px 10px;${leaderSortBy === s.key ? 'background:var(--primary);color:#fff;border-color:transparent' : ''}" data-lsort="${s.key}">${s.label}</button>`
    ).join('');

    // 行业过滤器 (带计数)
    const filterItems = [
      `<span class="filter-btn${leaderFilterIndustry === '' ? ' active' : ''}" data-li="">全部 <span style="opacity:0.6;font-size:0.6rem">${allCount}</span></span>`,
      ...AI.map(i =>
        `<span class="filter-btn${leaderFilterIndustry === i ? ' active' : ''}" data-li="${esc(i)}">${esc(i)} <span style="opacity:0.6;font-size:0.6rem">${stats[i].count}</span></span>`
      )
    ].join('');

    body().innerHTML = `
      <div class="card hero" style="background:linear-gradient(135deg,#92400e,#b45309,#d97706);padding:18px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h3 style="color:#fff;font-size:1rem">🏆 龙头榜单</h3>
            <p style="color:rgba(255,255,255,0.75);font-size:0.7rem;margin-top:2px">${allCount}家领军企业 · 12大行业全覆盖</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:1.3rem;font-weight:700;color:#fbbf24">${allCount}</div>
            <div style="font-size:0.6rem;color:rgba(255,255,255,0.6)">上榜企业</div>
          </div>
        </div>
      </div>

      <div class="card" style="padding:12px 14px">
        <div class="filter-row" style="margin-bottom:8px">${subNavHTML}</div>
        <div class="filter-row" style="margin-bottom:8px;border-top:1px solid var(--border);padding-top:8px">
          ${sortHTML}
        </div>
        <div class="search-bar" style="margin-bottom:6px">
          <input placeholder="搜索公司名称…" id="ls" value="">
          <button class="btn btn-primary btn-sm" id="lb">🔍</button>
        </div>
        <div class="filter-row" style="flex-wrap:wrap">${filterItems}</div>
      </div>

      <div id="ll"></div>
      <div id="llmore" style="text-align:center;padding:8px 0 4px"></div>`;

    // 绑定事件
    $('ls').addEventListener('input', renderLeaderList);
    $('lb').addEventListener('click', renderLeaderList);

    document.querySelectorAll('[data-li]').forEach(el => {
      el.addEventListener('click', () => {
        leaderFilterIndustry = el.dataset.li || '';
        document.querySelectorAll('[data-li]').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        renderLeaderList();
      });
    });

    document.querySelectorAll('[data-lsub]').forEach(el => {
      el.addEventListener('click', () => {
        leaderSubTab = el.dataset.lsub;
        document.querySelectorAll('[data-lsub]').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        renderLeaderList();
      });
    });

    document.querySelectorAll('[data-lsort]').forEach(el => {
      el.addEventListener('click', () => {
        leaderSortBy = el.dataset.lsort;
        document.querySelectorAll('[data-lsort]').forEach(x => {
          x.style.background = '';
          x.style.color = '';
        });
        el.style.background = 'var(--primary)';
        el.style.color = '#fff';
        renderLeaderList();
      });
    });

    renderLeaderList();
  }

  function renderLeaderList() {
    const q = ($('ls').value || '').toLowerCase();

    // 筛选逻辑
    let items = AC.filter(c => {
      if (leaderFilterIndustry && c.industry !== leaderFilterIndustry) return false;
      if (q && !c.company.toLowerCase().includes(q)) return false;

      // 子榜单筛选
      switch (leaderSubTab) {
        case 'fortune500':
          return c.stage === '世界500强';
        case 'industryLeader':
          return c.stage === '行业龙头';
        case 'rising':
          return c.match >= 75 && (c.stage === 'B轮' || c.stage === 'C轮' || c.stage === '成长' || c.stage === '初创');
        default: // 'all'
          return c.stage === '行业龙头' || c.stage === '世界500强' ||
                 (c.match >= 80 && (c.stage === '已上市' || c.stage === 'D轮' || c.stage === 'C轮'));
      }
    });

    if (q) {
      // 搜索时放宽条件，任何公司都可以搜到
      items = AC.filter(c =>
        c.company.toLowerCase().includes(q) &&
        (!leaderFilterIndustry || c.industry === leaderFilterIndustry)
      );
    }

    // 排序
    items.sort((a, b) => {
      switch (leaderSortBy) {
        case 'stage': {
          const order = { '世界500强': 6, '行业龙头': 5, '已上市': 4, 'D轮': 3, 'C轮': 2, 'B轮': 1, '成长': 0, '初创': 0 };
          const diff = (order[b.stage] || 0) - (order[a.stage] || 0);
          if (diff !== 0) return diff;
          return calcCompanyPrestige(b) - calcCompanyPrestige(a);
        }
        default: // 'composite'
          return calcCompanyPrestige(b) - calcCompanyPrestige(a);
      }
    });

    const total = items.length;
    const displayItems = items.slice(0, 60);

    const ll = $('ll');
    if (!displayItems.length) {
      ll.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><p>该筛选项下暂无上榜企业</p></div>';
      $('llmore').innerHTML = '';
      return;
    }

    // 领奖台 Top 3 (仅综合排名 & 无搜索 & 无行业筛选时展示)
    const showPodium = leaderSortBy === 'composite' && !q && !leaderFilterIndustry && leaderSubTab === 'all';
    const top3 = showPodium ? items.slice(0, 3) : null;

    let html = '';

    // 领奖台
    if (top3) {
      const podiumColors = [
        { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', medal: '🥇', label: '榜首' },
        { bg: 'linear-gradient(135deg,#94a3b8,#64748b)', medal: '🥈', label: '亚军' },
        { bg: 'linear-gradient(135deg,#cd7f32,#a0522d)', medal: '🥉', label: '季军' }
      ];

      html += `<div class="card" style="padding:14px;margin-bottom:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
          ${top3.map((c, i) => {
            const p = podiumColors[i];
            const prestige = calcCompanyPrestige(c);
            return `<div style="text-align:center;background:${p.bg};border-radius:12px;padding:12px 6px;color:#fff;cursor:pointer" data-cid="${c.id}">
              <div style="font-size:1.2rem;margin-bottom:2px">${p.medal}</div>
              <div style="font-weight:700;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.company)}</div>
              <div style="font-size:0.6rem;opacity:0.85;margin-top:2px">${esc(c.pos)}</div>
              <div style="font-size:1rem;font-weight:700;margin-top:4px">${prestige}<span style="font-size:0.55rem;opacity:0.8">分</span></div>
              <div style="font-size:0.55rem;opacity:0.75">${p.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

      // 绑定 Top 3 点击
    }

    // 榜单头部统计
    html += `<div class="card" style="padding:12px 14px">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:0.8rem;font-weight:600;color:var(--text)">📋 排名列表</div>
        <div style="font-size:0.68rem;color:var(--text-3)">共 ${total} 家</div>
      </div>`;

    // 列表项
    html += displayItems.map((c, i) => {
      const prestige = calcCompanyPrestige(c);
      const rank = i + 1;
      let rankBadge = '';
      if (rank === 1 && showPodium) rankBadge = '<span style="font-size:0.9rem">🥇</span>';
      else if (rank === 2 && showPodium) rankBadge = '<span style="font-size:0.9rem">🥈</span>';
      else if (rank === 3 && showPodium) rankBadge = '<span style="font-size:0.9rem">🥉</span>';
      else rankBadge = `<span style="font-weight:700;font-size:0.75rem;color:${rank <= 10 ? 'var(--primary)' : 'var(--text-3)'}">#${rank}</span>`;

      // 标签: stage badge
      const stageColor = c.stage === '世界500强' ? 'green' : c.stage === '行业龙头' ? 'blue' : 'gray';

      return `<div class="leader-item" data-cid="${c.id}" style="padding:8px 4px;border-radius:8px">
        <div style="width:32px;text-align:center;flex-shrink:0">${rankBadge}</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:5px">
            <span style="font-weight:600;font-size:0.82rem;color:var(--text)">${esc(c.company)}</span>
            <span class="segment ${stageColor}" style="font-size:0.55rem;padding:1px 6px">${esc(c.stage)}</span>
          </div>
          <div style="font-size:0.68rem;color:var(--text-2);margin-top:2px;display:flex;gap:4px;flex-wrap:wrap">
            <span>${esc(c.pos)}</span>
            <span>·</span>
            <span>${esc(c.city)}</span>
            <span>·</span>
            <span>${esc(c.industry)}</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-weight:700;font-size:0.85rem;color:var(--green)">${prestige}<span style="font-size:0.6rem;color:var(--text-3);font-weight:400"> 分</span></div>
          <div style="font-size:0.6rem;color:var(--text-3)">${esc(c.stage)}</div>
        </div>
      </div>`;
    }).join('');

    html += '</div>';
    ll.innerHTML = html;

    // 如果数据超过60条，显示提示
    const moreEl = $('llmore');
    if (total > 60) {
      moreEl.innerHTML = `<span style="font-size:0.72rem;color:var(--text-3)">仅展示前60名 · 共${total}家企业</span>`;
    } else {
      moreEl.innerHTML = '';
    }

    // 点击事件: 公司详情 (列表 + 领奖台)
    ll.querySelectorAll('[data-cid]').forEach(el => {
      el.addEventListener('click', () => {
        const cid = parseInt(el.dataset.cid);
        const company = AC.find(c => c.id === cid);
        if (company) {
          const allResults = MatchEngine.matchAll(resumeCache || {
            skills: '', experience: '', projects: '', major: '',
            degree: '本科', city: ''
          }, [company]);
          showCompanyDetail({ ...company, ...allResults[0] }, [company]);
        }
      });
    });
  }

  // ======================================================================
  // TAB 4: 薪资查询 (含可视化图表)
  // ======================================================================
  function renderSalary() {
    const positions = [...new Set(SAL.map(s => s[0]))];
    const cities = [...new Set(SAL.map(s => s[1]))];

    body().innerHTML = `
      <div class="card hero" style="background:var(--gradient-green)">
        <h3>💰 全国岗位薪资数据库</h3>
        <p>${SAL.length} 条数据 · 覆盖 ${positions.length} 个岗位 · ${cities.length} 个城市</p>
      </div>
      <div class="card">
        <div class="salary-controls">
          <select id="sp">
            <option value="">全部岗位</option>
            ${positions.map(p => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}
          </select>
          <select id="sc">
            <option value="">全部城市</option>
            ${cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
          </select>
        </div>
        <div id="schart" class="chart-container"></div>
        <div style="max-height:350px;overflow-y:auto;margin-top:10px" id="stbl">
          ${renderSalaryTable()}
        </div>
        <p style="font-size:0.65rem;color:var(--text-3);margin-top:8px">数据来源：职途星图薪资数据库 · 校招K/月 · 仅供参考</p>
      </div>`;

    $('sp').addEventListener('change', updateSalaryView);
    $('sc').addEventListener('change', updateSalaryView);
    renderSalaryChart();
  }

  function renderSalaryTable(filterPos, filterCity) {
    let data = SAL;
    if (filterPos) data = data.filter(s => s[0] === filterPos);
    if (filterCity) data = data.filter(s => s[1] === filterCity);

    const rows = data.map(r =>
      `<tr>
        <td style="padding:6px;font-weight:500">${esc(r[0])}</td>
        <td style="padding:6px">${esc(r[1])}</td>
        <td style="padding:6px;text-align:center">${r[2].toFixed(1)}K</td>
        <td style="padding:6px;text-align:center;font-weight:600;color:var(--green)">${r[3].toFixed(1)}K</td>
        <td style="padding:6px;text-align:center">${r[4].toFixed(1)}K</td>
      </tr>`
    ).join('');

    return `<table style="width:100%;font-size:0.68rem;border-collapse:collapse">
      <thead><tr style="background:var(--bg-alt);position:sticky;top:0">
        <th style="padding:6px;text-align:left">岗位</th>
        <th style="padding:6px;text-align:left">城市</th>
        <th style="padding:6px">P25</th>
        <th style="padding:6px">平均</th>
        <th style="padding:6px">P75</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderSalaryChart(filterPos, filterCity) {
    let data = SAL;
    if (filterPos) data = data.filter(s => s[0] === filterPos);
    if (filterCity) data = data.filter(s => s[1] === filterCity);

    // Group by position, average across cities (or show city breakdown)
    // If a specific position is selected, show city comparison
    if (filterPos) {
      // Show bar chart comparing cities
      const byCity = data.filter(s => s[0] === filterPos);
      if (byCity.length === 0) { $('schart').innerHTML = '<div style="text-align:center;padding:10px;color:var(--text-3);font-size:0.75rem">暂无数据</div>'; return; }

      const maxAvg = Math.max(...byCity.map(s => s[3]));
      const bars = byCity.map(s => {
        const pct = (s[3] / maxAvg) * 100;
        return `<div class="salary-bar">
          <span class="bar-label">${esc(s[1])}</span>
          <div class="bar-track-salary">
            <div class="bar-fill-salary" style="width:${Math.max(pct, 15)}%">${s[3].toFixed(1)}K</div>
          </div>
        </div>`;
      }).join('');

      $('schart').innerHTML = `<div style="font-size:0.75rem;font-weight:600;margin-bottom:8px;color:var(--text-2)">📊 ${esc(filterPos)} · 各城市平均薪资对比</div>${bars}`;
    } else if (filterCity) {
      // Show by position in that city
      const byPos = data.filter(s => s[1] === filterCity);
      const maxAvg = Math.max(...byPos.map(s => s[3]));
      const bars = byPos.map(s => {
        const pct = (s[3] / maxAvg) * 100;
        return `<div class="salary-bar">
          <span class="bar-label">${esc(s[0])}</span>
          <div class="bar-track-salary">
            <div class="bar-fill-salary" style="width:${Math.max(pct, 15)}%">${s[3].toFixed(1)}K</div>
          </div>
        </div>`;
      }).join('');

      $('schart').innerHTML = `<div style="font-size:0.75rem;font-weight:600;margin-bottom:8px;color:var(--text-2)">📊 ${esc(filterCity)} · 各岗位平均薪资对比</div>${bars}`;
    } else {
      // Default: Show top 8 highest-paying positions (avg of all cities)
      const posAvg = {};
      data.forEach(s => {
        if (!posAvg[s[0]]) posAvg[s[0]] = { sum: 0, count: 0 };
        posAvg[s[0]].sum += s[3];
        posAvg[s[0]].count++;
      });

      const ranked = Object.entries(posAvg)
        .map(([pos, v]) => [pos, v.sum / v.count])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const maxVal = ranked[0]?.[1] || 1;
      const bars = ranked.map(([pos, avg]) => {
        const pct = (avg / maxVal) * 100;
        return `<div class="salary-bar">
          <span class="bar-label">${esc(pos)}</span>
          <div class="bar-track-salary">
            <div class="bar-fill-salary" style="width:${Math.max(pct, 15)}%">${avg.toFixed(1)}K</div>
          </div>
        </div>`;
      }).join('');

      $('schart').innerHTML = `<div style="font-size:0.75rem;font-weight:600;margin-bottom:8px;color:var(--text-2)">📊 热门岗位全国平均薪资排行</div>${bars}`;
    }
  }

  function updateSalaryView() {
    const pos = $('sp').value;
    const city = $('sc').value;

    // Update table
    $('stbl').innerHTML = renderSalaryTable(pos, city);

    // Update chart
    renderSalaryChart(pos, city);
  }

  // ======================================================================
  // Init
  // ======================================================================
  render('resume');

})();
