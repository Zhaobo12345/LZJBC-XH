
        'use strict';

        // 合同类型：与 PRD-完整文档.html 定义的 8 类保持一致（单选）
        var CONTRACT_TYPES = [
            { value: 'base', typeName: '基础施工服务合同', role: '项目总或工长' },
            { value: 'design', typeName: '设计服务合同', role: '设计师' },
            { value: 'demolition', typeName: '拆除班组服务合同', role: '拆除工' },
            { value: 'shuidian', typeName: '水电班组服务合同', role: '水电工' },
            { value: 'muzuo', typeName: '木作班组服务合同', role: '木作工' },
            { value: 'niwa', typeName: '泥瓦工班组服务合同', role: '泥瓦工' },
            { value: 'youqi', typeName: '油漆工班组服务合同', role: '油漆工' },
            { value: 'xiaolingong', typeName: '小零工服务合同', role: '小零工' }
        ];

        // 项目内已有人员（角色严格对应 PRD 定义的角色值）
        var PROJECT_MEMBERS = [
            { id: 'm-owner', name: '陈业主', role: '业主' },
            { id: 'm-designer', name: '王设计', role: '设计师' },
            { id: 'm-pm', name: '刘项目总', role: '项目总' },
            { id: 'm-lead', name: '孙工长', role: '工长' },
            { id: 'm-demolition', name: '钱拆除', role: '拆除工' },
            { id: 'm-shuidian', name: '张水电', role: '水电工' },
            { id: 'm-muzuo', name: '李木作', role: '木作工' },
            { id: 'm-niwa', name: '周泥瓦', role: '泥瓦工' },
            { id: 'm-youqi', name: '吴油漆', role: '油漆工' },
            { id: 'm-xiaolingong', name: '郑零工', role: '小零工' }
        ];

        var currentGroup = '';
        var invitedList = [];   // 工人合同：被邀请的意向乙方（最多 3 人）
        var editId = '';        // 工人合同：编辑（撤回后重新提交）时的合约库 id

        // 甲乙方选择状态（自定义可搜索选择框）
        var pickerState = {
            partyA: { open: false, value: '' },
            partyB: { open: false, value: '' }
        };

        function initPage() {
            var params = new URLSearchParams(window.location.search);
            currentGroup = params.get('group') || '';
            if (currentGroup) {
                document.getElementById('groupDisplay').textContent = currentGroup;
            }
            renderTypeOptions();
            initMemberPicker('partyA');
            initMemberPicker('partyB');

            // 工人合同：撤回后「重新提交邀约」回到本页预填
            editId = params.get('editId') || '';
            if (editId && ContractStore.getContract(editId)) {
                var c = ContractStore.getContract(editId);
                document.getElementById('contractName').value = c.name || '';
                document.getElementById('contractAmount').value = c.amount || '';
                document.getElementById('contractType').value = c.type || '';
                if (c.group) {
                    currentGroup = c.group;
                    document.getElementById('groupDisplay').textContent = c.group;
                }
                if (c.partyA) {
                    pickerState.partyA.value = c.partyA;
                    var pa = PROJECT_MEMBERS.filter(function (m) { return m.id === c.partyA; })[0];
                    if (pa) {
                        var paVal = document.getElementById('partyAValue');
                        paVal.textContent = pa.name + '（' + pa.role + '）';
                        paVal.classList.add('filled');
                    }
                }
                invitedList = (c.invitations || []).map(function (i) {
                    return { userId: i.userId, name: i.name, role: i.role };
                });
                onContractTypeChange();
                renderInviteChips();
                return;
            }
            onContractTypeChange();
        }

        function renderTypeOptions() {
            var sel = document.getElementById('contractType');
            CONTRACT_TYPES.forEach(function (t) {
                var opt = document.createElement('option');
                opt.value = t.value;
                opt.textContent = t.typeName;
                sel.appendChild(opt);
            });
            sel.addEventListener('change', function () {
                onContractTypeChange();
            });
        }

        function initMemberPicker(pickerId) {
            pickerState[pickerId].open = false;
            pickerState[pickerId].value = '';
            var valueEl = document.getElementById(pickerId + 'Value');
            valueEl.textContent = (pickerId === 'partyA' ? '请选择甲方' : '请选择乙方') + '（选填）';
            valueEl.classList.remove('filled');
        }

        // 渲染可搜索列表：按姓名或角色关键字模糊匹配
        function renderMemberPicker(pickerId) {
            var listEl = document.getElementById(pickerId + 'List');
            var keyword = (document.getElementById(pickerId + 'Search').value || '').trim().toLowerCase();
            listEl.innerHTML = '';
            var matched = PROJECT_MEMBERS.filter(function (m) {
                if (!keyword) return true;
                return m.name.toLowerCase().indexOf(keyword) > -1 ||
                    m.role.toLowerCase().indexOf(keyword) > -1;
            });
            var emptyEl = document.getElementById(pickerId + 'Empty');
            if (matched.length === 0) {
                emptyEl.style.display = 'block';
                return;
            }
            emptyEl.style.display = 'none';
            matched.forEach(function (m) {
                var item = document.createElement('div');
                item.className = 'member-picker-item' + (pickerState[pickerId].value === m.id ? ' selected' : '');
                item.setAttribute('data-id', m.id);
                item.innerHTML = '<span class="mp-name">' + escapeHtml(m.name) + '</span>' +
                    '<span class="mp-role">' + escapeHtml(m.role) + '</span>';
                item.onclick = function () { selectMember(pickerId, m); };
                listEl.appendChild(item);
            });
        }

        function toggleMemberPicker(pickerId) {
            var panel = document.getElementById(pickerId + 'Panel');
            var isOpen = panel.classList.contains('open');
            closeAllPickers();
            if (!isOpen) {
                panel.classList.add('open');
                pickerState[pickerId].open = true;
                var search = document.getElementById(pickerId + 'Search');
                search.value = '';
                renderMemberPicker(pickerId);
                search.focus();
            }
            clearError(pickerId);
        }

        function closeAllPickers() {
            ['partyA', 'partyB'].forEach(function (id) {
                var panel = document.getElementById(id + 'Panel');
                if (panel) panel.classList.remove('open');
                pickerState[id].open = false;
            });
        }

        function filterMembers(pickerId) {
            renderMemberPicker(pickerId);
        }

        function selectMember(pickerId, m) {
            pickerState[pickerId].value = m.id;
            var valueEl = document.getElementById(pickerId + 'Value');
            valueEl.textContent = m.name + '（' + m.role + '）';
            valueEl.classList.add('filled');
            closeAllPickers();
            clearError(pickerId);
        }

        // 点击空白处关闭选择面板
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.member-picker')) {
                closeAllPickers();
            }
            if (!e.target.closest('#invitePicker')) {
                var ip = document.getElementById('invitePanel');
                if (ip) ip.classList.remove('open');
            }
        });

        // ============== 工人合同：邀请 1-3 人（意向乙方） ==============
        function onContractTypeChange() {
            var typeValue = document.getElementById('contractType').value;
            var isWorker = ContractStore.isWorkerType(typeValue);
            var inviteSection = document.getElementById('inviteSection');
            var partyBGroup = document.getElementById('partyBGroup');
            if (isWorker) {
                if (inviteSection) inviteSection.style.display = 'block';
                if (partyBGroup) partyBGroup.style.display = 'none';
            } else {
                if (inviteSection) inviteSection.style.display = 'none';
                if (partyBGroup) partyBGroup.style.display = 'block';
            }
            invitedList = []; // 切换合同类型时清空意向乙方，避免跨工种残留选择
            renderInviteChips();
            clearError('type');
        }

        function toggleInvitePanel() {
            var panel = document.getElementById('invitePanel');
            if (!panel) return;
            var isOpen = panel.classList.contains('open');
            if (isOpen) {
                panel.classList.remove('open');
                return;
            }
            closeAllPickers();
            panel.classList.add('open');
            var search = document.getElementById('inviteSearch');
            search.value = '';
            renderInviteList();
            search.focus();
            clearError('invite');
        }

        function filterInvite() {
            renderInviteList();
        }

        function renderInviteList() {
            var listEl = document.getElementById('inviteList');
            var keyword = (document.getElementById('inviteSearch').value || '').trim().toLowerCase();
            var typeValue = document.getElementById('contractType').value;
            var selectedType = CONTRACT_TYPES.filter(function (t) { return t.value === typeValue; })[0];
            var tradeRole = (selectedType && ContractStore.isWorkerType(typeValue)) ? selectedType.role : null;
            listEl.innerHTML = '';
            var matched = PROJECT_MEMBERS.filter(function (m) {
                if (tradeRole && m.role !== tradeRole) return false; // 按所选工种自动过滤候选
                if (!keyword) return true;
                return m.name.toLowerCase().indexOf(keyword) > -1 ||
                    m.role.toLowerCase().indexOf(keyword) > -1;
            });
            var emptyEl = document.getElementById('inviteEmpty');
            if (matched.length === 0) {
                emptyEl.style.display = 'block';
                return;
            }
            emptyEl.style.display = 'none';
            var full = invitedList.length >= 3;
            matched.forEach(function (m) {
                var selected = invitedList.some(function (x) { return x.userId === m.id; });
                var item = document.createElement('div');
                item.className = 'member-picker-item' + (selected ? ' selected' : '') + (full && !selected ? ' disabled' : '');
                item.setAttribute('data-id', m.id);
                item.innerHTML = '<span class="mp-name">' + escapeHtml(m.name) + '</span>' +
                    '<span class="mp-role">' + escapeHtml(m.role) + '</span>' +
                    (selected ? '<span class="check">✓</span>' : '');
                item.onclick = function () { toggleInvite(m); };
                listEl.appendChild(item);
            });
        }

        function toggleInvite(m) {
            var idx = invitedList.map(function (x) { return x.userId; }).indexOf(m.id);
            if (idx > -1) {
                invitedList.splice(idx, 1);
            } else {
                if (invitedList.length >= 3) {
                    showTip('最多邀请 3 名意向乙方');
                    return;
                }
                invitedList.push({ userId: m.id, name: m.name, role: m.role });
            }
            renderInviteList();
            renderInviteChips();
            clearError('invite');
        }

        function renderInviteChips() {
            var valueEl = document.getElementById('inviteValue');
            var chipsEl = document.getElementById('inviteChips');
            if (invitedList.length === 0) {
                valueEl.textContent = '请邀请意向乙方（选填，最多 3 人）';
                valueEl.classList.remove('filled');
            } else {
                valueEl.textContent = '已选 ' + invitedList.length + ' / 3 人';
                valueEl.classList.add('filled');
            }
            chipsEl.innerHTML = '';
            invitedList.forEach(function (m) {
                var chip = document.createElement('span');
                chip.className = 'invite-chip';
                chip.innerHTML = escapeHtml(m.name) + '（' + escapeHtml(m.role) + '）<span class="x" data-id="' + m.id + '">✕</span>';
                chip.querySelector('.x').onclick = function (ev) {
                    ev.stopPropagation();
                    toggleInvite(m);
                };
                chipsEl.appendChild(chip);
            });
        }

        // 工人合同提交（方案 B）
        function handleWorkerSubmit(typeValue) {
            ['invite', 'contractName', 'contractAmount'].forEach(clearError);
            var nameVal = document.getElementById('contractName').value;
            var nameErr = validateName(nameVal);
            if (nameErr) { showError('contractName', nameErr); showTip(nameErr); return; }
            if (invitedList.length > 3) {
                showError('invite', '最多邀请 3 名意向乙方');
                showTip('最多邀请 3 名意向乙方');
                return;
            }
            var amountVal = document.getElementById('contractAmount').value;
            var amountErr = '';
            if (amountVal.trim()) { amountErr = validateAmount(amountVal); }
            if (amountErr) { showError('contractAmount', amountErr); showTip(amountErr); return; }

            var selectedType = CONTRACT_TYPES.filter(function (t) { return t.value === typeValue; })[0];
            var partyA = pickerState.partyA.value;
            var partyAName = '';
            if (partyA) {
                var pa = PROJECT_MEMBERS.filter(function (m) { return m.id === partyA; })[0];
                if (pa) partyAName = pa.name;
            }
            var amountNormalized = amountVal.trim() ? amountVal.replace(/,/g, '') : '';

            if (editId) {
                var existing = ContractStore.getContract(editId);
                if (existing) {
                    existing.name = nameVal.trim();
                    existing.type = selectedType.value;
                    existing.typeName = selectedType.typeName;
                    existing.group = currentGroup;
                    existing.partyA = partyA;
                    existing.partyAName = partyAName;
                    existing.amount = amountNormalized;
                    ContractStore.saveContract(existing);
                    ContractStore.submitInvite(editId, invitedList);
                    window.location.href = 'worker-contract-detail.html?id=' + encodeURIComponent(editId) + '&viewer=sender';
                    return;
                }
            }
            var id = 'contract-' + Date.now();
            ContractStore.createContract({
                id: id,
                name: nameVal.trim(),
                type: selectedType.value,
                typeName: selectedType.typeName,
                group: currentGroup,
                partyA: partyA,
                partyAName: partyAName,
                amount: amountNormalized,
                invited: invitedList,
                status: 'worker_draft'
            });
            window.location.href = 'worker-contract-draft-initial-new.html?id=' + encodeURIComponent(id);
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        function showError(field, msg) {
            var errEl = document.getElementById(field + 'Error');
            var inputId = field === 'type' ? 'contractType' : (field === 'partyA' || field === 'partyB' ? field + 'Control' : field);
            var inputEl = document.getElementById(inputId);
            if (errEl) {
                if (msg) errEl.textContent = msg;
                errEl.classList.add('show');
            }
            if (inputEl && inputEl.classList) inputEl.classList.add('error');
        }

        function clearError(field) {
            var errEl = document.getElementById(field + 'Error');
            var inputId = field === 'type' ? 'contractType' : (field === 'partyA' || field === 'partyB' ? field + 'Control' : field);
            var inputEl = document.getElementById(inputId);
            if (errEl) errEl.classList.remove('show');
            if (inputEl && inputEl.classList) inputEl.classList.remove('error');
        }

        function showTip(text) {
            var bubble = document.getElementById('tipBubble');
            bubble.textContent = text;
            bubble.classList.add('show');
            clearTimeout(window.__tipTimer);
            window.__tipTimer = setTimeout(function () {
                bubble.classList.remove('show');
            }, 1800);
        }

        // 合同名称校验规则：必填；长度 2-30；仅空白/非法字符（<>{}|\\^` 等）不通过
        function validateName(name) {
            var v = (name || '').trim();
            if (!v) return '请输入合同名称';
            if (v.length < 2) return '合同名称至少 2 个字符';
            if (v.length > 30) return '合同名称最多 30 个字符';
            if (/[<>{}|\\^`]/.test(v)) return '合同名称不能包含特殊字符 < > { } | \\ ^ `';
            return '';
        }

        // 合同金额校验规则：必填；正数；最多两位小数；上限 1e12
        function validateAmount(raw) {
            var v = (raw || '').trim();
            if (!v) return '请输入合同金额';
            var normalized = v.replace(/,/g, '');
            if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
                return '请输入正确的合同金额（正数，最多两位小数）';
            }
            var num = parseFloat(normalized);
            if (!(num > 0)) return '合同金额必须大于 0';
            if (num > 1e12) return '合同金额超出合理范围';
            return '';
        }

        function submitCreateContract() {
            // 清空旧错误
            ['type', 'contractName', 'partyA', 'partyB', 'contractAmount'].forEach(clearError);

            var firstError = '';

            // 1. 合同类型（必选，下拉单选）
            var typeSelect = document.getElementById('contractType');
            var typeValue = typeSelect.value;

            // 工人合同新流程（方案 B）：创建时邀请 1-3 人，走独立提交分支
            if (ContractStore.isWorkerType(typeValue)) {
                handleWorkerSubmit(typeValue);
                return;
            }

            if (!typeValue) {
                showError('type');
                firstError = firstError || '请选择合同类型';
            }

            // 2. 合同名称（必填）
            var nameVal = document.getElementById('contractName').value;
            var nameErr = validateName(nameVal);
            if (nameErr) {
                showError('contractName', nameErr);
                firstError = firstError || nameErr;
            }

            // 3. 甲方（选填）
            var partyA = pickerState.partyA.value;

            // 4. 乙方（选填）
            var partyB = pickerState.partyB.value;

            // 甲、乙方选填，但若两者都填写则不能为同一人
            if (partyA && partyB && partyA === partyB) {
                showError('partyA', '甲方与乙方不能相同');
                showError('partyB', '甲方与乙方不能相同');
                firstError = firstError || '甲方与乙方不能相同';
            }

            // 5. 合同金额（选填，填写后校验格式）
            var amountVal = document.getElementById('contractAmount').value;
            var amountErr = '';
            if (amountVal.trim()) {
                amountErr = validateAmount(amountVal);
            }
            if (amountErr) {
                showError('contractAmount', amountErr);
                firstError = firstError || amountErr;
            }

            if (firstError) {
                showTip(firstError);
                return;
            }

            // 全部通过：组装参数，跳转到拟定中合同详情页
            var selectedType = CONTRACT_TYPES.filter(function (t) {
                return t.value === typeValue;
            })[0];

            var partyAName = '';
            var partyBName = '';
            if (partyA) {
                var pa = PROJECT_MEMBERS.filter(function (m) { return m.id === partyA; })[0];
                if (pa) partyAName = pa.name;
            }
            if (partyB) {
                var pb = PROJECT_MEMBERS.filter(function (m) { return m.id === partyB; })[0];
                if (pb) partyBName = pb.name;
            }
            var amountNormalized = amountVal.trim() ? amountVal.replace(/,/g, '') : '';

            var params = new URLSearchParams({
                id: 'contract-new-' + Date.now(),
                name: nameVal.trim(),
                type: selectedType.value,
                typeName: selectedType.typeName,
                partyA: partyA,
                partyAName: partyAName,
                partyB: partyB,
                partyBName: partyBName,
                amount: amountNormalized,
                group: currentGroup,
                status: 'draft',
                new: '1'
            });

            location.href = 'contract-detail.html?' + params.toString();
        }

        initPage();
    