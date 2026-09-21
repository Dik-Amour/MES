# -*- coding: utf-8 -*-
"""改写两张表格内容，并把「页面区块说明」表由 11 行收缩为 10 行。"""
import subprocess, json

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


# ---------- 表1：页面区块说明（4 列，表头 + 9 行） ----------
T1_HEADER = ["序号", "区块", "展示内容", "说明"]
T1_ROWS = [
    ["1", "筛选区",
     "查询年份下拉（2025 年、2026 年、2027 年）与查询按钮",
     "默认选中当前年份；切换年份或点击查询后按年份重新过滤表格数据"],
    ["2", "数据表格-年份月份",
     "年份月份（示例 2026年06月）",
     "由配置的月份格式化为“YYYY年MM月”，一条记录对应一个结算月"],
    ["3", "数据表格-起始日期",
     "起始日期（示例 2026-06-01）",
     "结算周期的起始日，默认取所选月份的首日"],
    ["4", "数据表格-结算日期",
     "结算日期（示例 2026-06-30）",
     "结算周期的截止日，默认取所选月份的最后一日"],
    ["5", "数据表格-序号与排序",
     "序号按当前筛选结果从 1 连续编号；列表按年份月份倒序排列",
     "每次筛选、新增或删除后均按年份月份倒序重新生成序号"],
    ["6", "数据表格-创建人/创建时间",
     "创建人（示例 张三）、创建时间（示例 2026-05-08 11:10:00）",
     "新增时写入当前操作人与系统时间，编辑时不修改"],
    ["7", "数据表格-操作",
     "编辑、删除",
     "编辑打开弹框并回填已有配置；删除二次确认后移除该行并提示结果"],
    ["8", "新增/编辑弹框",
     "年份月份（月份选择器，必填）、起始日期（必填）、结算日期（必填）",
     "选择年份月份后自动带出该月首日与最后一日，仍支持手工调整"],
    ["9", "分页",
     "共 N 条与每页条数切换",
     "默认每页 10 条；筛选后当前页超出范围时自动回退"],
]

# ---------- 表2：数据来源与采集逻辑（3 列，表头 + 8 行） ----------
T2_HEADER = ["区块", "来源", "说明"]
T2_ROWS = [
    ["筛选区", "页面内置年份选项 + 结算周期配置数据",
     "年份选项固定为 2025～2027；筛选时按配置的年份月份所属年份匹配"],
    ["数据表格", "生产结算周期配置数据（当前为前端内置模拟数据）",
     "按年份月份倒序排列后分页展示，序号在排序结果上重新生成"],
    ["新增/编辑弹框", "用户手工录入（年份月份、起始日期、结算日期）",
     "年份月份选定后自动计算起始日期与结算日期，允许人工修改后提交"],
    ["创建人", "当前登录用户",
     "新增时写入操作人；示例数据中的创建人为张三、李四、王五"],
    ["创建时间", "系统时间",
     "新增时按“YYYY-MM-DD HH:mm:ss”格式写入，编辑时不修改"],
    ["删除", "表格行内操作",
     "二次确认后从配置数据中移除对应结算周期，并同步刷新序号与分页"],
    ["数据持久化", "前端内存（待对接后端接口）",
     "当前增删改仅作用于页面内存，刷新后恢复初始模拟数据"],
    ["关联引用", "在制品管理模块（在制品明细、生产月度统计、生产年度统计）",
     "结算周期作为月度、年度统计的时间口径，配置变更后相关报表按新口径取数"],
]


def build_cells(header, rows):
    cells = []
    for c, t in enumerate(header, 1):
        cells.append({"row": 1, "col": c, "text": t, "text_format": {"bold": True}})
    for r, row in enumerate(rows, 2):
        for c, t in enumerate(row, 1):
            cells.append({"row": r, "col": c, "text": t})
    return cells


common = {"text_format": {"font_family": "宋体", "font_size": 10.5}}

# 表1：先删掉多出的第 11 行，再写入内容
r = call("doc_delete_table_row", table_id="cn2q9rwi", row=11)
print("delete T1 row11 ->", json.dumps(r, ensure_ascii=False)[:200])

r = call("doc_set_table_cells", table_id="cn2q9rwi",
         common_cell_properties=common, cells=build_cells(T1_HEADER, T1_ROWS))
print("set T1 ->", json.dumps(r, ensure_ascii=False)[:200])

r = call("doc_set_table_cells", table_id="5xda0h7t",
         common_cell_properties=common, cells=build_cells(T2_HEADER, T2_ROWS))
print("set T2 ->", json.dumps(r, ensure_ascii=False)[:200])

print("done")
