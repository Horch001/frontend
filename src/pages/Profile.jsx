import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { createPiPayment, completePiPayment, isPiBrowser } from '../utils/pi'

const POINTS_PER_PI = Number(import.meta.env.VITE_POINTS_PER_PI) || 1
const SELLER_DEPOSIT_PI = 1000 // 卖家押金要求（π币）

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [me, setMe] = useState(null)
  const [withdrawPi, setWithdrawPi] = useState('')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [rechargePi, setRechargePi] = useState('')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showPiRechargeModal, setShowPiRechargeModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)

  const load = async () => {
    try {
      const u = await api.get('/users/me'); setMe(u.data.data.user)
      // 获取积分明细（包含所有类型的积分变动）
      const w = await api.get('/users/transactions'); 
      setTransactions(w.data.data.list || [])
      setError('')
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      // 如果积分明细接口不存在，回退到提现记录
      try {
        const w = await api.get('/withdrawals/my'); 
        setTransactions(w.data.data.list || [])
      } catch (e2) {
        setTransactions([])
      }
      setError('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const payDeposit = async () => { 
    setLoading(true)
    
    try {
      // 检查是否为 Pi 浏览器环境
      if (isPiBrowser()) {
        console.log('📱 Pi 浏览器环境：使用真实支付缴纳押金')
        
        // 先检查 Pi SDK 状态
        if (!window.Pi) {
          alert('Pi SDK 未加载，请刷新页面重试')
          return
        }
        
        // 检查用户是否已认证，如果没有则重新认证
        if (!window.Pi.currentUser) {
          console.log('⚠️ 用户未认证，重新进行Pi认证...')
          try {
            const auth = await window.Pi.authenticate(['payments'])
            console.log('✅ 用户重新认证成功:', auth)
            
            // 等待Pi SDK更新状态，最多等待5秒
            let attempts = 0
            const maxAttempts = 10
            while (!window.Pi.currentUser && attempts < maxAttempts) {
              console.log(`⏳ 等待Pi SDK状态更新... (${attempts + 1}/${maxAttempts})`)
              await new Promise(resolve => setTimeout(resolve, 500))
              attempts++
            }
            
            // 再次检查认证状态
            if (!window.Pi.currentUser) {
              console.error('❌ Pi SDK状态更新失败，尝试手动设置')
              // 尝试手动设置currentUser
              if (auth && auth.user) {
                window.Pi.currentUser = auth.user
                console.log('✅ 手动设置currentUser成功')
              } else {
                alert('Pi 认证状态异常，请刷新页面重试')
                return
              }
            }
          } catch (authError) {
            console.error('❌ Pi 重新认证失败:', authError)
            alert('Pi 认证失败，请确保已登录 Pi 账户')
            return
          }
        }
        
        console.log('🔍 当前Pi认证状态:', {
          hasCurrentUser: !!window.Pi.currentUser,
          currentUser: window.Pi.currentUser
        })
        
        // 计算需要缴纳的押金数量
        const currentDeposit = me.depositPoints || 0
        const requiredDeposit = SELLER_DEPOSIT_PI * POINTS_PER_PI
        const needDeposit = Math.max(0, requiredDeposit - currentDeposit)
        const needDepositPi = Math.ceil(needDeposit / POINTS_PER_PI)
        
        if (needDepositPi <= 0) {
          alert('押金已足够，无需再缴纳')
          setShowDepositModal(false)
          return
        }
        
        // 1. 创建 Pi 支付
        const payment = await createPiPayment({
          amount: needDepositPi,
          memo: `缴纳卖家押金：${needDepositPi} π`,
          metadata: {
            type: 'deposit',
            amountPi: needDepositPi
          }
        })
        
        console.log('✅ Pi 支付创建成功:', payment)
        
        // 2. 完成支付（用户确认后）
        const result = await completePiPayment(payment)
        console.log('✅ Pi 支付完成:', result)
        
        // 3. 支付成功后调用后端押金接口
        await api.post('/users/deposit/pay', {
          paymentId: payment.identifier,
          paymentData: {
            identifier: payment.identifier,
            amount: payment.amount,
            memo: payment.memo,
            metadata: payment.metadata,
            status: result.status,
            transaction: result.transaction
          }
        })
        
        alert('押金缴纳成功！')
        await load()
        setShowDepositModal(false)
      } else {
        // 非 Pi 浏览器环境，提示用户
        alert('请在 Pi 浏览器中打开此页面进行押金缴纳')
        setShowDepositModal(false)
      }
    } catch (error) {
      console.error('❌ 押金缴纳失败:', error)
      alert(`押金缴纳失败: ${error.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }
  
  const refundDeposit = async () => { 
    setLoading(true); 
    try { 
      await api.post('/users/deposit/refund'); 
      await load(); 
      setShowDepositModal(false)
    } finally { 
      setLoading(false) 
    } 
  }
  
  const requestWithdraw = async () => {
    const pi = Number(withdrawPi)
    if (!pi || pi <= 0 || !withdrawAddress.trim()) return
    const amountPoints = Math.round(pi * POINTS_PER_PI)
    setLoading(true)
    try { 
      await api.post('/withdrawals', { amountPoints, address: withdrawAddress.trim() }); 
      setWithdrawPi(''); 
      setWithdrawAddress('');
      await load(); 
      setShowWithdrawModal(false)
    } finally { 
      setLoading(false) 
    }
  }

  const requestRecharge = async () => {
    const pi = Number(rechargePi)
    if (!pi || pi <= 0) return
    setLoading(true)
    
    try {
      // 检查是否为 Pi 浏览器环境
      if (isPiBrowser()) {
        console.log('📱 Pi 浏览器环境：使用真实支付充值')
        
        // 先检查 Pi SDK 状态
        if (!window.Pi) {
          alert('Pi SDK 未加载，请刷新页面重试')
          return
        }
        
        // 检查用户是否已认证，如果没有则重新认证
        if (!window.Pi.currentUser) {
          console.log('⚠️ 用户未认证，重新进行Pi认证...')
          try {
            const auth = await window.Pi.authenticate(['payments'])
            console.log('✅ 用户重新认证成功:', auth)
            
            // 等待Pi SDK更新状态，最多等待5秒
            let attempts = 0
            const maxAttempts = 10
            while (!window.Pi.currentUser && attempts < maxAttempts) {
              console.log(`⏳ 等待Pi SDK状态更新... (${attempts + 1}/${maxAttempts})`)
              await new Promise(resolve => setTimeout(resolve, 500))
              attempts++
            }
            
            // 再次检查认证状态
            if (!window.Pi.currentUser) {
              console.error('❌ Pi SDK状态更新失败，尝试手动设置')
              // 尝试手动设置currentUser
              if (auth && auth.user) {
                window.Pi.currentUser = auth.user
                console.log('✅ 手动设置currentUser成功')
              } else {
                alert('Pi 认证状态异常，请刷新页面重试')
                return
              }
            }
          } catch (authError) {
            console.error('❌ Pi 重新认证失败:', authError)
            alert('Pi 认证失败，请确保已登录 Pi 账户')
            return
          }
        }
        
        console.log('🔍 当前Pi认证状态:', {
          hasCurrentUser: !!window.Pi.currentUser,
          currentUser: window.Pi.currentUser
        })
        
        try {
          // 1. 创建 Pi 支付
          const payment = await createPiPayment({
            amount: pi,
            memo: `账户充值：${pi} π`,
            metadata: {
              type: 'recharge',
              amountPi: pi
            }
          })
          
          console.log('✅ Pi 支付创建成功:', payment)
          
          // 2. 完成支付（用户确认后）
          const result = await completePiPayment(payment)
          console.log('✅ Pi 支付完成:', result)
          
          // 3. 支付成功后调用后端充值接口
          await api.post('/users/recharge', { 
            amountPi: pi,
            paymentId: payment.identifier,
            paymentData: {
              identifier: payment.identifier,
              amount: payment.amount,
              memo: payment.memo,
              metadata: payment.metadata,
              status: result.status,
              transaction: result.transaction
            }
          })
          
          alert('充值成功！')
          setRechargePi('')
          await load()
          setShowPiRechargeModal(false)
        } catch (piError) {
          console.error('❌ Pi 支付失败:', piError)
          alert(`Pi 支付失败: ${piError.message || '未知错误'}`)
          setShowPiRechargeModal(false)
        }
      } else {
        // 非 Pi 浏览器环境，提示用户
        alert('请在 Pi 浏览器中打开此页面进行充值')
        setShowPiRechargeModal(false)
      }
    } catch (error) {
      console.error('❌ 充值失败:', error)
      alert(`充值失败: ${error.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '审核中'
      case 'paid': return '已打款'
      case 'rejected': return '已拒绝'
      case 'completed': return '已完成'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getTransactionType = (record) => {
    // 根据记录类型和状态判断交易类型
    if (record.type === 'withdrawal') {
      return { type: 'decrease', reason: '提现申请' }
    }
    if (record.type === 'recharge') {
      return { type: 'increase', reason: 'π钱包充值' }
    }
    if (record.type === 'purchase') {
      return { type: 'decrease', reason: '购买商品' }
    }
    if (record.type === 'refund') {
      return { type: 'increase', reason: '订单退款' }
    }
    if (record.type === 'deposit') {
      return { type: 'decrease', reason: '缴纳押金' }
    }
    if (record.type === 'deposit_refund') {
      return { type: 'increase', reason: '押金退还' }
    }
    if (record.type === 'order_income') {
      return { type: 'increase', reason: '商品售出' }
    }
    if (record.type === 'platform_fee') {
      return { type: 'decrease', reason: '平台手续费' }
    }
    if (record.type === 'order_payment') {
      return { type: 'decrease', reason: '购买商品' }
    }
    if (record.type === 'order_refund') {
      return { type: 'increase', reason: '订单退款' }
    }
    if (record.type === 'seller_income') {
      return { type: 'increase', reason: '商品售出' }
    }
    if (record.type === 'buyer_payment') {
      return { type: 'decrease', reason: '购买商品' }
    }
    // 兼容旧的提现记录格式
    if (record.amountPoints && record.status) {
      return { type: 'decrease', reason: '提现申请' }
    }
    // 根据金额正负判断
    if (record.amountPoints > 0) {
      return { type: 'increase', reason: '积分增加' }
    } else if (record.amountPoints < 0) {
      return { type: 'decrease', reason: '积分减少' }
    }
    return { type: 'unknown', reason: '其他' }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-gray-500">加载中...</div>
      </div>
    </div>
  )
  
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-500 text-lg mb-2">⚠️</div>
        <div className="text-red-600">{error}</div>
      </div>
    </div>
  )
  
  if (!me) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center text-gray-500">暂无数据</div>
    </div>
  )
  
  const availablePoints = Math.max(0, (me.balancePoints || 0) - (me.frozenPoints || 0))
  
  return (
    <div className="space-y-6 p-4">
      {/* 用户头像和基本信息卡片 */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="8.5" r="3.5" stroke="white" strokeWidth="1.8"/>
              <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{me.username}</h2>
            <p className="text-purple-100 text-sm capitalize">{me.role === 'seller' ? '卖家' : me.role === 'buyer' ? '买家' : me.role}</p>
          </div>
          <div 
            className="text-right cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => setShowRechargeModal(true)}
          >
            <div className="text-xl font-bold">{me.balancePoints || 0}</div>
            <div className="text-purple-100 text-xs">点击充值/提现</div>
          </div>
        </div>
        
        {/* 退出按钮 */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <button
            onClick={() => {
              if (confirm('确定要退出登录吗？')) {
                localStorage.removeItem('token')
                window.location.href = '/login'
              }
            }}
            className="w-full py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors duration-200"
          >
            🚪 退出登录
          </button>
        </div>
      </div>

      {/* 财务概览卡片 */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          财务概览
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3">
            <div className="text-blue-600 text-xs font-medium">可用余额</div>
            <div className="text-lg font-bold text-blue-800">{availablePoints}</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3">
            <div className="text-orange-600 text-xs font-medium">冻结中</div>
            <div className="text-lg font-bold text-orange-800">{me.frozenPoints || 0}</div>
          </div>
          <div 
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => setShowDepositModal(true)}
          >
            <div className="text-green-600 text-xs font-medium">押金</div>
            <div className="text-lg font-bold text-green-800">{Math.round((me.depositPoints || 0) / (me?.config?.pointsPerPi || 1))}</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3">
            <div className="text-purple-600 text-xs font-medium">评分</div>
            <div className="text-lg font-bold text-purple-800">{(me.rating||0).toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* 积分明细卡片 */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          积分明细
        </h3>
        <div className="space-y-2">
          {transactions.map(w => {
            const transaction = getTransactionType(w)
            return (
                            <div key={w._id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${
                    transaction.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.reason}
                  </div>
                  <div className={`font-medium ${transaction.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'increase' ? '+' : '-'}{Math.abs(w.amount || w.amountPoints || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {formatTime(w.createdAt)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    w.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    w.status === 'paid' ? 'bg-green-100 text-green-700' :
                    w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusText(w.status)}
                  </div>
                </div>
              </div>
            )
          })}
          {transactions.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-sm">暂无积分明细</div>
            </div>
          )}
        </div>
      </div>

      {/* 违规信息卡片 */}
      {me.violations > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
            违规记录
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-red-700 text-sm">
              <span className="font-medium">违规次数：{me.violations}</span>
              <div className="mt-1 text-red-600">请遵守平台规则，避免违规行为。</div>
            </div>
          </div>
        </div>
      )}

      {/* 充值/提现选择模态框 */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">余额操作</h3>
              <button 
                onClick={() => setShowRechargeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center text-gray-600 mb-4">
                当前余额：{me.balancePoints || 0} 积分
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowRechargeModal(false)
                    setShowWithdrawModal(true)
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  💳 申请提现
                </button>
                <button 
                  onClick={() => {
                    setShowRechargeModal(false)
                    setShowPiRechargeModal(true)
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  💰 π钱包充值
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提现申请模态框 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">提现申请</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  value={withdrawPi} 
                  onChange={e=>setWithdrawPi(e.target.value)} 
                  placeholder="输入提现积分数量" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-gray-50"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  积分
                </div>
              </div>
              <div className="relative">
                <input 
                  value={withdrawAddress} 
                  onChange={e=>setWithdrawAddress(e.target.value)} 
                  placeholder="输入π钱包地址" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-gray-50"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  取消
                </button>
                <button 
                  disabled={loading || availablePoints <= 0 || !/^[0-9]+$/.test(withdrawPi) || parseInt(withdrawPi||'0',10) > availablePoints || !withdrawAddress.trim()} 
                  onClick={requestWithdraw} 
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all duration-200 ${
                    (availablePoints > 0 && /^[0-9]+$/.test(withdrawPi) && parseInt(withdrawPi||'0',10) <= availablePoints && withdrawAddress.trim()) 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  💳 申请提现
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-blue-700 text-sm">
                  说明：申请提现通过审核后24小时之内到账。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* π钱包充值模态框 */}
      {showPiRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">π钱包充值</h3>
              <button 
                onClick={() => setShowPiRechargeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  value={rechargePi} 
                  onChange={e=>setRechargePi(e.target.value)} 
                  placeholder="输入充值π币数量" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-gray-50"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  π
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPiRechargeModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  取消
                </button>
                <button 
                  disabled={loading || !/^[0-9]+$/.test(rechargePi) || parseInt(rechargePi||'0',10) <= 0} 
                  onClick={requestRecharge} 
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all duration-200 ${
                    (/^[0-9]+$/.test(rechargePi) && parseInt(rechargePi||'0',10) > 0) 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  💰 确认充值
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-blue-700 text-sm flex items-center">
                  <span className="mr-2">ℹ️</span>
                  说明：充值后积分将立即到账。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 押金操作模态框 */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">押金操作</h3>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center text-gray-600 mb-4">
                当前押金：{Math.round((me.depositPoints || 0) / (me?.config?.pointsPerPi || 1))} π
              </div>
              <div className="space-y-3">
                <button 
                  disabled={loading} 
                  onClick={payDeposit} 
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💰 缴纳押金
                </button>
                <button 
                  disabled={loading} 
                  onClick={refundDeposit} 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🔄 申请退押金
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


