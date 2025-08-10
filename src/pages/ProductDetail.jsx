import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { createPiPayment, completePiPayment, isPiBrowser } from '../utils/pi'
import RichTextRenderer from '../components/RichTextRenderer'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'

export default function ProductDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [p, setP] = useState(null)
  const [reviews, setReviews] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error', isVisible: false })
  const { token, user } = useAuth()
  const nav = useNavigate()

  const showToast = (message, type = 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  useEffect(() => { 
    const loadProduct = async () => {
      try {
        // 根据路由判断使用哪个API
        const apiUrl = location.pathname.includes('/detail') ? `/products/${id}/detail` : `/products/${id}`
        const res = await api.get(apiUrl)
        console.log('商品详情数据:', res.data.data.item) // 调试信息
        setP(res.data.data.item)
        setReviews(res.data.data.reviews || [])
      } catch (error) {
        console.error('加载商品失败:', error)
        const errorMessage = error.response?.data?.message || '商品不存在或已下架'
        showToast(errorMessage, 'error')
        // 延迟跳转，让用户看到错误信息
        setTimeout(() => {
          nav('/orders')
        }, 2000)
      }
    }
    loadProduct()
  }, [id, location.pathname, nav, showToast])

  // 使用真实 Pi 支付购买商品
  const buy = async () => {
    if (!token) return nav('/login')
    
    try {
      setLoading(true)
      
      // 计算商品价格（π 币）
      const pricePi = Math.round(p.pricePoints / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1))
      
      console.log('🛒 开始购买商品:', {
        productId: id,
        pricePi,
        pricePoints: p.pricePoints
      })

      // 检查是否为 Pi 浏览器环境
      if (isPiBrowser()) {
        console.log('📱 Pi 浏览器环境：使用真实支付')
        
        // 1. 创建 Pi 支付
        const payment = await createPiPayment({
          amount: pricePi,
          memo: `购买商品：${p.title}`,
          metadata: {
            productId: id,
            productTitle: p.title,
            pricePoints: p.pricePoints
          }
        })
        
        console.log('✅ Pi 支付创建成功:', payment)
        
        // 2. 完成支付（用户确认后）
        const result = await completePiPayment(payment)
        console.log('✅ Pi 支付完成:', result)
        
        // 3. 支付成功后创建订单
        const orderRes = await api.post('/orders', { 
          productId: id,
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
        
        showToast('购买成功！', 'success')
        nav(`/orders/${orderRes.data.data.order._id}`)
        
      } else {
        console.log('🖥️ 非 Pi 浏览器环境：使用模拟支付')
        
        // 非 Pi 浏览器环境，使用模拟支付
        const res = await api.post('/orders', { productId: id })
        showToast('购买成功！', 'success')
        nav(`/orders/${res.data.data.order._id}`)
      }
      
    } catch (error) {
      console.error('❌ 购买失败:', error)
      const errorMessage = error.response?.data?.message || '购买失败，请重试'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const contactSeller = () => {
    if (!token) return nav('/login')
    // 跳转到聊天页面，与卖家建立对话，并传递商品信息
    const productInfo = {
      id: p._id,
      title: p.title,
      subtitle: p.subtitle,
      price: Math.round(p.pricePoints / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1)),
      image: p.images?.[0] || '',
      stock: p.stock || 0,
      soldCount: p.soldCount || 0,
      category: p.category || '',
      sellerId: p.sellerId || p.seller?._id
    }
    nav(`/chat/${p.sellerId || p.seller?._id}`, { 
      state: { productInfo } 
    })
  }

  // 卖家管理功能
  const isOwner = user?._id === p?.seller?._id || user?._id === p?.seller || user?._id === p?.sellerId

  const deactivateProduct = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmDeactivate = async () => {
    try {
      setLoading(true)
      await api.post(`/products/${id}/deactivate`)
      setShowConfirmModal(false)
      
      // 如果当前是公开页面，跳转到带权限的页面
      if (!location.pathname.includes('/detail')) {
        showToast('商品下架成功！', 'success')
        setTimeout(() => {
          nav(`/product/${id}/detail`)
        }, 1000)
      } else {
        // 如果已经是带权限的页面，直接更新本地状态
        setP(prev => ({ ...prev, isActive: false }))
        showToast('商品下架成功！', 'success')
      }
    } catch (error) {
      console.error('下架商品失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '下架商品失败，请重试'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const activateProduct = async () => {
    try {
      setLoading(true)
      await api.post(`/products/${id}/activate`)
      // 直接更新本地状态，不重新加载
      setP(prev => ({ ...prev, isActive: true }))
      showToast('商品上架成功！', 'success')
    } catch (error) {
      console.error('上架商品失败:', error)
      const errorMessage = error.response?.data?.message || error.message || '上架商品失败，请重试'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const editProduct = () => {
    nav(`/edit-product/${id}`)
  }

  const modifyPrice = () => {
    nav(`/modify-price/${id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!p) return null
  
  // 商品已下架提示（仅对公开访问显示）
  if (!p.isActive && !location.pathname.includes('/detail')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">商品已下架</h1>
          <p className="text-gray-600 mb-6">此商品已被卖家下架，暂时无法查看详情</p>
          <div className="space-y-3">
            <Link 
              to="/orders" 
              className="block w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              返回我的订单
            </Link>
            <Link 
              to="/" 
              className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              去首页看看
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  const pi = Math.round(p.pricePoints / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1))
  const allImages = p.images || []
  
  return (
    <div className="space-y-2 px-4 pt-0">
      {/* 已下架提示 */}
      {!p.isActive && location.pathname.includes('/detail') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
          <div className="text-yellow-800 text-sm">
            📦 此商品已下架，您作为购买者仍可查看详情
          </div>
        </div>
      )}
      
      {/* 卖家管理按钮 */}
      {isOwner && (
        <div className="bg-white rounded-xl border border-gray-200 p-2">
          <div className="flex gap-2">
            <button
              onClick={editProduct}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              编辑商品
            </button>
            <button
              onClick={modifyPrice}
              className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
              disabled={loading}
            >
              修改价格
            </button>
            {p.isActive ? (
              <button
                onClick={deactivateProduct}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? '下架中...' : '下架商品'}
              </button>
            ) : (
              <button
                onClick={activateProduct}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                {loading ? '上架中...' : '上架商品'}
              </button>
            )}
          </div>
          {!p.isActive && (
            <div className="mt-2 text-xs text-gray-500">
              商品已下架，其他用户无法看到
            </div>
          )}
        </div>
      )}

      {/* 商品图片轮播 */}
      <div className="space-y-2">
        <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center">
          {allImages[currentImageIndex] && (
            <img src={allImages[currentImageIndex]} alt={p.title} className="max-w-full max-h-full object-contain" />
          )}
        </div>
        {allImages.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {allImages.map((img, index) => (
                              <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 bg-gray-50 flex items-center justify-center ${
                    index === currentImageIndex ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt={`${p.title} ${index + 1}`} className="max-w-full max-h-full object-contain" />
                </button>
            ))}
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{p.title}</h1>
          {p.subtitle && (
            <p className="text-gray-600 text-sm mb-3">{p.subtitle}</p>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="text-red-600 text-2xl font-bold">{pi} π</div>
            {p.deliveryMethod && (
              <div className="text-sm text-gray-600">
                发货方式：{p.deliveryMethod}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div>库存 {p.stock || 0}</div>
            <div>已售 {p.soldCount || 0}</div>
            <div>评分 {(p.rating||0).toFixed(1)}</div>
            <div>分类：{p.category || '未分类'}</div>
          </div>
          
                        {/* 快速购买按钮 */}
              {p.isActive && p.stock > 0 && (
            <div className="flex space-x-3">
              <button 
                onClick={contactSeller}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                💬 联系卖家
              </button>
              <button 
                onClick={buy} 
                disabled={!p.stock || p.stock <= 0}
                className={`flex-1 py-2.5 rounded-xl font-medium shadow-lg transition-all duration-200 ${
                  p.stock && p.stock > 0
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {p.stock && p.stock > 0 ? '🛒 立即购买' : '📦 库存不足'}
              </button>
            </div>
          )}
        </div>


      </div>

      {/* 商品描述 */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">商品详情</h2>
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          {p.description ? (
            <RichTextRenderer content={p.description} />
          ) : (
            <p className="text-gray-500">暂无详细描述</p>
          )}
        </div>
      </div>

      {/* 商品评价 */}
      <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">商品评价</h2>
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r._id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="text-yellow-500 text-sm">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                  </div>
                  <span className="text-sm text-gray-500">{r.userName || '匿名用户'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-gray-700 text-sm leading-relaxed">
                {r.content || '（无文字评价）'}
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <div>暂无评价</div>
            </div>
          )}
        </div>
      </div>

      {/* 确认弹窗 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setShowConfirmModal(false)}
        title="确认下架"
        message="确定要下架这个商品吗？下架后其他用户将无法看到此商品。"
        confirmText="确认下架"
        cancelText="取消"
        loading={loading}
      />

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


