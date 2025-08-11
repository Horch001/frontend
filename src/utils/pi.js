import { api } from '../api'

// 检测是否为 Pi 浏览器环境
function isPiBrowser() {
  console.log('🔍 Pi 浏览器检测:', {
    hasWindow: typeof window !== 'undefined',
    hasPi: typeof window !== 'undefined' && window.Pi,
    hasAuthenticate: typeof window !== 'undefined' && window.Pi && window.Pi.authenticate,
    hasCreatePayment: typeof window !== 'undefined' && window.Pi && window.Pi.createPayment,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'no window',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'no window'
  })
  
  return typeof window !== 'undefined' && 
         window.Pi && 
         window.Pi.authenticate &&
         window.Pi.createPayment &&
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
    console.log('🔐 开始 Pi 认证...')
    console.log('🔍 当前Pi SDK状态:', {
      hasPi: !!window.Pi,
      hasAuthenticate: !!window.Pi?.authenticate,
      currentUser: window.Pi?.currentUser
    })
    
    // 根据Pi官方文档，请求payments权限
    const auth = await window.Pi.authenticate(['payments'], onIncompletePaymentFound)
    
    console.log('✅ Pi 认证成功，完整数据结构:', JSON.stringify(auth, null, 2))
    
    // 根据Pi官方文档，auth结构为 { user, accessToken }
    const { user, accessToken } = auth
    
    if (!user || !user.uid) {
      throw new Error('Pi 认证数据中缺少用户信息')
    }
    
    console.log('✅ 获取到用户UID:', user.uid)
    console.log('✅ 获取到accessToken:', accessToken ? 'present' : 'missing')
    
    // 详细记录用户数据结构
    console.log('🔍 用户数据详细分析:', {
      uid: user.uid,
      userKeys: Object.keys(user),
      userValues: user,
      hasAccessToken: !!accessToken
    })
    
    // 构造标准化的认证数据，包含所有可能的用户名字段
    const normalizedAuth = {
      user: {
        uid: user.uid,
        // 包含所有可能的用户名字段
        username: user.username,
        name: user.name,
        displayName: user.displayName,
        // 其他可能的字段
        ...user
      },
      accessToken: accessToken
    }
    
    console.log('✅ 标准化后的认证数据:', {
      uid: normalizedAuth.user.uid,
      username: normalizedAuth.user.username,
      name: normalizedAuth.user.name,
      displayName: normalizedAuth.user.displayName,
      hasAccessToken: !!normalizedAuth.accessToken
    })
    
    return normalizedAuth
  } catch (error) {
    console.error('❌ Pi 认证失败:', error)
    console.error('❌ 错误详情:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
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
    
    // 检查 Pi SDK 是否可用
    if (!window.Pi) {
      throw new Error('Pi SDK 未加载，请刷新页面重试')
    }
    
    // 检查用户是否已认证
    if (!window.Pi.currentUser) {
      throw new Error('用户未认证，请先进行 Pi 认证')
    }
    
    console.log('📤 创建 Pi 支付，参数:', paymentData)
    console.log('👤 当前用户:', window.Pi.currentUser)
    
    // 根据Pi官方文档，简化支付流程
    const payment = await window.Pi.createPayment({
      amount: paymentData.amount,
      memo: paymentData.memo,
      metadata: paymentData.metadata || {}
    })
    
    console.log('✅ Pi 支付创建成功:', payment)
    return payment
  } catch (error) {
    console.error('❌ Pi 支付创建失败，详细错误:', error)
    
    // 提供更具体的错误信息
    let userMessage = '支付创建失败，请重试'
    
    if (error.message?.includes('not authenticated')) {
      userMessage = '请先登录 Pi 账户'
    } else if (error.message?.includes('SDK 未加载')) {
      userMessage = 'Pi SDK 未加载，请刷新页面重试'
    } else if (error.message?.includes('认证失败')) {
      userMessage = 'Pi 认证失败，请确保已登录 Pi 账户'
    } else if (error.message?.includes('callback functions are missing')) {
      userMessage = '支付配置错误，请重试'
    } else if (error.code === 'user_cancelled') {
      userMessage = '用户取消了支付'
    } else if (error.code === 'network_error') {
      userMessage = '网络连接失败，请检查网络'
    }
    
    throw new Error(userMessage)
  }
}

// 完成 Pi 支付
export async function completePiPayment(payment) {
  try {
    if (!payment || !payment.identifier) {
      throw new Error('支付信息无效')
    }
    
    console.log('🔍 开始完成支付:', payment.identifier)
    
    const result = await window.Pi.completePayment(payment)
    console.log('✅ Pi 支付完成:', result)
    
    // 支付完成后调用后端API
    try {
      const response = await api.post('/users/complete-payment', {
        paymentId: payment.identifier,
        txid: result.transaction?.txid,
        amount: payment.amount,
        memo: payment.memo,
        metadata: payment.metadata
      })
      console.log('✅ 后端支付记录成功:', response.data)
    } catch (backendError) {
      console.warn('⚠️ 后端支付记录失败，但不影响支付流程:', backendError)
    }
    
    return result
  } catch (error) {
    console.error('❌ Pi 支付完成失败:', error)
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

  // 生产环境强制使用真实 Pi 登录
  if (shouldUseMock()) {
    throw new Error('请在 Pi 浏览器中打开此页面进行登录')
  }

  // Pi 浏览器环境：使用真实 SDK
  if (isPiBrowser()) {
    console.log('📱 Pi 浏览器环境：使用真实 SDK')
    
    // 使用真实的 Pi 认证
    const auth = await authenticateWithPi()
    
    // 构造 token 格式
    const piToken = `pi:${auth.user.uid}:temp`
    
    console.log('📤 发送Pi认证数据到后端:', {
      piToken,
      authData: auth
    })
    
    // 发送到后端验证
    const res = await api.post('/auth/pi/login', { 
      piToken,
      authData: auth // 包含完整的认证数据
    })
    
    return res.data.data
  } else {
    // 非 Pi 浏览器环境，提示用户
    throw new Error('请在 Pi 浏览器中打开此页面进行登录')
  }
}

// 导出环境检测函数，供其他地方使用
export { isPiBrowser, isDevelopment, shouldUseMock }


