const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

const formatCurrency = (amount) => {
  if (amount == null) return '0'
  let num = Number(amount)
  if (Number.isNaN(num)) {
    // try parse string with BigDecimal like "1234.56"
    num = parseFloat(amount.toString())
    if (Number.isNaN(num)) return amount.toString()
  }
  // if integer, show without decimals
  const isInteger = Math.abs(num - Math.round(num)) < 1e-9
  const abs = Math.abs(num)
  const parts = isInteger ? [Math.round(abs).toString(), ''] : abs.toFixed(2).split('.')
  // add thousands separator
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = num < 0 ? '-' : ''
  return sign + parts[0] + (parts[1] ? '.' + parts[1] : '')
}

const DEFAULT_CATEGORIES = ["餐饮","出行","购物","娱乐","日用","医疗","教育","交通","工资","转账","其他"]

module.exports = {
  formatTime
  , formatCurrency
  , DEFAULT_CATEGORIES
}

