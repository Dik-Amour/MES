<template>
  <div class="pda-page">
    <div class="pda-header">
      <div class="pda-header-left" @click="goBack">
        <ArrowLeftOutlined />
      </div>
      <div class="pda-header-title">工装上机点检</div>
      <div class="pda-header-right"></div>
    </div>

    <div class="pda-content inspect-content">
      <!-- 上机信息 -->
      <div class="section-block">
        <div class="section-body">
          <div class="form-row">
            <div class="form-label">产线：</div>
            <div class="form-control">
              <a-select v-model:value="line" :options="lineOptions" style="width: 100%" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-label">上机设备：</div>
            <div class="form-control">
              <a-select
                v-model:value="equipment"
                :options="equipmentOptions"
                placeholder="请选择上机设备"
                style="width: 100%"
              />
            </div>
          </div>
          <div class="form-row last">
            <div class="form-label">工装码：</div>
            <div class="form-control with-suffix">
              <a-input
                v-model:value="toolingCode"
                placeholder="扫码或选择工装"
                readonly
              />
              <div class="scan-btn" @click="handleScanTooling">
                <ScanOutlined />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 工装信息 -->
      <div v-if="currentTooling" class="section-block info-card">
        <div class="section-title">工装信息</div>
        <div class="info-grid">
          <div class="info-cell">
            <div class="info-cell-label">工装型号</div>
            <div class="info-cell-value">{{ currentTooling.toolingModel }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell-label">工装名称</div>
            <div class="info-cell-value">{{ currentTooling.toolingName }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell-label">工装类型</div>
            <div class="info-cell-value">{{ currentTooling.toolingType }}</div>
          </div>
          <div class="info-cell">
            <div class="info-cell-label">点检模板</div>
            <div class="info-cell-value">{{ currentTooling.templateName }}</div>
          </div>
        </div>
      </div>

      <!-- 点检项列表 -->
      <div v-if="currentTooling && inspectItems.length > 0" class="section-block item-list-card">
        <div class="item-list-header">
          <span>点检项（{{ inspectItems.length }}）</span>
          <span class="item-progress">已检 {{ inspectedCount }} / {{ inspectItems.length }}</span>
        </div>

        <div v-for="(item, index) in inspectItems" :key="item.itemId" class="inspect-item">
          <div class="inspect-item-main">
            <div class="inspect-item-title">
              <span class="inspect-item-index">{{ index + 1 }}</span>
              <span>{{ item.checkPart }} · {{ item.checkContent }}</span>
            </div>
            <div class="inspect-item-standard">{{ item.checkStandard }}</div>
            <div class="inspect-item-meta">
              <span>标准号：{{ item.standardNo }}</span>
              <span>方式：{{ item.checkMethod }}</span>
            </div>
          </div>
          <div class="inspect-item-actions">
            <a-button
              size="small"
              :type="item.result === 'pass' ? 'primary' : 'default'"
              :class="['result-btn', 'pass', { active: item.result === 'pass' }]"
              @click="setResult(item, 'pass')"
            >
              合格
            </a-button>
            <a-button
              size="small"
              :type="item.result === 'fail' ? 'primary' : 'default'"
              :class="['result-btn', 'fail', { active: item.result === 'fail' }]"
              @click="setResult(item, 'fail')"
            >
              不合格
            </a-button>
            <a-button
              size="small"
              :type="item.result === 'na' ? 'primary' : 'default'"
              :class="['result-btn', 'na', { active: item.result === 'na' }]"
              @click="setResult(item, 'na')"
            >
              不适用
            </a-button>
          </div>
        </div>
      </div>

      <div v-else-if="!currentTooling" class="section-block empty-tip-card">
        <a-empty description="请先扫码或选择工装开始点检" />
      </div>

      <!-- 备注 -->
      <div v-if="currentTooling" class="section-block remark-card">
        <div class="section-title">备注</div>
        <a-textarea
          v-model:value="remark"
          placeholder="点检说明（选填）"
          :rows="2"
          :maxlength="200"
        />
      </div>
    </div>

    <div class="pda-footer">
      <a-button
        type="primary"
        block
        size="large"
        class="pda-submit-btn"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交点检
      </a-button>
      <div class="pda-footer-tip">全部点检项判定后可提交，记录同步至工装点检记录</div>
    </div>

    <!-- 扫码/选工装弹窗 -->
    <a-modal v-model:open="scanVisible" title="选择工装" :footer="null" :width="420">
      <div class="tooling-picker">
        <a-input
          v-model:value="pickerKeyword"
          placeholder="搜索工装型号 / 名称"
          allow-clear
          class="picker-search"
        />
        <div class="picker-list">
          <div
            v-for="t in filteredTooling"
            :key="t.toolingId"
            class="picker-item"
            @click="selectTooling(t)"
          >
            <div>
              <div class="picker-item-title">{{ t.toolingModel }} {{ t.toolingName }}</div>
              <div class="picker-item-sub">模板：{{ t.templateName }}</div>
            </div>
            <RightOutlined />
          </div>
          <a-empty
            v-if="filteredTooling.length === 0"
            description="无匹配工装"
            style="margin-top: 24px"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  ScanOutlined,
  RightOutlined
} from '@ant-design/icons-vue'
import { useToolingStore, type InspectResult, type InspectionItem } from '@/stores/tooling'

const router = useRouter()
const toolingStore = useToolingStore()

type PdaToolingOption = {
  toolingId: string
  toolingModel: string
  toolingName: string
  toolingType: string
  templateId: string
  templateName: string
  items: InspectionItem[]
}

interface ToolingInspectItem extends InspectionItem {
  result: InspectResult
}

const line = ref('大四HWS线')
const equipment = ref<string | undefined>(undefined)
const toolingCode = ref('')
const remark = ref('')
const submitting = ref(false)

const lineOptions = ['大四HWS线', '大三HWS线', '大三KW线'].map(value => ({ label: value, value }))
const equipmentOptions = ['造型机 M01', '造型机 M02', '制芯机 C01', '清理机器人 R01'].map(value => ({
  label: value,
  value
}))

const toolingOptions = computed<PdaToolingOption[]>(() => toolingStore.pdaToolingOptions)

const currentTooling = ref<PdaToolingOption | null>(null)
const inspectItems = ref<ToolingInspectItem[]>([])

const inspectedCount = computed(
  () => inspectItems.value.filter(i => i.result !== '').length
)

const canSubmit = computed(
  () =>
    !!currentTooling.value &&
    !!equipment.value &&
    inspectItems.value.length > 0 &&
    inspectItems.value.every(i => i.result !== '')
)

const scanVisible = ref(false)
const pickerKeyword = ref('')

const filteredTooling = computed(() => {
  const kw = pickerKeyword.value.trim().toLowerCase()
  if (!kw) return toolingOptions.value
  return toolingOptions.value.filter(
    t =>
      t.toolingModel.toLowerCase().includes(kw) ||
      t.toolingName.includes(pickerKeyword.value.trim())
  )
})

const handleScanTooling = () => {
  pickerKeyword.value = ''
  scanVisible.value = true
}

const selectTooling = (t: PdaToolingOption) => {
  currentTooling.value = t
  toolingCode.value = t.toolingModel
  inspectItems.value = t.items.map(i => ({ ...i, result: '' }))
  scanVisible.value = false
  message.success(`已加载工装：${t.toolingName}`)
}

const setResult = (item: ToolingInspectItem, result: InspectResult) => {
  item.result = result
}

const handleSubmit = () => {
  if (!currentTooling.value || !canSubmit.value) {
    message.warning('请选择上机设备并完成全部点检项')
    return
  }
  submitting.value = true
  setTimeout(() => {
    const t = currentTooling.value!
    const record = toolingStore.addInspectRecord({
      templateId: t.templateId,
      templateCode:
        toolingStore.getTemplateById(t.templateId)?.templateCode || '',
      templateName: t.templateName,
      toolingId: t.toolingId,
      toolingModel: t.toolingModel,
      toolingName: t.toolingName,
      toolingType: t.toolingType,
      line: line.value,
      equipment: equipment.value || '',
      remark: remark.value,
      items: inspectItems.value.map(i => ({ ...i }))
    })
    message.success(
      record.failCount
        ? `点检记录已生成（${record.failCount} 项不合格），见工装点检记录`
        : '工装上机点检提交成功，已写入点检记录'
    )
    submitting.value = false
    currentTooling.value = null
    toolingCode.value = ''
    inspectItems.value = []
    remark.value = ''
    equipment.value = undefined
  }, 400)
}

const goBack = () => router.back()
</script>

<style scoped>
.inspect-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card,
.item-list-card,
.remark-card,
.empty-tip-card {
  padding: 14px 16px;
}

.section-title {
  margin-bottom: 12px;
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.item-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.item-progress {
  font-size: 13px;
  font-weight: 400;
  color: #1890ff;
}

.inspect-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.inspect-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.inspect-item-main {
  margin-bottom: 10px;
}

.inspect-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 15px;
  font-weight: 500;
}

.inspect-item-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e6f7ff;
  color: #1890ff;
  font-size: 12px;
  flex-shrink: 0;
}

.inspect-item-standard {
  margin-top: 6px;
  padding-left: 30px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
}

.inspect-item-meta {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  padding-left: 30px;
  color: #999;
  font-size: 12px;
}

.inspect-item-actions {
  display: flex;
  gap: 8px;
  padding-left: 30px;
}

.result-btn.active.pass {
  background: #52c41a;
  border-color: #52c41a;
}

.result-btn.active.fail {
  background: #ff4d4f;
  border-color: #ff4d4f;
}

.result-btn.active.na {
  background: #8c8c8c;
  border-color: #8c8c8c;
}

.tooling-picker {
  padding-bottom: 8px;
}

.picker-search {
  margin-bottom: 8px;
}

.picker-list {
  max-height: 360px;
  overflow-y: auto;
}

.picker-item-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.picker-item-sub {
  margin-top: 2px;
  font-size: 12px;
  color: #999;
}
</style>
