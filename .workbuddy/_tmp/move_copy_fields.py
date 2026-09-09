# -*- coding: utf-8 -*-
"""方案A：6.12.1/6.12.2 迁移至合同模块 PRD §7.12.2/7.12.3，项目模块 6.12 改为跨文档引用"""
import io

PP = "PRD-项目模块详细规格.html"
CP = "PRD-合同模块详细规格.html"

pl = io.open(PP, encoding="utf-8").read().split("\n")
cl = io.open(CP, encoding="utf-8").read().split("\n")

# ---------- 1) 从项目模块 PRD 取出 6.12.1~6.12.2 区块（1-based 3189..3318） ----------
start, end = 3188, 3318  # 0-based slice
assert "6.12.1 复制发起页字段规格" in pl[start], pl[start][:80]
assert pl[end - 1].strip() == "</table>", repr(pl[end - 1])
assert pl[end].strip() == "</div>", repr(pl[end])
assert "6.12.2 隶属架构层级选择规格" in "\n".join(pl[start:end])
block = pl[start:end]

# ---------- 2) 转换区块：标题改 h4、编号 7.12.2/7.12.3、内部引用、补 7.5.3.1 引用 ----------
out = []
for l in block:
    if "6.12.1 复制发起页字段规格（与拟定中页差异）" in l:
        assert 'class="subsection-title"' in l
        out.append('<h4 style="margin-top:16px;">7.12.2 复制发起页字段规格（与拟定中页差异）</h4>')
    elif "6.12.2 隶属架构层级选择规格" in l:
        assert 'class="subsection-title"' in l
        out.append('<h4 style="margin-top:16px;">7.12.3 隶属架构层级选择规格</h4>')
    else:
        l = l.replace("详见 6.12.2", "详见 7.12.3")
        l = l.replace("）沿用拟定中页布局，但字段取值与交互存在以下差异：",
                      "）沿用拟定中页（规格见 7.5.3.1）布局，但字段取值与交互存在以下差异：")
        out.append(l)
blk = "\n".join(out)
for k in ["7.12.2 复制发起页字段规格", "7.12.3 隶属架构层级选择规格", "详见 7.12.3", "规格见 7.5.3.1"]:
    assert k in blk, k
assert "6.12.1" not in blk and "6.12.2" not in blk

# ---------- 3) 插入合同模块 PRD：7.12.1 注释行之后、subsection 闭合 </div> 之前（1-based 4345/4346） ----------
ins = 4345  # 0-based 插入位置（即原第 4346 行前）
assert "7.12.1 覆盖页面与示例" in cl[ins - 8], "锚点偏移"
assert cl[ins - 1].lstrip().startswith("<p"), repr(cl[ins - 1][:60])
assert cl[ins].strip() == "</div>", repr(cl[ins])
cl[ins:ins] = [""] + blk.split("\n")
cl_new = "\n".join(cl)
for k in ["7.12.2 复制发起页字段规格", "7.12.3 隶属架构层级选择规格"]:
    assert cl_new.count(k) == 1, k
io.open(CP, "w", encoding="utf-8", newline="").write(cl_new)
print("contract PRD: inserted 7.12.2/7.12.3 at line %d" % (ins + 1))

# ---------- 4) 项目模块 PRD：删除区块 + 「发起页形态」行改跨文档引用 ----------
del pl[start:end]
morph_old = "与拟定中页的字段差异见 6.12.1，隶属架构层级选择见 6.12.2"
morph_new = ('发起页字段规格与隶属架构层级选择详见<a href="PRD-合同模块详细规格.html#sec-7-12" target="_blank">'
             '《PRD-合同模块详细规格》7.12.2 / 7.12.3</a>')
s = "\n".join(pl)
assert s.count(morph_old) == 1, s.count(morph_old)
s = s.replace(morph_old, morph_new)
assert "6.12.1 复制发起页字段规格" not in s
assert "6.12.2 隶属架构层级选择规格" not in s
assert "详见 6.12.2" not in s
io.open(PP, "w", encoding="utf-8", newline="").write(s)
print("project PRD: block removed, morph row now references contract PRD 7.12.2/7.12.3")
