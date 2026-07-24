function toggleUserDropdown() {
            const menu = document.getElementById('userDropdownMenu');
            menu.classList.toggle('show');
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
        });

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

        let currentReviewId = null;
        let currentReviewType = null;

        const allContracts = [
            { id: 1, name: '水电分包合同-西湖区别墅', project: '西湖区别墅', type: 'water', typeName: '水电工程', amount: '￥50,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 10:30', rejectReason: '' },
            { id: 2, name: '泥瓦分包合同-余杭区平层', project: '余杭区平层', type: 'tile', typeName: '泥瓦工程', amount: '￥35,000', status: 'pending_review', statusName: '合同待审核', statusClass: 'pending-review', time: '2024-01-26 09:15', rejectReason: '' },
            { id: 3, name: '木工分包合同-拱墅区公寓', project: '拱墅区公寓', type: 'wood', typeName: '木工工程', amount: '￥45,000', status: 'confirming_receiver', statusName: '待我方确认', statusClass: 'confirming-receiver', time: '2024-01-25 16:00', rejectReason: '' },
            { id: 4, name: '油漆分包合同-滨江区住宅', project: '滨江区住宅', type: 'paint', typeName: '油漆工程', amount: '￥28,000', status: 'signing', statusName: '待确认签约', statusClass: 'signing', time: '2024-01-24 14:30', rejectReason: '' },
            { id: 5, name: '水电分包合同-萧山区别墅', project: '萧山区别墅', type: 'water', typeName: '水电工程', amount: '￥68,000', status: 'signed', statusName: '已签约', statusClass: 'signed', time: '2024-01-20 11:00', rejectReason: '' },
            { id: 6, name: '泥瓦分包合同-上城区商铺', project: '上城区商铺', type: 'tile', typeName: '泥瓦工程', amount: '￥42,000', status: 'draft', statusName: '拟定中', statusClass: 'draft', time: '2024-01-19 15:45', rejectReason: '' },
            { id: 7, name: '木工分包合同-下城区写字楼', project: '下城区写字楼', type: 'wood', typeName: '木工工程', amount: '￥55,000', status: 'review_rejected', statusName: '审核驳回', statusClass: 'review-rejected', time: '2024-01-18 10:20', rejectReason: '' },
            { id: 8, name: '油漆分包合同-江干区住宅', project: '江干区住宅', type: 'paint', typeName: '油漆工程', amount: '￥32,000', status: 'changing', statusName: '变更待审核', statusClass: 'changing', time: '2024-01-15 09:00', rejectReason: '' },
            { id: 9, name: '水电分包合同-临平区别墅', project: '临平区别墅', type: 'water', typeName: '水电工程', amount: '￥72,000', status: 'reviewed_pass', statusName: '已通过', statusClass: 'confirmed', time: '2024-01-14 08:30', rejectReason: '' },
            { id: 10, name: '泥瓦分包合同-钱塘区公寓', project: '钱塘区公寓', type: 'tile', typeName: '泥瓦工程', amount: '￥38,000', status: 'reviewed_reject', statusName: '已驳回', statusClass: 'review-rejected', time: '2024-01-13 16:00', rejectReason: '合同金额与实际工程量不符，请核实后重新提交' },
            { id: 11, name: '水电分包合同-富阳区别墅', project: '富阳区别墅', type: 'water', typeName: '水电工程', amount: '￥85,000', status: 'change_reviewed_pass', statusName: '变更已通过', statusClass: 'confirmed', time: '2024-01-12 14:00', rejectReason: '' },
            { id: 12, name: '木工分包合同-桐庐县住宅', project: '桐庐县住宅', type: 'wood', typeName: '木工工程', amount: '￥48,000', status: 'change_reviewed_reject', statusName: '变更已驳回', statusClass: 'review-rejected', time: '2024-01-11 10:30', rejectReason: '变更内容描述不清晰，缺少具体施工范围说明' },
        ];

        function renderContractList() {
            const tbody = document.getElementById('contractTableBody');
            
            const contracts = allContracts.filter(c => 
                c.status === 'pending_review' || 
                c.status === 'changing' || 
                c.status === 'reviewed_pass' || 
                c.status === 'reviewed_reject' ||
                c.status === 'change_reviewed_pass' ||
                c.status === 'change_reviewed_reject'
            );
            
            tbody.innerHTML = contracts.map(c => {
                let actionBtns = '';
                let rejectReasonHtml = '';
                
                if (c.status === 'pending_review') {
                    actionBtns = `<button class="action-btn primary" onclick="goToReview(${c.id}, 'contract')">去审核</button>`;
                } else if (c.status === 'changing') {
                    actionBtns = `<button class="action-btn primary" onclick="goToReview(${c.id}, 'change')">去审核</button>`;
                } else if (c.status === 'reviewed_pass') {
                    actionBtns = `<span style="color: var(--success-color);">✓ 已通过</span>`;
                } else if (c.status === 'reviewed_reject') {
                    actionBtns = `<span style="color: var(--error-color);">✗ 已驳回</span>`;
                    if (c.rejectReason) {
                        rejectReasonHtml = `<div style="font-size: 12px; color: var(--error-color); margin-top: 4px;" title="${c.rejectReason}">驳回原因：${c.rejectReason.length > 20 ? c.rejectReason.substring(0, 20) + '...' : c.rejectReason}</div>`;
                    }
                } else if (c.status === 'change_reviewed_pass') {
                    actionBtns = `<span style="color: var(--success-color);">✓ 变更已通过</span>`;
                } else if (c.status === 'change_reviewed_reject') {
                    actionBtns = `<span style="color: var(--error-color);">✗ 变更已驳回</span>`;
                    if (c.rejectReason) {
                        rejectReasonHtml = `<div style="font-size: 12px; color: var(--error-color); margin-top: 4px;" title="${c.rejectReason}">驳回原因：${c.rejectReason.length > 20 ? c.rejectReason.substring(0, 20) + '...' : c.rejectReason}</div>`;
                    }
                }
                
                return `
                    <tr data-status="${c.status}" data-type="${c.type}">
                        <td><span class="contract-name" onclick="viewContract(${c.id}, '${c.status}', '')">${c.name}</span></td>
                        <td><span class="project-link" onclick="viewProject(${c.id})">${c.project}</span></td>
                        <td>${c.typeName}</td>
                        <td>${c.amount}</td>
                        <td><span class="status-tag ${c.statusClass}">${c.statusName}</span></td>
                        <td>${c.time}</td>
                        <td>
                            <div class="action-btns">${actionBtns}</div>
                            ${rejectReasonHtml}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function goToReview(id, type) {
            if (type === 'contract') {
                window.location.href = 'pc-contract-detail.html?id=' + id + '&status=platform_reviewing';
            } else if (type === 'change') {
                window.location.href = 'pc-contract-detail.html?id=' + id + '&status=change_reviewing';
            }
        }

        function filterContracts() {
            const status = document.getElementById('statusFilter').value;
            const type = document.getElementById('typeFilter').value;
            const keyword = document.getElementById('searchInput').value.toLowerCase();
            
            const rows = document.querySelectorAll('#contractTableBody tr');
            rows.forEach(row => {
                const rowStatus = row.dataset.status;
                const rowType = row.dataset.type;
                const text = row.textContent.toLowerCase();
                
                let statusMatch = true;
                if (status) {
                    if (status === 'pending_review') {
                        statusMatch = rowStatus === 'pending_review';
                    } else if (status === 'change_review') {
                        statusMatch = rowStatus === 'changing';
                    } else if (status === 'reviewed') {
                        statusMatch = rowStatus === 'reviewed_pass' || rowStatus === 'reviewed_reject' || rowStatus === 'change_reviewed_pass' || rowStatus === 'change_reviewed_reject';
                    } else {
                        statusMatch = rowStatus === status;
                    }
                }
                
                const typeMatch = !type || rowType === type;
                const keywordMatch = !keyword || text.includes(keyword);
                
                row.style.display = (statusMatch && typeMatch && keywordMatch) ? '' : 'none';
            });
        }

        function resetFilters() {
            document.getElementById('statusFilter').value = '';
            document.getElementById('typeFilter').value = '';
            document.getElementById('searchInput').value = '';
            filterContracts();
        }

        function showReviewModal(id, type) {
            currentReviewId = id;
            currentReviewType = type;
            
            document.getElementById('reviewModalTitle').textContent = type === 'pass' ? '审核通过' : '审核驳回';
            document.getElementById('rejectReasonSection').style.display = type === 'reject' ? 'block' : 'none';
            document.getElementById('reviewConfirmBtn').textContent = type === 'pass' ? '确认通过' : '确认驳回';
            document.getElementById('reviewConfirmBtn').className = type === 'pass' ? 'pc-btn pc-btn-primary' : 'pc-btn pc-btn-danger';
            
            document.getElementById('reviewModal').classList.add('show');
        }

        function closeReviewModal() {
            document.getElementById('reviewModal').classList.remove('show');
            document.getElementById('rejectReason').value = '';
            currentReviewId = null;
            currentReviewType = null;
        }

        function confirmReview() {
            if (currentReviewType === 'reject') {
                const reason = document.getElementById('rejectReason').value.trim();
                if (!reason) {
                    alert('请输入驳回原因');
                    return;
                }
            }
            
            closeReviewModal();
            
            if (currentReviewType === 'pass') {
                showToast('✅', '审核通过', '合同已通过审核，将通知合同确认方');
            } else {
                showToast('⚠️', '审核驳回', '合同已驳回，将通知创建方进行修改');
            }
        }

        function showToast(icon, title, message) {
            document.getElementById('toastIcon').textContent = icon;
            document.getElementById('toastTitle').textContent = title;
            document.getElementById('toastMessage').textContent = message;
            document.getElementById('toastModal').classList.add('show');
        }

        function closeToastModal() {
            document.getElementById('toastModal').classList.remove('show');
        }

        function viewContract(id, status, rejectReason) {
            let targetStatus = status;
            
            if (status === 'pending_review') {
                targetStatus = 'platform_reviewing';
            } else if (status === 'changing') {
                targetStatus = 'change_reviewing';
            }
            
            let url = 'pc-contract-detail.html?id=' + id + '&status=' + targetStatus;
            if (rejectReason) {
                url += '&rejectReason=' + encodeURIComponent(rejectReason);
            }
            location.href = url;
        }

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('pc-modal-overlay')) {
                e.target.classList.remove('show');
            }
        });

        renderContractList();
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.innerHTML = `
                <option value="">全部状态</option>
                <option value="pending_review">合同待审核</option>
                <option value="change_review">变更待审核</option>
                <option value="reviewed">已审核</option>
            `;
        }