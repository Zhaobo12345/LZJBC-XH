# -*- coding: utf-8 -*-
"""PRD 补充：复制发起页字段规格（与拟定中页差异）+ 隶属架构层级选择规格"""
import io, re

P = "PRD-项目模块详细规格.html"
s = io.open(P, encoding="utf-8").read()
n = 0


def rep(old, new):
    global s, n
    assert s.count(old) == 1, "NOT UNIQUE(=%d): %s" % (s.count(old), old[:70])
    s = s.replace(old, new)
    n += 1


# 1) 「发起页形态」行补充指引（原文 td 带注入属性，用正则按内容替换）
OLD_MORPH = re.compile(
    r'(<td[^>]*>)沿用拟定中页布局，各字段预填蓝本合同取值并标注「沿用 / 已调整」，全部可编辑；底部为「取消 / 仅保存 / 提交并邀请乙方」(</td>)')
assert len(OLD_MORPH.findall(s)) == 0 or True
NEW_MORPH = (r'\1沿用拟定中页（<a href="service-miniapp/worker-contract-draft-initial-new.html" target="_blank">'
             r'worker-contract-draft-initial-new.html</a>）布局，各字段预填蓝本合同取值并标注「沿用 / 已调整」，全部可编辑；'
             r'底部为「取消 / 仅保存 / 提交并邀请乙方」。与拟定中页的字段差异见 6.12.1，隶属架构层级选择见 6.12.2\2')
s2, cnt = OLD_MORPH.subn(NEW_MORPH, s, count=1)
assert cnt == 1, "morph row not found: %d" % cnt
s = s2
n += 1

# 2) 在 6.12 表格后新增 6.12.1 / 6.12.2（锚点标签可能带注入属性，用正则定位）
m_sub = re.search(r'<div class="subsection"[^>]*id="sub-6-12"[^>]*>', s)
assert m_sub, "sub-6-12 anchor not found"
i = m_sub.start()
j = s.find("</table>", i)
assert j > 0
pos = j + len("</table>")

NEW = '''
                <div class="subsection-title" style="font-size: 14px; margin-top: 16px;">6.12.1 复制发起页字段规格（与拟定中页差异）</div>
                <p style="font-size:13px;">复制发起页（<a href="service-miniapp/contract-copy-initiate.html" target="_blank">contract-copy-initiate.html</a>）沿用拟定中页布局，但字段取值与交互存在以下差异：</p>
                <table>
                    <thead>
                        <tr><th>字段 / 区域</th><th>复制发起页</th><th>拟定中页</th><th>规则说明</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>隶属架构层级</td>
                            <td><b>独立卡片</b>（页面顶部），默认＝被复制合同所属层级，可更换</td>
                            <td>无此区域（层级由入口节点确定）</td>
                            <td>复制发起特有，详见 6.12.2</td>
                        </tr>
                        <tr>
                            <td>合同类型</td>
                            <td>沿用蓝本合同类型，<b>静态展示、不可修改</b>（如「（类型：水电班组服务合同）」）</td>
                            <td>由创建流程确定</td>
                            <td>复制发起不支持跨类型发起</td>
                        </tr>
                        <tr>
                            <td>合同甲方</td>
                            <td>默认＝当前甲方，带徽标「默认当前甲方」，可经「更换甲方」重新选择（单选，支持按姓名 / 角色模糊搜索）</td>
                            <td>需选择，无徽标</td>
                            <td>沿用当前操作人对应的甲方身份</td>
                        </tr>
                        <tr>
                            <td>意向乙方</td>
                            <td><b>初始为空</b>，带徽标「待选择（无默认）」，<b>必须重新选择 1–3 人</b>；<b>不沿用蓝本合同乙方</b></td>
                            <td>初始为空，需选择 1–3 人</td>
                            <td>新合同需重新发起邀约与确认，原乙方不自动带入</td>
                        </tr>
                        <tr>
                            <td>合同名称 / 合同金额 / 工期</td>
                            <td>预填蓝本合同取值，带徽标「沿用原值」；任一改动后徽标变为「已调整」</td>
                            <td>为空或为当前草稿值，无徽标</td>
                            <td>徽标规则见本节末说明</td>
                        </tr>
                        <tr>
                            <td>文本模板 / 违约责任 / 补充条款</td>
                            <td>沿用蓝本合同取值并可编辑，带沿用徽标；违约责任为必填</td>
                            <td>自行填写</td>
                            <td>违约责任未填写时提交被拦截并聚焦该输入项</td>
                        </tr>
                        <tr>
                            <td>阶段任务</td>
                            <td>徽标「沿用原清单」，可增删阶段 / 任务，或经「更换任务模板」整体替换</td>
                            <td>自行添加</td>
                            <td>沿用后仍可完全重新编排</td>
                        </tr>
                        <tr>
                            <td>附件</td>
                            <td>徽标「沿用原列表」，可上传新附件或删除沿用附件</td>
                            <td>自行上传</td>
                            <td>删除沿用附件不影响蓝本合同</td>
                        </tr>
                        <tr>
                            <td>底部操作</td>
                            <td><b>取消 / 仅保存 / 提交并邀请乙方</b>；「取消」＝放弃本次复制发起，提示「已取消复制发起，返回原合同」并返回原合同详情</td>
                            <td>仅保存 / 提交并邀请乙方</td>
                            <td>复制发起多出的「取消」为流程退出入口</td>
                        </tr>
                        <tr>
                            <td>提交校验</td>
                            <td>与拟定中页一致：合同名称必填、合同金额为正数、违约责任必填、意向乙方 1–3 人；不通过时页面内气泡提示且不跳转</td>
                            <td>同左</td>
                            <td>两套页面校验口径保持一致</td>
                        </tr>
                        <tr>
                            <td>提交结果</td>
                            <td>校验通过 → 气泡「已提交并邀请乙方（N 人）」（<b>更换过层级时追加「归入层级：完整路径」</b>）→ 气泡消失后进入「确认中（发起方）」</td>
                            <td>气泡后进入「确认中（发起方）」</td>
                            <td>复制发起不展示差异对比弹窗</td>
                        </tr>
                    </tbody>
                </table>
                <ul style="font-size:13px;line-height:1.9;">
                    <li><strong>沿用徽标（灰）</strong>：该字段当前取值与蓝本合同一致。</li>
                    <li><strong>已调整徽标（橙）</strong>：该字段已被修改；输入框一经输入即由「沿用原值」变为「已调整」。</li>
                    <li><strong>待选择徽标（橙）</strong>：复制发起特有，用于标识该字段无默认值、必须主动选择（当前仅意向乙方）。</li>
                </ul>

                <div class="subsection-title" style="font-size: 14px; margin-top: 16px;">6.12.2 隶属架构层级选择规格</div>
                <p style="font-size:13px;">复制发起页顶部「🏗️ 隶属架构层级」卡片用于确定<b>新合同归入的架构层级</b>；该卡片为复制发起特有，拟定中页无此区域。</p>
                <table>
                    <thead>
                        <tr><th>属性</th><th>规格</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>卡片构成</td>
                            <td>第一行：级别徽标（二级 / 三级）＋ 层级名称 ＋ 状态标签（默认 / 已调整）＋ 范围徽标（同类型 / 无合同）；第二行：完整路径面包屑（一级项目 › 二级工作组 › 三级子组）；第三行：仅更换后显示「已更换为「X」；新合同将归入该架构层级，原合同不受影响。」</td>
                        </tr>
                        <tr>
                            <td>默认值</td>
                            <td>被复制合同当前所属层级——由架构页进入时取 <code>group</code> 参数，由合同详情进入时取蓝本合同默认层级；默认值不在预置层级列表时，按源工种二级层级兜底，保证可追踪完整路径</td>
                        </tr>
                        <tr>
                            <td>触发方式</td>
                            <td>点击卡片整行或右侧「更换 ›」→ 打开底部抽屉「选择隶属架构层级」</td>
                        </tr>
                        <tr>
                            <td>抽屉顶部</td>
                            <td>标题「选择隶属架构层级」＋ 关闭按钮；过滤规则说明「仅可选同类型（被复制合同工种）与暂无合同的架构；异类型且已有合同者不可选」</td>
                        </tr>
                        <tr>
                            <td>搜索</td>
                            <td>顶部搜索框（placeholder「搜索架构名称 / 工种 / 路径…」），实时模糊匹配<b>层级名称、父级名称、工种中文名与完整路径</b>；无匹配时显示「未找到匹配的架构层级」</td>
                        </tr>
                        <tr>
                            <td>列表形态</td>
                            <td><b>树形分组</b>：二级工作组为父节点，三级子组缩进列于其下；每项显示级别徽标 ＋ 层级名称 ＋「默认」标签（默认项专属）＋ 范围徽标 ＋ 完整路径 ＋ 说明文案；当前选中项右侧显示 ✓</td>
                        </tr>
                        <tr>
                            <td>可选规则</td>
                            <td>与蓝本合同<b>同类型</b>（工种一致）或<b>暂无合同</b>的层级可选；<b>异类型且已有合同者置灰且不可点击</b>；一级根节点（项目总架构）不可作为归属终点，仅作为路径起点展示</td>
                        </tr>
                        <tr>
                            <td>选择后</td>
                            <td>卡片同步更新（级别徽标 / 层级名称 / 状态标签变「已调整」/ 完整路径 / 提示行），抽屉自动关闭</td>
                        </tr>
                        <tr>
                            <td>生效范围</td>
                            <td>仅决定新合同的归属层级；蓝本合同与原合同均不做任何写操作、不受影响</td>
                        </tr>
                        <tr>
                            <td>提交时</td>
                            <td>仅当更换过层级时，提交气泡追加「归入层级：完整路径」</td>
                        </tr>
                    </tbody>
                </table>'''

s = s[:pos] + NEW + s[pos:]
n += 1

io.open(P, "w", encoding="utf-8", newline="").write(s)
print("APPLIED %d changes" % n)
