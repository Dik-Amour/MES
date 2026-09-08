<template>
  <div class="vibration-core-record">
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline">
        <a-form-item label="产线">
          <a-select
            v-model:value="searchForm.productionLine"
            placeholder="请选择产线"
            allow-clear
            style="width: 200px"
          >
            <a-select-option v-for="line in productionLineOptions" :key="line" :value="line">
              {{ line }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="设备名称">
          <a-input
            v-model:value="searchForm.equipmentName"
            placeholder="请输入设备名称"
            allow-clear
            style="width: 160px"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="子工位名称">
          <a-input
            v-model:value="searchForm.subWorkstation"
            placeholder="请输入子工位名称"
            allow-clear
            style="width: 160px"
            @pressEnter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="日期区间">
          <a-range-picker v-model:value="searchForm.dateRange" format="YYYY-MM-DD" :placeholder="['开始日期', '结束日期']" style="width: 260px" />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="'id'"
        :scroll="{ x: 1300 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const productionLineOptions = [
  '造型三线HWS清理',
  '造型三线KW清理',
  '造型二线大件清理',
  '造型二线中件清理',
  '造型一线大件清理',
  '造型一线中件清理'
]

const searchForm = reactive({
  productionLine: undefined as string | undefined,
  equipmentName: '',
  subWorkstation: '',
  dateRange: null as any
})

const loading = ref(false)

const mockData = [
  { id: 1, productionLine: '造型三线HWS清理', workstation: 'A工位', subWorkstation: 'A-01', equipment: '振芯机-01', loadTime: '2026-09-03 08:00', unloadTime: '2026-09-03 08:25', pressure: 4.5, duration: 180, scheduler: '周九', operator: '张三' },
  { id: 2, productionLine: '造型三线HWS清理', workstation: 'A工位', subWorkstation: 'A-02', equipment: '振芯机-01', loadTime: '2026-09-03 08:30', unloadTime: '2026-09-03 08:55', pressure: 4.8, duration: 195, scheduler: '吴十', operator: '李四' },
  { id: 3, productionLine: '造型三线KW清理', workstation: 'B工位', subWorkstation: 'B-01', equipment: '振芯机-02', loadTime: '2026-09-03 09:10', unloadTime: '2026-09-03 09:40', pressure: 5.0, duration: 200, scheduler: '冯一', operator: '王五' },
  { id: 4, productionLine: '造型二线大件清理', workstation: 'C工位', subWorkstation: 'C-01', equipment: '振芯机-03', loadTime: '2026-09-03 10:00', unloadTime: '2026-09-03 10:35', pressure: 5.2, duration: 210, scheduler: '陈二', operator: '赵六' },
  { id: 5, productionLine: '造型二线大件清理', workstation: 'C工位', subWorkstation: 'C-02', equipment: '振芯机-03', loadTime: '2026-09-03 10:45', unloadTime: '2026-09-03 11:15', pressure: 4.9, duration: 190, scheduler: '林三', operator: '钱七' },
  { id: 6, productionLine: '造型二线中件清理', workstation: 'D工位', subWorkstation: 'D-01', equipment: '振芯机-04', loadTime: '2026-09-03 13:00', unloadTime: '2026-09-03 13:25', pressure: 4.6, duration: 175, scheduler: '郑四', operator: '孙八' },
  { id: 7, productionLine: '造型一线大件清理', workstation: 'E工位', subWorkstation: 'E-01', equipment: '振芯机-05', loadTime: '2026-09-03 14:00', unloadTime: '2026-09-03 14:30', pressure: 5.1, duration: 205, scheduler: '黄五', operator: '周九' },
  { id: 8, productionLine: '造型一线中件清理', workstation: 'F工位', subWorkstation: 'F-01', equipment: '振芯机-06', loadTime: '2026-09-03 15:00', unloadTime: '2026-09-03 15:28', pressure: 4.7, duration: 185, scheduler: '刘六', operator: '张三' }
]

const dataSource = ref([...mockData])

const filteredData = computed(() => {
  let result = dataSource.value
  if (searchForm.productionLine) {
    result = result.filter(item => item.productionLine === searchForm.productionLine)
  }
  if (searchForm.equipmentName) {
    const keyword = searchForm.equipmentName.trim().toLowerCase()
    result = result.filter(item => item.equipment.toLowerCase().includes(keyword))
  }
  if (searchForm.subWorkstation) {
    const keyword = searchForm.subWorkstation.trim().toLowerCase()
    result = result.filter(item => item.subWorkstation.toLowerCase().includes(keyword))
  }
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const start = searchForm.dateRange[0].format('YYYY-MM-DD')
    const end = searchForm.dateRange[1].format('YYYY-MM-DD')
    result = result.filter(i => {
      const timeField = i.startTime || i.loadTime || i.coatingStartTime || i.time || ''
      return timeField >= start && timeField <= end + ' 23:59:59'
    })
  }
  return result
})

const columns = [
  { title: '序号', key: 'index', width: 70, fixed: 'left' as const },
  { title: '产线', dataIndex: 'productionLine', width: 160 },
  { title: '工位', dataIndex: 'workstation', width: 100 },
  { title: '子工位', dataIndex: 'subWorkstation', width: 100 },
  { title: '设备', dataIndex: 'equipment', width: 120 },
  { title: '振击开始时间', dataIndex: 'loadTime', width: 170 },
  { title: '振击结束时间', dataIndex: 'unloadTime', width: 170 },
  { title: '振击压力(MPa)', dataIndex: 'pressure', width: 130 },
  { title: '振击时长(s)', dataIndex: 'duration', width: 120 },
  { title: '排班人', dataIndex: 'scheduler', width: 100 },
  { title: '上机人', dataIndex: 'operator', width: 100 }
]

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: mockData.length,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

const handleSearch = () => {
  pagination.current = 1
  pagination.total = filteredData.value.length
  message.success('查询完成')
}

const handleReset = () => {
  searchForm.productionLine = undefined
  searchForm.equipmentName = ''
  searchForm.subWorkstation = ''
  searchForm.dateRange = null
  pagination.current = 1
  pagination.total = filteredData.value.length
  message.success('已重置')
}


</script>

<style scoped>
.vibration-core-record {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card :deep(.ant-form-item) {
  margin-bottom: 0;
}
</style>
