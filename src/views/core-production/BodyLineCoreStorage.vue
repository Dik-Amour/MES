<template>
  <div class="body-line-core-storage">
    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="托盘码">
          <a-input
            v-model:value="query.palletCode"
            placeholder="请输入托盘码"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="制芯设备编号">
          <a-input
            v-model:value="query.deviceCode"
            placeholder="请输入制芯设备编号"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="物料名称">
          <a-input
            v-model:value="query.materialName"
            placeholder="请输入物料名称"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="虚拟库状态">
          <a-select
            v-model:value="query.virtualStatus"
            placeholder="请选择状态"
            allow-clear
            :options="statusOptions"
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item label="入库时间">
          <a-range-picker
            v-model:value="query.dateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
          />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleQuery">
              <SearchOutlined /> 查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item" v-for="stat in stats" :key="stat.label">
        <div class="stat-value stat-blue">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 机体线砂芯库表格 -->
    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="pagedData"
        :pagination="false"
        bordered
        size="small"
        class="data-table"
        :scroll="{ x: 2400 }"
        :row-key="(record: any) => record.key"
      >
        <template #bodyCell="{ column, record }">
          <!-- 砂芯数量 -->
          <template v-if="column.dataIndex === 'coreQty'">
            {{ record.coreQty }}
          </template>
          <!-- 虚拟库状态 -->
          <template v-else-if="column.dataIndex === 'virtualStatus'">
            <a-tag :color="statusColorMap[record.virtualStatus]">
              {{ record.virtualStatus }}
            </a-tag>
          </template>
          <!-- 空值显示为 — -->
          <template v-else-if="emptyFallbackKeys.includes(column.dataIndex)">
            {{ record[column.dataIndex] || '—' }}
          </template>
        </template>
      </a-table>
      <div class="table-pagination">
        <a-pagination
          v-model:current="page"
          :page-size="pageSize"
          :total="filteredData.length"
          :show-size-changer="false"
          :show-total="(total: number) => `共 ${total} 条`"
          size="small"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 查询条件
const query = ref<{
  palletCode: string
  deviceCode: string
  materialName: string
  virtualStatus?: string
  dateRange: [Dayjs, Dayjs] | null
}>({
  palletCode: '',
  deviceCode: '',
  materialName: '',
  virtualStatus: undefined,
  dateRange: null
})

const statusOptions = [
  { value: '已入库', label: '已入库' },
  { value: '待映射', label: '待映射' },
  { value: '已组芯', label: '已组芯' },
  { value: '已出库', label: '已出库' }
]

const statusColorMap: Record<string, string> = {
  已入库: 'green',
  待映射: 'orange',
  已组芯: 'purple',
  已出库: 'blue'
}

// 空值显示为 — 的列
const emptyFallbackKeys = ['outTime', 'processParam']

// 表格列
const columns = [
  { title: '托盘码', dataIndex: 'palletCode', key: 'palletCode', width: 150, align: 'center' as const },
  { title: '上料口编号', dataIndex: 'feedPortNo', key: 'feedPortNo', width: 110, align: 'center' as const },
  { title: '制芯设备编号', dataIndex: 'deviceCode', key: 'deviceCode', width: 130, align: 'center' as const },
  { title: '制芯设备名称', dataIndex: 'deviceName', key: 'deviceName', width: 140 },
  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode', width: 130, align: 'center' as const },
  { title: '物料名称', dataIndex: 'materialName', key: 'materialName', width: 170 },
  { title: '立库物料编号', dataIndex: 'wmsMaterialCode', key: 'wmsMaterialCode', width: 170, align: 'center' as const },
  { title: '立库物料名称', dataIndex: 'wmsMaterialName', key: 'wmsMaterialName', width: 180 },
  { title: '砂芯数量', dataIndex: 'coreQty', key: 'coreQty', width: 90, align: 'center' as const },
  { title: '虚拟库状态', dataIndex: 'virtualStatus', key: 'virtualStatus', width: 110, align: 'center' as const },
  { title: '工艺参数', dataIndex: 'processParam', key: 'processParam', width: 260 },
  { title: '入库时间', dataIndex: 'inTime', key: 'inTime', width: 170 },
  { title: '在库时长', dataIndex: 'inDuration', key: 'inDuration', width: 120, align: 'center' as const },
  { title: '出库时间', dataIndex: 'outTime', key: 'outTime', width: 170 }
]

interface StorageRow {
  key: number
  palletCode: string
  feedPortNo: string
  deviceCode: string
  deviceName: string
  materialCode: string
  materialName: string
  wmsMaterialCode: string
  wmsMaterialName: string
  coreQty: number
  virtualStatus: string
  processParam: string
  inTime: string
  outTime: string
}

// 模拟数据
let rowKey = 0
const storageData = ref<StorageRow[]>([
  { key: ++rowKey, palletCode: 'TP20261101001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002345', materialName: '机体水套砂芯', wmsMaterialCode: 'WMS-SC-10002345', wmsMaterialName: '机体水套砂芯(立库)', coreQty: 12, virtualStatus: '已入库', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-01 08:15:20', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261101002', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002346', materialName: '机体主油道砂芯', wmsMaterialCode: 'WMS-SC-10002346', wmsMaterialName: '机体主油道砂芯(立库)', coreQty: 10, virtualStatus: '已入库', processParam: '射芯压力0.42MPa；固化温度175℃；固化时间50s', inTime: '2026-11-01 09:30:12', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261101003', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '待映射', processParam: '射芯压力0.40MPa；固化温度180℃；固化时间40s', inTime: '2026-11-01 10:45:36', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261101004', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '已入库', processParam: '射芯压力0.48MPa；固化温度185℃；固化时间55s', inTime: '2026-11-01 13:20:05', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261101005', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002349', materialName: '机体水套砂芯B', wmsMaterialCode: 'WMS-SC-10002349', wmsMaterialName: '机体水套砂芯B(立库)', coreQty: 12, virtualStatus: '已组芯', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-01 15:02:44', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261101006', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002350', materialName: '机体回油道砂芯', wmsMaterialCode: 'WMS-SC-10002350', wmsMaterialName: '机体回油道砂芯(立库)', coreQty: 9, virtualStatus: '已出库', processParam: '射芯压力0.43MPa；固化温度178℃；固化时间48s', inTime: '2026-11-01 16:18:27', outTime: '2026-11-02 08:05:10' },
  { key: ++rowKey, palletCode: 'TP20261102001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002345', materialName: '机体水套砂芯', wmsMaterialCode: 'WMS-SC-10002345', wmsMaterialName: '机体水套砂芯(立库)', coreQty: 12, virtualStatus: '已入库', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-02 08:32:15', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261102002', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002351', materialName: '机体正时罩壳砂芯', wmsMaterialCode: 'WMS-SC-10002351', wmsMaterialName: '机体正时罩壳砂芯(立库)', coreQty: 7, virtualStatus: '已组芯', processParam: '射芯压力0.41MPa；固化温度182℃；固化时间42s', inTime: '2026-11-02 09:47:53', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261102003', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002346', materialName: '机体主油道砂芯', wmsMaterialCode: 'WMS-SC-10002346', wmsMaterialName: '机体主油道砂芯(立库)', coreQty: 10, virtualStatus: '已出库', processParam: '射芯压力0.42MPa；固化温度175℃；固化时间50s', inTime: '2026-11-02 11:12:08', outTime: '2026-11-02 17:26:41' },
  { key: ++rowKey, palletCode: 'TP20261102004', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002352', materialName: '机体挺柱室砂芯', wmsMaterialCode: 'WMS-SC-10002352', wmsMaterialName: '机体挺柱室砂芯(立库)', coreQty: 11, virtualStatus: '已入库', processParam: '射芯压力0.46MPa；固化温度180℃；固化时间46s', inTime: '2026-11-02 14:05:39', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261103001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '已入库', processParam: '射芯压力0.40MPa；固化温度180℃；固化时间40s', inTime: '2026-11-03 08:10:26', outTime: '' },
  { key: ++rowKey, palletCode: 'TP20261103002', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '待映射', processParam: '射芯压力0.48MPa；固化温度185℃；固化时间55s', inTime: '2026-11-03 09:58:14', outTime: '' }
])

// 在库时长
const formatDuration = (inTime: string, outTime: string) => {
  if (!inTime) return ''
  const start = dayjs(inTime)
  const end = outTime ? dayjs(outTime) : dayjs()
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return ''
  const diff = end.diff(start)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}天${hours}小时`
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分`
}

const rows = computed(() =>
  storageData.value.map(item => ({
    ...item,
    inDuration: formatDuration(item.inTime, item.outTime)
  }))
)

// 统计数据
const stats = computed(() => {
  const inStock = rows.value.filter(d => d.virtualStatus !== '已出库')
  const today = dayjs().format('YYYY-MM-DD')
  return [
    { label: '在库托盘数', value: inStock.length },
    { label: '在库砂芯总数', value: inStock.reduce((sum, d) => sum + d.coreQty, 0) },
    { label: '今日入库', value: rows.value.filter(d => d.inTime.startsWith(today)).length },
    { label: '已出库', value: rows.value.filter(d => d.virtualStatus === '已出库').length }
  ]
})

// 筛选
const filteredData = computed(() => {
  const [start, end] = query.value.dateRange ?? []
  const startStr = start ? start.format('YYYY-MM-DD') : ''
  const endStr = end ? end.format('YYYY-MM-DD') : ''
  return rows.value.filter(item => {
    const matchPallet = !query.value.palletCode || item.palletCode.includes(query.value.palletCode)
    const matchDevice = !query.value.deviceCode || item.deviceCode.includes(query.value.deviceCode)
    const matchName = !query.value.materialName || item.materialName.includes(query.value.materialName)
    const matchStatus = !query.value.virtualStatus || item.virtualStatus === query.value.virtualStatus
    const day = item.inTime.slice(0, 10)
    const matchDate = (!startStr || day >= startStr) && (!endStr || day <= endStr)
    return matchPallet && matchDevice && matchName && matchStatus && matchDate
  })
})

// 分页
const page = ref(1)
const pageSize = 10
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

// 查询
const handleQuery = () => {
  page.value = 1
  message.success('查询成功')
}

// 重置
const handleReset = () => {
  query.value = {
    palletCode: '',
    deviceCode: '',
    materialName: '',
    virtualStatus: undefined,
    dateRange: null
  }
  page.value = 1
  message.info('已重置')
}
</script>

<style scoped>
.body-line-core-storage {
  padding: 0;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-blue {
  color: #1677ff;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #888;
}

.data-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
