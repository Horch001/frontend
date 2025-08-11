import { api } from '../api'

// 检测是否为 Pi 浏览器环境
function isPiBrowser() {
  return typeof window !== 'undefined' && 
         window.Pi && 
         window.Pi.authenticate &&
         // 检查是否在 Pi 浏览器中运行
         (window.navigator.userAgent.includes('PiBrowser') || 
          window.location.hostname.includes('minepi.com') ||
          // 移动设备检测
          /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
}

// 检测是否为开发环境
function isDevelopment() {
  return import.meta.env.DEV || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1'
}

// 检测是否强制使用模拟登录
function shouldUseMock() {
  // 1. 检查 URL 参数是否强制使用模拟登录
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('mock') === 'true') {
    console.log('🔧 URL 参数强制使用模拟登录')
    return true
  }

  // 2. 检查 localStorage 是否强制使用模拟登录
  if (localStorage.getItem('forceMock') === 'true') {
    console.log('🔧 localStorage 强制使用模拟登录')
    return true
  }

  // 3. 开发环境下，桌面端强制使用模拟登录
  return isDevelopment() && !isPiBrowser()
}

// 设置强制使用模拟登录
export function setForceMock(force = true) {
  if (force) {
    localStorage.setItem('forceMock', 'true')
    console.log('✅ 已设置强制使用模拟登录')
  } else {
    localStorage.removeItem('forceMock')
    console.log('✅ 已取消强制使用模拟登录')
  }
}

// 获取当前登录模式
export function getLoginMode() {
  if (shouldUseMock()) {
    return 'mock'
  } else if (isPiBrowser()) {
    return 'pi-sdk'
  } else {
    return 'fallback'
  }
}

// 处理 Pi SDK 错误
function handlePiError(error, context) {
  console.error(`❌ Pi ${context} 失败:`, error)
  
  // 根据错误类型提供用户友好的提示
  let userMessage = '操作失败，请重试'
  
  if (error.code === 'user_cancelled') {
    userMessage = '用户取消了操作'
  } else if (error.code === 'network_error') {
    userMessage = '网络连接失败，请检查网络'
  } else if (error.code === 'invalid_payment') {
    userMessage = '支付信息无效，请重试'
  } else if (error.code === 'payment_failed') {
    userMessage = '支付失败，请重试'
  } else if (error.code === 'insufficient_balance') {
    userMessage = '余额不足，请充值后重试'
  } else if (error.message?.includes('not authenticated')) {
    userMessage = '请先登录 Pi 账户'
  }
  
  return {
    error,
    userMessage,
    context
  }
}

// 真实的 Pi 登录
async function authenticateWithPi() {
  try {
    // 根据官方文档，只请求 payments 权限
    const auth = await window.Pi.authenticate(['payments'], onIncompletePaymentFound)
    
    console.log('✅ Pi 认证成功:', auth)
    return auth
  } catch (error) {
    const errorInfo = handlePiError(error, '认证')
    throw new Error(errorInfo.userMessage)
  }
}

// 处理未完成的支付
function onIncompletePaymentFound(payment) {
  console.log('🔍 发现未完成的支付:', payment)
  
  // 询问用户是否要完成未完成的支付
  if (confirm('发现未完成的支付，是否要完成它？')) {
    return window.Pi.completePayment(payment)
  } else {
    console.log('用户选择不完成未完成的支付')
    return null
  }
}

// 创建 Pi 支付
export async function createPiPayment(paymentData) {
  try {
    // 验证支付数据
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('支付金额无效')
    }
    
    if (!paymentData.memo) {
      throw new Error('支付备注不能为空')
    }
    
    // 根据官方文档创建支付
    const payment = await window.Pi.createPayment({
      amount: paymentData.amount,
      memo: paymentData.memo,
      metadata: paymentData.metadata || {}
    })
    
    console.log('✅ Pi 支付创建成功:', payment)
    return payment
  } catch (error) {
    const errorInfo = handlePiError(error, '支付创建')
    throw new Error(errorInfo.userMessage)
  }
}

// 完成 Pi 支付
export async function completePiPayment(payment) {
  try {
    if (!payment || !payment.identifier) {
      throw new Error('支付信息无效')
    }
    
    const result = await window.Pi.completePayment(payment)
    console.log('✅ Pi 支付完成:', result)
    return result
  } catch (error) {
    const errorInfo = handlePiError(error, '支付完成')
    throw new Error(errorInfo.userMessage)
  }
}

// 主要的登录函数
export async function loginWithPi() {
  console.log('🔍 环境检测:', {
    isPiBrowser: isPiBrowser(),
    isDevelopment: isDevelopment(),
    shouldUseMock: shouldUseMock(),
    loginMode: getLoginMode(),
    userAgent: navigator.userAgent
  })

  // 如果应该使用模拟登录（桌面开发环境）
  if (shouldUseMock()) {
    console.log('🖥️ 桌面开发环境：使用模拟登录')
    const mock = `pi:${Date.now()}:guest`
    try {
      console.log('📤 发送登录请求:', {
        url: `${api.defaults.baseURL}/auth/pi/login`,
        data: { piToken: mock }
      })
      const res = await api.post('/auth/pi/login', { piToken: mock })
      console.log('✅ 登录响应:', res.data)
      return res.data.data
    } catch (error) {
      console.error('❌ 模拟登录失败:', error)
      console.error('❌ 错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      })
      throw new Error(`模拟登录失败: ${error.response?.data?.message || error.message}`)
    }
  }

  // Pi 浏览器环境：使用真实 SDK
  try {
    if (isPiBrowser()) {
      console.log('📱 Pi 浏览器环境：使用真实 SDK')
      
      // 使用真实的 Pi 认证
      const auth = await authenticateWithPi()
      
      // 构造 token 格式
      const piToken = `pi:${auth.user.uid}:${auth.user.username || 'piuser'}`
      
      // 发送到后端验证
      try {
        const res = await api.post('/auth/pi/login', { 
          piToken,
          authData: auth // 包含完整的认证数据
        })
        
        return res.data.data
      } catch (error) {
        console.error('❌ 后端验证失败:', error)
        throw new Error(`后端验证失败: ${error.response?.data?.message || error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Pi SDK 登录失败:', error)
    // 如果真实 SDK 失败，回退到模拟登录
    console.log('🔄 回退到模拟登录')
  }

  // 兜底：使用模拟登录
  console.log('🛡️ 兜底方案：使用模拟登录')
  const mock = `pi:${Date.now()}:guest`
  try {
    const res = await api.post('/auth/pi/login', { piToken: mock })
    return res.data.data
  } catch (error) {
    console.error('❌ 兜底登录失败:', error)
    throw new Error(`兜底登录失败: ${error.response?.data?.message || error.message}`)
  }
}

// 导出环境检测函数，供其他地方使用
export { isPiBrowser, isDevelopment, shouldUseMock }


