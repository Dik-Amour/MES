# -*- coding: utf-8 -*-
"""按模板结构改写《生产结算周期配置方案说明》正文段落（从文档尾部往前替换，避免坐标漂移）。"""
import subprocess, json, sys

PY = r"C:\Users\DONGC\.workbuddy\binaries\python\versions\3.13.12\python.exe"
SK = r"C:\Program Files\WorkBuddy\resources\app.asar.unpacked\resources\plugins\workbuddy-builtin\skills\tencent-local-office-edit"
FID = "C:/Users/DONGC/Desktop/生产结算周期配置方案说明.docx"


def call(tool, **kw):
    kw["file_id"] = FID
    p = subprocess.run([PY, "edsdk.py", "call", tool, "--json", json.dumps(kw, ensure_ascii=False)],
                       cwd=SK, capture_output=True)
    out = p.stdout.decode("utf-8", "replace")
    try:
        return json.loads(out)
    except Exception:
        return {"_raw": out[:600]}


# (start, end, new_text)
EDITS = [
    # 交互说明（模板 P12）
    (1443, 1521,
     "交互说明：年份筛选、新增、编辑与删除均为页面内即时联动，操作完成后表格数据、序号与分页总数同步刷新；"
     "年份筛选与配置数据解耦，切换年份只改变展示范围，不改动已维护的结算周期；"
     "弹框取消不做任何写入，点击确定后按表单校验结果决定是否保存。"),
    # 页面路径（模板 P9）
    (415, 436, "页面路径：在制品管理 → 生产结算周期配置"),
    # 整体布局描述（模板 P8）
    (238, 414,
     "顶部为筛选区，包含查询年份下拉（2025 年、2026 年、2027 年）与查询按钮，默认选中当前年份；"
     "主体为数据表格，按年份月份倒序展示序号、年份月份、起始日期、结算日期、创建人、创建时间与操作共 7 列，"
     "表格左上角为“新增配置”按钮，右下角为分页控件；点击“新增配置”或行内“编辑”后弹出表单弹框，"
     "包含年份月份、起始日期、结算日期三个必填项。各区块以卡片形式呈现，表格随窗口尺寸自适应缩放。"),
    # 页面布局（模板 P7）
    (193, 237, "页面布局：页面采用“筛选区 + 数据表格 + 新增/编辑弹框”的纵向分段布局。"),
    # 业务需求正文（模板 P5）
    (17, 185,
     "面向在制品管理与生产统计人员，将分散在各报表中的结算时间口径收敛到一张配置表，"
     "集中维护每个结算月的起始日期与结算日期，形成“一次配置、全厂引用”的结算基准。"
     "通过在制品明细、生产月度统计与生产年度统计共用同一套结算周期，避免口径不一致导致的数据偏差；"
     "同时按自然月自动预置起止日期，减少人工填写与逐条核对工作量，"
     "支撑在制品结存与产量在不同期间的准确归集和横向对比。"),
    # 模块标题（模板 P1）
    (0, 4, "生产结算周期配置"),
]

for begin, end, text in EDITS:
    r = call("doc_replace_text", ranges=[{"begin": begin, "end": end}], text=text)
    print("[%s-%s] -> %s" % (begin, end, json.dumps(r, ensure_ascii=False)[:200]))

print("done")
