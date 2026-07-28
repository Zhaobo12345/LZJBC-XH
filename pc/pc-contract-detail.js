let currentStatus = 'draft';
        let pendingAction = null;

        const statusConfig = {
            platform_reviewing: {
                title: '⏳ 待平台审核',
                desc: '已提交确认申请，平台运营人员正在审核中 | 合同编号：BJSDSWHT000001',
                class: 'platform-reviewing'
            },
            platform_rejected: {
                title: '❌ 平台审核驳回',
                desc: '平台审核未通过，请根据驳回原因修改合同内容后重新提交 | 合同编号：BJSDSWHT000001',
                class: 'platform-rejected'
            },
            change_reviewing: {
                title: '⏳ 变更待平台审核',
                desc: '变更申请已提交，平台运营人员正在审核中 | 合同编号：BJSDSWHT000001',
                class: 'changing'
            },
            review_rejected: {
                title: '❌ 审核驳回',
                desc: '平台审核未通过，请根据驳回原因修改合同内容后重新提交 | 合同编号：BJSDSWHT000001',
                class: 'platform-rejected',
                showRejectReason: true
            },
            reviewed_pass: {
                title: '✅ 审核已通过',
                desc: '合同审核已通过，等待双方确认签约 | 合同编号：BJSDSWHT000001',
                class: 'confirmed'
            },
            reviewed_reject: {
                title: '❌ 审核已驳回',
                desc: '合同审核未通过，请根据驳回原因修改后重新提交 | 合同编号：BJSDSWHT000001',
                class: 'platform-rejected',
                showRejectReason: true
            },
            change_reviewed_pass: {
                title: '✅ 变更已通过',
                desc: '变更申请已通过审核 | 合同编号：BJSDSWHT000001',
                class: 'signed'
            },
            change_reviewed_reject: {
                title: '❌ 变更已驳回',
                desc: '变更申请未通过审核，请根据驳回原因修改后重新提交 | 合同编号：BJSDSWHT000001',
                class: 'platform-rejected',
                showRejectReason: true
            },
            signed: {
                title: '✅ 合同已签约',
                desc: '签约时间：2024-01-15 10:30 | 合同编号：BJSDSWHT000001',
                class: 'signed'
            },
            confirmed: {
                title: '✅ 双方已确认',
                desc: '双方已确认，请上传签约后的合同附件 | 合同编号：BJSDSWHT000001',
                class: 'confirmed'
            },
            signing: {
                title: '📝 待确认签约',
                desc: '对方已上传签约文件，请确认后合同正式生效 | 合同编号：BJSDSWHT000001',
                class: 'signing'
            }
        };

        function switchStatus(status) {
            currentStatus = status;
            updateUI();
        }

        function updateUI() {
            const config = statusConfig[currentStatus];
            
            const title = config.title;
            const desc = config.desc;
            
            document.getElementById('statusTitle').textContent = title;
            document.getElementById('statusDesc').textContent = desc;
            document.getElementById('statusBanner').className = 'status-banner ' + config.class;
            
            updateReviewPanel();
            updateStatusActions();
            updateChangesContent();
            updateRejectReasonBanner();
            updateOperationLog();
            updateStagesContent();
        }

        function handlePageChange(value) {
            switch(value) {
                case 'contract_template':
                    window.location.href = 'pc-contract-template.html';
                    break;
                case 'stage_template':
                    window.location.href = 'pc-stage-template.html';
                    break;
                case 'contract_list':
                    window.location.href = 'pc-contract-list.html';
                    break;
                case 'contract_detail':
                    break;
                case 'mini_program':
                    showToast('正在打开小程序首页...');
                    break;
            }
        }

        function updateRejectReasonBanner() {
            const banner = document.getElementById('rejectReasonBanner');
            const rejectedStatuses = ['platform_rejected', 'review_rejected', 'reviewed_reject', 'change_reviewed_reject'];
            
            if (rejectedStatuses.includes(currentStatus)) {
                banner.classList.add('show');
            } else {
                banner.classList.remove('show');
            }
        }

        function updateStagesContent() {
            const changeSummaryCard = document.getElementById('changeSummaryCard');
            const stage2Section = document.getElementById('stage2Section');
            const stage2ChangeBadge = document.getElementById('stage2ChangeBadge');
            const taskWaterPipe = document.getElementById('taskWaterPipe');
            const taskWaterPipeBadge = document.getElementById('taskWaterPipeBadge');
            const stage3NewSection = document.getElementById('stage3NewSection');
            const stage3OriginalSection = document.getElementById('stage3OriginalSection');
            
            if (currentStatus === 'change_reviewing' || currentStatus === 'change_reviewed_pass') {
                if (changeSummaryCard) changeSummaryCard.style.display = 'block';
                if (stage2ChangeBadge) stage2ChangeBadge.style.display = 'inline';
                if (taskWaterPipeBadge) taskWaterPipeBadge.style.display = 'inline';
                if (stage3NewSection) stage3NewSection.style.display = 'block';
                if (stage3OriginalSection) stage3OriginalSection.style.display = 'none';
                
                if (stage2Section) {
                    stage2Section.classList.add('stage-modified');
                }
                if (taskWaterPipe) {
                    taskWaterPipe.classList.add('task-modified');
                }
            } else {
                if (changeSummaryCard) changeSummaryCard.style.display = 'none';
                if (stage2ChangeBadge) stage2ChangeBadge.style.display = 'none';
                if (taskWaterPipeBadge) taskWaterPipeBadge.style.display = 'none';
                if (stage3NewSection) stage3NewSection.style.display = 'none';
                if (stage3OriginalSection) stage3OriginalSection.style.display = 'block';
                
                if (stage2Section) {
                    stage2Section.classList.remove('stage-modified');
                }
                if (taskWaterPipe) {
                    taskWaterPipe.classList.remove('task-modified');
                }
            }
        }

        function updateOperationLog() {
            const logContainer = document.getElementById('operationLog');
            let logs = [];
            
            logs.push({ time: '01-10 15:00', content: '创建合同', user: '张三' });
            logs.push({ time: '01-10 15:30', content: '提交合同审核', user: '张三' });
            
            if (currentStatus === 'platform_reviewing') {
                logs.push({ time: '01-10 15:30', content: '进入平台审核', user: '系统' });
            }
            
            if (currentStatus === 'platform_rejected') {
                logs.push({ time: '01-10 16:00', content: '平台审核驳回', user: '运营人员', detail: '合同金额填写有误，请核实后重新提交' });
            }
            
            if (currentStatus === 'reviewed_pass') {
                logs.push({ time: '01-10 16:30', content: '合同审核通过', user: '运营人员' });
            }
            
            if (currentStatus === 'reviewed_reject') {
                logs.push({ time: '01-10 16:30', content: '合同审核驳回', user: '运营人员', detail: document.getElementById('rejectReasonContent').textContent || '合同金额与实际工程量不符，请核实后重新提交' });
            }
            
            if (currentStatus === 'change_reviewing') {
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '张三' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
            }
            
            if (currentStatus === 'change_reviewed_pass') {
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '张三' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
                logs.push({ time: '02-01 15:00', content: '变更审核通过', user: '运营人员' });
                logs.push({ time: '02-01 15:00', content: '变更已生效', user: '系统' });
            }
            
            if (currentStatus === 'change_reviewed_reject') {
                logs.push({ time: '02-01 14:00', content: '发起变更申请', user: '张三' });
                logs.push({ time: '02-01 14:00', content: '进入平台审核', user: '系统' });
                logs.push({ time: '02-01 15:00', content: '变更审核驳回', user: '运营人员', detail: document.getElementById('rejectReasonContent').textContent || '变更内容描述不清晰，缺少具体施工范围说明' });
            }
            
            if (currentStatus === 'confirmed' || currentStatus === 'signing' || currentStatus === 'signed') {
                logs.push({ time: '01-10 16:30', content: '平台审核通过', user: '运营人员' });
                logs.push({ time: '01-11 10:00', content: '发送确认申请', user: '张三' });
                logs.push({ time: '01-11 14:00', content: '确认合同', user: '李四' });
                logs.push({ time: '01-11 14:30', content: '双方确认完成', user: '系统' });
            }
            
            if (currentStatus === 'signing' || currentStatus === 'signed') {
                logs.push({ time: '01-12 09:00', content: '上传签约文件', user: '张三' });
            }
            
            if (currentStatus === 'signed') {
                logs.push({ time: '01-15 10:30', content: '确认签约', user: '李四' });
                logs.push({ time: '01-15 10:30', content: '合同签约完成', user: '系统' });
            }
            
            let html = '';
            logs.reverse().forEach(log => {
                html += `
                    <div class="log-item">
                        <span class="log-time">${log.time}</span>
                        <span class="log-content">${log.content}${log.detail ? '<br><span style="color: var(--text-tertiary); font-size: 12px;">' + log.detail + '</span>' : ''}</span>
                        <span class="log-user">${log.user}</span>
                    </div>
                `;
            });
            
            logContainer.innerHTML = html;
        }

        function updateReviewPanel() {
            const panel = document.getElementById('reviewPanel');
            const rejectInput = document.getElementById('rejectReasonInput');
            const panelTitle = panel.querySelector('.review-panel-title span:first-child');
            const statusBanner = document.getElementById('statusBanner');
            const changeReasonBanner = document.getElementById('changeReasonBanner');
            const contractPriceChange = document.getElementById('contractPriceChange');
            const contractAdditionChange = document.getElementById('contractAdditionChange');
            
            if (currentStatus === 'platform_reviewing' || currentStatus === 'change_reviewing') {
                panel.style.display = 'block';
                statusBanner.style.display = 'none';
                rejectInput.style.display = 'none';
                document.getElementById('rejectReason').value = '';
                
                if (panelTitle) {
                    panelTitle.textContent = currentStatus === 'change_reviewing' ? '🔍 变更审核' : '🔍 合同审核';
                }
                
                if (currentStatus === 'change_reviewing') {
                    changeReasonBanner.style.display = 'block';
                    if (contractPriceChange) contractPriceChange.style.display = 'block';
                    if (contractAdditionChange) contractAdditionChange.style.display = 'block';
                } else {
                    changeReasonBanner.style.display = 'none';
                    if (contractPriceChange) contractPriceChange.style.display = 'none';
                    if (contractAdditionChange) contractAdditionChange.style.display = 'none';
                }
            } else {
                panel.style.display = 'none';
                statusBanner.style.display = 'flex';
                changeReasonBanner.style.display = 'none';
                if (contractPriceChange) contractPriceChange.style.display = 'none';
                if (contractAdditionChange) contractAdditionChange.style.display = 'none';
            }
        }

        function showTaskDetail(name, executor, confirmers, executeStandard, confirmStandard, responsibleStandard) {
            document.getElementById('taskDetailTitle').textContent = name;
            document.getElementById('taskDetailExecutor').textContent = executor;
            
            const confirmerList = confirmers.split('、').map(c => {
                return `<span class="task-detail-person">
                    <span>👤</span>
                    <span>${c}</span>
                </span>`;
            }).join('');
            document.getElementById('taskDetailConfirmers').innerHTML = confirmerList;
            
            document.getElementById('taskDetailExecuteStandard').textContent = executeStandard;
            document.getElementById('taskDetailConfirmStandard').textContent = confirmStandard;
            document.getElementById('taskDetailResponsibleStandard').textContent = responsibleStandard;
            
            document.getElementById('taskDetailModal').classList.add('show');
        }

        function closeTaskDetail() {
            document.getElementById('taskDetailModal').classList.remove('show');
        }

        function updateStatusActions() {
            const actionsContainer = document.getElementById('statusActions');
            let actionsHtml = '';
            
            switch (currentStatus) {
                case 'platform_reviewing':
                case 'change_reviewing':
                    actionsHtml = '';
                    break;
                case 'reviewed_pass':
                    actionsHtml = `
                        <button class="pc-btn btn" onclick="exportContract()">导出合同</button>
                    `;
                    break;
                case 'reviewed_reject':
                    actionsHtml = '';
                    break;
                case 'signed':
                    actionsHtml = `
                        <button class="pc-btn btn" onclick="exportContract()">导出合同</button>
                    `;
                    break;
            }
            
            actionsContainer.innerHTML = actionsHtml;
        }

        function updateChangesContent() {
            const changeRecord1 = document.getElementById('changeRecord1');
            const changeRecord2 = document.getElementById('changeRecord2');
            const changeRecord3 = document.getElementById('changeRecord3');
            const noChangeRecord = document.getElementById('noChangeRecord');
            
            if (currentStatus === 'change_reviewing') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'none';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
            } else if (currentStatus === 'change_reviewed_pass') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'none';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
                if (changeRecord1) {
                    changeRecord1.querySelector('.change-record-status').textContent = '已生效';
                    changeRecord1.querySelector('.change-record-status').className = 'change-record-status completed';
                }
            } else if (currentStatus === 'change_reviewed_reject') {
                if (changeRecord1) changeRecord1.style.display = 'block';
                if (changeRecord2) changeRecord2.style.display = 'none';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
                if (changeRecord1) {
                    changeRecord1.querySelector('.change-record-status').textContent = '已驳回';
                    changeRecord1.querySelector('.change-record-status').className = 'change-record-status rejected';
                }
            } else if (currentStatus === 'signed') {
                if (changeRecord1) changeRecord1.style.display = 'none';
                if (changeRecord2) changeRecord2.style.display = 'block';
                if (changeRecord3) changeRecord3.style.display = 'block';
                if (noChangeRecord) noChangeRecord.style.display = 'none';
            } else {
                if (changeRecord1) changeRecord1.style.display = 'none';
                if (changeRecord2) changeRecord2.style.display = 'none';
                if (changeRecord3) changeRecord3.style.display = 'none';
                if (noChangeRecord) noChangeRecord.style.display = 'block';
            }
        }

        function showRejectInput() {
            const rejectInput = document.getElementById('rejectReasonInput');
            const showBtn = document.getElementById('showRejectBtn');
            const confirmBtn = document.getElementById('confirmRejectBtn');
            
            if (rejectInput.style.display === 'none') {
                rejectInput.style.display = 'block';
                showBtn.textContent = '取消驳回';
                confirmBtn.style.display = 'inline-block';
            } else {
                rejectInput.style.display = 'none';
                showBtn.textContent = '驳回';
                confirmBtn.style.display = 'none';
                document.getElementById('rejectReason').value = '';
            }
        }

        function approveContract() {
            const title = currentStatus === 'change_reviewing' ? '确认审核通过变更' : '确认审核通过';
            const message = currentStatus === 'change_reviewing' 
                ? '确定审核通过该变更申请吗？通过后变更将生效。' 
                : '确定审核通过该合同吗？通过后合同将进入待确认状态。';
            
            showConfirmModal(title, message, () => {
                showToast(currentStatus === 'change_reviewing' ? '变更审核通过' : '审核通过，合同已进入待确认状态');
                const nextStatus = currentStatus === 'change_reviewing' ? 'change_reviewed_pass' : 'reviewed_pass';
                switchStatus(nextStatus);
            });
        }

        function rejectContract() {
            const reasonInput = document.getElementById('rejectReason');
            const reason = reasonInput.value.trim();
            
            // 校验驳回原因（使用validation.js）
            const result = Validation.validate.textLength(reason, 500, true, '驳回原因');
            if (!result.valid) {
                showToast(result.message);
                reasonInput.focus();
                return;
            }
            
            const title = currentStatus === 'change_reviewing' ? '确认驳回变更' : '确认驳回';
            const message = currentStatus === 'change_reviewing' 
                ? '确定驳回该变更申请吗？驳回后变更将被取消。' 
                : '确定驳回该合同吗？驳回后合同将退回修改状态。';
            
            showConfirmModal(title, message, () => {
                showToast(currentStatus === 'change_reviewing' ? '变更已驳回' : '已驳回，合同退回修改状态');
                const nextStatus = currentStatus === 'change_reviewing' ? 'change_reviewed_reject' : 'reviewed_reject';
                switchStatus(nextStatus);
                
                document.getElementById('rejectReasonContent').textContent = reason;
                document.getElementById('rejectReasonInput').style.display = 'none';
                document.getElementById('showRejectBtn').textContent = '驳回';
                document.getElementById('confirmRejectBtn').style.display = 'none';
                document.getElementById('rejectReason').value = '';
            });
        }

        function exportContract() {
            showToast('合同导出功能开发中...');
        }

        function showConfirmModal(title, content, callback) {
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalContent').textContent = content;
            pendingAction = callback;
            document.getElementById('confirmModal').classList.add('show');
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').classList.remove('show');
            pendingAction = null;
        }

        function confirmAction() {
            if (pendingAction) {
                pendingAction();
            }
            closeConfirmModal();
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.75);
                color: #fff;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10000;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        function toggleUserDropdown() {
            document.getElementById('userDropdownMenu').classList.toggle('show');
        }

        function logout() {
            if (confirm('确定要退出登录吗？')) {
                window.location.href = 'pc-contract-list.html';
            }
        }

        document.addEventListener('click', function(e) {
            const dropdown = document.querySelector('.pc-user-dropdown');
            const menu = document.getElementById('userDropdownMenu');
            if (dropdown && menu && !dropdown.contains(e.target)) {
                menu.classList.remove('show');
            }
            
            const taskDetailModal = document.getElementById('taskDetailModal');
            if (taskDetailModal && e.target === taskDetailModal) {
                closeTaskDetail();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeTaskDetail();
            }
        });

        function switchTab(tabName, evt) {
            document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            evt.target.classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
        }

        function togglePageNav() {
            const wrapper = document.getElementById('pageNavWrapper');
            const nav = document.getElementById('pageNav');
            const toggle = wrapper.querySelector('.pc-page-nav-toggle');
            nav.classList.toggle('collapsed');
            wrapper.classList.toggle('collapsed');
            if (nav.classList.contains('collapsed')) {
                toggle.textContent = '▶';
            } else {
                toggle.textContent = '◀';
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const rejectReason = urlParams.get('rejectReason');
        
        if (status && statusConfig[status]) {
            currentStatus = status;
        }
        
        if (rejectReason) {
            document.getElementById('rejectReasonContent').textContent = decodeURIComponent(rejectReason);
        }

        updateUI();