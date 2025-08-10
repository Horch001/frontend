import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import ChatWindow from '../components/ChatWindow'

export default function OrderDetail() {
  const { id } = useParams()
  const [o, setO] = useState(null)
  const [loading, setLoading] = useState(false)
  const { token, user } = useAuth()

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/orders/${id}`)
      setO(res.data.data.order)
    } catch (error) {
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => { load() }, [id])

  const ship = async () => { 
    try {
      await api.post(`/orders/${id}/ship`)
      load()
    } catch (error) {
      console.error('发货失败:', error)
    }
  }
  
  const confirm = async () => { 
    try {
      await api.post(`/orders/${id}/confirm`)
      load()
    } catch (error) {
      console.error('确认收货失败:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'text-blue-600 bg-blue-50'
      case 'shipped': return 'text-purple-600 bg-purple-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'refunded': return 'text-orange-600 bg-orange-50'
      case 'canceled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return '已付款'
      case 'shipped': return '已发货'
      case 'completed': return '已完成'
      case 'refunded': return '已退款'
      case 'canceled': return '已取消'
      default: return status
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!o) return null

  const roomId = `order:${o._id}`
  const toUserId = user?.id === o.seller?._id ? o.buyer?._id : o.seller?._id
  const isBuyer = user?.id === o.buyer?._id
  const isSeller = user?.id === o.seller?._id

  return (
    <div className="space-y-4">
      {/* 订单状态卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">订单详情</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(o.status)}`}>
            {getStatusText(o.status)}
          </div>
        </div>
        
        {/* 商品信息 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-900">{o.product?.title || '商品已下架'}</div>
            {o.product && (
              <Link 
                to={`/product/${o.product._id}/detail`}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                查看商品详情 →
              </Link>
            )}
          </div>
          {o.product?.subtitle && (
            <div className="text-sm text-gray-600 mb-2">{o.product.subtitle}</div>
          )}
          <div className="text-sm text-gray-500">
            分类: {o.product?.category || '未分类'}
          </div>
        </div>

        {/* 订单信息 */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">订单编号:</span>
            <span className="text-gray-900 font-mono">{o._id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">下单时间:</span>
            <span className="text-gray-900">{formatDate(o.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">商品价格:</span>
            <span className="text-gray-900">{o.amountPoints} 积分</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">手续费:</span>
            <span className="text-gray-900">{o.feePoints} 积分</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">托管金额:</span>
            <span className="text-gray-900">{o.escrowPoints} 积分</span>
          </div>
          {o.shippedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">发货时间:</span>
              <span className="text-gray-900">{formatDate(o.shippedAt)}</span>
            </div>
          )}
          {o.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">完成时间:</span>
              <span className="text-gray-900">{formatDate(o.completedAt)}</span>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm">
            {isSeller ? (
              <div>
                <div className="text-gray-600 mb-1">买家信息</div>
                <div className="text-gray-900">{o.buyer?.username || o.buyer?.email || '-'}</div>
              </div>
            ) : isBuyer ? (
              <div>
                <div className="text-gray-600 mb-1">卖家信息</div>
                <div className="text-gray-900">{o.seller?.username || o.seller?.email || '-'}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            {isSeller && o.status === 'paid' && (
              <button 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={ship}
              >
                我已发货
              </button>
            )}
            {isBuyer && o.status === 'shipped' && (
              <button 
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={confirm}
              >
                确认收货
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 聊天窗口 */}
      <ChatWindow roomId={roomId} toUserId={toUserId} token={token} />
    </div>
  )
}


