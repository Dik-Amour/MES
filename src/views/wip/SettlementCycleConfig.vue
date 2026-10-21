<template>
  <div class="settlement-cycle-config">
    <!-- 筛选区 -->
    <a-card :bordered="false" class="filter-card">
      <a-row align="middle" justify="space-between">
        <a-col>
          <a-form layout="inline" :model="searchForm">
            <a-form-item label="查询年份">
              <a-select
                v-model:value="searchForm.year"
                placeholder="请选择年份"
                style="width: 140px"
                @change="handleSearch"
              >
                <a-select-option v-for="y in yearOptions" :key="y" :value="y">
                  {{ y }}年
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-form>
        </a-col>
        <a-col>
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined />
            查询
          </a-button>
        </a-col>
      </a-row>
    </a-card>

    <!-- 数据表格 -->
    <a-card :bordered="false" class="table-card">
      <template #title>
        <a-row align="middle" justify="space-between">
          <a-col>
            <a-button type="primary" @click="openAddModal">
              <PlusOutlined />
              新增配置
            </a-button>
          </a-col>
        </a-row>
      </template>
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        row-key="id"
        size="middle"
        bordered
        :pagination="pagination"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditModal(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除该配置吗？"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" size="small" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditing ? '编辑生产结算周期配置' : '新增生产结算周期配置'"
      :width="520"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="年份月份" name="periodMonth">
          <a-date-picker
            v-model:value="formData.periodMonth"
            picker="month"
            :allow-clear="false"
            format="YYYY年MM月"
            style="width: 100%"
            @change="handlePeriodMonthChange"
          />
        </a-form-item>
        <a-form-item label="起始日期" name="startDate">
          <a-date-picker
            v-model:value="formData.startDate"
            :allow-clear="false"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="结算日期" name="endDate">
          <a-date-picker
            v-model:value="formData.endDate"
            :allow-clear="false"
            format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

dayjs.locale('zh-cn')

interface SettlementCycle {
  id: number
  periodMonth: string       // 'YYYY-MM'
  startDate: string         // 'YYYY-MM-DD'
  endDate: string           // 'YYYY-MM-DD'
  periodLabel: string       // 'YYYY年MM月'
  creator: string           // 创建人
  createTime: string        // 创建时间 'YYYY-MM-DD HH:mm:ss'
}

// 模拟数据
const mockData: SettlementCycle[] = [
  {
    id: 1,
    periodMonth: '2026-01',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    periodLabel: '2026年01月',
    creator: '张三',
    createTime: '2025-12-20 09:00:00'
  },
  {
    id: 2,
    periodMonth: '2026-02',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    periodLabel: '2026年02月',
    creator: '李四',
    createTime: '2026-01-05 10:15:30'
  },
  {
    id: 3,
    periodMonth: '2026-03',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    periodLabel: '2026年03月',
    creator: '张三',
    createTime: '2026-02-03 14:20:00'
  },
  {
    id: 4,
    periodMonth: '2026-04',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    periodLabel: '2026年04月',
    creator: '王五',
    createTime: '2026-03-10 08:30:15'
  },
  {
    id: 5,
    periodMonth: '2026-05',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    periodLabel: '2026年05月',
    creator: '李四',
    createTime: '2026-04-02 16:45:00'
  },
  {
    id: 6,
    periodMonth: '2026-06',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    periodLabel: '2026年06月',
    creator: '张三',
    createTime: '2026-05-08 11:10:00'
  }
]

const loading = ref(false)
const tableData = ref<SettlementCycle[]>([])
const yearOptions = [2025, 2026, 2027]
const searchForm = reactive({ year: 2026 })

// 表格列定义
const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 70, align: 'center' as const },
  { title: '年份月份', dataIndex: 'periodLabel', key: 'periodLabel', width: 140, align: 'center' as const },
  { title: '起始日期', dataIndex: 'startDate', key: 'startDate', width: 140, align: 'center' as const },
  { title: '结算日期', dataIndex: 'endDate', key: 'endDate', width: 140, align: 'center' as const },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170, align: 'center' as const },
  { title: '操作', key: 'action', width: 160, align: 'center' as const }
]

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number, pageSize: number) => {
    pagination.current = page
    pagination.pageSize = pageSize
  }
})

// 筛选后数据（按年份月份倒序，带序号）
const filteredData = computed(() =>
  tableData.value
    .filter(item => dayjs(item.periodMonth, 'YYYY-MM').year() === searchForm.year)
    .sort((a, b) => dayjs(b.periodMonth, 'YYYY-MM').valueOf() - dayjs(a.periodMonth, 'YYYY-MM').valueOf())
    .map((item, idx) => ({ ...item, index: idx + 1 }))
)

// 同步分页总数
watch(filteredData, (val) => {
  pagination.total = val.length
  // 当前页超出范围时自动回退
  const maxPage = Math.max(1, Math.ceil(val.length / pagination.pageSize))
  if (pagination.current > maxPage) {
    pagination.current = maxPage
  }
})

// 弹框状态
const modalVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const formData = reactive<{
  periodMonth: Dayjs | null
  startDate: Dayjs | null
  endDate: Dayjs | null
}>({
  periodMonth: null,
  startDate: null,
  endDate: null
})
const formRules = {
  periodMonth: [{ required: true, message: '请选择年份月份', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择起始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结算日期', trigger: 'change' }]
}

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    tableData.value = [...mockData]
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  loadData()
}

const resetForm = () => {
  formData.periodMonth = dayjs()
  formData.startDate = dayjs().startOf('month')
  formData.endDate = dayjs().endOf('month')
}

const openAddModal = () => {
  isEditing.value = false
  editingId.value = null
  resetForm()
  modalVisible.value = true
}

const openEditModal = (record: SettlementCycle) => {
  isEditing.value = true
  editingId.value = record.id
  formData.periodMonth = dayjs(record.periodMonth, 'YYYY-MM')
  formData.startDate = dayjs(record.startDate)
  formData.endDate = dayjs(record.endDate)
  modalVisible.value = true
}

const handlePeriodMonthChange = () => {
  if (formData.periodMonth) {
    formData.startDate = formData.periodMonth.startOf('month')
    formData.endDate = formData.periodMonth.endOf('month')
  }
}

const handleModalOk = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const periodLabel = formData.periodMonth!.format('YYYY年MM月')
  const startDateStr = formData.startDate!.format('YYYY-MM-DD')
  const endDateStr = formData.endDate!.format('YYYY-MM-DD')
  const periodMonthStr = formData.periodMonth!.format('YYYY-MM')

  if (isEditing.value && editingId.value !== null) {
    const idx = tableData.value.findIndex(item => item.id === editingId.value)
    if (idx !== -1) {
      tableData.value[idx] = {
        ...tableData.value[idx],
        periodMonth: periodMonthStr,
        startDate: startDateStr,
        endDate: endDateStr,
        periodLabel
      }
    }
    message.success('配置已更新')
  } else {
    const newId = Math.max(0, ...tableData.value.map(item => item.id)) + 1
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    tableData.value.push({
      id: newId,
      periodMonth: periodMonthStr,
      startDate: startDateStr,
      endDate: endDateStr,
      periodLabel,
      creator: '管理员',
      createTime: now
    })
    message.success('配置已新增')
  }

  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}

const handleDelete = (id: number) => {
  tableData.value = tableData.value.filter(item => item.id !== id)
  message.success('配置已删除')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.settlement-cycle-config {
  padding: 0;
}

</style>
