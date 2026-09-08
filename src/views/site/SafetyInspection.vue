<template>
  <div class="safety-inspection">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="巡查类型">
          <a-select
            v-model:value="searchForm.inspectionType"
            placeholder="请选择巡查类型"
            allow-clear
            style="width: 180px"
          >
            <a-select-option v-for="t in inspectionTypeOptions" :key="t" :value="t">
              {{ t }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="巡查级别">
          <a-select
            v-model:value="searchForm.inspectionLevel"
            placeholder="请选择巡查级别"
            allow-clear
            style="width: 160px"
          >
            <a-select-option v-for="l in inspectionLevelOptions" :key="l" :value="l">
              {{ l }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="处理状态">
          <a-select
            v-model:value="searchForm.handleStatus"
            placeholder="请选择处理状态"
            allow-clear
            style="width: 150px"
          >
            <a-select-option v-for="s in handleStatusOptions" :key="s" :value="s">
              {{ s }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="检查日期">
          <a-range-picker
            v-model:value="searchForm.checkDateRange"
            format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            style="width: 260px"
          />
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

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新增
        </a-button>
        <a-button type="primary" ghost @click="handleEdit">
          <EditOutlined />
          修改
        </a-button>
        <a-popconfirm title="确定删除选中的记录吗？" @confirm="handleDelete">
          <a-button type="primary" danger ghost :disabled="selectedRowKeys.length === 0">
            <DeleteOutlined />
            删除
          </a-button>
        </a-popconfirm>
        <a-button type="primary" danger ghost @click="handleSplit" :disabled="selectedRowKeys.length === 0">
          <PartitionOutlined />
          拆分
        </a-button>
        <a-button type="primary" ghost @click="handleAudit" :disabled="selectedRowKeys.length === 0">
          <AuditOutlined />
          审核
        </a-button>
        <a-button type="primary" ghost @click="handleExport">
          <ExportOutlined />
          导出
        </a-button>
      </a-space>
    </a-card>

    <!-- 数据表格卡片 -->
    <a-card :bordered="false" class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredData"
        :loading="loading"
        :pagination="pagination"
        :row-key="'id'"
        :row-selection="rowSelection"
        :scroll="{ x: 2600 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 问题照片 -->
          <template v-if="column.key === 'photo'">
            <a v-if="record.hasPhoto" @click="handleViewPhoto(record)">查看</a>
            <span v-else>-</span>
          </template>
          <!-- 整改照片 -->
          <template v-else-if="column.key === 'rectifyPhoto'">
            <a v-if="record.rectifyPhoto" @click="handleViewPhoto(record)">查看</a>
            <span v-else>-</span>
          </template>
          <!-- 处理状态 -->
          <template v-else-if="column.key === 'handleStatus'">
            <a-tag :color="statusColor[record.handleStatus]">
              {{ record.handleStatus }}
            </a-tag>
          </template>
          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewDetail(record)">明细</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增安全巡查弹框 -->
    <a-modal
      v-model:open="addModalVisible"
      title="新增安全巡查"
      :width="1560"
      :body-style="{ paddingBottom: '8px' }"
      @ok="handleAddModalOk"
      @cancel="handleAddModalCancel"
    >
      <!-- 头部基础信息 -->
      <a-form layout="inline" :model="addForm" class="add-form">
        <a-form-item label="*巡查级别" required>
          <a-select
            v-model:value="addForm.inspectionLevel"
            placeholder="请选择巡查级别"
            allow-clear
            style="width: 170px"
          >
            <a-select-option v-for="l in inspectionLevelOptions" :key="l" :value="l">
              {{ l }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="*检查人" required>
          <a-select
            v-model:value="addForm.inspectors"
            placeholder="请选择检查人"
            mode="multiple"
            allow-clear
            style="width: 280px"
          >
            <a-select-option v-for="p in personOptions" :key="p" :value="p">
              {{ p }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="*检查日期" required>
          <a-date-picker
            v-model:value="addForm.checkDate"
            format="YYYY-MM-DD"
            style="width: 170px"
          />
        </a-form-item>
      </a-form>

      <!-- 隐患明细编辑表格 -->
      <a-table
        :columns="detailColumns"
        :data-source="detailRows"
        :pagination="false"
        :row-key="'key'"
        size="small"
        :scroll="{ x: 2100 }"
        class="detail-table"
      >
        <template #bodyCell="{ column, record }">
          <!-- 责任单位 -->
          <template v-if="column.key === 'dutyUnit'">
            <a-select v-model:value="record.dutyUnit" placeholder="请选择" allow-clear style="width: 100%">
              <a-select-option v-for="u in dutyUnitOptions" :key="u" :value="u">{{ u }}</a-select-option>
            </a-select>
          </template>
          <!-- 巡查类型 -->
          <template v-else-if="column.key === 'inspectionType'">
            <a-select v-model:value="record.inspectionType" placeholder="请选择巡查类型" allow-clear style="width: 100%">
              <a-select-option v-for="t in inspectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
          </template>
          <!-- 隐患分类 -->
          <template v-else-if="column.key === 'hazardCategory'">
            <a-select v-model:value="record.hazardCategory" placeholder="请选择隐患分类" allow-clear style="width: 100%">
              <a-select-option v-for="c in hazardCategoryOptions" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </template>
          <!-- 隐患等级 -->
          <template v-else-if="column.key === 'hazardLevel'">
            <a-select v-model:value="record.hazardLevel" placeholder="请选择隐患等级" allow-clear style="width: 100%">
              <a-select-option v-for="lv in hazardLevelOptions" :key="lv" :value="lv">{{ lv }}</a-select-option>
            </a-select>
          </template>
          <!-- 问题描述 -->
          <template v-else-if="column.key === 'problemDesc'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.problemDesc" :maxlength="100" :rows="2" placeholder="请输入问题描述" />
              <div class="char-count">{{ charCount(record.problemDesc) }}/100</div>
            </div>
          </template>
          <!-- 整改措施 -->
          <template v-else-if="column.key === 'rectifyMeasure'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.rectifyMeasure" :maxlength="100" :rows="2" placeholder="请输入整改措施" />
              <div class="char-count">{{ charCount(record.rectifyMeasure) }}/100</div>
            </div>
          </template>
          <!-- 整改期限 -->
          <template v-else-if="column.key === 'rectifyDeadline'">
            <a-date-picker v-model:value="record.rectifyDeadline" format="YYYY-MM-DD" style="width: 100%" />
          </template>
          <!-- 责任人 -->
          <template v-else-if="column.key === 'responsiblePerson'">
            <a-select v-model:value="record.responsiblePerson" placeholder="请选择责任人" allow-clear style="width: 100%">
              <a-select-option v-for="p in personOptions" :key="p" :value="p">{{ p }}</a-select-option>
            </a-select>
          </template>
          <!-- 问题图片 -->
          <template v-else-if="column.key === 'photoList'">
            <a-upload
              v-model:file-list="record.photoList"
              :before-upload="() => false"
              :max-count="1"
              list-type="picture"
            >
              <a-button size="small">
                <UploadOutlined />
                点击上传
              </a-button>
            </a-upload>
          </template>
          <!-- 备注 -->
          <template v-else-if="column.key === 'remark'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.remark" :maxlength="200" :rows="2" placeholder="请输入内容" />
              <div class="char-count">{{ charCount(record.remark) }}/200</div>
            </div>
          </template>
          <!-- 删除行 -->
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" danger @click="handleDeleteDetailRow(record)">删除</a-button>
          </template>
        </template>
      </a-table>
      <a-button type="dashed" block class="add-detail-btn" @click="handleAddDetailRow">
        <PlusOutlined />
        新增
      </a-button>
    </a-modal>

    <!-- 修改安全巡查弹框 -->
    <a-modal
      v-model:open="editModalVisible"
      title="修改安全巡查"
      :width="1560"
      :body-style="{ paddingBottom: '8px' }"
      @ok="handleEditModalOk"
      @cancel="handleEditModalCancel"
    >
      <a-form layout="inline" :model="editForm" class="add-form">
        <a-form-item label="*巡查级别" required>
          <a-select
            v-model:value="editForm.inspectionLevel"
            placeholder="请选择巡查级别"
            allow-clear
            style="width: 170px"
          >
            <a-select-option v-for="l in inspectionLevelOptions" :key="l" :value="l">
              {{ l }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="*检查人" required>
          <a-select
            v-model:value="editForm.inspectors"
            placeholder="请选择检查人"
            mode="multiple"
            allow-clear
            style="width: 280px"
          >
            <a-select-option v-for="p in personOptions" :key="p" :value="p">
              {{ p }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="*检查日期" required>
          <a-date-picker
            v-model:value="editForm.checkDate"
            format="YYYY-MM-DD"
            style="width: 170px"
          />
        </a-form-item>
      </a-form>

      <a-table
        :columns="detailColumns"
        :data-source="editDetailRows"
        :pagination="false"
        :row-key="'key'"
        size="small"
        :scroll="{ x: 2100 }"
        class="detail-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'dutyUnit'">
            <a-select v-model:value="record.dutyUnit" placeholder="请选择" allow-clear style="width: 100%">
              <a-select-option v-for="u in dutyUnitOptions" :key="u" :value="u">{{ u }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'inspectionType'">
            <a-select v-model:value="record.inspectionType" placeholder="请选择巡查类型" allow-clear style="width: 100%">
              <a-select-option v-for="t in inspectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'hazardCategory'">
            <a-select v-model:value="record.hazardCategory" placeholder="请选择隐患分类" allow-clear style="width: 100%">
              <a-select-option v-for="c in hazardCategoryOptions" :key="c" :value="c">{{ c }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'hazardLevel'">
            <a-select v-model:value="record.hazardLevel" placeholder="请选择隐患等级" allow-clear style="width: 100%">
              <a-select-option v-for="lv in hazardLevelOptions" :key="lv" :value="lv">{{ lv }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'problemDesc'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.problemDesc" :maxlength="100" :rows="2" placeholder="请输入问题描述" />
              <div class="char-count">{{ charCount(record.problemDesc) }}/100</div>
            </div>
          </template>
          <template v-else-if="column.key === 'rectifyMeasure'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.rectifyMeasure" :maxlength="100" :rows="2" placeholder="请输入整改措施" />
              <div class="char-count">{{ charCount(record.rectifyMeasure) }}/100</div>
            </div>
          </template>
          <template v-else-if="column.key === 'rectifyDeadline'">
            <a-date-picker v-model:value="record.rectifyDeadline" format="YYYY-MM-DD" style="width: 100%" />
          </template>
          <template v-else-if="column.key === 'responsiblePerson'">
            <a-select v-model:value="record.responsiblePerson" placeholder="请选择责任人" allow-clear style="width: 100%">
              <a-select-option v-for="p in personOptions" :key="p" :value="p">{{ p }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'photoList'">
            <a-upload
              v-model:file-list="record.photoList"
              :before-upload="() => false"
              :max-count="1"
              list-type="picture"
            >
              <a-button size="small">
                <UploadOutlined />
                点击上传
              </a-button>
            </a-upload>
          </template>
          <template v-else-if="column.key === 'remark'">
            <div class="cell-textarea">
              <a-textarea v-model:value="record.remark" :maxlength="200" :rows="2" placeholder="请输入内容" />
              <div class="char-count">{{ charCount(record.remark) }}/200</div>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" danger @click="handleDeleteEditDetailRow(record)">删除</a-button>
          </template>
        </template>
      </a-table>
      <a-button type="dashed" block class="add-detail-btn" @click="handleAddEditDetailRow">
        <PlusOutlined />
        新增
      </a-button>
    </a-modal>

    <!-- 查看明细弹框 -->
    <a-modal
      v-model:open="detailModalVisible"
      title="明细"
      :width="760"
      :footer="null"
      :body-style="{ paddingBottom: '8px' }"
      @cancel="handleDetailModalCancel"
    >
      <template v-if="detailRecord">
        <!-- 明细 -->
        <div class="detail-section">
          <div class="section-title">明细</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">责任单位：</span>
              <span class="value">{{ detailRecord.dutyUnit }}</span>
            </div>
            <div class="detail-item">
              <span class="label">巡查类型：</span>
              <span class="value">{{ detailRecord.inspectionType }}</span>
            </div>
            <div class="detail-item">
              <span class="label">巡查级别：</span>
              <span class="value">{{ detailRecord.inspectionLevel }}</span>
            </div>
            <div class="detail-item">
              <span class="label">隐患分类：</span>
              <span class="value">{{ detailRecord.hazardCategory }}</span>
            </div>
            <div class="detail-item">
              <span class="label">隐患等级：</span>
              <span class="value">{{ detailRecord.hazardLevel }}</span>
            </div>
            <div class="detail-item">
              <span class="label">检查日期：</span>
              <span class="value">{{ detailRecord.checkDate }}</span>
            </div>
            <div class="detail-item detail-item-full">
              <span class="label">问题描述：</span>
              <span class="value">{{ detailRecord.problemDesc || '-' }}</span>
            </div>
            <div class="detail-item detail-item-full">
              <span class="label">问题图片：</span>
              <span class="value">
                <template v-if="detailRecord.hasPhoto">
                  <div class="photo-placeholder">
                    <span class="photo-en">WEICHAI</span>
                    <span class="photo-cn">潍柴</span>
                  </div>
                </template>
                <template v-else>-</template>
              </span>
            </div>
          </div>
        </div>

        <!-- 整改信息 -->
        <div class="detail-section">
          <div class="section-title">整改信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">隐患溯源分析：</span>
              <span class="value">{{ detailRecord.hazardAnalysis || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">整改措施：</span>
              <span class="value">{{ detailRecord.rectifyMeasure || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">整改期限：</span>
              <span class="value">{{ detailRecord.rectifyDeadline || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">整改时间：</span>
              <span class="value">{{ detailRecord.rectifyTime || '-' }}</span>
            </div>
            <div class="detail-item detail-item-full">
              <span class="label">整改图片：</span>
              <span class="value">
                <template v-if="detailRecord.rectifyTime">
                  <div class="photo-placeholder">
                    <span class="photo-en">WEICHAI</span>
                    <span class="photo-cn">潍柴</span>
                  </div>
                </template>
                <template v-else>-</template>
              </span>
            </div>
          </div>
        </div>

        <!-- 审核信息 -->
        <div class="detail-section">
          <div class="section-title">审核信息</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">审核日期：</span>
              <span class="value">{{ detailRecord.auditDate || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">整改完成情况：</span>
              <span class="value">{{ detailRecord.rectifyStatus || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="detail-footer">
          <a-button @click="handleDetailModalCancel">取消</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PartitionOutlined,
  AuditOutlined,
  ExportOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'

// ---------- 类型定义 ----------
interface SafetyInspectionRecord {
  id: number
  dutyUnit: string // 责任单位
  inspectionType: string // 巡查类型
  inspectionLevel: string // 巡查级别
  hazardCategory: string // 隐患分类
  hazardLevel: string // 隐患等级
  inspector: string // 检查人
  checkDate: string // 检查日期
  rectifyDeadline: string // 整改期限
  rectifyMeasure?: string // 整改措施
  rectifyTime: string // 整改时间
  responsiblePerson: string // 责任人
  problemDesc: string // 问题描述
  hasPhoto: boolean // 是否有问题照片
  rectifyPhoto?: boolean // 是否有整改照片
  handleStatus: string // 处理状态
  auditDate: string // 审核日期
  hazardAnalysis: string // 隐患分析
  rectifyStatus?: string // 整改完成情况
}

// ---------- 筛选选项 ----------
const inspectionTypeOptions = ['日常隐患检查', '节假日隐患检查', '季节性隐患检查', '综合性隐患检查', '专项隐患检查', '专家诊断检查', '其它检查']
const inspectionLevelOptions = ['分厂级', '车间级', '班组级']
const handleStatusOptions = ['待处理', '待安全员审核', '待产线主任确认', '已归档']

// ---------- 弹框选项 ----------
const personOptions = ['冯永增', '常慧', '高波', '王辉', '周克凡', 'dongchengtao']
const dutyUnitOptions = ['机体线 - 机体班', '新产品线 - 新产品班', '制芯线 - 制芯班']
const hazardCategoryOptions = ['消防设施', '现场管理', '可燃物清理']
const hazardLevelOptions = ['一般隐患', '严重隐患']

// ---------- 编辑弹框状态 ----------
const editModalVisible = ref(false)
const editForm = reactive({
  inspectionLevel: '',
  inspectors: [] as string[],
  checkDate: dayjs() as Dayjs
})
const editDetailRows = ref<DetailRow[]>([])
const editingRecordId = ref<number>(0)

// ---------- 新增弹框：隐患明细行 ----------
interface DetailRow {
  key: string
  dutyUnit: string
  inspectionType: string
  hazardCategory: string
  hazardLevel: string
  problemDesc: string
  rectifyMeasure: string
  rectifyDeadline: Dayjs | null
  responsiblePerson: string
  photoList: any[]
  remark: string
}

const addModalVisible = ref(false)
const addForm = reactive({
  inspectionLevel: '',
  inspectors: [] as string[],
  checkDate: dayjs() as Dayjs
})
let detailRowKey = 0
const detailRows = ref<DetailRow[]>([])

// 明细表格列
const detailColumns = [
  { title: '责任单位', dataIndex: 'dutyUnit', key: 'dutyUnit', width: 160 },
  { title: '巡查类型', dataIndex: 'inspectionType', key: 'inspectionType', width: 160 },
  { title: '隐患分类', dataIndex: 'hazardCategory', key: 'hazardCategory', width: 140 },
  { title: '隐患等级', dataIndex: 'hazardLevel', key: 'hazardLevel', width: 110 },
  { title: '问题描述', dataIndex: 'problemDesc', key: 'problemDesc', width: 220 },
  { title: '整改措施', dataIndex: 'rectifyMeasure', key: 'rectifyMeasure', width: 220 },
  { title: '整改期限', dataIndex: 'rectifyDeadline', key: 'rectifyDeadline', width: 150 },
  { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson', width: 150 },
  { title: '问题图片', dataIndex: 'photoList', key: 'photoList', width: 200 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 220 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const }
]

// 新建一行明细
const createDetailRow = (): DetailRow => {
  detailRowKey += 1
  return {
    key: `detail-${detailRowKey}`,
    dutyUnit: '',
    inspectionType: '',
    hazardCategory: '',
    hazardLevel: '',
    problemDesc: '',
    rectifyMeasure: '',
    rectifyDeadline: dayjs().add(3, 'day'),
    responsiblePerson: '',
    photoList: [],
    remark: ''
  }
}

// ---------- 状态 ----------
const loading = ref(false)
const dataSource = ref<SafetyInspectionRecord[]>([])
const selectedRowKeys = ref<Array<string | number>>([])

const searchForm = reactive({
  inspectionType: '',
  inspectionLevel: '',
  handleStatus: '',
  checkDateRange: [] as any[]
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条`
})

// 行选择
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => {
    selectedRowKeys.value = keys
  }
}))

// 处理状态颜色
const statusColor: Record<string, string> = {
  待处理: 'orange',
  待安全员审核: 'blue',
  待产线主任确认: 'purple',
  已归档: 'green'
}

// 表格列
const columns = [
  { title: '责任单位', dataIndex: 'dutyUnit', key: 'dutyUnit', width: 170, fixed: 'left' as const },
  { title: '巡查类型', dataIndex: 'inspectionType', key: 'inspectionType', width: 130 },
  { title: '巡查级别', dataIndex: 'inspectionLevel', key: 'inspectionLevel', width: 100 },
  { title: '隐患分类', dataIndex: 'hazardCategory', key: 'hazardCategory', width: 110 },
  { title: '隐患等级', dataIndex: 'hazardLevel', key: 'hazardLevel', width: 100 },
  { title: '检查人', dataIndex: 'inspector', key: 'inspector', width: 160 },
  { title: '检查日期', dataIndex: 'checkDate', key: 'checkDate', width: 120 },
  { title: '整改期限', dataIndex: 'rectifyDeadline', key: 'rectifyDeadline', width: 120 },
  { title: '整改时间', dataIndex: 'rectifyTime', key: 'rectifyTime', width: 150 },
  { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson', width: 170 },
  { title: '问题描述', dataIndex: 'problemDesc', key: 'problemDesc', width: 140, ellipsis: true },
  { title: '问题照片', dataIndex: 'photo', key: 'photo', width: 100 },
  { title: '处理状态', dataIndex: 'handleStatus', key: 'handleStatus', width: 100 },
  { title: '审核日期', dataIndex: 'auditDate', key: 'auditDate', width: 150 },
  { title: '隐患溯源分析', dataIndex: 'hazardAnalysis', key: 'hazardAnalysis', width: 150, ellipsis: true },
  { title: '整改措施', dataIndex: 'rectifyMeasure', key: 'rectifyMeasure', width: 180, ellipsis: true },
  { title: '整改照片', dataIndex: 'rectifyPhoto', key: 'rectifyPhoto', width: 100 },
  { title: '整改完成情况', dataIndex: 'rectifyStatus', key: 'rectifyStatus', width: 110 },
  { title: '操作', key: 'action', width: 90, fixed: 'right' as const }
]

// 模拟数据（对应图片中 11 条记录）
const mockData: SafetyInspectionRecord[] = [
  {
    id: 1,
    dutyUnit: '机体线 - 机体班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '消防设施',
    hazardLevel: '一般隐患',
    inspector: '冯永增,常慧,高波',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyMeasure: '对设备进行检修保养，消除跑冒滴漏隐患',
    rectifyTime: '2026-08-05 09:00',
    responsiblePerson: '冯永增,常慧,王克凡',
    problemDesc: '555666',
    hasPhoto: true,
    handleStatus: '待产线主任确认',
    auditDate: '2026-08-05 10:30',
    hazardAnalysis: '23232',
    rectifyStatus: '已完成整改',
    rectifyPhoto: true
  },
  {
    id: 2,
    dutyUnit: '新产品线 - 新产品班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '消防设施',
    hazardLevel: '严重隐患',
    inspector: '冯永增,高波,周克凡',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '冯永增,高波,周克凡',
    problemDesc: '22222',
    hasPhoto: false,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '-'
  },
  {
    id: 3,
    dutyUnit: '制芯线 - 制芯班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '现场管理',
    hazardLevel: '严重隐患',
    inspector: '冯永增,高波,周克凡',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '冯永增,高波,周克凡',
    problemDesc: '该法规规范',
    hasPhoto: true,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '-',
    rectifyMeasure: '加强现场管理，规范物料定置摆放'
  },
  {
    id: 4,
    dutyUnit: '机体线 - 机体班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '车间级',
    hazardCategory: '可燃物清理',
    hazardLevel: '一般隐患',
    inspector: '常慧',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '常慧',
    problemDesc: '121',
    hasPhoto: false,
    handleStatus: '待安全员审核',
    auditDate: '2026-08-05 11:20',
    hazardAnalysis: '67676',
    rectifyMeasure: '清理现场可燃物并规范存放',
    rectifyStatus: '已完成整改',
    rectifyPhoto: true
  },
  {
    id: 5,
    dutyUnit: '机体线 - 机体班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '消防设施',
    hazardLevel: '一般隐患',
    inspector: 'dongchengtao',
    checkDate: '2026-08-17',
    rectifyDeadline: '2026-08-20',
    rectifyTime: '',
    responsiblePerson: 'dongchengtao',
    problemDesc: 'test',
    hasPhoto: false,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '-',
    rectifyMeasure: '及时整改消防设施问题'
  },
  {
    id: 6,
    dutyUnit: '新产品线 - 新产品班',
    inspectionType: '节假日隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '可燃物清理',
    hazardLevel: '一般隐患',
    inspector: '王辉',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyMeasure: '立即清理现场可燃物并按规定定点存放',
    rectifyTime: '2026-08-05 08:30',
    responsiblePerson: '王辉',
    problemDesc: '测试',
    hasPhoto: true,
    handleStatus: '已归档',
    auditDate: '2026-08-05 09:15',
    hazardAnalysis: '测试',
    rectifyStatus: '完成了',
    rectifyPhoto: true
  },
  {
    id: 7,
    dutyUnit: '制芯线 - 制芯班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '现场管理',
    hazardLevel: '严重隐患',
    inspector: '冯永增,高波,周克凡',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '冯永增,高波,周克凡',
    problemDesc: '该法规规范',
    hasPhoto: true,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '-',
    rectifyMeasure: '加强现场管理，规范物料定置摆放'
  },
  {
    id: 8,
    dutyUnit: '新产品线 - 新产品班',
    inspectionType: '日常隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '消防设施',
    hazardLevel: '严重隐患',
    inspector: '冯永增,高波,周克凡',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '冯永增,高波,周克凡',
    problemDesc: '22222',
    hasPhoto: false,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '-',
    rectifyMeasure: '加强消防安全管理，落实隐患整改'
  },
  {
    id: 9,
    dutyUnit: '新产品线 - 新产品班',
    inspectionType: '节假日隐患检查',
    inspectionLevel: '车间级',
    hazardCategory: '消防设施',
    hazardLevel: '严重隐患',
    inspector: '常慧,高波,周克凡',
    checkDate: '2026-08-05',
    rectifyDeadline: '2026-08-08',
    rectifyTime: '',
    responsiblePerson: '常慧,高波,周克凡',
    problemDesc: '6565665',
    hasPhoto: false,
    handleStatus: '待处理',
    auditDate: '',
    hazardAnalysis: '5656',
    rectifyMeasure: '完善消防设施检查记录'
  },
  {
    id: 10,
    dutyUnit: '制芯线 - 制芯班',
    inspectionType: '专项隐患检查',
    inspectionLevel: '分厂级',
    hazardCategory: '现场管理',
    hazardLevel: '一般隐患',
    inspector: '冯永增,高波',
    checkDate: '2026-08-10',
    rectifyDeadline: '2026-08-13',
    rectifyMeasure: '物料按区域定置摆放，保持通道畅通',
    rectifyTime: '2026-08-12 14:00',
    responsiblePerson: '冯永增,高波',
    problemDesc: '现场物料堆放杂乱',
    hasPhoto: true,
    handleStatus: '待安全员审核',
    auditDate: '',
    hazardAnalysis: '-',
    rectifyStatus: '已完成整改'
  },
  {
    id: 11,
    dutyUnit: '机体线 - 机体班',
    inspectionType: '专项隐患检查',
    inspectionLevel: '班组级',
    hazardCategory: '可燃物清理',
    hazardLevel: '严重隐患',
    inspector: '常慧,王辉',
    checkDate: '2026-08-12',
    rectifyDeadline: '2026-08-15',
    rectifyMeasure: '及时清理可燃物并进行复查确认',
    rectifyTime: '2026-08-14 16:30',
    responsiblePerson: '常慧,王辉',
    problemDesc: '可燃物未及时清理',
    hasPhoto: true,
    handleStatus: '已归档',
    auditDate: '2026-08-15 09:00',
    hazardAnalysis: '已闭环',
    rectifyStatus: '完成了',
    rectifyPhoto: true
  }
]

dataSource.value = mockData

// 筛选后的数据
const filteredData = computed<SafetyInspectionRecord[]>(() => {
  let list = dataSource.value
  if (searchForm.inspectionType) {
    list = list.filter(item => item.inspectionType === searchForm.inspectionType)
  }
  if (searchForm.inspectionLevel) {
    list = list.filter(item => item.inspectionLevel === searchForm.inspectionLevel)
  }
  if (searchForm.handleStatus) {
    list = list.filter(item => item.handleStatus === searchForm.handleStatus)
  }
  if (searchForm.checkDateRange && searchForm.checkDateRange.length === 2) {
    const start = searchForm.checkDateRange[0].format('YYYY-MM-DD')
    const end = searchForm.checkDateRange[1].format('YYYY-MM-DD')
    list = list.filter(item => item.checkDate >= start && item.checkDate <= end)
  }
  return list
})

// 分页总数联动
pagination.total = filteredData.value.length

// ---------- 事件处理 ----------
const handleSearch = () => {
  pagination.current = 1
  selectedRowKeys.value = []
  message.success('查询完成')
}

const handleReset = () => {
  searchForm.inspectionType = ''
  searchForm.inspectionLevel = ''
  searchForm.handleStatus = ''
  searchForm.checkDateRange = []
  pagination.current = 1
  selectedRowKeys.value = []
  message.success('已重置筛选条件')
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

// 新增：打开弹框并初始化一行明细
const handleAdd = () => {
  addForm.inspectionLevel = ''
  addForm.inspectors = []
  addForm.checkDate = dayjs()
  detailRows.value = [createDetailRow()]
  addModalVisible.value = true
}

// 修改：打开编辑弹框，回显选中记录
const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) {
    message.warning('请选择一条需要修改的记录')
    return
  }
  const id = selectedRowKeys.value[0] as number
  const record = dataSource.value.find(item => item.id === id)
  if (!record) {
    message.warning('未找到选中记录')
    return
  }
  editingRecordId.value = id
  // 回显基础信息
  editForm.inspectionLevel = record.inspectionLevel
  editForm.inspectors = record.inspector ? record.inspector.split(',') : []
  editForm.checkDate = record.checkDate ? dayjs(record.checkDate) : dayjs()
  // 回显明细（转换为编辑行格式）
  detailRowKey += 1
  editDetailRows.value = [{
    key: `edit-${detailRowKey}`,
    dutyUnit: record.dutyUnit,
    inspectionType: record.inspectionType,
    hazardCategory: record.hazardCategory,
    hazardLevel: record.hazardLevel,
    problemDesc: record.problemDesc,
    rectifyMeasure: '',
    rectifyDeadline: record.rectifyDeadline ? dayjs(record.rectifyDeadline) : null,
    responsiblePerson: record.responsiblePerson,
    photoList: [],
    remark: ''
  }]
  editModalVisible.value = true
}

// 删除
const handleDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择需要删除的记录')
    return
  }
  dataSource.value = dataSource.value.filter(item => !selectedRowKeys.value.includes(item.id))
  selectedRowKeys.value = []
  pagination.total = dataSource.value.length
  message.success('删除成功')
}

// 拆分
const handleSplit = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择需要拆分的记录')
    return
  }
  message.info('拆分功能开发中')
}

// ---------- 编辑弹框 ----------
// 新增编辑行
const handleAddEditDetailRow = () => {
  editDetailRows.value.push(createDetailRow())
}

// 删除编辑行
const handleDeleteEditDetailRow = (row: DetailRow) => {
  if (editDetailRows.value.length === 1) {
    message.warning('至少保留一条隐患明细')
    return
  }
  editDetailRows.value = editDetailRows.value.filter(item => item.key !== row.key)
}

// 取消编辑
const handleEditModalCancel = () => {
  editModalVisible.value = false
}

// 确定编辑：校验并更新数据
const handleEditModalOk = () => {
  if (!editForm.inspectionLevel) {
    message.warning('请选择巡查级别')
    return
  }
  if (editForm.inspectors.length === 0) {
    message.warning('请选择检查人')
    return
  }
  if (!editForm.checkDate) {
    message.warning('请选择检查日期')
    return
  }
  const validRows = editDetailRows.value.filter(row => row.dutyUnit && row.inspectionType)
  if (validRows.length === 0) {
    message.warning('请至少填写一条完整的隐患明细（责任单位、巡查类型）')
    return
  }
  // 更新原记录
  const idx = dataSource.value.findIndex(item => item.id === editingRecordId.value)
  if (idx === -1) {
    message.error('未找到待修改记录')
    return
  }
  const firstRow = validRows[0]
  dataSource.value[idx] = {
    ...dataSource.value[idx],
    dutyUnit: firstRow.dutyUnit,
    inspectionType: firstRow.inspectionType,
    inspectionLevel: editForm.inspectionLevel,
    hazardCategory: firstRow.hazardCategory || '-',
    hazardLevel: firstRow.hazardLevel || '-',
    inspector: editForm.inspectors.join(','),
    checkDate: editForm.checkDate.format('YYYY-MM-DD'),
    rectifyDeadline: firstRow.rectifyDeadline ? firstRow.rectifyDeadline.format('YYYY-MM-DD') : '',
    rectifyMeasure: firstRow.rectifyMeasure || '',
    responsiblePerson: firstRow.responsiblePerson || '',
    problemDesc: firstRow.problemDesc || ''
  }
  // 若有多条明细，追加新记录
  for (let i = 1; i < validRows.length; i++) {
    const row = validRows[i]
    const newRecord: SafetyInspectionRecord = {
      id: Date.now() + i,
      dutyUnit: row.dutyUnit,
      inspectionType: row.inspectionType,
      inspectionLevel: editForm.inspectionLevel,
      hazardCategory: row.hazardCategory || '-',
      hazardLevel: row.hazardLevel || '-',
      inspector: editForm.inspectors.join(','),
      checkDate: editForm.checkDate.format('YYYY-MM-DD'),
      rectifyDeadline: row.rectifyDeadline ? row.rectifyDeadline.format('YYYY-MM-DD') : '',
      rectifyMeasure: row.rectifyMeasure || '',
      rectifyTime: '',
      responsiblePerson: row.responsiblePerson || '',
      problemDesc: row.problemDesc || '',
      hasPhoto: (row.photoList || []).length > 0,
      handleStatus: '待处理',
      auditDate: '',
      hazardAnalysis: '-'
    }
    dataSource.value.splice(idx + 1, 0, newRecord)
  }
  pagination.total = dataSource.value.length
  editModalVisible.value = false
  selectedRowKeys.value = []
  message.success('修改成功')
}

// 审核
const handleAudit = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择需要审核的记录')
    return
  }
  message.info('审核功能开发中')
}

// 导出
const handleExport = () => {
  message.success('导出成功')
}

// 查看照片
const handleViewPhoto = (record: SafetyInspectionRecord) => {
  message.info(`查看「${record.dutyUnit}」的问题照片`)
}

// 查看明细
const detailModalVisible = ref(false)
const detailRecord = ref<SafetyInspectionRecord | null>(null)

const handleViewDetail = (record: SafetyInspectionRecord) => {
  detailRecord.value = record
  detailModalVisible.value = true
}

const handleDetailModalCancel = () => {
  detailModalVisible.value = false
}

// ---------- 新增弹框 ----------
// 字数统计
const charCount = (text: string) => (text || '').length

// 新增一行明细
const handleAddDetailRow = () => {
  detailRows.value.push(createDetailRow())
}

// 删除一行明细
const handleDeleteDetailRow = (row: DetailRow) => {
  if (detailRows.value.length === 1) {
    message.warning('至少保留一条隐患明细')
    return
  }
  detailRows.value = detailRows.value.filter(item => item.key !== row.key)
}

// 取消
const handleAddModalCancel = () => {
  addModalVisible.value = false
}

// 确定：校验并插入数据
const handleAddModalOk = () => {
  if (!addForm.inspectionLevel) {
    message.warning('请选择巡查级别')
    return
  }
  if (addForm.inspectors.length === 0) {
    message.warning('请选择检查人')
    return
  }
  if (!addForm.checkDate) {
    message.warning('请选择检查日期')
    return
  }
  const validRows = detailRows.value.filter(row => row.dutyUnit && row.inspectionType)
  if (validRows.length === 0) {
    message.warning('请至少填写一条完整的隐患明细（责任单位、巡查类型）')
    return
  }
  // 组装记录插入数据源（新增的排在最前）
  validRows.forEach((row, index) => {
    const record: SafetyInspectionRecord = {
      id: Date.now() + index,
      dutyUnit: row.dutyUnit,
      inspectionType: row.inspectionType,
      inspectionLevel: addForm.inspectionLevel,
      hazardCategory: row.hazardCategory || '-',
      hazardLevel: row.hazardLevel || '-',
      inspector: addForm.inspectors.join(','),
      checkDate: addForm.checkDate.format('YYYY-MM-DD'),
      rectifyDeadline: row.rectifyDeadline ? row.rectifyDeadline.format('YYYY-MM-DD') : '',
      rectifyMeasure: row.rectifyMeasure || '',
      rectifyTime: '',
      responsiblePerson: row.responsiblePerson || '',
      problemDesc: row.problemDesc || '',
      hasPhoto: (row.photoList || []).length > 0,
      handleStatus: '待处理',
      auditDate: '',
      hazardAnalysis: '-'
    }
    dataSource.value.unshift(record)
  })
  pagination.total = dataSource.value.length
  addModalVisible.value = false
  message.success(`新增成功，共 ${validRows.length} 条隐患记录`)
}
</script>

<style scoped>
.filter-card,
.action-card {
  margin-bottom: 12px;
}

.add-form {
  margin-bottom: 16px;
}

.detail-table {
  margin-top: 8px;
}

.cell-textarea {
  position: relative;
}

.char-count {
  position: absolute;
  right: 8px;
  bottom: 2px;
  font-size: 12px;
  color: #999;
  pointer-events: none;
}

.add-detail-btn {
  margin-top: 12px;
}

/* 明细弹框 */
.detail-section {
  margin-bottom: 22px;
}

.section-title {
  display: inline-block;
  padding: 2px 18px;
  background: #1677ff;
  color: #fff;
  border-radius: 14px;
  font-size: 14px;
  margin-bottom: 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 12px;
  column-gap: 28px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
}

.detail-item-full {
  grid-column: 1 / -1;
}

.detail-item .label {
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  white-space: nowrap;
}

.detail-item .value {
  color: #666;
  word-break: break-all;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 130px;
  height: 86px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
}

.photo-placeholder .photo-en {
  font-weight: 700;
  font-size: 17px;
  color: #111;
  letter-spacing: 1px;
}

.photo-placeholder .photo-cn {
  font-size: 13px;
  color: #e60012;
  margin-top: 3px;
}

.detail-footer {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
