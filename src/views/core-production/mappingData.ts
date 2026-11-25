// 立库集成：物料映射、上料口-设备字典 mock 数据
// 对应方案：MES 侧维护映射关系，立库零改造

export interface MaterialMappingRow {
  id: number
  libCoreName: string
  libCoreCode: string
  materialCode: string
  materialName: string
  coreCategory: string
  status: 'enabled' | 'disabled'
  remark: string
  updateTime: string
  updater: string
}

export interface PortDeviceMappingRow {
  id: number
  portCode: string
  portName: string
  deviceCode: string
  deviceName: string
  lineName: string
  status: 'enabled' | 'disabled'
  remark: string
  updateTime: string
  updater: string
}

// 物料映射表：立库车间叫法 → MES/ERP 标准物料（入库事件第一层主规则）
export const materialMappingRows: MaterialMappingRow[] = [
  {
    id: 1,
    libCoreName: 'K1大缸芯',
    libCoreCode: 'WMS-SC-10002348',
    materialCode: '1000544003R_KMA_2#dgx',
    materialName: '2#大缸芯',
    coreCategory: '机体芯',
    status: 'enabled',
    remark: '车间习惯叫 K1，对应 2# 大缸芯',
    updateTime: '2026-11-03 09:20',
    updater: 'admin'
  },
  {
    id: 2,
    libCoreName: '机体水套砂芯',
    libCoreCode: 'WMS-SC-10002345',
    materialCode: '10002345',
    materialName: '机体水套砂芯',
    coreCategory: '机体芯',
    status: 'enabled',
    remark: '',
    updateTime: '2026-11-02 15:10',
    updater: 'admin'
  },
  {
    id: 3,
    libCoreName: '机体顶盖砂芯',
    libCoreCode: 'WMS-SC-10002347',
    materialCode: '10002347',
    materialName: '机体顶盖砂芯',
    coreCategory: '盖芯',
    status: 'enabled',
    remark: '',
    updateTime: '2026-11-02 15:12',
    updater: 'admin'
  },
  {
    id: 4,
    libCoreName: '机体缸筒砂芯',
    libCoreCode: 'WMS-SC-10002348',
    materialCode: '10002348',
    materialName: '机体缸筒砂芯',
    coreCategory: '底芯',
    status: 'enabled',
    remark: '',
    updateTime: '2026-11-01 11:05',
    updater: 'admin'
  },
  {
    id: 5,
    libCoreName: '机体主油道砂芯',
    libCoreCode: 'WMS-SC-10002346',
    materialCode: '10002346',
    materialName: '机体主油道砂芯',
    coreCategory: '机体芯',
    status: 'enabled',
    remark: '',
    updateTime: '2026-11-01 10:40',
    updater: 'admin'
  },
  {
    id: 6,
    libCoreName: '底盘芯组',
    libCoreCode: 'WMS-SC-10002353',
    materialCode: '10002353',
    materialName: '底盘芯组',
    coreCategory: '底盘芯组',
    status: 'enabled',
    remark: 'MES 自有 PDA 刻号入库主责物料',
    updateTime: '2026-10-31 16:20',
    updater: 'admin'
  },
  {
    id: 7,
    libCoreName: '机体挺柱室砂芯',
    libCoreCode: 'WMS-SC-10002352',
    materialCode: '10002352',
    materialName: '机体挺柱室砂芯',
    coreCategory: '机体芯',
    status: 'enabled',
    remark: '',
    updateTime: '2026-10-31 09:15',
    updater: 'admin'
  },
  {
    id: 8,
    libCoreName: '机体正时罩壳砂芯',
    libCoreCode: 'WMS-SC-10002351',
    materialCode: '10002351',
    materialName: '机体正时罩壳砂芯',
    coreCategory: '盖芯',
    status: 'disabled',
    remark: '工艺变更，暂不使用旧叫法',
    updateTime: '2026-10-30 14:05',
    updater: 'admin'
  }
]

// 上料口-设备字典：4 个上料口各对应 1 台制芯机（方案约定）
export const portDeviceMappingRows: PortDeviceMappingRow[] = [
  {
    id: 1,
    portCode: 'SL-01',
    portName: '1号上料口',
    deviceCode: 'CORE-M-01',
    deviceName: '1号制芯机',
    lineName: '机体线',
    status: 'enabled',
    remark: '对应盖芯/水套芯产出',
    updateTime: '2026-11-03 08:30',
    updater: 'admin'
  },
  {
    id: 2,
    portCode: 'SL-02',
    portName: '2号上料口',
    deviceCode: 'CORE-M-02',
    deviceName: '2号制芯机',
    lineName: '机体线',
    status: 'enabled',
    remark: '对应缸筒/主油道芯产出',
    updateTime: '2026-11-03 08:32',
    updater: 'admin'
  },
  {
    id: 3,
    portCode: 'SL-03',
    portName: '3号上料口',
    deviceCode: 'CORE-M-03',
    deviceName: '3号制芯机',
    lineName: '机体线',
    status: 'enabled',
    remark: '',
    updateTime: '2026-11-02 17:05',
    updater: 'admin'
  },
  {
    id: 4,
    portCode: 'SL-04',
    portName: '4号上料口',
    deviceCode: 'CORE-M-04',
    deviceName: '4号制芯机',
    lineName: '机体线',
    status: 'enabled',
    remark: '底盘芯组相关产出',
    updateTime: '2026-11-01 13:40',
    updater: 'admin'
  }
]
