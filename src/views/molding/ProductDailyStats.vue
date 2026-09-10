<template>
  <div class="product-daily-stats">

    <!-- 造型线模块 -->
    <a-card :bordered="false">
      <div class="section-header">
        <a-tag color="blue" class="section-tag">造型线</a-tag>
      </div>
      <a-tabs v-model:activeKey="moldingActiveTab" class="molding-tabs">
        <a-tab-pane v-for="tab in moldingTabs" :key="tab.key" :tab="tab.label" />
      </a-tabs>

      <!-- 造型线统计 -->
      <div class="stats-row">
        <div class="stat-item" v-for="stat in moldingStats" :key="stat.label">
          <div class="stat-value" :class="{ 'stat-blue': stat.blue }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>

      <!-- 造型线表格 -->
      <a-table
        :columns="moldingColumns"
        :data-source="moldingData"
        :pagination="false"
        :locale="{ emptyText: '暂无数据' }"
        bordered
        size="small"
        class="data-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === '进行中' ? 'blue' : 'default'">
              {{ record.status }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 制芯和清理平级并排 -->
    <div class="bottom-section">
      <!-- 制芯模块 -->
      <a-card :bordered="false" class="half-width">
        <div class="section-header">
          <a-tag color="blue" class="section-tag">制芯</a-tag>
        </div>

        <!-- 根据产线类型显示不同制芯内容 -->
        <template v-if="coreType === 'main'">
          <!-- 主体芯制芯中心（大件产线） -->
          <div class="station-info">
            <div class="station-stats">
              <div class="stat-item">
                <div class="stat-label">工位</div>
                <div class="stat-value stat-blue">主体芯制芯工位</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">400</div>
                <div class="stat-label">计划颗数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">2026-06-11 08:32:32</div>
                <div class="stat-label">首模生产时间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">400</div>
                <div class="stat-label">实际生产颗数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">80%</div>
                <div class="stat-label">生产效率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">4.25</div>
                <div class="stat-label">运行时长</div>
              </div>
            </div>
          </div>

          <!-- 砂芯明细表格 -->
          <a-table
            :columns="coreDetailColumns"
            :data-source="coreDetailData"
            :pagination="false"
            bordered
            size="small"
            class="data-table core-detail-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <a-tag :color="record.status === '进行中' ? 'blue' : record.status === '待开始' ? 'orange' : 'default'">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>

          <!-- 浸涂机器人 -->
          <div class="station-info dipping-station">
            <div class="station-stats">
              <div class="stat-item">
                <div class="stat-label">工位</div>
                <div class="stat-value stat-blue">浸涂机器人</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">400</div>
                <div class="stat-label">生产数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">47.06颗/小时</div>
                <div class="stat-label">生产效率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">08:00:00</div>
                <div class="stat-label">启动时间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">16:30:00</div>
                <div class="stat-label">关闭时间</div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="coreType === 'chassis'">
          <!-- 底盘制芯机（二线中件/三线HWS） -->
          <div class="station-info">
            <div class="station-stats">
              <div class="stat-item">
                <div class="stat-label">工位</div>
                <div class="stat-value stat-blue">底盘制芯机</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">300</div>
                <div class="stat-label">计划颗数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">07:00:00</div>
                <div class="stat-label">首模生产时间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">280</div>
                <div class="stat-label">实际生产颗数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">93.33%</div>
                <div class="stat-label">生产效率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">3.8</div>
                <div class="stat-label">运行时长</div>
              </div>
            </div>
          </div>

          <!-- 底盘芯明细表格 -->
          <a-table
            :columns="chassisCoreColumns"
            :data-source="chassisCoreData"
            :pagination="false"
            bordered
            size="small"
            class="data-table core-detail-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <a-tag :color="record.status === '进行中' ? 'blue' : record.status === '待开始' ? 'orange' : 'default'">
                  {{ record.status }}
                </a-tag>
              </template>
            </template>
          </a-table>

          <!-- 底盘芯浸涂机器人 -->
          <div class="station-info dipping-station">
            <div class="station-stats">
              <div class="stat-item">
                <div class="stat-label">工位</div>
                <div class="stat-value stat-blue">底盘芯浸涂机器人</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">280</div>
                <div class="stat-label">生产数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">32.94颗/小时</div>
                <div class="stat-label">生产效率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">07:00:00</div>
                <div class="stat-label">启动时间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">15:30:00</div>
                <div class="stat-label">关闭时间</div>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- 浸涂机器人（一线中件） -->
          <div class="station-info">
            <div class="station-stats">
              <div class="stat-item">
                <div class="stat-label">工位</div>
                <div class="stat-value stat-blue">浸涂机器人</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">350</div>
                <div class="stat-label">生产数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">41.18颗/小时</div>
                <div class="stat-label">生产效率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">08:00:00</div>
                <div class="stat-label">启动时间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value stat-blue">16:30:00</div>
                <div class="stat-label">关闭时间</div>
              </div>
            </div>
          </div>
        </template>
      </a-card>

      <!-- 清理模块 -->
      <a-card :bordered="false" class="half-width">
        <div class="section-header">
          <a-tag color="blue" class="section-tag">清理</a-tag>
        </div>

        <!-- 造型一线中件：只展示磨床 -->
        <template v-if="moldingActiveTab === 'line1-medium'">
          <div class="station-row">
            <div class="station-info">
              <div class="station-stats">
                <div class="stat-item">
                  <div class="stat-label">工位</div>
                  <div class="stat-value stat-blue">磨床</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">08:00:00</div>
                  <div class="stat-label">开启时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">16:30:00</div>
                  <div class="stat-label">结束时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">350</div>
                  <div class="stat-label">生产数量</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">91.67%</div>
                  <div class="stat-label">生产效率</div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 其余产线：粗抛、精抛、打码 -->
        <template v-else>
          <!-- 粗抛 -->
          <div class="station-row">
            <div class="station-info">
              <div class="station-stats">
                <div class="stat-item">
                  <div class="stat-label">工位</div>
                  <div class="stat-value stat-blue">粗抛</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">08:30:00</div>
                  <div class="stat-label">开启时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">15:45:00</div>
                  <div class="stat-label">结束时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">400</div>
                  <div class="stat-label">生产数量</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">88.50%</div>
                  <div class="stat-label">生产效率</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 精抛 -->
          <div class="station-row">
            <div class="station-info">
              <div class="station-stats">
                <div class="stat-item">
                  <div class="stat-label">工位</div>
                  <div class="stat-value stat-blue">精抛</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">09:00:00</div>
                  <div class="stat-label">开启时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">16:00:00</div>
                  <div class="stat-label">结束时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">380</div>
                  <div class="stat-label">生产数量</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">85.20%</div>
                  <div class="stat-label">生产效率</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 打码（无生产效率） -->
          <div class="station-row">
            <div class="station-info">
              <div class="station-stats">
                <div class="stat-item">
                  <div class="stat-label">工位</div>
                  <div class="stat-value stat-blue">打码</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">09:30:00</div>
                  <div class="stat-label">开启时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">16:30:00</div>
                  <div class="stat-label">结束时间</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value stat-blue">360</div>
                  <div class="stat-label">生产数量</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 造型线Tab
const moldingActiveTab = ref('line1-large')
const moldingTabs = [
  { key: 'line1-large', label: '造型一线大件造型' },
  { key: 'line1-medium', label: '造型一线中件造型' },
  { key: 'line2-medium', label: '造型二线中件造型' },
  { key: 'line2-large', label: '造型二线大件造型' },
  { key: 'line3-hws', label: '造型三线HWS造型' }
]

// 制芯类型计算：根据产线决定制芯模块内容
const coreType = computed(() => {
  const tab = moldingActiveTab.value
  // 造型二线中件 & 造型三线HWS：底盘制芯机
  if (tab === 'line2-medium' || tab === 'line3-hws') {
    return 'chassis'
  }
  // 造型一线中件：浸涂机器人
  if (tab === 'line1-medium') {
    return 'dipping'
  }
  // 其余大件产线：主体芯制芯中心
  return 'main'
})

// 造型线统计数据
const moldingStats = computed(() => {
  const data = mockMoldingData[moldingActiveTab.value]
  return [
    { label: '计划箱数', value: data?.planBoxes ?? 0, blue: true },
    { label: '造型箱数', value: data?.moldingBoxes ?? 0, blue: true },
    { label: '实际浇注箱数', value: data?.actualPourBoxes ?? 0, blue: true },
    { label: '总运行时长', value: data?.totalRunTime ?? 0, blue: true },
    { label: '出产吨位', value: data?.outputTonnage ?? '-', blue: false },
    { label: '生产效率', value: data?.efficiency ?? '-', blue: false },
    { label: '首箱浇注时间', value: data?.firstPourTime ?? '-', blue: false },
    { label: '末箱浇注时间', value: data?.lastPourTime ?? '-', blue: false }
  ]
})

// 造型线表格列
const moldingColumns = [
  { title: '系列', dataIndex: 'series', key: 'series', width: 120 },
  { title: '件号', dataIndex: 'partNo', key: 'partNo', width: 120 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '计划箱数', dataIndex: 'planBoxes', key: 'planBoxes', width: 100, align: 'center' as const },
  { title: '造型箱数', dataIndex: 'moldingBoxes', key: 'moldingBoxes', width: 100, align: 'center' as const },
  { title: '浇注箱数', dataIndex: 'pourBoxes', key: 'pourBoxes', width: 100, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const }
]

// 造型线模拟数据（按Tab分组）
const mockMoldingData: Record<string, any> = {
  'line1-large': {
    planBoxes: 0, moldingBoxes: 0, actualPourBoxes: 0, totalRunTime: 0,
    outputTonnage: '-', efficiency: '-', firstPourTime: '-', lastPourTime: '-',
    items: []
  },
  'line1-medium': {
    planBoxes: 120, moldingBoxes: 115, actualPourBoxes: 110, totalRunTime: 8.5,
    outputTonnage: '12.5', efficiency: '91.67%', firstPourTime: '2026-06-11 08:00:00', lastPourTime: '2026-06-11 16:30:00',
    items: [
      { key: '1', series: 'WP12', partNo: 'WP12-001', name: '发动机缸体', planBoxes: 60, moldingBoxes: 58, pourBoxes: 55, status: '进行中' },
      { key: '2', series: 'WP12', partNo: 'WP12-002', name: '发动机缸盖', planBoxes: 60, moldingBoxes: 57, pourBoxes: 55, status: '进行中' }
    ]
  },
  'line2-medium': {
    planBoxes: 100, moldingBoxes: 95, actualPourBoxes: 90, totalRunTime: 7.2,
    outputTonnage: '10.8', efficiency: '90.00%', firstPourTime: '2026-06-11 08:15:00', lastPourTime: '2026-06-11 15:45:00',
    items: [
      { key: '1', series: 'WP13', partNo: 'WP13-001', name: '变速箱壳体', planBoxes: 50, moldingBoxes: 48, pourBoxes: 45, status: '进行中' },
      { key: '2', series: 'WP13', partNo: 'WP13-002', name: '离合器壳体', planBoxes: 50, moldingBoxes: 47, pourBoxes: 45, status: '进行中' }
    ]
  },
  'line2-large': {
    planBoxes: 80, moldingBoxes: 75, actualPourBoxes: 70, totalRunTime: 6.8,
    outputTonnage: '15.2', efficiency: '87.50%', firstPourTime: '2026-06-11 08:30:00', lastPourTime: '2026-06-11 15:15:00',
    items: [
      { key: '1', series: 'WP12', partNo: 'WP12-010', name: '大型支架', planBoxes: 40, moldingBoxes: 38, pourBoxes: 35, status: '进行中' },
      { key: '2', series: 'WP12', partNo: 'WP12-011', name: '重型底座', planBoxes: 40, moldingBoxes: 37, pourBoxes: 35, status: '进行中' }
    ]
  },
  'line3-hws': {
    planBoxes: 150, moldingBoxes: 145, actualPourBoxes: 140, totalRunTime: 9.2,
    outputTonnage: '18.5', efficiency: '93.33%', firstPourTime: '2026-06-11 07:45:00', lastPourTime: '2026-06-11 17:00:00',
    items: [
      { key: '1', series: 'WP14', partNo: 'WP14-001', name: '液压阀体', planBoxes: 75, moldingBoxes: 73, pourBoxes: 70, status: '进行中' },
      { key: '2', series: 'WP14', partNo: 'WP14-002', name: '液压缸体', planBoxes: 75, moldingBoxes: 72, pourBoxes: 70, status: '进行中' }
    ]
  }
}

// 造型线表格数据
const moldingData = computed(() => {
  return mockMoldingData[moldingActiveTab.value]?.items ?? []
})

// 主体芯明细表格列
const coreDetailColumns = [
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 150 },
  { title: '计划颗数', dataIndex: 'planCount', key: 'planCount', width: 100, align: 'center' as const },
  { title: '数采颗数', dataIndex: '采Count', key: '采Count', width: 100, align: 'center' as const },
  { title: '报工颗数', dataIndex: 'reportCount', key: 'reportCount', width: 100, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const }
]

// 主体芯明细模拟数据
const coreDetailData = ref([
  { key: '1', coreName: '底盘芯', planCount: 200, 采Count: 200, reportCount: 200, status: '进行中' },
  { key: '2', coreName: '主体芯', planCount: 200, 采Count: 200, reportCount: 200, status: '待开始' }
])

// 底盘芯明细表格列
const chassisCoreColumns = [
  { title: '砂芯名称', dataIndex: 'coreName', key: 'coreName', width: 150 },
  { title: '计划颗数', dataIndex: 'planCount', key: 'planCount', width: 100, align: 'center' as const },
  { title: '数采颗数', dataIndex: '采Count', key: '采Count', width: 100, align: 'center' as const },
  { title: '报工颗数', dataIndex: 'reportCount', key: 'reportCount', width: 100, align: 'center' as const },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const }
]

// 底盘芯明细模拟数据
const chassisCoreData = ref([
  { key: '1', coreName: '底盘芯', planCount: 300, 采Count: 280, reportCount: 280, status: '进行中' }
])
</script>

<style scoped>
.product-daily-stats {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
}

.record-type-btn {
  font-size: 16px;
  font-weight: 500;
  color: #1890ff;
  padding: 0;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.section-header {
  margin-bottom: 12px;
}

.section-tag {
  font-size: 14px;
  font-weight: 500;
  padding: 2px 12px;
}

.molding-tabs {
  margin-bottom: 16px;
}

.molding-tabs :deep(.ant-tabs-tab) {
  font-size: 14px;
}

.molding-tabs :deep(.ant-tabs-tab-active) {
  color: #1890ff;
}

.molding-tabs :deep(.ant-tabs-nav) {
  display: flex;
  justify-content: center;
  margin: 0;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  padding: 20px 16px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.stat-blue {
  color: #1890ff;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.data-table {
  margin-top: 8px;
}

.data-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

/* 制芯和清理平级并排布局 */
.bottom-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.half-width {
  flex: 1;
  min-width: 0;
}

.station-info {
  margin-bottom: 12px;
}

.station-stats {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 24px;
  padding: 14px 12px;
  background: #fafafa;
  border-radius: 4px;
}

.station-stats .stat-item {
  min-width: 0;
  white-space: nowrap;
}

.station-stats .stat-value {
  font-size: 16px;
}

.station-stats .stat-label {
  font-size: 12px;
}

.core-detail-table {
  margin-top: 12px;
}

.dipping-station {
  margin-top: 12px;
}

.station-row {
  margin-bottom: 8px;
}

.station-row:last-child {
  margin-bottom: 0;
}
</style>
