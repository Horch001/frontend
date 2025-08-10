import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { token, user, logout } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const showBack = loc.pathname !== '/'
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200/70 dark:border-gray-800/70">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
        {showBack && (
          <button onClick={() => nav(-1)} className="mr-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">←</button>
        )}
        <div className="flex-1 text-center font-extrabold tracking-tight text-yellow-500 text-2xl">虚拟商品交易市场</div>
        <div className="w-8" />
      </div>
    </header>
  )
}


