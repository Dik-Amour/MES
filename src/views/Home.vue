<template>
  <div class="home-page">
    <a-row :gutter="[16, 16]">
      <!-- 统计信息区 -->
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="总用户数"
            :value="1128"
            :value-style="{ color: '#3f8600' }"
          >
            <template #prefix>
              <UserOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="今日订单"
            :value="93"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <ShoppingCartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="生产完成率"
            :value="85.6"
            suffix="%"
            :value-style="{ color: '#cf1322' }"
          >
            <template #prefix>
              <LineChartOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card" :bordered="false">
          <a-statistic
            title="设备运行"
            :value="12"
            suffix="台"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <SettingOutlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <!-- 快捷操作区 -->
      <a-col :xs="24" :lg="12">
        <a-card title="快捷操作" :bordered="false">
          <a-space :size="[16, 16]" wrap>
            <a-button type="primary" @click="handleQuickAction('newOrder')">
              <PlusOutlined />
              新建订单
            </a-button>
            <a-button @click="handleQuickAction('addUser')">
              <UserAddOutlined />
              添加用户
            </a-button>
            <a-button @click="handleQuickAction('checkDevice')">
              <CheckCircleOutlined />
              设备检查
            </a-button>
            <a-button @click="handleQuickAction('exportData')">
              <ExportOutlined />
              导出数据
            </a-button>
          </a-space>
        </a-card>
      </a-col>

      <!-- 系统通知区 -->
      <a-col :xs="24" :lg="12">
        <a-card title="系统通知" :bordered="false">
          <a-list :data-source="notifications" size="small">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta>
                  <template #title>
                    <a-tag :color="item.type === 'info' ? 'blue' : item.type === 'warning' ? 'orange' : 'red'">
                      {{ item.tag }}
                    </a-tag>
                    {{ item.title }}
                  </template>
                  <template #description>{{ item.time }}</template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px;">
      <!-- 数据表格区 -->
      <a-col :xs="24">
        <a-card title="最近订单" :bordered="false">
          <template #extra>
            <a-button type="link" @click="handleViewAll">查看全部</a-button>
          </template>
          <a-table
            :columns="columns"
            :data-source="dataSource"
            :pagination="{ pageSize: 5 }"
            :scroll="{ x: 800 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ getStatusText(record.status) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space>
                  <a-button type="link" size="small">查看</a-button>
                  <a-button type="link" size="small">编辑</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  UserOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  SettingOutlined,
  PlusOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  ExportOutlined
} from '@ant-design/icons-vue'

interface Notification {
  title: string
  tag: string
  time: string
  type: 'info' | 'warning' | 'error'
}

interface Order {
  key: string
  orderNo: string
  customer: string
  amount: number
  status: string
  createTime: string
}

const notifications = ref<Notification[]>([
  {
    title: '系统维护通知',
    tag: '系统',
    time: '2024-01-15 10:00',
    type: 'info'
  },
  {
    title: '设备 #3 需要维护',
    tag: '设备',
    time: '2024-01-15 09:30',
    type: 'warning'
  },
  {
    title: '订单 #12345 延期',
    tag: '订单',
    time: '2024-01-15 08:15',
    type: 'error'
  }
])

const columns = [
  {
    title: '订单号',
    dataIndex: 'orderNo',
    key: 'orderNo'
  },
  {
    title: '客户',
    dataIndex: 'customer',
    key: 'customer'
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const dataSource = ref<Order[]>([
  {
    key: '1',
    orderNo: 'ORD-2024-001',
    customer: '客户A',
    amount: 15000,
    status: 'completed',
    createTime: '2024-01-15 10:00:00'
  },
  {
    key: '2',
    orderNo: 'ORD-2024-002',
    customer: '客户B',
    amount: 23000,
    status: 'processing',
    createTime: '2024-01-15 09:30:00'
  },
  {
    key: '3',
    orderNo: 'ORD-2024-003',
    customer: '客户C',
    amount: 8000,
    status: 'pending',
    createTime: '2024-01-15 08:15:00'
  }
])

const handleQuickAction = (action: string) => {
  console.log('Quick action:', action)
}

const handleViewAll = () => {
  console.log('View all orders')
}

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    completed: 'green',
    processing: 'blue',
    pending: 'orange',
    cancelled: 'red'
  }
  return colorMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    completed: '已完成',
    processing: '处理中',
    pending: '待处理',
    cancelled: '已取消'
  }
  return textMap[status] || status
}
</script>

<style scoped>
.home-page {
  background: transparent;
}

.stat-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
