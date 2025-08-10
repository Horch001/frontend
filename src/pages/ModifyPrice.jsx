import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import Toast from '../components/Toast'

export default function ModifyPrice() {
  const { id } = useParams()
  const navigate = useNavigate()

  const showToast = (message, type = 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error', isVisible: false })
  
  // 表单状态
  const [currentPrice, setCurrentPrice] = useState(0)
  const [newPrice, setNewPrice] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/products/${id}`)
      const product = res.data.data.item
      
      setCurrentPrice(product.pricePoints || 0)
      setNewPrice('')
      setReason('')
    } catch (error) {
      console.error('加载商品失败:', error)
      showToast('加载商品失败', 'error')
      setTimeout(() => {
        navigate('/orders')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newPrice.trim()) {
      showToast('请输入新价格', 'error')
      return
    }

    const newPriceNum = parseFloat(newPrice)
    if (isNaN(newPriceNum) || newPriceNum <= 0) {
      showToast('请输入有效的价格', 'error')
      return
    }

    if (!reason.trim()) {
      showToast('请输入价格修改原因', 'error')
      return
    }

    try {
      setSubmitting(true)
      
      await api.post(`/products/${id}/price-modification`, {
        newPrice: newPriceNum,
        reason: reason.trim()
      })

      showToast('价格修改申请已提交，等待管理员审核！', 'success')
      setTimeout(() => {
        navigate(`/product/${id}`)
      }, 1500)
    } catch (error) {
      console.error('提交价格修改失败:', error)
      const errorMessage = error.response?.data?.message || '提交价格修改失败，请重试'
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const currentPricePi = Math.round(currentPrice / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1))

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">修改商品价格</h1>
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          返回
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">📋 价格修改说明：</div>
          <div>• 价格修改需要管理员审核后才能生效</div>
          <div>• 请提供合理的修改原因</div>
          <div>• 审核通过后新价格将立即生效</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 当前价格 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">当前价格</label>
          <div className="px-4 py-3 bg-gray-100 rounded-xl text-lg font-semibold text-gray-800">
            {currentPricePi} π ({currentPrice} 积分)
          </div>
        </div>

        {/* 新价格 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">新价格 (π) *</label>
                     <input
             type="number"
             min="1"
             value={newPrice}
             onChange={e => setNewPrice(e.target.value)}
             placeholder="请输入新价格..."
             className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
             required
           />
                     {newPrice && !isNaN(parseInt(newPrice)) && (
             <div className="text-sm text-gray-500">
               对应积分: {parseInt(newPrice) * (Number(import.meta.env.VITE_POINTS_PER_PI) || 1)} 积分
             </div>
           )}
        </div>

                 {/* 价格变化 */}
         {newPrice && !isNaN(parseInt(newPrice)) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">价格变化</label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl">
                             {(() => {
                 const newPriceNum = parseInt(newPrice)
                 const change = newPriceNum - currentPricePi
                 const changePercent = (change / currentPricePi) * 100
                 
                 if (change > 0) {
                   return (
                     <div className="text-green-600 font-medium">
                       +{change} π (+{changePercent.toFixed(1)}%)
                     </div>
                   )
                 } else if (change < 0) {
                   return (
                     <div className="text-red-600 font-medium">
                       {change} π ({changePercent.toFixed(1)}%)
                     </div>
                   )
                 } else {
                   return (
                     <div className="text-gray-600 font-medium">
                       价格无变化
                     </div>
                   )
                 }
               })()}
            </div>
          </div>
        )}

        {/* 修改原因 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">修改原因 *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="请详细说明价格修改的原因..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 resize-none"
            required
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/product/${id}`)}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      </form>

      {/* Toast提示 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}
