# -*- coding: utf-8 -*-
"""把「复制发起」能力补充到两份 PRD：
- PRD-项目模块详细规格.html（项目架构页）
- PRD-合同模块详细规格.html（工人合同详情页·发起方）
仅更新文档，不触碰任何原型页面。每处替换强制断言命中次数。
"""

import io, re, sys

ROOT = "D:/TraeProject/LZJPro/LZJBC-XH/"
P = ROOT + "PRD-项目模块详细规格.html"
C = ROOT + "PRD-合同模块详细规格.html"

report = []


def load(path):
    return io.open(path, encoding="utf-8").read()


def save(path, s):
    io.open(path, "w", encoding="utf-8", newline="").write(s)


def rep(s, old, new, name, expect=1):
    n = s.count(old)
    if n != expect:
        raise SystemExit("ASSERT FAIL [%s]: expected %d, got %d" % (name, expect, n))
    report.append("OK  %s (%d)" % (name, n))
    return s.replace(old, new)


def rep_line_by_key(s, key, new_line_or_lines, name, expect=1):
    """按唯一关键字定位行，整行替换（单/多行）"""
    lines = s.split("\n")
    idxs = [i for i, l in enumerate(lines) if key in l]
    if len(idxs) != expect:
        raise SystemExit("ASSERT FAIL [%s]: key %r hit %d, expected %d" % (name, key, len(idxs), expect))
    i = idxs[0]
    lines[i] = new_line_or_lines
    report.append("OK  %s (line %d)" % (name, i + 1))
    return "\n".join(lines)


# ==================================================================
# 一、PRD-项目模块详细规格.html —— 项目架构页
# ==================================================================
s = load(P)

# P1 目录新增 6.12
s = rep(s,
        '<li><a href="#sub-6-11">6.11 添加施工组功能规格</a></li>',
        '<li><a href="#sub-6-11">6.11 添加施工组功能规格</a></li>\n'
        '<li><a href="#sub-6-12">6.12 复制发起功能规格</a></li>',
        "P1 TOC 6.12")

# P2 6.2 架构图：头部统计增加「合同份数」（保持等宽）
lines = s.split("\n")
target = [i for i, l in enumerate(lines) if "工作组数量统计 + 成员数量统计" in l]
if len(target) != 1:
    raise SystemExit("ASSERT FAIL [P2]: stats line hit %d" % len(target))
i = target[0]
inner = lines[i][1:-1]
new_inner = "  - 工作组数量统计 + 成员数量统计 + 合同份数统计"
new_inner = new_inner[:len(inner)] if len(new_inner) > len(inner) else new_inner + " " * (len(inner) - len(new_inner))
lines[i] = lines[i][0] + new_inner + lines[i][-1]
s = "\n".join(lines)
report.append("OK  P2 6.2 头部统计「合同份数」")

# P3 6.2 结构图下方补充说明（多份合同 / 标签份数 / 复制发起）
s = rep(s,
        '                </div>\n            </div>\n\n            <div class="subsection" id="sub-6-3">',
        '                </div>\n'
        '                <p>一个工作组可存在<strong>多份合同</strong>：存在多份时，架构头部在「工作组数量 / 成员数量」之外追加'
        '<strong>合同份数统计</strong>；节点合同状态标签追加份数（如「已签约 · 2份合同」）。'
        '每份合同在「查看合同」弹窗内独立成行展示，并可 <strong>单独「复制发起」</strong>'
        '（详见 <a href="#sub-6-12" style="color: var(--primary-color);">6.12 复制发起功能规格</a>）。</p>\n'
        '            </div>\n\n            <div class="subsection" id="sub-6-3">',
        "P3 6.2 多份合同说明")

# P4 6.4 节点操作规格：查看合同补充复制发起、新增复制发起行、创建合同触发条件更新
s = rep(s,
        '                        <tr>\n'
        '                            <td>查看合同</td>\n'
        '                            <td>工作组</td>\n'
        '                            <td>有数据权限</td>\n'
        '                            <td>查看该工作组的合同列表</td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>创建合同</td>\n'
        '                            <td>工作组</td>\n'
        '                            <td>待创建合同</td>\n'
        '                            <td>在工作组内的人员可以为工作组创建新合同</td>\n'
        '                        </tr>',
        '                        <tr>\n'
        '                            <td>查看合同</td>\n'
        '                            <td>工作组</td>\n'
        '                            <td>有数据权限</td>\n'
        '                            <td>查看该工作组的合同列表（支持<strong>多份</strong>）；每份合同行内提供「📋 复制发起」，'
        '详见 <a href="#sub-6-12" style="color: var(--primary-color);">6.12 复制发起功能规格</a></td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>复制发起</td>\n'
        '                            <td>工作组</td>\n'
        '                            <td>该工作组已存在合同 + 有创建合同权限</td>\n'
        '                            <td>以该工作组名下<strong>指定的某一份合同</strong>为蓝本，发起一份同类型新合同'
        '（详见 <a href="#sub-6-12" style="color: var(--primary-color);">6.12</a>）；原合同不受影响</td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>创建合同</td>\n'
        '                            <td>工作组</td>\n'
        '                            <td>待创建合同；已存在合同时改由「复制发起 / 创建方式」追加新合同</td>\n'
        '                            <td>在工作组内的人员可以为工作组创建新合同；已有合同的工作组通过「复制发起」追加新的同类型合同</td>\n'
        '                        </tr>',
        "P4 6.4 节点操作规格")

# P5 6.6 概述：取消单合同限制
s = rep_line_by_key(
    s,
    "当工作组尚未创建合同时",
    '                <p>项目架构页的工作组节点中，当工作组尚未创建合同时（显示“待创建合同”标签），点击“创建合同”操作按钮可创建新合同。'
    '<strong>一个工作组可存在多份合同</strong>：已有合同的工作组改由「复制发起」追加新的同类型合同'
    '（详见 <a href="#sub-6-12" style="color: var(--primary-color);">6.12 复制发起功能规格</a>）。</p>',
    "P5 6.6 概述")

# P6 6.6.1 前置校验2：替换旧的「一个工作组只能有一个合同」
s = rep(s,
        '                        <tr>\n'
        '                            <td>前置校验2</td>\n'
        '                            <td>一个工作组只能有一个合同，已有合同不展示创建合同入口,展示查看合同入口</td>\n'
        '                        </tr>',
        '                        <tr>\n'
        '                            <td>前置校验2</td>\n'
        '                            <td>已有合同时该节点<strong>不展示「创建合同」入口、展示「查看合同」入口</strong>，'
        '新合同通过「查看合同」内的<b>按份「复制发起」</b>追加；若「创建合同」入口在已有合同的工作组被触发，'
        '<b>不再阻断</b>，改为弹出「创建方式」供选择（复制发起（推荐）/ 空白新建）</td>\n'
        '                        </tr>',
        "P6 6.6.1 前置校验2")

# P7 6.7 查看合同：列表化 + 每份复制发起
s = rep(s,
        '                        <tr>\n'
        '                            <td>合同列表</td>\n'
        '                            <td>每个合同显示图标📄+合同名称+状态，点击跳转<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页</a></td>\n'
        '                        </tr>',
        '                        <tr>\n'
        '                            <td>聚合统计行</td>\n'
        '                            <td>列表顶部显示「共 N 份 · 已签约 X 份」统计行（contract-aggregate 蓝底样式），'
        '并附「复制发起以所选份为蓝本」说明</td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>合同列表</td>\n'
        '                            <td>支持<strong>多份合同</strong>，逐份独立成行：图标📄 + 合同名称（单行省略）+ '
        '状态与摘要（如「状态：已签约 · 乙方：张建国 · 已履约 80%」），点击跳转'
        '<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页</a></td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>复制发起</td>\n'
        '                            <td>每份合同行内右侧「📋 复制发起」按钮：以<b>该份合同</b>为蓝本跳转复制发起页'
        '（详见 <a href="#sub-6-12" style="color: var(--primary-color);">6.12</a>）。'
        '点击该按钮仅触发复制发起，<b>不触发整行的合同详情跳转</b></td>\n'
        '                        </tr>',
        "P7 6.7 查看合同列表化")

# P8 6.8 限制规则：判定口径覆盖全部合同
s = rep(s,
        '                            <td>"该工作组尚未创建合同，请先创建合同后再添加子级工作组"</td>\n'
        '                        </tr>\n'
        '                    </tbody>\n'
        '                </table>\n'
        '            </div>',
        '                            <td>"该工作组尚未创建合同，请先创建合同后再添加子级工作组"</td>\n'
        '                        </tr>\n'
        '                    </tbody>\n'
        '                </table>\n'
        '                <p>上述限制的判定口径覆盖该工作组名下的<strong>全部合同</strong>（支持多份）：'
        '任意一份合同满足条件即触发限制，不再仅校验单一合同。</p>\n'
        '            </div>',
        "P8 6.8 判定口径")

# P9 6.9 交互逻辑：创建合同行更新 + 新增复制发起行
s = rep(s,
        '                        <tr>\n'
        '                            <td>工作组操作</td>\n'
        '                            <td>"创建合同"</td>\n'
        '                            <td>点击</td>\n'
        '                            <td>校验权限+是否已有合同→打开创建合同页面→填写→校验→跳转<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页（拟定中）</a></td>\n'
        '                        </tr>',
        '                        <tr>\n'
        '                            <td>工作组操作</td>\n'
        '                            <td>"创建合同"</td>\n'
        '                            <td>点击</td>\n'
        '                            <td>校验权限+是否已有合同→无合同则打开创建合同页面；已有合同则弹「创建方式」'
        '（复制发起（推荐）/ 空白新建）→填写→校验→跳转<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页（拟定中）</a></td>\n'
        '                        </tr>\n'
        '                        <tr>\n'
        '                            <td>合同列表弹窗</td>\n'
        '                            <td>每份合同行内"📋 复制发起"</td>\n'
        '                            <td>点击</td>\n'
        '                            <td>校验<b>创建合同权限</b>→以该份合同为蓝本跳转'
        '<a href="service-miniapp/contract-copy-initiate.html" target="_blank">复制发起页</a>'
        '（携带所属工作组与蓝本合同标识）</td>\n'
        '                        </tr>',
        "P9 6.9 交互逻辑")

# P10 新增 6.12 章节
NEW_612 = '''            <div class="subsection" id="sub-6-12">
                <div class="subsection-title">6.12 复制发起功能规格</div>
                <p>「复制发起」指以<strong>已存在的某一份合同</strong>为蓝本，快速发起一份同类型的新合同：沿用蓝本合同的合同类型、文本模板、阶段任务、金额、工期、条款与附件，各项均可在复制发起页修改。<strong>原合同不做任何写操作、不受影响</strong>。</p>
                <table>
                    <thead>
                        <tr>
                            <th>属性</th>
                            <th>规格</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>功能定位</td>
                            <td>同类型合同的快速复制入口，减少重复填写；<b>按「份」发起</b>——一次复制仅对应一份蓝本合同</td>
                        </tr>
                        <tr>
                            <td>数据模型</td>
                            <td>一个工作组可存在<strong>多份合同</strong>（工作组名称 → 合同数组）；新增合同不覆盖、不顶替既有合同</td>
                        </tr>
                        <tr>
                            <td>主入口</td>
                            <td>工作组「查看合同」弹窗内，<strong>每份合同行右侧的「📋 复制发起」按钮</strong>（见 6.7）</td>
                        </tr>
                        <tr>
                            <td>次入口</td>
                            <td>点击「📝 创建合同」且该工作组已存在合同时，弹「创建方式」选择：<b>复制发起（推荐）</b>默认以最新一份已签约合同为蓝本；「空白新建」跳转创建合同页（<a href="service-miniapp/create-contract.html" target="_blank">create-contract.html</a>）</td>
                        </tr>
                        <tr>
                            <td>权限规则</td>
                            <td><strong>与「创建合同」权限规则完全一致</strong>：由同一创建合同权限位控制，无该权限的人员不发起；校验不通过时提示“您没有创建合同的权限”</td>
                        </tr>
                        <tr>
                            <td>目标页面</td>
                            <td>独立页面（<a href="service-miniapp/contract-copy-initiate.html" target="_blank">contract-copy-initiate.html</a>），携带参数：所属工作组（<code>group</code>）、蓝本合同标识（<code>source</code>）、来源标识（<code>from=architecture</code>）</td>
                        </tr>
                        <tr>
                            <td>发起页形态</td>
                            <td>沿用拟定中页布局，各字段预填蓝本合同取值并标注「沿用 / 已调整」，全部可编辑；底部为「取消 / 仅保存 / 提交并邀请乙方」</td>
                        </tr>
                        <tr>
                            <td>隶属架构层级</td>
                            <td>默认归入蓝本合同所属层级，可更换为同项目的其他层级（可选二级 / 三级，且仅限同工种或尚无合同的层级）</td>
                        </tr>
                        <tr>
                            <td>结果</td>
                            <td>提交并邀请乙方校验通过后，生成新的同类型合同（拟定中），气泡提示消失后进入该合同的「确认中（发起方）」；工作组合同份数与节点标签同步更新</td>
                        </tr>
                    </tbody>
                </table>

                <div class="subsection-title" style="font-size: 14px; margin-top: 16px;">6.12.1 对原有交互的影响</div>
                <ul style="font-size:13px;line-height:1.9;">
                    <li><strong>取消「一个工作组只能有一个合同」的限制</strong>：工作组可拥有多份合同（见 6.6 前置校验2）。</li>
                    <li><strong>头部统计</strong>：新增「合同份数」统计项，与工作组数量、成员数量并列（见 6.2）。</li>
                    <li><strong>查看合同</strong>：由单卡片改为「聚合统计行 + 多份合同列表」，每份独立可点击跳转详情，并各自带「复制发起」（见 6.7）。</li>
                    <li><strong>退出 / 删除 / 添加子级</strong>：原有限制规则保持生效，判定口径由单份合同改为该工作组名下任意一份合同满足即触发（见 6.8）。</li>
                    <li><strong>创建合同</strong>：已有合同的工作组不再展示「创建合同」入口，改由「查看合同」内的按份复制发起追加新合同（见 6.4 / 6.9）。</li>
                </ul>
            </div>
'''
s = rep(s,
        '                </div>\n            </div>\n        </div>\n\n'
        '        <!-- ==================== 7. 项目成员页（服务方小程序） ==================== -->',
        '                </div>\n            </div>\n' + NEW_612 + '        </div>\n\n'
        '        <!-- ==================== 7. 项目成员页（服务方小程序） ==================== -->',
        "P10 新增 6.12 章节")

save(P, s)

# ==================================================================
# 二、PRD-合同模块详细规格.html —— 工人合同详情页（发起方）
# ==================================================================
s2 = load(C)

# C1 目录新增 7.12（限定在 TOC 区域）
lines = s2.split("\n")
toc_idx = None
for i, l in enumerate(lines[:400]):
    if ">7.11 阶段任务区任务项展示与点击交互（按状态）<" in l:
        toc_idx = i
        break
if toc_idx is None:
    raise SystemExit("ASSERT FAIL [C1]: TOC 7.11 line not found")
lines[toc_idx] = lines[toc_idx] + '\n<li><a href="#sec-7-12">7.12 复制发起入口规格（工人合同详情页·发起方）</a></li>'
s2 = "\n".join(lines)
report.append("OK  C1 TOC 7.12")

# C2 7.10 更多菜单表：发起方各态新增「复制发起」
key = "其余非终态（发起方各态 / 变更各态 / 拟定中）"
lines = s2.split("\n")
idxs = [i for i, l in enumerate(lines) if key in l]
if len(idxs) != 1:
    raise SystemExit("ASSERT FAIL [C2]: hit %d" % len(idxs))
i = idxs[0]
old_line = lines[i]
# 保留该行原有的 data-page-node-id，仅重写文案
def first_id(tag, line):
    m = re.search(tag + r'[^>]*data-page-node-id="([^"]+)"', line)
    if m:
        return m.group(1)
    m2 = re.search(r'data-page-node-id="([^"]+)"', line)
    return m2.group(1) if m2 else None

ids = re.findall(r'data-page-node-id="([^"]+)"', old_line)
tr_id = ids[0] if len(ids) > 0 else None
td1_id = ids[1] if len(ids) > 1 else None
td2_id = ids[2] if len(ids) > 2 else None
row1 = ('<tr data-page-node-id="%s"><td data-page-node-id="%s">发起方视角各非终态（拟定中 / 确认中 / 已签约 / 发起方变更各态）</td>'
        '<td data-page-node-id="%s"><strong>「📑 复制发起」置首</strong>，其后依次为「版本记录」/「变更记录」/「导出合同文件」'
        '（复制发起规则见 <a href="#sec-7-12" data-page-node-id="a712a">7.12</a>）</td></tr>') % (tr_id, td1_id, td2_id)
row2 = ('<tr data-page-node-id="c2row"><td data-page-node-id="c2td1">其余非终态（受邀方非确认中态）</td>'
        '<td data-page-node-id="c2td2">「版本记录」/「变更记录」/「导出合同文件」</td></tr>')
lines[i] = row1 + "\n" + row2
s2 = "\n".join(lines)
report.append("OK  C2 7.10 菜单表（发起方置首）")

# C3 新增 7.12 章节
NEW_712 = '''            <div class="subsection" id="sec-7-12">
                <div class="subsection-title" data-page-node-id="sec712t">7.12 复制发起入口规格（工人合同详情页·发起方）</div>
                <p data-page-node-id="sec712p1">工人合同详情页<strong data-page-node-id="sec712s1">发起方视角</strong>的顶部「合同操作 更多」菜单首位为「📑 复制发起」，用于以<strong data-page-node-id="sec712s2">当前合同</strong>为蓝本快速发起一份同类型的新合同（适用于同一工种需再签一份同类合同的场景）。受邀方视角<strong data-page-node-id="sec712s3">不提供</strong>该入口。</p>
                <table data-page-node-id="sec712tb">
                    <thead data-page-node-id="sec712th"><tr data-page-node-id="sec712thr"><th data-page-node-id="sec712h1">属性</th><th data-page-node-id="sec712h2">规格</th></tr></thead>
                    <tbody data-page-node-id="sec712tb2">
                        <tr data-page-node-id="sec712r1"><td data-page-node-id="sec712r1a">入口位置</td><td data-page-node-id="sec712r1b">顶部「合同操作 更多」下拉菜单<strong data-page-node-id="sec712r1s">首位</strong>（其后为「版本记录」/「变更记录」/「导出合同文件」）</td></tr>
                        <tr data-page-node-id="sec712r2"><td data-page-node-id="sec712r2a">适用视角</td><td data-page-node-id="sec712r2b">仅<strong data-page-node-id="sec712r2s">发起方视角</strong>（拟定中 / 确认中 / 已签约及发起方变更各态）；受邀方视角（含确认中·受邀方与受邀方终态）不提供</td></tr>
                        <tr data-page-node-id="sec712r3"><td data-page-node-id="sec712r3a">权限规则</td><td data-page-node-id="sec712r3b"><strong data-page-node-id="sec712r3s">与「创建合同」权限规则完全一致</strong>：由同一创建合同权限位控制，无该权限时不发起并提示“您没有创建合同的权限”</td></tr>
                        <tr data-page-node-id="sec712r4"><td data-page-node-id="sec712r4a">蓝本合同</td><td data-page-node-id="sec712r4b">当前正在查看的这份合同；沿用其合同类型、文本模板、阶段任务、金额、工期、条款与附件，均可在发起页修改</td></tr>
                        <tr data-page-node-id="sec712r5"><td data-page-node-id="sec712r5a">目标页面</td><td data-page-node-id="sec712r5b">复制发起独立页（<code data-page-node-id="sec712r5c"><a class="proto-link" href="service-miniapp/contract-copy-initiate.html" data-page-node-id="sec712r5d">contract-copy-initiate.html</a></code>），携带来源标识（<code data-page-node-id="sec712r5e">from=detail</code>）与蓝本合同标识（<code data-page-node-id="sec712r5f">source</code>）</td></tr>
                        <tr data-page-node-id="sec712r6"><td data-page-node-id="sec712r6a">持久化方式</td><td data-page-node-id="sec712r6b"><strong data-page-node-id="sec712r6s">非 localStorage 写入</strong>：仅通过页面跳转参数传递蓝本来源，不在原详情页做任何数据回写</td></tr>
                        <tr data-page-node-id="sec712r7"><td data-page-node-id="sec712r7a">与原合同关系</td><td data-page-node-id="sec712r7b">只读引用，<strong data-page-node-id="sec712r7s">原合同状态、条款与任务均不受影响</strong>，新合同独立流转</td></tr>
                    </tbody>
                </table>

                <h4 style="margin-top:16px;" data-page-node-id="sec712h4">7.12.1 覆盖页面与示例</h4>
                <ul style="font-size:13px;line-height:1.9;" data-page-node-id="sec712ul">
                    <li data-page-node-id="sec712li1">合并页 <code data-page-node-id="sec712li1c"><a class="proto-link" href="service-miniapp/worker-contract-detail.html" data-page-node-id="sec712li1a">worker-contract-detail.html</a></code>（六类工种合同共用）。</li>
                    <li data-page-node-id="sec712li2">拟定中（发起方）<code data-page-node-id="sec712li2c"><a class="proto-link" href="service-miniapp/worker-contract-draft-initial-new.html" data-page-node-id="sec712li2a">worker-contract-draft-initial-new.html</a></code>。</li>
                    <li data-page-node-id="sec712li3">确认中（发起方）<code data-page-node-id="sec712li3c"><a class="proto-link" href="service-miniapp/worker-contract-confirming-initiator-new.html" data-page-node-id="sec712li3a">worker-contract-confirming-initiator-new.html</a></code>。</li>
                    <li data-page-node-id="sec712li4">已签约（发起方）<code data-page-node-id="sec712li4c"><a class="proto-link" href="service-miniapp/worker-contract-signed-initiator-new.html" data-page-node-id="sec712li4a">worker-contract-signed-initiator-new.html</a></code>。</li>
                </ul>
                <p style="font-size:12px;color:#888;margin-top:8px;" data-page-node-id="sec712note">注：受邀方视角的「已签约（受邀方）」「已签约（已履约）」保留顶部「合同操作 更多」工具栏，但菜单项<strong data-page-node-id="sec712notes">不含</strong>「复制发起」，仍为「版本记录」/「变更记录」/「导出合同文本」。</p>
            </div>
'''
# 新增内容统一去除 data-page-node-id（避免与既有注入 id 冲突），仅保留结构锚点
NEW_712 = re.sub(r' data-page-node-id="[^"]*"', '', NEW_712)
s2 = rep(s2,
         '            </div>\n        </div>\n\n        <!-- <a href="#worker-contract-receiver">第八章</a>：工人端（受邀方） -->',
         '            </div>\n' + NEW_712 + '        </div>\n\n        <!-- <a href="#worker-contract-receiver">第八章</a>：工人端（受邀方） -->',
         "C3 新增 7.12 章节")

save(C, s2)

print("\n".join(report))
print("-" * 60)
for f, label in ((P, "PRD-项目模块详细规格"), (C, "PRD-合同模块详细规格")):
    t = load(f)
    print("%s: 复制发起 x%d | 6.12 x%d | 7.12 x%d | 一个工作组只能有一个合同 x%d | 创建合同权限 x%d"
          % (label, t.count("复制发起"), t.count("6.12"), t.count("7.12"),
             t.count("一个工作组只能有一个合同"), t.count("创建合同权限")))
