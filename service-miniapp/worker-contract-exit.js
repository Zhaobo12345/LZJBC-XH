/**
 * 工人合同「乙方退出 / 甲方重选」独立演示页
 * --------------------------------------------------------------
 * 场景：抢单成功、合同进入「已确认」后，线下沟通无法合作。
 *   - 乙方（已确认 receiver）可申请退出（填写原因），甲方处理前可撤销；
 *   - 甲方（sender）收到申请后「同意退出 / 驳回申请」；
 *   - 同意 → 乙方退出（轻量终态），甲方回到「确认中」重新选择乙方；
 *   - 驳回 → 合同维持「已确认」。
 *   - 甲方主动重选（对称分支）：已确认 sender 点「重新选择乙方」→ 二次确认 →
 *     原乙方进入「被替换·合作未达成」终态，甲方回到候选列表重选（复用确认中流程）。
 *
 * 设计：独立页面文件，复用共享演示合同（demo-shuidian-example，乙方 张水电 / 甲方 陈庄），
 * 不改动「工人合同详情（新流程）」任何已有状态逻辑；仅在其原型导航增加入口链接。
 * 状态为页面内预览态（state.exitStatus + state.viewer），闭环完整、零后端依赖。
 */
(function (global) {
    'use strict';

    var DEMO_ID = 'demo-shuidian-example';

    var state = {
        contract: null,
        viewer: 'receiver',     // receiver（乙方） / sender（甲方·工长）
        exitStatus: 'confirmed', // confirmed / pending / exited / rejected / reselect / replaced
        exitReason: '',
        newPartyB: null,
        agreed: false
    };

    function $(id) { return document.getElementById(id); }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // 加载共享演示合同；若不存在则兜底创建并置为已确认态（复用同一份，不影响主详情页）
    function loadContract() {
        var c = global.ContractStore && ContractStore.getContract(DEMO_ID);
        if (!c && global.ContractStore && ContractStore.createContract) {
            ContractStore.createContract({
                id: DEMO_ID, name: '水电班组服务合同', type: 'shuidian', typeName: '水电班组服务合同',
                group: '水电工程', partyA: 'm-owner', partyAName: '陈庄', partyAPhone: '13800138000',
                inviterName: '陈庄', inviterRole: '工长', amount: 8500,
                invited: [
                    { userId: 'm-shuidian', name: '张水电', role: '水电工' },
                    { userId: 'm-shuidian-2', name: '韩水通', role: '水电工' },
                    { userId: 'm-shuidian-3', name: '杨水明', role: '水电工' }
                ]
            });
            ContractStore.confirmInvitation(DEMO_ID, 'm-shuidian');
            c = ContractStore.getContract(DEMO_ID);
        }
        return c;
    }

    // 重选候选（已退出的乙方之外）
    function candidateList() {
        return [
            { id: 'm-shuidian-2', name: '韩水通', role: '水电工' },
            { id: 'm-shuidian-3', name: '杨水明', role: '水电工' }
        ];
    }

    function currentPartyB() {
        if (state.exitStatus === 'confirmed' && state.newPartyB) return state.newPartyB;
        return (state.contract && state.contract.partyBName) || '张水电';
    }

    function metaRow(label, val) {
        return '<div class="meta-row"><span class="meta-label">' + escapeHtml(label) +
            '</span><span class="meta-value">' + escapeHtml(val) + '</span></div>';
    }

    function render() {
        var c = state.contract;
        if (!c) return;
        $('vsReceiver').className = 'vs-btn' + (state.viewer === 'receiver' ? ' active' : '');
        $('vsSender').className = 'vs-btn' + (state.viewer === 'sender' ? ' active' : '');
        renderCtx();
        renderBanner();
        renderFlow();
        renderBottom();
        updateExitNavActive();
    }

    function updateExitNavActive() {
        var items = document.querySelectorAll('.status-switch-item[data-status]');
        if (!items) return;
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (it.getAttribute('data-status') === state.exitStatus) it.classList.add('active');
            else it.classList.remove('active');
        }
    }

    function renderCtx() {
        var c = state.contract;
        var pb = currentPartyB();
        var html = '';
        html += metaRow('合同名称', c.name);
        html += metaRow('合同类型', c.typeName);
        html += metaRow('甲方', '陈庄（工长）');
        html += metaRow('乙方', pb + '（水电工）');
        html += metaRow('合同金额', '¥' + (c.amount || '—'));
        html += metaRow('关联架构', c.group);
        $('ctxMeta').innerHTML = html;

        var arch = $('ctxArch');
        var v = state.viewer, s = state.exitStatus;
        if (s === 'exited' && v === 'receiver') {
            arch.className = 'arch-note err';
            arch.textContent = '你已退出本合同，不再承担乙方职责。';
        } else if (s === 'rejected' && v === 'receiver') {
            arch.className = 'arch-note';
            arch.textContent = '退出申请被驳回，请按原合同继续履约。';
        } else if (s === 'reselect' && v === 'receiver') {
            arch.className = 'arch-note';
            arch.textContent = '你已退出，工长正在重新选择乙方。';
        } else if (s === 'replaced' && v === 'receiver') {
            arch.className = 'arch-note err';
            arch.textContent = '你已被工长重新选择乙方替换，本次合作未达成。';
        } else if (s === 'replaced' && v === 'sender') {
            arch.className = 'arch-note err';
            arch.textContent = '原乙方已被替换，请重新选择乙方。';
        } else {
            arch.className = 'arch-note';
            arch.textContent = '乙方已加入「' + c.group + '」架构层级。';
        }
    }

    function bannerCfg() {
        var v = state.viewer, s = state.exitStatus;
        if (s === 'confirmed') {
            return v === 'receiver'
                ? { cls: 'confirmed', t: '已确认', d: '合同已确认，乙方已加入项目架构。' }
                : { cls: 'confirmed', t: '已确认', d: '合同已确认，等待乙方上传签约文件。' };
        }
        if (s === 'pending') {
            return v === 'receiver'
                ? { cls: 'pending', t: '退出申请待处理', d: '已提交退出申请，等待工长（甲方）处理。' }
                : { cls: 'pending', t: '乙方申请退出', d: '乙方申请退出合作，请及时处理。' };
        }
        if (s === 'exited') {
            return v === 'receiver'
                ? { cls: 'exited', t: '已退出', d: '你已退出本合同。' }
                : { cls: 'exited', t: '乙方已退出', d: '乙方已退出，请重新选择乙方。' };
        }
        if (s === 'rejected') {
            return v === 'receiver'
                ? { cls: 'confirmed', t: '已确认', d: '退出申请被驳回，请继续履约。' }
                : { cls: 'confirmed', t: '已确认', d: '你驳回了乙方的退出申请，合同维持已确认。' };
        }
        if (s === 'reselect') {
            return v === 'receiver'
                ? { cls: 'pending', t: '等待新乙方', d: '你已退出，工长正在重新安排乙方。' }
                : { cls: 'pending', t: '重新选择乙方', d: '乙方已退出，请从候选中重新选择乙方。' };
        }
        if (s === 'replaced') {
            return v === 'receiver'
                ? { cls: 'replaced', t: '已被替换', d: '工长已重新选择乙方，本次合作未达成。' }
                : { cls: 'pending', t: '重新选择乙方', d: '原乙方已被替换，请从候选中重新选择乙方。' };
        }
        return { cls: 'confirmed', t: '已确认', d: '' };
    }

    function renderBanner() {
        var cfg = bannerCfg();
        var b = $('statusBanner');
        b.className = 'wc-banner ' + cfg.cls;
        $('bannerText').textContent = cfg.t;
        $('bannerDesc').textContent = cfg.d;
    }

    function renderFlow() {
        var fv = $('flowView');
        var v = state.viewer, s = state.exitStatus;
        var c = state.contract;
        var html = '';

        if (s === 'confirmed') {
            if (v === 'receiver') {
                html = '<div class="ctx-card" style="background:transparent;box-shadow:none;padding:0 12px;">' +
                    '<div class="arch-note warn">如线下沟通无法合作，可申请退出，由工长重新选择乙方。</div></div>';
            }
        } else if (s === 'pending') {
            html = '<div class="ctx-card"><div class="card-title">退出原因</div>' +
                '<div class="arch-note warn">' + escapeHtml(state.exitReason || '（未填写）') + '</div></div>';
            if (v === 'sender') {
                html += '<div class="ctx-card" style="background:transparent;box-shadow:none;padding:0 12px;">' +
                    '<div class="arch-note">请在底部「同意退出」或「驳回申请」。</div></div>';
            } else {
                html += '<div class="ctx-card" style="background:transparent;box-shadow:none;padding:0 12px;">' +
                    '<div class="arch-note">工长处理前，你可随时撤销申请。</div></div>';
            }
        } else if (s === 'exited') {
            if (v === 'receiver') {
                html = '<div class="ended-view">' +
                    '<div class="ended-icon exited">✕</div>' +
                    '<div class="ended-status">已退出</div>' +
                    '<div class="ended-card">' +
                    '<div class="ended-contract">' + escapeHtml(c.name) + '</div>' +
                    '<div class="ended-desc">你已退出本合同，不再承担乙方职责。</div>' +
                    '<div class="ended-reason"><span class="rr-label">退出原因</span>' + escapeHtml(state.exitReason || '—') + '</div>' +
                    '</div></div>';
            } else {
                html = '<div class="ctx-card"><div class="card-title">乙方已退出</div>' +
                    '<div class="arch-note err">' + escapeHtml(c.partyBName || '乙方') + ' 已退出，合同回到「确认中」，请重新选择乙方。</div>' +
                    '<div class="arch-note">点击底部「去重新选择乙方」进入重选。</div></div>';
            }
        } else if (s === 'rejected') {
            html = '<div class="ctx-card"><div class="card-title">退出申请已驳回</div>' +
                '<div class="arch-note">合同维持「已确认」，请按原约定继续履约。</div></div>';
        } else if (s === 'reselect') {
            if (v === 'sender') {
                var rows = candidateList().map(function (cd) {
                    return '<div class="cand-row">' +
                        '<div class="cand-avatar">' + escapeHtml(cd.name.charAt(0)) + '</div>' +
                        '<div class="cand-info"><div class="cand-name">' + escapeHtml(cd.name) + '</div>' +
                        '<div class="cand-role">' + escapeHtml(cd.role) + '</div></div>' +
                        '<div class="cand-pick" onclick="WCP.pickCandidate(\'' + cd.id + '\',\'' + escapeHtml(cd.name) + '\')">选择</div>' +
                        '</div>';
                }).join('');
                html = '<div class="ctx-card"><div class="card-title">重新选择乙方（水电工）</div><div class="cand-list">' + rows + '</div></div>';
            } else {
                html = '<div class="ctx-card"><div class="arch-note">你已退出，工长正在重新选择乙方，请等待。</div></div>';
            }
        } else if (s === 'replaced') {
            if (v === 'receiver') {
                html = '<div class="ended-view">' +
                    '<div class="ended-icon exited">✕</div>' +
                    '<div class="ended-status">已被替换</div>' +
                    '<div class="ended-card">' +
                    '<div class="ended-contract">' + escapeHtml(c.name) + '</div>' +
                    '<div class="ended-desc">工长已重新选择乙方，本次合作未达成，你不再承担乙方职责。</div>' +
                    '</div></div>';
            } else {
                var rows2 = candidateList().map(function (cd) {
                    return '<div class="cand-row">' +
                        '<div class="cand-avatar">' + escapeHtml(cd.name.charAt(0)) + '</div>' +
                        '<div class="cand-info"><div class="cand-name">' + escapeHtml(cd.name) + '</div>' +
                        '<div class="cand-role">' + escapeHtml(cd.role) + '</div></div>' +
                        '<div class="cand-pick" onclick="WCP.pickCandidate(\'' + cd.id + '\',\'' + escapeHtml(cd.name) + '\')">选择</div>' +
                        '</div>';
                }).join('');
                html = '<div class="ctx-card"><div class="card-title">重新选择乙方（水电工）</div><div class="cand-list">' + rows2 + '</div></div>';
            }
        }

        fv.innerHTML = html || '';
    }

    function renderBottom() {
        var ba = $('bottomActions');
        var v = state.viewer, s = state.exitStatus;
        var html = '';
        if (s === 'confirmed' && v === 'receiver') {
            html = '<button class="wc-action-btn warning" onclick="WCP.openExitReason()">申请退出</button>';
        } else if (s === 'confirmed' && v === 'sender') {
            html = '<button class="wc-action-btn secondary" onclick="WCP.openOwnerReselect()">重新选择乙方</button>';
        } else if (s === 'pending' && v === 'receiver') {
            html = '<button class="wc-action-btn secondary" onclick="WCP.withdrawExit()">撤销申请</button>';
        } else if (s === 'pending' && v === 'sender') {
            html = '<button class="wc-action-btn success" onclick="WCP.agreeExit()">同意退出</button>' +
                '<button class="wc-action-btn warning" onclick="WCP.rejectExit()">驳回申请</button>';
        } else if (s === 'exited' && v === 'sender') {
            html = '<button class="wc-action-btn primary" onclick="WCP.setExitStatus(\'reselect\')">去重新选择乙方</button>';
        }
        ba.innerHTML = html;
        ba.style.display = html ? 'flex' : 'none';
    }

    // ============== 交互 ==============
    function openExitReason() {
        var m = $('exitReasonModal');
        if (m) m.classList.add('show');
        var i = $('exitReasonInput');
        if (i) i.value = state.exitReason || '';
        var e = $('exitReasonErr');
        if (e) e.style.display = 'none';
    }

    function closeExitReason() {
        var m = $('exitReasonModal');
        if (m) m.classList.remove('show');
    }

    function submitExitReason() {
        var i = $('exitReasonInput');
        var val = (i && i.value || '').trim();
        if (!val) {
            var e = $('exitReasonErr');
            if (e) { e.textContent = '请填写退出原因'; e.style.display = 'block'; }
            return;
        }
        state.exitReason = val;
        state.exitStatus = 'pending';
        closeExitReason();
        render();
        toast('已提交退出申请');
    }

    function withdrawExit() {
        state.exitStatus = 'confirmed';
        state.exitReason = '';
        render();
        toast('已撤销退出申请');
    }

    function agreeExit() {
        state.exitStatus = 'exited';
        state.agreed = true;
        render();
        toast('已同意乙方退出');
    }

    function rejectExit() {
        state.exitStatus = 'rejected';
        state.agreed = false;
        render();
        toast('已驳回退出申请');
    }

    function pickCandidate(id, name) {
        state.newPartyB = name;
        state.exitStatus = 'confirmed';
        state.agreed = false;
        render();
        toast('已选定 ' + name + ' 为乙方，合同回到已确认');
    }

    // 甲方主动重选：二次确认
    function openOwnerReselect() {
        var m = $('ownerReselectModal');
        if (m) m.classList.add('show');
    }

    function closeOwnerReselect() {
        var m = $('ownerReselectModal');
        if (m) m.classList.remove('show');
    }

    function confirmOwnerReselect() {
        state.exitStatus = 'replaced';
        closeOwnerReselect();
        render();
        toast('已回到确认中，请重新选择乙方');
    }

    function setViewer(v) {
        if (v !== 'receiver' && v !== 'sender') return;
        state.viewer = v;
        render();
    }

    function setExitStatus(s) {
        if (['confirmed', 'pending', 'exited', 'rejected', 'reselect', 'replaced'].indexOf(s) < 0) return;
        state.exitStatus = s;
        render();
    }

    var toastTimer = null;
    function toast(msg) {
        var t = $('appToast');
        if (!t) return;
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.style.display = 'none'; }, 1600);
    }

    function init() {
        state.contract = loadContract();
        var p = new URLSearchParams(global.location.search);
        var v = p.get('viewer');
        if (v === 'sender' || v === 'receiver') state.viewer = v;
        var s = p.get('status');
        if (s && ['confirmed', 'pending', 'exited', 'rejected', 'reselect', 'replaced'].indexOf(s) >= 0) state.exitStatus = s;
        render();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    global.WCP = {
        setViewer: setViewer,
        setExitStatus: setExitStatus,
        openExitReason: openExitReason,
        closeExitReason: closeExitReason,
        submitExitReason: submitExitReason,
        withdrawExit: withdrawExit,
        agreeExit: agreeExit,
        rejectExit: rejectExit,
        pickCandidate: pickCandidate,
        openOwnerReselect: openOwnerReselect,
        closeOwnerReselect: closeOwnerReselect,
        confirmOwnerReselect: confirmOwnerReselect
    };
})(window);
