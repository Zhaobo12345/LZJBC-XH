# -*- coding: utf-8 -*-
"""修正「复制发起」入口表述：与实际原型一致
实际逻辑（architecture.html）：
  - 有权限 + 无合同 -> 节点展示「📝 创建合同」-> goCreateContract 直接跳转 create-contract.html（空白新建）
  - 有合同          -> 节点展示「查看合同」    -> viewContract 弹窗内每份合同行内「📋 复制发起」
因此「复制发起」的常规入口 = 「查看合同」；无合同时不存在该入口。
"""
import io

P = "PRD-项目模块详细规格.html"
s = io.open(P, encoding="utf-8").read()
n = 0


def rep(old, new):
    global s, n
    assert s.count(old) == 1, "NOT UNIQUE(=%d): %s" % (s.count(old), old[:70])
    s = s.replace(old, new)
    n += 1


# 1) 6.12 主入口：明确「查看合同」入口 + 蓝本为所选份
rep(
    '''                            <td>主入口</td>
                            <td>工作组「查看合同」弹窗内，<strong>每份合同行右侧的「📋 复制发起」按钮</strong>（见 6.7）</td>''',
    '''                            <td>入口</td>
                            <td><strong>已存在合同的工作组，节点操作展示「查看合同」</strong>；点击后于弹窗内按份操作——<strong>每份合同行右侧的「📋 复制发起」按钮</strong>，蓝本即为用户所选的该份合同（见 6.7）</td>'''
)

# 2) 6.12 次入口 -> 无合同时（无复制发起入口）
rep(
    '''                            <td>次入口</td>
                            <td>点击「📝 创建合同」且该工作组已存在合同时，弹「创建方式」选择：<b>复制发起（推荐）</b>默认以最新一份已签约合同为蓝本；「空白新建」跳转创建合同页（<a href="service-miniapp/create-contract.html" target="_blank">create-contract.html</a>）</td>''',
    '''                            <td>无合同时</td>
                            <td>节点操作展示「📝 创建合同」，点击直接跳转创建合同页（<a href="service-miniapp/create-contract.html" target="_blank">create-contract.html</a>）走<strong>空白新建</strong>；因不存在可复制的蓝本合同，<strong>此路径不提供「复制发起」入口</strong></td>'''
)

# 3) 6.4 创建合同触发条件
rep(
    '''                            <td>待创建合同；已存在合同时改由「复制发起 / 创建方式」追加新合同</td>''',
    '''                            <td>该工作组暂无合同（暂无合同的节点展示「创建合同」入口）；已存在合同的节点展示「查看合同」入口，通过按份「复制发起」追加新合同</td>'''
)

# 4) 6.6 前置校验2
rep(
    '''                            <td>已有合同时该节点<strong>不展示「创建合同」入口、展示「查看合同」入口</strong>，新合同通过「查看合同」内的<b>按份「复制发起」</b>追加；若「创建合同」入口在已有合同的工作组被触发，<b>不再阻断</b>，改为弹出「创建方式」供选择（复制发起（推荐）/ 空白新建）</td>''',
    '''                            <td>已有合同时该节点<strong>展示「查看合同」入口</strong>（不展示「创建合同」入口），新合同通过「查看合同」内的<b>按份「复制发起」</b>追加。如因数据同步等原因，「创建合同」入口在已有合同的工作组被触发，系统<strong>不阻断</strong>，弹「创建方式」供选择：<b>复制发起（推荐）</b>默认以最新一份已签约合同为蓝本 / 「空白新建」跳转创建合同页</td>'''
)

# 5) 6.9 交互逻辑 —— 创建合同行
rep(
    '''                            <td>校验权限+是否已有合同→无合同则打开创建合同页面；已有合同则弹「创建方式」（复制发起（推荐）/ 空白新建）→填写→校验→跳转<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页（拟定中）</a></td>''',
    '''                            <td>校验权限；该工作组暂无合同时，点击直接打开创建合同页面（空白新建）→填写→校验→跳转<a href="service-miniapp/contract-detail.html" target="_blank">合同详情页（拟定中）</a>；已有合同的节点入口为「查看合同」，追加新合同走其中按份「复制发起」（见 6.12）</td>'''
)

# 6) 6.12.1 创建合同条
rep(
    '''                    <li><strong>创建合同</strong>：已有合同的工作组通过「查看合同」内的按份「复制发起」追加新合同；“创建合同”入口在已存在合同的工作组被触发时，提供「创建方式」选择（见 6.4 / 6.9）。</li>''',
    '''                    <li><strong>创建合同</strong>：入口展示随合同有无而变——暂无合同的工作组展示「📝 创建合同」并走空白新建；已存在合同的工作组展示「查看合同」，通过其中按份「复制发起」追加新合同（见 6.4 / 6.9）。</li>'''
)

io.open(P, "w", encoding="utf-8", newline="").write(s)
print("APPLIED %d replacements" % n)
