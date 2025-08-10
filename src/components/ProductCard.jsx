import { Link } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api'

export default function ProductCard({ p }) {
  const pi = Math.round(p.pricePoints / (Number(import.meta.env.VITE_POINTS_PER_PI) || 1))
  const [favoritesCount, setFavoritesCount] = useState(p.favoritesCount || 0)
  const [favorited, setFavorited] = useState(false)
  
  // 调试信息
  console.log('商品卡片数据:', p)

  const toggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const r = await api.post(`/products/${p._id}/favorite`)
      setFavoritesCount(r.data.data.favoritesCount)
      setFavorited(r.data.data.action === 'favorite')
    } catch (_) {}
  }
  return (
    <Link to={`/product/${p._id}`} className="group relative block w-full overflow-hidden rounded-2xl border border-transparent shadow-soft hover:shadow-lg transition-transform bg-white dark:bg-gray-800">
      <button onClick={toggleFavorite} aria-label="收藏" className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow">
        {favorited ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" fill="none"/>
          </svg>
        )}
      </button>
      <div className="flex items-center gap-3 p-2 pr-3 h-20">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white dark:bg-gray-700 flex-shrink-0">
          {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-sm leading-tight">
            <div className="font-semibold group-hover:text-brand-600 truncate">{p.title}</div>
            {p.subtitle && (
              <div className="text-gray-600 dark:text-gray-300 truncate text-xs mt-1">{p.subtitle}</div>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">已售 {p.soldCount || 0} · 收藏 {favoritesCount} · 评分 {(p.rating || 0).toFixed(1)}</div>
        </div>
        <div className="text-red-500 font-extrabold ml-2 whitespace-nowrap self-end">{pi} π</div>
      </div>
    </Link>
  )
}


