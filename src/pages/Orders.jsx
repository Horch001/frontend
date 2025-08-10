import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Orders() {
  const [buy, setBuy] = useState([])
  const [sold, setSold] = useState([])
  const [myProducts, setMyProducts] = useState([])
  const [activeTab, setActiveTab] = useState('buy')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    
    try {
      const [buyRes, soldRes, productsRes] = await Promise.all([
        api.get('/orders/my'),
        api.get('/orders/sold'),
        api.get('/products/my')
      ])
      setBuy(buyRes.data.data.orders)
      setSold(soldRes.data.data.orders)
      setMyProducts(productsRes.data.data.products)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    currentYRef.current = e.touches[0].clientY
    const scrollTop = containerRef.current?.scrollTop || 0
    
    if (scrollTop <= 0 && currentYRef.current > startYRef.current) {
      const pullDistance = currentYRef.current - startYRef.current
      if (pullDistance > 80 && !refreshing) {
        loadOrders(true)
      }
    }
  }

  const handleTouchEnd = () => {
    startYRef.current = 0
    currentYRef.current = 0
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="space-y-4 p-4">
        {refreshing && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-purple-600">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">刷新中...</span>
            </div>
          </div>
        )}
        
        {!refreshing && !loading && (
          <div className="text-center py-2 text-xs text-gray-400">
            下拉刷新
          </div>
        )}
        
        <div className="text-xl font-semibold text-gray-800 mb-4">我的交易</div>
        
        <div className="grid grid-cols-3 bg-gray-100 rounded-xl p-1 mb-6 gap-1">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'buy'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            我购买的<br/>({buy.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'products'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            我的商品<br/>({myProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-3 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === 'sell'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            已售出<br/>({sold.length})
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {activeTab === 'buy' ? (
              buy.length > 0 ? (
                buy.map(o => <OrderItem key={o._id} o={o} type="buy" />)
              ) : (
                <EmptyState type="buy" />
              )
            ) : activeTab === 'products' ? (
              myProducts.length > 0 ? (
                myProducts.map(p => <ProductItem key={p._id} p={p} />)
              ) : (
                <EmptyState type="products" />
              )
            ) : (
              sold.length > 0 ? (
                sold.map(o => <OrderItem key={o._id} o={o} type="sell" />)
              ) : (
                <EmptyState type="sell" />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderItem({ o, type }) {
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

  return (
    <Link to={`/orders/${o._id}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1 line-clamp-2">
            {o.product?.title || '商品已下架'}
          </div>
          {o.product?.subtitle && (
            <div className="text-sm text-gray-500 mb-2">{o.product.subtitle}</div>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(o.status)}`}>
          {getStatusText(o.status)}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>价格: {o.amountPoints}</span>
        </div>
        <span>{new Date(o.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</span>
      </div>
      
      {type === 'sell' && o.buyer && (
        <div className="mt-2 text-xs text-gray-400">
          买家: {o.buyer.username || o.buyer.email}
        </div>
      )}
      {type === 'buy' && o.seller && (
        <div className="mt-2 text-xs text-gray-400">
          卖家: {o.seller.username || o.seller.email}
        </div>
      )}
    </Link>
  )
}

function ProductItem({ p }) {
  const getStatusColor = (status) => {
    if (status === 'active') return 'text-green-600 bg-green-50'
    if (status === 'soft_deactivated') return 'text-orange-600 bg-orange-50'
    if (status === 'pending') return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getStatusText = (status) => {
    if (status === 'active') return '已上架'
    if (status === 'soft_deactivated') return '软下架'
    if (status === 'pending') return '审核中'
    return '已下架'
  }

  const getProductStatus = () => {
    if (!p.isActive) return 'inactive'
    if (p.stock === 0 || p.stock === null || p.stock === undefined) return 'soft_deactivated'
    return 'active'
  }

  return (
    <Link to={`/product/${p._id}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-medium text-gray-900 mb-1 line-clamp-2">
            {p.title}
          </div>
          {p.subtitle && (
            <div className="text-sm text-gray-500 mb-2">{p.subtitle}</div>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getProductStatus())}`}>
          {getStatusText(getProductStatus())}
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>价格: {Math.round(p.pricePoints / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1))} π</span>
          <span>库存: {p.stock || 0}</span>
          <span>已售: {p.soldCount || 0}</span>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>分类: {p.category || '未分类'}</span>
        <span>{new Date(p.createdAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</span>
      </div>
    </Link>
  )
}

function EmptyState({ type }) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">
        {type === 'buy' ? '🛒' : type === 'products' ? '📦' : '💰'}
      </div>
      <div className="text-lg font-medium text-gray-600 mb-2">
        {type === 'buy' ? '暂无购买记录' : type === 'products' ? '暂无商品' : '暂无出售记录'}
      </div>
      <div className="text-sm text-gray-400">
        {type === 'buy' ? '去首页看看有什么好商品吧' : type === 'products' ? '发布商品开始赚钱吧' : '继续努力销售吧'}
      </div>
      {type === 'buy' && (
        <Link 
          to="/" 
          className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          去购物
        </Link>
      )}
      {(type === 'products' || type === 'sell') && (
        <Link 
          to="/sell" 
          className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          发布商品
        </Link>
      )}
    </div>
  )
}


