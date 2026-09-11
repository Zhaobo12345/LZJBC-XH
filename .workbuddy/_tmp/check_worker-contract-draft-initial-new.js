
    function $(id) { return document.getElementById(id); }
    function showToast(msg) {
        var t = $('appToast'); if (!t) return;
        t.textContent = msg; t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 2200);
    }
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }

    /* ===================== 候选工人 / 工种（意向乙方仅限各工种） ===================== */
    var WORKER_CANDIDATES = [
        { id: 'm-chenzhuang', name: '陈庄', role: '工长' },
        { id: 'm-owner', name: '陈业主', role: '业主' },
        { id: 'm-designer', name: '王设计', role: '设计师' },
        { id: 'm-pm', name: '刘项目总', role: '项目总' },
        { id: 'm-lead', name: '孙工长', role: '工长' },
        { id: 'm-demolition', name: '钱拆除', role: '拆除工' },
        { id: 'm-demolition-2', name: '冯拆建', role: '拆除工' },
        { id: 'm-demolition-3', name: '蒋拆平', role: '拆除工' },
        { id: 'm-shuidian', name: '张水电', role: '水电工' },
        { id: 'm-shuidian-2', name: '韩水通', role: '水电工' },
        { id: 'm-shuidian-3', name: '杨水明', role: '水电工' },
        { id: 'm-muzuo', name: '李木作', role: '木作工' },
        { id: 'm-muzuo-2', name: '赵木森', role: '木作工' },
        { id: 'm-muzuo-3', name: '秦木林', role: '木作工' },
        { id: 'm-niwa', name: '周泥瓦', role: '泥瓦工' },
        { id: 'm-niwa-2', name: '许泥固', role: '泥瓦工' },
        { id: 'm-niwa-3', name: '何泥稳', role: '泥瓦工' },
        { id: 'm-youqi', name: '吴油漆', role: '油漆工' },
        { id: 'm-youqi-2', name: '吕油彩', role: '油漆工' },
        { id: 'm-youqi-3', name: '施油光', role: '油漆工' },
        { id: 'm-xiaolingong', name: '郑零工', role: '小零工' },
        { id: 'm-xiaolingong-2', name: '张零杂', role: '小零工' },
        { id: 'm-xiaolingong-3', name: '孔零活', role: '小零工' }
    ];
    var TRADE_ROLES = ['拆除工', '水电工', '木作工', '泥瓦工', '油漆工', '小零工'];
    var TRADE_CANDIDATES = WORKER_CANDIDATES.filter(function (m) { return TRADE_ROLES.indexOf(m.role) > -1; });
    var TRADE_ROLE_BY_TYPE = {
        demolition: '拆除工', shuidian: '水电工', muzuo: '木作工',
        niwa: '泥瓦工', youqi: '油漆工', xiaolingong: '小零工'
    };
    function getContractTypeCandidates(type) {
        var role = TRADE_ROLE_BY_TYPE[type];
        return TRADE_CANDIDATES.filter(function (m) { return m.role === role; });
    }

    /* ===================== 合同数据与状态 ===================== */
    var STAGE_TEMPLATES = {
        shuidian: {
            contentIntro: '工程内容：强电、弱电、给排水等水电工程，含材料进场、布管布线、设备安装及收尾验收。',
            stages: [
                { name: '材料进场阶段', order: '并行执行', tasks: [
                    { name: '材料采购', exec: '张水电', conf: '陈庄', execStd: '按合同清单采购符合国家标准的电线、管材及配件，留存合格证与检测报告。', confStd: '甲方核对品牌、规格、数量与清单一致并签字。', liableStd: '以次充好或数量不足的，乙方无偿退换并承担延期责任。' },
                    { name: '材料报验', exec: '张水电', conf: '陈庄', execStd: '材料进场后24小时内提交报验单及质量证明文件。', confStd: '甲方现场抽检并签字确认合格后方可使用。', liableStd: '未报验或不合格材料使用的，乙方承担全部返工费用。' }
                ] },
                { name: '布管布线阶段', order: '顺序执行', tasks: [
                    { name: '开槽布管', exec: '张水电', conf: '陈庄', execStd: '按图纸弹线开槽，槽深走向符合规范，管线固定牢固。', confStd: '甲方检查走向、固定及保护层厚度达标。', liableStd: '违规开槽损坏结构的，乙方负责修复并赔偿。' },
                    { name: '穿线接线', exec: '张水电', conf: '陈庄', execStd: '线色线径符合设计，接头压接牢固，绝缘电阻测试合格。', confStd: '甲方抽测绝缘电阻及接线正确性。', liableStd: '接线错误或绝缘不达标的，乙方无偿整改并担责。' },
                    { name: '阶段确认', exec: '张水电', conf: '陈庄', execStd: '提交本阶段全部任务完成证据，发起阶段验收申请。', confStd: '甲方逐条核验交付物，合格签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] },
                { name: '安装阶段', order: '顺序执行', tasks: [
                    { name: '开关插座安装', exec: '张水电', conf: '陈庄', execStd: '底盒端正、高度一致，面板贴合无缝，接地可靠。', confStd: '甲方通电测试及外观检查合格。', liableStd: '安装松动或接线隐患的，乙方无偿修复。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '通水通电测试', exec: '张水电', conf: '陈庄', execStd: '全屋通水通电，管路无渗漏，回路负载测试正常。', confStd: '甲方参与试压试电并签字。', liableStd: '渗漏或电路故障的，乙方无偿返修并担责。' },
                    { name: '阶段确认', exec: '张水电', conf: '陈庄', execStd: '提交收尾完成证据，发起最终阶段验收。', confStd: '甲方核验合格并签字确认。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] }
            ]
        },
        demolition: {
            contentIntro: '工程内容：室内原墙体、饰面拆除及建筑垃圾清运，含防护交底与现场平整。',
            stages: [
                { name: '原墙拆除阶段', order: '顺序执行', tasks: [
                    { name: '防护交底', exec: '钱拆除', conf: '陈庄', execStd: '施工前对成品管线做防护，向甲方交底并确认范围。', confStd: '甲方确认防护到位、交底清楚。', liableStd: '未防护造成损害的，乙方负责修复赔偿。' },
                    { name: '墙体拆除', exec: '钱拆除', conf: '陈庄', execStd: '按方案拆除，保留结构构件，粉尘湿法作业。', confStd: '甲方检查无违规拆改、无结构损伤。', liableStd: '误拆结构构件的，乙方承担修复及赔偿责任。' }
                ] },
                { name: '垃圾清运阶段', order: '顺序执行', tasks: [
                    { name: '建筑垃圾清运', exec: '钱拆除', conf: '陈庄', execStd: '分类装袋、日产日清，合规外运至指定点。', confStd: '甲方确认现场无残留、外运合规。', liableStd: '乱倒或违规清运的责任与费用由乙方承担。' },
                    { name: '现场平整', exec: '钱拆除', conf: '陈庄', execStd: '拆除面清理平整，无尖锐物、无积水。', confStd: '甲方验收地面平整、可进入下道工序。', liableStd: '未达交接标准的，乙方无偿整改。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '阶段确认', exec: '钱拆除', conf: '陈庄', execStd: '提交拆除与清运完成证据，发起阶段验收。', confStd: '甲方核验合格并签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] }
            ]
        },
        muzuo: {
            contentIntro: '工程内容：木作基层、定制柜体制作与安装，含测量放样、五金安装及收尾。',
            stages: [
                { name: '测量放样阶段', order: '并行执行', tasks: [
                    { name: '现场测量', exec: '李木作', conf: '陈庄', execStd: '按图到现场复尺，误差记录并交底。', confStd: '甲方确认尺寸与图纸一致。', liableStd: '测量误差致返工的，乙方担责。' },
                    { name: '深化图纸', exec: '李木作', conf: '陈庄', execStd: '依据复尺深化节点图，经甲方签字。', confStd: '甲方审核节点、收口方案。', liableStd: '图纸错误致浪费的，乙方承担。' }
                ] },
                { name: '木工制作阶段', order: '顺序执行', tasks: [
                    { name: '基层制作', exec: '李木作', conf: '陈庄', execStd: '龙骨基层按图施工，平整牢固、防腐防潮。', confStd: '甲方检查平整度、牢固度。', liableStd: '基层不合格的，乙方无偿整改。' },
                    { name: '柜体安装', exec: '李木作', conf: '陈庄', execStd: '柜体水平垂直、拼缝严密、五金顺畅。', confStd: '甲方验收外观与功能。', liableStd: '安装偏差或损伤的，乙方无偿修复。' }
                ] },
                { name: '安装阶段', order: '顺序执行', tasks: [
                    { name: '五金安装', exec: '李木作', conf: '陈庄', execStd: '铰链拉手等牢固无异响，开合顺畅。', confStd: '甲方功能测试合格。', liableStd: '松脱或异响的，乙方无偿处理。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '阶段确认', exec: '李木作', conf: '陈庄', execStd: '提交木作完成证据，发起阶段验收。', confStd: '甲方核验合格并签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] }
            ]
        },
        niwa: {
            contentIntro: '工程内容：地面找平、防水施工与墙地砖铺贴，含美缝清理。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [
                    { name: '地面找平', exec: '周泥瓦', conf: '陈庄', execStd: '按标高找平，平整度达标，无空鼓。', confStd: '甲方检测平整度、空鼓。', liableStd: '空鼓或超差的，乙方无偿返平。' },
                    { name: '防水施工', exec: '周泥瓦', conf: '陈庄', execStd: '涂刷均匀、厚度达标，阴阳角加强，闭水试验合格。', confStd: '甲方参与闭水试验48h无渗漏。', liableStd: '渗漏的，乙方无偿重做并担责。' }
                ] },
                { name: '贴砖阶段', order: '顺序执行', tasks: [
                    { name: '墙砖铺贴', exec: '周泥瓦', conf: '陈庄', execStd: '排版合理、空鼓率达标、留缝一致、阴阳角方正。', confStd: '甲方抽查空鼓与平整。', liableStd: '空鼓超标的，乙方无偿重铺。' },
                    { name: '地砖铺贴', exec: '周泥瓦', conf: '陈庄', execStd: '坡度正确、无积水，平整牢固。', confStd: '甲方泼水测试排水、检查空鼓。', liableStd: '积水或空鼓的，乙方无偿整改。' },
                    { name: '阶段确认', exec: '周泥瓦', conf: '陈庄', execStd: '提交铺贴完成证据，发起阶段验收。', confStd: '甲方核验合格并签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '美缝清理', exec: '周泥瓦', conf: '陈庄', execStd: '缝隙清理饱满、色泽一致，现场清洁。', confStd: '甲方验收观感与清洁。', liableStd: '美缝缺陷的，乙方无偿补做。' }
                ] }
            ]
        },
        youqi: {
            contentIntro: '工程内容：墙面基层处理、腻子批刮与乳胶漆涂刷，含清理保护。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [
                    { name: '墙面铲除', exec: '吴油漆', conf: '陈庄', execStd: '原饰面铲至基层，无残留、无粉化。', confStd: '甲方检查基层坚实。', liableStd: '铲除不净致脱落的，乙方担责。' },
                    { name: '批刮腻子', exec: '吴油漆', conf: '陈庄', execStd: '两至三遍批刮，平整无砂眼、无开裂。', confStd: '甲方验收平整度、无裂纹。', liableStd: '开裂或脱层的，乙方无偿返工。' }
                ] },
                { name: '腻子阶段', order: '顺序执行', tasks: [
                    { name: '打磨', exec: '吴油漆', conf: '陈庄', execStd: '打磨平整、无划痕，阴阳角顺直。', confStd: '甲方灯光检查无瑕。', liableStd: '打磨瑕疵的，乙方无偿处理。' },
                    { name: '底漆', exec: '吴油漆', conf: '陈庄', execStd: '涂刷均匀、无漏刷、附着力良好。', confStd: '甲方检查无透底。', liableStd: '漏刷或附着力差的，乙方补涂。' }
                ] },
                { name: '油漆阶段', order: '顺序执行', tasks: [
                    { name: '面漆涂刷', exec: '吴油漆', conf: '陈庄', execStd: '两遍涂刷均匀、无色差、无流坠。', confStd: '甲方验收色泽与平整。', liableStd: '色差流坠的，乙方无偿重涂。' },
                    { name: '阶段确认', exec: '吴油漆', conf: '陈庄', execStd: '提交涂刷完成证据，发起阶段验收。', confStd: '甲方核验合格并签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '清理保护', exec: '吴油漆', conf: '陈庄', execStd: '成品保护到位，现场清理干净。', confStd: '甲方确认无污染、无损坏。', liableStd: '保护不当致损的，乙方赔偿。' }
                ] }
            ]
        },
        xiaolingong: {
            contentIntro: '工程内容：零星安装、修补等小零工作业，含工具进场与安全防护。',
            stages: [
                { name: '安装准备阶段', order: '并行执行', tasks: [
                    { name: '工具进场', exec: '郑零工', conf: '陈庄', execStd: '工具检验合格、摆放有序，持证上岗。', confStd: '甲方确认工具合规、人员持证。', liableStd: '工具或资质不符的，乙方整改担责。' },
                    { name: '安全防护', exec: '郑零工', conf: '陈庄', execStd: '佩戴劳保、设置警示，临边防护到位。', confStd: '甲方检查安全措施合格。', liableStd: '防护缺失致事故的，乙方担责。' }
                ] },
                { name: '零星作业阶段', order: '顺序执行', tasks: [
                    { name: '零星安装', exec: '郑零工', conf: '陈庄', execStd: '按图安装，牢固美观、功能正常。', confStd: '甲方验收安装质量。', liableStd: '安装隐患的，乙方无偿修复。' },
                    { name: '修补作业', exec: '郑零工', conf: '陈庄', execStd: '缺陷部位修补平整、观感一致。', confStd: '甲方确认修补到位。', liableStd: '修补不达标的，乙方无偿返修。' }
                ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [
                    { name: '阶段确认', exec: '郑零工', conf: '陈庄', execStd: '提交零星作业完成证据，发起阶段验收。', confStd: '甲方核验合格并签字。', liableStd: '未达标返工责任及费用由乙方承担。' }
                ] }
            ]
        }
    };

    var C = {
        type: 'shuidian', typeName: '水电班组服务合同', name: '全屋水电改造合同', amount: 12600, duration: '30',
        projectAddress: 'XX市XX区XX路XX号', group: '水电施工组',
        contentIntro: STAGE_TEMPLATES.shuidian.contentIntro,
        stages: clone(STAGE_TEMPLATES.shuidian.stages),
        extraClauses: '1、本合同约定工期为固定工期，因乙方原因延误的，按合同总价每日千分之二支付违约金。\n2、隐蔽工程须经验收合格后方可覆盖，甲方不参与施工的，乙方对施工质量负全责。\n3、本合同未尽事宜，双方可另行签订补充协议，补充协议与本合同具有同等效力。',
        attachments: [
            { name: '水电班组服务合同.pdf', meta: '2.3MB' },
            { name: '量房照片.jpg', meta: '1.5MB' },
            { name: '材料清单.xlsx', meta: '156KB' },
            { name: '施工图纸.dwg', meta: '5.8MB' }
        ],
        templateText: '', templateStage: ''
    };
    var editInvited = [{ userId: 'm-shuidian', name: '张水电', role: '水电工' }];
    var partyA = (WORKER_CANDIDATES.filter(function (m) { return m.id === 'm-chenzhuang'; })[0]) || null;
    var currentStatus = 'worker_draft_initial'; // 当前页态：非签约态；已签约态可置 'signed' / 'signed_done'
    var draftTab = 'contract-text';
    var tplKind = 'text', previewKind = null, previewId = null;

    /* ===================== 头像 / 电子名片 ===================== */
    function avatarColor(seed) {
        seed = seed || '?';
        var h = 0;
        for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
        return 'hsl(' + h + ', 52%, 55%)';
    }
    function memberAvatarHtml(m, extraCls) {
        var initial = (m.name || '?').charAt(0);
        var color = avatarColor(m.userId || m.name || '?');
        return '<span class="member-avatar ' + (extraCls || '') + '" style="background:' + color + '">' + escapeHtml(initial) + '</span>';
    }
    function openBusinessCard(m) {
        var av = $('bcAvatar'); if (av) { av.textContent = (m.name || '?').charAt(0); av.style.background = avatarColor(m.userId || m.name || '?'); }
        var nm = $('bcName'); if (nm) nm.textContent = m.name || '';
        var rl = $('bcRole'); if (rl) rl.textContent = m.role || '';
        var idEl = $('bcId'); if (idEl) idEl.textContent = m.userId || '';
        var box = $('businessCardModal'); if (box) box.classList.add('show');
    }
    function closeBusinessCard() { var box = $('businessCardModal'); if (box) box.classList.remove('show'); }

    /* ===================== 意向乙方：选择 / 删除 / 上限 ===================== */
    function toggleInvitePanel() {
        var p = $('editInvitePanelBox'); if (!p) return;
        var open = p.classList.contains('open');
        if (open) { p.classList.remove('open'); return; }
        p.classList.add('open');
        var s = $('editInviteSearch');
        if (s) { s.value = ''; renderInviteList(); if (s.focus) s.focus(); }
    }
    function filterInvite() { renderInviteList(); }

    /* 点击面板外部时收起意向乙方 / 合同甲方 选择面板 / 「更多」菜单（点击面板内部 / 控制条不收起） */
    document.addEventListener('click', function (e) {
        var box = $('editInvitePanelBox');
        if (box && box.classList.contains('open')) {
            var picker = box.closest('.member-picker');
            if (!picker || !picker.contains(e.target)) box.classList.remove('open');
        }
        var pA = $('partyAPanelBox');
        if (pA && pA.classList.contains('open')) {
            var pickerA = pA.closest('.member-picker');
            if (!pickerA || !pickerA.contains(e.target)) pA.classList.remove('open');
        }
        var mPanel = $('moreOpsPanel');
        if (mPanel && mPanel.classList.contains('show')) {
            if (!e.target.closest('.content-toolbar') && !e.target.closest('.more-ops-panel')) {
                closeMoreOps();
            }
        }
    });

    function renderInviteList() {
        var listEl = $('editInviteList');
        var emptyEl = $('editInviteEmpty');
        if (!listEl) return;
        var keyword = ($('editInviteSearch').value || '').trim().toLowerCase();
        var typeCands = getContractTypeCandidates(C.type);
        listEl.innerHTML = '';
        var matched = typeCands.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        var full = editInvited.length >= 3;
        matched.forEach(function (m) {
            var selected = editInvited.some(function (x) { return x.userId === m.id; });
            var item = document.createElement('div');
            item.className = 'member-picker-item' + (selected ? ' selected' : '') + (full && !selected ? ' disabled' : '');
            item.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="member-main"><span class="member-name">' + escapeHtml(m.name) + '</span>' +
                '<span class="member-role">' + escapeHtml(m.role) + '</span></span>' +
                (selected ? '<span class="check">✓</span>' : '');
            item.onclick = function () { toggleInviteMember(m); };
            var av = item.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            listEl.appendChild(item);
        });
    }

    function toggleInviteMember(m) {
        var idx = editInvited.map(function (x) { return x.userId; }).indexOf(m.id);
        if (idx > -1) {
            editInvited.splice(idx, 1);
        } else {
            if (editInvited.length >= 3) {
                showToast('最多邀请 3 名意向乙方');
                return;
            }
            editInvited.push({ userId: m.id, name: m.name, role: m.role });
        }
        renderInviteChips();
        renderInviteList();
    }

    function renderInviteChips() {
        var chipsEl = $('inviteEditChips');
        var countEl = $('inviteCount');
        var valEl = $('editInviteValue');
        if (!chipsEl) return;
        chipsEl.innerHTML = '';
        if (editInvited.length === 0) {
            if (valEl) valEl.textContent = '点击添加意向乙方';
            if (countEl) countEl.textContent = '（至少 1 人）';
        } else {
            if (valEl) valEl.textContent = '已选 ' + editInvited.length + ' / 3 人';
            if (countEl) countEl.textContent = '';
        }
        editInvited.forEach(function (m) {
            var chip = document.createElement('span');
            chip.className = 'invite-chip';
            chip.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="chip-text">' + escapeHtml(m.name) + '（' + escapeHtml(m.role) + '）</span>' +
                '<span class="x" data-id="' + m.userId + '">✕</span>';
            var av = chip.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            chip.querySelector('.x').onclick = function (ev) {
                ev.stopPropagation();
                var target = getContractTypeCandidates(C.type).filter(function (x) { return x.id === m.userId; })[0];
                if (target) toggleInviteMember(target);
            };
            chipsEl.appendChild(chip);
        });
    }

    /* ===================== 合同甲方：选择（单选，模糊匹配姓名/角色） ===================== */
    function togglePartyAPanel() {
        var p = $('partyAPanelBox'); if (!p) return;
        var open = p.classList.contains('open');
        if (open) { p.classList.remove('open'); return; }
        p.classList.add('open');
        var s = $('partyASearch');
        if (s) { s.value = ''; renderPartyAList(); if (s.focus) s.focus(); }
    }
    function filterPartyA() { renderPartyAList(); }

    function renderPartyAList() {
        var listEl = $('partyAList');
        var emptyEl = $('partyAEmpty');
        if (!listEl) return;
        var keyword = ($('partyASearch').value || '').trim().toLowerCase();
        listEl.innerHTML = '';
        var matched = WORKER_CANDIDATES.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        matched.forEach(function (m) {
            var selected = partyA && partyA.userId === m.id;
            var item = document.createElement('div');
            item.className = 'member-picker-item' + (selected ? ' selected' : '');
            item.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="member-main"><span class="member-name">' + escapeHtml(m.name) + '</span>' +
                '<span class="member-role">' + escapeHtml(m.role) + '</span></span>' +
                (selected ? '<span class="check">✓</span>' : '');
            item.onclick = function () { selectPartyA(m); };
            var av = item.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            listEl.appendChild(item);
        });
    }

    function selectPartyA(m) {
        partyA = { userId: m.id, name: m.name, role: m.role };
        renderPartyAChips();
        renderPartyAList();
        var p = $('partyAPanelBox'); if (p) p.classList.remove('open');
    }

    function renderPartyAChips() {
        var chipsEl = $('partyAChips');
        var valEl = $('partyAValue');
        if (!chipsEl) return;
        chipsEl.innerHTML = '';
        if (!partyA) {
            if (valEl) valEl.textContent = '选择甲方 ›';
            return;
        }
        if (valEl) valEl.textContent = '更换甲方 ›';
        var chip = document.createElement('span');
        chip.className = 'invite-chip';
        chip.innerHTML = memberAvatarHtml(partyA, 'clickable') +
            '<span class="chip-text">' + escapeHtml(partyA.name) + '（' + escapeHtml(partyA.role) + '）</span>' +
            '<span class="x">✕</span>';
        var av = chip.querySelector('.member-avatar');
        if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(partyA); };
        chip.querySelector('.x').onclick = function (ev) {
            ev.stopPropagation();
            partyA = null;
            renderPartyAChips();
            renderPartyAList();
        };
        chipsEl.appendChild(chip);
    }

    /* ===================== 合同内容 Tab 切换 ===================== */
    function switchDraftTab(el, key) {
        draftTab = key;
        var tabs = document.querySelectorAll('#pane-contract-text, #pane-stage-task, #pane-attachment');
        var tabEls = el.parentElement.querySelectorAll('.content-tab');
        for (var i = 0; i < tabEls.length; i++) tabEls[i].classList.remove('active');
        el.classList.add('active');
        var map = { 'contract-text': 'pane-contract-text', 'stage-task': 'pane-stage-task', 'attachment': 'pane-attachment' };
        ['pane-contract-text', 'pane-stage-task', 'pane-attachment'].forEach(function (pid) {
            var e = $(pid); if (e) e.classList.toggle('active', pid === map[key]);
        });
        // 附件 Tab：隐藏「更换模板」按钮；合同正文 / 阶段任务 Tab：按当前 Tab 改写「更换模板」文案
        var btn = $('draftTemplateBtn');
        if (btn) {
            if (key === 'attachment') {
                btn.style.display = 'none';
            } else {
                btn.style.display = '';
                btn.innerHTML = (key === 'stage-task') ? '📄 更换任务模板' : '📄 更换正文模板';
            }
        }
    }

    /* ===================== 合同正文 / 阶段任务 / 附件 渲染 ===================== */
    function renderDraftContractText() {
        var info = $('draftTemplateInfo'), tag = $('draftTemplateTag');
        if (info && tag) {
            if (C.templateText) { info.style.display = 'block'; tag.textContent = '已选择模板：' + C.templateText; }
            else { info.style.display = 'none'; }
        }
        var extra = $('editContractExtra');
        if (extra) extra.value = C.extraClauses || '';
    }

    function renderDraftStageTask() {
        var stages = C.stages;
        var html = stages.map(function (s, i) {
            var seqOn = (s.order === '顺序执行');
            var tasks = (s.tasks || []).map(function (t, j) {
                return '<div class="task-edit-item" onclick="editTaskDetail(' + i + ',' + j + ')">' +
                    '<input class="task-input" value="' + escapeHtml(t.name) + '" placeholder="任务名称" readonly onclick="editTaskDetail(' + i + ',' + j + ')">' +
                    '<div class="task-action-btn edit" onclick="editTaskDetail(' + i + ',' + j + ')" title="编辑任务详情">✎</div>' +
                    '<div class="task-action-btn" onclick="deleteDraftTask(' + i + ',' + j + ')">×</div>' +
                    '</div>';
            }).join('');
            return '<div class="stage-card">' +
                '<div class="stage-card-header">' +
                '<div class="stage-card-header-row">' +
                '<input type="text" class="stage-name-input" value="' + escapeHtml(s.name) + '" placeholder="请输入阶段名称" oninput="updateDraftStageName(' + i + ',this.value)">' +
                '<div class="stage-sequential"><span>' + (seqOn ? '按序执行' : '并行执行') + '</span><div class="switch ' + (seqOn ? 'active' : '') + '" onclick="toggleDraftStageSeq(' + i + ',this)"></div></div>' +
                '</div>' +
                '<div class="stage-card-header-row"><div class="stage-actions">' +
                '<div class="stage-action-btn add" onclick="openAddTaskModal(' + i + ')">+ 添加任务</div>' +
                '<div class="stage-action-btn delete" onclick="deleteDraftStage(' + i + ')">× 删除阶段</div>' +
                '</div></div>' +
                '</div>' +
                '<div class="task-edit-list">' + tasks + '</div>' +
                '</div>';
        }).join('');
        var listEl = $('draftStageList'); if (listEl) listEl.innerHTML = html;
        var info = $('draftStageInfo'), tag = $('draftStageTag');
        if (info && tag) {
            if (C.templateStage) { info.style.display = 'block'; tag.textContent = '已选择模板：' + C.templateStage; }
            else { info.style.display = 'none'; }
        }
    }
    function updateDraftTaskName(si, ti, val) { if (C.stages[si] && C.stages[si].tasks[ti]) C.stages[si].tasks[ti].name = val; }
    function updateDraftStageName(si, val) { if (C.stages[si]) C.stages[si].name = val; }
    function toggleDraftStageSeq(si, el) {
        var s = C.stages[si]; if (!s) return;
        var on = el.classList.toggle('active');
        s.order = on ? '顺序执行' : '并行执行';
        var span = el.parentElement.querySelector('span');
        if (span) span.textContent = s.order;
    }
    /* 拟定中（发起方）-新：乙方 = 当前意向乙方 editInvited（尚未签约）；用于新增任务执行人默认值推导 */
    function getDraftPartyBList() {
        return (editInvited || []).map(function (m) { return m.name; });
    }
    function addDraftTask(si) {
        if (!C.stages[si]) return;
        C.stages[si].tasks = C.stages[si].tasks || [];
        var pb = getDraftPartyBList();
        var exec = pb.length === 1 ? pb[0] : ''; // 仅 1 名乙方→默认执行人=该乙方；多人→空（非必选）
        C.stages[si].tasks.push({ name: '新任务', exec: exec, conf: '' }); // 确认人默认空
        renderDraftStageTask();
    }
    function deleteDraftTask(si, ti) { if (C.stages[si]) C.stages[si].tasks.splice(ti, 1); renderDraftStageTask(); }
    function addDraftStage() {
        var pb = getDraftPartyBList();
        var exec = pb.length === 1 ? pb[0] : '';
        C.stages.push({ name: '新阶段', order: '顺序执行', tasks: [{ name: '新任务', exec: exec, conf: '' }] });
        renderDraftStageTask();
    }
    function deleteDraftStage(si) { C.stages.splice(si, 1); renderDraftStageTask(); }

    function renderDraftAttachment() {
        var html = C.attachments.map(function (a, i) {
            return '<div class="attachment-item">' +
                '<div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(a.name) + '</div><div class="file-meta">' + escapeHtml(a.meta || '') + '</div></div>' +
                '<div class="delete-btn" onclick="removeDraftAttachment(' + i + ')">删除</div>' +
                '</div>';
        }).join('');
        var el = $('draftAttList'); if (el) el.innerHTML = html;
    }
    function addDraftAttachment() { var inp = $('draftAttInput'); if (inp) inp.click(); }
    function onDraftAttPicked(e) {
        var f = e.target && e.target.files && e.target.files[0];
        if (!f) return;
        var sz = (f.size ? (f.size / 1024).toFixed(0) + 'KB' : '—');
        C.attachments.push({ name: f.name, meta: sz + ' · 刚刚上传' });
        renderDraftAttachment();
        e.target.value = '';
    }
    function removeDraftAttachment(i) { C.attachments.splice(i, 1); renderDraftAttachment(); }

    function renderDraftContent() {
        renderDraftContractText();
        renderDraftStageTask();
        renderDraftAttachment();
    }

    /* ===================== 预览合同（对齐「拟定中（发起方）」状态页 previewContract） ===================== */
    function syncContractFromInputs() {
        var nameEl = $('editNameInput'), amountEl = $('editAmountInput'), durationEl = $('editDurationInput');
        var breachEl = $('breachInput'), extraEl = $('editContractExtra');
        if (nameEl) C.name = (nameEl.value || '').trim();
        if (amountEl) C.amount = amountEl.value;
        if (durationEl) C.duration = (durationEl.value || '').trim();
        if (breachEl) C.breach = (breachEl.value || '').trim();
        if (extraEl) C.extraClauses = (extraEl.value || '').trim();
    }
    function getBreachText() {
        var el = $('breachInput');
        var t = el ? (el.value || '').trim() : '';
        return t || '甲方逾期付款的，按逾期金额千分之三/日支付违约金；乙方工期延误或质量不符的，应无偿返工并承担违约责任。';
    }
    function buildContractBodyHTML() {
        var c = C;
        var intro = c.contentIntro || '水电班组相关施工作业';
        var amount = c.amount ? (c.amount + ' 元') : '—';
        var addr = c.projectAddress || 'XX市XX区XX路XX号';
        var partyAName = (partyA && partyA.name) || '陈庄';
        return '<div class="contract-article"><div class="article-title">第一条 工程概况</div><div class="article-content">' +
            '<p>1.1 工程名称：' + escapeHtml(c.name) + '</p>' +
            '<p>1.2 工程地点：' + escapeHtml(addr) + '</p>' +
            '<p>1.3 工程内容：' + escapeHtml(intro) + '</p>' +
            '<p>1.4 承包方式：包工包料</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第二条 合同价款及支付方式</div><div class="article-content">' +
            '<p>2.1 合同总价：人民币 ' + escapeHtml(amount) + '（含税）。</p>' +
            '<p>2.2 支付方式：合同签订后支付预付款，材料进场验收合格后支付进度款，完工验收后支付尾款。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第三条 双方权利义务</div><div class="article-content">' +
            '<p>3.1 甲方（' + escapeHtml(partyAName) + '）应按约定支付工程款，并提供施工所需条件。</p>' +
            '<p>3.2 乙方应按标准施工，自确认加入后自动归入项目架构层级「' + escapeHtml(c.group || '—') + '」。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第四条 工程质量及验收</div><div class="article-content">' +
            '<p>4.1 乙方应严格按国家现行施工验收规范施工。</p>' +
            '<p>4.2 分阶段验收，隐蔽工程验收合格后方可进行下一道工序。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第五条 违约责任</div><div class="article-content">' +
            escapeHtml(getBreachText()).replace(/\n/g, '<br>') + '</div></div>' +
            '<div class="contract-article"><div class="article-title">第六条 争议解决</div><div class="article-content">' +
            '<p>6.1 协商不成的，向工程所在地人民法院提起诉讼。</p></div></div>';
    }
    /* 乙方信息：非已签约 → 标签「乙方（承包方）」、值为空；已签约 → 标签「乙方（承包方）」、值为实际乙方人员姓名 */
    function getPartyB() {
        var label = '乙方（承包方）';
        var isSigned = (currentStatus === 'signed' || currentStatus === 'signed_done');
        var value;
        if (isSigned) {
            // 已签约：乙方 = 首位确认意向乙方（实际签约乙方），优先取 C.signedPartyB
            var list = (C.signedPartyB && C.signedPartyB.length) ? C.signedPartyB
                     : (editInvited && editInvited.length ? editInvited : []);
            value = list.map(function (m) { return escapeHtml(m.name); }).join('、');
        } else {
            value = ''; // 非已签约状态：乙方值置空
        }
        return { label: label, value: value };
    }
    function buildContractBasicInfoHTML() {
        var c = C;
        var partyAName = (partyA && partyA.name) || '陈庄';
        var b = getPartyB();
        var duration = c.duration ? (c.duration + ' 天') : '—';
        return '<div class="contract-article"><div class="article-title">合同基本信息</div><div class="article-content">' +
            '<p><strong>合同名称：</strong>' + escapeHtml(c.name) + '</p>' +
            '<p><strong>合同类型：</strong>' + escapeHtml(c.typeName || '—') + '</p>' +
            '<p><strong>工程地点：</strong>' + escapeHtml(c.projectAddress || '—') + '</p>' +
            '<p><strong>合同金额：</strong>人民币 ' + escapeHtml(c.amount || '—') + ' 元（含税）</p>' +
            '<p><strong>合同工期：</strong>' + duration + '</p>' +
            '<p><strong>架构层级：</strong>' + escapeHtml(c.group || '—') + '</p>' +
            '<p><strong>甲方（发包方）：</strong>' + escapeHtml(partyAName) + '</p>' +
            '<p><strong>' + b.label + '：</strong>' + b.value + '</p></div></div>';
    }
    function buildFullContractHTML() {
        var c = C;
        var basic = buildContractBasicInfoHTML();
        var body = buildContractBodyHTML();
        var extra = c.extraClauses || '';
        var extraHtml = '<div class="contract-article"><div class="article-title">补充条款</div><div class="article-content">' + (extra ? escapeHtml(extra).replace(/\n/g, '<br>') : '（无）') + '</div></div>';
        var stages = c.stages || [];
        var stageHtml = stages.map(function (s) {
            var ts = (s.tasks || []).map(function (t) {
                return '<div class="wc-task-block">' +
                    '<p class="wc-task-head">' + escapeHtml(t.name) + '　<span style="font-weight:400;color:#86909C;">执行：' + escapeHtml(t.exec || '—') + '　确认：' + escapeHtml(t.conf || '—') + '</span></p>' +
                    '<p><span class="wc-std-label">执行标准：</span>' + escapeHtml(t.execStd || '（未填写）') + '</p>' +
                    '<p><span class="wc-std-label">确认标准：</span>' + escapeHtml(t.confStd || '（未填写）') + '</p>' +
                    '<p><span class="wc-std-label">担责标准：</span>' + escapeHtml(t.liableStd || '（未填写）') + '</p>' +
                    '</div>';
            }).join('');
            return '<div class="contract-article"><div class="article-title">' + escapeHtml(s.name) + '（' + escapeHtml(s.order || '并行执行') + '）</div><div class="article-content">' + (ts || '<p>暂无任务</p>') + '</div></div>';
        }).join('');
        var atts = c.attachments || [];
        var attHtml = atts.map(function (a) { return '<p>· ' + escapeHtml(a.name) + '（' + escapeHtml(a.meta || '') + '）</p>'; }).join('');
        var b = getPartyB();
        var partyAName = (partyA && partyA.name) || '陈庄';
        var sign = '<div class="contract-article"><div class="article-title">签署信息</div><div class="article-content">' +
            '<p><strong>甲方（发包方）：</strong>' + escapeHtml(partyAName) + '</p>' +
            '<p><strong>' + b.label + '：</strong>' + b.value + '</p></div></div>';
        return '<div style="text-align:center; font-size:18px; font-weight:700; color:#222; margin-bottom:16px;">' + escapeHtml(c.typeName || '工人班组服务合同') + '</div>' +
            basic + body + extraHtml + stageHtml + '<div class="contract-article"><div class="article-title">合同附件</div><div class="article-content">' + (attHtml || '<p>无</p>') + '</div></div>' + sign;
    }
    function previewContract() {
        var m = $('wcFullTextModal'); if (!m) return;
        syncContractFromInputs();
        $('wcFullTextTitle').textContent = '👁️ 预览合同';
        $('wcFullTextContent').innerHTML = buildFullContractHTML();
        m.classList.add('show');
    }
    function closeFullText() { var m = $('wcFullTextModal'); if (m) m.classList.remove('show'); }

    /* ===================== 编辑任务弹窗（对齐「拟定中（发起方）」状态页） ===================== */
    var ROLE_MAP = {
        '陈庄': '工长', '陈业主': '业主', '王设计': '设计师', '刘项目总': '项目总', '孙工长': '工长',
        '钱拆除': '拆除工', '冯拆建': '拆除工', '蒋拆平': '拆除工',
        '张水电': '水电工', '韩水通': '水电工', '杨水明': '水电工',
        '李木作': '木作工', '赵木森': '木作工', '秦木林': '木作工',
        '周泥瓦': '泥瓦工', '许泥固': '泥瓦工', '何泥稳': '泥瓦工',
        '吴油漆': '油漆工', '吕油彩': '油漆工', '施油光': '油漆工',
        '郑零工': '小零工', '张零杂': '小零工', '孔零活': '小零工'
    };
    var editTaskState = { current: null, confirmers: [] };
    var addTaskState = { current: null, confirmers: [] };
    function fillPersonDropdown(prefix) {
        var dd = $(prefix + 'TaskExecutorDropdown');
        if (dd) {
            dd.innerHTML = WORKER_CANDIDATES.map(function (m) {
                return '<div class="person-option" onclick="selectExecutor(\'' + prefix + '\', \'' + m.name + '\', \'' + m.role + '\')"><div class="avatar">' + m.name.charAt(0) + '</div><div class="name">' + m.name + '</div><div class="role-tag">' + m.role + '</div></div>';
            }).join('');
        }
        var cd = $(prefix + 'TaskConfirmerDropdown');
        if (cd) {
            cd.innerHTML = WORKER_CANDIDATES.map(function (m) {
                return '<div class="person-option" onclick="selectConfirmer(\'' + prefix + '\', \'' + m.name + '\', \'' + m.role + '\')"><div class="avatar">' + m.name.charAt(0) + '</div><div class="name">' + m.name + '</div><div class="role-tag">' + m.role + '</div></div>';
            }).join('');
        }
    }
    function editTaskDetail(si, ti) {
        var s = C.stages[si];
        var t = s && s.tasks ? s.tasks[ti] : null;
        if (!t) return;
        // 填充编辑弹窗执行人 / 确认人下拉（可选范围=项目内全部人员，与新建任务弹窗一致）
        fillPersonDropdown('edit');
        editTaskState.current = { si: si, ti: ti };
        $('editTaskName').value = t.name || '';
        var executor = t.exec || '';
        // 执行人默认值：合同乙方仅一人时，无执行人的任务默认填乙方人员；多乙方则为空（非必选）；确认人一律默认空
        if (!executor) {
            var pbList = getDraftPartyBList();
            if (pbList.length === 1) executor = pbList[0];
        }
        var execTags = $('editTaskExecutorTags');
        if (executor) {
            execTags.innerHTML = '<div class="confirm-person-tag">' + executor + '（' + (ROLE_MAP[executor] || '施工方') + '）' +
                '<span class="remove" onclick="removeExecutor(\'edit\')">×</span></div>';
        } else { execTags.innerHTML = ''; }
        $('editTaskExecutor').value = executor;
        $('editTaskExecutorSearch').value = '';
        $('editTaskExecutorDropdown').classList.remove('show');
        var confirmerArr = (t.conf || '').split(/[、,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
        editTaskState.confirmers = confirmerArr;
        updateEditConfirmPersonTags();
        $('editTaskConfirmerSearch').value = '';
        $('editTaskConfirmerDropdown').classList.remove('show');
        $('editTaskExecStandard').value = t.execStd || '';
        $('editTaskConfirmStandard').value = t.confStd || '';
        $('editTaskLiableStandard').value = t.liableStd || '';
        $('editTaskModal').classList.add('show');
    }
    function closeEditTaskModal() {
        var m = $('editTaskModal');
        if (m) m.classList.remove('show');
        $('editTaskExecutorTags').innerHTML = '';
        $('editTaskExecutorDropdown').classList.remove('show');
        $('editTaskConfirmerDropdown').classList.remove('show');
        editTaskState.confirmers = [];
        editTaskState.current = null;
    }
    function confirmEditTask() {
        if (!editTaskState.current) { closeEditTaskModal(); return; }
        var si = editTaskState.current.si, ti = editTaskState.current.ti;
        var t = C.stages[si] && C.stages[si].tasks ? C.stages[si].tasks[ti] : null;
        if (!t) { closeEditTaskModal(); return; }
        var name = $('editTaskName').value.trim();
        if (!name) { showToast('请输入任务名称'); return; }
        var execStd = $('editTaskExecStandard').value.trim();
        var confStd = $('editTaskConfirmStandard').value.trim();
        var liableStd = $('editTaskLiableStandard').value.trim();
        if (!execStd) { showToast('请输入执行标准'); return; }
        if (!confStd) { showToast('请输入确认标准'); return; }
        if (!liableStd) { showToast('请输入担责标准'); return; }
        var executor = $('editTaskExecutor').value.trim();
        var confirmers = editTaskState.confirmers || [];
        t.name = name;
        t.exec = executor;
        t.conf = confirmers.join('、');
        t.execStd = execStd;
        t.confStd = confStd;
        t.liableStd = liableStd;
        closeEditTaskModal();
        renderDraftStageTask();
        showToast('任务详情已保存');
    }
    function toggleExecutorSearch(prefix) { var dd = $(prefix + 'TaskExecutorDropdown'); if (dd) dd.classList.toggle('show'); }
    function filterExecutorList(prefix) {
        var kw = ($(prefix + 'TaskExecutorSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskExecutorDropdown'); if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function (opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = (name.indexOf(kw) >= 0) ? '' : 'none';
        });
        dd.classList.add('show');
    }
    function selectExecutor(prefix, name, role) {
        var tags = $(prefix + 'TaskExecutorTags');
        tags.innerHTML = '<div class="confirm-person-tag">' + name + '（' + role + '）' +
            '<span class="remove" onclick="removeExecutor(\'' + prefix + '\')">×</span></div>';
        $(prefix + 'TaskExecutor').value = name;
        $(prefix + 'TaskExecutorSearch').value = '';
        $(prefix + 'TaskExecutorDropdown').classList.remove('show');
    }
    function removeExecutor(prefix) {
        $(prefix + 'TaskExecutorTags').innerHTML = '';
        $(prefix + 'TaskExecutor').value = '';
    }
    function toggleConfirmerSearch(prefix) { var dd = $(prefix + 'TaskConfirmerDropdown'); if (dd) dd.classList.toggle('show'); }
    function filterConfirmerList(prefix) {
        var kw = ($(prefix + 'TaskConfirmerSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskConfirmerDropdown'); if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function (opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = (name.indexOf(kw) >= 0) ? '' : 'none';
        });
        dd.classList.add('show');
    }
    function selectConfirmer(prefix, name, role) {
        var list = prefix === 'new' ? addTaskState.confirmers : editTaskState.confirmers;
        if (list.length >= 5) { showToast('确认人最多5人'); return; }
        if (list.indexOf(name) >= 0) { showToast('已添加'); return; }
        list.push(name);
        updateConfirmPersonTags(prefix);
        $(prefix + 'TaskConfirmerSearch').value = '';
        $(prefix + 'TaskConfirmerDropdown').classList.remove('show');
    }
    function removeConfirmer(prefix, index) {
        var list = prefix === 'new' ? addTaskState.confirmers : editTaskState.confirmers;
        list.splice(index, 1);
        updateConfirmPersonTags(prefix);
    }
    function updateConfirmPersonTags(prefix) {
        var tags = $(prefix + 'TaskConfirmPersons');
        if (!tags) return;
        var list = prefix === 'new' ? addTaskState.confirmers : editTaskState.confirmers;
        if (list.length === 0) { tags.innerHTML = ''; return; }
        tags.innerHTML = list.map(function (name, i) {
            var role = ROLE_MAP[name] || '施工方';
            return '<div class="confirm-person-tag">' + name + '（' + role + '）' +
                '<span class="remove" onclick="removeConfirmer(\'' + prefix + '\',' + i + ')">×</span></div>';
        }).join('');
    }
    function updateEditConfirmPersonTags() { updateConfirmPersonTags('edit'); }

    // 新建任务弹窗（交互对齐「合同详情·合规版」addTaskModal：先填全字段 → 确定添加）
    function openAddTaskModal(si) {
        if (typeof si !== 'number') si = addTaskState.current || 0;
        addTaskState.current = si;
        addTaskState.confirmers = [];
        var name = $('newTaskName'); if (name) name.value = '';
        var exec = $('newTaskExecutor');
        var execTags = $('newTaskExecutorTags');
        // 执行人默认值：与编辑任务规则一致——乙方仅一人时默认填乙方人员；多人则默认空（均可修改）
        var defaultExec = '';
        var pbList = getDraftPartyBList();
        if (pbList.length === 1) defaultExec = pbList[0];
        if (exec) exec.value = defaultExec;
        if (execTags) {
            if (defaultExec && ROLE_MAP[defaultExec]) {
                execTags.innerHTML = '<div class="confirm-person-tag">' + defaultExec + '（' + ROLE_MAP[defaultExec] + '）' +
                    '<span class="remove" onclick="removeExecutor(\'new\')">×</span></div>';
            } else if (defaultExec) {
                execTags.innerHTML = '<div class="confirm-person-tag">' + defaultExec +
                    '<span class="remove" onclick="removeExecutor(\'new\')">×</span></div>';
            } else {
                execTags.innerHTML = '';
            }
        }
        var execSearch = $('newTaskExecutorSearch'); if (execSearch) execSearch.value = '';
        var confTags = $('newTaskConfirmPersons'); if (confTags) confTags.innerHTML = '';
        var confSearch = $('newTaskConfirmerSearch'); if (confSearch) confSearch.value = '';
        var es = $('newTaskExecStandard'); if (es) es.value = '';
        var cs = $('newTaskConfirmStandard'); if (cs) cs.value = '';
        var ls = $('newTaskLiableStandard'); if (ls) ls.value = '';
        fillPersonDropdown('new');
        var m = $('addTaskModal'); if (m) m.classList.add('show');
    }
    function closeAddTaskModal() {
        var m = $('addTaskModal'); if (m) m.classList.remove('show');
        var execTags = $('newTaskExecutorTags'); if (execTags) execTags.innerHTML = '';
        var confTags = $('newTaskConfirmPersons'); if (confTags) confTags.innerHTML = '';
        addTaskState.current = null;
        addTaskState.confirmers = [];
    }
    function confirmAddTask() {
        var si = addTaskState.current;
        if (typeof si !== 'number') { closeAddTaskModal(); return; }
        var s = C.stages[si];
        if (!s) { closeAddTaskModal(); return; }
        var name = $('newTaskName').value.trim();
        if (!name) { showToast('请输入任务名称'); return; }
        var execStd = $('newTaskExecStandard').value.trim();
        var confStd = $('newTaskConfirmStandard').value.trim();
        var liableStd = $('newTaskLiableStandard').value.trim();
        if (!execStd) { showToast('请输入执行标准'); return; }
        if (!confStd) { showToast('请输入确认标准'); return; }
        if (!liableStd) { showToast('请输入担责标准'); return; }
        var executor = $('newTaskExecutor').value.trim();
        var confirmers = addTaskState.confirmers || [];
        s.tasks = s.tasks || [];
        s.tasks.push({ name: name, exec: executor, conf: confirmers.join('、'), execStd: execStd, confStd: confStd, liableStd: liableStd });
        closeAddTaskModal();
        renderDraftStageTask();
        showToast('任务已添加');
    }

    /* ===================== 更换模板 ===================== */
    function draftBaseName() {
        var tn = (C.typeName) || '服务';
        return tn.replace('班组服务合同', '').replace('服务合同', '');
    }
    function getDraftTemplates(kind) {
        var b = draftBaseName();
        if (kind === 'text') return [
            { id: 'std', name: '标准' + b + '服务合同', desc: '含工程概况 / 价款 / 质量 / 违约等完整条款' },
            { id: 'lite', name: '精简' + b + '服务合同', desc: '核心条款精简版' }
        ];
        return [
            { id: 'std', name: '标准' + b + '工程阶段', desc: '沿用本合同类型标准阶段模板' },
            { id: 'lite', name: '精简' + b + '工程阶段', desc: '仅保留核心阶段' }
        ];
    }
    function showDraftTemplatePicker() {
        var tab = draftTab;
        if (tab === 'attachment') { showToast('附件区不支持更换模板，请直接上传或删除附件'); return; }
        var kind = tab === 'stage-task' ? 'stage' : 'text';
        openTemplatePicker(kind);
    }
    function openTemplatePicker(kind) {
        tplKind = kind;
        renderTemplatePickerList(kind);
        var m = $('wcdTplModal'); if (m) m.classList.add('show');
    }
    function renderTemplatePickerList(kind) {
        var list = $('wcdTplList'); if (!list) return;
        var items = getDraftTemplates(kind);
        var titleMap = { text: '选择合同正文模板', stage: '选择阶段任务模板' };
        var t = $('wcdTplTitle'); if (t) t.textContent = titleMap[kind] || '选择模板';
        var ft = $('wcdTplFilterType'); if (ft) ft.textContent = (C.typeName) || '-';
        var emptyEl = $('wcdTplEmpty'); if (emptyEl) emptyEl.style.display = items.length ? 'none' : 'block';
        var icon = kind === 'stage' ? '📝' : '📄';
        list.innerHTML = items.map(function (it) {
            return '<div class="tpl-item">' +
                '<div class="tpl-icon">' + icon + '</div>' +
                '<div class="tpl-content"><div class="tpl-name">' + escapeHtml(it.name) + '</div><div class="tpl-desc">' + escapeHtml(it.desc) + '</div></div>' +
                '<div class="tpl-actions"><span class="btn preview" onclick="previewDraftTemplate(\'' + kind + '\',\'' + it.id + '\')">预览</span>' +
                '<span class="btn use" onclick="applyTemplate(\'' + kind + '\',\'' + it.id + '\')">使用</span></div>' +
                '</div>';
        }).join('');
    }
    function applyTemplate(kind, id) {
        if (kind === 'text') {
            C.templateText = (getDraftTemplates('text').filter(function (x) { return x.id === id; })[0] || {}).name || '';
            if (id === 'lite') C.contentIntro = '工程内容：' + draftBaseName() + '相关作业（精简版）。';
        } else {
            var src = (STAGE_TEMPLATES[C.type] || STAGE_TEMPLATES.shuidian).stages;
            C.stages = id === 'lite' ? clone(src).slice(0, 2) : clone(src);
            C.templateStage = (getDraftTemplates('stage').filter(function (x) { return x.id === id; })[0] || {}).name || '';
        }
        closeTemplatePicker();
        renderDraftContent();
        showToast('已应用模板');
    }
    function closeTemplatePicker() { var m = $('wcdTplModal'); if (m) m.classList.remove('show'); }

    // 正文模板预览：拆为「违约责任」与「固定详细条款」两个只读区域；固定详细条款仅含标准条款项，不含甲乙方/金额/工期
    function buildTemplatePreviewSections(id) {
        if (id === 'lite') {
            return {
                breach: '任一方违约应承担相应责任并赔偿对方因此受到的损失。',
                fixed: '一、质量要求：符合国家现行施工标准。\n二、争议解决：协商不成的，向工程所在地人民法院起诉。'
            };
        }
        return {
            breach: '任一方违约应承担相应责任并赔偿对方因此受到的损失。',
            fixed: '一、双方权利义务\n甲方有权监督、指导乙方工作并给予奖励、处罚；乙方应按标准施工，服从现场管理规定与交底。\n\n二、质量标准\n应符合国家及行业现行施工验收标准，材料合格、工艺规范。\n\n三、验收标准\n阶段完工后由甲方组织验收，合格后方可进入下一阶段。\n\n四、争议解决\n本合同履行中发生争议，双方应友好协商解决；协商不成的，向工程所在地人民法院提起诉讼。'
        };
    }
    function previewDraftTemplate(kind, id) {
        var item = (getDraftTemplates(kind) || []).filter(function (x) { return x.id === id; })[0];
        if (!item) return;
        previewKind = kind; previewId = id;
        var titleEl = $('wcdPreviewTitle'); if (titleEl) titleEl.textContent = item.name;
        var metaEl = $('wcdPreviewMeta');
        if (metaEl) {
            var tn = (C.typeName) || '';
            if (kind === 'stage') {
                var src0 = STAGE_TEMPLATES[C.type] || STAGE_TEMPLATES.shuidian;
                var sn = (id === 'lite') ? src0.stages.slice(0, 2).length : src0.stages.length;
                metaEl.innerHTML = '<span>类型：' + escapeHtml(tn) + '</span><span>阶段数：' + sn + '</span>';
            } else {
                metaEl.innerHTML = '<span>类型：' + escapeHtml(tn) + '</span><span>模板：' + escapeHtml(item.name) + '</span>';
            }
        }
        var contentEl = $('wcdPreviewContent');
        if (contentEl) {
            var html = '';
            if (kind === 'stage') {
                var src = STAGE_TEMPLATES[C.type] || STAGE_TEMPLATES.shuidian;
                var stages = (id === 'lite') ? src.stages.slice(0, 2) : src.stages;
                html += '<div class="preview-section"><div class="preview-section-title">阶段任务明细（' + stages.length + ' 个阶段）</div><div class="preview-stage-list">';
                stages.forEach(function (s, i) {
                    var tasks = (s.tasks || []).map(function (t, ti) {
                        var did = 'tplTask_' + i + '_' + ti, tid = 'tplTaskToggle_' + i + '_' + ti;
                        var std = function (lbl, val) {
                            return '<div style="margin-bottom:8px;"><span style="color:#1677ff;font-weight:600;">' + lbl + '：</span><span style="color:#333;">' + escapeHtml(val || '（未填写）') + '</span></div>';
                        };
                        return '<div style="margin:6px 0;">' +
                            '<div style="padding:10px 12px;background:#f7f9fc;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onclick="toggleTemplateTaskDetail(' + i + ',' + ti + ')">' +
                            '<span style="font-weight:600;color:#333;">' + escapeHtml(t.name) + '</span>' +
                            '<span id="' + tid + '" style="color:#1677ff;font-size:12px;flex-shrink:0;margin-left:10px;">查看标准 ›</span></div>' +
                            '<div id="' + did + '" style="display:none;padding:10px 14px 6px;background:#fff;border:1px solid #eef2f7;border-top:none;border-radius:0 0 8px 8px;">' +
                            std('执行标准', t.execStd) + std('确认标准', t.confStd) + std('担责标准', t.liableStd) +
                            '</div></div>';
                    }).join('');
                    html += '<div style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#222;"><span style="background:#1677ff;color:#fff;border-radius:50%;width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">' + (i + 1) + '</span>' + escapeHtml(s.name) + ' <span style="color:#fa8c16;font-size:12px;">' + escapeHtml(s.order || '') + '</span></div><div style="margin-top:6px;padding-left:28px;">' + tasks + '</div></div>';
                });
                html += '</div></div>';
            } else {
                var sec = buildTemplatePreviewSections(id);
                html += '<div class="preview-section"><div class="preview-section-title">违约责任</div><div class="preview-section-content">' + escapeHtml(sec.breach).replace(/\n/g, '<br>') + '</div></div>';
                html += '<div class="preview-section"><div class="preview-section-title">固定详细条款<span style="font-size:11px;color:#999;font-weight:400;margin-left:8px;">（不可修改）</span></div><div class="preview-section-content">' + escapeHtml(sec.fixed).replace(/\n/g, '<br>') + '</div></div>';
                html += '<div style="font-size:12px;color:#999;margin-top:8px;">甲乙方 / 合同金额 / 工期 等基础信息由合同主信息填写，不在固定条款内。</div>';
            }
            contentEl.innerHTML = html;
        }
        var prev = $('wcdPreviewModal'); if (prev) prev.classList.add('show');
    }
    function applyTemplateFromPreview() {
        if (!previewKind) return;
        applyTemplate(previewKind, previewId);
        closeTemplatePreview();
    }
    function closeTemplatePreview() { var m = $('wcdPreviewModal'); if (m) m.classList.remove('show'); }

    // 阶段任务模板预览：点击任务项在预览浮窗内就地展开/收起 执行 / 确认 / 担责标准（手风琴，不新增浮窗层）
    function toggleTemplateTaskDetail(si, ti) {
        var detail = document.getElementById('tplTask_' + si + '_' + ti);
        var toggle = document.getElementById('tplTaskToggle_' + si + '_' + ti);
        if (!detail) return;
        var open = detail.style.display !== 'none';
        detail.style.display = open ? 'none' : 'block';
        if (toggle) toggle.textContent = open ? '查看标准 ›' : '收起 ‹';
    }

    /* ===================== 提交 / 保存 ===================== */
    function doSubmit() {
        var name = ($('editNameInput').value || '').trim();
        var amountRaw = ($('editAmountInput').value || '').trim();
        if (!name) { showToast('请填写合同名称'); return; }
        var amount = Number(amountRaw);
        if (!amountRaw || isNaN(amount) || amount <= 0) { showToast('请填写有效的合同金额'); return; }
        var breach = $('breachInput');
        if (!breach || breach.value.trim() === '') {
            if (breach) { breach.classList.add('required-error'); breach.focus(); }
            showToast('请填写「违约责任」后再提交（必填项）');
            return;
        }
        if (breach) breach.classList.remove('required-error');
        if (editInvited.length < 1 || editInvited.length > 3) {
            showToast('请至少选择 1 名意向乙方（最多 3 人）');
            return;
        }
        if (currentContractId && window.ContractStore) {
            syncContractFromInputs();
            window.ContractStore.patchContract(currentContractId, {
                name: C.name, amount: C.amount, duration: C.duration,
                breach: C.breach, extraClauses: C.extraClauses,
                contentIntro: C.contentIntro, stages: C.stages, attachments: C.attachments
            });
            window.ContractStore.submitInvite(currentContractId, editInvited);
            showToast('已提交并邀请乙方（' + editInvited.length + ' 人）');
            setTimeout(function () { window.location.href = 'worker-contract-detail.html?id=' + encodeURIComponent(currentContractId) + '&viewer=sender'; }, 2300);
        } else {
            showToast('已提交并邀请乙方（' + editInvited.length + ' 人）');
            var invitesParam = encodeURIComponent(JSON.stringify(editInvited));
            setTimeout(function () { window.location.href = 'worker-contract-confirming-initiator-new.html?invites=' + invitesParam; }, 2300);
        }
    }
    function doSave() {
        var breach = $('breachInput');
        if (breach) breach.classList.remove('required-error');
        if (currentContractId && window.ContractStore) {
            syncContractFromInputs();
            window.ContractStore.patchContract(currentContractId, {
                name: C.name, amount: C.amount, duration: C.duration,
                breach: C.breach, extraClauses: C.extraClauses,
                contentIntro: C.contentIntro, stages: C.stages, attachments: C.attachments
            });
        }
        showToast('已保存草稿');
    }

    /* ===================== 顶部「更多」菜单（对齐 worker_draft_initial 状态） ===================== */
    function renderMoreOps() {
        var panel = $('moreOpsPanel');
        if (!panel) return;
        var items = [
            { icon: '📑', label: '复制发起', extra: '快捷发起同类型新合同', fn: 'openCopyInitiate()' },
            { icon: '📋', label: '版本记录', fn: 'showVersionModal()' },
            { icon: '📜', label: '变更记录', fn: 'showChangeRecordModal()' },
            { icon: '📄', label: '导出合同文件', fn: 'exportContract()' }
        ];
        panel.innerHTML = items.map(function (it) {
            return '<div class="op-item" onclick="' + it.fn + '; closeMoreOps();">' +
                '<span class="op-icon">' + it.icon + '</span><span>' + it.label + '</span>' +
                (it.extra ? '<span class="op-extra">' + it.extra + '</span>' : '') + '</div>';
        }).join('');
    }
    function toggleMoreOps() {
        var p = $('moreOpsPanel'), b = $('moreOpsBtn');
        if (!p) return;
        p.classList.toggle('show');
        if (b) b.classList.toggle('open');
    }
    function closeMoreOps() {
        var p = $('moreOpsPanel'), b = $('moreOpsBtn');
        if (p) p.classList.remove('show');
        if (b) b.classList.remove('open');
    }

    /* 通用信息弹窗 */
    function openInfoModal(title, html) {
        var t = $('infoModalTitle'), b = $('infoModalBody'), m = $('infoModalMask');
        if (t) t.textContent = title;
        if (b) b.innerHTML = html;
        if (m) m.classList.add('show');
    }
    function closeInfoModal() {
        var m = $('infoModalMask');
        if (m) m.classList.remove('show');
    }
    function showVersionModal() {
        openInfoModal('版本记录',
            '<div class="rec-row"><span class="rec-tag">V1</span>初始版本（拟定中）</div>' +
            '<div class="rec-row" style="color:#999;">首次创建合同，当前版本</div>');
    }
    function showChangeRecordModal() {
        openInfoModal('变更记录', '<div class="rec-row" style="color:#999;">当前为拟定中状态，暂无变更记录</div>');
    }
    function exportContract() {
        showToast('已导出合同文件（演示）');
    }

    /* ===================== 原型导航：收起 / 展开 ===================== */
    function togglePageNav() {
        var nav = document.querySelector('.page-nav');
        if (!nav) return;
        nav.classList.toggle('collapsed');
        var btn = document.getElementById('pageNavToggle');
        if (btn) btn.classList.toggle('collapsed');
    }

    /* 状态分组展开 / 收起（对齐 worker-contract-detail.html 的 WCP.toggleStatusGroup 行为） */
    function toggleStatusGroup(header) {
        var content = header.parentElement.querySelector('.status-group-content');
        var icon = header.querySelector('.status-group-icon');
        if (!content || !icon) return;
        var hidden = content.style.display === 'none';
        content.style.display = hidden ? 'block' : 'none';
        icon.textContent = hidden ? '▼' : '▶';
    }

    /* ===================== 新建合同回载（按 ?id 加载真实合同；无 ?id 保留示例数据） ===================== */
    var currentContractId = '';
    function getQueryParam(key) {
        var m = new RegExp('[?&]' + key + '=([^&]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : '';
    }
    function loadFromQuery() {
        var id = getQueryParam('id');
        if (!id || !window.ContractStore) return;
        var c = window.ContractStore.getContract(id);
        if (!c) return;
        currentContractId = id;
        var tpl = STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES[C.type] || STAGE_TEMPLATES.shuidian;
        C.type = c.type || C.type;
        C.typeName = c.typeName || C.typeName;
        C.name = c.name || C.name;
        C.amount = c.amount || C.amount;
        C.group = c.group || C.group;
        C.duration = c.duration || C.duration || '30';
        C.projectAddress = c.projectAddress || 'XX市XX区XX路XX号';
        C.extraClauses = (c.extraClauses != null) ? c.extraClauses : C.extraClauses;
        C.breach = (c.breach != null) ? c.breach : '';
        C.contentIntro = c.contentIntro || (tpl ? tpl.contentIntro : C.contentIntro);
        C.stages = (c.stages && c.stages.length) ? c.stages : (tpl ? clone(tpl.stages) : C.stages);
        C.attachments = (c.attachments && c.attachments.length) ? c.attachments : C.attachments;
        C.templateText = c.templateText || '';
        C.templateStage = c.templateStage || '';
        if (c.partyA) {
            partyA = (WORKER_CANDIDATES.filter(function (m) { return m.id === c.partyA; })[0]) || null;
        }
        if (c.invitations && c.invitations.length) {
            editInvited = c.invitations.map(function (i) { return { userId: i.userId, name: i.name, role: i.role }; });
        } else {
            editInvited = [];
        }
    }

    /* ===================== 初始化 ===================== */
    loadFromQuery();
    renderInviteChips();
    renderInviteList();
    renderPartyAChips();
    renderPartyAList();
    renderDraftContent();
    renderMoreOps();
