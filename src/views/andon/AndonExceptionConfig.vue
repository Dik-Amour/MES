<template>
  <div class="andon-config">
    <!-- 筛选卡片 -->
    <a-card :bordered="false" class="filter-card">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="产线">
          <a-select v-model:value="searchForm.productionLine" placeholder="请选择" allow-clear style="width: 180px">
            <a-select-option v-for="l in productionLineOptions" :key="l" :value="l">{{ l }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="异常类型">
          <a-select v-model:value="searchForm.exceptionType" placeholder="请选择" allow-clear style="width: 180px">
            <a-select-option v-for="t in exceptionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="异常名称">
          <a-input v-model:value="searchForm.exceptionName" placeholder="请输入" allow-clear style="width: 180px" />
        </a-form-item>
        <a-form-item label="业务类型">
          <a-select v-model:value="searchForm.businessType" placeholder="请选择" allow-clear style="width: 180px">
            <a-select-option v-for="b in businessTypeOptions" :key="b" :value="b">{{ b }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined /> 查询
            </a-button>
            <a-button @click="handleReset">
              <ReloadOutlined /> 重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 功能按钮卡片 -->
    <a-card :bordered="false" class="action-card">
      <a-space :size="8" wrap>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined /> 新增
        </a-button>
        <a-button type="primary" ghost @click="handleEdit" :disabled="selectedRowKeys.length !== 1">
          <EditOutlined /> 编辑
        </a-button>
        <a-button type="primary" danger ghost :disabled="selectedRowKeys.length === 0" @click="handleBatchDelete">
          <DeleteOutlined /> 删除
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
        :scroll="{ x: 1400 }"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 序号 -->
          <template v-if="column.key === 'seq'">
            {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
          </template>
          <!-- 启用开关 -->
          <template v-else-if="column.key === 'enabled'">
            <a-switch
              :checked="record.enabled"
              checked-children="启用"
              un-checked-children="停用"
              @change="(checked: boolean) => handleEnabledChange(record, checked)"
            />
          </template>
          <!-- 操作 -->
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="handleViewDetail(record)">明细</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑异常配置' : '新增异常配置'"
      :width="1400"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      ok-text="保存"
      cancel-text="取消"
      class="config-modal"
    >
      <!-- 异常基础信息 -->
      <div class="modal-section">
        <div class="section-title">异常基础信息</div>
        <a-form :model="formData" class="modal-form inline-label-form">
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item required>
                <template #label>产线名称：</template>
                <a-select v-model:value="formData.productionLine" placeholder="请选择">
                  <a-select-option v-for="l in productionLineOptions" :key="l" :value="l">{{ l }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item required>
                <template #label>异常名称：</template>
                <a-input v-model:value="formData.exceptionName" placeholder="请输入" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="12">
              <a-form-item required>
                <template #label>异常类型：</template>
                <a-select v-model:value="formData.exceptionType" placeholder="请选择">
                  <a-select-option v-for="t in exceptionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item required>
                <template #label>业务类型：</template>
                <a-select v-model:value="formData.businessType" placeholder="请选择">
                  <a-select-option v-for="b in businessTypeOptions" :key="b" :value="b">{{ b }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item required>
                <template #label>异常描述：</template>
                <a-textarea v-model:value="formData.exceptionDesc" placeholder="请输入（可用于推送信息展示）" :rows="3" style="flex: 1" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <a-divider style="margin: 4px 0 16px" />

      <!-- 触发配置 -->
      <div class="modal-section">
        <div class="section-title">触发配置</div>
        <a-form :model="triggerForm" class="modal-form inline-label-form">
          <a-row :gutter="24">
            <a-col :span="24">
              <a-form-item required>
                <template #label>异常触发类型：</template>
                <a-radio-group v-model:value="triggerForm.triggerType" @change="handleTriggerTypeChange">
                  <a-radio value="plc">PLC数采</a-radio>
                  <a-radio value="business">业务逻辑</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <!-- PLC数采 配置 -->
          <template v-if="triggerForm.triggerType === 'plc'">
            <a-row :gutter="24">
              <a-col :span="8">
                <a-form-item required>
                  <template #label>工位/子工位：</template>
                  <a-select v-model:value="triggerForm.station" placeholder="请选择">
                    <a-select-option v-for="s in stationOptions" :key="s" :value="s">{{ s }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item required>
                  <template #label>数采点位：</template>
                  <a-select v-model:value="triggerForm.dataPoint" placeholder="请选择">
                    <a-select-option v-for="d in dataPointOptions" :key="d" :value="d">{{ d }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item required>
                  <template #label>监测值类型：</template>
                  <a-select v-model:value="triggerForm.monitorType" placeholder="请选择" @change="handleMonitorTypeChange">
                    <a-select-option value="threshold">阈值类（数值超限）</a-select-option>
                    <a-select-option value="status">状态类（信号突变）</a-select-option>
                    <a-select-option value="heartbeat">心跳类（通讯中断）</a-select-option>
                    <a-select-option value="rate">变化率类（趋势异常）</a-select-option>
                    <a-select-option value="accumulate">累积类（积分超限）</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="24">
              <a-col :span="8">
                <a-form-item>
                  <template #label>产品系列：</template>
                  <a-select v-model:value="triggerForm.productSeries" placeholder="请选择" allow-clear>
                    <a-select-option v-for="s in seriesOptions" :key="s" :value="s">{{ s }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item>
                  <template #label>毛坯件号：</template>
                  <a-input v-model:value="triggerForm.blankPartNo" placeholder="请输入毛坯件号" allow-clear />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item required>
                  <template #label>每日监控时间：</template>
                  <a-time-range-picker
                    v-model:value="triggerForm.dailyMonitorTime"
                    format="HH:mm"
                    value-format="HH:mm"
                    :placeholder="['开始时间', '结束时间']"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>

            <!-- 阈值类：实时值与设定上下限比较，越限触发 -->
            <template v-if="triggerForm.monitorType === 'threshold'">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>运算符：</template>
                    <a-select v-model:value="triggerForm.operator" placeholder="请选择">
                      <a-select-option value="gt">大于</a-select-option>
                      <a-select-option value="lt">小于</a-select-option>
                      <a-select-option value="eq">等于</a-select-option>
                      <a-select-option value="ne">不等于</a-select-option>
                      <a-select-option value="gte">大于等于</a-select-option>
                      <a-select-option value="lte">小于等于</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8" v-if="showMinValue">
                  <a-form-item required>
                    <template #label>最小值：</template>
                    <a-input-number v-model:value="triggerForm.minValue" placeholder="请输入" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="8" v-if="showMaxValue">
                  <a-form-item required>
                    <template #label>最大值：</template>
                    <a-input-number v-model:value="triggerForm.maxValue" placeholder="请输入" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：浇注温度低于下限、造型压力异常（砂型强度不足）、保温炉功率超出正常范围</div>
                </a-col>
              </a-row>
            </template>

            <!-- 状态类：监测开关量离散信号的非预期跳变 -->
            <template v-else-if="triggerForm.monitorType === 'status'">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>触发条件：</template>
                    <a-select v-model:value="triggerForm.statusTrigger" placeholder="请选择">
                      <a-select-option value="rise">信号上升沿（0→1）</a-select-option>
                      <a-select-option value="fall">信号下降沿（1→0）</a-select-option>
                      <a-select-option value="mismatch">与指令信号不符</a-select-option>
                      <a-select-option value="hold1">持续为高电平（1）</a-select-option>
                      <a-select-option value="hold0">持续为低电平（0）</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8" v-if="isMismatchSignal">
                  <a-form-item required>
                    <template #label>期望信号电平：</template>
                    <a-select v-model:value="triggerForm.expectLevel" placeholder="请选择">
                      <a-select-option :value="1">高电平（1）</a-select-option>
                      <a-select-option :value="0">低电平（0）</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item>
                    <template #label>持续时长（s）：</template>
                    <a-input-number v-model:value="triggerForm.debounceTime" placeholder="信号异常持续该时长才触发" :min="0" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：急停按钮触发、安全光幕中断（人员进入危险区域）、阀门到位信号与开闭指令不符</div>
                </a-col>
              </a-row>
            </template>

            <!-- 心跳类：数据点超时未更新即判定通讯中断/传感器失效 -->
            <template v-else-if="triggerForm.monitorType === 'heartbeat'">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>超时时间（s）：</template>
                    <a-input-number v-model:value="triggerForm.heartbeatTimeout" placeholder="请输入" :min="1" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <div class="monitor-tip block-tip">超过该时长未收到此点位的数采数据更新，即判定 PLC 通讯中断或传感器数据僵死并触发报警</div>
                </a-col>
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：浇注机/混砂机 PLC 通讯中断、关键测温点数据僵死</div>
                </a-col>
              </a-row>
            </template>

            <!-- 变化率类：单位时间内的变化速率过快/过慢 -->
            <template v-else-if="triggerForm.monitorType === 'rate'">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>统计窗口：</template>
                    <a-input-group compact>
                      <a-input-number v-model:value="triggerForm.rateWindow" placeholder="请输入" :min="1" style="width: 55%" />
                      <a-select v-model:value="triggerForm.rateWindowUnit" style="width: 45%">
                        <a-select-option value="second">秒</a-select-option>
                        <a-select-option value="minute">分钟</a-select-option>
                        <a-select-option value="hour">小时</a-select-option>
                      </a-select>
                    </a-input-group>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>变化率判断：</template>
                    <a-select v-model:value="triggerForm.rateOperator" placeholder="请选择">
                      <a-select-option value="gt">过快（大于上限）</a-select-option>
                      <a-select-option value="lt">过慢（小于下限）</a-select-option>
                      <a-select-option value="between">介于区间</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8" v-if="rateShowMin">
                  <a-form-item required>
                    <template #label>变化率下限：</template>
                    <a-input-number v-model:value="triggerForm.rateMinValue" placeholder="点位单位/窗口" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="8" v-if="rateShowMax">
                  <a-form-item required>
                    <template #label>变化率上限：</template>
                    <a-input-number v-model:value="triggerForm.rateMaxValue" placeholder="点位单位/窗口" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：保温炉升温速率过快（加热元件短路预警，如 &gt;50℃/min）、液压系统压力下降速率过快（泄漏预判）</div>
                </a-col>
              </a-row>
            </template>

            <!-- 累积类：按次数/时长/数值累积，超限报警 -->
            <template v-else-if="triggerForm.monitorType === 'accumulate'">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>累积方式：</template>
                    <a-select v-model:value="triggerForm.accumulateMode" placeholder="请选择">
                      <a-select-option value="count">动作次数累积</a-select-option>
                      <a-select-option value="duration">持续时长累积</a-select-option>
                      <a-select-option value="value">数值积分累积</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>累积上限：</template>
                    <a-input-number v-model:value="triggerForm.accumulateLimit" placeholder="请输入" :min="0" style="width: 100%" :addon-after="accumulateUnit || undefined" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>重置周期：</template>
                    <a-select v-model:value="triggerForm.resetCycle" placeholder="请选择">
                      <a-select-option value="shift">按班次</a-select-option>
                      <a-select-option value="day">按日</a-select-option>
                      <a-select-option value="week">按周</a-select-option>
                      <a-select-option value="month">按月</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：单件产品能耗超限（工艺优化提示）、关键阀门动作频次过高（维护提示）</div>
                </a-col>
              </a-row>
            </template>
          </template>

          <!-- 业务逻辑 配置 -->
          <template v-if="triggerForm.triggerType === 'business'">
            <!-- 二级联动：异常类型为「质量异常」时，展示检验相关字段 -->
            <template v-if="isQualityBusiness">
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>检验类型：</template>
                    <a-select v-model:value="triggerForm.inspectType" placeholder="请选择" @change="handleInspectTypeChange">
                      <a-select-option v-for="t in inspectTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>检验模板：</template>
                    <a-select v-model:value="triggerForm.inspectTemplate" placeholder="请先选择检验类型" :disabled="!triggerForm.inspectType">
                      <a-select-option v-for="m in inspectTemplateOptions" :key="m" :value="m">{{ m }}</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>检验结果：</template>
                    <a-select v-model:value="triggerForm.inspectResult" placeholder="请选择">
                      <a-select-option v-for="r in inspectResultOptions" :key="r" :value="r">{{ r }}</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="24">
                <a-col :span="24">
                  <div class="monitor-tip">典型场景：质量异常由检验单驱动，检验结果为「不合格」时触发安灯推送（如熔炼成分不合格、铸件外观不合格）</div>
                </a-col>
              </a-row>
            </template>

            <template v-else>
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item required>
                    <template #label>工位/子工位：</template>
                    <a-select v-model:value="triggerForm.station" placeholder="请选择">
                      <a-select-option v-for="s in stationOptions" :key="s" :value="s">{{ s }}</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <a-form-item required>
                    <template #label>触发条件：</template>
                    <a-input v-model:value="triggerForm.condition" placeholder="请输入业务逻辑触发条件" />
                  </a-form-item>
                </a-col>
              </a-row>
              <a-row :gutter="24">
                <a-col :span="8">
                  <a-form-item>
                    <template #label>延迟时间（s）：</template>
                    <a-input-number v-model:value="triggerForm.delayTime" placeholder="请输入" :min="0" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="16">
                  <a-form-item>
                    <template #label>备注：</template>
                    <a-input v-model:value="triggerForm.remark" placeholder="请输入备注信息" />
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
          </template>

          <!-- 其他 配置 -->
          <template v-if="triggerForm.triggerType === 'other'">
            <a-row :gutter="24">
              <a-col :span="12">
                <a-form-item required>
                  <template #label>触发条件：</template>
                  <a-input v-model:value="triggerForm.condition" placeholder="请输入触发条件" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item>
                  <template #label>延迟时间（s）：</template>
                  <a-input-number v-model:value="triggerForm.delayTime" placeholder="请输入" :min="0" style="width: 100%" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="24">
              <a-col :span="24">
                <a-form-item>
                  <template #label>备注：</template>
                  <a-textarea v-model:value="triggerForm.remark" placeholder="请输入备注信息" :rows="2" style="flex: 1" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>
        </a-form>
      </div>

      <a-divider style="margin: 4px 0 16px" />

      <!-- 推送配置 -->
      <div class="modal-section">
        <div class="section-title">推送配置</div>
        <div class="push-config">
          <a-button type="primary" size="small" class="add-push-btn" @click="handleAddPushRow">
            <PlusOutlined /> 添加
          </a-button>
          <a-table
            :columns="pushColumns"
            :data-source="pushData"
            :pagination="false"
            bordered
            size="small"
            class="push-table"
            :row-key="(record: any) => record.key"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'pushTime'">
                <a-input v-model:value="record.pushTime" placeholder="请输入" size="small" style="width: 80px" />
              </template>
              <template v-if="column.dataIndex === 'pushRole'">
                <a-select v-model:value="record.pushRole" placeholder="请选择" size="small" style="width: 120px">
                  <a-select-option value="leader1">1级主管</a-select-option>
                  <a-select-option value="leader2">2级主管</a-select-option>
                  <a-select-option value="leader3">3级主管</a-select-option>
                  <a-select-option value="leader4">4级主管</a-select-option>
                </a-select>
              </template>
              <template v-if="column.dataIndex === 'responseRole'">
                <a-select v-model:value="record.responseRole" placeholder="请选择" size="small" style="width: 120px">
                  <a-select-option value="leader1">1级主管</a-select-option>
                  <a-select-option value="leader2">2级主管</a-select-option>
                  <a-select-option value="leader3">3级主管</a-select-option>
                  <a-select-option value="leader4">4级主管</a-select-option>
                </a-select>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>

    <!-- 明细弹框 -->
    <a-modal v-model:open="detailModalVisible" title="明细" :footer="null" :width="640" @cancel="detailModalVisible = false">
      <template v-if="detailRecord">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">异常类型：</span>
            <span class="value">{{ detailRecord.exceptionType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">异常名称：</span>
            <span class="value">{{ detailRecord.exceptionName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">产线：</span>
            <span class="value">{{ detailRecord.productionLine }}</span>
          </div>
          <div class="detail-item">
            <span class="label">业务类型：</span>
            <span class="value">{{ detailRecord.businessType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">启用状态：</span>
            <span class="value">
              <a-tag :color="detailRecord.enabled ? 'green' : 'default'">
                {{ detailRecord.enabled ? '启用' : '停用' }}
              </a-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ detailRecord.createTime }}</span>
          </div>
          <div class="detail-item">
            <span class="label">创建人：</span>
            <span class="value">{{ detailRecord.creator }}</span>
          </div>
          <div class="detail-item">
            <span class="label">备注：</span>
            <span class="value">{{ detailRecord.remark || '-' }}</span>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'

// ---------- 类型定义 ----------
interface AndonConfigRecord {
  id: number
  exceptionType: string
  exceptionName: string
  productionLine: string
  businessType: string
  enabled: boolean
  createTime: string
  creator: string
  remark: string
}

interface PushConfigItem {
  key: string
  level: string
  pushTime: string
  pushRole: string | undefined
  responseRole: string | undefined
}

// ---------- 选项 ----------
const exceptionTypeOptions = ['生产异常', '质量异常', '安全异常', '工艺异常']
const productionLineOptions = ['造型三线HWS造型', '造型一线HWS造型', '造型二线HWS造型', '制芯线', '浇注线', '机体线']
const businessTypeOptions = ['通知类', '处置类']
const seriesOptions = ['A系列', 'B系列', 'C系列']
const stationOptions = ['造型工位', '浇注工位', '制芯工位', '清理工位', '砂处理工位']
const dataPointOptions = ['温度传感器', '压力传感器', '液位传感器', '流量传感器', '振动传感器', '急停信号', '安全光幕信号', '阀门到位信号', 'PLC心跳信号']

// ---------- 筛选表单 ----------
const searchForm = reactive({
  exceptionType: '',
  exceptionName: '',
  productionLine: '',
  businessType: ''
})

// ---------- 表格 ----------
const loading = ref(false)
const selectedRowKeys = ref<Array<string | number>>([])

const columns = [
  { title: '序号', key: 'seq', width: 80 },
  { title: '产线', dataIndex: 'productionLine', key: 'productionLine', width: 200 },
  { title: '异常类型', dataIndex: 'exceptionType', key: 'exceptionType', width: 130 },
  { title: '异常名称', dataIndex: 'exceptionName', key: 'exceptionName', width: 150 },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType', width: 120 },
  { title: '启用', key: 'enabled', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { title: '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const }
]

const dataSource = ref<AndonConfigRecord[]>([
  { id: 1, exceptionType: '生产异常', exceptionName: '浇注机异常', productionLine: '造型三线HWS造型', businessType: '通知类', enabled: true, createTime: '2026-07-20 14:56', creator: '张三', remark: '' },
  { id: 2, exceptionType: '生产异常', exceptionName: '造型线异常', productionLine: '造型三线HWS造型', businessType: '处置类', enabled: true, createTime: '2026-07-20 15:30', creator: '张三', remark: '' },
  { id: 3, exceptionType: '生产异常', exceptionName: '制芯机故障', productionLine: '制芯线', businessType: '处置类', enabled: true, createTime: '2026-07-18 09:10', creator: '李四', remark: '' },
  { id: 4, exceptionType: '质量异常', exceptionName: '尺寸超差', productionLine: '机体线', businessType: '通知类', enabled: false, createTime: '2026-07-15 11:20', creator: '王五', remark: '' },
  { id: 5, exceptionType: '生产异常', exceptionName: '砂芯短缺', productionLine: '造型一线HWS造型', businessType: '处置类', enabled: true, createTime: '2026-07-12 08:45', creator: '赵六', remark: '' },
  { id: 6, exceptionType: '安全异常', exceptionName: '消防通道堵塞', productionLine: '造型二线HWS造型', businessType: '通知类', enabled: true, createTime: '2026-07-10 16:00', creator: '张三', remark: '' },
  { id: 7, exceptionType: '工艺异常', exceptionName: '浇注温度偏差', productionLine: '浇注线', businessType: '处置类', enabled: false, createTime: '2026-07-08 10:30', creator: '李四', remark: '' }
])

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: Array<string | number>) => { selectedRowKeys.value = keys }
}))

const filteredData = computed(() => {
  let list = dataSource.value
  if (searchForm.exceptionType) list = list.filter(i => i.exceptionType === searchForm.exceptionType)
  if (searchForm.exceptionName) list = list.filter(i => i.exceptionName.includes(searchForm.exceptionName))
  if (searchForm.productionLine) list = list.filter(i => i.productionLine === searchForm.productionLine)
  if (searchForm.businessType) list = list.filter(i => i.businessType === searchForm.businessType)
  pagination.total = list.length
  return list
})

// ---------- 新增/编辑弹框 ----------
const modalVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const formData = reactive({
  exceptionType: undefined as string | undefined,
  exceptionName: '',
  productionLine: undefined as string | undefined,
  businessType: undefined as string | undefined,
  exceptionDesc: '',
  enabled: true,
  remark: ''
})

const triggerForm = reactive({
  triggerType: 'plc',
  station: undefined as string | undefined,
  equipment: '',
  dataPoint: undefined as string | undefined,
  productSeries: undefined as string | undefined, // 产品系列（非必填）
  blankPartNo: '', // 毛坯件号（非必填）
  dailyMonitorTime: undefined as string[] | undefined, // 每日监控时间区间（[HH:mm, HH:mm]）
  monitorType: 'threshold',
  operator: undefined as string | undefined,
  minValue: undefined as number | undefined,
  maxValue: undefined as number | undefined,
  // 状态类（信号突变）
  statusTrigger: undefined as string | undefined, // rise上升沿/fall下降沿/mismatch与指令不符/hold1持续为1/hold0持续为0
  expectLevel: undefined as number | undefined, // 期望信号电平（mismatch时使用）
  debounceTime: undefined as number | undefined, // 信号异常持续时长（防抖，秒）
  // 心跳类（通讯中断）
  heartbeatTimeout: 300 as number | undefined, // 超时时间（秒）
  // 变化率类（趋势异常）
  rateWindow: undefined as number | undefined, // 统计窗口数值
  rateWindowUnit: 'minute', // 统计窗口单位 second/minute/hour
  rateOperator: undefined as string | undefined, // gt过快/lt过慢/between介于
  rateMinValue: undefined as number | undefined, // 变化率下限
  rateMaxValue: undefined as number | undefined, // 变化率上限
  // 累积类（积分超限）
  accumulateMode: undefined as string | undefined, // count次数/duration时长/value数值
  accumulateLimit: undefined as number | undefined, // 累积上限
  resetCycle: undefined as string | undefined, // shift班次/day日/week周/month月
  condition: '',
  delayTime: undefined as number | undefined,
  remark: '',
  // 质量异常（业务逻辑）：检验联动字段
  inspectType: undefined as string | undefined, // 检验类型
  inspectTemplate: undefined as string | undefined, // 检验模板
  inspectResult: undefined as string | undefined // 检验结果 合格/不合格
})

// 各监测值类型专属字段默认值（切换类型/重置时统一还原）
const monitorFieldDefaults = {
  operator: undefined as string | undefined,
  minValue: undefined as number | undefined,
  maxValue: undefined as number | undefined,
  statusTrigger: undefined as string | undefined,
  expectLevel: undefined as number | undefined,
  debounceTime: undefined as number | undefined,
  heartbeatTimeout: 300 as number | undefined,
  rateWindow: undefined as number | undefined,
  rateWindowUnit: 'minute',
  rateOperator: undefined as string | undefined,
  rateMinValue: undefined as number | undefined,
  rateMaxValue: undefined as number | undefined,
  accumulateMode: undefined as string | undefined,
  accumulateLimit: undefined as number | undefined,
  resetCycle: undefined as string | undefined
}

// ---------- 质量异常 × 业务逻辑 二级联动 ----------
const inspectTypeOptions = ['熔炼检验', '造型检验', '制芯检验', '混砂检验', '清理检验']
const inspectResultOptions = ['合格', '不合格']

// 检验模板随检验类型联动
const inspectTemplateMap: Record<string, string[]> = {
  '熔炼检验': ['铁液成分光谱检验模板', '铁液温度检验模板', '炉前金相检验模板'],
  '造型检验': ['砂型硬度检验模板', '型腔尺寸检验模板', '合箱检查检验模板'],
  '制芯检验': ['砂芯强度检验模板', '砂芯尺寸检验模板', '砂芯固化检验模板'],
  '混砂检验': ['型砂水分检验模板', '型砂强度检验模板', '型砂透气性检验模板'],
  '清理检验': ['铸件外观检验模板', '铸件尺寸检验模板', '铸件抛丸检验模板']
}

const inspectTemplateOptions = computed(() => inspectTemplateMap[triggerForm.inspectType || ''] || [])

// 异常类型为质量异常且触发类型为业务逻辑时，展示检验字段
const isQualityBusiness = computed(() =>
  formData.exceptionType === '质量异常' && triggerForm.triggerType === 'business'
)

// 切换检验类型时清空检验模板
const handleInspectTypeChange = () => {
  triggerForm.inspectTemplate = undefined
}

// 异常类型切出「质量异常」时清空检验字段
watch(() => formData.exceptionType, (val) => {
  if (val !== '质量异常') {
    triggerForm.inspectType = undefined
    triggerForm.inspectTemplate = undefined
    triggerForm.inspectResult = undefined
  }
})

// 运算符联动：控制最小值/最大值的显示
const showMinValue = computed(() => {
  if (!triggerForm.operator) return true
  return ['gt', 'gte', 'eq', 'ne'].includes(triggerForm.operator)
})
const showMaxValue = computed(() => {
  if (!triggerForm.operator) return true
  return ['lt', 'lte', 'eq', 'ne'].includes(triggerForm.operator)
})

// 状态类：仅「与指令信号不符」时需要配置期望信号电平
const isMismatchSignal = computed(() => triggerForm.statusTrigger === 'mismatch')

// 变化率类：按判断方式控制下限/上限的显示
const rateShowMin = computed(() => {
  if (!triggerForm.rateOperator) return true
  return ['lt', 'between'].includes(triggerForm.rateOperator)
})
const rateShowMax = computed(() => {
  if (!triggerForm.rateOperator) return true
  return ['gt', 'between'].includes(triggerForm.rateOperator)
})

// 累积类：按累积方式动态显示上限单位
const accumulateUnit = computed(() => {
  if (triggerForm.accumulateMode === 'count') return '次'
  if (triggerForm.accumulateMode === 'duration') return '分钟'
  return ''
})

// 切换监测值类型时重置类型专属字段
const handleMonitorTypeChange = () => {
  Object.assign(triggerForm, monitorFieldDefaults)
}

// 切换触发类型时重置相关字段
const handleTriggerTypeChange = () => {
  triggerForm.station = undefined
  triggerForm.dataPoint = undefined
  triggerForm.productSeries = undefined
  triggerForm.blankPartNo = ''
  triggerForm.dailyMonitorTime = undefined
  triggerForm.monitorType = 'threshold'
  Object.assign(triggerForm, monitorFieldDefaults)
  triggerForm.condition = ''
  triggerForm.delayTime = undefined
  triggerForm.remark = ''
  triggerForm.inspectType = undefined
  triggerForm.inspectTemplate = undefined
  triggerForm.inspectResult = undefined
}

// 运算符切换时清空不适用的值
watch(() => triggerForm.operator, (val) => {
  if (val && !['gt', 'gte', 'eq', 'ne'].includes(val)) {
    triggerForm.minValue = undefined
  }
  if (val && !['lt', 'lte', 'eq', 'ne'].includes(val)) {
    triggerForm.maxValue = undefined
  }
})

// 变化率判断切换时清空不适用的值
watch(() => triggerForm.rateOperator, (val) => {
  if (val && !['lt', 'between'].includes(val)) {
    triggerForm.rateMinValue = undefined
  }
  if (val && !['gt', 'between'].includes(val)) {
    triggerForm.rateMaxValue = undefined
  }
})

// 状态类触发条件切换时清空期望电平
watch(() => triggerForm.statusTrigger, (val) => {
  if (val !== 'mismatch') {
    triggerForm.expectLevel = undefined
  }
})

// 推送配置表格
const pushColumns = [
  { title: '级别', dataIndex: 'level', key: 'level', width: 80, align: 'center' as const },
  { title: '推送时间（min）', dataIndex: 'pushTime', key: 'pushTime', width: 130 },
  { title: '推送角色', dataIndex: 'pushRole', key: 'pushRole', width: 140 },
  { title: '响应角色', dataIndex: 'responseRole', key: 'responseRole', width: 140 }
]

let pushRowKey = 0
const pushData = ref<PushConfigItem[]>([
  { key: String(++pushRowKey), level: '1级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
  { key: String(++pushRowKey), level: '2级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
  { key: String(++pushRowKey), level: '3级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
  { key: String(++pushRowKey), level: '4级人员', pushTime: '', pushRole: undefined, responseRole: undefined }
])

const handleAddPushRow = () => {
  const levelNum = pushData.value.length + 1
  pushData.value.push({
    key: String(++pushRowKey),
    level: `${levelNum}级人员`,
    pushTime: '',
    pushRole: undefined,
    responseRole: undefined
  })
}

const resetForm = () => {
  Object.assign(formData, { exceptionType: undefined, exceptionName: '', productionLine: undefined, businessType: undefined, exceptionDesc: '', enabled: true, remark: '' })
  Object.assign(triggerForm, { triggerType: 'plc', station: undefined, equipment: '', dataPoint: undefined, productSeries: undefined, blankPartNo: '', dailyMonitorTime: undefined, monitorType: 'threshold', condition: '', delayTime: undefined, remark: '', inspectType: undefined, inspectTemplate: undefined, inspectResult: undefined }, monitorFieldDefaults)
  pushRowKey = 0
  pushData.value = [
    { key: String(++pushRowKey), level: '1级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
    { key: String(++pushRowKey), level: '2级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
    { key: String(++pushRowKey), level: '3级人员', pushTime: '', pushRole: undefined, responseRole: undefined },
    { key: String(++pushRowKey), level: '4级人员', pushTime: '', pushRole: undefined, responseRole: undefined }
  ]
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = 0
  resetForm()
  modalVisible.value = true
}

const handleEdit = () => {
  if (selectedRowKeys.value.length !== 1) { message.warning('请选择一条记录进行编辑'); return }
  const record = dataSource.value.find(i => i.id === selectedRowKeys.value[0])
  if (!record) return
  isEdit.value = true
  editingId.value = record.id
  Object.assign(formData, {
    exceptionType: record.exceptionType,
    exceptionName: record.exceptionName,
    productionLine: record.productionLine,
    businessType: record.businessType,
    exceptionDesc: record.remark || '',
    enabled: record.enabled,
    remark: record.remark
  })
  modalVisible.value = true
}

const handleBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) { message.warning('请先选择要删除的记录'); return }
  Modal.confirm({
    title: '确认删除',
    content: `确定删除选中的 ${selectedRowKeys.value.length} 条记录吗？`,
    onOk() {
      dataSource.value = dataSource.value.filter(i => !selectedRowKeys.value.includes(i.id))
      selectedRowKeys.value = []
      message.success('删除成功')
    }
  })
}

const handleModalOk = () => {
  if (!formData.exceptionType || !formData.exceptionName || !formData.productionLine || !formData.businessType) {
    message.warning('请填写所有必填项')
    return
  }
  if (isQualityBusiness.value && (!triggerForm.inspectType || !triggerForm.inspectTemplate || !triggerForm.inspectResult)) {
    message.warning('请选择检验类型、检验模板、检验结果')
    return
  }
  if (isEdit.value) {
    const idx = dataSource.value.findIndex(i => i.id === editingId.value)
    if (idx !== -1) {
      dataSource.value[idx] = {
        ...dataSource.value[idx],
        exceptionType: formData.exceptionType!,
        exceptionName: formData.exceptionName,
        productionLine: formData.productionLine!,
        businessType: formData.businessType!,
        enabled: formData.enabled,
        remark: formData.exceptionDesc
      }
    }
    message.success('修改成功')
  } else {
    dataSource.value.unshift({
      id: Date.now(),
      exceptionType: formData.exceptionType!,
      exceptionName: formData.exceptionName,
      productionLine: formData.productionLine!,
      businessType: formData.businessType!,
      enabled: formData.enabled,
      createTime: dayjs().format('YYYY-MM-DD HH:mm'),
      creator: 'admin',
      remark: formData.exceptionDesc
    })
    message.success('新增成功')
  }
  modalVisible.value = false
}

const handleModalCancel = () => { modalVisible.value = false }

// ---------- 启用开关 ----------
const handleEnabledChange = (record: AndonConfigRecord, checked: boolean) => {
  record.enabled = checked
  message.success(`已${checked ? '启用' : '停用'}`)
}

// ---------- 明细 ----------
const detailModalVisible = ref(false)
const detailRecord = ref<AndonConfigRecord | null>(null)

const handleViewDetail = (record: AndonConfigRecord) => {
  detailRecord.value = record
  detailModalVisible.value = true
}

// ---------- 筛选 ----------
const handleSearch = () => { pagination.current = 1 }
const handleReset = () => {
  searchForm.exceptionType = ''
  searchForm.exceptionName = ''
  searchForm.productionLine = ''
  searchForm.businessType = ''
  pagination.current = 1
}
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}
</script>

<style scoped>
/* 弹框样式 */
.config-modal :deep(.ant-modal-body) {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-section {
  margin-bottom: 4px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 16px;
  padding: 4px 10px;
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
  border-radius: 2px;
  line-height: 1.4;
  display: inline-block;
}

/* 横排标签表单 */
.inline-label-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.inline-label-form :deep(.ant-form-item-label) {
  display: inline-block;
  width: auto !important;
  padding-right: 4px;
  text-align: right;
  vertical-align: top;
  line-height: 32px;
  flex: 0 0 auto !important;
  max-width: none !important;
}

.inline-label-form :deep(.ant-form-item-label > label) {
  color: #333;
  font-size: 13px;
}

.inline-label-form :deep(.ant-form-item-label > label::before) {
  content: none;
}

/* 仅必填项显示 *（ant-design-vue 4 把 ant-form-item-required 类加在 label 上） */
.inline-label-form :deep(.ant-form-item-label > label.ant-form-item-required::before) {
  content: '*';
  color: #ff4d4f;
  margin-right: 4px;
  font-size: 13px;
}

.inline-label-form :deep(.ant-form-item-control) {
  display: inline-block;
  vertical-align: top;
  flex: 1 !important;
  min-width: 0;
}

.modal-form :deep(.ant-row) {
  margin-bottom: 0;
}

.form-item-full {
  width: 100%;
}

.form-item-full :deep(.ant-form-item-control) {
  flex: 1;
}

/* 监测值类型场景提示 */
.monitor-tip {
  color: #999;
  font-size: 13px;
  line-height: 1.6;
  background: #fafafa;
  border: 1px dashed #e8e8e8;
  border-radius: 4px;
  padding: 6px 12px;
}

.monitor-tip.block-tip {
  height: 100%;
  display: flex;
  align-items: center;
}

/* 推送配置 */
.push-config {
  position: relative;
}

.add-push-btn {
  margin-bottom: 12px;
}

.push-table :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  text-align: center;
}

.push-table :deep(.ant-checkbox-wrapper) {
  margin-right: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 16px;
  column-gap: 24px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
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
</style>
