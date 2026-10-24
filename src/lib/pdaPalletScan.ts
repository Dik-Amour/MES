/**
 * PDA 托盘码扫码模拟数据。
 * 接入真实扫码设备时，只需替换 simulatePalletScan 的数据来源。
 */

export interface PdaPalletScanResult {
  palletCode: string
  rfid: string
  coreNo: string
  coreName: string
  coreDate: string
  maker: string
}

const mockPallets: PdaPalletScanResult[] = [
  {
    palletCode: 'TP202309001',
    rfid: 'RFID-ML-001234',
    coreNo: 'C000005980',
    coreName: '1000978236R_KMA_jzx_缸盖芯',
    coreDate: '2026-10-22',
    maker: '张三'
  },
  {
    palletCode: 'TP202309002',
    rfid: 'RFID-ML-001235',
    coreNo: 'C000006123',
    coreName: '1000978237R_KMA_jzx_进气芯',
    coreDate: '2026-10-22',
    maker: '李四'
  },
  {
    palletCode: 'TP202309003',
    rfid: 'RFID-ML-001236',
    coreNo: 'C000006230',
    coreName: '1001024589R_KMA_jzx_排气芯',
    coreDate: '2026-10-21',
    maker: '王五'
  }
]

let palletScanIndex = 0

export function simulatePalletScan(enteredCode?: string): PdaPalletScanResult {
  const code = enteredCode?.trim()
  const matched = mockPallets.find((item) => item.palletCode === code)
  if (matched) {
    return { ...matched }
  }
  const generatedCode = code || `TP${Date.now()}`
  const result = mockPallets[palletScanIndex % mockPallets.length]
  palletScanIndex += 1
  return {
    ...result,
    palletCode: generatedCode,
    rfid: generatedCode.startsWith('TP') ? `RFID-ML-${generatedCode.slice(-6)}` : result.rfid
  }
}