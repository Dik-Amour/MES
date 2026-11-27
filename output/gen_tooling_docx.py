# -*- coding: utf-8 -*-
"""生成《工装点检业务说明》Word 文档（含页面截图占位框）"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from pathlib import Path

OUT = Path(r"C:\Users\DONGC\Desktop\工装点检业务说明.docx")

CN_FONT = "微软雅黑"
EN_FONT = "Calibri"
NAVY = RGBColor(0x1F, 0x3A, 0x5F)
GRAY = RGBColor(0x59, 0x59, 0x59)
PLACEHOLDER_BG = "F2F4F7"
PLACEHOLDER_BORDER = "8C8C8C"


def set_run_font(run, size=11, bold=False, color=None, name_cn=CN_FONT, name_en=EN_FONT):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.name = name_en
    r = run._element
    rPr = r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), name_en)
    rFonts.set(qn("w:hAnsi"), name_en)
    rFonts.set(qn("w:eastAsia"), name_cn)
    if color is not None:
        run.font.color.rgb = color


def add_para(doc, text="", style=None, size=11, bold=False, color=None,
             align=None, space_before=0, space_after=6, line_spacing=1.25):
    p = doc.add_paragraph(style=style) if style else doc.add_paragraph()
    if text:
        run = p.add_run(text)
        set_run_font(run, size=size, bold=bold, color=color)
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line_spacing
    if align is not None:
        p.alignment = align
    return p


def add_heading_cn(doc, text, level=1):
    # 使用内置 Heading 样式以保证导航窗格可用
    p = doc.add_heading(level=level)
    run = p.add_run(text)
    sizes = {0: 22, 1: 16, 2: 13, 3: 12}
    set_run_font(run, size=sizes.get(level, 12), bold=True, color=NAVY)
    p.paragraph_format.space_before = Pt(14 if level <= 1 else 10)
    p.paragraph_format.space_after = Pt(6)
    return p


def set_cell_shading(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_borders(cell, color="BFBFBF", sz="4"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), sz)
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), color)
        tcBorders.append(el)
    tcPr.append(tcBorders)


def style_table(table, header=True):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(table.rows):
        for cell in row.cells:
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_borders(cell)
            if header and i == 0:
                set_cell_shading(cell, "1F3A5F")
            for p in cell.paragraphs:
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.line_spacing = 1.15
                for run in p.runs:
                    if header and i == 0:
                        set_run_font(run, size=10.5, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))
                    else:
                        set_run_font(run, size=10.5, color=RGBColor(0x33, 0x33, 0x33))


def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.autofit = True
    for j, h in enumerate(headers):
        table.rows[0].cells[j].text = h
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            table.rows[i + 1].cells[j].text = str(val)
    style_table(table)
    if col_widths:
        for row in table.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Cm(w)
    doc.add_paragraph()
    return table


def add_image_placeholder(doc, caption, width_cm=15.5, height_cm=8.5):
    """插入截图占位框：表格单元格 + 提示文字，便于用户自行粘贴图片"""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)

    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = table.rows[0].cells[0]
    cell.width = Cm(width_cm)

    # 单元格高度
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcW = tcPr.find(qn("w:tcW"))
    if tcW is None:
        tcW = OxmlElement("w:tcW")
        tcPr.append(tcW)
    tcW.set(qn("w:w"), str(int(width_cm * 567)))
    tcW.set(qn("w:type"), "dxa")

    set_cell_shading(cell, PLACEHOLDER_BG)
    set_cell_borders(cell, color=PLACEHOLDER_BORDER, sz="12")

    # 空段落撑开高度
    for _ in range(3):
        p0 = cell.paragraphs[0] if _ == 0 else cell.add_paragraph()
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.paragraph_format.space_before = Pt(20)
        p0.paragraph_format.space_after = Pt(4)
        if _ == 1:
            run = p0.add_run("【此处插入页面截图】")
            set_run_font(run, size=12, bold=True, color=GRAY)
        elif _ == 2:
            run = p0.add_run(caption)
            set_run_font(run, size=9, color=GRAY)

    cap = doc.add_paragraph(style="Caption")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cap.add_run(caption)
    set_run_font(run, size=9, color=GRAY, name_cn=CN_FONT)
    cap.paragraph_format.space_after = Pt(10)


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        run = p.add_run(item)
        set_run_font(run, size=11)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2


def add_numbers(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        run = p.add_run(item)
        set_run_font(run, size=11)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.2


def setup_styles(doc):
    normal = doc.styles["Normal"]
    normal.font.name = EN_FONT
    normal.font.size = Pt(11)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), CN_FONT)
    normal.paragraph_format.line_spacing = 1.25
    normal.paragraph_format.space_after = Pt(6)

    for i, size in [(1, 16), (2, 13), (3, 12)]:
        s = doc.styles[f"Heading {i}"]
        s.font.name = EN_FONT
        s.font.size = Pt(size)
        s.font.bold = True
        s.font.color.rgb = NAVY
        s._element.rPr.rFonts.set(qn("w:eastAsia"), CN_FONT)


def setup_page(doc):
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.5)
    section.bottom_margin = Cm(2.5)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

    # 页脚页码
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("工装点检业务说明  ·  第 ")
    set_run_font(run, size=9, color=GRAY)
    # PAGE 字段
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    r2 = p.add_run()
    set_run_font(r2, size=9, color=GRAY)
    r2._element.append(fld_begin)
    r2._element.append(instr)
    r2._element.append(fld_end)
    run3 = p.add_run(" 页")
    set_run_font(run3, size=9, color=GRAY)


def main():
    doc = Document()
    setup_styles(doc)
    setup_page(doc)

    # ===== 封面标题 =====
    for _ in range(4):
        doc.add_paragraph()
    add_para(doc, "工装点检业务说明", size=28, bold=True, color=NAVY,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_para(doc, "（MES 系统 · 工装管理 / PDA 上机点检）", size=14, color=GRAY,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=24)
    add_para(doc, "版本日期：2026-01", size=11, color=GRAY,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, "文档性质：业务说明（面向业务人员，非开发文档）", size=11, color=GRAY,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, "截图说明：文中虚线框处请自行插入对应页面截图", size=11, color=GRAY,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    doc.add_page_break()

    # ===== 一、业务背景 =====
    add_heading_cn(doc, "一、业务背景", 1)
    add_para(doc,
             "工装（夹具、模具、检具等）上机前需按标准点检，确认状态合格后方可投入生产，"
             "避免因工装异常导致废品、停机或安全事故。")
    add_para(doc,
             "系统通过「点检模板（定标准）→ 上机点检（做检查）→ 点检记录（留痕迹）」"
             "三个环节形成闭环管理。")

    # ===== 二、功能总览 =====
    add_heading_cn(doc, "二、功能总览", 1)
    add_table(doc,
              ["环节", "功能名称", "使用端", "主要角色"],
              [
                  ["定标准", "工装点检模板", "PC 端", "工艺 / 设备管理员"],
                  ["做检查", "工装上机点检", "PDA", "操作工 / 点检人"],
                  ["留痕迹", "工装点检记录", "PC 端", "班组长 / 设备 / 质量"],
              ])
    add_para(doc, "菜单位置", bold=True, size=11, space_before=6, space_after=4)
    add_bullets(doc, [
        "工装管理 → 工装点检模板",
        "工装管理 → 工装点检记录",
        "PDA 操作 → 工装上机点检",
    ])

    # ===== 三、业务流程 =====
    add_heading_cn(doc, "三、业务流程", 1)
    add_numbers(doc, [
        "工艺/设备在 PC 端维护点检模板及点检项（标准号、点检部位、点检内容、点检标准、点检方式）。",
        "将具体工装与点检模板一对一关联（一件工装只能挂一个模板）。",
        "操作工在 PDA 选择产线、上机设备，扫码或选择工装。",
        "系统按关联模板带出全部点检项，逐项判定：合格 / 不合格 / 不适用。",
        "全部判定完成后提交，系统自动生成一条工装点检记录。",
        "班组长/设备在 PC 端查询点检记录与明细，对不合格项跟进处理。",
    ])

    # ===== 四、功能说明 =====
    add_heading_cn(doc, "四、功能说明（含页面截图）", 1)

    # 4.1 模板
    add_heading_cn(doc, "4.1 工装点检模板（PC）", 2)
    add_para(doc,
             "用途：定义「怎么检」，是上机点检的唯一依据。支持模板增删改查、点检项配置、"
             "工装关联。")
    add_para(doc, "主要操作", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "查询 / 重置：按模板编码、模板名称、工装类型、状态筛选",
        "新增 / 修改 / 删除模板",
        "点检项配置：维护标准号、点检部位、点检内容、点检标准、点检方式",
        "关联工装：多选工装绑定到模板；已被其他模板占用的工装不可勾选",
    ])
    add_para(doc, "关联规则", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "一件工装只能关联一个点检模板",
        "解除关联后，该工装可挂到其他模板",
        "模板点检项修改后，影响后续上机点检；已生成的历史记录不受影响",
    ])
    add_image_placeholder(doc, "图 1  工装点检模板页面（PC）")

    # 4.2 PDA
    add_heading_cn(doc, "4.2 工装上机点检（PDA）", 2)
    add_para(doc,
             "用途：在设备旁按模板完成实际点检并提交，是现场执行环节。")
    add_para(doc, "操作步骤", bold=True, size=11, space_before=4, space_after=3)
    add_numbers(doc, [
        "选择产线、上机设备",
        "扫码或从列表选择工装（仅显示已关联模板且启用的工装）",
        "系统自动带出该工装对应模板的全部点检项",
        "对每项选择：合格 / 不合格 / 不适用",
        "可填写备注",
        "全部项判定完成后，点击「提交点检」",
    ])
    add_para(doc, "提交规则", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "未选设备、或存在未判定的点检项时，不能提交",
        "提交成功后自动生成一条工装点检记录",
        "若存在不合格项，记录整体结果为「不合格」，提示需跟进",
    ])
    add_image_placeholder(doc, "图 2  工装上机点检页面（PDA）")

    # 4.3 记录
    add_heading_cn(doc, "4.3 工装点检记录（PC）", 2)
    add_para(doc,
             "用途：查询、查看历史点检结果，供追溯与管理。")
    add_para(doc, "主要操作", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "查询 / 重置：记录编号、工装型号、工装名称、点检模板、点检结果",
        "查看详情：工装与上机信息 + 点检项逐条判定明细",
    ])
    add_para(doc, "记录字段（摘要）", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "记录编号、点检时间、点检人",
        "点检模板、工装型号 / 名称 / 类型",
        "产线、上机设备",
        "结果汇总（合格数 / 不合格数 / 不适用数）",
        "点检结果（合格 / 不合格）、备注",
    ])
    add_para(doc, "结果判定口径", bold=True, size=11, space_before=4, space_after=3)
    add_bullets(doc, [
        "任一必检项为「不合格」→ 整条记录「不合格」",
        "无不合格项（含部分「不适用」）→ 整条记录「合格」",
    ])
    add_image_placeholder(doc, "图 3  工装点检记录列表页面（PC）")
    add_image_placeholder(doc, "图 4  工装点检记录详情弹窗（PC）")

    # ===== 五、关键业务规则 =====
    add_heading_cn(doc, "五、关键业务规则", 1)
    add_table(doc,
              ["规则", "说明"],
              [
                  ["工装与模板一对一", "一件工装同时只能挂在一个点检模板下"],
                  ["点检依据模板", "PDA 点检项完全来自该工装所关联模板的点检项配置"],
                  ["提交即留痕", "每次上机点检提交都会生成唯一记录编号"],
                  ["不合格可追溯", "记录中可查明哪一项、何标准、何结果"],
                  ["模板变更影响后续", "修改点检项后，之后的点检按新标准执行；历史记录不变"],
              ])

    # ===== 六、角色与职责 =====
    add_heading_cn(doc, "六、角色与职责（建议）", 1)
    add_table(doc,
              ["角色", "职责"],
              [
                  ["工艺 / 设备管理员", "维护点检模板、点检项、工装关联"],
                  ["操作工（PDA）", "上机前完成点检并如实提交"],
                  ["班组长 / 设备员", "查看点检记录，处理不合格项"],
                  ["质量 / 管理层", "按模板、工装、时间统计点检执行情况"],
              ])

    # ===== 七、常见问题 =====
    add_heading_cn(doc, "七、常见问题（业务 FAQ）", 1)
    faqs = [
        ("Q1：为什么 PDA 选不到某件工装？",
         "该工装未关联点检模板，或状态为停用。请在「工装点检模板」中完成关联。"),
        ("Q2：想改点检标准，从哪里改？",
         "在「工装点检模板」中编辑对应模板的点检项，保存后新点检按新标准执行。"),
        ("Q3：一件工装能否用两个模板？",
         "不能。系统限制一件工装只能关联一个模板。"),
        ("Q4：点检不合格怎么办？",
         "记录会标记为不合格，由设备/班组按厂内异常流程处理（返修、停用工装等）。"),
        ("Q5：记录能否删除？",
         "当前版本以查询、查看详情为主；是否允许删除按后续管理要求再定。"),
    ]
    for q, a in faqs:
        add_para(doc, q, bold=True, size=11, space_before=6, space_after=2)
        add_para(doc, a, size=11, space_after=4)

    # ===== 八、页面入口速查 =====
    add_heading_cn(doc, "八、页面入口速查", 1)
    add_table(doc,
              ["页面", "入口"],
              [
                  ["工装点检模板", "左侧菜单：工装管理 → 工装点检模板"],
                  ["工装点检记录", "左侧菜单：工装管理 → 工装点检记录"],
                  ["工装上机点检", "PDA 菜单：PDA 操作 → 工装上机点检"],
              ])

    # ===== 附录：截图插入说明 =====
    add_heading_cn(doc, "附录：截图插入说明", 1)
    add_para(doc,
             "文中灰色虚线框为截图占位区。请按图号将对应页面截图粘贴或插入到框内，"
             "建议分辨率不低于 1280×800，PC 页面可全屏截图，PDA 页面可截取手机/模拟器视口。")
    add_table(doc,
              ["图号", "对应页面", "截图建议"],
              [
                  ["图 1", "工装点检模板（PC 列表页）", "含筛选区、按钮区、表格"],
                  ["图 2", "工装上机点检（PDA）", "含上机信息与点检项列表"],
                  ["图 3", "工装点检记录（PC 列表页）", "含筛选与记录列表"],
                  ["图 4", "工装点检记录详情", "含工装信息与点检项明细"],
              ])

    doc.save(str(OUT))
    print(f"OK: {OUT}")


if __name__ == "__main__":
    main()
