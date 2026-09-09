# -*- coding: utf-8 -*-
"""修复：在「查看合同」弹窗内点「复制发起」时，无权限提示弹窗被遮盖。
原因：#appModal 与 #contractModal 同为 .app-modal（common.css z-index:1000），
      #contractModal 在 DOM 中更靠后，同层级下后者覆盖前者。
修复：提示弹窗 #appModal 提到 1010（高于其他 .app-modal 的 1000），
      同步把 .app-toast 提到 1020，保持「普通弹窗 < 提示弹窗 < toast」的层级关系。
"""
import io

P = "architecture.html"
s = io.open(P, encoding="utf-8").read()

ANCHOR = "        .arch-demo-note .adn-tip { color: #8C8C8C; }\n</style>\n</head>"
assert s.count(ANCHOR) == 1, "anchor count=%d" % s.count(ANCHOR)

CSS = """        .arch-demo-note .adn-tip { color: #8C8C8C; }
        /* 层级修正：提示弹窗需浮于其他弹窗之上（如在「查看合同」内点「复制发起」
           时的「您没有创建合同的权限」提示）；普通弹窗 1000 < 提示弹窗 1010 < toast 1020 */
        #appModal { z-index: 1010; }
        .app-toast { z-index: 1020; }
</style>
</head>"""

s = s.replace(ANCHOR, CSS)
io.open(P, "w", encoding="utf-8", newline="").write(s)
print("APPLIED z-index fix")
