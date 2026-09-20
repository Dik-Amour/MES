<template>
  <div class="equipment-dashboard">
    <!-- 大屏标题 -->
    <DashboardHeader title="材料成型中心工业园区设备监控大屏" />

    <!-- 第一行：设备指标总览（等宽 KPI 带） -->
    <div class="kpi-panel">
      <div class="kpi-box">
        <div class="kpi-grid">
          <div
            v-for="(k, i) in kpiItems"
            :key="k.label"
            class="kpi-item"
            :class="{ 'group-start': isGroupStart(i) }"
          >
            <div class="kpi-label">{{ k.label }}</div>
            <div class="kpi-value">{{ k.value }}<span class="unit">{{ k.unit }}</span></div>
          </div>
        </div>
        <div class="kpi-groups">
          <span v-for="g in kpiGroups" :key="g.name" :style="{ gridColumn: `span ${g.count}` }">{{ g.name }}</span>
        </div>
      </div>
    </div>

    <!-- 第二行：趋势图表 -->
    <div class="chart-row">
      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">吨均设备维修费用分析</span>
          <select v-model="repairTrendMode" class="series-select">
            <option v-for="t in repairTrendTabs" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
        </div>
        <div ref="repairTrendChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">备件库存金额</span>
          <select v-model="spareMode" class="series-select">
            <option v-for="t in repairTrendTabs" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
        </div>
        <div ref="spareChartRef" class="chart-body"></div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <span class="chart-title">设备可动率</span>
          <select v-model="rateMode" class="series-select">
            <option v-for="t in rateTabs" :key="t.key" :value="t.key">{{ t.label }}</option>
          </select>
        </div>
        <div ref="rateChartRef" class="chart-body"></div>
      </div>
    </div>

    <!-- 第三行：重点设备概况 -->
    <div class="equipment-panel">
      <div class="chart-title">重点设备概况</div>
      <div class="equipment-box">
        <!-- 设备类型Tab -->
        <div class="eq-tabs">
          <button
            v-for="t in equipmentTypes"
            :key="t"
            :class="{ active: activeEquipmentType === t }"
            @click="activeEquipmentType = t"
          >{{ t }}</button>
        </div>

        <div class="eq-content" :class="contentColsClass">
          <!-- 机器人 / 熔炼设备：左侧为设备总数 + 设备状态 -->
          <template v-if="showDeviceLeft">
            <div class="device-left">
              <div class="device-summary">
                <div class="rs-item">
                  <span class="rs-label">设备总数：</span>
                  <span class="rs-value">{{ currentSummary.total }}</span>
                  <span class="rs-unit">台</span>
                </div>
                <template v-if="currentSummary.extra">
                  <div class="rs-divider"></div>
                  <div class="rs-item">
                    <span class="rs-label">{{ currentSummary.extra.label }}：</span>
                    <span class="rs-value">{{ currentSummary.extra.value }}</span>
                    <span class="rs-unit">{{ currentSummary.extra.unit }}</span>
                  </div>
                </template>
              </div>
              <div class="table-wrapper">
                <table class="eq-table device-table">
                  <thead>
                    <tr>
                      <th>设备状态</th>
                      <th>数量</th>
                      <th>数量占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in currentSummary.rows" :key="r.name" :class="{ 'row-total': r.name === '合计' }">
                      <td>{{ r.name }}</td>
                      <td class="text-center">{{ r.count }}</td>
                      <td class="text-center">{{ r.ratio }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 机器人：品牌分布 -->
            <div v-if="activeEquipmentType === '机器人'" class="brand-panel">
              <div class="brand-title">机器人品牌分布</div>
              <div class="brand-bars">
                <div class="bb-row" v-for="b in robotBrands" :key="b.name">
                  <span class="bb-name" :title="b.name">{{ b.name }}</span>
                  <span class="bb-track"><span class="bb-fill" :style="{ width: b.pct }"></span></span>
                  <span class="bb-value">{{ b.value }}</span>
                </div>
              </div>
            </div>

            <!-- 叉车：制造厂商数量统计 + 设备规格统计 -->
            <template v-else-if="activeEquipmentType === '叉车'">
              <div class="brand-panel" v-for="panel in forkliftPanels" :key="panel.title">
                <div class="brand-title">{{ panel.title }}</div>
                <div class="brand-bars">
                  <div class="bb-row" v-for="b in panel.items" :key="b.name">
                    <span class="bb-name" :title="b.name">{{ b.name }}</span>
                    <span class="bb-track"><span class="bb-fill" :style="{ width: b.pct }"></span></span>
                    <span class="bb-value">{{ b.value }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- AGV和RGV：子 tab（AGV / RGV）+ 制造厂商统计 -->
            <template v-else-if="activeEquipmentType === 'AGV和RGV'">
              <div class="brand-panel">
                <div class="brand-tabs">
                  <button
                    v-for="t in agvTabs"
                    :key="t.key"
                    :class="{ active: agvMode === t.key }"
                    @click="agvMode = t.key"
                  >{{ t.label }}</button>
                </div>
                <div class="brand-title">{{ agvMode === 'agv' ? 'AGV' : 'RGV' }}制造厂商统计</div>
                <div class="brand-bars">
                  <div class="bb-row" v-for="b in currentAgvMakers" :key="b.name">
                    <span class="bb-name" :title="b.name">{{ b.name }}</span>
                    <span class="bb-track"><span class="bb-fill" :style="{ width: b.pct }"></span></span>
                    <span class="bb-value">{{ b.value }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 熔炼设备：设备明细（带子 tab） -->
            <div v-else class="brand-panel">
              <div class="brand-tabs">
                <button
                  v-for="t in smeltTabs"
                  :key="t.key"
                  :class="{ active: smeltMode === t.key }"
                  @click="smeltMode = t.key"
                >{{ t.label }}</button>
              </div>
              <div class="table-wrapper">
                <table class="eq-table smelt-table">
                  <thead>
                    <tr>
                      <th>产线</th>
                      <th>设备名称</th>
                      <th>规格型号</th>
                      <th>制造厂家</th>
                      <th>数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in currentSmeltRows" :key="i">
                      <td>{{ r.line }}</td>
                      <td>{{ r.name }}</td>
                      <td>{{ r.spec }}</td>
                      <td>{{ r.maker }}</td>
                      <td>{{ r.count }}</td>
                    </tr>
                    <tr class="row-total">
                      <td colspan="4">合计</td>
                      <td>{{ currentSmeltTotal }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <!-- 三坐标：左表（产线/车间）+ 右表（品牌） -->
          <template v-else-if="activeEquipmentType === '三坐标'">
            <div class="table-wrapper">
              <table class="eq-table coord-table">
                <thead>
                  <tr>
                    <th>产线/车间</th>
                    <th>数量</th>
                    <th>原值/亿</th>
                    <th>净值/亿</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in coordByLine" :key="r.name" :class="{ 'row-total': r.name === '合计' }">
                    <td>{{ r.name }}</td>
                    <td>{{ r.count }}</td>
                    <td>{{ r.original }}</td>
                    <td>{{ r.net }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-wrapper">
              <table class="eq-table coord-table">
                <thead>
                  <tr>
                    <th>品牌</th>
                    <th>数量</th>
                    <th>原值/亿</th>
                    <th>净值/亿</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in coordByBrand" :key="r.name" :class="{ 'row-total': r.name === '合计' }">
                    <td>{{ r.name }}</td>
                    <td>{{ r.count }}</td>
                    <td>{{ r.original }}</td>
                    <td>{{ r.net }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- PLC：产线/车间 × 品牌 通栏表 -->
          <template v-else-if="activeEquipmentType === 'PLC'">
            <div class="table-wrapper">
              <table class="eq-table plc-table">
                <thead>
                  <tr>
                    <th>产线/车间</th>
                    <th v-for="b in plcBrands" :key="b">{{ b }}</th>
                    <th>合计</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="row-total">
                    <td>总计</td>
                    <td v-for="(v, i) in plcTotalRow" :key="i">{{ v || '' }}</td>
                    <td>{{ plcGrandTotal }}</td>
                  </tr>
                  <tr v-for="r in plcRows" :key="r.name">
                    <td>{{ r.name }}</td>
                    <td v-for="(v, i) in r.values" :key="i">{{ v || '' }}</td>
                    <td>{{ plcRowTotal(r.values) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <!-- 其他 tab：左侧产线统计表 + 右侧品牌分布 -->
          <template v-else>
            <!-- 左侧：产线统计表 -->
            <div class="table-wrapper left-table">
              <table class="eq-table">
                <thead>
                  <tr>
                    <th rowspan="2" class="head-corner">
                      <span class="corner-label dim">视觉类型</span>
                      <span class="corner-label">产线/车间</span>
                    </th>
                    <th v-for="c in currentTypeColumns" :key="c">{{ c }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in currentTypeRows" :key="row.name" :class="{ 'row-total': row.name === '合计' }">
                    <td>{{ row.name }}</td>
                    <td v-for="c in currentTypeColumns" :key="c" class="text-center">{{ row.values[c] ?? 0 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 右侧：品牌分布 -->
            <div class="brand-panel">
              <div class="brand-tabs">
                <button
                  v-for="t in brandTabs"
                  :key="t.key"
                  :class="{ active: brandMode === t.key }"
                  @click="brandMode = t.key"
                >{{ t.label }}</button>
              </div>
              <div class="table-wrapper">
                <table class="eq-table brand-table">
                  <thead>
                    <tr>
                      <th class="w-40">{{ brandColumnLabels.first }}</th>
                      <th class="w-30">{{ brandColumnLabels.second }}</th>
                      <th class="w-20">数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="group in currentBrandGroups" :key="group.name">
                      <tr>
                        <!-- 首列单元格纵向合并整组（小计+明细行） -->
                        <td class="group-name" :rowspan="group.items.length + 1">{{ group.name }}</td>
                        <td class="text-center subtotal">小计</td>
                        <td class="text-center subtotal">{{ group.subtotal }}</td>
                      </tr>
                      <tr v-for="b in group.items" :key="group.name + b.name">
                        <td class="text-center">{{ b.name }}</td>
                        <td class="text-center">{{ b.value }}</td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import DashboardHeader from './DashboardHeader.vue'

// ========== 第一行：KPI 指标 ==========
const kpiItems = [
  { label: '吨均设备维修费用', value: '125.8', unit: '元/吨', group: '运维成本' },
  { label: '大修费用', value: '1,850', unit: '万元', group: '运维成本' },
  { label: '备件库存金额', value: '3,260', unit: '万元', group: '运维成本' },
  { label: '设备数量', value: '1,248', unit: '台/套', group: '设备资产' },
  { label: '主要生产设备', value: '856', unit: '台/套', group: '设备资产' },
  { label: '净值/原值（亿元）', value: '2.85/3.42', unit: '', group: '设备资产' },
  { label: 'MTTR', value: '68.5', unit: '分钟', group: '运行指标' },
  { label: 'MTBF', value: '5,280', unit: '小时', group: '运行指标' },
  { label: '可动率', value: '98.5', unit: '%', group: '运行指标' },
  { label: 'OEE', value: '65.2', unit: '%', group: '运行指标' }
]

const isGroupStart = (i: number) => i > 0 && kpiItems[i].group !== kpiItems[i - 1].group

const kpiGroups = computed(() => {
  const list: { name: string; count: number }[] = []
  kpiItems.forEach(k => {
    const last = list[list.length - 1]
    if (last && last.name === k.group) last.count += 1
    else list.push({ name: k.group, count: 1 })
  })
  return list
})

// ========== 机器人 / 熔炼设备：设备状态汇总 ==========
type StatusRow = { name: string; count: number; ratio: string }
type DeviceSummary = {
  total: number
  rows: StatusRow[]
  extra?: { label: string; value: number; unit: string }
}

const buildStatusRows = (rows: { name: string; count: number }[], total: number): StatusRow[] => [
  ...rows.map(r => ({ ...r, ratio: ((r.count / total) * 100).toFixed(2) + '%' })),
  { name: '合计', count: total, ratio: '—' }
]

const deviceSummaryMap: Record<string, DeviceSummary> = {
  '机器人': {
    total: 400,
    rows: buildStatusRows(
      [{ name: '在建', count: 0 }, { name: '在用', count: 327 }, { name: '待处置', count: 2 }, { name: '闲置', count: 71 }],
      400
    ),
    extra: { label: '万人机器人密度', value: 2894, unit: '台/万人' }
  },
  '熔炼设备': {
    total: 22,
    rows: buildStatusRows(
      [{ name: '在建', count: 0 }, { name: '在用', count: 20 }, { name: '待处置', count: 1 }, { name: '闲置', count: 1 }],
      22
    )
  },
  '叉车': {
    total: 62,
    rows: buildStatusRows(
      [{ name: '在建', count: 0 }, { name: '在用', count: 57 }, { name: '待处置', count: 2 }, { name: '闲置', count: 3 }],
      62
    )
  },
  'AGV和RGV': {
    total: 138,
    rows: buildStatusRows(
      [{ name: '在建', count: 0 }, { name: '在用', count: 128 }, { name: '待处置', count: 4 }, { name: '闲置', count: 6 }],
      138
    )
  }
}

// 采用「设备总数 + 设备状态表」布局的设备类型
const showDeviceLeft = computed(() => !!deviceSummaryMap[activeEquipmentType.value])

const currentSummary = computed<DeviceSummary>(() => {
  return deviceSummaryMap[activeEquipmentType.value] ?? { total: 0, rows: [] }
})

// 条形列表：按最大值归一化宽度
type BarItem = { name: string; value: number; pct: string }
const withPct = (list: { name: string; value: number }[]): BarItem[] => {
  const max = Math.max(...list.map(i => i.value), 1)
  return list.map(i => ({ ...i, pct: `${Math.max((i.value / max) * 100, 2)}%` }))
}

const robotBrands: BarItem[] = withPct([
  { name: '上海ABB工程有限公司', value: 151 },
  { name: '日本发那科公司', value: 95 },
  { name: '瑞典ABB公司', value: 43 },
  { name: '上海发那科机器人有限公司', value: 37 },
  { name: 'GermanyKUKA公司', value: 34 },
  { name: '杭州海康智能科技有限公司', value: 14 },
  { name: '美国发那科公司', value: 8 },
  { name: '林德（中国）叉车有限公司', value: 7 },
  { name: '安川电机（中国）有限公司', value: 6 },
  { name: '其他品牌', value: 5 }
])

// ========== 叉车：制造厂商 / 设备规格统计 ==========
const forkliftMakers: BarItem[] = withPct([
  { name: '林德（中国）叉车', value: 18 },
  { name: '安徽合力股份', value: 14 },
  { name: '杭叉集团股份', value: 12 },
  { name: '丰田产业车辆', value: 9 },
  { name: '比亚迪叉车', value: 6 },
  { name: '其他厂商', value: 3 }
])

const forkliftSpecs: BarItem[] = withPct([
  { name: '3.0T内燃叉车', value: 16 },
  { name: '2.5T内燃叉车', value: 14 },
  { name: '2.0T电动叉车', value: 12 },
  { name: '1.8T电动叉车', value: 9 },
  { name: '5.0T内燃叉车', value: 6 },
  { name: '1.5T电动堆高车', value: 5 }
])

const forkliftPanels = [
  { title: '制造厂商数量统计', items: forkliftMakers },
  { title: '设备规格统计', items: forkliftSpecs }
]

// ========== AGV和RGV：子 tab（AGV / RGV）制造厂商统计 ==========
const agvTabs = [
  { key: 'agv', label: 'AGV' },
  { key: 'rgv', label: 'RGV' }
]
const agvMode = ref('agv')

const agvMakerMap: Record<string, BarItem[]> = {
  agv: withPct([
    { name: '中国-新松', value: 32 },
    { name: '中国-海康机器人', value: 28 },
    { name: '德国-德马泰克', value: 19 },
    { name: '日本-大福', value: 12 }
  ]),
  rgv: withPct([
    { name: '中国-新松', value: 18 },
    { name: '中国-海康机器人', value: 14 },
    { name: '德国-德马泰克', value: 9 },
    { name: '日本-大福', value: 6 }
  ])
}

const currentAgvMakers = computed(() => agvMakerMap[agvMode.value] ?? [])

// ========== PLC：产线/车间 × 品牌统计 ==========
const plcBrands = ['德国西门子', '日本三菱电机', '瑞士ABB', '德国贝加莱', '日本欧姆龙', '松下', '信捷', '其他', '日本发那科']

const plcRows: { name: string; values: number[] }[] = [
  { name: 'ACL材料成型中心安丘造型车间大件制芯', values: [26, 1, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'ACM材料成型中心安丘造型车间中件制芯', values: [36, 24, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'AHL材料成型中心安丘造型车间大件HWS线', values: [12, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'AHM材料成型中心安丘造型车间中件HWS线', values: [13, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'AQL材料成型中心安丘造型四线大件清理', values: [25, 1, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'AQM材料成型中心安丘造型四线中件清理', values: [28, 5, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'AR4材料成型中心安丘熔炼四线', values: [32, 0, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'GGB材料成型制造中心（潍坊）造型二线中件', values: [104, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'GGC材料成型制造中心（潍坊）造型二线大件', values: [78, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'GGD材料成型制造中心（潍坊）造型一线大件', values: [192, 1, 0, 0, 1, 2, 2, 2, 0] },
  { name: 'GGE材料成型制造中心（潍坊）造型三线KW', values: [67, 0, 0, 0, 1, 0, 0, 0, 0] },
  { name: 'GGN材料成型制造中心（潍坊）造型三线HWS', values: [117, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'GGZ材料成型制造中心（潍坊）造型一线中件', values: [122, 6, 0, 0, 1, 0, 0, 0, 1] }
]

const plcRowTotal = (values: number[]) => values.reduce((s, v) => s + v, 0)

// 总计行覆盖全部车间（面板内仅展示其中 13 个），数值与设计图一致
const plcTotalRow = [926, 39, 2, 4, 2, 2, 2, 24, 1]
const plcGrandTotal = plcTotalRow.reduce((s, v) => s + v, 0)

// 重点设备概况内容区列数
const contentColsClass = computed(() => {
  if (activeEquipmentType.value === '叉车') return 'three-col'
  if (activeEquipmentType.value === 'PLC') return 'one-col'
  return ''
})

// ========== 熔炼设备：设备明细（子 tab） ==========
type SmeltRow = { line: string; name: string; spec: string; maker: string; count: number }

const smeltTabs = [
  { key: 'holding', label: '保温电炉' },
  { key: 'melting', label: '熔化电炉' },
  { key: 'cupola', label: '冲天炉' }
]
const smeltMode = ref('holding')

const smeltData: Record<string, SmeltRow[]> = {
  holding: [
    { line: '熔炼车间', name: '中频保温电炉', spec: 'GW-3T', maker: '应达工业（上海）', count: 2 },
    { line: '造型一线', name: '球化保温电炉', spec: 'GW-2T', maker: '应达工业（上海）', count: 1 },
    { line: '造型二线', name: '球化保温电炉', spec: 'GW-2T', maker: '无锡金球', count: 1 },
    { line: '造型三线', name: '中频保温电炉', spec: 'GW-5T', maker: '应达工业（上海）', count: 2 },
    { line: '造型四线', name: '中频保温电炉', spec: 'GW-5T', maker: '日本富士电机', count: 2 },
    { line: '制芯车间', name: '保温电炉', spec: 'GW-1T', maker: '无锡金球', count: 1 }
  ],
  melting: [
    { line: '熔炼车间', name: '中频熔化电炉', spec: 'GWK-10T', maker: '应达工业（上海）', count: 2 },
    { line: '熔炼车间', name: '中频熔化电炉', spec: 'GWK-8T', maker: '应达工业（上海）', count: 2 },
    { line: '造型一线', name: '中频熔化电炉', spec: 'GWK-5T', maker: '德国ABP', count: 1 },
    { line: '造型二线', name: '中频熔化电炉', spec: 'GWK-6T', maker: '德国ABP', count: 2 },
    { line: '造型三线', name: '中频熔化电炉', spec: 'GWK-6T', maker: '美国应达', count: 2 },
    { line: '造型四线', name: '中频熔化电炉', spec: 'GWK-4T', maker: '中国新研', count: 1 }
  ],
  cupola: [
    { line: '熔炼车间', name: '冲天炉', spec: 'CPL-15T/h', maker: '青岛铸造机械', count: 1 },
    { line: '熔炼车间', name: '热风冲天炉', spec: 'CPL-10T/h', maker: '青岛铸造机械', count: 1 },
    { line: '造型一线', name: '冲天炉', spec: 'CPL-8T/h', maker: '河北中冶重工', count: 1 }
  ]
}

const currentSmeltRows = computed(() => smeltData[smeltMode.value] ?? [])
const currentSmeltTotal = computed(() => currentSmeltRows.value.reduce((s, r) => s + r.count, 0))

// ========== 三坐标：产线/车间 + 品牌统计 ==========
type CoordRow = { name: string; count: number; original: string; net: string }

const coordByLine: CoordRow[] = [
  { name: '合计', count: 5, original: '0.01', net: '0.00' },
  { name: '技术质量室', count: 5, original: '0.01', net: '0.00' }
]

const coordByBrand: CoordRow[] = [
  { name: '合计', count: 5, original: '0.01', net: '0.00' },
  { name: '海克斯康测量技术（青岛）有限公司', count: 3, original: '0.01', net: '0.00' },
  { name: '北京南航立科机械有限公司', count: 1, original: '0.00', net: '0.00' },
  { name: '爱佩仪中测（成都）精密仪器有限公司', count: 1, original: '0.00', net: '0.00' }
]

// ========== 图表DOM与实例 ==========
const repairTrendChartRef = ref<HTMLElement>()
const spareChartRef = ref<HTMLElement>()
const rateChartRef = ref<HTMLElement>()
const charts: Record<string, echarts.ECharts> = {}

// ========== 状态 ==========
const repairTrendMode = ref('factory-year')
const spareMode = ref('factory-year')
const rateMode = ref('factory-year')
const activeEquipmentType = ref('机器人')
const brandMode = ref('type-brand')

const repairTrendTabs = [
  { key: 'factory-year', label: '分厂年度趋势' },
  { key: 'factory-month', label: '分厂月度趋势' },
  { key: 'line-month', label: '产线月度趋势' }
]
const rateTabs = [
  { key: 'factory-year', label: '分厂年度' },
  { key: 'factory-month', label: '分厂月度' },
  { key: 'line-month', label: '各产线月度' }
]
const equipmentTypes = ['机器人', '熔炼设备', '三坐标', '叉车', '视觉', 'AGV和RGV', 'PLC']
const brandTabs = [
  { key: 'brand-visual', label: '品牌-视觉类型分布' },
  { key: 'brand-app', label: '品牌-应用设备类型分布' },
  { key: 'type-brand', label: '应用设备类型-品牌分布' }
]

// ========== 设备类型统计（产线 x 类型列） ==========
const typeColumnsMap: Record<string, string[]> = {
  '机器人': ['焊接', '搬运', '喷涂', '打磨', '其他', '合计'],
  '熔炼设备': ['中频炉', '冲天炉', '保温炉', '浇注机', '其他', '合计'],
  '三坐标': ['桥式', '龙门式', '关节臂', '其他', '合计'],
  '叉车': ['内燃', '电动', '堆高', '其他', '合计'],
  '视觉': ['相机', '光学', '红外', '激光', '其他', '合计'],
  'AGV和RGV': ['AGV小车', 'RGV小车', '其他', '合计'],
  'PLC': ['西门子', '三菱', '欧姆龙', '施耐德', '其他', '合计']
}

const workshopRows = [
  'ACM材料成型中心安丘造型车间中件制芯',
  'AHL材料成型中心安丘造型车间大件HWS线',
  'AHM材料成型中心安丘造型车间中件HWS线',
  'AQL材料成型中心安丘造型四线大件清理',
  'GGB材料成型制造中心（潍坊）造型二线中',
  'GGC材料成型制造中心（潍坊）造型二线大',
  'GGD材料成型制造中心（潍坊）造型一线大',
  'GGE材料成型制造中心（潍坊）造型三线KW',
  'GGM材料成型制造中心（潍坊）造型三线',
  'GGZ材料成型制造中心（潍坊）造型一线中'
]

// 每种设备类型的基础数量（按产线分配），视觉类型为截图中数据
const typeBaseCounts: Record<string, number[]> = {
  '视觉': [77, 1, 2, 3, 10, 11, 15, 13, 18, 1],
  '机器人': [12, 4, 6, 8, 5, 7, 9, 6, 11, 3],
  '熔炼设备': [8, 3, 5, 4, 6, 5, 7, 4, 8, 2],
  '三坐标': [2, 1, 1, 2, 1, 1, 2, 1, 2, 1],
  '叉车': [5, 3, 4, 6, 4, 5, 6, 4, 7, 2],
  'AGV和RGV': [10, 6, 8, 9, 7, 8, 10, 7, 12, 4],
  'PLC': [15, 9, 12, 14, 11, 12, 15, 11, 18, 6]
}

// 将基础数量分配到各类型列
const buildTypeRows = (type: string) => {
  const cols = typeColumnsMap[type].filter(c => c !== '合计')
  const totals = typeBaseCounts[type] || []
  const rows: { name: string; values: Record<string, number> }[] = []

  const allRows = [{ name: '合计', counts: totals }, ...workshopRows.map((n, i) => ({ name: n, counts: [totals[i]] }))]

  allRows.forEach(r => {
    const values: Record<string, number> = {}
    const sum = r.counts.reduce((s, v) => s + v, 0)
    if (r.name === '合计') {
      // 合计行：按比例分配到各列
      cols.forEach((c, ci) => {
        values[c] = Math.round(sum * [0.35, 0.2, 0.15, 0.12, 0.18][ci % 5] * 0.01) || 0
      })
      // 修正视觉类型的特殊分布
      if (type === '视觉') {
        values['相机'] = 77; values['光学'] = 0; values['红外'] = 0; values['激光'] = 0; values['其他'] = 0
      }
      let colSum = cols.reduce((s, c) => s + (values[c] || 0), 0)
      values[cols[0]] = (values[cols[0]] || 0) + (sum - colSum)
    } else {
      const base = r.counts[0] || 0
      cols.forEach((c, ci) => {
        if (type === '视觉') {
          values[c] = ci === 0 ? base : 0
        } else {
          values[c] = ci === 0 ? Math.max(0, base - Math.floor(base * 0.4)) : Math.floor(base * 0.4 / (cols.length - 1)) * (ci === 1 ? 1 : 0) + (ci === 1 ? 0 : 0)
          if (ci > 0) values[c] = Math.floor((base * 0.4) / (cols.length - 1))
          if (ci === cols.length - 1) {
            const assigned = cols.slice(0, -1).reduce((s, cc) => s + (values[cc] || 0), 0)
            values[c] = base - assigned
          }
        }
      })
    }
    values['合计'] = cols.reduce((s, c) => s + (values[c] || 0), 0)
    rows.push({ name: r.name, values })
  })
  return rows
}

const currentTypeColumns = computed(() => typeColumnsMap[activeEquipmentType.value] || [])
const currentTypeRows = computed(() => buildTypeRows(activeEquipmentType.value))

// ========== 品牌分布数据 ==========
interface BrandItem { name: string; value: number }
interface BrandGroup { name: string; subtotal: number; items: BrandItem[] }

const brandDataMap: Record<string, Record<string, BrandGroup[]>> = {
  '机器人': {
    'type-brand': [
      { name: '机器人', subtotal: 45, items: [
        { name: '美国-康耐视', value: 26 }, { name: '日本-发那科', value: 11 },
        { name: '中国-梅卡曼德', value: 3 }, { name: '德国-巴斯勒', value: 2 },
        { name: '斯洛伐克-', value: 1 }, { name: '中国-海康威视', value: 1 }, { name: '加拿大-乐姆迈', value: 1 }
      ]},
      { name: '清理设备', subtotal: 11, items: [
        { name: '美国-康耐视', value: 9 }, { name: '中国-海康威视', value: 2 }
      ]}
    ]
  },
  '熔炼设备': {
    'type-brand': [
      { name: '熔炼设备', subtotal: 52, items: [
        { name: '德国-应达', value: 18 }, { name: '美国-ABP', value: 14 },
        { name: '中国-新研', value: 10 }, { name: '日本-富士电机', value: 7 }, { name: '中国-中频', value: 3 }
      ]},
      { name: '清理设备', subtotal: 8, items: [{ name: '中国-纽威', value: 8 }] }
    ]
  },
  '三坐标': {
    'type-brand': [
      { name: '三坐标', subtotal: 14, items: [
        { name: '德国-蔡司', value: 8 }, { name: '英国-雷尼绍', value: 4 }, { name: '日本-三丰', value: 2 }
      ]}
    ]
  },
  '叉车': {
    'type-brand': [
      { name: '叉车', subtotal: 46, items: [
        { name: '中国-杭叉', value: 20 }, { name: '中国-合力', value: 16 },
        { name: '日本-丰田', value: 6 }, { name: '德国-林德', value: 4 }
      ]}
    ]
  },
  '视觉': {
    'type-brand': [
      { name: '机器人', subtotal: 45, items: [
        { name: '美国-康耐视', value: 26 }, { name: '日本-发那科', value: 11 },
        { name: '中国-梅卡曼德', value: 3 }, { name: '德国-巴斯勒', value: 2 },
        { name: '斯洛伐克-', value: 1 }, { name: '中国-海康威视', value: 1 }, { name: '加拿大-乐姆迈', value: 1 }
      ]},
      { name: '清理设备', subtotal: 11, items: [
        { name: '美国-康耐视', value: 9 }, { name: '中国-海康威视', value: 2 }
      ]}
    ]
  },
  'AGV和RGV': {
    'type-brand': [
      { name: 'AGV和RGV', subtotal: 91, items: [
        { name: '中国-新松', value: 32 }, { name: '中国-海康机器人', value: 28 },
        { name: '德国-德马泰克', value: 19 }, { name: '日本-大福', value: 12 }
      ]}
    ]
  },
  'PLC': {
    'type-brand': [
      { name: 'PLC', subtotal: 123, items: [
        { name: '德国-西门子', value: 68 }, { name: '日本-三菱', value: 32 },
        { name: '日本-欧姆龙', value: 15 }, { name: '法国-施耐德', value: 8 }
      ]}
    ]
  }
}

// 视觉：三个子 Tab 均由同一份明细聚合（品牌 / 应用设备类型 / 视觉类型）
type VisionRecord = { brand: string; app: string; visual: string; count: number }

const VISION_APP_ORDER = ['机器人', '清理设备', '计量检测设备', '标记机', '造型设备', '喷漆设备', '输送线', '其它辅助设备', '仓储设备', '烘干设备']
const VISION_VISUAL_ORDER = ['相机', '光学', '红外', '激光', '其他']

const visionRecords: VisionRecord[] = [
  { brand: '美国-康耐视', app: '机器人', visual: '相机', count: 44 },
  { brand: '美国-康耐视', app: '清理设备', visual: '相机', count: 12 },
  { brand: '美国-康耐视', app: '计量检测设备', visual: '相机', count: 8 },
  { brand: '美国-康耐视', app: '标记机', visual: '相机', count: 5 },
  { brand: '美国-康耐视', app: '造型设备', visual: '相机', count: 4 },
  { brand: '美国-康耐视', app: '喷漆设备', visual: '相机', count: 3 },
  { brand: '美国-康耐视', app: '输送线', visual: '相机', count: 2 },
  { brand: '美国-康耐视', app: '其它辅助设备', visual: '相机', count: 1 },
  { brand: '美国-康耐视', app: '仓储设备', visual: '相机', count: 1 },
  { brand: '美国-康耐视', app: '烘干设备', visual: '相机', count: 1 },
  { brand: '日本-发那科', app: '机器人', visual: '相机', count: 18 },
  { brand: '日本-发那科', app: '造型设备', visual: '相机', count: 4 },
  { brand: '日本-发那科', app: '输送线', visual: '相机', count: 2 },
  { brand: '斯洛伐克-', app: '机器人', visual: '相机', count: 6 },
  { brand: '斯洛伐克-', app: '标记机', visual: '相机', count: 3 },
  { brand: '斯洛伐克-', app: '计量检测设备', visual: '相机', count: 1 },
  { brand: '日本-基恩士', app: '机器人', visual: '相机', count: 5 },
  { brand: '日本-基恩士', app: '计量检测设备', visual: '相机', count: 2 },
  { brand: '日本-基恩士', app: '喷漆设备', visual: '相机', count: 1 },
  { brand: '加拿大-乐姆迈', app: '机器人', visual: '相机', count: 3 },
  { brand: '加拿大-乐姆迈', app: '计量检测设备', visual: '激光', count: 2 },
  { brand: '加拿大-乐姆迈', app: '其它辅助设备', visual: '激光', count: 1 },
  { brand: '加拿大-乐姆迈', app: '仓储设备', visual: '激光', count: 1 },
  { brand: '加拿大-乐姆迈', app: '烘干设备', visual: '激光', count: 2 },
  { brand: '其它', app: '机器人', visual: '相机', count: 7 },
  { brand: '其它', app: '清理设备', visual: '相机', count: 3 },
  { brand: '其它', app: '标记机', visual: '相机', count: 2 },
  { brand: '其它', app: '造型设备', visual: '相机', count: 2 },
  { brand: '其它', app: '输送线', visual: '相机', count: 1 },
  { brand: '其它', app: '仓储设备', visual: '相机', count: 1 }
]

// 把明细按「分组键 → 明细键」聚合；分组键未指定顺序时按小计降序
const groupRecords = (
  records: { group: string; item: string; count: number }[],
  groupOrder: string[],
  itemOrder: string[]
): BrandGroup[] => {
  const map: Record<string, Record<string, number>> = {}
  records.forEach(r => {
    if (!map[r.group]) map[r.group] = {}
    map[r.group][r.item] = (map[r.group][r.item] || 0) + r.count
  })
  const sum = (obj: Record<string, number>) => Object.values(obj).reduce((s, v) => s + v, 0)
  const names = groupOrder.length
    ? groupOrder.filter(n => map[n])
    : Object.keys(map).sort((a, b) => sum(map[b]) - sum(map[a]))
  return names.map(n => {
    const itemMap = map[n]
    const order = itemOrder.length ? itemOrder : Object.keys(itemMap).sort((a, b) => itemMap[b] - itemMap[a])
    const items = order.filter(i => itemMap[i] != null).map(i => ({ name: i, value: itemMap[i] }))
    return { name: n, subtotal: items.reduce((s, i) => s + i.value, 0), items }
  })
}

const visionTypeBrand = groupRecords(visionRecords.map(r => ({ group: r.app, item: r.brand, count: r.count })), VISION_APP_ORDER, [])
const visionBrandApp = groupRecords(visionRecords.map(r => ({ group: r.brand, item: r.app, count: r.count })), [], VISION_APP_ORDER)
const visionBrandVisual = groupRecords(visionRecords.map(r => ({ group: r.brand, item: r.visual, count: r.count })), [], VISION_VISUAL_ORDER)

// 其余两个品牌Tab视图维度（数据同源，换分组标题）
const brandDataMap2: Record<string, Record<string, BrandGroup[]>> = {}
Object.keys(brandDataMap).forEach(type => {
  const groups = brandDataMap[type]['type-brand']
  // 品牌-XX分布：按品牌聚合
  const brandAgg: Record<string, number> = {}
  groups.forEach(g => g.items.forEach(i => { brandAgg[i.name] = (brandAgg[i.name] || 0) + i.value }))
  const brandGroups: BrandGroup[] = Object.entries(brandAgg).map(([name, value]) => ({
    name: name.split('-')[0] || name, subtotal: value, items: [{ name, value }]
  }))
  brandDataMap2[type] = { 'brand-visual': brandGroups, 'brand-app': brandGroups, 'type-brand': groups }
})
// 视觉：三个子 Tab 用同一份明细口径
brandDataMap2['视觉'] = {
  'brand-visual': visionBrandVisual,
  'brand-app': visionBrandApp,
  'type-brand': visionTypeBrand
}

const currentBrandGroups = computed<BrandGroup[]>(() => {
  const type = activeEquipmentType.value
  const mode = brandMode.value
  const m = brandDataMap2[type] || brandDataMap2['视觉']
  return m[mode] || m['type-brand']
})

// 品牌分布表的两列表头随子 Tab 变化
const brandColumnLabels = computed(() => {
  if (brandMode.value === 'type-brand') return { first: '应用设备类型', second: '品牌' }
  if (brandMode.value === 'brand-app') return { first: '品牌', second: '应用设备类型' }
  return { first: '品牌', second: '视觉类型' }
})

// ========== 趋势数据 ==========
const years = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027']
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

// 分厂维度：安丘厂区 / 寒亭厂区
const factoryNames = ['安丘厂区', '寒亭厂区']
const factoryColors = ['#4472c4', '#3ba8a0']

const repairTrendData: Record<string, { x: string[]; y: Record<string, number[]> }> = {
  'factory-year': {
    x: years,
    y: {
      '安丘厂区': [102, 140, 230, 101, 110, 129, 160, 222],
      '寒亭厂区': [88, 126, 205, 118, 132, 108, 145, 196]
    }
  },
  'factory-month': {
    x: months,
    y: {
      '安丘厂区': [120, 135, 118, 142, 128, 155, 138, 126, 148, 132, 158, 144],
      '寒亭厂区': [105, 122, 140, 118, 146, 128, 152, 138, 120, 145, 136, 130]
    }
  }
}

// 产线月度趋势：多条折线，9条产线
const repairLineNames = [
  '熔炼一线', '熔炼二线', '熔炼三线',
  '造型一线大件', '造型一线中件',
  '造型二线大件', '造型二线中件',
  '造型三线HWS', '造型三线KW'
]
// 各产线基准值与波动幅度（模拟吨均维修费用）
const repairLineBase: Record<string, { base: number; amp: number; phase: number }> = {
  '熔炼一线': { base: 140, amp: 22, phase: 0.3 },
  '熔炼二线': { base: 125, amp: 18, phase: 1.1 },
  '熔炼三线': { base: 158, amp: 25, phase: 2.0 },
  '造型一线大件': { base: 110, amp: 16, phase: 2.8 },
  '造型一线中件': { base: 96, amp: 14, phase: 3.6 },
  '造型二线大件': { base: 132, amp: 20, phase: 4.4 },
  '造型二线中件': { base: 105, amp: 15, phase: 5.2 },
  '造型三线HWS': { base: 168, amp: 26, phase: 6.0 },
  '造型三线KW': { base: 148, amp: 22, phase: 6.8 }
}
const repairLineColors = [
  '#4472c4', '#3ba8a0', '#70ad47', '#ffc000', '#ed7d31',
  '#5b9bd5', '#a5a5a5', '#7030a0', '#c00000'
]

const buildRepairLineSeries = () => {
  return repairLineNames.map(name => {
    const { base, amp, phase } = repairLineBase[name]
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: months.map((_, i) => Math.round(base + Math.sin(phase + i * 0.9) * amp + (i % 3 === 0 ? amp * 0.3 : 0))),
      itemStyle: { color: repairLineColors[repairLineNames.indexOf(name)] },
      lineStyle: { width: 2 }
    }
  })
}

// 备件库存金额（分厂年度 / 分厂月度 / 产线月度）
const spareTrendData: Record<string, { x: string[]; y: Record<string, number[]> }> = {
  'factory-year': {
    x: years,
    y: {
      '安丘厂区': [820, 910, 1060, 880, 940, 1020, 1180, 1090],
      '寒亭厂区': [640, 720, 860, 790, 830, 880, 960, 900]
    }
  },
  'factory-month': {
    x: months,
    y: {
      '安丘厂区': [95, 102, 88, 115, 108, 126, 98, 112, 132, 105, 121, 118],
      '寒亭厂区': [68, 75, 82, 71, 88, 79, 92, 84, 74, 90, 81, 86]
    }
  }
}
// 产线月度趋势：各产线基准库存金额（万元）
const spareLineValues = [105, 82, 138, 74, 96, 118, 132, 88, 110]

const buildSpareLineSeries = () => {
  return repairLineNames.map((name, i) => {
    const base = spareLineValues[i] ?? 100
    const amp = base * 0.16
    const phase = i * 0.8
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: months.map((_, m) =>
        Math.max(0, Math.round(base + Math.sin(phase + m * 0.9) * amp + (m % 3 === 0 ? amp * 0.3 : 0)))
      ),
      itemStyle: { color: repairLineColors[i] },
      lineStyle: { width: 2 }
    }
  })
}

const rateData: Record<string, { x: string[]; y: Record<string, number[]> }> = {
  'factory-year': {
    x: years.slice(0, 7),
    y: {
      '安丘厂区': [98.2, 98.6, 98.4, 98.8, 98.5, 98.7, 98.9],
      '寒亭厂区': [97.6, 98.1, 98.3, 97.9, 98.6, 98.2, 98.8]
    }
  },
  'factory-month': {
    x: months,
    y: {
      '安丘厂区': [98.3, 98.6, 98.4, 98.7, 98.5, 98.8, 98.6, 98.5, 98.9, 98.6, 98.7, 98.8],
      '寒亭厂区': [97.8, 98.2, 98.5, 98.0, 98.7, 98.3, 98.6, 98.1, 98.8, 98.4, 98.2, 98.9]
    }
  }
}

// 各产线月度：多条折线，每条曲线一条产线（百分比）
const buildRateLineSeries = () => {
  return repairLineNames.map(name => {
    const { base, amp, phase } = repairLineBase[name]
    const baseRate = 97.5 + (base % 5) * 0.3
    const waveAmp = 0.3 + amp * 0.01
    return {
      name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      data: months.map((_, i) => {
        const v = baseRate + Math.sin(phase + i * 0.9) * waveAmp + (i % 4 === 0 ? 0.3 : 0)
        return Math.min(99.8, Math.round(v * 10) / 10)
      }),
      itemStyle: { color: repairLineColors[repairLineNames.indexOf(name)] },
      lineStyle: { width: 2 }
    }
  })
}

// ========== 图表渲染 ==========
const baseAxis = {
  axisLine: { lineStyle: { color: '#999' } },
  axisLabel: { color: '#666', fontSize: 11 },
  splitLine: { lineStyle: { color: '#e8e8e8' } }
}

function renderRepairTrend() {
  if (repairTrendMode.value === 'line-month') {
    // 产线月度趋势：多条折线
    charts.repairTrend?.setOption({
      tooltip: { trigger: 'axis' },
      legend: {
        data: repairLineNames, top: 0, type: 'scroll',
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
      },
      grid: { left: 40, right: 16, top: 28, bottom: 24 },
      xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: { type: 'value', ...baseAxis },
      series: buildRepairLineSeries()
    }, { notMerge: true })
    return
  }
  const d = repairTrendData[repairTrendMode.value]
  charts.repairTrend?.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: factoryNames, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
    },
    grid: { left: 40, right: 16, top: 28, bottom: 24 },
    xAxis: { type: 'category', data: d.x, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: { type: 'value', ...baseAxis },
    series: factoryNames.map((name, i) => ({
      name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: d.y[name], itemStyle: { color: factoryColors[i] }, lineStyle: { width: 2 },
      label: { show: true, color: factoryColors[i], fontSize: 9, formatter: (p: any) => p.value ?? '' }
    }))
  }, { notMerge: true })
}

function renderSpare() {
  if (spareMode.value === 'line-month') {
    // 产线月度趋势：多条折线
    charts.spare?.setOption({
      tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + ' 万元' },
      legend: {
        data: repairLineNames, top: 0, type: 'scroll',
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
      },
      grid: { left: 44, right: 16, top: 28, bottom: 24 },
      xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: { type: 'value', name: '万元', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
      series: buildSpareLineSeries()
    }, { notMerge: true })
    return
  }
  const d = spareTrendData[spareMode.value] || spareTrendData['factory-year']
  charts.spare?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + ' 万元' },
    legend: {
      data: factoryNames, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
    },
    grid: { left: 44, right: 16, top: 28, bottom: 24 },
    xAxis: {
      type: 'category', data: d.x, ...baseAxis, boundaryGap: false, splitLine: { show: false },
      axisLabel: { ...baseAxis.axisLabel, interval: 0, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '万元', nameTextStyle: { color: '#666', fontSize: 10 }, ...baseAxis },
    series: factoryNames.map((name, i) => ({
      name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
      data: d.y[name], itemStyle: { color: factoryColors[i] }, lineStyle: { width: 2 },
      label: { show: true, color: factoryColors[i], fontSize: 9, formatter: (p: any) => p.value ?? '' }
    }))
  }, { notMerge: true })
}

function renderRate() {
  if (rateMode.value === 'line-month') {
    // 各产线月度：多条折线，纵坐标百分数
    charts.rate?.setOption({
      tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + '%' },
      legend: {
        data: repairLineNames, top: 0, type: 'scroll',
        textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
      },
      grid: { left: 40, right: 16, top: 28, bottom: 24 },
      xAxis: { type: 'category', data: months, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
      yAxis: {
        type: 'value', min: 95, max: 100, ...baseAxis,
        axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
      },
      series: buildRateLineSeries()
    }, { notMerge: true })
    return
  }
  const d = rateData[rateMode.value]
  charts.rate?.setOption({
    tooltip: { trigger: 'axis', valueFormatter: (v: any) => v + '%' },
    legend: {
      data: factoryNames, top: 0, right: 0,
      textStyle: { color: '#666', fontSize: 10 }, itemWidth: 14, itemHeight: 8
    },
    grid: { left: 40, right: 16, top: 28, bottom: 24 },
    xAxis: { type: 'category', data: d.x, ...baseAxis, boundaryGap: false, splitLine: { show: false } },
    yAxis: {
      type: 'value', min: (v: any) => Math.floor((v.min - 2) / 10) * 10, max: 100, ...baseAxis,
      axisLabel: { ...baseAxis.axisLabel, formatter: '{value}%' }
    },
    series: factoryNames.map((name, i) => ({
      name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 4,
      data: d.y[name], itemStyle: { color: factoryColors[i] }, lineStyle: { width: 2 },
      label: { show: true, color: factoryColors[i], fontSize: 9, formatter: (p: any) => p.value ?? '' }
    }))
  }, { notMerge: true })
}

// ========== 初始化 ==========
onMounted(async () => {
  await nextTick()
  if (repairTrendChartRef.value) charts.repairTrend = echarts.init(repairTrendChartRef.value)
  if (spareChartRef.value) charts.spare = echarts.init(spareChartRef.value)
  if (rateChartRef.value) charts.rate = echarts.init(rateChartRef.value)
  renderAll()
  window.addEventListener('resize', handleResize)
})

const renderAll = () => {
  renderRepairTrend()
  renderSpare()
  renderRate()
}

const handleResize = () => {
  Object.values(charts).forEach(c => c.resize())
}

watch([repairTrendMode], renderRepairTrend)
watch([spareMode], renderSpare)
watch([rateMode], renderRate)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(c => c.dispose())
})
</script>

<style scoped>
.equipment-dashboard {
  --eq-block-h: 340px;
  padding: 8px;
  background: #fff;
  min-height: calc(100vh - 90px);
  min-width: 1180px;
}

.chart-card {
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
}

.chart-title {
  background: #fff;
  display: inline-block;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  border-radius: 2px;
  margin-bottom: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header .chart-title {
  margin-bottom: 0;
}

.series-select {
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background: #fff;
  color: #333;
  cursor: pointer;
  flex-shrink: 0;
}

/* 第一行：KPI 指标带 */
.kpi-panel {
  margin-bottom: 8px;
}

.kpi-box {
  background: #fff;
  border-radius: 4px;
  padding: 12px 0 8px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
}

.kpi-item {
  min-width: 0;
  text-align: center;
  padding: 0 8px;
}

.kpi-item.group-start {
  border-left: 1px solid #ececec;
}

.kpi-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #222;
  line-height: 1.1;
  white-space: nowrap;
  letter-spacing: -0.5px;
}

.kpi-value .unit {
  font-size: 12px;
  font-weight: 400;
  color: #999;
  margin-left: 3px;
  letter-spacing: 0;
}

.kpi-groups {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  margin-top: 10px;
  padding-top: 7px;
  border-top: 1px dashed #ececec;
}

.kpi-groups span {
  text-align: center;
  font-size: 11px;
  color: #a0a0a0;
  letter-spacing: 1px;
}

/* 字号随容器宽度自适应，避免窄屏下数值被截断 */
@supports (font-size: 1cqw) {
  .kpi-box {
    container-type: inline-size;
  }

  .kpi-value {
    font-size: clamp(16px, 1.7cqw, 26px);
  }

  .kpi-label {
    font-size: clamp(10px, 0.9cqw, 12px);
  }

  .kpi-groups span {
    font-size: clamp(10px, 0.82cqw, 11px);
  }
}

/* 第二行图表：与重点设备概况同高 */
.chart-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.chart-row .chart-card {
  height: var(--eq-block-h);
  display: flex;
  flex-direction: column;
}

.chart-body {
  height: 190px;
}

.chart-row .chart-body {
  flex: 1;
  min-height: 0;
}

/* 第三行重点设备概况：固定高度，内容超出内部滚动（结构与第二行卡片一致） */
.equipment-panel {
  height: var(--eq-block-h);
  background: #f2f2f2;
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.equipment-box {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.eq-tabs {
  display: flex;
  justify-content: space-around;
  border-bottom: 1px solid #dedede;
  margin-bottom: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.eq-tabs button {
  border: none;
  background: none;
  color: #4472c4;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 20px;
  cursor: pointer;
}

.eq-tabs button.active {
  color: #4472c4;
  text-decoration: underline;
  text-underline-offset: 6px;
}

.eq-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: start;
  scrollbar-width: thin;
  scrollbar-color: #b8b8b8 #f2f2f2;
}

.eq-content::-webkit-scrollbar {
  width: 7px;
}

.eq-content::-webkit-scrollbar-thumb {
  background: #b8b8b8;
  border-radius: 4px;
}

.eq-content::-webkit-scrollbar-track {
  background: #ececec;
}

.eq-content > * {
  min-width: 0;
}

/* 叉车 tab：左/中/右三区 */
.eq-content.three-col {
  grid-template-columns: 1fr 1fr 1fr;
}

.eq-content.three-col .bb-row {
  grid-template-columns: 132px 1fr 30px;
}

.eq-content.three-col .bb-name {
  font-size: 11px;
}

/* PLC tab：通栏单表 */
.eq-content.one-col {
  grid-template-columns: 1fr;
}

.plc-table th,
.plc-table td {
  text-align: center;
  padding: 5px 8px;
}

.plc-table th {
  font-weight: 600;
}

.plc-table th:first-child,
.plc-table td:first-child {
  width: 290px;
}

.plc-table tr.row-total td {
  background: #fff;
}

.table-wrapper {
  overflow-x: auto;
}

.eq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.eq-table th, .eq-table td {
  border: 1px solid #333;
  padding: 3px 6px;
  white-space: nowrap;
}

.eq-table th {
  background: #fff;
  font-weight: 500;
  text-align: center;
}

.eq-table td {
  text-align: left;
  background: #fff;
}

.eq-table thead tr {
  background: #fff;
}

.row-total td {
  font-weight: 600;
  background: #f5f7fa;
}

.head-corner {
  position: relative;
  width: 140px;
}

.corner-label {
  display: block;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.4;
}

.corner-label.dim {
  color: #bbb;
  position: absolute;
  top: 3px;
  right: 6px;
}

.corner-label:not(.dim) {
  color: #333;
  text-align: left;
  padding-top: 16px;
}

.text-center { text-align: center; }
.invisible-cell { border-top: none !important; }
.subtotal { font-weight: 600; }

.brand-panel {
  display: flex;
  flex-direction: column;
}

.brand-tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.brand-tabs button {
  border: 1px solid #4472c4;
  background: #fff;
  color: #4472c4;
  font-size: 12px;
  padding: 3px 14px;
  cursor: pointer;
  border-radius: 2px;
}

.brand-tabs button.active {
  background: #4472c4;
  color: #fff;
}

.brand-table .w-40 { width: 40%; }
.brand-table .w-30 { width: 30%; }
.brand-table .w-20 { width: 20%; }

.brand-table td {
  text-align: center;
}

.brand-table .group-name {
  text-align: center;
  font-size: 13px;
  background: #fff;
}

/* 机器人 / 熔炼设备 tab：左侧指标 + 设备状态表 */
.device-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.device-summary {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 12px 16px;
  background: #f4f7ff;
  border-radius: 4px;
}

.rs-item {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
}

.rs-label {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.rs-value {
  font-size: 22px;
  font-weight: 700;
  color: #4472c4;
  margin: 0 3px;
  line-height: 1;
}

.rs-unit {
  font-size: 12px;
  color: #888;
}

.rs-divider {
  width: 1px;
  height: 22px;
  background: #d5ddf0;
  flex-shrink: 0;
}

.device-table th {
  background: #d9e2f8;
  font-weight: 600;
}

.device-table td {
  text-align: left;
  padding: 6px 10px;
}

.device-table tbody tr:not(.row-total) td:first-child {
  padding-left: 20px;
}

/* 熔炼设备：设备明细表 */
.smelt-table th,
.smelt-table td {
  text-align: center;
  padding: 5px 8px;
}

/* 三坐标：产线/车间 + 品牌表 */
.coord-table th {
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  padding: 10px 8px;
}

.coord-table td {
  font-size: 14px;
  text-align: center;
  padding: 10px 8px;
}

.coord-table td:first-child {
  white-space: normal;
}

.coord-table tr.row-total td {
  background: #fff;
}

/* 机器人 tab：右侧品牌分布条形列表 */
.brand-title {
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.brand-bars {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 4px;
}

.bb-row {
  display: grid;
  grid-template-columns: 168px 1fr 34px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 3px 0;
}

.bb-name {
  text-align: right;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-track {
  display: block;
  height: 10px;
  background: #f0f2f7;
  border-radius: 5px;
  overflow: hidden;
}

.bb-fill {
  display: block;
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #a8bcf0 0%, #4472c4 100%);
}

.bb-value {
  text-align: right;
  color: #333;
  font-weight: 600;
}

.brand-bars::-webkit-scrollbar {
  width: 5px;
}

.brand-bars::-webkit-scrollbar-thumb {
  background: #c8d2e6;
  border-radius: 3px;
}

.brand-bars::-webkit-scrollbar-track {
  background: #f2f2f2;
}
</style>
