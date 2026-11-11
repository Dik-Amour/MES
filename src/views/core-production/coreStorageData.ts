export interface CoreStorageRow {
  palletCode: string
  feedPortNo: string
  deviceCode: string
  deviceName: string
  materialCode: string
  materialName: string
  wmsMaterialCode: string
  wmsMaterialName: string
  coreQty: number
  virtualStatus: '已入库' | '待映射' | '已组芯' | '已出库'
  processParam: string
  inTime: string
  outTime: string
  inboundEventId?: string
  inboundOperator?: string
  outboundEventId?: string
  outboundOperator?: string
  outboundType?: string
  outReason?: string
}

export interface InboundRecordRow {
  eventId: string
  palletCode: string
  feedPortNo: string
  wmsMaterialName: string
  wmsMaterialCode: string
  materialName: string
  materialCode: string
  coreQty: number
  operator: string
  inTime: string
}

export interface OutboundRecordRow {
  eventId: string
  palletCode: string
  outTime: string
  operator: string
  coreQty: number
  materialName: string
  materialCode: string
  wmsMaterialName: string
  wmsMaterialCode: string
  feedPortNo: string
  outboundType: string
  outReason: string
}

// 同一砂芯立库的统一模拟数据源。入库/出库记录由这里派生，避免三个页面各自维护数据。
export const coreStorageRows: CoreStorageRow[] = [
  { palletCode: 'TP20261103002', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '待映射', processParam: '射芯压力0.48MPa；固化温度185℃；固化时间55s', inTime: '2026-11-03 09:58:14', outTime: '', inboundEventId: 'EVT20261103091532002', inboundOperator: '李强' },
  { palletCode: 'TP20261103001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '已入库', processParam: '射芯压力0.40MPa；固化温度180℃；固化时间40s', inTime: '2026-11-03 08:10:26', outTime: '', inboundEventId: 'EVT20261103091532001', inboundOperator: '张伟' },
  { palletCode: 'TP20261102004', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002352', materialName: '机体挺柱室砂芯', wmsMaterialCode: 'WMS-SC-10002352', wmsMaterialName: '机体挺柱室砂芯(立库)', coreQty: 11, virtualStatus: '已入库', processParam: '射芯压力0.46MPa；固化温度180℃；固化时间46s', inTime: '2026-11-02 14:05:39', outTime: '', inboundEventId: 'EVT20261103083341001', inboundOperator: '王芳' },
  { palletCode: 'TP20261102003', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002346', materialName: '机体主油道砂芯', wmsMaterialCode: 'WMS-SC-10002346', wmsMaterialName: '机体主油道砂芯(立库)', coreQty: 10, virtualStatus: '已出库', processParam: '射芯压力0.42MPa；固化温度175℃；固化时间50s', inTime: '2026-11-02 11:12:08', outTime: '2026-11-02 17:26:41', inboundEventId: 'EVT20261102110705001', inboundOperator: '李强', outboundEventId: 'EVT20261102172755001', outboundOperator: '李强', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261102002', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002351', materialName: '机体正时罩壳砂芯', wmsMaterialCode: 'WMS-SC-10002351', wmsMaterialName: '机体正时罩壳砂芯(立库)', coreQty: 7, virtualStatus: '已组芯', processParam: '射芯压力0.41MPa；固化温度182℃；固化时间42s', inTime: '2026-11-02 09:47:53', outTime: '', inboundEventId: 'EVT20261102094912001', inboundOperator: '赵敏' },
  { palletCode: 'TP20261102001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002345', materialName: '机体水套砂芯', wmsMaterialCode: 'WMS-SC-10002345', wmsMaterialName: '机体水套砂芯(立库)', coreQty: 12, virtualStatus: '已入库', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-02 08:32:15', outTime: '', inboundEventId: 'EVT20261102083420001', inboundOperator: '张伟' },
  { palletCode: 'TP20261101006', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002350', materialName: '机体回油道砂芯', wmsMaterialCode: 'WMS-SC-10002350', wmsMaterialName: '机体回油道砂芯(立库)', coreQty: 9, virtualStatus: '已出库', processParam: '射芯压力0.43MPa；固化温度178℃；固化时间48s', inTime: '2026-11-01 16:18:27', outTime: '2026-11-02 08:05:10', inboundEventId: 'EVT20261101161933001', inboundOperator: '王芳', outboundEventId: 'EVT20261102080622001', outboundOperator: '王芳', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261101005', feedPortNo: 'SL-03', deviceCode: 'CORE-M-03', deviceName: '3号制芯机', materialCode: '10002349', materialName: '机体水套砂芯B', wmsMaterialCode: 'WMS-SC-10002349', wmsMaterialName: '机体水套砂芯B(立库)', coreQty: 12, virtualStatus: '已组芯', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-01 15:02:44', outTime: '', inboundEventId: 'EVT20261101150351001', inboundOperator: '陈刚' },
  { palletCode: 'TP20261101004', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '已入库', processParam: '射芯压力0.48MPa；固化温度185℃；固化时间55s', inTime: '2026-11-01 13:20:05', outTime: '', inboundEventId: 'EVT20261101132118001', inboundOperator: '李强' },
  { palletCode: 'TP20261101003', feedPortNo: 'SL-02', deviceCode: 'CORE-M-02', deviceName: '2号制芯机', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '待映射', processParam: '射芯压力0.40MPa；固化温度180℃；固化时间40s', inTime: '2026-11-01 10:45:36', outTime: '', inboundEventId: 'EVT20261101104640001', inboundOperator: '赵敏' },
  { palletCode: 'TP20261101002', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002346', materialName: '机体主油道砂芯', wmsMaterialCode: 'WMS-SC-10002346', wmsMaterialName: '机体主油道砂芯(立库)', coreQty: 10, virtualStatus: '已入库', processParam: '射芯压力0.42MPa；固化温度175℃；固化时间50s', inTime: '2026-11-01 09:30:12', outTime: '', inboundEventId: 'EVT20261101093125001', inboundOperator: '张伟' },
  { palletCode: 'TP20261101001', feedPortNo: 'SL-01', deviceCode: 'CORE-M-01', deviceName: '1号制芯机', materialCode: '10002345', materialName: '机体水套砂芯', wmsMaterialCode: 'WMS-SC-10002345', wmsMaterialName: '机体水套砂芯(立库)', coreQty: 12, virtualStatus: '已入库', processParam: '射芯压力0.45MPa；固化温度180℃；固化时间45s', inTime: '2026-11-01 08:15:20', outTime: '', inboundEventId: 'EVT20261101081630001', inboundOperator: '陈刚' },
  { palletCode: 'TP20261031008', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002345', materialName: '机体水套砂芯', wmsMaterialCode: 'WMS-SC-10002345', wmsMaterialName: '机体水套砂芯(立库)', coreQty: 12, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-11-01 16:40:25', outboundEventId: 'EVT20261101164108001', outboundOperator: '张伟', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031007', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-11-01 14:32:47', outboundEventId: 'EVT20261101143352001', outboundOperator: '赵敏', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031006', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-11-01 11:11:03', outboundEventId: 'EVT20261101111219001', outboundOperator: '陈刚', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031005', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002346', materialName: '机体主油道砂芯', wmsMaterialCode: 'WMS-SC-10002346', wmsMaterialName: '机体主油道砂芯(立库)', coreQty: 10, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-11-01 09:29:38', outboundEventId: 'EVT20261101093044001', outboundOperator: '李强', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031004', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002351', materialName: '机体正时罩壳砂芯', wmsMaterialCode: 'WMS-SC-10002351', wmsMaterialName: '机体正时罩壳砂芯(立库)', coreQty: 7, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-31 17:24:12', outboundEventId: 'EVT20261031172506001', outboundOperator: '王芳', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031003', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002352', materialName: '机体挺柱室砂芯', wmsMaterialCode: 'WMS-SC-10002352', wmsMaterialName: '机体挺柱室砂芯(立库)', coreQty: 11, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-31 15:46:29', outboundEventId: 'EVT20261031154733001', outboundOperator: '张伟', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031002', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002349', materialName: '机体水套砂芯B', wmsMaterialCode: 'WMS-SC-10002349', wmsMaterialName: '机体水套砂芯B(立库)', coreQty: 12, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-31 13:17:44', outboundEventId: 'EVT20261031131857001', outboundOperator: '赵敏', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261031001', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002350', materialName: '机体回油道砂芯', wmsMaterialCode: 'WMS-SC-10002350', wmsMaterialName: '机体回油道砂芯(立库)', coreQty: 9, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-31 10:04:16', outboundEventId: 'EVT20261031100521001', outboundOperator: '陈刚', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261030009', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002347', materialName: '机体顶盖砂芯', wmsMaterialCode: 'WMS-SC-10002347', wmsMaterialName: '机体顶盖砂芯(立库)', coreQty: 8, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-30 16:51:35', outboundEventId: 'EVT20261030165240001', outboundOperator: '李强', outboundType: '生产线消耗', outReason: '送造型一线' },
  { palletCode: 'TP20261030008', feedPortNo: '', deviceCode: '', deviceName: '', materialCode: '10002348', materialName: '机体缸筒砂芯', wmsMaterialCode: 'WMS-SC-10002348', wmsMaterialName: '机体缸筒砂芯(立库)', coreQty: 6, virtualStatus: '已出库', processParam: '', inTime: '', outTime: '2026-10-30 14:22:09', outboundEventId: 'EVT20261030142318001', outboundOperator: '王芳', outboundType: '生产线消耗', outReason: '送造型一线' }
]

export const inboundRecordRows: InboundRecordRow[] = coreStorageRows
  .filter(row => row.inboundEventId)
  .map(row => ({
    eventId: row.inboundEventId!,
    palletCode: row.palletCode,
    feedPortNo: row.feedPortNo,
    wmsMaterialName: row.wmsMaterialName,
    wmsMaterialCode: row.wmsMaterialCode,
    materialName: row.materialName,
    materialCode: row.materialCode,
    coreQty: row.coreQty,
    operator: row.inboundOperator || '',
    inTime: row.inTime
  }))

export const outboundRecordRows: OutboundRecordRow[] = coreStorageRows
  .filter(row => row.outboundEventId)
  .map(row => ({
    eventId: row.outboundEventId!,
    palletCode: row.palletCode,
    outTime: row.outTime,
    operator: row.outboundOperator || '',
    coreQty: row.coreQty,
    materialName: row.materialName,
    materialCode: row.materialCode,
    wmsMaterialName: row.wmsMaterialName,
    wmsMaterialCode: row.wmsMaterialCode,
    feedPortNo: row.feedPortNo,
    outboundType: row.outboundType || '生产线消耗',
    outReason: row.outReason || ''
  }))
