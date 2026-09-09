# -*- coding: utf-8 -*-
"""把 architecture-multi-contract-demo.html 新增的「复制发起 / 一工作组多合同」
功能同步回 architecture.html；排除演示页专有内容（标题、demo-stage/demo-note）。
每处替换强制断言命中次数，未命中立即报错。"""

import io, re, sys

SRC = "D:/TraeProject/LZJPro/LZJBC-XH/service-miniapp/architecture.html"
s = io.open(SRC, encoding="utf-8").read()
orig_len = len(s)
log = []


def rep(old, new, name, expect=1):
    global s
    n = s.count(old)
    if n != expect:
        raise SystemExit("ASSERT FAIL [%s]: expected %d occurrence(s), got %d" % (name, expect, n))
    s = s.replace(old, new)
    log.append("OK  %-34s (%d)" % (name, n))


def re_rep(pattern, new, name, flags=re.S):
    global s
    pat = re.compile(pattern, flags)
    m = pat.search(s)
    if not m:
        raise SystemExit("ASSERT FAIL [%s]: regex not matched" % name)
    s = pat.sub(lambda _: new, s, count=1)
    log.append("OK  %-34s (regex)" % name)


# ============ R1 查看合同条目溢出修复 ============
rep("""        .contract-item .info {
            flex: 1;
        }""",
    """        .contract-item {
            overflow: hidden;
        }

        .contract-item .info {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }""",
    "R1 contract-item overflow")

# ============ R2 新增样式：列表聚合行 / 紧凑行 / 弹窗加宽 / 隐藏滚动条 ============
NEW_CSS = """        /* ===== 一工作组多合同：查看合同列表化 + 按份复制发起 ===== */
        .contract-aggregate {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            padding: 8px 10px;
            margin-bottom: 8px;
            background-color: #F0F7FF;
            border-radius: 8px;
            font-size: 11px;
            color: #1677FF;
        }
        .contract-aggregate .ca-hint {
            font-size: 11px;
            color: #69A6FF;
            white-space: normal;
            line-height: 1.5;
        }
        /* 查看合同弹窗紧凑排版：第一行=名称+复制按钮，第二行=状态/乙方/进度，均单行省略 */
        .contract-item .ci-row1 {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }
        .contract-item .ci-row1 .name {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .contract-item .ci-row1 .ci-copy {
            flex-shrink: 0;
        }
        .contract-item .status {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .contract-item .ci-copy {
            flex-shrink: 0;
            padding: 3px 7px;
            border-radius: 12px;
            background-color: #1677FF;
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
        }

        /* 查看合同弹窗：适当加宽以容纳合同名+复制按钮，同时不超手机屏 */
        #contractModal .modal-box {
            width: 310px;
            max-width: calc(100% - 32px);
        }

        /* 查看合同弹窗滚动区：符合小程序规范隐藏滚动条（滚动能力保留） */
        #contractModal .modal-content {
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        #contractModal .modal-content::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
        }

"""
rep("        .permission-notice {", NEW_CSS + "        .permission-notice {", "R2 new CSS block")

# ============ R3 头部新增「N 份合同」统计 ============
rep("""                    <div class="stat-item-inline">
                        <span class="num">24</span>
                        <span>位成员</span>
                    </div>
                </div>""",
    """                    <div class="stat-item-inline">
                        <span class="num">24</span>
                        <span>位成员</span>
                    </div>
                    <div class="stat-item-inline">
                        <span class="num" id="headerContractCount">3</span>
                        <span>份合同</span>
                    </div>
                </div>""",
    "R3 header contract count")

# ============ R4/R5 节点徽标显示合同份数 ============
rep('<div class="node-name">水电工作组 <span class="contract-status-badge has-contract">已签约</span></div>',
    '<div class="node-name">水电工作组 <span class="contract-status-badge has-contract">已签约 · 1份合同</span></div>',
    "R4 水电工作组 badge")

rep('<div class="node-name">泥瓦工作组 <span class="contract-status-badge has-contract">已签约</span></div>',
    '<div class="node-name">泥瓦工作组 <span class="contract-status-badge has-contract">已签约 · 2份合同</span></div>',
    "R5 泥瓦工作组 badge")

# ============ R6 查看合同弹窗列表紧凑化 ============
rep('<div id="contractList" style="padding: 12px 16px;">',
    '<div id="contractList" style="padding: 10px 12px;">',
    "R6 contractList padding")

# ============ R7 数据模型：组名 -> 合同数组 + 适配工具 ============
rep("""        const groupContracts = {
            '水电工作组': { name: '水电分包合同', status: '已签约', id: 'contract-1' },
            '泥瓦工作组': { name: '泥瓦分包合同', status: '已签约', id: 'contract-4' },
            '木工工作组': null,
            '油漆工作组': null
        };""",
    """        // 一个工作组可存在多份合同：组名 → 合同数组（原为单对象）
        const groupContracts = {
            '水电工作组': [
                { name: '水电分包合同', status: '已签约', id: 'contract-1', meta: '乙方：张水电 · V1' }
            ],
            '泥瓦工作组': [
                { name: '泥瓦班组服务合同-张建国', status: '已签约', id: 'contract-4', meta: '乙方：张建国 · 已履约 80%' },
                { name: '泥瓦班组服务合同-李守田', status: '确认中', id: 'contract-5', meta: '乙方：李守田 · 待乙方确认' }
            ],
            '木工工作组': [],
            '油漆工作组': []
        };

        // 数组适配工具
        function contractsOf(groupName) { return groupContracts[groupName] || []; }
        function hasSignedContract(groupName) { return contractsOf(groupName).some(c => c.status === '已签约'); }""",
    "R7 groupContracts arrays + helpers")

# ============ R8 退出工作组守卫 ============
rep("""            const contract = groupContracts[groupName];
            if (contract && contract.status === '已签约') {
                return { canExit: false, reason: '该工作组已签订合同，无法退出' };""",
    """            if (hasSignedContract(groupName)) {
                return { canExit: false, reason: '该工作组已签订合同，无法退出' };""",
    "R8 checkCanExitGroup guard")

# ============ R9 退出项目部守卫 ============
rep("""                const contract = groupContracts[groupName];
                if (contract && contract.status === '已签约') {
                    return { canExit: false, reason: `您加入的"${groupName}"已签订合同，无法退出项目部` };""",
    """                if (hasSignedContract(groupName)) {
                    return { canExit: false, reason: `您加入的"${groupName}"已签订合同，无法退出项目部` };""",
    "R9 checkCanExitProject guard")

# ============ R10 无合同不得添加施工组（保留原规则，改数组口径） ============
rep("""                const contract = groupContracts[parentName];
                if (!contract) {""",
    """                // 原有规则保留：工作组尚未创建合同时，不能添加施工组（子级架构）
                if (!contractsOf(parentName).length) {""",
    "R10 showCreateModal level2 guard")

# ============ R11 删除工作组守卫 ============
rep("""            if (groupContracts[name]) {
                showAppModal('提示', '该工作组已创建合同，无法删除。如需删除请先删除合同。', null, false);""",
    """            if (contractsOf(name).length) {
                showAppModal('提示', '该工作组已创建合同，无法删除。如需删除请先删除合同。', null, false);""",
    "R11 showDeleteModal guard")

# ============ R12 viewContract：列表化 + 按份「复制发起」 ============
VIEW_CONTRACT = """        function viewContract(nodeName) {
            const list = contractsOf(nodeName);
            const contractList = document.getElementById('contractList');

            if (!list.length) {
                contractList.innerHTML = '<div style="text-align: center; color: var(--text-tertiary); padding: 20px;">暂无关联合同</div>';
            } else {
                const signedCount = list.filter(c => c.status === '已签约').length;
                // 聚合行仅保留统计；「复制发起」为按份操作：每份合同行内各自带复制按钮，蓝本=该份合同
                const aggregate =
                    '<div class="contract-aggregate">' +
                        '<span>共 ' + list.length + ' 份 · 已签约 ' + signedCount + ' 份</span>' +
                        '<span class="ca-hint">复制发起以所选份为蓝本</span>' +
                    '</div>';
                // 紧凑排版：第一行=名称(单行省略)+复制按钮；第二行=状态/乙方/进度(单行省略)
                contractList.innerHTML = aggregate + list.map(c => `
                    <div class="contract-item" onclick="goToContract('${c.id}')">
                        <div class="icon">📄</div>
                        <div class="info">
                            <div class="ci-row1">
                                <div class="name">${escapeHtml(c.name)}</div>
                                <div class="ci-copy" onclick="event.stopPropagation(); copyContract('${nodeName}', '${c.id}')">📋 复制发起</div>
                            </div>
                            <div class="status">状态：${escapeHtml(c.status)}${c.meta ? ' · ' + escapeHtml(c.meta) : ''}</div>
                        </div>
                        <div class="arrow">›</div>
                    </div>
                `).join('');
            }

            document.getElementById('contractModal').classList.add('show');
        }
"""
re_rep(r"        function viewContract\(nodeName\) \{.*?\n        \}\n", VIEW_CONTRACT, "R12 viewContract rewrite")

# ============ R13 goCreateContract：不再阻断，改「复制发起/空白新建」选择 ============
GO_CREATE = """        function goCreateContract(groupName) {
            if (!hasCreatePermission) {
                showAppModal('提示', '您没有创建合同的权限', null, false);
                return;
            }
            // 已有合同时不再阻断：提供「复制发起（推荐）/ 空白新建」选择
            if (contractsOf(groupName).length) {
                const list = contractsOf(groupName);
                const latestSigned = [...list].reverse().find(c => c.status === '已签约') || list[0];
                showAppModal('创建方式', '该工作组已存在 ' + list.length + ' 份同类型合同。为减少重复填写，推荐「复制发起」——默认以最新已签约的「' + latestSigned.name + '」为蓝本（也可在「查看合同」中选择任意一份为蓝本）；或选择「空白新建」从零创建。', function () {
                    copyContract(groupName, latestSigned.id);
                });
                // 覆写确认按钮文案为「复制发起（推荐）」，并将取消项改为「空白新建」；关闭时复位按钮，避免影响其他弹窗
                document.getElementById('appModalCancel').textContent = '空白新建';
                document.getElementById('appModalConfirm').textContent = '复制发起（推荐）';
                document.getElementById('appModalCancel').onclick = function () {
                    closeAppModal();
                    resetCreateChoiceButtons();
                    location.href = 'create-contract.html?group=' + encodeURIComponent(groupName);
                };
                document.getElementById('appModalConfirm').onclick = function () {
                    closeAppModal();
                    resetCreateChoiceButtons();
                    copyContract(groupName, latestSigned.id);
                };
                return;
            }
            location.href = 'create-contract.html?group=' + encodeURIComponent(groupName);
        }

        // 复位「创建方式」弹窗覆写的按钮（默认文案 + 默认关闭行为）
        function resetCreateChoiceButtons() {
            const cancelBtn = document.getElementById('appModalCancel');
            cancelBtn.textContent = '取消';
            cancelBtn.onclick = function () { closeAppModal(); };
        }

        // 复制发起（按份）：蓝本=指定合同，沿用其类型/文本/阶段/金额/工期/条款/附件（均可改），跳转复制发起页
        function copyContract(groupName, contractId) {
            if (!hasCreatePermission) {
                showAppModal('提示', '您没有创建合同的权限', null, false);
                return;
            }
            location.href = 'contract-copy-initiate.html?group=' + encodeURIComponent(groupName) +
                (contractId ? '&source=' + encodeURIComponent(contractId) : '') + '&from=architecture';
        }
"""
re_rep(r"        function goCreateContract\(groupName\) \{.*?\n        \}\n", GO_CREATE, "R13 goCreateContract rewrite")

io.open(SRC, "w", encoding="utf-8", newline="").write(s)

print("\n".join(log))
print("---")
print("orig %d bytes -> new %d bytes" % (orig_len, len(s)))

# 残留自检：不应再有直接把 groupContracts 当单对象使用的地方
leftover = re.findall(r"groupContracts\[[^\]]*\]\s*(?!\s*\.\s*length)", s)
direct = [x for x in re.finditer(r"const contract = groupContracts\[", s)]
print("direct groupContracts single-object usage remaining:", len(direct))
print("demo-only markers should be ZERO -> demo-note:", s.count("demo-note"),
      "| demo-stage:", s.count("demo-stage"),
      "| 演示:", s.count("演示"),
      "| 一个工作组只能有一个合同:", s.count("一个工作组只能有一个合同"))
