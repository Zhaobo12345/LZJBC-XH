import io, re

s = io.open(r'D:\TraeProject\LZJPro\LZJBC-XH\PRD-\u4efb\u52a1\u6a21\u5757\u8be6\u7ec6\u89c4\u683c.html', encoding='utf-8').read()
orig = len(s)

# ===== 1. TOC: Add partition labels =====
# Before chapter 1 (line 230)
old1 = '<li><a href="#task-status-machine">\u4e00\u3001\u4efb\u52a1\u72b6\u6001\u673a</a></li>'
new1 = '<li class="toc-group-title">\u516c\u5171\u89c4\u683c</li>\n            <li><a href="#task-status-machine">\u4e00\u3001\u4efb\u52a1\u72b6\u6001\u673a</a></li>'
s = s.replace(old1, new1)

# Before chapter 2 (service side)
old2 = '<li><a href="#page-task-list-service">\u4e8c\u3001\u5168\u90e8\u4efb\u52a1\uff08\u670d\u52a1\u65b9\uff09</a></li>'
new2 = '<li class="toc-group-title">\u670d\u52a1\u65b9\u5c0f\u7a0b\u5e8f</li>\n            <li><a href="#page-task-list-service">\u4e8c\u3001\u5168\u90e8\u4efb\u52a1\uff08\u670d\u52a1\u65b9\uff09</a></li>'
s = s.replace(old2, new2)

# Before chapter 5 (owner side)
old3 = '<li><a href="#page-task-list-owner">\u4e94\u3001\u5168\u90e8\u4efb\u52a1\uff08\u4e1a\u4e3b\uff09</a></li>'
new3 = '<li class="toc-group-title">\u4e1a\u4e3b\u5c0f\u7a0b\u5e8f</li>\n            <li><a href="#page-task-list-owner">\u4e94\u3001\u5168\u90e8\u4efb\u52a1\uff08\u4e1a\u4e3b\uff09</a></li>'
s = s.replace(old3, new3)

# ===== 2. Change service-side role to "全部" =====
# Line 363: "适用角色" value
old_role1 = '<div class="info-value">\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\u3001\u6267\u884c\u4eba</div>'
new_role1 = '<div class="info-value">\u5168\u90e8\uff08\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\u3001\u6267\u884c\u4eba\u3001\u786e\u8ba4\u4eba\u4ec5\u67e5\u770b\uff09</div>'
cnt1 = s.count(old_role1)
s = s.replace(old_role1, new_role1)
print('Role 1 replaced:', cnt1)

# Line 581: task detail role
old_role2 = '<div class="info-value">\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\u3001\u6267\u884c\u4eba</div>'
new_role2 = '<div class="info-value">\u5168\u90e8</div>'
cnt2 = s.count(old_role2)
s = s.replace(old_role2, new_role2)
print('Role 2 replaced:', cnt2)

# Line 917: acceptance role
old_role3 = '<div class="info-value">\u786e\u8ba4\u4eba\uff08\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\uff09</div>'
new_role3 = '<div class="info-value">\u5168\u90e8\uff08\u786e\u8ba4\u4eba\u8eab\u4efd\u65f6\u53ef\u64cd\u4f5c\u9a8c\u6536\uff09</div>'
cnt3 = s.count(old_role3)
s = s.replace(old_role3, new_role3)
print('Role 3 replaced:', cnt3)

# Line 1125/1389: todo-list roles - update from whatever they are
old_role4 = '<div class="info-label">\u9002\u7528\u89d2\u8272</div>\n                        <div class="info-value">\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\u3001\u6267\u884c\u4eba\u3001\u786e\u8ba4\u4eba</div>'
new_role4 = '<div class="info-label">\u9002\u7528\u89d2\u8272</div>\n                        <div class="info-value">\u5168\u90e8</div>'
if old_role4 in s:
    s = s.replace(old_role4, new_role4)
    print('Role 4 replaced')
else:
    # Try partial
    old_role4b = '<div class="info-value">\u9879\u76ee\u7ecf\u7406\u3001\u65bd\u5de5\u7ec4\u957f\u3001\u6267\u884c\u4eba\u3001\u786e\u8ba4\u4eba</div>'
    if old_role4b in s:
        s = s.replace(old_role4b, '<div class="info-value">\u5168\u90e8</div>')
        print('Role 4b replaced')

# ===== 3. Enhance Chapter 2 with per-status detail table =====
# Find the end of 2.6 分页规格 section - add a new 2.7 subsection before Chapter 3
old_ch3 = '<!-- ==================== 2. \u4efb\u52a1\u8be6\u60c5\u9875\uff08\u670d\u52a1\u65b9\uff09 ==================== -->'
new_27 = '''                <div class="subsection-title">2.7 任务状态详解（服务方全部任务列表）</div>
                <div class="note" style="margin:12px 0;"><div class="note-title">以下按任务在列表中的实际状态逐一说明</div><p>服务方「全部任务」页通过底部状态Tab（全部 / 待开始 / 执行中 / 待确认 / 已完成）筛选展示，每种状态对应不同的卡片样式、操作入口与交互逻辑。</p></div>
                <table>
                    <thead><tr><th style="width:10%">Tab</th><th style="width:10%">状态标识</th><th style="width:20%">卡片展示字段</th><th style="width:10%">角色操作</th><th>交互流程</th></tr></thead>
                    <tbody>
                        <tr><td>全部</td><td>—</td><td>任务名称 · 所属阶段 · 执行人 · 确认人 · 截止时间 · 状态badge</td><td>按角色过滤可操作项</td><td>默认展示全部状态任务；点击卡片跳转任务详情页；Tab角标显示各状态数量</td></tr>
                        <tr><td>待开始</td><td>⏸ 待开始</td><td>任务名称 · 所属阶段 · 执行人 · 截止时间 · 状态badge</td><td>执行人：开始执行</td><td>执行人选项卡 → 点击「开始执行」→ 任务状态变为「执行中」→ 自动跳转任务详情页进入执行视角</td></tr>
                        <tr><td>执行中</td><td>▶ 执行中</td><td>任务名称 · 所属阶段 · 执行人 · 已耗时 · 状态badge</td><td>执行人：上传记录 · 提交验收</td><td>执行人选项卡 → 点击「上传记录」→ 弹出上传弹窗（支持图片/视频/语音+说明）→ 提交执行记录后返回；点击「提交验收」→ 二次确认 → 任务状态变为「待确认」→ 通知确认人</td></tr>
                        <tr><td>待确认</td><td>⏳ 待确认</td><td>任务名称 · 所属阶段 · 确认人列表 · 状态badge · 确认进度</td><td>确认人：确认通过 · 驳回<br>执行人：查看进度</td><td>确认人选项卡 → 点击卡片跳转验收页 → 查看执行记录 → 确认通过（可选评价）或驳回（需填写原因）；所有确认人通过后任务变为「已完成」；任一驳回则任务回到「执行中」并通知执行人</td></tr>
                        <tr><td>已完成</td><td>✓ 已完成</td><td>任务名称 · 所属阶段 · 完成时间 · 评价标签 · 状态badge</td><td>全部角色：查看详情</td><td>点击卡片查看任务详情（只读）；有业主评价则显示评价标签和星级</td></tr>
                    </tbody>
                </table>
                <p style="margin-top:12px;color:var(--text-secondary);font-size:13px;">过滤逻辑：Tab切换时按任务 <code>data-status</code> 属性筛选显示。<strong>全部</strong>Tab展示所有任务；其他Tab仅展示匹配状态的任务卡片。已驳回任务归入「待开始」Tab，由执行人重新执行。</p>
            </div>
        </div>

        <!-- ==================== 2. \u4efb\u52a1\u8be6\u60c5\u9875\uff08\u670d\u52a1\u65b9\uff09 ==================== -->'''
if old_ch3 in s:
    s = s.replace(old_ch3, new_27)
    print('Added 2.7')
else:
    print('Chapter 3 marker not found')

# ===== 4. TOC: Add 2.7 link =====
old_toc_3 = '<li><a href="#page-task-detail-service">\u4e09\u3001\u4efb\u52a1\u8be6\u60c5\u9875\uff08\u670d\u52a1\u65b9\uff09</a></li>'
new_toc_3 = '<li><a href="#page-task-list-service">2.7 \u4efb\u52a1\u72b6\u6001\u8be6\u89e3\uff08\u670d\u52a1\u65b9\uff09</a></li>\n            ' + old_toc_3
if old_toc_3 in s:
    s = s.replace(old_toc_3, new_toc_3)
    print('Added TOC 2.7')
else:
    print('TOC Chapter 3 not found')

# Verify
for t in ['div', 'table', 'tr', 'td']:
    o = s.count('<' + t)
    c = s.count('</' + t + '>')
    if o != c:
        print('MISMATCH', t, o, c)

print('Orig:', orig, 'New:', len(s))
io.open(r'D:\TraeProject\LZJPro\LZJBC-XH\PRD-\u4efb\u52a1\u6a21\u5757\u8be6\u7ec6\u89c4\u683c.html', 'w', encoding='utf-8').write(s)
