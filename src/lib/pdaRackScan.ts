/**
 * PDA 芯架扫码模拟数据。
 * 接入真实扫码设备时，将 simulateRackScan 替换为设备回调即可。
 */

export interface PdaRackScanResult {
  rackCode: string
  coreNo: string
  coreName: string
  quantity: number
  maker: string
  equipment: string
  coreDate: string
  batch: string
}

const mockRacks: PdaRackScanResult[] = [
  {
    rackCode: 'GJ2026102301',
    coreNo: 'C000006123',
    coreName: '1000978237R_KMA_jzx_进气芯',
    quantity: 48,
    maker: '张三',
    equipment: '制芯机X-01',
    coreDate: '2026-10-23',
    batch: 'PF-2026102301'
  },
  {
    rackCode: 'GJ2026102302',
    coreNo: 'C000006230',
    coreName: '1001024589R_KMA_jzx_排气芯',
    quantity: 36,
    maker: '李四',
    equipment: '制芯机X-02',
    coreDate: '2026-10-23',
    batch: 'PF-2026102302'
  },
  {
    rackCode: 'GJ2026102303',
    coreNo: 'C000006345',
    coreName: '1001024590R_KMA_jzx_水套芯',
    quantity: 32,
    maker: '王五',
    equipment: '制芯机X-03',
    coreDate: '2026-10-23',
    batch: 'PF-2026102303'
  }
]

let scanIndex = 0

export function simulateRackScan(excludeRackCodes: string[] = []): PdaRackScanResult {
  const available = mockRacks.filter((rack) => !excludeRackCodes.includes(rack.rackCode))
  const result = (available.length ? available : mockRacks)[scanIndex % (available.length || mockRacks.length)]
  scanIndex += 1
  return { ...result }
}