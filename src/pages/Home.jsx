import { useEffect, useState } from 'react'
import { api } from '../api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])

  const fetchList = async () => {
    const res = await api.get('/products', { params: { q } })
    console.log('商品列表数据:', res.data.data.items) // 调试信息
    setItems(res.data.data.items)
  }

  useEffect(() => { fetchList() }, [])

  return (
    <div className="space-y-5">
      <div className="px-1 mb-2">
        <div className="flex gap-2 items-center">
          <input value={q} onChange={e=>setQ(e.target.value)} className="flex-1 h-9 px-3 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm shadow" placeholder="搜索商品" />
          <button onClick={fetchList} aria-label="搜索" className="h-9 w-9 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <section className="space-y-3 px-1 pb-1">
        {items.map(p => <ProductCard key={p._id} p={p} />)}
      </section>
    </div>
  )
}


