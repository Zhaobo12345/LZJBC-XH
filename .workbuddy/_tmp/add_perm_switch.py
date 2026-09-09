# -*- coding: utf-8 -*-
"""在项目架构页手机框右侧（框外）新增「演示开关」：创建合同权限
- 开关仅切换 hasCreatePermission，复现「复制发起 / 创建合同」校验不通过的提示：
  showAppModal('提示', '您没有创建合同的权限', null, false)
- 不调用 setPermission()（该函数引用页面上不存在的 #actionBar，会抛错，且提示条文案为「创建架构」语义不符）。
- 位于手机框外，不影响框内页面结构与既有交互。
"""
import io

P = "architecture.html"
s = io.open(P, encoding="utf-8").read()
n = 0


def rep(old, new):
    global s, n
    assert s.count(old) == 1, "NOT UNIQUE(=%d): %s" % (s.count(old), old[:80])
    s = s.replace(old, new)
    n += 1


# ---------- 1) CSS ----------
CSS = """        /* ===== 演示开关（手机框外右侧）：创建合同权限 ===== */
        .arch-demo-stage { display: flex; flex-wrap: nowrap; justify-content: center; align-items: flex-start; gap: 16px; padding: 20px 12px; }
        .arch-demo-stage .phone-frame { margin: 0; flex-shrink: 0; }
        .arch-demo-note {
            flex: 0 1 230px; min-width: 160px; box-sizing: border-box;
            padding: 6px 0 6px 12px; background-color: transparent; border: none;
            border-left: 2px dashed #91CAFF; border-radius: 0;
            font-size: 11px; line-height: 1.65; color: #1677FF;
        }
        .arch-demo-note .adn-title { font-size: 13px; font-weight: 700; margin-bottom: 10px; }
        .arch-demo-note .adn-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .arch-demo-note .adn-label { font-size: 12px; font-weight: 600; color: #0958D9; }
        .arch-demo-note .adn-sub { display: block; font-weight: 400; font-size: 10px; color: #4096FF; margin-top: 2px; }
        .arch-demo-note .adn-switch { flex-shrink: 0; position: relative; width: 40px; height: 22px; border-radius: 11px; background: #1677FF; cursor: pointer; transition: background .2s; }
        .arch-demo-note .adn-switch .knob { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .arch-demo-note .adn-switch.off { background: #BFBFBF; }
        .arch-demo-note .adn-switch.off .knob { left: 20px; }
        .arch-demo-note .adn-status { margin: 0 0 10px; padding: 6px 8px; border-radius: 6px; background: #E6F4FF; font-size: 11px; font-weight: 600; color: #0958D9; }
        .arch-demo-note .adn-status.off { background: #FFF1F0; color: #CF1322; }
        .arch-demo-note p { margin: 0 0 8px; }
        .arch-demo-note .adn-btns { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
        .arch-demo-note .adn-btn { box-sizing: border-box; width: 100%; padding: 7px 8px; border: 1px solid #91CAFF; border-radius: 6px; background: #fff; color: #1677FF; font-size: 11px; font-weight: 600; cursor: pointer; text-align: left; }
        .arch-demo-note .adn-btn:active { background: #E6F4FF; }
        .arch-demo-note .adn-tip { color: #8C8C8C; }
</style>
</head>"""
rep("</style>\n</head>", CSS)

# ---------- 2) 包裹容器（手机框左侧开口） ----------
rep(
    '<div class="phone-frame" data-page-node-id="t8vY7cbqkeJeGYAt9GtdiV">',
    '<div class="arch-demo-stage">\n        <div class="phone-frame" data-page-node-id="t8vY7cbqkeJeGYAt9GtdiV">'
)

# ---------- 3) 手机框闭合后：右侧演示开关面板 + 关闭包裹容器 ----------
PANEL = """        <div class="app-toast" id="appToast" data-page-node-id="uh9X3ZzXux0Cqq5bQ01l7c"></div>
    </div>

    <aside class="arch-demo-note">
        <div class="adn-title">演示开关</div>
        <div class="adn-row">
            <div class="adn-label">创建合同权限<span class="adn-sub">控制「📋 复制发起 / 📝 创建合同」</span></div>
            <div class="adn-switch" id="adnSwitch" onclick="togglePermSwitch()" role="switch" aria-checked="true" title="切换创建合同权限"><span class="knob"></span></div>
        </div>
        <div class="adn-status" id="adnStatus">当前：✅ 有权限 · 可正常发起</div>
        <div class="adn-btns">
            <button type="button" class="adn-btn" onclick="demoCopyInitiate()">▶ 模拟点击「📋 复制发起」</button>
            <button type="button" class="adn-btn" onclick="demoCreateContract()">▶ 模拟点击「📝 创建合同」</button>
        </div>
        <p>关闭开关后再点击上述按钮，将弹窗提示 <b>「您没有创建合同的权限」</b> 且不跳转；开启时按正常流程跳转。</p>
        <p class="adn-tip">开关位于手机框外，仅用于演示权限校验，不影响框内页面与其他功能。</p>
    </aside>
</div>
"""
rep(
    '        <div class="app-toast" id="appToast" data-page-node-id="uh9X3ZzXux0Cqq5bQ01l7c"></div>\n    </div>\n',
    PANEL
)

# ---------- 4) JS ----------
JS = """        /* ===== 演示开关（手机框外）：创建合同权限 =====
           仅切换 hasCreatePermission 以复现校验提示；不调用 setPermission()（其依赖页面不存在的 #actionBar） */
        function togglePermSwitch() {
            hasCreatePermission = !hasCreatePermission;
            var sw = document.getElementById('adnSwitch');
            var st = document.getElementById('adnStatus');
            if (!sw || !st) return;
            if (hasCreatePermission) {
                sw.classList.remove('off');
                sw.setAttribute('aria-checked', 'true');
                st.classList.remove('off');
                st.textContent = '当前：✅ 有权限 · 可正常发起';
            } else {
                sw.classList.add('off');
                sw.setAttribute('aria-checked', 'false');
                st.classList.add('off');
                st.textContent = '当前：🚫 无权限 · 将提示「您没有创建合同的权限」';
            }
        }

        // 演示用：直接触发「复制发起」校验（蓝本=水电工作组 contract-1）
        function demoCopyInitiate() { copyContract('水电工作组', 'contract-1'); }

        // 演示用：直接触发「创建合同」校验（木工工作组暂无合同）
        function demoCreateContract() { goCreateContract('木工工作组'); }

        function closeActionMenu() {"""
rep("        function closeActionMenu() {", JS)

io.open(P, "w", encoding="utf-8", newline="").write(s)
print("APPLIED %d replacements" % n)
