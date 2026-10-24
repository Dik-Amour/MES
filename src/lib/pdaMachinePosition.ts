/**
 * PDA 上机位与产线映射。
 * 后续接入真实扫码接口后，只需替换 scanMachinePosition 的数据来源。
 */

export interface PdaMachinePositionOption {
  label: string
  value: string
  line: string
  code: string
}

export interface PdaMachinePositionResult {
  productionLine: string
  machinePosition: string
  code: string
}

export function getMachinePositionOptions(line: string): PdaMachinePositionOption[] {
  return [1, 2, 3].map((index) => ({
    label: `${line}-上机位${index}`,
    value: `${line}-上机位${index}`,
    line,
    code: `${line}-POS-${String(index).padStart(2, '0')}`
  }))
}

/**
 * 模拟扫码结果：根据当前选择的产线返回第一个上机位。
 * 真实设备扫码时，用扫码得到的 code 查找映射即可。
 */
export function scanMachinePosition(line?: string, defaultLine = '造型三线HWS清理'): PdaMachinePositionResult {
  const productionLine = line || defaultLine
  const position = getMachinePositionOptions(productionLine)[0]
  return {
    productionLine,
    machinePosition: position.value,
    code: position.code
  }
}
