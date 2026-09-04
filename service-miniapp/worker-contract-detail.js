/**
 * 工人合同详情页（独立页面 · 方案 B）
 * 仅服务于 拆除/水电/木作/泥瓦/油漆/小零工 六类工人合同。
 * 基础施工服务合同 / 设计服务合同 走原 contract-detail.html，不经过本页。
 *
 * 与「合同详情（合规版）」保持同一套原型导航与微信小程序规范：
 *   - 右侧「原型导航」含「合同状态切换（工人合同）」分组，按工人流程展示各状态页面效果；
 *   - 区分发起方 / 受邀方两种视角，受邀方视角可逐一查看每位被邀人页面效果；
 *   - 打开页面直接进入合同详情（默认以「水电班组服务合同」为示例），不再展示独立的合同说明/创建页；
 *   - 页面主体含「合同内容 / 阶段任务 / 附件」三区块（对齐合规版 section-tabs 结构）。
 */
(function (global) {
    'use strict';

    var WORKER_CANDIDATES = [
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

    // 意向乙方仅允许选择的工种（各工种，不含业主 / 设计师 / 项目总 / 工长）
    // 按工种角色过滤，新增候选工人（如每工种多名）自动纳入可选池
    var TRADE_ROLES = ['拆除工', '水电工', '木作工', '泥瓦工', '油漆工', '小零工'];
    var TRADE_CANDIDATES = WORKER_CANDIDATES.filter(function (m) {
        return TRADE_ROLES.indexOf(m.role) > -1;
    });

    // 合同类型 → 允许选择的工种角色（意向乙方按合同类型过滤工种）
    var TRADE_ROLE_BY_TYPE = {
        demolition: '拆除工',
        shuidian: '水电工',
        muzuo: '木作工',
        niwa: '泥瓦工',
        youqi: '油漆工',
        xiaolingong: '小零工'
    };
    function getContractTypeCandidates(type) {
        var role = TRADE_ROLE_BY_TYPE[type];
        return TRADE_CANDIDATES.filter(function (m) { return m.role === role; });
    }

    var STATUS_CONFIG = {
        worker_inviting_sender: {
            text: '确认中', bannerClass: 'confirming',
            desc: '已邀请意向乙方参与此合同，等待对方确认/抢单（第一位确认者成为合同乙方）。',
            actions: [{ text: '撤回确认', type: 'warning', action: 'worker_withdraw' }]
        },
        worker_inviting_receiver: {
            text: '确认中', bannerClass: 'confirming',
            desc: '您被邀请参与此合同，等待您确认/抢单。第一位确认者成为合同乙方。',
            actions: [
                { text: '拒绝', type: 'secondary', action: 'worker_reject' },
                { text: '确认加入', type: 'primary', action: 'worker_confirm' }
            ]
        },
        worker_confirmed_sender: {
            text: '已确认', bannerClass: 'confirmed',
            desc: '乙方已确认，已自动加入项目架构层级。请上传已签署的纸质合同扫描件 / 照片，上传后合同正式生效。',
            actions: [
                { text: '重新选择乙方', type: 'secondary', action: 'worker_reselect' },
                { text: '上传签约文件', type: 'primary', action: 'upload_sign' }
            ]
        },
        worker_confirmed_receiver: {
            text: '已确认', bannerClass: 'confirmed',
            desc: '您已成为本合同乙方，已自动加入项目架构层级。等待发起方上传已签署的纸质合同扫描件，上传后合同正式生效。',
            actions: []
        },
        worker_lost_receiver: {
            text: '已确认', bannerClass: 'confirmed',
            desc: '该合同已被其他人员确认（抢单失败），您未成为本合同乙方。',
            actions: []
        },
        worker_rejected_receiver: {
            text: '已拒绝', bannerClass: 'rejected',
            desc: '您已拒绝该合同邀约，未成为本合同乙方。该邀约流程已结束。',
            actions: []
        },
        worker_draft_initial: {
            text: '拟定中', bannerClass: 'draft',
            desc: '合同处于拟定中。可直接修改合同名称、合同金额，并选择意向乙方（仅各工种，1-3 人）后提交邀请。',
            actions: [
                { text: '仅保存', type: 'secondary', action: 'worker_save_draft' },
                { text: '提交并邀请乙方', type: 'success', action: 'worker_resubmit' }
            ]
        },
        worker_draft: {
            text: '拟定中', bannerClass: 'draft',
            desc: '合同已撤回至拟定中。可直接修改合同名称、合同金额与意向乙方（仅各工种，1-3 人）后提交邀请。',
            actions: [
                { text: '仅保存', type: 'secondary', action: 'worker_save_draft' },
                { text: '提交并邀请乙方', type: 'success', action: 'worker_resubmit' }
            ]
        },
        worker_signed: {
            text: '已签约', bannerClass: 'signed',
            desc: '合同已正式生效。如需调整工程内容或金额，可发起合同变更（需对方确认后生效，无需平台审核）。',
            descReceiver: '合同已正式生效。',
            actions: [{ text: '发起变更', type: 'primary', action: 'start_change' }]
        },

        // ============== 变更阶段（工人合同无需平台审核；对齐「合同详情（合规版）」变更流程去平台化版本，预览用） ==============
        changing: {
            text: '变更中', bannerClass: 'changing',
            desc: '变更申请已发起，等待对方确认（阶段任务已暂停流转）。',
            actions: [{ text: '撤回变更', type: 'warning', action: 'withdraw_change' }]
        },
        change_confirming: {
            text: '待确认变更', bannerClass: 'change-confirming',
            desc: '对方发起变更申请，请确认或驳回（阶段任务已暂停流转）。',
            actions: [
                { text: '驳回变更', type: 'secondary', action: 'reject_change' },
                { text: '确认变更', type: 'primary', action: 'confirm_change' }
            ]
        },
        change_confirming_sender: {
            text: '变更确认中', bannerClass: 'confirming',
            desc: '变更申请已提交，等待对方（乙方）确认变更内容（阶段任务已暂停流转）。',
            actions: [{ text: '撤回变更', type: 'warning', action: 'withdraw_change' }]
        },
        change_signing_wait: {
            text: '变更签约中', bannerClass: 'confirmed',
            desc: '变更已确认，请上传线下已签约的合同变更文件，上传后变更正式生效（生成 V2 版本）。',
            descReceiver: '变更已确认，等待发起方上传线下已签约的合同变更文件，上传后变更正式生效（生成 V2 版本）。',
            actions: [{ text: '上传变更签约文件', type: 'primary', action: 'upload_change_sign' }]
        },
        // 变更阶段分支：待确认方（乙方）驳回变更后的独立页面
        change_rejected: {
            text: '变更已驳回', bannerClass: 'rejected',
            desc: '对方（乙方）已驳回本次变更申请，合同保持原已签约状态。可重新发起变更。',
            descReceiver: '您已驳回本次变更申请，合同保持原已签约状态。',
            actions: [
                { text: '重新发起变更', type: 'primary', action: 'start_change' }
            ],
            showRejectReason: true,
            rejectReason: '现场实际情况与变更内容不符，暂不接受该变更方案，请与工长（甲方）沟通后重新发起。'
        }
    };

    var ACTION_TEXT = {
        worker_withdraw: { title: '撤回合同邀约', message: '确定要撤回确认吗？撤回后合同退回拟定中，可就地修改意向乙方后重新提交邀约。' },
        worker_reject: { title: '拒绝邀请', message: '确定要拒绝此合同邀约吗？拒绝后您不会成为本合同乙方。' },
        worker_confirm: { title: '确认加入合同', message: '确定要确认加入此合同吗？确认后您将成为本合同乙方，并自动加入项目架构层级。' },
        worker_resubmit: { title: '提交并邀请乙方', message: '确定要提交当前合同信息与意向乙方名单吗？将向所选意向乙方（仅各工种）发送合同邀约。' },
        // 变更阶段动作（工人合同：无平台审核，对方确认后即进入签约）
        withdraw_change: { title: '撤回变更', message: '确定要撤回变更申请吗？撤回后合同恢复已签约状态，阶段任务恢复流转。' },
        reject_change: { title: '驳回变更', message: '确定要驳回该变更申请吗？驳回后合同保持原已签约状态。' },
        confirm_change: { title: '确认变更', message: '确认后双方即达成变更，需上传变更签约文件方可生效，确定继续吗？' },
        change_rejected_back: { title: '返回已签约', message: '确定返回合同已签约状态吗？变更申请将被清除，合同恢复为原始已签约内容。' }
    };

    var state = {
        workerId: '',
        viewer: 'sender',
        asUserId: '',
        contract: null,
        status: 'worker_inviting_sender',
        editInvited: [],
        draftContentTab: 'contract-text',
        tplKind: '',
        fulfilled: false,
        currentEditTask: null,
        editTaskConfirmPersonList: []
    };

    var pendingConfirm = null; // { title, message, onConfirm, onCancel }
    var pendingRejectReason = null; // 拒绝原因暂存（二次确认前保留）

    // 演示用合同模板（原型「更多 → 切换合同类型」入口）
    var DEMO_TYPES = [
        { type: 'demolition',  typeName: '拆除班组服务合同',   group: '拆除工程', name: '客厅原墙拆除工程合同', amount: 4800,  invited: ['m-demolition', 'm-demolition-2', 'm-demolition-3'] },
        { type: 'shuidian',    typeName: '水电班组服务合同',   group: '水电工程', name: '全屋水电改造合同',     amount: 12600, invited: ['m-shuidian', 'm-shuidian-2', 'm-shuidian-3'] },
        { type: 'muzuo',       typeName: '木作班组服务合同',   group: '木作工程', name: '定制柜体木作合同',     amount: 9800,  invited: ['m-muzuo', 'm-muzuo-2', 'm-muzuo-3'] },
        { type: 'niwa',        typeName: '泥瓦工班组服务合同', group: '泥瓦工程', name: '厨卫贴砖泥瓦合同',     amount: 7600,  invited: ['m-niwa', 'm-niwa-2', 'm-niwa-3'] },
        { type: 'youqi',       typeName: '油漆工班组服务合同', group: '油漆工程', name: '墙面乳胶漆油漆合同',   amount: 6400,  invited: ['m-youqi', 'm-youqi-2', 'm-youqi-3'] },
        { type: 'xiaolingong', typeName: '小零工服务合同',     group: '零星工程', name: '后期安装小零工合同',   amount: 2200,  invited: ['m-xiaolingong', 'm-xiaolingong-2', 'm-xiaolingong-3'] }
    ];

    // 默认示例合同（无 id 进入时直接展示）
    var DEFAULT_DEMO_TYPE = 'shuidian';

    // 演示默认项目地址（受邀方视角元信息「项目地址」展示用）
    var DEMO_PROJECT_ADDRESS = 'XX市XX区XX路XX号 · 阳光里小区 8 栋 2 单元 1101 室';

    // 合同内容 / 阶段任务 示例模板（按合同类型），对齐合规版展示
    var STAGE_TEMPLATES = {
        shuidian: {
            contentIntro: '工程内容：强电、弱电、给排水等水电工程，含材料进场、布管布线、设备安装及收尾验收。',
            stages: [
                { name: '材料进场阶段', order: '并行执行', tasks: [ { name: '材料采购', exec: '张水电', conf: '陈庄' }, { name: '材料报验', exec: '张水电', conf: '陈庄' } ] },
                { name: '布管布线阶段', order: '顺序执行', tasks: [ { name: '开槽布管', exec: '张水电', conf: '陈庄' }, { name: '穿线接线', exec: '张水电', conf: '陈庄' }, { name: '阶段确认', exec: '张水电', conf: '陈庄' } ] },
                { name: '安装阶段', order: '顺序执行', tasks: [ { name: '开关插座安装', exec: '张水电', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '通水通电测试', exec: '张水电', conf: '陈庄' }, { name: '阶段确认', exec: '张水电', conf: '陈庄' } ] }
            ]
        },
        demolition: {
            contentIntro: '工程内容：室内原墙体、饰面拆除及建筑垃圾清运，含防护交底与现场平整。',
            stages: [
                { name: '原墙拆除阶段', order: '顺序执行', tasks: [ { name: '防护交底', exec: '钱拆除', conf: '陈庄' }, { name: '墙体拆除', exec: '钱拆除', conf: '陈庄' } ] },
                { name: '垃圾清运阶段', order: '顺序执行', tasks: [ { name: '建筑垃圾清运', exec: '钱拆除', conf: '陈庄' }, { name: '现场平整', exec: '钱拆除', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '钱拆除', conf: '陈庄' } ] }
            ]
        },
        muzuo: {
            contentIntro: '工程内容：木作基层、定制柜体制作与安装，含测量放样、五金安装及收尾。',
            stages: [
                { name: '测量放样阶段', order: '并行执行', tasks: [ { name: '现场测量', exec: '李木作', conf: '陈庄' }, { name: '深化图纸', exec: '李木作', conf: '陈庄' } ] },
                { name: '木工制作阶段', order: '顺序执行', tasks: [ { name: '基层制作', exec: '李木作', conf: '陈庄' }, { name: '柜体安装', exec: '李木作', conf: '陈庄' } ] },
                { name: '安装阶段', order: '顺序执行', tasks: [ { name: '五金安装', exec: '李木作', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '李木作', conf: '陈庄' } ] }
            ]
        },
        niwa: {
            contentIntro: '工程内容：地面找平、防水施工与墙地砖铺贴，含美缝清理。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [ { name: '地面找平', exec: '周泥瓦', conf: '陈庄' }, { name: '防水施工', exec: '周泥瓦', conf: '陈庄' } ] },
                { name: '贴砖阶段', order: '顺序执行', tasks: [ { name: '墙砖铺贴', exec: '周泥瓦', conf: '陈庄' }, { name: '地砖铺贴', exec: '周泥瓦', conf: '陈庄' }, { name: '阶段确认', exec: '周泥瓦', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '美缝清理', exec: '周泥瓦', conf: '陈庄' } ] }
            ]
        },
        youqi: {
            contentIntro: '工程内容：墙面基层处理、腻子批刮与乳胶漆涂刷，含清理保护。',
            stages: [
                { name: '基层处理阶段', order: '顺序执行', tasks: [ { name: '墙面铲除', exec: '吴油漆', conf: '陈庄' }, { name: '批刮腻子', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '腻子阶段', order: '顺序执行', tasks: [ { name: '打磨', exec: '吴油漆', conf: '陈庄' }, { name: '底漆', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '油漆阶段', order: '顺序执行', tasks: [ { name: '面漆涂刷', exec: '吴油漆', conf: '陈庄' }, { name: '阶段确认', exec: '吴油漆', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '清理保护', exec: '吴油漆', conf: '陈庄' } ] }
            ]
        },
        xiaolingong: {
            contentIntro: '工程内容：零星安装、修补等小零工作业，含工具进场与安全防护。',
            stages: [
                { name: '安装准备阶段', order: '并行执行', tasks: [ { name: '工具进场', exec: '郑零工', conf: '陈庄' }, { name: '安全防护', exec: '郑零工', conf: '陈庄' } ] },
                { name: '零星作业阶段', order: '顺序执行', tasks: [ { name: '零星安装', exec: '郑零工', conf: '陈庄' }, { name: '修补作业', exec: '郑零工', conf: '陈庄' } ] },
                { name: '收尾阶段', order: '顺序执行', tasks: [ { name: '阶段确认', exec: '郑零工', conf: '陈庄' } ] }
            ]
        }
    };

    // ============== 工具 ==============
    function $(id) { return document.getElementById(id); }
    function getParam(n) { return new URLSearchParams(global.location.search).get(n); }
    function escapeHtml(s) {
        if (s === null || s === undefined) return '';
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function showToast(msg) {
        var t = $('appToast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('show');
        global.setTimeout(function () { t.classList.remove('show'); }, 2000);
    }
    function callPartyA(phone) {
        if (!phone) { showToast('未获取到联系电话'); return; }
        // 先二次确认，避免误触拨号
        showConfirm('拨打工长电话', '是否拨打 ' + phone + ' ？', function () {
            showToast('正在呼叫 ' + phone);
            global.location.href = 'tel:' + phone;
        }, { confirmText: '拨打', btnClass: 'primary' });
    }
    function clearConfirmState() {
        $('confirmModal').classList.remove('show');
        pendingConfirm = null;
    }
    function showConfirm(title, message, onConfirm, opts) {
        opts = opts || {};
        pendingConfirm = {
            title: title, message: message,
            onConfirm: onConfirm,
            onCancel: opts.onCancel || null
        };
        $('confirmTitle').textContent = title;
        $('confirmContent').textContent = message;
        var btn = $('confirmBtn');
        btn.textContent = opts.confirmText || '确认';
        btn.className = 'modal-btn ' + (opts.btnClass || 'danger');
        $('confirmModal').classList.add('show');
    }
    function closeConfirm() {
        // 取消按钮：若本次 confirm 注册了 onCancel，则在收起后回退（如回到原因弹窗）
        var fn = pendingConfirm && pendingConfirm.onCancel;
        clearConfirmState();
        if (fn) fn();
    }
    function runConfirm() {
        // 确认按钮：仅执行 onConfirm，不触发 onCancel
        var fn = pendingConfirm && pendingConfirm.onConfirm;
        clearConfirmState();
        if (fn) fn();
    }

    // ============== 初始化 ==============
    function init() {
        state.workerId = getParam('id') || '';
        state.viewer = getParam('viewer') || 'sender';
        state.asUserId = getParam('asUserId') || '';
        if (!global.ContractStore) { renderNotFound(); return; }
        // 预播种全部工种演示合同（id 形如 demo-<type>-example），保证外部按 id 跳转各工种都能命中
        DEMO_TYPES.forEach(function (d) { ensureDemoSeed(d.type); });
        if (!state.workerId) {
            // 无 id：直接展示示例合同（水电班组服务合同），不再展示独立的合同说明/创建页
            state.workerId = ensureDemoSeed(DEFAULT_DEMO_TYPE);
            if (!state.viewer || state.viewer === 'sender') state.viewer = 'sender';
            state.asUserId = '';
        }
        state.contract = global.ContractStore.getContract(state.workerId);
        if (!state.contract) { renderNotFound(); return; }
        $('notFound').style.display = 'none';
        $('mainView').style.display = 'block';
        // 支持「发起变更」页提交后回跳预览（如 preview=changing）或外部跳转指定状态（如 status=worker_confirmed_receiver）
        var preview = getParam('preview');
        var urlStatus = getParam('status');
        state.viewer = getParam('viewer') || state.viewer;
        updateStatus(urlStatus ? urlStatus : (preview ? preview : computeStatus()));
        bindModalDismiss();
    }

    function renderNotFound() {
        $('notFound').style.display = 'block';
        $('mainView').style.display = 'none';
    }

    function nowLabel() {
        var dd = new Date();
        var h = dd.getHours(); var mm = dd.getMinutes();
        return (h < 10 ? '0' + h : '' + h) + ':' + (mm < 10 ? '0' + mm : '' + mm);
    }

    // 示例合同播种（幂等：固定 id，已存在则复用）
    function ensureDemoSeed(type) {
        var d = DEMO_TYPES.filter(function (x) { return x.type === type; })[0];
        if (!d) d = DEMO_TYPES[1];
        var id = 'demo-' + d.type + '-example';
        var existing = global.ContractStore.getContract(id);
        if (existing) {
            var needSave = false;
            // 早期播种的演示合同可能缺少邀请人字段，补名并刷新持久化消息
            if (!existing.inviterName) {
                existing.inviterName = '陈庄';
                existing.inviterRole = '工长';
                needSave = true;
            }
            // 甲方统一为陈庄（工长），兼容旧数据残留的「陈业主」
            if (!existing.partyAName || existing.partyAName === '陈业主') {
                existing.partyAName = '陈庄';
                needSave = true;
            }
            // 旧数据可能缺少甲方电话，补默认演示号码
            if (!existing.partyAPhone) {
                existing.partyAPhone = '13800138000';
                needSave = true;
            }
            // 旧数据可能缺少项目地址，补演示默认地址（受邀方视角展示用）
            if (!existing.projectAddress) {
                existing.projectAddress = DEMO_PROJECT_ADDRESS;
                needSave = true;
            }
            // 老演示默认仅 1 名受邀人，补充为 DEMO_TYPES 默认多人，便于演示多人抢单效果
            if (existing.invitations && existing.invitations.length === 1) {
                existing.invitations = d.invited.map(function (uid) {
                    var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
                    return { userId: m.id, name: m.name, role: m.role, status: 'pending' };
                });
                needSave = true;
                // 同步刷新合同邀约消息：删除旧的、按新受邀人重建
                (global.ContractStore.getMessages() || []).forEach(function (m) {
                    if (m.type === 'contract_invite' && m.contractId === existing.id) {
                        global.ContractStore.deleteMessage(m.id);
                    }
                });
                existing.invitations.forEach(function (inv) {
                    global.ContractStore.addMessage({
                        id: 'cmsg-' + existing.id + '-' + inv.userId,
                        type: 'contract_invite', contractId: existing.id, toUserId: inv.userId, toUserName: inv.name,
                        fromUserName: existing.inviterName || '陈庄', fromUserRole: existing.inviterRole || '工长',
                        contractName: existing.name, contractType: existing.typeName, group: existing.group,
                        status: 'pending', time: nowLabel(), date: '今天', unread: true
                    });
                });
            }
            // 演示：预置一名「已拒绝」并附原因的受邀人，便于发起方视图展示拒绝原因（幂等，用户真实拒绝后不覆盖）
            if (presetRejectedDemo(existing.invitations)) needSave = true;
            if (needSave) global.ContractStore.saveContract(existing);
            return id;
        }
        var invited = d.invited.map(function (uid) {
            var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
            return { userId: m.id, name: m.name, role: m.role };
        });
        global.ContractStore.createContract({
            id: id, name: d.name, type: d.type, typeName: d.typeName,
            group: d.group, partyA: 'm-owner', partyAName: '陈庄', partyAPhone: '13800138000', projectAddress: DEMO_PROJECT_ADDRESS, inviterName: '陈庄', inviterRole: '工长',
            amount: d.amount, invited: invited
        });
        // 演示：预置一名「已拒绝」并附原因的受邀人，便于发起方视图展示拒绝原因
        var freshC = global.ContractStore.getContract(id);
        if (freshC && presetRejectedDemo(freshC.invitations)) global.ContractStore.saveContract(freshC);
        return id;
    }

    // 演示用：规范化「已签约 / 已确认（发起方）」视图的受邀人状态，稳定呈现
    // 「一人已确认（乙方）、一人抢单失败、一人已拒绝」的演示效果。
    // - 乙方（首位受邀人）不参与此规范化；
    // - 仅最后一名非乙方受邀人设为「已拒绝 + 原因」；
    // - 其余非乙方受邀人若曾为「已拒绝」（旧数据残留），重置为待确认，
    //   使已签约 / 已确认（发起方）视图回退显示为「抢单失败」而非「已拒绝」。
    // 幂等：仅修改上述目标项；仅作用于 demo-<type>-example 演示合同，不覆盖用户真实数据。
    function presetRejectedDemo(invitations) {
        if (!invitations || invitations.length < 2) return false;
        var changed = false;
        var firstId = (invitations[0] || {}).userId;
        var reasonText = '近期已有其他项目安排，无法承接本合同，敬请谅解。';
        var others = invitations.filter(function (i) { return i.userId !== firstId; });
        if (others.length === 0) return false;
        var lastOther = others[others.length - 1];
        others.forEach(function (i) {
            if (i === lastOther) {
                if (i.status !== 'rejected' || !i.rejectReason) {
                    i.status = 'rejected';
                    i.rejectReason = reasonText;
                    changed = true;
                }
            } else if (i.status === 'rejected') {
                delete i.status;
                delete i.rejectReason;
                changed = true;
            }
        });
        return changed;
    }

    function createDemo(type) {
        var d = DEMO_TYPES.filter(function (x) { return x.type === type; })[0];
        if (!d || !global.ContractStore) return;
        var id = 'demo-' + type + '-' + Date.now();
        var invited = d.invited.map(function (uid) {
            var m = WORKER_CANDIDATES.filter(function (x) { return x.id === uid; })[0];
            return { userId: m.id, name: m.name, role: m.role };
        });
        global.ContractStore.createContract({
            id: id, name: d.name, type: d.type, typeName: d.typeName,
            group: d.group, partyA: 'm-owner', partyAName: '陈庄', partyAPhone: '13800138000', projectAddress: DEMO_PROJECT_ADDRESS, inviterName: '陈庄', inviterRole: '工长',
            amount: d.amount, invited: invited
        });
        global.location.href = 'worker-contract-detail.html?id=' + encodeURIComponent(id) + '&viewer=sender';
    }

    function resetDemo() {
        if (global.ContractStore && global.ContractStore.clearAll) global.ContractStore.clearAll();
        global.location.href = 'worker-contract-detail.html';
    }

    function bindModalDismiss() {
        var modal = $('confirmModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeConfirm();
            });
        }
        var bcModal = $('businessCardModal');
        if (bcModal) {
            bcModal.addEventListener('click', function (e) {
                if (e.target === bcModal) closeBusinessCard();
            });
        }
        var reselectModal = $('reselectConfirmModal');
        if (reselectModal) {
            reselectModal.addEventListener('click', function (e) {
                if (e.target === reselectModal) closeReselectConfirm();
            });
        }
    }

    // ============== 状态计算 ==============
    function computeStatus() {
        var c = state.contract;
        if (state.viewer === 'receiver') {
            if (c.status === 'worker_confirmed') {
                var conf = c.invitations.filter(function (i) { return i.status === 'confirmed'; })[0];
                if (conf && conf.userId === state.asUserId) return 'worker_confirmed_receiver';
                return 'worker_lost_receiver';
            }
            if (c.status === 'worker_inviting') {
                var meInv = c.invitations.filter(function (i) { return i.userId === state.asUserId; })[0];
                if (meInv && meInv.status === 'rejected') return 'worker_rejected_receiver';
                return 'worker_inviting_receiver';
            }
            if (c.status === 'worker_draft') return 'worker_draft';
            if (c.status === 'worker_draft_initial') return 'worker_draft_initial';
            if (c.status === 'worker_signed') return 'worker_signed';
            return 'worker_draft';
        }
        if (c.status === 'worker_inviting') return 'worker_inviting_sender';
        if (c.status === 'worker_confirmed') return 'worker_confirmed_sender';
        if (c.status === 'worker_draft') return 'worker_draft';
        if (c.status === 'worker_draft_initial') return 'worker_draft_initial';
        if (c.status === 'worker_signed') return 'worker_signed';
        return 'worker_draft';
    }

    // 预览态：根据当前选中状态推导「已确认乙方」的 userId（用于元信息/架构提示展示）
    function previewConfirmedId() {
        var st = state.status;
        var c = state.contract;
        var firstId = (c.invitations[0] || {}).userId || '';
        if (st === 'worker_confirmed_sender' || st === 'worker_signed') return firstId;
        if (st === 'worker_confirmed_receiver') return state.asUserId;
        if (st === 'worker_lost_receiver') {
            var other = c.invitations.filter(function (i) { return i.userId !== state.asUserId; })[0];
            return other ? other.userId : firstId;
        }
        return '';
    }

    // 预览态：单个受邀人在名单中的展示状态
    function inviteDisplayStatus(inv) {
        var st = state.status;
        var c = state.contract;
        var asId = state.asUserId;
        var firstId = (c.invitations[0] || {}).userId || '';
        if (st === 'worker_inviting_sender' || st === 'worker_inviting_receiver' || st === 'worker_draft') {
            return inv.status; // 真实数据
        }
        if (st === 'worker_confirmed_sender') return inv.userId === firstId ? 'confirmed' : (inv.status === 'rejected' ? 'rejected' : 'lost');
        if (st === 'worker_confirmed_receiver') return inv.userId === asId ? 'confirmed' : (inv.status === 'rejected' ? 'rejected' : 'lost');
        if (st === 'worker_lost_receiver') {
            if (inv.userId === asId) return 'lost';
            var winner = c.invitations.filter(function (i) { return i.userId !== asId; })[0];
            if (winner && inv.userId === winner.userId) return 'confirmed';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'worker_signed') return inv.userId === firstId ? 'confirmed' : (inv.status === 'rejected' ? 'rejected' : 'lost');
        // 变更阶段各状态：变更仅乙方需确认，其他人仅为历史邀约记录（不再「待确认」）。
        // 乙方状态按变更逻辑随状态演进：
        //   待确认变更 change_confirming（受邀方）·变更中 changing = 待确认（变更）；
        //   确认中/签约中 change_confirming_sender·change_signing_wait = 已确认（变更）；已驳回 change_rejected = 已驳回（变更）
        if (st === 'change_confirming' || st === 'changing') {
            if (inv.userId === firstId) return 'change_pending';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'change_confirming_sender' || st === 'change_signing_wait') {
            if (inv.userId === firstId) return 'change_confirmed';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        if (st === 'change_rejected') {
            if (inv.userId === firstId) return 'change_rejected';
            return inv.status === 'rejected' ? 'rejected' : 'lost';
        }
        return inv.status;
    }

    // 右侧导航「状态切换」直接预览任意状态（按状态推导视角）
    function updateStatusNavActive(status) {
        // 同步右侧原型导航「合同状态切换（工人合同）」当前选中项高亮
        // 遍历全部 .status-switch-item（含无 data-status 的演示项，如「已签约（已履约完成）」），
        // 先统一清除 active，再仅给匹配项点亮，避免切换状态后残留旧高亮（详见 demoFulfilled）
        // 高亮需结合视角（data-viewer）：同一 worker_signed 状态，发起方「已签约」与受邀方「已签约(受邀方)」各自高亮
        var items = document.querySelectorAll('.status-switch-item');
        for (var i = 0; i < items.length; i++) {
            var ds = items[i].getAttribute('data-status');
            var dv = items[i].getAttribute('data-viewer');
            var match = ds && (ds === status) && (!dv || dv === (state.viewer || 'sender'));
            items[i].classList.toggle('active', !!match);
            if (match) expandGroupOf(items[i]);
        }
    }

    // 展开包含指定导航项的「状态分组」，确保选中项可见（不影响其他分组收起状态）
    function expandGroupOf(el) {
        var group = el && el.closest ? el.closest('.status-group') : null;
        if (!group) return;
        var content = group.querySelector('.status-group-content');
        var icon = group.querySelector('.status-group-icon');
        if (content) content.style.display = '';
        if (icon) icon.textContent = '▼';
    }

    /**
     * 演示：切到已签约并显示「已履约完成」徽标
     * （仅原型演示用，用于直观呈现履约完成派生标识效果）
     */
    function demoFulfilled() {
        updateStatus('worker_signed');
        // 设置履约完成状态并重新渲染阶段任务
        state.fulfilled = true;
        renderStagesSection();
        // 显示履约完成徽标
        var fb = $('fulfilledBadge');
        if (fb) fb.style.display = 'inline-flex';
        // 仅高亮「已签约（已履约完成）」演示项
        var items = document.querySelectorAll('.status-switch-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('active');
            if (items[i].textContent.trim() === '已签约（已履约完成）') {
                items[i].classList.add('active');
            }
        }
    }

    function updateStatus(status, viewer) {
        var prevStatus = state.status;
        state.status = status;

        // 乙方确认接单→已签约：将「无执行人」的任务执行人统一更新为乙方人员（仅签约瞬间触发一次）
        if (status === 'worker_signed' && prevStatus !== 'worker_signed') {
            assignDefaultExecutorsOnSigned();
        }

        // 视角处理：优先使用导航项显式传入的 viewer（如发起方「已签约」项传入 'sender'），
        // 否则按状态后缀自动推导。视角必须在更新高亮前确定，保证高亮与渲染一致。
        if (viewer) {
            state.viewer = viewer;
            if (viewer === 'receiver') {
                var fId = (state.contract.invitations[0] || {}).userId || '';
                var vValid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
                if (!vValid) state.asUserId = fId;
            } else {
                state.asUserId = '';
            }
        } else if (status.indexOf('_receiver') > -1) {
            state.viewer = 'receiver';
            var firstId = (state.contract.invitations[0] || {}).userId || '';
            var valid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
            if (!valid) state.asUserId = firstId;
        } else if (status.indexOf('_sender') > -1) {
            state.viewer = 'sender';
            state.asUserId = '';
        } else if (status.indexOf('change') === 0) {
            // 变更阶段：change_confirming（待确认变更·受邀方）与以 _receiver 结尾者为待确认方（乙方）视角，其余按发起方视角预览
            if (status === 'change_confirming' || status.indexOf('_receiver') > -1) {
                state.viewer = 'receiver';
                var cFirstId = (state.contract.invitations[0] || {}).userId || '';
                var cValid = state.contract.invitations.some(function (i) { return i.userId === state.asUserId; });
                if (!cValid) state.asUserId = cFirstId;
            } else {
                state.viewer = 'sender';
                state.asUserId = '';
            }
        } else if (status === 'worker_draft' || status === 'worker_draft_initial') {
            state.viewer = 'sender';
            state.asUserId = '';
        }

        updateStatusNavActive(status); // 同步导航状态项选中高亮（需在视角确定后调用）
        var cfg = STATUS_CONFIG[status] || STATUS_CONFIG.worker_draft;

        $('bannerText').textContent = cfg.text;
        // 受邀方（乙方）视角不展示「可发起合同变更」提示（受邀方不支持发起变更，由发起方操作）
        $('bannerDesc').textContent = (state.viewer === 'receiver' && cfg.descReceiver) ? cfg.descReceiver : cfg.desc;
        $('statusBanner').className = 'wc-banner ' + (cfg.bannerClass || 'draft');

        // 切换状态时默认隐藏履约完成徽标（仅 demoFulfilled 时显示）
        var fb = $('fulfilledBadge');
        if (fb) fb.style.display = 'none';
        state.fulfilled = false;

        // 变更已驳回（乙方）：展示乙方驳回原因
        var crr = $('changeRejectReason');
        if (crr) {
            if (cfg.showRejectReason && cfg.rejectReason) {
                crr.innerHTML = '<span class="crr-label">乙方驳回原因</span>' + escapeHtml(cfg.rejectReason);
                crr.style.display = 'block';
            } else {
                crr.style.display = 'none';
            }
        }

        // 受邀方终态（抢单失败 / 已拒绝）：渲染轻量「邀约已结束」视图，隐藏完整详情，不影响发起方视图
        var isReceiverEnded = (status === 'worker_lost_receiver' || status === 'worker_rejected_receiver');
        var endedView = $('receiverEndedView');
        if (endedView) endedView.style.display = isReceiverEnded ? 'block' : 'none';
        if ($('statusBanner')) $('statusBanner').style.display = isReceiverEnded ? 'none' : '';
        if ($('invitationCard')) $('invitationCard').style.display = isReceiverEnded ? 'none' : 'block';
        if ($('readOnlySections')) $('readOnlySections').style.display = isReceiverEnded ? 'none' : '';
        if ($('draftContentWrap')) $('draftContentWrap').style.display = isReceiverEnded ? 'none' : '';
        if ($('bottomActions')) $('bottomActions').style.display = isReceiverEnded ? 'none' : '';
        if (isReceiverEnded) {
            // 受邀方终态（抢单失败 / 已拒绝）：隐藏顶部「合同操作 更多」整行，不展示该工具栏
            var tbEnd = $('contentToolbar');
            if (tbEnd) tbEnd.style.display = 'none';
            var mpEnd = $('moreOpsPanel');
            if (mpEnd) mpEnd.classList.remove('show');
            renderReceiverEndedView(status, cfg);
            return;
        }

        // 非终态：展示顶部「合同操作 更多」工具栏，并按状态动态生成更多菜单内容
        var tbShow = $('contentToolbar');
        if (tbShow) tbShow.style.display = '';
        renderMoreOps(status);

        renderMeta();
        renderFlow(status);
        repositionFlowBar(status);
        renderLists(status);

        var isDraft = (status === 'worker_draft' || status === 'worker_draft_initial');
        // 受邀方视角不展示「其他被邀请人及确认状态」，仅发起方可见完整名单；
        // 但待确认变更（change_confirming·受邀方）需展示「乙方（我）待确认（变更）」行，故放开名单显示
        var showInviteList = !isDraft && (state.viewer !== 'receiver' || status === 'change_confirming');
        $('inviteListBox').style.display = showInviteList ? 'block' : 'none';
        $('inviteEditPanel').style.display = isDraft ? 'block' : 'none';
        if (isDraft) initEditPanel();

        var ro = $('readOnlySections');
        var dw = $('draftContentWrap');
        if (ro) ro.style.display = isDraft ? 'none' : 'block';
        if (dw) dw.style.display = isDraft ? 'block' : 'none';
        if (isDraft) renderDraftContent();

        // 重新选择乙方（拟定中·撤回后）：存在被替换的原乙方时，横幅提示 + 历史卡片均以数据驱动展示（直接导航进入也生效）
        if (isDraft && state.contract.replacedPartyB && state.contract.replacedPartyB.name) {
            applyReselectBanner();
        }

        renderArchNote();
        renderActions(cfg);
        renderChangeHighlight();   // 变更阶段：在已签约内容基础上高亮标记变更点

        renderContentSection();
        renderStagesSection();
        renderAttachmentsSection();
    }

    function renderMeta() {
        var c = state.contract;
        var html = '';
        var isDraft = (state.status === 'worker_draft' || state.status === 'worker_draft_initial');
        var isReceiver = (state.viewer === 'receiver');
        if (!isDraft) html += metaRow('合同名称', c.name);
        // 受邀方视角：取消「合同类型」「所属架构层级」，改为补充「项目地址」（见下方）
        if (!isReceiver && !isDraft) {
            html += metaRow('合同类型', c.typeName);
            html += metaRow('所属架构层级', c.group || '—');
        }
        if (!isDraft && c.amount) {
            // 变更阶段：合同金额以「旧值 → 新值」高亮标记变更点（仍为已签约内容框架）
            var cpAmt = (isChangeStage() ? getActiveChangeProposal() : null);
            if (cpAmt && cpAmt.amountNew !== cpAmt.amountOld) {
                html += metaRowHighlight('合同金额', '¥' + fmtMoney(cpAmt.amountOld) + ' 元', '¥' + fmtMoney(cpAmt.amountNew) + ' 元');
            } else {
                html += metaRow('合同金额', c.amount + ' 元');
            }
        }
        // 项目地址：受邀方视角补充展示（发起方/草稿保持原样，不增删）
        if (isReceiver && c.projectAddress) html += metaRow('项目地址', c.projectAddress);
        if (c.partyAName) {
            var paPhone = c.partyAPhone || '13800138000';
            var paVal = '<span class="meta-party-a">' + escapeHtml(c.partyAName) + '（工长）</span>' +
                '<span class="meta-phone" onclick="WCP.callPartyA(\'' + escapeHtml(paPhone) + '\')" title="拨打工长电话">📞</span>';
            html += metaRowRaw('甲方', paVal);
        }
        var pId = previewConfirmedId();
        if (pId) {
            var p = c.invitations.filter(function (i) { return i.userId === pId; })[0];
            if (p) html += metaRow('乙方', p.name);
        } else if (c.partyBName) {
            html += metaRow('乙方', c.partyBName);
        }
        $('workerContractMeta').innerHTML = html;
    }
    function metaRow(label, value) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + escapeHtml(value) + '</span></div>';
    }
    function metaRowRaw(label, valueHtml) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + valueHtml + '</span></div>';
    }

    function renderFlow(status) {
        // 步骤条对齐「拟定中（发起方）-新」：拟定中 → 确认中 → 已签约（3 步，无独立「已确认」步）
        var steps = [
            { key: 'draft', label: '拟定中', icon: '✏️' },
            { key: 'inviting', label: '确认中', icon: '🤝' },
            { key: 'signed', label: '已签约', icon: '📄' }
        ];
        var order = ['draft', 'inviting', 'signed'];
        var current = 'inviting';
        var done = false;
        if (status === 'worker_draft' || status === 'worker_draft_initial') current = 'draft';
        // 变更阶段：合同已签约，阶段任务按变更流程流转，步骤条整体置为已签约（变更以 banner 体现）
        // 含「变更中」(changing) 与 change_* 全部变更态（变更进行中/确认中/签约中/已驳回），均与变更状态不冲突
        // 该分支须置于 confirmed 判断之前，避免 change_* 中某些 key 因含 confirmed 子串被误判
        else if (status.indexOf('change') === 0 || status === 'changing') { current = 'signed'; done = true; }
        else if (status.indexOf('confirmed') > -1) { current = 'signed'; }   // 已确认：归入「已签约」步（进行中）
        else if (status === 'worker_signed') { current = 'signed'; done = true; }
        var curIdx = order.indexOf(current);

        var html = '<div class="worker-flow">';
        steps.forEach(function (s, i) {
            var cls = i < curIdx ? 'done' : (i === curIdx ? (done ? 'done' : 'current') : '');
            html += '<div class="wf-step ' + cls + '"><div class="wf-circle">' + s.icon + '</div><div class="wf-label">' + s.label + '</div></div>';
            if (i < steps.length - 1) {
                html += '<div class="wf-line ' + (i < curIdx ? 'done' : '') + '"></div>';
            }
        });
        html += '</div>';

        var box = $('workerFlowBox');
        box.innerHTML = html;
    }

    // 撤回后 / 发起方 草稿态：步骤条移至「合同操作」下方、状态横幅之上，并改用「合同方 意向乙方首位确认者即签约乙方」标题，
    // 对齐「拟定中（发起方）-新」；非草稿态恢复原位，不影响其他状态布局。
    function repositionFlowBar(status) {
        var flowBox = $('workerFlowBox');
        var invitationCard = $('invitationCard');
        var mainView = $('mainView');
        var banner = $('statusBanner');
        var meta = $('workerContractMeta');
        if (!flowBox || !invitationCard || !mainView || !banner) return;
        var isDraft = (status === 'worker_draft' || status === 'worker_draft_initial');
        var title = invitationCard.querySelector('.card-title');
        if (isDraft) {
            if (flowBox.parentNode !== mainView) mainView.insertBefore(flowBox, banner);
            if (title) title.innerHTML = '🤝 合同方 <span class="card-note">意向乙方首位确认者即签约乙方</span>';
            if (meta) meta.style.display = 'none';
        } else {
            if (flowBox.parentNode === mainView && meta) invitationCard.insertBefore(flowBox, meta);
            if (title) title.innerHTML = '🤝 合同邀约与乙方（意向乙方 · 首位确认者成乙方）';
            if (meta) meta.style.display = '';
        }
    }

    function renderLists(status) {
        var box = $('inviteListBox');
        box.innerHTML = '';
        var c = state.contract;
        var firstId = (c.invitations[0] || {}).userId || '';
        var isChangeView = (status === 'changing' || status === 'change_confirming' || status === 'change_confirming_sender' || status === 'change_signing_wait' || status === 'change_rejected');
        var isReceiverChangeView = isChangeView && state.viewer === 'receiver';
        c.invitations.forEach(function (inv) {
            // 受邀方变更确认态（change_confirming）：仅展示乙方（即受邀方本人）待确认行，不暴露其他受邀人
            if (isReceiverChangeView && inv.userId !== firstId) return;
            var me = (inv.userId === state.asUserId);
            var ds = inviteDisplayStatus(inv);
            var stText = '待确认', stCls = 'pending';
            if (ds === 'confirmed') { stText = '已确认（乙方）'; stCls = 'confirmed'; }
            else if (ds === 'rejected') { stText = '已拒绝'; stCls = 'rejected'; }
            else if (ds === 'lost') { stText = '抢单失败'; stCls = 'lost'; }
            else if (ds === 'change_pending') { stText = '待确认（变更）'; stCls = 'change-pending'; }
            else if (ds === 'change_confirmed') { stText = '已确认（变更）'; stCls = 'change-confirmed'; }
            else if (ds === 'change_rejected') { stText = '已驳回（变更）'; stCls = 'change-rejected'; }
            var reasonSub = '';
            if (ds === 'rejected' && inv.rejectReason && !me) {
                reasonSub = '<div class="invite-reason">原因：' + escapeHtml(inv.rejectReason) + '</div>';
            }
            var isPartyB = (inv.userId === firstId);
            // 变更/已确认(发起方)/已签约：乙方已确定，其他被邀请人作为历史邀约记录弱化展示（浅色），
            // 与变更阶段未选中邀请人效果一致（opacity 0.55 + muted 头像 + 灰色状态徽标）。
            var isRecord = (isChangeView || status === 'worker_confirmed_sender' || status === 'worker_signed') && !isPartyB;
            var partyBTag = isPartyB ? '<span class="invite-partyb-tag">乙方</span>' : '';
            var recordTag = isRecord ? '<span class="invite-record-tag">邀约记录</span>' : '';
            var row = document.createElement('div');
            row.className = 'invite-row' + (me ? ' is-me' : '') + (isPartyB && !isRecord ? ' is-partyb' : '') + (isRecord ? ' is-record' : '');
            // 乙方行以「乙方 {人员}」呈现（乙方标签在前）；记录行附「邀约记录」标识
            var nameHtml = isPartyB
                ? (partyBTag + escapeHtml(inv.name) + (me ? '（我）' : ''))
                : (escapeHtml(inv.name) + (me ? '（我）' : '') + recordTag);
            row.innerHTML =
                '<div class="invite-avatar' + (isRecord ? ' muted' : '') + '">' + escapeHtml(inv.name ? inv.name.charAt(0) : '?') + '</div>' +
                '<div class="invite-info"><div class="invite-name">' + nameHtml + '</div>' +
                '<div class="invite-role">' + escapeHtml(inv.role) + '</div>' + reasonSub + '</div>' +
                '<div class="invite-status ' + stCls + (isRecord ? ' record' : '') + '">' + stText + '</div>';
            box.appendChild(row);
        });
    }

    function renderArchNote() {
        // 已确认 / 已签约态：架构层级加入说明已在上方 banner（「已自动加入项目架构层级」）展示，
        // 下方不再重复该行，故提示框始终隐藏。
        var arch = $('workerArchNote');
        if (arch) arch.style.display = 'none';
    }

    // 受邀方终态（抢单失败 / 已拒绝）：轻量「邀约已结束」视图
    function renderReceiverEndedView(status, cfg) {
        var c = state.contract;
        var view = $('receiverEndedView');
        if (!view) return;
        var isLost = (status === 'worker_lost_receiver');
        var cls = isLost ? 'lost' : 'rejected';
        var icon = isLost ? '⚠' : '✕';
        var statusText = isLost ? '抢单失败' : '已拒绝';
        var reasonBlock = '';
        if (!isLost) {
            // 已拒绝：展示本人填写的拒绝原因
            var meInv = (c.invitations || []).filter(function (i) { return i.userId === state.asUserId; })[0];
            var reason = meInv && meInv.rejectReason;
            if (reason) {
                reasonBlock = '<div class="re-ended-reason"><span class="rr-label">拒绝原因</span>' + escapeHtml(reason) + '</div>';
            }
        }
        view.innerHTML =
            '<div class="re-ended-icon ' + cls + '">' + icon + '</div>' +
            '<div class="re-ended-status ' + cls + '">' + statusText + '</div>' +
            '<div class="re-ended-card">' +
                '<div class="re-ended-contract">' + escapeHtml(c.name) + '</div>' +
                '<div class="re-ended-desc">' + escapeHtml(cfg.desc) + '</div>' +
                reasonBlock +
            '</div>';
    }

    // ============== 合同内容 / 阶段任务 / 附件 ==============
    function switchSection(tabEl, key) {
        var tabs = document.querySelectorAll('.section-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        if (tabEl) tabEl.classList.add('active');
        var keys = ['content', 'stages', 'attachments'];
        keys.forEach(function (k) {
            var el = $(k + 'Section');
            if (el) {
                if (k === key) el.classList.add('show');
                else el.classList.remove('show');
            }
        });
    }

    function renderContentSection() {
        var c = state.contract;
        var isReceiver = (state.viewer === 'receiver');
        // 合同正文：对齐「拟定中」样式——form-label-row（合同正文 + 查看全文）+ 截断预览框（点击查看全文弹全文）
        var preview;
        if (isReceiver) {
            // 受邀方视角：合同正文仅展示关键条款（甲方责权 / 乙方责权），其余内容点击「查看全部正文」查看
            preview = receiverKeyClausesHTML();
        } else {
            preview = '<p>根据《中华人民共和国民法典》及相关法律法规的规定，甲乙双方本着平等、自愿、公平、诚实信用的原则，就' + escapeHtml(c.typeName) + '事宜协商一致，订立本合同。</p>' +
                '<p class="text-title">一、工程概况</p>' +
                '<p>工程名称：' + escapeHtml(c.name) + '</p>' +
                '<p>工程地点：XX市XX区XX路XX号</p>' +
                '<p>工程内容：' + escapeHtml(getContentIntro()) + '</p>';
        }
        var viewFullTextLabel = isReceiver ? '查看全部正文 >' : '查看全文 >';
        var extra = getExtra();
        // 变更阶段：补充条款若被修改，以高亮标记「变更后」内容
        var cpExtra = (isChangeStage() ? getActiveChangeProposal() : null);
        var extraChanged = cpExtra && cpExtra.extraNew && cpExtra.extraNew !== cpExtra.extraOld;
        var extraHtml;
        if (extraChanged) {
            extraHtml = '<span class="text-content-change">' + escapeHtml(cpExtra.extraNew).replace(/\n/g, '<br>') + '</span>' +
                '<span class="text-content-change-tag">变更后</span>';
        } else if (extra) {
            extraHtml = escapeHtml(extra).replace(/\n/g, '<br>');
        } else {
            extraHtml = '<span style="color:var(--text-tertiary);">暂无补充条款</span>';
        }
        var stageChangeBlock = '';
        if (cpExtra && cpExtra.stageNote) {
            stageChangeBlock = '<div class="form-group" style="margin-top:16px;">' +
                '<div class="form-label-row"><label class="form-label">阶段任务变更</label>' +
                '<span class="text-content-change-tag">变更后</span></div>' +
                '<div class="text-content"><span class="text-content-change">' + escapeHtml(cpExtra.stageNote) + '</span></div>' +
            '</div>';
        }
        var html = '<div class="card">' +
            '<div class="form-group">' +
                '<div class="form-label-row"><label class="form-label">合同正文</label>' +
                '<span class="view-full-link" onclick="WCP.showFullText()">' + viewFullTextLabel + '</span></div>' +
                '<div class="contract-text-preview">' + preview + '</div>' +
            '</div>' +
            '<div class="form-group" style="margin-top:16px;">' +
                '<div class="form-label-row"><label class="form-label">补充条款</label>' +
                (extraChanged ? '<span class="text-content-change-tag">变更后</span>' : '') + '</div>' +
                '<div class="text-content">' + extraHtml + '</div>' +
            '</div>' +
            stageChangeBlock +
            '</div>';
        $('contentSection').innerHTML = html;
    }

    // 受邀方视角合同正文预览：仅展示关键条款（甲方责权 / 乙方责权）
    function receiverKeyClausesHTML() {
        return '<div class="clause-block"><div class="clause-title">一、甲方责权</div><ol class="clause-list">' +
            '<li>甲方有权按照相关工艺及质量标准监督、指导乙方工作，并根据工作过程及完成情况给予奖励、处罚。</li>' +
            '<li>甲方应按照工程施工要求在乙方施工前进行相关培训及交底，包含但不限于《现场施工管理规定》、《施工工艺及验收标准》、图纸交底等。</li>' +
            '<li>甲方有责任按时为乙方提供满足工作需要的场地、材料、工具、安全措施等。</li>' +
            '</ol></div>' +
            '<div class="clause-block"><div class="clause-title">二、乙方责权</div><ol class="clause-list">' +
            '<li>乙方有权在约定的支付节点获得报酬。</li>' +
            '<li>当遇到现场、图纸冲突时，乙方应第一时间告知甲方进行协调。</li>' +
            '<li>乙方在工作中应自觉保护其他工种的劳动成果，不得擅自破坏。</li>' +
            '<li>乙方不得擅自把甲方提供的工具、材料拿出场外或使用到其他工地。</li>' +
            '</ol></div>';
    }

    function renderStagesSection() {
        var c = state.contract;
        var stages = getStages();
        var isFulfilled = state.fulfilled;
        // 已签约状态：点击任务跳转任务详情页（履约完成→已完成，否则→待开始）；其余状态仍弹窗查看
        var isSigned = (state.status === 'worker_signed');
        var stageHtml = stages.map(function (s, i) {
            var tasks = (s.tasks || []).map(function (t) {
                var clickAttr = isSigned
                    ? 'onclick="WCP.goTaskDetail()"'
                    : 'onclick="WCP.viewTaskDetail(this)"';
                return '<div class="task-item" ' + clickAttr +
                    ' data-task-name="' + escapeHtml(t.name) + '"' +
                    ' data-executor="' + escapeHtml(t.exec || '') + '"' +
                    ' data-confirmers="' + escapeHtml(t.conf || '') + '"' +
                    ' data-exec-standard="' + escapeHtml(t.execStd || '') + '"' +
                    ' data-confirm-standard="' + escapeHtml(t.confStd || '') + '"' +
                    ' data-liable-standard="' + escapeHtml(t.liableStd || '') + '"' +
                    '><div class="task-info">' +
                    '<div class="task-name">' + escapeHtml(t.name) + (isFulfilled ? ' <span class="task-done-tag">✓ 已完成</span>' : '') + '</div>' +
                    '</div></div>';
            }).join('');
            return '<div class="stage-item"><div class="stage-header" onclick="WCP.toggleStage(this)">' +
                '<div class="stage-icon">' + (i + 1) + '</div>' +
                '<div class="stage-info"><div class="stage-name">' + escapeHtml(s.name) + '</div>' +
                '<div class="stage-meta">' + (s.tasks ? s.tasks.length : 0) + '个任务 · ' + (isFulfilled ? '已完成 100%' : '待开始') + '</div>' +
                '<div class="stage-order-tag" style="background-color:#FFF7E6;color:#FA8C16;">' + escapeHtml(s.order || '并行执行') + '</div></div>' +
                '<div class="arrow expanded">▼</div></div>' +
                '<div class="stage-tasks show">' + tasks + '</div></div>';
        }).join('');
        var html = '<div class="card"><div class="card-title"><span>📊 阶段任务 (' + stages.length + '个阶段)</span></div>' + stageHtml + '</div>';
        $('stagesSection').innerHTML = html;
    }

    function toggleStage(header) {
        var tasks = header.parentElement.querySelector('.stage-tasks');
        var arrow = header.querySelector('.arrow');
        if (!tasks) return;
        var collapsed = tasks.style.display === 'none';
        tasks.style.display = collapsed ? 'block' : 'none';
        if (arrow) arrow.classList.toggle('expanded', collapsed);
    }

    function renderAttachmentsSection() {
        var c = state.contract;
        var signHtml = renderSignArea();
        var attachHtml = getAttachments().map(function (a) {
            return '<div class="attachment-item"><div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(a.name) + '</div><div class="file-meta">' + escapeHtml(a.meta || '') + '</div></div>' +
                '<div class="download-btn" onclick="WCP.showToast(\'预览附件\')">⬇</div></div>';
        }).join('');
        var html = '<div class="card"><div class="card-title"><span>📝 签约文件</span></div>' + signHtml + '</div>' +
            '<div class="card"><div class="card-title"><span>📎 合同附件</span></div>' + attachHtml + '</div>';
        $('attachmentsSection').innerHTML = html;
    }

    // 签约文件区（附件区内），依据状态展示
    function renderSignArea() {
        var status = state.status;
        if (status === 'worker_signed') {
            return '<div class="attachment-item"><div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(state.contract.typeName) + '_签约文件.pdf</div>' +
                '<div class="file-meta">已上传 · 合同已生效</div></div>' +
                '<div class="download-btn" onclick="WCP.showToast(\'预览文件\')">👁️</div></div>';
        }
        if (status === 'worker_confirmed_receiver') {
            return '<div class="sign-file-wait">等待发起方上传已签署的纸质合同扫描件，上传后合同正式生效。</div>';
        }
        if (status === 'worker_confirmed_sender') {
            return '<div class="sign-file-drop">请上传已签署的纸质合同扫描件 / 照片' +
                '<div class="sf-btn" onclick="WCP.pickSignFile()">选择文件并上传</div></div>';
        }
        return '<div class="sign-file-wait">暂无签约文件。</div>';
    }

    function pickSignFile() { $('signFileInput').click(); }
    function onSignFilePicked(e) {
        var f = e.target && e.target.files && e.target.files[0];
        if (!f) return;
        // 注：「变更签约文件上传」已改为跳转独立上传页（worker-change-sign-upload.html），上传成功后由该页跳回「已签约」；
        // 此处仅处理「已确认 → 上传签约文件」的常规签约（无 changeProposal），上传后跳回「已签约」
        if (state.contract && state.contract.changeProposal) {
            applyChangeProposal();
            showToast('变更签约文件已上传，合同变更已生效（V2）');
            updateStatus('worker_signed');
            e.target.value = '';
            return;
        }
        if (global.ContractStore && state.workerId) {
            global.ContractStore.markSigned(state.workerId);
            state.contract = global.ContractStore.getContract(state.workerId);
        }
        showToast('签约文件已上传，合同已生效');
        updateStatus('worker_signed');
        e.target.value = '';
    }

    // 变更生效（V2）：将发起变更页提交的提案（金额/补充条款/阶段任务/附件）落到合同，并写入版本记录
    function applyChangeProposal() {
        var cp = state.contract.changeProposal;
        if (!cp) return;
        var patch = {};
        if (typeof cp.amountNew === 'number') { state.contract.amount = cp.amountNew; patch.amount = cp.amountNew; }
        if (typeof cp.extraNew === 'string') { state.contract.extraClauses = cp.extraNew; patch.extraClauses = cp.extraNew; }
        if (cp.stagesNew) { state.contract.stages = cp.stagesNew; patch.stages = cp.stagesNew; }
        if (cp.attachmentsNew) { state.contract.attachments = cp.attachmentsNew; patch.attachments = cp.attachmentsNew; }
        // 版本记录（历史版本）：标记 V2
        state.contract.versionLog = state.contract.versionLog || [];
        var vDesc = '变更生效';
        if (cp.amountNew !== cp.amountOld) vDesc += '：金额 ¥' + fmtMoney(cp.amountOld) + ' → ¥' + fmtMoney(cp.amountNew);
        if (cp.reason) vDesc += (vDesc === '变更生效' ? '：' : '；') + cp.reason;
        state.contract.versionLog.push({
            name: '合同变更 V2',
            desc: vDesc,
            date: nowLabel(),
            by: state.contract.partyAName || '陈庄'
        });
        patch.versionLog = state.contract.versionLog;
        // 清除提案（恢复为 clean 已签约内容）
        state.contract.changeProposal = '';
        patch.changeProposal = '';
        pushChangeLog('变更生效（V2）', '合同变更已正式生效，阶段任务按变更后内容继续流转', 'primary');
        if (global.ContractStore && state.workerId) {
            global.ContractStore.patchContract(state.workerId, patch);
        }
    }

    // ============== 底部操作 ==============
    function renderActions(cfg) {
        var box = $('bottomActions');
        box.innerHTML = '';
        box.style.display = 'flex';
        var actions = cfg.actions || [];
        // 重新选择乙方（拟定中·撤回后）：存在被替换的原乙方时，底部操作显示为「恢复原乙方 / 提交并邀请乙方」
        // 数据驱动（replacedPartyB 存在即代表处于重选草稿态），跨导航进入也稳定显示
        if (state.contract.replacedPartyB && (status === 'worker_draft' || status === 'worker_draft_initial')) {
            actions = [
                { text: '仅保存', type: 'secondary', action: 'worker_save_draft' },
                { text: '恢复原乙方', type: 'secondary', action: 'worker_reselect_cancel' },
                { text: '提交并邀请乙方', type: 'success', action: 'worker_resubmit' }
            ];
        }
        // 受邀方（乙方）视角不支持发起变更：过滤掉 start_change（发起方专属操作），避免误展示
        if (state.viewer === 'receiver') {
            actions = actions.filter(function (a) { return a.action !== 'start_change' && a.action !== 'upload_change_sign'; });
        }
        (actions).forEach(function (a) {
            var btn = document.createElement('button');
            btn.className = 'wc-action-btn ' + (a.type || 'primary');
            btn.textContent = a.text;
            if (a.disabled) btn.disabled = true;
            btn.onclick = function () { handleAction(a.action); };
            box.appendChild(btn);
        });
        if (actions.length === 0) box.style.display = 'none';
    }

    function handleAction(action) {
        if (action === 'view') return;
        // 已确认(发起方)：上传签约文件——参考「上传变更签约文件（新页面）」整页上传流程，跳转到独立上传页
        // （worker-sign-upload.html），上传成功后由该页跳回「已签约」（V1）。受邀方视角不支持上传签约文件（见 worker_confirmed_receiver）。
        if (action === 'upload_sign') { global.location.href = 'worker-sign-upload.html'; return; }
        // 变更签约中：参考「合同详情（合规版）」的上传变更签约文件流程——跳转到独立上传页面，上传成功后由该页跳回「已签约」
        if (action === 'upload_change_sign') { global.location.href = 'worker-change-sign-upload.html'; return; }
        if (action === 'worker_resubmit') { saveAndResubmit(); return; }
        // 拟定中「仅保存」：持久化当前草稿编辑内容（参考「合同详情（合规版）」），不改变状态、不发送邀约
        if (action === 'worker_save_draft') { saveDraftOnly(); return; }
        // 已签约发起方：点「发起变更」→ 先二次确认，确认后跳转到发起变更「页面」（弹窗无法承载较多内容）
        if (action === 'start_change') { confirmStartChange(); return; }

        // 点击「拒绝」直接展示填写原因弹窗（二次确认在提交原因后触发），不弹前置确认框
        if (action === 'worker_reject') { openRejectReason(); return; }

        // 发起方已确认态：点「重新选择乙方」→ 弹二次确认
        if (action === 'worker_reselect') { openReselectConfirm(); return; }
        // 重选进行中（拟定中）：恢复原乙方（取消重选）
        if (action === 'worker_reselect_cancel') { cancelReselect(); return; }

        var info = ACTION_TEXT[action];
        if (!info) return;
        showConfirm(info.title, info.message, function () {
            if (action === 'worker_withdraw') {
                global.ContractStore.withdrawConfirm(state.workerId);
                state.contract = global.ContractStore.getContract(state.workerId);
                showToast('已撤回确认，合同退回拟定中');
                updateStatus(computeStatus());
            } else if (action === 'worker_confirm') {
                var r = global.ContractStore.confirmInvitation(state.workerId, state.asUserId);
                state.contract = global.ContractStore.getContract(state.workerId);
                if (r.ok) {
                    showToast('确认成功！您已成为本合同乙方，已自动加入项目架构层级');
                } else if (r.reason === 'taken' || r.reason === 'not_inviting') {
                    showToast('已被他人确认（抢单失败）');
                } else if (r.reason === 'already') {
                    showToast('您已处理过该邀约');
                } else {
                    showToast('确认失败，请稍后重试');
                }
                updateStatus(computeStatus());
            } else if (action.indexOf('change') > -1 || action.indexOf('reject_change') > -1 || action.indexOf('confirm_change') > -1) {
                // 变更阶段动作：按合规版流程推进状态并写入变更记录
                var res = applyChangeAction(action);
                if (res) {
                    pushChangeLog(res.logTitle, res.logDesc, res.logType);
                    // 撤回/驳回变更 → 回到已签约，清除变更提案（恢复为原始已签约内容）
                    if (res.next === 'worker_signed') clearChangeProposal();
                    showToast(res.toast);
                    if (res.next) updateStatus(res.next);
                }
            }
        });
    }

    // 变更阶段动作的推进逻辑（对齐「合同详情（合规版）」变更流程）
    function applyChangeAction(action) {
        switch (action) {
            case 'withdraw_change':
                return { next: 'worker_signed', toast: '已撤回变更，合同恢复已签约', logTitle: '撤回变更', logDesc: '发起方撤回变更申请，合同恢复已签约状态', logType: 'primary' };
            case 'reject_change':
                // 待确认方驳回 → 进入「变更已驳回」独立页面（保留提案用于展示被驳回的变更内容，不清除）
                return { next: 'change_rejected', toast: '已驳回变更，进入变更已驳回页', logTitle: '驳回变更', logDesc: '待确认方（乙方）驳回变更申请，合同保持原已签约状态', logType: 'warning' };
            case 'change_rejected_back':
                return { next: 'worker_signed', toast: '已返回合同已签约状态', logTitle: '返回已签约', logDesc: '发起方关闭变更驳回页，合同恢复已签约状态', logType: 'primary' };
            case 'confirm_change':
                // 工人合同无平台审核：对方确认后直接进入「变更确认中」（待上传签约文件）
                return { next: 'change_confirming_sender', toast: '已确认变更，请上传变更签约文件', logTitle: '确认变更', logDesc: '待确认方确认变更，双方达成变更，进入签约环节', logType: 'primary' };
            default:
                return null;
        }
    }

    // 写入合同变更记录（变更记录弹窗动态读取）
    function pushChangeLog(title, desc, type) {
        if (!state.contract) return;
        state.contract.changeLog = state.contract.changeLog || [];
        state.contract.changeLog.push({
            title: title,
            desc: desc,
            type: type || 'primary',
            by: state.contract.partyAName || '陈庄',
            byRole: '工长',
            time: nowLabel()
        });
        if (global.ContractStore && state.workerId) {
            global.ContractStore.patchContract(state.workerId, { changeLog: state.contract.changeLog });
        }
    }

    // 金额千分位格式化
    function fmtMoney(n) {
        var v = Number(n) || 0;
        return v.toLocaleString('zh-CN');
    }

    // 当前生效的「变更提案」：真实发起的变更优先；导航直接预览变更阶段时给出演示提案以便直观查看高亮
    function getActiveChangeProposal() {
        if (state.contract && state.contract.changeProposal) return state.contract.changeProposal;
        if (state.status && state.status.indexOf('change') === 0) {
            var baseAmt = Number(state.contract && state.contract.amount) || 0;
            var baseExtra = getExtra() || '';
            return {
                reason: '因现场实际情况调整，需对合同金额与部分阶段任务进行变更',
                amountOld: baseAmt,
                amountNew: baseAmt + 2000,
                extraOld: baseExtra,
                extraNew: baseExtra ? (baseExtra + '；新增：水电隐蔽工程需增加打压测试环节。') : '新增：水电隐蔽工程需增加打压测试环节。',
                stageNote: '新增「收尾阶段」：包含 2 个任务（保洁、验收）',
                demo: true
            };
        }
        return null;
    }

    function isChangeStage() {
        return !!(state.status && state.status.indexOf('change') === 0);
    }

    // ============== 发起方「发起变更」（已签约 → 变更中） ==============
    // 点「发起变更」先二次确认，确认后跳转到独立的发起变更「页面」（弹窗无法承载较多内容）
    function confirmStartChange() {
        showConfirm('发起合同变更',
            '变更需对方确认，确认后需上传签约文件，上传后生成新版本（V2）。变更确认前阶段任务暂停流转。',
            function () {
                goChangePage();
            },
            { confirmText: '去填写', btnClass: 'primary' });
    }
    function goChangePage() {
        clearChangeProposal();   // 进入发起变更页前清除旧提案，保证从「变更已驳回」重新发起时以当前合同内容全新填写
        global.location.href = 'worker-contract-change.html?id=' + encodeURIComponent(state.workerId);
    }
    function clearChangeProposal() {
        if (state.contract && state.contract.changeProposal) {
            state.contract.changeProposal = '';
            if (global.ContractStore && state.workerId) {
                global.ContractStore.patchContract(state.workerId, { changeProposal: '' });
            }
        }
    }

    // ============== 变更内容高亮（变更阶段：仍为已签约内容，变更点高亮标记） ==============
    function renderChangeHighlight() {
        var card = $('changeHighlightCard');
        if (!card) return;
        if (!isChangeStage()) { card.style.display = 'none'; return; }
        var cp = getActiveChangeProposal();
        if (!cp) { card.style.display = 'none'; return; }
        card.style.display = 'block';
        var amtDiff = (cp.amountNew !== cp.amountOld);
        var amtHtml = amtDiff
            ? ('<span class="ch-old">¥' + fmtMoney(cp.amountOld) + '</span>' +
               '<span class="ch-arrow">→</span>' +
               '<span class="ch-new">¥' + fmtMoney(cp.amountNew) + '</span>' +
               '<span class="ch-badge">' + (cp.amountNew > cp.amountOld ? '+' : '') + fmtMoney(cp.amountNew - cp.amountOld) + '</span>')
            : ('<span class="ch-new">¥' + fmtMoney(cp.amountNew) + '</span>');
        var extraChanged = (cp.extraNew && cp.extraNew !== cp.extraOld);
        var extraHtml = '';
        if (extraChanged) {
            extraHtml = '<div class="ch-sub ch-old-text">原：' + escapeHtml(cp.extraOld || '（无）') + '</div>' +
                '<div class="ch-sub ch-new-text">变更后：' + escapeHtml(cp.extraNew) + '</div>';
        } else if (cp.extraNew) {
            extraHtml = '<div class="ch-sub">' + escapeHtml(cp.extraNew) + '</div>';
        }
        var stageHtml = cp.stageNote ? ('<div class="ch-sub ch-new-text">' + escapeHtml(cp.stageNote) + '</div>') : '';
        var stateLabel = '';
        if (state.status === 'change_rejected') {
            stateLabel = '<span class="ch-state rejected">变更已驳回（乙方）</span>';
        } else if (state.status === 'change_signing_wait') {
            // 仅变更签约中：对方已确认，待上传签约文件生效
            stateLabel = '<span class="ch-state done">变更进行中（待上传签约文件生效）</span>';
        } else {
            // changing / change_confirming（受邀方待确认）/ change_confirming_sender（发起方待确认）：尚未确认，不能上传签约文件
            stateLabel = '<span class="ch-state confirming">变更进行中（等待对方确认）</span>';
        }
        var html =
            '<div class="ch-head"><span class="ch-title">🔄 变更内容</span>' + stateLabel + '</div>' +
            (cp.reason ? '<div class="ch-reason"><span class="ch-reason-label">变更原因</span>' + escapeHtml(cp.reason) + '</div>' : '') +
            '<div class="ch-row"><span class="ch-label">合同金额</span><span class="ch-value">' + amtHtml + '</span></div>' +
            (extraHtml ? '<div class="ch-row"><span class="ch-label">补充条款</span><span class="ch-value">' + extraHtml + '</span></div>' : '') +
            (stageHtml ? '<div class="ch-row"><span class="ch-label">阶段任务</span><span class="ch-value">' + stageHtml + '</span></div>' : '');
        card.innerHTML = html;
    }

    // 元信息行（含变更高亮：旧值 → 新值）
    function metaRowHighlight(label, oldVal, newVal) {
        return '<div class="meta-row highlight"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value"><span class="mv-old">' + escapeHtml(oldVal) +
            '</span><span class="mv-arrow">→</span><span class="mv-new">' + escapeHtml(newVal) +
            '</span><span class="mv-tag">变更</span></span></div>';
    }

    // ============== 拒绝原因弹窗 ==============
    function openRejectReason() {
        var ta = $('rejectReasonInput');
        if (ta) ta.value = '';
        var err = $('rejectReasonErr');
        if (err) err.style.display = 'none';
        $('rejectReasonModal').classList.add('show');
        if (ta) global.setTimeout(function () { ta.focus(); }, 50);
    }
    function closeRejectReason() {
        $('rejectReasonModal').classList.remove('show');
    }
    function submitRejectReason() {
        var ta = $('rejectReasonInput');
        var reason = (ta && ta.value || '').trim();
        if (!reason) {
            var err = $('rejectReasonErr');
            if (err) { err.textContent = '请填写拒绝原因'; err.style.display = 'block'; }
            if (ta) ta.focus();
            return;
        }
        // 暂存原因，收起原因弹窗后弹出二次确认提示（原因弹窗层级更低，避免遮挡）
        pendingRejectReason = reason;
        closeRejectReason();
        showConfirm('确认拒绝邀约', '您填写的拒绝原因将提交给发起方（工长），确定要拒绝该合同邀约吗？', function () {
            doReject(pendingRejectReason);
        }, {
            confirmText: '确认拒绝',
            btnClass: 'danger',
            onCancel: function () {
                // 取消二次确认 → 回到原因弹窗并保留已填内容
                var saved = pendingRejectReason;
                pendingRejectReason = null;
                openRejectReason();
                var taBack = $('rejectReasonInput');
                if (taBack && saved) taBack.value = saved;
            }
        });
    }
    function doReject(reason) {
        pendingRejectReason = null;
        global.ContractStore.rejectInvitation(state.workerId, state.asUserId, reason);
        state.contract = global.ContractStore.getContract(state.workerId);
        showToast('已拒绝该合同邀约');
        updateStatus(computeStatus());
    }

    // ============== 发起方主动重新选择乙方 ==============
    function openReselectConfirm() {
        var m = $('reselectConfirmModal');
        if (m) m.classList.add('show');
    }
    function closeReselectConfirm() {
        var m = $('reselectConfirmModal');
        if (m) m.classList.remove('show');
    }
    function confirmReselect() {
        closeReselectConfirm();
        if (global.ContractStore && state.workerId) {
            global.ContractStore.reselectPartyB(state.workerId);   // 原乙方 replaced、versionLog 留痕、清空名单、退回拟定中
            state.contract = global.ContractStore.getContract(state.workerId);
        }
        updateStatus('worker_draft');   // 渲染拟定中（撤回后）：横幅/历史卡片/底部「恢复原乙方·提交并邀请乙方」均以 replacedPartyB 数据驱动
        showToast('合同已退回拟定中，请重新选择乙方');
    }
    // 重选拟定中横幅：提示原乙方合作未达成，并引导重新搜索选择 1-3 名意向乙方
    function applyReselectBanner() {
        var prev = state.contract.replacedPartyB;
        $('bannerText').textContent = '重新选择乙方';
        $('bannerDesc').textContent = prev && prev.name
            ? ('原乙方「' + prev.name + '」合作未达成，合同已退回拟定中。请重新搜索并选择 1-3 名意向乙方后提交邀请。')
            : '合同已退回拟定中。请重新搜索并选择 1-3 名意向乙方后提交邀请。';
        $('statusBanner').className = 'wc-banner draft';
        renderReselectHistory();   // 同步展示「历史选择记录」卡片
    }
    // 重选视图内的「历史选择记录」卡片：展示被替换的原乙方（发起人可见，直至提交新邀请）
    function renderReselectHistory() {
        var card = $('reselectHistoryCard');
        if (!card) return;
        var prev = state.contract.replacedPartyB;
        if (prev && prev.name) {
            card.style.display = 'block';
            $('reselectHistoryBody').innerHTML =
                memberAvatarHtml(prev, '') +
                '<div class="rh-info">' +
                    '<div class="rh-name">' + escapeHtml(prev.name) + '</div>' +
                    '<div class="rh-role">' + escapeHtml(prev.role || '乙方') + '</div>' +
                '</div>' +
                '<span class="rh-tag">合作未达成</span>';
        } else {
            card.style.display = 'none';
        }
    }
    function cancelReselect() {
        var prev = state.contract.replacedPartyB;   // 恢复原乙方以 replacedPartyB 为权威来源（跨导航也稳定）
        if (global.ContractStore && state.workerId && prev) {
            global.ContractStore.reselectCancel(state.workerId, prev);
            state.contract = global.ContractStore.getContract(state.workerId);
        }
        updateStatus('worker_confirmed_sender');
        showToast('已取消重新选择，恢复原乙方');
    }
    // ============== 乙方头像 / 个人电子名片（拟定中选择乙方时展示） ==============
    // 由 userId 生成稳定色相，保证同名不同人头像颜色不同（避免重名混淆）
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
        var av = $('bcAvatar');
        if (av) { av.textContent = (m.name || '?').charAt(0); av.style.background = avatarColor(m.userId || m.name || '?'); }
        var nm = $('bcName'); if (nm) nm.textContent = m.name || '';
        var rl = $('bcRole'); if (rl) rl.textContent = m.role || '';
        var idEl = $('bcId'); if (idEl) idEl.textContent = m.userId || '';
        var box = $('businessCardModal'); if (box) box.classList.add('show');
    }
    function closeBusinessCard() {
        var box = $('businessCardModal'); if (box) box.classList.remove('show');
    }

    // ============== 拟定中：内联「意向乙方」编辑面板 ==============
    function initEditPanel() {
        var typeCands = getContractTypeCandidates(state.contract.type);
        var validIds = typeCands.map(function (m) { return m.id; });
        state.editInvited = (state.contract.invitations || []).filter(function (i) {
            return validIds.indexOf(i.userId) > -1;
        }).map(function (i) {
            return { userId: i.userId, name: i.name, role: i.role };
        });
        if ($('editNameInput')) $('editNameInput').value = state.contract.name || '';
        if ($('editAmountInput')) $('editAmountInput').value = (state.contract.amount != null && state.contract.amount !== '') ? state.contract.amount : '';
        if ($('editDurationInput')) $('editDurationInput').value = (state.contract.duration != null && state.contract.duration !== '') ? state.contract.duration : '';
        if ($('breachInput')) $('breachInput').value = state.contract.breach || '';
        // 甲方默认陈庄（与数据归一化一致）
        if (!state.contract.partyAName) state.contract.partyAName = '陈庄';
        renderPartyAChips();
        renderEditChips();
        renderEditList();
    }

    // ============== 拟定中：合同甲方选择（单选，模糊匹配姓名/角色；复用 WORKER_CANDIDATES） ==============
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
        var keyword = (($('partyASearch') && $('partyASearch').value) || '').trim().toLowerCase();
        listEl.innerHTML = '';
        var matched = WORKER_CANDIDATES.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 || m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { if (emptyEl) emptyEl.style.display = 'block'; return; }
        if (emptyEl) emptyEl.style.display = 'none';
        var curId = (state.contract && state.contract.partyAId) ||
            ((state.contract && state.contract.partyAName) ? (WORKER_CANDIDATES.filter(function (x) { return x.name === state.contract.partyAName; })[0] || {}).id : '') || '';
        matched.forEach(function (m) {
            var selected = curId && curId === m.id;
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
        state.contract.partyAName = m.name;
        state.contract.partyAId = m.id;
        renderPartyAChips();
        renderPartyAList();
        var p = $('partyAPanelBox'); if (p) p.classList.remove('open');
    }
    function renderPartyAChips() {
        var chipsEl = $('partyAChips');
        var valEl = $('partyAValue');
        if (!chipsEl) return;
        chipsEl.innerHTML = '';
        var name = state.contract && state.contract.partyAName;
        if (!name) {
            if (valEl) valEl.textContent = '选择甲方 ›';
            return;
        }
        if (valEl) valEl.textContent = '更换甲方 ›';
        var cur = (WORKER_CANDIDATES.filter(function (x) { return x.name === name; })[0]) || { name: name, role: '' };
        var chip = document.createElement('span');
        chip.className = 'invite-chip';
        chip.innerHTML = memberAvatarHtml(cur, 'clickable') +
            '<span class="chip-text">' + escapeHtml(cur.name) + (cur.role ? '（' + escapeHtml(cur.role) + '）' : '') + '</span>' +
            '<span class="x">✕</span>';
        var av = chip.querySelector('.member-avatar');
        if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(cur); };
        chip.querySelector('.x').onclick = function (ev) {
            ev.stopPropagation();
            state.contract.partyAName = '';
            state.contract.partyAId = '';
            renderPartyAChips();
            renderPartyAList();
        };
        chipsEl.appendChild(chip);
    }

    function toggleEditPanel() {
        var p = $('editInvitePanelBox');
        var open = p.classList.contains('open');
        if (open) { p.classList.remove('open'); return; }
        p.classList.add('open');
        var s = $('editInviteSearch');
        s.value = '';
        renderEditList();
        if (s.focus) s.focus();
    }

    function filterEdit() { renderEditList(); }

    function renderEditList() {
        var listEl = $('editInviteList');
        var emptyEl = $('editInviteEmpty');
        var keyword = ($('editInviteSearch').value || '').trim().toLowerCase();
        listEl.innerHTML = '';
        var typeCands = getContractTypeCandidates(state.contract.type);
        var roleLabel = typeCands[0] ? typeCands[0].role : '工种';
        var titleEl = $('inviteRoleTitle');
        if (titleEl) titleEl.textContent = '意向乙方（仅 ' + roleLabel + '）';
        if (emptyEl) emptyEl.textContent = '未找到匹配的' + roleLabel;
        var matched = typeCands.filter(function (m) {
            if (!keyword) return true;
            return m.name.toLowerCase().indexOf(keyword) > -1 ||
                m.role.toLowerCase().indexOf(keyword) > -1;
        });
        if (matched.length === 0) { emptyEl.style.display = 'block'; return; }
        emptyEl.style.display = 'none';
        var full = state.editInvited.length >= 3;
        matched.forEach(function (m) {
            var selected = state.editInvited.some(function (x) { return x.userId === m.id; });
            var item = document.createElement('div');
            item.className = 'member-picker-item' + (selected ? ' selected' : '') + (full && !selected ? ' disabled' : '');
            item.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="member-main"><span class="member-name">' + escapeHtml(m.name) + '</span>' +
                '<span class="member-role">' + escapeHtml(m.role) + '</span></span>' +
                (selected ? '<span class="check">✓</span>' : '');
            item.onclick = function () { toggleEditMember(m); };
            // 头像点击 → 查看个人电子名片（不触发选择/取消选择）
            var av = item.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            listEl.appendChild(item);
        });
    }

    function toggleEditMember(m) {
        var idx = state.editInvited.map(function (x) { return x.userId; }).indexOf(m.id);
        if (idx > -1) {
            state.editInvited.splice(idx, 1);
        } else {
            if (state.editInvited.length >= 3) {
                showToast('最多邀请 3 名意向乙方');
                return;
            }
            state.editInvited.push({ userId: m.id, name: m.name, role: m.role });
        }
        renderEditChips();
        renderEditList();
    }

    function renderEditChips() {
        var chipsEl = $('inviteEditChips');
        var countEl = $('inviteCount');
        var valEl = $('editInviteValue');
        chipsEl.innerHTML = '';
        if (state.editInvited.length === 0) {
            valEl.textContent = '点击添加意向乙方';
            if (countEl) countEl.textContent = '（至少 1 人）';
        } else {
            valEl.textContent = '已选 ' + state.editInvited.length + ' / 3 人';
            if (countEl) countEl.textContent = '';
        }
        state.editInvited.forEach(function (m) {
            var chip = document.createElement('span');
            chip.className = 'invite-chip';
            chip.innerHTML = memberAvatarHtml(m, 'clickable') +
                '<span class="chip-text">' + escapeHtml(m.name) + '（' + escapeHtml(m.role) + '）</span>' +
                '<span class="x" data-id="' + m.userId + '">✕</span>';
            // 头像点击 → 查看个人电子名片（不触发删除）
            var av = chip.querySelector('.member-avatar');
            if (av) av.onclick = function (e) { e.stopPropagation(); openBusinessCard(m); };
            chip.querySelector('.x').onclick = function (ev) {
                ev.stopPropagation();
                var target = getContractTypeCandidates(state.contract.type).filter(function (x) { return x.id === m.userId; })[0];
                if (target) toggleEditMember(target);
            };
            chipsEl.appendChild(chip);
        });
    }

    function saveAndResubmit() {
        var name = ($('editNameInput').value || '').trim();
        var amountRaw = ($('editAmountInput').value || '').trim();
        var duration = ($('editDurationInput').value || '').trim();
        var breach = ($('breachInput').value || '').trim();
        if (!name) { showToast('请填写合同名称'); return; }
        var amount = Number(amountRaw);
        if (!amountRaw || isNaN(amount) || amount <= 0) { showToast('请填写有效的合同金额'); return; }
        if (state.editInvited.length < 1 || state.editInvited.length > 3) {
            showToast('请至少选择 1 名意向乙方');
            return;
        }
        ensureDraftFields();
        state.contract.duration = duration;
        state.contract.breach = breach;
        var info = ACTION_TEXT.worker_resubmit;
        showConfirm(info.title, info.message, function () {
            if (global.ContractStore.patchContract) {
                global.ContractStore.patchContract(state.workerId, {
                    name: name, amount: amount,
                    duration: duration, breach: breach,
                    partyAName: state.contract.partyAName, partyAId: state.contract.partyAId,
                    stages: state.contract.stages,
                    extraClauses: state.contract.extraClauses,
                    attachments: state.contract.attachments,
                    templateText: state.contract.templateText,
                    templateStage: state.contract.templateStage,
                    contentIntro: state.contract.contentIntro
                });
            }
            global.ContractStore.submitInvite(state.workerId, state.editInvited);
            state.contract = global.ContractStore.getContract(state.workerId);
            showToast('已提交邀请');
            updateStatus(computeStatus());
            renderReselectHistory();            // 隐藏「历史选择记录」卡片（replacedPartyB 已清空）
        });
    }

    // ============== 拟定中「仅保存」（参考「合同详情（合规版）」saveDraftContent） ==============
    // 将当前草稿编辑内容持久化到合约库，不改变状态、不发送邀约、不弹出二次确认；
    // 重新进入拟定中时由 initEditPanel / renderDraftContent 自动恢复（含意向乙方）。
    function saveDraftOnly() {
        var name = ($('editNameInput').value || '').trim();
        var amount = ($('editAmountInput').value || '').trim();
        var duration = ($('editDurationInput').value || '').trim();
        var breach = ($('breachInput').value || '').trim();
        ensureDraftFields();
        state.contract.duration = duration;
        state.contract.breach = breach;
        if (global.ContractStore.patchContract) {
            global.ContractStore.patchContract(state.workerId, {
                name: name,
                amount: amount,
                duration: duration,
                breach: breach,
                partyAName: state.contract.partyAName,
                partyAId: state.contract.partyAId,
                stages: state.contract.stages,
                extraClauses: state.contract.extraClauses,
                attachments: state.contract.attachments,
                templateText: state.contract.templateText,
                templateStage: state.contract.templateStage,
                contentIntro: state.contract.contentIntro,
                // 持久化意向乙方选择（仅落库，不发送邀约、不改变状态；submitInvite 时会被整体覆盖）
                invitations: state.editInvited.map(function (m) {
                    return { userId: m.userId, name: m.name, role: m.role, status: 'pending' };
                })
            });
        }
        showToast('已保存草稿内容');
    }

    // ============== 拟定中：可编辑合同内容（参考「合同详情（合规版）」） ==============
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; } }

    function defaultAttachments() {
        var tn = (state.contract && state.contract.typeName) || '服务合同';
        return [
            { name: tn + '.pdf', meta: '2.3MB · 2024-01-10上传' },
            { name: '量房照片.jpg', meta: '1.5MB · 2024-01-10上传' },
            { name: '材料清单.xlsx', meta: '156KB · 2024-01-12上传' },
            { name: '施工图纸.dwg', meta: '5.8MB · 2024-01-12上传' }
        ];
    }

    // 确保合同内容字段存在（草稿态在内存中初始化，提交时一并落库）
    function ensureDraftFields() {
        var c = state.contract;
        if (!c) return;
        if (!c.stages) c.stages = clone((STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).stages);
        if (c.extraClauses == null) c.extraClauses = '1. 乙方应严格按照施工图纸进行施工，如有变更需经甲方书面确认。\n2. 材料进场需经甲方或监理方验收合格后方可使用。\n3. 隐蔽工程验收合格后方可进行下一道工序。';
        if (!c.attachments) c.attachments = defaultAttachments();
        if (c.templateText == null) c.templateText = '';
        if (c.templateStage == null) c.templateStage = '';
        if (!c.contentIntro) c.contentIntro = (STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).contentIntro;
        if (c.duration == null || c.duration === '') c.duration = '30';
        if (c.breach == null || c.breach === '') c.breach = '1、甲方逾期付款的，按逾期金额千分之三/日支付违约金。\n2、乙方工期延误或质量不符的，应无偿返工并承担违约责任。';
        if (!c.partyAName) c.partyAName = '陈庄';
    }
    function getStages() { ensureDraftFields(); return state.contract.stages; }
    function getContentIntro() { ensureDraftFields(); return state.contract.contentIntro; }
    function getExtra() { ensureDraftFields(); return state.contract.extraClauses; }
    function getAttachments() { ensureDraftFields(); return state.contract.attachments; }
    function tradeWorkerOf(type) {
        var c = getContractTypeCandidates(type)[0];
        return c ? c.name : '施工方';
    }

    function renderDraftContent() {
        ensureDraftFields();
        renderDraftContractText();
        renderDraftStageTask();
        renderDraftAttachment();
        switchDraftContentTab(null, state.draftContentTab || 'contract-text');
    }

    function switchDraftContentTab(tabEl, key) {
        state.draftContentTab = key;
        var tabs = document.querySelectorAll('#draftContentWrap .content-tab');
        for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
        var map = { 'contract-text': 0, 'stage-task': 1, 'attachment': 2 };
        if (tabs[map[key]]) tabs[map[key]].classList.add('active');
        var panes = ['wcDraftContractText', 'wcDraftStageTask', 'wcDraftAttachment'];
        panes.forEach(function (pid, i) {
            var el = $(pid);
            if (el) el.classList.toggle('active', i === map[key]);
        });
        // 附件 Tab：隐藏「更换模板」按钮（附件不支持模板功能）
        var btn = $('draftTemplateBtn');
        if (btn) btn.style.display = (key === 'attachment') ? 'none' : '';
    }

    function renderDraftContractText() {
        var c = state.contract;
        var breach = $('breachInput');
        if (breach) breach.value = c.breach || '';
        var extra = $('editContractExtra');
        if (extra) extra.value = getExtra();
        var info = $('draftTemplateInfo');
        var tag = $('draftTemplateTag');
        if (info && tag) {
            if (c.templateText) { info.style.display = 'block'; tag.textContent = '已选择模板：' + c.templateText; }
            else { info.style.display = 'none'; }
        }
    }
    function updateDraftExtra(val) { if (state.contract) state.contract.extraClauses = val; }

    function renderDraftStageTask() {
        var c = state.contract;
        var stages = getStages();
        var html = stages.map(function (s, i) {
            var seqOn = (s.order === '顺序执行');
            var tasks = (s.tasks || []).map(function (t, j) {
                return '<div class="task-edit-item">' +
                    '<input class="task-input" value="' + escapeHtml(t.name) + '" placeholder="任务名称" oninput="WCP.updateDraftTaskName(' + i + ',' + j + ',this.value)" onclick="WCP.editTaskDetail(this,' + i + ',' + j + ')" readonly>' +
                    '<div class="task-action-btn edit" onclick="WCP.editTaskDetail(this,' + i + ',' + j + ')" title="编辑详情">✎</div>' +
                    '<div class="task-action-btn" onclick="WCP.deleteDraftTask(' + i + ',' + j + ')">×</div>' +
                    '</div>';
            }).join('');
            return '<div class="stage-card">' +
                '<div class="stage-card-header">' +
                '<div class="stage-card-header-row">' +
                '<input type="text" class="stage-name-input" value="' + escapeHtml(s.name) + '" placeholder="请输入阶段名称" oninput="WCP.updateDraftStageName(' + i + ',this.value)">' +
                '<div class="stage-sequential"><span>' + (seqOn ? '按序执行' : '并行执行') + '</span><div class="switch ' + (seqOn ? 'active' : '') + '" onclick="WCP.toggleDraftStageSeq(' + i + ',this)"></div></div>' +
                '</div>' +
                '<div class="stage-card-header-row"><div class="stage-actions">' +
                '<div class="stage-action-btn add" onclick="WCP.addDraftTask(' + i + ')">+ 添加任务</div>' +
                '<div class="stage-action-btn delete" onclick="WCP.deleteDraftStage(' + i + ')">× 删除阶段</div>' +
                '</div></div>' +
                '</div>' +
                '<div class="task-edit-list">' + tasks + '</div>' +
                '</div>';
        }).join('');
        var listEl = $('draftStageList');
        if (listEl) listEl.innerHTML = html;
        var info = $('draftStageInfo');
        var tag = $('draftStageTag');
        if (info && tag) {
            if (c.templateStage) { info.style.display = 'block'; tag.textContent = '已选择模板：' + c.templateStage; }
            else { info.style.display = 'none'; }
        }
    }
    function updateDraftTaskName(si, ti, val) { var s = state.contract.stages[si]; if (s && s.tasks[ti]) s.tasks[ti].name = val; }
    function updateDraftStageName(si, val) { if (state.contract.stages[si]) state.contract.stages[si].name = val; }
    function toggleDraftStageSeq(si, el) {
        var s = state.contract.stages[si]; if (!s) return;
        var on = el.classList.toggle('active');
        s.order = on ? '顺序执行' : '并行执行';
        var span = el.parentElement.querySelector('span');
        if (span) span.textContent = s.order;
    }
    function addDraftTask(si) {
        var s = state.contract.stages[si]; if (!s) return;
        s.tasks = s.tasks || [];
        var exec = state.editInvited.length === 1 ? state.editInvited[0].name : '';
        s.tasks.push({ name: '新任务', exec: exec, conf: '' });
        renderDraftStageTask();
    }
    function deleteDraftTask(si, ti) { var s = state.contract.stages[si]; if (!s) return; s.tasks.splice(ti, 1); renderDraftStageTask(); }
    function addDraftStage() {
        var exec = state.editInvited.length === 1 ? state.editInvited[0].name : '';
        state.contract.stages.push({ name: '新阶段', order: '顺序执行', tasks: [{ name: '新任务', exec: exec, conf: '' }] });
        renderDraftStageTask();
    }
    function deleteDraftStage(si) { state.contract.stages.splice(si, 1); renderDraftStageTask(); }

    function renderDraftAttachment() {
        var c = state.contract;
        var atts = getAttachments();
        var html = atts.map(function (a, i) {
            return '<div class="attachment-item">' +
                '<div class="file-icon">📄</div>' +
                '<div class="file-info"><div class="file-name">' + escapeHtml(a.name) + '</div><div class="file-size">' + escapeHtml(a.meta || '') + '</div></div>' +
                '<div class="delete-btn" onclick="WCP.removeDraftAttachment(' + i + ')">删除</div>' +
                '</div>';
        }).join('');
        var listEl = $('draftAttList');
        if (listEl) listEl.innerHTML = html;
    }
    function addDraftAttachment() { var inp = $('draftAttInput'); if (inp) inp.click(); }
    function onDraftAttPicked(e) {
        var f = e.target && e.target.files && e.target.files[0];
        if (!f) return;
        var sz = (f.size ? (f.size / 1024).toFixed(0) + 'KB' : '—');
        state.contract.attachments.push({ name: f.name, meta: sz + ' · 刚刚上传' });
        renderDraftAttachment();
        e.target.value = '';
    }
    function removeDraftAttachment(i) { state.contract.attachments.splice(i, 1); renderDraftAttachment(); }

    // ---- 更换模板（按当前内容 Tab 提供类型匹配模板） ----
    function draftBaseName() {
        var tn = (state.contract && state.contract.typeName) || '服务';
        return tn.replace('班组服务合同', '').replace('服务合同', '');
    }
    function getDraftTemplates(kind) {
        var b = draftBaseName();
        if (kind === 'text') return [
            { id: 'std', name: '标准' + b + '服务合同', desc: '含工程概况 / 价款 / 质量 / 违约等完整条款' },
            { id: 'lite', name: '精简' + b + '服务合同', desc: '核心条款精简版' }
        ];
        // stage
        return [
            { id: 'std', name: '标准' + b + '工程阶段', desc: '沿用本合同类型标准阶段模板' },
            { id: 'lite', name: '精简' + b + '工程阶段', desc: '仅保留核心阶段' }
        ];
    }
    function showDraftTemplatePicker() {
        var tab = state.draftContentTab || 'contract-text';
        if (tab === 'attachment') { showToast('附件区不支持更换模板，请直接上传或删除附件'); return; }
        var kind = tab === 'stage-task' ? 'stage' : 'text';
        openTemplatePicker(kind);
    }
    function openTemplatePicker(kind) {
        state.tplKind = kind;
        renderTemplatePickerList(kind);
        var m = $('wcTemplatePicker');
        if (m) m.classList.add('show');
    }
    function renderTemplatePickerList(kind) {
        var list = $('wcTplList');
        if (!list) return;
        var items = getDraftTemplates(kind);
        var titleMap = { text: '选择合同正文模板', stage: '选择阶段任务模板' };
        var t = $('wcTplTitle'); if (t) t.textContent = titleMap[kind] || '选择模板';
        var ft = $('wcTplFilterType'); if (ft) ft.textContent = (state.contract && state.contract.typeName) || '-';
        var emptyEl = $('wcTplEmpty'); if (emptyEl) emptyEl.style.display = items.length ? 'none' : 'block';
        var icon = kind === 'stage' ? '📝' : '📄';
        list.innerHTML = items.map(function (it) {
            return '<div class="template-select-item">' +
                '<div class="item-left"><div class="item-icon">' + icon + '</div></div>' +
                '<div class="item-content">' +
                    '<div class="item-name">' + escapeHtml(it.name) + '</div>' +
                    '<div class="item-desc">' + escapeHtml(it.desc) + '</div>' +
                '</div>' +
                '<div class="item-actions">' +
                    '<span class="action-btn secondary" onclick="WCP.previewDraftTemplate(\'' + kind + '\',\'' + it.id + '\')">预览</span>' +
                    '<span class="action-btn primary" onclick="WCP.applyTemplate(\'' + kind + '\',\'' + it.id + '\')">使用</span>' +
                '</div></div>';
        }).join('');
    }
    function applyTemplate(kind, id) {
        var c = state.contract;
        if (kind === 'text') {
            c.templateText = (getDraftTemplates('text').filter(function (x) { return x.id === id; })[0] || {}).name || '';
            if (id === 'lite') c.contentIntro = '工程内容：' + draftBaseName() + '相关作业（精简版）。';
        } else {
            var src = (STAGE_TEMPLATES[c.type] || STAGE_TEMPLATES.shuidian).stages;
            c.stages = id === 'lite' ? clone(src).slice(0, 2) : clone(src);
            c.templateStage = (getDraftTemplates('stage').filter(function (x) { return x.id === id; })[0] || {}).name || '';
        }
        closeTemplatePicker();
        renderDraftContent();
        showToast('已应用模板');
    }
    function closeTemplatePicker() { var m = $('wcTemplatePicker'); if (m) m.classList.remove('show'); }

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

    // 模板预览（对齐「合同详情（合规版）」更换模板的预览交互）
    var tplPreviewStages = null; // 阶段任务模板预览：缓存当前预览的阶段数据，供点击任务就地展开三项标准
    function previewDraftTemplate(kind, id) {
        var item = (getDraftTemplates(kind) || []).filter(function (x) { return x.id === id; })[0];
        if (!item) return;
        state.previewTplKind = kind;
        state.previewTplId = id;
        var titleEl = $('wcPreviewTitle'); if (titleEl) titleEl.textContent = item.name;
        var metaEl = $('wcPreviewMeta');
        if (metaEl) {
            var tn = (state.contract && state.contract.typeName) || '';
            if (kind === 'stage') {
                var src0 = STAGE_TEMPLATES[state.contract.type] || STAGE_TEMPLATES.shuidian;
                var sn = (id === 'lite') ? src0.stages.slice(0, 2).length : src0.stages.length;
                metaEl.innerHTML = '<div class="preview-meta-item"><span class="meta-label">类型：</span><span class="meta-value">' + escapeHtml(tn) + '</span></div>' +
                    '<div class="preview-meta-item"><span class="meta-label">阶段数：</span><span class="meta-value">' + sn + '</span></div>';
            } else {
                metaEl.innerHTML = '<div class="preview-meta-item"><span class="meta-label">类型：</span><span class="meta-value">' + escapeHtml(tn) + '</span></div>' +
                    '<div class="preview-meta-item"><span class="meta-label">模板：</span><span class="meta-value">' + escapeHtml(item.name) + '</span></div>';
            }
        }
        var contentEl = $('wcPreviewContent');
        if (contentEl) {
            var html = '';
            if (kind === 'stage') {
                var src = STAGE_TEMPLATES[state.contract.type] || STAGE_TEMPLATES.shuidian;
                var stages = (id === 'lite') ? src.stages.slice(0, 2) : src.stages;
                tplPreviewStages = stages;
                html += '<div class="preview-section"><div class="preview-section-title">阶段任务明细（' + stages.length + ' 个阶段）</div><div class="preview-stage-list">';
                stages.forEach(function (s, i) {
                    var tasks = (s.tasks || []).map(function (t, ti) {
                        var did = 'tplTask_' + i + '_' + ti, tid = 'tplTaskToggle_' + i + '_' + ti;
                        var std = function (lbl, val) {
                            return '<div style="margin-bottom:8px;"><span style="color:#1677ff;font-weight:600;">' + lbl + '：</span><span style="color:#333;">' + escapeHtml(val || '（未填写）') + '</span></div>';
                        };
                        return '<div style="margin:6px 0;">' +
                            '<div style="padding:10px 12px;background:#f7f9fc;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onclick="WCP.toggleTemplateTaskDetail(' + i + ',' + ti + ')">' +
                            '<span style="font-weight:600;color:#333;">' + escapeHtml(t.name) + '</span>' +
                            '<span id="' + tid + '" style="color:#1677ff;font-size:12px;flex-shrink:0;margin-left:10px;">查看标准 ›</span></div>' +
                            '<div id="' + did + '" style="display:none;padding:10px 14px 6px;background:#fff;border:1px solid #eef2f7;border-top:none;border-radius:0 0 8px 8px;">' +
                            std('执行标准', t.execStd) + std('确认标准', t.confStd) + std('担责标准', t.liableStd) +
                            '</div></div>';
                    }).join('');
                    html += '<div class="preview-stage-item"><div class="preview-stage-header"><span class="preview-stage-num">' + (i + 1) + '</span><span class="preview-stage-name">' + escapeHtml(s.name) + '</span><span class="preview-stage-order">' + escapeHtml(s.order || '') + '</span></div><div class="preview-task-list">' + tasks + '</div></div>';
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
        // 不隐藏选择弹窗：预览为选择弹窗的上层，关闭预览后选择弹窗自然透出（返回「更换模板」弹窗）
        var prev = $('wcTemplatePreview'); if (prev) prev.classList.add('show');
    }
    function applyTemplateFromPreview() {
        if (!state.previewTplKind) return;
        applyTemplate(state.previewTplKind, state.previewTplId);
        closeTemplatePreview();
    }
    function closeTemplatePreview() { var m = $('wcTemplatePreview'); if (m) m.classList.remove('show'); }

    // 阶段任务模板预览：点击任务项在预览浮窗内就地展开/收起 执行 / 确认 / 担责标准（手风琴，不新增浮窗层）
    function toggleTemplateTaskDetail(si, ti) {
        var detail = document.getElementById('tplTask_' + si + '_' + ti);
        var toggle = document.getElementById('tplTaskToggle_' + si + '_' + ti);
        if (!detail) return;
        var open = detail.style.display !== 'none';
        detail.style.display = open ? 'none' : 'block';
        if (toggle) toggle.textContent = open ? '查看标准 ›' : '收起 ‹';
    }

    // ---- 查看全文 / 预览合同 ----
    function showFullText() {
        var m = $('wcFullTextModal'); if (!m) return;
        $('wcFullTextTitle').textContent = '📄 合同正文（全文）';
        $('wcFullTextContent').innerHTML = (state.viewer === 'receiver') ? buildReceiverContractHTML() : buildContractBodyHTML();
        m.classList.add('show');
    }
    function closeFullText() { var m = $('wcFullTextModal'); if (m) m.classList.remove('show'); }
    function previewContract() {
        var m = $('wcFullTextModal'); if (!m) return;
        $('wcFullTextTitle').textContent = '👁️ 预览合同';
        $('wcFullTextContent').innerHTML = buildFullContractHTML();
        m.classList.add('show');
    }
    function buildContractBodyHTML() {
        var c = state.contract;
        var intro = getContentIntro();
        var amount = c.amount ? (c.amount + ' 元') : '—';
        return '<div class="contract-article"><div class="article-title">第一条 工程概况</div><div class="article-content">' +
            '<p>1.1 工程名称：' + escapeHtml(c.name) + '</p>' +
            '<p>1.2 工程地点：XX市XX区XX路XX号</p>' +
            '<p>1.3 工程内容：' + escapeHtml(intro) + '</p>' +
            '<p>1.4 承包方式：包工包料</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第二条 合同价款及支付方式</div><div class="article-content">' +
            '<p>2.1 合同总价：人民币 ' + escapeHtml(amount) + '（含税）。</p>' +
            '<p>2.2 支付方式：合同签订后支付预付款，材料进场验收合格后支付进度款，完工验收后支付尾款。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第三条 双方权利义务</div><div class="article-content">' +
            '<p>3.1 甲方（' + escapeHtml(c.partyAName || '陈庄') + '）应按约定支付工程款，并提供施工所需条件。</p>' +
            '<p>3.2 乙方应按标准施工，自确认加入后自动归入项目架构层级「' + escapeHtml(c.group || '—') + '」。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第四条 工程质量及验收</div><div class="article-content">' +
            '<p>4.1 乙方应严格按国家现行施工验收规范施工。</p>' +
            '<p>4.2 分阶段验收，隐蔽工程验收合格后方可进行下一道工序。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第五条 违约责任</div><div class="article-content">' +
            '<p>5.1 甲方逾期付款的，按逾期金额千分之三/日支付违约金。</p>' +
            '<p>5.2 乙方工期延误或质量不符的，应无偿返工并承担违约责任。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第六条 争议解决</div><div class="article-content">' +
            '<p>6.1 协商不成的，向工程所在地人民法院提起诉讼。</p></div></div>';
    }
    // 受邀方视角「查看全部正文」完整合同正文：关键条款（甲方责权 / 乙方责权）前置，再附标准条款
    function buildReceiverContractHTML() {
        var c = state.contract;
        var addr = c.projectAddress ? escapeHtml(c.projectAddress) : 'XX市XX区XX路XX号';
        var intro = getContentIntro();
        var amount = c.amount ? (c.amount + ' 元') : '—';
        return '<div class="contract-article"><div class="article-title">第一条 工程概况</div><div class="article-content">' +
            '<p>1.1 工程名称：' + escapeHtml(c.name) + '</p>' +
            '<p>1.2 工程地点：' + addr + '</p>' +
            '<p>1.3 工程内容：' + escapeHtml(intro) + '</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第二条 甲方责权</div><div class="article-content">' +
            '<p>2.1 甲方有权按照相关工艺及质量标准监督、指导乙方工作，并根据工作过程及完成情况给予奖励、处罚。</p>' +
            '<p>2.2 甲方应按照工程施工要求在乙方施工前进行相关培训及交底，包含但不限于《现场施工管理规定》、《施工工艺及验收标准》、图纸交底等。</p>' +
            '<p>2.3 甲方有责任按时为乙方提供满足工作需要的场地、材料、工具、安全措施等。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第三条 乙方责权</div><div class="article-content">' +
            '<p>3.1 乙方有权在约定的支付节点获得报酬。</p>' +
            '<p>3.2 当遇到现场、图纸冲突时，乙方应第一时间告知甲方进行协调。</p>' +
            '<p>3.3 乙方在工作中应自觉保护其他工种的劳动成果，不得擅自破坏。</p>' +
            '<p>3.4 乙方不得擅自把甲方提供的工具、材料拿出场外或使用到其他工地。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第四条 合同价款及支付方式</div><div class="article-content">' +
            '<p>4.1 合同总价：人民币 ' + escapeHtml(amount) + '（含税）。</p>' +
            '<p>4.2 支付方式：合同签订后支付预付款，材料进场验收合格后支付进度款，完工验收后支付尾款。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第五条 工程质量及验收</div><div class="article-content">' +
            '<p>5.1 乙方应严格按国家现行施工验收规范施工。</p>' +
            '<p>5.2 分阶段验收，隐蔽工程验收合格后方可进行下一道工序。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第六条 违约责任</div><div class="article-content">' +
            '<p>6.1 甲方逾期付款的，按逾期金额千分之三/日支付违约金。</p>' +
            '<p>6.2 乙方工期延误或质量不符的，应无偿返工并承担违约责任。</p></div></div>' +
            '<div class="contract-article"><div class="article-title">第七条 争议解决</div><div class="article-content">' +
            '<p>7.1 协商不成的，向工程所在地人民法院提起诉讼。</p></div></div>';
    }
    function buildFullContractHTML() {
        var c = state.contract;
        var body = buildContractBodyHTML();
        var extra = getExtra();
        var extraHtml = '<div class="contract-article"><div class="article-title">补充条款</div><div class="article-content">' +
            escapeHtml(extra).replace(/\n/g, '<br>') + '</div></div>';
        var stages = getStages();
        var stageHtml = stages.map(function (s) {
            var ts = (s.tasks || []).map(function (t) {
                return '<div style="margin-bottom:8px;"><p style="margin:0 0 4px;"><strong>' + escapeHtml(t.name) + '</strong>　<span style="font-weight:400;color:#86909C;">执行：' + escapeHtml(t.exec || '—') + '　确认：' + escapeHtml(t.conf || '—') + '</span></p>' +
                    '<p style="margin:0 0 2px;">执行标准：' + escapeHtml(t.execStd || '（未填写）') + '</p>' +
                    '<p style="margin:0 0 2px;">确认标准：' + escapeHtml(t.confStd || '（未填写）') + '</p>' +
                    '<p style="margin:0;">担责标准：' + escapeHtml(t.liableStd || '（未填写）') + '</p></div>';
            }).join('');
            return '<div class="contract-article"><div class="article-title">' + escapeHtml(s.name) + '（' + escapeHtml(s.order || '并行执行') + '）</div><div class="article-content">' + ts + '</div></div>';
        }).join('');
        var atts = getAttachments();
        var attHtml = atts.map(function (a) { return '<p>· ' + escapeHtml(a.name) + '（' + escapeHtml(a.meta || '') + '）</p>'; }).join('');
        var partyB = c.partyBName ? escapeHtml(c.partyBName) : '';
        var sign = '<div class="contract-article"><div class="article-title">签署信息</div><div class="article-content">' +
            '<p><strong>甲方（发包方）：</strong>' + escapeHtml(c.partyAName || '陈庄') + '</p>' +
            '<p><strong>乙方（承包方）：</strong>' + partyB + '</p></div></div>';
        return body + extraHtml + stageHtml + '<div class="contract-article"><div class="article-title">合同附件</div><div class="article-content">' + (attHtml || '<p>无</p>') + '</div></div>' + sign;
    }

    // ============== 原型导航：状态分组折叠 / 更多菜单 ==============
    function toggleStatusGroup(header) {
        var content = header.parentElement.querySelector('.status-group-content');
        var icon = header.querySelector('.status-group-icon');
        if (!content || !icon) return;
        var hidden = content.style.display === 'none';
        content.style.display = hidden ? 'block' : 'none';
        icon.textContent = hidden ? '▼' : '▶';
    }

    /* 右侧原型导航整块 收起 / 展开（不影响内部 status-group 各自展开态） */
    function togglePageNav() {
        var nav = document.querySelector('.page-nav');
        var btn = $('pageNavToggle');
        if (!nav) return;
        var collapsed = nav.classList.toggle('collapsed');
        if (btn) btn.classList.toggle('collapsed', collapsed);
    }

    function toggleMoreOps() {
        var p = $('moreOpsPanel');
        var b = $('moreOpsBtn');
        if (!p) return;
        p.classList.toggle('show');
        if (b) b.classList.toggle('open');
    }
    function closeMoreOps() {
        var p = $('moreOpsPanel');
        var b = $('moreOpsBtn');
        if (p) p.classList.remove('show');
        if (b) b.classList.remove('open');
    }

    // 更多菜单内容按状态动态生成：
    //   - 受邀方确认中（worker_inviting_receiver）：仅展示「导出合同文件」
    //   - 其余非终态状态：版本记录 / 变更记录 / 导出合同文件（对齐「合同详情（合规版）」）
    // 受邀方终态（抢单失败 / 已拒绝）由 updateStatus 直接隐藏整行工具栏，无需渲染菜单
    function renderMoreOps(status) {
        var panel = $('moreOpsPanel');
        if (!panel) return;
        var items;
        if (status === 'worker_inviting_receiver') {
            items = [
                { icon: '📄', label: '导出合同文件', fn: 'WCP.exportContract()' }
            ];
        } else {
            items = [
                { icon: '📋', label: '版本记录', fn: 'WCP.showVersionModal()' },
                { icon: '📜', label: '变更记录', fn: 'WCP.showChangeRecordModal()' },
                { icon: '📄', label: '导出合同文件', fn: 'WCP.exportContract()' }
            ];
        }
        panel.innerHTML = items.map(function (it) {
            return '<div class="op-item" onclick="' + it.fn + '; WCP.closeMoreOps();"><span class="op-icon">' + it.icon + '</span><span>' + escapeHtml(it.label) + '</span></div>';
        }).join('');
    }

    // ============== 版本 / 变更 / 导出弹窗（对齐「合同详情（合规版）」更多菜单） ==============
    function getVersionData() {
        var c = state.contract || {};
        var partyB = c.partyBName ? escapeHtml(c.partyBName) : '乙方';
        var base = function (extra) {
            return {
                versions: [{ tag: 'V1', name: '初始版本', desc: '首次签约版本', date: '2024-01-15 签约生效', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'primary' },
                    { title: '提交邀请', desc: '进入确认中', time: '2024-01-06 14:30', type: 'success' }
                ].concat(extra || [])
            };
        };
        return {
            'worker_draft_initial': base([]),
            'worker_draft': (function () {
                // 重新选择乙方属于「历史版本」记录（非变更），合并合同 versionLog 展示
                var log = (c.versionLog || []).slice().reverse();
                var versions = log.map(function (e, i) {
                    return { tag: 'R' + (i + 1), name: e.name, desc: e.desc, date: e.date || '', current: false };
                });
                versions.push({ tag: 'V1', name: '初始版本（拟定中·撤回后）', desc: '合同已重新编辑', date: '2024-01-09 重新拟定', current: true });
                var timeline = [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '提交邀请', desc: '进入确认中', time: '2024-01-06 14:30', type: 'success' },
                    { title: '撤回确认', desc: '合同退回拟定中', time: '2024-01-08 09:15', type: 'warning' },
                    { title: '重新编辑合同', desc: '拟定中', time: '2024-01-09 10:00', type: 'primary' }
                ];
                log.forEach(function (e) {
                    timeline.push({ title: '重新选择乙方', desc: '原乙方合作未达成，退回拟定中重新选择', time: e.date || '', type: 'warning' });
                });
                return { versions: versions, timeline: timeline };
            })(),
            'worker_inviting_sender': base([]),
            'worker_inviting_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '已收到邀请，待确认', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' }
                ]
            },
            'worker_confirmed_sender': base([
                { title: '乙方确认合同', desc: '确认人：' + partyB, time: '2024-01-08 16:20', type: 'success' }
            ]),
            'worker_confirmed_receiver': base([
                { title: '我方确认合同', desc: '确认人：' + partyB, time: '2024-01-08 16:20', type: 'success' }
            ]),
            'worker_signed': base([
                { title: '乙方确认合同', desc: '确认人：' + partyB, time: '2024-01-08 16:20', type: 'success' },
                { title: '上传签约文件', desc: '合同正式生效（V1版本）', time: '2024-01-10 15:30', type: 'success' }
            ]),
            'worker_lost_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '抢单失败', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' },
                    { title: '其他人员抢先确认', desc: '本邀约已结束', time: '2024-01-08 16:20', type: 'error' }
                ]
            },
            'worker_rejected_receiver': {
                versions: [{ tag: 'V1', name: '初始版本', desc: '已拒绝邀约', date: '2024-01-05 创建', current: true }],
                timeline: [
                    { title: '创建合同', desc: '拟定中', time: '2024-01-05 10:00', type: 'success' },
                    { title: '收到邀约', desc: '待我方确认', time: '2024-01-06 14:30', type: 'primary' },
                    { title: '已拒绝邀约', desc: '本邀约已结束', time: '2024-01-07 11:00', type: 'error' }
                ]
            },
            'default': base([])
        };
    }

    function updateVersionContent() {
        var versionList = $('versionList');
        var statusFlowTimeline = $('statusFlowTimeline');
        var versionData = getVersionData();
        var data = versionData[state.status] || versionData['default'];
        if (versionList) {
            versionList.innerHTML = data.versions.map(function (v) {
                return '<div class="version-item">' +
                    '<div class="version-tag ' + (v.current ? 'current' : '') + '">' + v.tag + '</div>' +
                    '<div class="version-info">' +
                    '<div class="version-name">' + escapeHtml(v.name) + '</div>' +
                    '<div class="version-desc">' + escapeHtml(v.desc) + '</div>' +
                    '<div class="version-date">' + escapeHtml(v.date) + '</div>' +
                    '</div>' +
                    '<div class="view-btn">查看</div>' +
                    '</div>';
            }).join('');
        }
        if (statusFlowTimeline) {
            statusFlowTimeline.innerHTML = data.timeline.map(function (t) {
                return '<div class="timeline-item">' +
                    '<div class="timeline-dot ' + (t.type || 'success') + '"></div>' +
                    '<div class="timeline-content">' +
                    '<div class="timeline-title">' + escapeHtml(t.title) + '</div>' +
                    '<div class="timeline-desc">' + escapeHtml(t.desc) + '</div>' +
                    '<div class="timeline-time">' + escapeHtml(t.time) + '</div>' +
                    '</div>' +
                    '</div>';
            }).join('');
        }
    }

    function showVersionModal() {
        updateVersionContent();
        var m = $('versionModal');
        if (m) m.classList.add('show');
    }
    function closeVersionModal() {
        var m = $('versionModal');
        if (m) m.classList.remove('show');
    }

    function showChangeRecordModal() {
        // 动态渲染本次操作留痕（从合同 changeLog 读取，反映重新选择乙方等实际操作）
        var logWrap = $('changeRecordLog');
        var logList = $('changeRecordLogList');
        if (logWrap && logList) {
            var log = (state.contract && state.contract.changeLog) || [];
            if (log.length) {
                logWrap.style.display = 'block';
                logList.innerHTML = log.slice().reverse().map(function (e) {
                    var dotCls = e.type === 'reselect' ? 'warning' : 'primary';
                    return '<div class="cr-log-item">' +
                        '<span class="cr-dot ' + dotCls + '"></span>' +
                        '<div class="cr-log-main">' +
                            '<div class="cr-log-title">' + escapeHtml(e.title) + '</div>' +
                            '<div class="cr-log-desc">' + escapeHtml(e.desc) + '</div>' +
                            '<div class="cr-log-meta">操作人：' + escapeHtml(e.by || '陈庄') +
                                (e.byRole ? '（' + escapeHtml(e.byRole) + '）' : '') + ' · ' + escapeHtml(e.time || '') + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            } else {
                logWrap.style.display = 'none';
            }
        }
        var m = $('changeRecordModal');
        if (m) m.classList.add('show');
    }
    function closeChangeRecordModal() {
        var m = $('changeRecordModal');
        if (m) m.classList.remove('show');
    }
    function viewChangeVersion(version) {
        closeChangeRecordModal();
        var names = { v0: '初始版本', v1: '第一次变更', v2: '第二次变更' };
        showToast('正在加载' + (names[version] || '该') + '合同详情...\n\n将展示该版本下的合同基本信息、合同正文、阶段任务、附件等内容');
    }

    function exportContract() {
        showExportModal();
    }
    function showExportModal() {
        var m = $('exportModal');
        if (m) m.classList.add('show');
    }
    function closeExportModal() {
        var m = $('exportModal');
        if (m) m.classList.remove('show');
    }
    function exportToPDF() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(function () {
            showToast('PDF文件已保存到手机本地\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 1500);
    }
    function shareToWechat() {
        closeExportModal();
        showToast('正在生成PDF文件...');
        setTimeout(function () {
            showToast('PDF文件已生成，正在打开微信分享...\n\n文件包含：合同基本信息、签约双方信息、合同正文、附件');
        }, 1500);
    }

    // ============== 任务详情/编辑弹窗 ==============
    // 任务名称 → 三标准映射（参考合同详情·合规版 TASK_STANDARD_MAP）
    var TASK_STANDARD_MAP = {
        '材料采购': { exec: '按设计图纸与合同清单采购符合国家标准的电线、线管等材料，并随货提供合格证与检测报告。', confirm: '材料品牌、规格、数量与合同约定一致，质量证明文件齐全方可签收。', liable: '因材料质量或规格不符导致返工、工期延误的，由采购执行方承担相应费用与责任。' },
        '材料报验': { exec: '整理材料质量证明文件，向监理/业主报验并提交样品。', confirm: '报验资料齐全，样品经确认人认可后准予使用。', liable: '未经报验擅自使用的，由执行方承担整改与返工责任。' },
        '开槽布管': { exec: '按深化图纸弹线定位，使用机械规范开槽并敷设线管，管卡固定牢固、弯曲半径合规，强弱电分管分盒。', confirm: '开槽位置、深度及线管规格、走向、间距符合图纸与规范要求。', liable: '因违规开槽或管线敷设不到位导致结构损伤、后期无法穿线或维修困难的，由施工执行方整改担责。' },
        '穿线接线': { exec: '按回路穿线，线色区分正确，预留足够接线长度，管内无接头；开关插座处接线牢固。', confirm: '导线规格、根数、绝缘电阻测试合格，接线符合安全规范。', liable: '因穿线或接线错误导致短路、跳闸的，由施工执行方承担责任。' },
        '通水通电测试': { exec: '完成水管打压测试与电气绝缘、通断测试，记录测试数据，确保无渗漏、无漏电。', confirm: '水管保压合格、电气绝缘电阻与接地测试达标，测试报告完整。', liable: '未测试或测试造假导致用水用电事故的，由执行与确认方共同担责。' },
        '阶段确认': { exec: '完成本阶段全部任务并自检合格，提交阶段成果与记录。', confirm: '相关确认人按节点对阶段成果进行核验并签字确认。', liable: '阶段内任务未达标即申请确认的，由执行方承担整改责任。' },
        '开关插座安装': { exec: '按图纸标高与间距安装，接线牢固、面板端正、接地可靠。', confirm: '安装位置、数量、接线符合设计与安全规范。', liable: '安装松动、接错线导致故障的，由施工执行方担责。' },
        '防护交底': { exec: '对施工区域进行成品防护，向班组进行安全与技术交底并签字记录。', confirm: '防护措施到位，交底记录齐全且签字确认。', liable: '因防护不到位或交底缺失造成成品损坏、安全事故的，由执行方承担责任。' },
        '墙体拆除': { exec: '按确认的拆除范围弹线定位，由上至下规范拆除，不得破坏承重结构与防水层。', confirm: '拆除范围、标高符合确认要求，承重结构完好。', liable: '超范围拆除或破坏承重结构的，由执行方承担修复与赔偿费用。' },
        '建筑垃圾清运': { exec: '将拆除垃圾分类装袋，合规清运至指定消纳场所，保持通道畅通。', confirm: '现场无遗留垃圾，清运记录完整。', liable: '因清运不及时或乱倒垃圾造成处罚的，由执行方承担责任。' },
        '现场平整': { exec: '对拆除后的墙面、地面进行清理平整，达到后续施工条件。', confirm: '基层平整度符合后续工序施工要求。', liable: '平整不到位影响后续工序质量的，由执行方整改担责。' },
        '现场测量': { exec: '按设计图纸到现场进行尺寸复核，记录实际尺寸并标注关键节点。', confirm: '测量数据准确，与图纸偏差在允许范围内。', liable: '测量误差导致材料浪费或安装不当的，由执行方承担责任。' },
        '深化图纸': { exec: '根据现场实测数据深化施工图纸，明确节点做法与材料用量。', confirm: '深化图纸经确认人审核签字后方可施工。', liable: '图纸深化错误导致返工的，由执行方承担相应费用。' },
        '基层制作': { exec: '按图纸制作木作基层骨架，龙骨间距合规，连接牢固、防潮处理到位。', confirm: '基层平整度、牢固度与防潮处理符合规范。', liable: '基层制作不达标导致面层变形或开裂的，由执行方返工担责。' },
        '柜体安装': { exec: '按深化图纸组装柜体，水平垂直调整到位，连接牢固、缝隙均匀。', confirm: '柜体安装位置、垂直度、缝隙符合验收标准。', liable: '安装不牢或偏差超标导致使用异常的，由执行方调整担责。' },
        '五金安装': { exec: '按设计要求安装五金配件，位置准确、开合灵活、固定牢固。', confirm: '五金品牌、数量、功能符合设计要求，开合测试合格。', liable: '五金安装不到位导致损坏或使用不便的，由执行方更换担责。' },
        '地面找平': { exec: '按标高线进行地面水泥砂浆找平，坡度符合排水要求，无空鼓开裂。', confirm: '找平层平整度、坡度符合规范，无空鼓开裂。', liable: '找平层空鼓、开裂影响后续铺设的，由执行方返工担责。' },
        '防水施工': { exec: '对厨卫等区域涂刷防水涂料，厚度均匀、边角圆弧处理，完成后做闭水试验。', confirm: '防水层厚度达标，闭水试验24小时无渗漏。', liable: '防水施工不到位导致渗漏的，由执行方承担返工与赔偿费用。' },
        '墙砖铺贴': { exec: '按排砖图铺贴墙砖，缝隙均匀、平整度合规，阴阳角方正。', confirm: '铺贴平整、缝隙均匀、无空鼓，阴阳角符合规范。', liable: '铺贴空鼓、脱落或不平整超标的，由执行方返工担责。' },
        '地砖铺贴': { exec: '按排砖图铺贴地砖，坡度朝向地漏，平整度与缝差符合规范。', confirm: '地砖铺贴平整、缝差合规、无空鼓，排水通畅。', liable: '铺贴空鼓、坡度倒泛水导致积水的，由执行方返工担责。' },
        '美缝清理': { exec: '清理砖缝后均匀填入美缝剂，表面平整、无气泡与余料。', confirm: '美缝饱满、色泽均匀、无脱落。', liable: '美缝施工不到位导致发黑脱落的，由执行方返工担责。' },
        '墙面铲除': { exec: '铲除原墙面腻子与涂料至基层，清理灰尘保证附着力。', confirm: '基层清理干净，无残留腻子与涂料。', liable: '铲除不彻底导致后续腻子起皮的，由执行方返工担责。' },
        '批刮腻子': { exec: '按规范批刮腻子两至三遍，每遍干透后打磨，阴阳角顺直。', confirm: '腻层平整、无裂纹、阴阳角顺直，打磨后无明显划痕。', liable: '腻子层开裂、脱落影响面漆效果的，由执行方返工担责。' },
        '打磨': { exec: '使用砂纸或打磨机对腻子层进行均匀打磨，确保平整无划痕。', confirm: '打磨后平整度符合面漆施工要求，无明显划痕。', liable: '打磨不平或划痕过深影响面漆效果的，由执行方整改担责。' },
        '底漆': { exec: '按规范滚涂底漆一遍，涂刷均匀无漏底，待干透后进行面漆施工。', confirm: '底漆涂刷均匀、无漏底、无流坠。', liable: '底漆漏涂导致面漆色差或泛碱的，由执行方返工担责。' },
        '面漆涂刷': { exec: '按设计颜色滚涂面漆两遍，涂刷均匀、无流坠、无色差。', confirm: '面漆色泽均匀、无流坠、无色差，符合验收标准。', liable: '面漆色差、流坠或起皮影响观感的，由执行方返工担责。' },
        '清理保护': { exec: '施工完成后清理现场，对成品进行保护，避免后续工序污染。', confirm: '现场清理干净，成品保护到位。', liable: '保护不到位造成成品损坏的，由执行方承担责任。' },
        '工具进场': { exec: '按施工计划将工具与辅材运抵现场，清点登记并妥善放置。', confirm: '工具辅材清单齐全，放置规范。', liable: '工具遗漏或放置不当影响施工进度的，由执行方承担责任。' },
        '安全防护': { exec: '对施工区域进行安全围护，配备消防器材，做好高空与用电防护。', confirm: '安全防护措施到位，符合现场管理要求。', liable: '安全防护不到位造成事故的，由执行方承担责任。' },
        '零星安装': { exec: '按业主需求完成零星安装件，尺寸合适、固定牢固。', confirm: '安装位置、牢固度符合使用要求。', liable: '安装不牢或尺寸错误导致返工的，由执行方担责。' },
        '修补作业': { exec: '对前期施工遗留的瑕疵进行修补，恢复至交付标准。', confirm: '修补部位与原面层无明显色差、平整一致。', liable: '修补不到位影响整体观感的，由执行方重新修补担责。' }
    };
    var GENERIC_STD = {
        exec: '按合同约定及国家/行业相关施工规范执行，过程中做好自检与记录。',
        confirm: '由相关确认人按合同约定的标准进行核验并签字确认。',
        liable: '因执行或确认不到位造成质量、安全、工期问题的，由责任方承担相应责任。'
    };
    // 已签约状态：点击任务跳转任务详情页（对应任务状态：已履约完成→已完成，否则→待开始）
    function goTaskDetail() {
        var taskStatus = state.fulfilled ? 'completed' : 'pending';
        window.location.href = 'task-detail.html?status=' + taskStatus;
    }
    // 只读任务详情弹窗（参考合同详情·合规版 viewTaskDetail）
    function viewTaskDetail(el) {
        var item = el.closest('.task-item') || el;
        var name = item.getAttribute('data-task-name') || '—';
        var executor = item.getAttribute('data-executor') || '暂未设置';
        var confirmers = item.getAttribute('data-confirmers') || '暂未设置';

        // 三标准：优先取 data 属性 → 任务名映射 → 通用兜底（保证均有值）
        var stdMap = TASK_STANDARD_MAP[name] || {};
        var execStd = item.getAttribute('data-exec-standard') || stdMap.exec || GENERIC_STD.exec;
        var confStd = item.getAttribute('data-confirm-standard') || stdMap.confirm || GENERIC_STD.confirm;
        var liableStd = item.getAttribute('data-liable-standard') || stdMap.liable || GENERIC_STD.liable;

        var m = $('taskDetailModal');
        if (!m) return;
        $('detailTaskName').textContent = name;
        $('detailExecutor').textContent = executor;
        $('detailConfirmers').textContent = confirmers;
        $('detailExecStandard').textContent = execStd;
        $('detailConfirmStandard').textContent = confStd;
        $('detailLiableStandard').textContent = liableStd;
        m.classList.add('show');
    }
    function closeTaskDetailModal() {
        var m = $('taskDetailModal');
        if (m) m.classList.remove('show');
    }

    // 编辑任务弹窗（参考合同详情·合规版 editTaskDetail）
    var ROLE_MAP = {
        '陈庄': '工长', '张水电': '水电工', '钱拆除': '拆除工',
        '李木作': '木作工', '周泥瓦': '泥瓦工', '吴油漆': '油漆工', '郑零工': '小零工'
    };
    // 合同乙方名单（用于编辑任务时执行人默认值推导）：已确认/已签约取 partyBName（唯一），
    // 拟定/邀请中取意向乙方名单（1~3 人）。
    function getPartyBList() {
        var c = state.contract;
        if (!c) return [];
        if (c.partyBName) return [c.partyBName];
        var invs = c.invitations || state.editInvited || [];
        return invs.map(function (i) { return i.name; });
    }
    // 乙方确认接单→已签约时，将「无执行人」的任务执行人统一更新为乙方人员（PRD 规则）。
    function assignDefaultExecutorsOnSigned() {
        var c = state.contract;
        if (!c || !c.partyBName) return;
        var stages = getStages();
        if (!stages || !stages.length) return;
        var changed = false;
        stages.forEach(function (s) {
            (s.tasks || []).forEach(function (t) {
                if (!t.exec) { t.exec = c.partyBName; changed = true; }
            });
        });
        if (changed && typeof renderDraftStageTask === 'function') renderDraftStageTask();
    }
    function editTaskDetail(el, stageIdx, taskIdx) {
        var stages = getStages();
        var s = stages[stageIdx];
        var t = s && s.tasks ? s.tasks[taskIdx] : null;
        if (!t) return;

        state.currentEditTask = { stageIdx: stageIdx, taskIdx: taskIdx };

        var name = t.name || '';
        var executor = t.exec || '';
        // 执行人默认值：合同乙方仅一人时，无执行人的任务默认填乙方人员；多乙方则为空（非必选）
        if (!executor) {
            var pbList = getPartyBList();
            if (pbList.length === 1) executor = pbList[0];
        }
        var confirmerStr = t.conf || '';
        var confirmerArr = confirmerStr ? confirmerStr.split(/[、,，]/).map(function(s){return s.trim();}).filter(Boolean) : [];
        var execStd = t.execStd || '';
        var confStd = t.confStd || '';
        var liableStd = t.liableStd || '';

        $('editTaskName').value = name;

        // 执行人：填充标签 + 隐藏值
        var execTags = $('editTaskExecutorTags');
        if (executor && ROLE_MAP[executor]) {
            execTags.innerHTML = '<div class="confirm-person-tag">' + executor + '（' + ROLE_MAP[executor] + '）' +
                '<span class="remove" onclick="WCP.removeExecutor(\'edit\')">×</span></div>';
        } else if (executor) {
            execTags.innerHTML = '<div class="confirm-person-tag">' + executor +
                '<span class="remove" onclick="WCP.removeExecutor(\'edit\')">×</span></div>';
        } else {
            execTags.innerHTML = '';
        }
        $('editTaskExecutor').value = executor;
        $('editTaskExecutorSearch').value = '';
        $('editTaskExecutorDropdown').classList.remove('show');

        // 确认人：填充标签列表
        state.editTaskConfirmPersonList = confirmerArr;
        updateEditConfirmPersonTags();
        $('editTaskConfirmerSearch').value = '';
        $('editTaskConfirmerDropdown').classList.remove('show');

        // 三项标准
        $('editTaskExecStandard').value = execStd;
        $('editTaskConfirmStandard').value = confStd;
        $('editTaskLiableStandard').value = liableStd;

        $('editTaskModal').classList.add('show');
    }
    function closeEditTaskModal() {
        var m = $('editTaskModal');
        if (m) m.classList.remove('show');
        $('editTaskExecutorTags').innerHTML = '';
        $('editTaskExecutorDropdown').classList.remove('show');
        $('editTaskConfirmerDropdown').classList.remove('show');
        state.editTaskConfirmPersonList = [];
        state.currentEditTask = null;
    }
    function confirmEditTask() {
        if (!state.currentEditTask) { closeEditTaskModal(); return; }
        var si = state.currentEditTask.stageIdx;
        var ti = state.currentEditTask.taskIdx;
        var stages = getStages();
        var t = stages[si] && stages[si].tasks ? stages[si].tasks[ti] : null;
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
        var confirmers = state.editTaskConfirmPersonList || [];

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

    // 执行人搜索下拉（参考合规版交互）
    function toggleExecutorSearch(prefix) {
        var dd = $(prefix + 'TaskExecutorDropdown');
        if (!dd) return;
        dd.classList.toggle('show');
    }
    function filterExecutorList(prefix) {
        var kw = ($(prefix + 'TaskExecutorSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskExecutorDropdown');
        if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function(opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = name.indexOf(kw) >= 0 ? '' : 'none';
        });
        dd.classList.add('show');
    }
    function selectExecutor(prefix, name, role) {
        var tags = $(prefix + 'TaskExecutorTags');
        tags.innerHTML = '<div class="confirm-person-tag">' + name + '（' + role + '）' +
            '<span class="remove" onclick="WCP.removeExecutor(\'' + prefix + '\')">×</span></div>';
        $(prefix + 'TaskExecutor').value = name;
        $(prefix + 'TaskExecutorSearch').value = '';
        $(prefix + 'TaskExecutorDropdown').classList.remove('show');
    }
    function removeExecutor(prefix) {
        $(prefix + 'TaskExecutorTags').innerHTML = '';
        $(prefix + 'TaskExecutor').value = '';
    }

    // 确认人搜索下拉（多选）
    function toggleConfirmerSearch(prefix) {
        var dd = $(prefix + 'TaskConfirmerDropdown');
        if (!dd) return;
        dd.classList.toggle('show');
    }
    function filterConfirmerList(prefix) {
        var kw = ($(prefix + 'TaskConfirmerSearch').value || '').trim().toLowerCase();
        var dd = $(prefix + 'TaskConfirmerDropdown');
        if (!dd) return;
        dd.querySelectorAll('.person-option').forEach(function(opt) {
            var name = opt.querySelector('.name').textContent.toLowerCase();
            opt.style.display = name.indexOf(kw) >= 0 ? '' : 'none';
        });
        dd.classList.add('show');
    }
    function selectConfirmer(prefix, name, role) {
        if (!state.editTaskConfirmPersonList) state.editTaskConfirmPersonList = [];
        if (state.editTaskConfirmPersonList.length >= 5) { showToast('确认人最多5人'); return; }
        if (state.editTaskConfirmPersonList.indexOf(name) >= 0) { showToast('已添加'); return; }
        state.editTaskConfirmPersonList.push(name);
        updateEditConfirmPersonTags();
        $(prefix + 'TaskConfirmerSearch').value = '';
        $(prefix + 'TaskConfirmerDropdown').classList.remove('show');
    }
    function removeConfirmer(index) {
        if (!state.editTaskConfirmPersonList) return;
        state.editTaskConfirmPersonList.splice(index, 1);
        updateEditConfirmPersonTags();
    }
    function updateEditConfirmPersonTags() {
        var tags = $('editTaskConfirmPersons');
        if (!tags) return;
        var list = state.editTaskConfirmPersonList || [];
        if (list.length === 0) {
            tags.innerHTML = '';
            return;
        }
        tags.innerHTML = list.map(function(name, i) {
            var role = ROLE_MAP[name] || '施工方';
            return '<div class="confirm-person-tag">' + name + '（' + role + '）' +
                '<span class="remove" onclick="WCP.removeConfirmer(' + i + ')">×</span></div>';
        }).join('');
    }

    // 全局暴露（供 HTML onclick 调用）
    global.WCP = {
        init: init,
        updateStatus: updateStatus,
        demoFulfilled: demoFulfilled,
        toggleStatusGroup: toggleStatusGroup,
        togglePageNav: togglePageNav,
        toggleEditPanel: toggleEditPanel,
        filterEdit: filterEdit,
        saveAndResubmit: saveAndResubmit,
        showToast: showToast,
        closeConfirm: closeConfirm,
        runConfirm: runConfirm,
        pickSignFile: pickSignFile,
        onSignFilePicked: onSignFilePicked,
        switchSection: switchSection,
        toggleStage: toggleStage,
        createDemo: createDemo,
        resetDemo: resetDemo,
        toggleMoreOps: toggleMoreOps,
        closeMoreOps: closeMoreOps,
        showVersionModal: showVersionModal,
        closeVersionModal: closeVersionModal,
        showChangeRecordModal: showChangeRecordModal,
        closeChangeRecordModal: closeChangeRecordModal,
        viewChangeVersion: viewChangeVersion,
        exportContract: exportContract,
        showExportModal: showExportModal,
        closeExportModal: closeExportModal,
        exportToPDF: exportToPDF,
        shareToWechat: shareToWechat,
        callPartyA: callPartyA,
        openRejectReason: openRejectReason,
        closeRejectReason: closeRejectReason,
        submitRejectReason: submitRejectReason,
        openReselectConfirm: openReselectConfirm,
        closeReselectConfirm: closeReselectConfirm,
        confirmReselect: confirmReselect,
        cancelReselect: cancelReselect,
        confirmStartChange: confirmStartChange,
        goChangePage: goChangePage,
        openBusinessCard: openBusinessCard,
        closeBusinessCard: closeBusinessCard,
        switchDraftContentTab: switchDraftContentTab,
        updateDraftExtra: updateDraftExtra,
        updateDraftTaskName: updateDraftTaskName,
        updateDraftStageName: updateDraftStageName,
        toggleDraftStageSeq: toggleDraftStageSeq,
        addDraftTask: addDraftTask,
        deleteDraftTask: deleteDraftTask,
        addDraftStage: addDraftStage,
        deleteDraftStage: deleteDraftStage,
        addDraftAttachment: addDraftAttachment,
        onDraftAttPicked: onDraftAttPicked,
        removeDraftAttachment: removeDraftAttachment,
        showDraftTemplatePicker: showDraftTemplatePicker,
        applyTemplate: applyTemplate,
        closeTemplatePicker: closeTemplatePicker,
        previewDraftTemplate: previewDraftTemplate,
        applyTemplateFromPreview: applyTemplateFromPreview,
        closeTemplatePreview: closeTemplatePreview,
        toggleTemplateTaskDetail: toggleTemplateTaskDetail,
        togglePartyAPanel: togglePartyAPanel,
        filterPartyA: filterPartyA,
        selectPartyA: selectPartyA,
        renderPartyAChips: renderPartyAChips,
        showFullText: showFullText,
        closeFullText: closeFullText,
        previewContract: previewContract,
        goTaskDetail: goTaskDetail,
        viewTaskDetail: viewTaskDetail,
        closeTaskDetailModal: closeTaskDetailModal,
        editTaskDetail: editTaskDetail,
        closeEditTaskModal: closeEditTaskModal,
        confirmEditTask: confirmEditTask,
        toggleExecutorSearch: toggleExecutorSearch,
        filterExecutorList: filterExecutorList,
        selectExecutor: selectExecutor,
        removeExecutor: removeExecutor,
        toggleConfirmerSearch: toggleConfirmerSearch,
        filterConfirmerList: filterConfirmerList,
        selectConfirmer: selectConfirmer,
        removeConfirmer: removeConfirmer,
        updateEditConfirmPersonTags: updateEditConfirmPersonTags
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
