
        /* ===================== 原型导航 收起/展开 ===================== */
        function togglePageNav() {
            var nav = document.querySelector('.page-nav');
            var btn = document.getElementById('pageNavToggle');
            if (!nav) return;
            var collapsed = nav.classList.toggle('collapsed');
            if (btn) btn.classList.toggle('collapsed', collapsed);
            try { localStorage.setItem('pageNavCollapsed', collapsed ? 'true' : 'false'); } catch (e) {}
        }
        (function restorePageNav() {
            try {
                if (localStorage.getItem('pageNavCollapsed') === 'true') {
                    var nav = document.querySelector('.page-nav');
                    var btn = document.getElementById('pageNavToggle');
                    if (nav) nav.classList.add('collapsed');
                    if (btn) btn.classList.add('collapsed');
                }
            } catch (e) {}
        })();

        /* ===================== 数据 ===================== */
        // 初始项目（刚创建）：读取 localStorage.newProjectData，缺省给出一个示例新项目
        var newProject = (function () {
            var d = null;
            try { d = JSON.parse(localStorage.getItem('newProjectData')); } catch (e) { d = null; }
            if (!d) d = {};
            var area = d.area ? (parseFloat(d.area).toFixed(1) + 'm²') : '75.0m²';
            var houseType = d.houseType || '2室1厅';
            var groups = (d.groups && Array.isArray(d.groups)) ? d.groups.length : 0;
            return {
                name: d.projectName || 'XX小区整体装修',
                status: d.status || '进行中',
                address: d.address || 'XX小区***号***室',
                area: area + ' ' + houseType,
                contractSigned: 0, contractTotal: 0, taskDone: 0, taskTotal: 0,
                trade: '', todoCount: 0, groupCount: groups
            };
        })();

        var PROJECTS = [ newProject ];

        var currentIndex = 0;
        var currentRole = 'nonworker'; // 初始项目页：项目创建者（非工人视角）
        var panelFilter = 'all';

        /* ===================== 渲染：项目切换条 ===================== */
        function renderSwitchBar() {
            var p = PROJECTS[currentIndex];
            document.getElementById('curProjName').textContent = p.name;
            var st = document.getElementById('curProjStatus');
            st.textContent = p.status;
            st.className = 'proj-status' + (p.status === '已完工' || p.status === '已完成' ? ' done' : '');
            document.getElementById('topHero').textContent = '项目信息';
        }

        function renderPanel() {
            var list = PROJECTS.filter(function (p) {
                if (panelFilter === 'ongoing') return p.status === '进行中';
                if (panelFilter === 'done') return p.status === '已完工' || p.status === '已完成';
                return true;
            });
            if (list.length === 0) {
                document.getElementById('projPanelInner').innerHTML = '<div class="proj-empty">暂无匹配的项目</div>';
                return;
            }
            var html = list.map(function (p) {
                var realIdx = PROJECTS.indexOf(p);
                var pct = p.contractTotal ? Math.round(p.contractSigned / p.contractTotal * 100) : 0;
                var active = realIdx === currentIndex ? ' active' : '';
                var done = p.status === '已完工' ? ' done' : '';
                return '<div class="proj-option' + active + '" onclick="selectProject(' + realIdx + ')">' +
                    '<div class="po-top"><span class="po-name">' + p.name + '</span>' +
                    '<span class="po-status' + done + '">' + p.status + '</span></div>' +
                    '<div class="po-addr">📍 ' + p.address + '</div>' +
                    '<div class="po-stats"><span>合同 ' + p.contractSigned + '/' + p.contractTotal + '</span>' +
                    '<span>任务 ' + p.taskDone + '/' + p.taskTotal + '</span></div>' +
                    '<div class="po-bar"><div class="po-bar-fill" style="width:' + pct + '%"></div></div>' +
                    '</div>';
            }).join('');
            document.getElementById('projPanelInner').innerHTML = html;
        }

        /* 架构层级选项（非工人默认项目部 / 工人默认泥瓦工作组；两视角共用同一组件） */
        function buildLevelOptions(selected) {
            var defs = [
                { name: '项目部', icon: '🏢', type: 'project', count: '0个工作组 · 0份合同' },
                { name: '水电工作组', icon: '⚡', type: 'workgroup', count: '3个施工组 · 2份合同' },
                { name: '泥瓦工作组', icon: '⚡', type: 'workgroup', count: '2个施工组 · 1份合同' },
                { name: '木工工作组', icon: '⚡', type: 'workgroup', count: '2个施工组 · 1份合同' },
                { name: '油漆工作组', icon: '⚡', type: 'workgroup', count: '1个施工组 · 1份合同' }
            ];
            return defs.map(function (d) {
                var sel = d.name === selected;
                var badge = d.type === 'project' ? '项目部' : '工作组';
                return '<div class="level-option' + (sel ? ' selected' : '') + '" onclick="pickLevel(this, event)">' +
                    '<div class="icon">' + d.icon + '</div>' +
                    '<div class="info"><div class="name">' + d.name + '</div><div class="count">' + d.count + '</div></div>' +
                    '<div class="check" style="visibility:' + (sel ? 'visible' : 'hidden') + ';">✓</div></div>';
            }).join('');
        }

        /* ===================== 渲染：初始项目详情（整体布局对齐项目列表页） ===================== */
        function renderInitial(p) {
            var levels = buildLevelOptions('项目部');

            return                 '<div class="detail-fade">' +
                // 待办事项（初始态：暂无待办 + 创建工作组引导）
                '<div class="card"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">0</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="empty-tip"><span class="emoji">🗒️</span>项目刚创建，暂无待办<br>完善信息、搭建架构后将自动生成</div>' +
                    '<button class="add-arch-btn" onclick="go(\'architecture.html\')">＋ 创建工作组 / 施工组</button>' +
                '</div>' +
                // 我的任务（初始态：0/0）
                '<div class="card my-task-card" onclick="openPage(\'task-list.html?role=exec\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                // 吸顶快捷入口 + 架构
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav" id="quickNav">' +
                        '<div class="quick-nav-item" onclick="go(\'architecture.html\')"><div class="icon structure">🏗️</div><div class="label">架构</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'member.html\')"><div class="icon member">👥</div><div class="label">成员</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'project-files.html\')"><div class="icon file">📁</div><div class="label">资料</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'statement-list.html\')"><div class="icon statement">💰</div><div class="label">对账单</div></div></div>' +
                    '<div class="level-selector arch-half" id="levelSelector"><div class="level-dropdown" onclick="toggleLevelOpts(this)">' +
                        '<div class="current"><div class="icon">🏢</div><div>' +
                        '<div class="text-row"><div class="text">项目部</div><div class="type-badge project">项目部</div></div>' +
                        '<div class="breadcrumb-inline"><span class="breadcrumb-item active">项目部</span></div></div></div>' +
                        '<div class="arrow">▼</div></div>' +
                        '<div class="level-options">' + levels + '</div></div>' +
                '</div>' +
                // 合同概览 / 任务统计（初始态：均为 0）
                '<div class="stats-row">' +
                    '<div class="card contract-half"><div class="card-title"><span>📄 合同概览</span><span class="more" onclick="toggleContractNW(this)">查看合同 <span class="arrow">▼</span></span></div>' +
                        '<div class="contract-summary"><div class="contract-stat"><div class="value"><span class="current">0</span><span class="separator">/</span><span class="total">0</span></div><div class="label">合同签约</div></div>' +
                        '<div class="contract-stat"><div class="value">0<span class="total">%</span></div><div class="label">总进度</div></div></div>' +
                        '<div class="contract-list" id="contractListNW"><div class="empty-tip"><span class="emoji">📄</span>暂无合同，前往「架构」创建工作组后可发起</div></div></div>' +
                    '<div class="card task-half"><div class="card-title"><span>📊 任务统计</span><span class="more" onclick="go(\'task-list.html\')">查看全部 ></span></div>' +
                        '<div class="task-stats">' +
                            '<div class="task-stat-item"><div class="icon-wrap all">📋</div><div class="info"><div class="value"><span class="current">0</span><span class="separator">/</span><span class="total">0</span></div><div class="label">全部任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap accept">⏳</div><div class="info"><div class="value">0</div><div class="label">确认中任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap contract">▶</div><div class="info"><div class="value">0</div><div class="label">执行中任务</div></div></div>' +
                        '</div></div>' +
                '</div>' +
                // 今日动态（初始态：暂无动态）
                '<div class="card indent-card"><div class="card-title"><span>📝 今日动态</span><span class="more" onclick="go(\'activity-list.html\')">查看全部 ></span></div>' +
                    '<div class="empty-tip"><span class="emoji">📭</span>暂无动态，项目开工后将在此展示进展</div></div>' +
                '</div>';
        }

        /* 工人视角初始项目详情（单页演示开关切换；顶部单一项目信息头与全局切换条共用） */
        function renderInitialWorker(p) {
            var trade = p.trade || '泥瓦';
            var levels = buildLevelOptions(trade + '工作组');
            return '<div class="detail-fade">' +
                // 待办事项（工人视角：初始态 0 待办，与项目列表工人视角一致）
                '<div class="card todo-card worker"><div class="card-title"><span>📋 待办事项</span>' +
                    '<span class="badge-wrap"><span class="badge">0</span></span>' +
                    '<span class="more" onclick="openPage(\'todo-list.html\')">查看全部 ></span></div>' +
                    '<div class="todo-content"><div class="empty-state" style="font-size:12px;color:#999;padding:8px 0;">暂无待办，待工长分配任务、发起合同后在此显示</div></div></div>' +
                // 我的任务（工人视角：0/0）
                '<div class="card my-task-card worker" onclick="openPage(\'task-list.html?role=exec\')"><div class="card-title"><span>📌 我的任务</span><span class="more">查看全部 ></span></div>' +
                    '<div class="my-task-stats">' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">已完成</div></div>' +
                        '<div class="my-task-divider"></div>' +
                        '<div class="my-task-stat"><div class="value">0</div><div class="label">我作为执行人的全部任务</div></div>' +
                    '</div></div>' +
                // 吸顶快捷入口 + 架构（工人视角，与项目列表工人视角一致）
                '<div class="sticky-header" id="stickyHeader">' +
                    '<div class="quick-nav" id="quickNavWork">' +
                        '<div class="quick-nav-item keep" onclick="go(\'activity-list.html\')"><div class="icon activity">📝</div><div class="label">项目动态</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'architecture.html\')"><div class="icon structure">🏗️</div><div class="label">架构</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'member.html\')"><div class="icon member">👥</div><div class="label">成员</div></div>' +
                        '<div class="quick-nav-item" onclick="go(\'project-files.html\')"><div class="icon file">📁</div><div class="label">资料</div></div></div>' +
                    '<div class="level-selector arch-half" id="levelSelectorWork"><div class="level-dropdown" onclick="toggleLevelOpts(this)">' +
                        '<div class="current"><div class="icon">⚡</div><div>' +
                        '<div class="text-row"><div class="text">' + trade + '工作组</div><div class="type-badge workgroup">工作组</div></div>' +
                        '<div class="breadcrumb-inline"><span class="breadcrumb-item">项目部</span><span class="separator">›</span><span class="breadcrumb-item active">' + trade + '工作组</span></div>' +
                        '<div class="level-default-hint">默认我的工作组</div></div></div>' +
                        '<div class="arrow">▼</div></div>' +
                        '<div class="level-options">' + levels + '</div></div>' +
                '</div>' +
                // 合同 / 任务统计（工人视角：初始态均为 0）
                '<div class="stats-row">' +
                    '<div class="card contract-half worker"><div class="card-title"><span>📄 合同</span></div>' +
                        '<div class="contract-list show" id="contractListWorker"><div class="empty-state" style="font-size:12px;color:#999;padding:8px 0;">暂无合同，待工长发起班组合同后在此查看</div></div></div>' +
                    '<div class="card task-half worker"><div class="card-title"><span>📊 任务统计</span><span class="more" onclick="go(\'task-list.html\')">查看全部 ></span></div>' +
                        '<div class="task-stats">' +
                            '<div class="task-stat-item"><div class="icon-wrap all">📋</div><div class="info"><div class="value"><span class="current">0</span><span class="separator">/</span><span class="total">0</span></div><div class="label">全部任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap accept">⏳</div><div class="info"><div class="value">0</div><div class="label">确认中任务</div></div></div>' +
                            '<div class="task-stat-item"><div class="icon-wrap contract">▶</div><div class="info"><div class="value">0</div><div class="label">执行中任务</div></div></div>' +
                        '</div></div>' +
                '</div>' +
                '</div>';
        }

        /* ===================== 顶部一行：项目名/切换（切换条已承载，无需额外摘要） ===================== */

        /* ===================== 主渲染 ===================== */
        function renderDetail() {
            var p = PROJECTS[currentIndex];
            var area = document.getElementById('detailArea');
            area.innerHTML = (currentRole === 'worker') ? renderInitialWorker(p) : renderInitial(p);
        }

        /* ===================== 交互 ===================== */
        function togglePanel() {
            var panel = document.getElementById('projPanel');
            var arrow = document.getElementById('switchArrow');
            var open = panel.classList.toggle('open');
            arrow.classList.toggle('open', open);
        }

        function selectProject(i) {
            currentIndex = i;
            renderSwitchBar();
            renderPanel();
            togglePanel();
            renderDetail();
        }

        function setPanelFilter(f, el) {
            panelFilter = f;
            var items = document.querySelectorAll('#projPanelFilter .pf-item');
            items.forEach(function (it) { it.classList.remove('active'); });
            if (el) el.classList.add('active');
            renderPanel();
        }

        function createProject() {
            location.href = 'create-project.html';
        }

        function toggleLevelOpts(el) {
            var box = el.parentElement.querySelector('.level-options');
            var arrow = el.querySelector('.arrow');
            var open = box.classList.toggle('open');
            arrow.classList.toggle('open', open);
        }

        function pickLevel(el, e) {
            if (e) e.stopPropagation();
            var opts = el.parentElement.querySelectorAll('.level-option');
            opts.forEach(function (o) {
                o.classList.remove('selected');
                var c = o.querySelector('.check');
                if (c) c.style.visibility = 'hidden';
            });
            el.classList.add('selected');
            var c = el.querySelector('.check');
            if (c) c.style.visibility = 'visible';
            var selector = el.closest('.level-selector');
            if (!selector) return;
            var dd = selector.querySelector('.level-dropdown');
            if (!dd) return;
            var icon = el.querySelector('.icon') ? el.querySelector('.icon').textContent : '';
            var name = el.querySelector('.info .name') ? el.querySelector('.info .name').textContent : '';
            var isProject = name === '项目部';
            var cur = dd.querySelector('.current');
            if (cur) {
                var ci = cur.querySelector('.icon'); if (ci) ci.textContent = icon;
                var tx = cur.querySelector('.text-row .text'); if (tx) tx.textContent = name;
                var badge = cur.querySelector('.text-row .type-badge');
                if (badge) { badge.textContent = isProject ? '项目部' : '工作组'; badge.className = 'type-badge ' + (isProject ? 'project' : 'workgroup'); }
                var bc = cur.querySelector('.breadcrumb-inline .breadcrumb-item.active'); if (bc) bc.textContent = name;
            }
            var box = selector.querySelector('.level-options');
            if (box) box.classList.remove('open');
            var arrow = dd.querySelector('.arrow');
            if (arrow) arrow.classList.remove('open');
        }

        /* 滚动联动：仅维护吸顶阴影 */
        (function initScrollFx() {
            var scroller = document.getElementById('detailArea');
            if (!scroller) return;
            scroller.addEventListener('scroll', function () {
                var top = scroller.scrollTop;
                var sh = document.getElementById('stickyHeader');
                if (sh) {
                    if (top > 4) sh.classList.add('with-shadow');
                    else sh.classList.remove('with-shadow');
                }
            }, { passive: true });
        })();

        function navigate(href) { if (href) window.location.href = href; }
        function go(href) { navigate(href); }
        function openPage(href) { window.location.href = href; }

        function toggleContractNW(el) {
            var list = document.getElementById('contractListNW');
            if (!list) return;
            var shown = list.classList.toggle('show');
            if (el) {
                var arrow = el.querySelector('.arrow');
                if (arrow) arrow.classList.toggle('open', shown);
            }
        }

        function viewProjectInfo() {
            window.location.href = 'project-info.html';
        }

        function showToast(msg) {
            var t = document.createElement('div');
            t.textContent = msg;
            t.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.8);color:#fff;font-size:13px;padding:10px 16px;border-radius:8px;z-index:200;white-space:nowrap;';
            document.querySelector('.phone-frame').appendChild(t);
            setTimeout(function () { t.remove(); }, 1600);
        }

        /* 角色演示开关：非工人 / 工人 视角切换（单页内切换，替代独立工人页） */
        function toggleRoleSwitch(checked) {
            currentRole = checked ? 'worker' : 'nonworker';
            var rs = document.getElementById('roleStatus');
            if (rs) {
                rs.textContent = currentRole === 'worker' ? '工人' : '非工人';
                rs.classList.toggle('worker', checked);
            }
            renderDetail();
        }
        /* 工人视角交互：层级切换 / 吸顶阴影由通用逻辑处理（见上） */

        /* ===================== 点击面板外部自动收起 ===================== */
        document.addEventListener('click', function (e) {
            var panel = document.getElementById('projPanel');
            var topbar = document.querySelector('.topbar');
            if (panel.classList.contains('open') && !topbar.contains(e.target)) {
                togglePanel();
            }
            // 层级下拉外部点击收起
            var ls = document.querySelector('.level-selector');
            if (ls && !ls.contains(e.target)) {
                var lo = ls.querySelector('.level-options');
                if (lo) lo.classList.remove('open');
                var la = ls.querySelector('.arrow');
                if (la) la.classList.remove('open');
            }
        });

        /* ===================== 初始化 ===================== */
        renderSwitchBar();
        renderPanel();
        renderDetail();
    