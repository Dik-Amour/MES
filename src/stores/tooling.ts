import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface ToolingInspectionTemplate {
  id: string
  templateCode: string
  templateName: string
  toolingType: string
  productionLine: string
  relatedTooling: string
  itemCount: number
  status: 'enabled' | 'disabled'
  remark: string
  createTime: string
  creator: string
}

export interface InspectionItem {
  itemId: string
  standardNo: string
  checkPart: string
  checkContent: string
  checkStandard: string
  checkMethod: string
}

export interface ToolingLibraryItem {
  toolingId: string
  toolingModel: string
  toolingName: string
  toolingType: string
  productionLine: string
  status: 'enabled' | 'disabled'
}

export type InspectResult = '' | 'pass' | 'fail' | 'na'

export interface InspectRecordItem {
  itemId: string
  standardNo: string
  checkPart: string
  checkContent: string
  checkStandard: string
  checkMethod: string
  result: InspectResult
}

export interface InspectRecord {
  recordId: string
  templateId: string
  templateCode: string
  templateName: string
  toolingId: string
  toolingModel: string
  toolingName: string
  toolingType: string
  line: string
  equipment: string
  remark: string
  items: InspectRecordItem[]
  passCount: number
  failCount: number
  naCount: number
  inspectResult: 'pass' | 'fail'
  inspectTime: string
  inspector: string
}

const now = () =>
  new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')

/** 工装管理共享数据：模板 / 点检项 / 工装台账 / 关联 / 点检记录 */
export const useToolingStore = defineStore('tooling', () => {
  const templates = ref<ToolingInspectionTemplate[]>([
    {
      id: '1',
      templateCode: 'TMP-JJ-001',
      templateName: '造型夹具班前点检模板',
      toolingType: '夹具',
      productionLine: '造型一线',
      relatedTooling: 'JJ-ZX-01 造型定位夹具',
      itemCount: 3,
      status: 'enabled',
      remark: '',
      createTime: '2026-01-05 09:00',
      creator: 'admin'
    },
    {
      id: '2',
      templateCode: 'TMP-MJ-001',
      templateName: '清理模具周点检模板',
      toolingType: '模具',
      productionLine: '清理线',
      relatedTooling: 'MJ-QL-01 清理整形模',
      itemCount: 2,
      status: 'enabled',
      remark: '',
      createTime: '2026-01-08 14:30',
      creator: 'admin'
    },
    {
      id: '3',
      templateCode: 'TMP-JJ-002',
      templateName: '制芯夹具月点检模板',
      toolingType: '夹具',
      productionLine: '制芯线',
      relatedTooling: 'JJ-ZX-04 制芯定位夹具',
      itemCount: 1,
      status: 'enabled',
      remark: '',
      createTime: '2026-01-12 10:15',
      creator: 'admin'
    }
  ])

  const inspectionItemsMap = ref<Record<string, InspectionItem[]>>({
    '1': [
      {
        itemId: '1-1',
        standardNo: 'QJ-JJ-001',
        checkPart: '定位销',
        checkContent: '磨损情况检查',
        checkStandard: '磨损量 ≤ 0.5mm，否则更换',
        checkMethod: '测量'
      },
      {
        itemId: '1-2',
        standardNo: 'QJ-JJ-001',
        checkPart: '夹紧机构',
        checkContent: '夹紧/松开动作检查',
        checkStandard: '动作顺畅，无卡滞',
        checkMethod: '功能测试'
      },
      {
        itemId: '1-3',
        standardNo: 'QJ-JJ-001',
        checkPart: '夹具表面',
        checkContent: '外观裂纹与碰伤检查',
        checkStandard: '无裂纹、无严重碰伤、无残留砂料',
        checkMethod: '目视'
      }
    ],
    '2': [
      {
        itemId: '2-1',
        standardNo: 'QJ-MJ-010',
        checkPart: '型腔、分型面',
        checkContent: '裂纹检查',
        checkStandard: '型腔、分型面无裂纹',
        checkMethod: '目视'
      },
      {
        itemId: '2-2',
        standardNo: 'QJ-MJ-010',
        checkPart: '顶出机构',
        checkContent: '顶杆间隙检查',
        checkStandard: '顶杆间隙 ≤ 0.2mm',
        checkMethod: '测量'
      }
    ],
    '3': [
      {
        itemId: '3-1',
        standardNo: 'QJ-JJ-020',
        checkPart: '定位基准面',
        checkContent: '清洁度与毛刺检查',
        checkStandard: '无毛刺、无积料',
        checkMethod: '目视'
      }
    ]
  })

  const toolingLibrary = ref<ToolingLibraryItem[]>([
    { toolingId: 'T001', toolingModel: 'JJ-ZX-01', toolingName: '造型定位夹具', toolingType: '夹具', productionLine: '造型一线', status: 'enabled' },
    { toolingId: 'T002', toolingModel: 'JJ-ZX-02', toolingName: '造型侧压夹具', toolingType: '夹具', productionLine: '造型一线', status: 'enabled' },
    { toolingId: 'T003', toolingModel: 'JJ-ZX-03', toolingName: '造型顶紧夹具', toolingType: '夹具', productionLine: '造型二线', status: 'enabled' },
    { toolingId: 'T004', toolingModel: 'MJ-QL-01', toolingName: '清理整形模', toolingType: '模具', productionLine: '清理线', status: 'enabled' },
    { toolingId: 'T005', toolingModel: 'MJ-QL-02', toolingName: '清理去毛刺模', toolingType: '模具', productionLine: '清理线', status: 'enabled' },
    { toolingId: 'T006', toolingModel: 'MJ-ZX-01', toolingName: '制芯芯盒模具', toolingType: '模具', productionLine: '制芯线', status: 'enabled' },
    { toolingId: 'T007', toolingModel: 'JJ-ZX-04', toolingName: '制芯定位夹具', toolingType: '夹具', productionLine: '制芯线', status: 'enabled' },
    { toolingId: 'T008', toolingModel: 'JJ-ZX-05', toolingName: '制芯夹紧夹具', toolingType: '夹具', productionLine: '制芯线', status: 'enabled' },
    { toolingId: 'T009', toolingModel: 'JJ-QT-01', toolingName: '通用定位检具', toolingType: '检具', productionLine: '质检站', status: 'enabled' },
    { toolingId: 'T010', toolingModel: 'DJ-RZ-01', toolingName: '热处理装料辅具', toolingType: '辅具', productionLine: '热处理', status: 'enabled' },
    { toolingId: 'T011', toolingModel: 'JJ-ZX-06', toolingName: '造型翻转夹具', toolingType: '夹具', productionLine: '造型二线', status: 'enabled' },
    { toolingId: 'T012', toolingModel: 'MJ-QL-03', toolingName: '清理打磨模', toolingType: '模具', productionLine: '清理线', status: 'disabled' }
  ])

  /** 一对一：toolingId -> templateId */
  const toolingAssocMap = ref<Record<string, string>>({
    T001: '1',
    T004: '2',
    T007: '3'
  })

  const inspectRecords = ref<InspectRecord[]>([
    {
      recordId: 'R20260115001',
      templateId: '1',
      templateCode: 'TMP-JJ-001',
      templateName: '造型夹具班前点检模板',
      toolingId: 'T001',
      toolingModel: 'JJ-ZX-01',
      toolingName: '造型定位夹具',
      toolingType: '夹具',
      line: '大四HWS线',
      equipment: '造型机 M01',
      remark: '',
      items: [
        {
          itemId: '1-1',
          standardNo: 'QJ-JJ-001',
          checkPart: '定位销',
          checkContent: '磨损情况检查',
          checkStandard: '磨损量 ≤ 0.5mm，否则更换',
          checkMethod: '测量',
          result: 'pass'
        },
        {
          itemId: '1-2',
          standardNo: 'QJ-JJ-001',
          checkPart: '夹紧机构',
          checkContent: '夹紧/松开动作检查',
          checkStandard: '动作顺畅，无卡滞',
          checkMethod: '功能测试',
          result: 'pass'
        },
        {
          itemId: '1-3',
          standardNo: 'QJ-JJ-001',
          checkPart: '夹具表面',
          checkContent: '外观裂纹与碰伤检查',
          checkStandard: '无裂纹、无严重碰伤、无残留砂料',
          checkMethod: '目视',
          result: 'pass'
        }
      ],
      passCount: 3,
      failCount: 0,
      naCount: 0,
      inspectResult: 'pass',
      inspectTime: '2026-01-15 08:30:00',
      inspector: 'admin'
    },
    {
      recordId: 'R20260116002',
      templateId: '2',
      templateCode: 'TMP-MJ-001',
      templateName: '清理模具周点检模板',
      toolingId: 'T004',
      toolingModel: 'MJ-QL-01',
      toolingName: '清理整形模',
      toolingType: '模具',
      line: '大三KW线',
      equipment: '清理机器人 R01',
      remark: '顶杆间隙接近上限，下周复查',
      items: [
        {
          itemId: '2-1',
          standardNo: 'QJ-MJ-010',
          checkPart: '型腔、分型面',
          checkContent: '裂纹检查',
          checkStandard: '型腔、分型面无裂纹',
          checkMethod: '目视',
          result: 'pass'
        },
        {
          itemId: '2-2',
          standardNo: 'QJ-MJ-010',
          checkPart: '顶出机构',
          checkContent: '顶杆间隙检查',
          checkStandard: '顶杆间隙 ≤ 0.2mm',
          checkMethod: '测量',
          result: 'fail'
        }
      ],
      passCount: 1,
      failCount: 1,
      naCount: 0,
      inspectResult: 'fail',
      inspectTime: '2026-01-16 14:10:00',
      inspector: 'admin'
    }
  ])

  const getTemplateById = (id: string) =>
    templates.value.find(t => t.id === id)

  const getItemsByTemplateId = (id: string): InspectionItem[] =>
    (inspectionItemsMap.value[id] || []).map(i => ({ ...i }))

  const getAssocTemplateId = (toolingId: string) => toolingAssocMap.value[toolingId]

  /** 工装可上机点检列表：已关联模板且启用 */
  const pdaToolingOptions = computed(() =>
    toolingLibrary.value
      .filter(t => t.status === 'enabled')
      .map(t => {
        const templateId = toolingAssocMap.value[t.toolingId] || ''
        const template = getTemplateById(templateId)
        return {
          toolingId: t.toolingId,
          toolingModel: t.toolingModel,
          toolingName: t.toolingName,
          toolingType: t.toolingType,
          templateId,
          templateName: template?.templateName || '未关联模板',
          items: template ? getItemsByTemplateId(templateId) : []
        }
      })
      .filter(t => !!t.templateId && t.items.length > 0)
  )

  const addInspectRecord = (
    payload: Omit<
      InspectRecord,
      'recordId' | 'passCount' | 'failCount' | 'naCount' | 'inspectResult' | 'inspectTime' | 'inspector'
    >
  ): InspectRecord => {
    const passCount = payload.items.filter(i => i.result === 'pass').length
    const failCount = payload.items.filter(i => i.result === 'fail').length
    const naCount = payload.items.filter(i => i.result === 'na').length
    const record: InspectRecord = {
      ...payload,
      recordId: `R${Date.now()}`,
      passCount,
      failCount,
      naCount,
      inspectResult: failCount > 0 ? 'fail' : 'pass',
      inspectTime: now(),
      inspector: 'admin'
    }
    inspectRecords.value.unshift(record)
    return record
  }

  const deleteInspectRecord = (recordId: string) => {
    inspectRecords.value = inspectRecords.value.filter(r => r.recordId !== recordId)
  }

  const refreshTemplateRelatedTooling = () => {
    templates.value = templates.value.map(t => {
      const names = toolingLibrary.value
        .filter(tg => toolingAssocMap.value[tg.toolingId] === t.id)
        .map(tg => `${tg.toolingModel} ${tg.toolingName}`)
      return { ...t, relatedTooling: names.join('，') }
    })
  }

  const removeTemplateCascade = (templateId: string) => {
    delete inspectionItemsMap.value[templateId]
    Object.keys(toolingAssocMap.value).forEach(tid => {
      if (toolingAssocMap.value[tid] === templateId) {
        delete toolingAssocMap.value[tid]
      }
    })
    refreshTemplateRelatedTooling()
  }

  const saveInspectionItems = (templateId: string, items: InspectionItem[]) => {
    inspectionItemsMap.value[templateId] = items.map(i => ({ ...i }))
    const idx = templates.value.findIndex(t => t.id === templateId)
    if (idx >= 0) {
      templates.value[idx] = {
        ...templates.value[idx],
        itemCount: items.length
      }
    }
  }

  const saveToolingRelation = (templateId: string, toolingIds: string[]) => {
    Object.keys(toolingAssocMap.value).forEach(tid => {
      if (toolingAssocMap.value[tid] === templateId) {
        delete toolingAssocMap.value[tid]
      }
    })
    toolingIds.forEach(tid => {
      toolingAssocMap.value[tid] = templateId
    })
    refreshTemplateRelatedTooling()
  }

  refreshTemplateRelatedTooling()

  return {
    templates,
    inspectionItemsMap,
    toolingLibrary,
    toolingAssocMap,
    inspectRecords,
    pdaToolingOptions,
    getTemplateById,
    getItemsByTemplateId,
    getAssocTemplateId,
    addInspectRecord,
    deleteInspectRecord,
    refreshTemplateRelatedTooling,
    removeTemplateCascade,
    saveInspectionItems,
    saveToolingRelation
  }
})
