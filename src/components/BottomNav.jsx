import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const loc = useLocation()
  const isActive = (to) => (loc.pathname === to)
  const showHome = loc.pathname !== '/'
  const items = showHome
    ? [
        { key: 'home', text: '返回主页', to: '/' },
        { key: 'orders', text: '我的订单', to: '/orders' },
        { key: 'messages', text: '消息', to: '/messages' },
        { key: 'sell', text: '发布商品', to: '/sell' },
        { key: 'profile', text: '个人中心', to: '/profile' }
      ]
    : [
        { key: 'orders', text: '我的订单', to: '/orders' },
        { key: 'messages', text: '消息', to: '/messages' },
        { key: 'sell', text: '发布商品', to: '/sell' },
        { key: 'profile', text: '个人中心', to: '/profile' }
      ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t-0"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'linear-gradient(180deg, #c4b5fd 0%, #a78bfa 100%)'
      }}
    >
      <div className={`max-w-3xl mx-auto grid ${items.length === 5 ? 'grid-cols-5' : items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'} text-xs`}>
        {items.map(it => {
          const active = isActive(it.to)
          return (
            <Link
              key={it.key}
              to={it.to}
              className={`flex flex-col items-center justify-center ${active ? 'text-white' : 'text-white/70'}`}
              style={{ paddingTop: '8px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
            >
              <TabIcon name={it.key} active={active} />
              <span className="mt-0.5">{it.text}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function TabIcon({ name, active }) {
  const stroke = active ? '#ffffff' : 'rgba(255,255,255,0.7)'
  const size = 22
  if (name === 'orders') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" stroke={stroke} strokeWidth="1.8"/>
        <path d="M8 9h8M8 13h8M8 17h5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
  if (name === 'home') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (name === 'messages') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (name === 'sell') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" stroke={stroke} strokeWidth="1.8"/>
        <path d="M12 7v10M7 12h10" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
  if (name === 'profile') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="8.5" r="3.5" stroke={stroke} strokeWidth="1.8"/>
        <path d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
  return null
}


