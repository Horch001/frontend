import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Chat from './pages/Chat'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Sell from './pages/Sell'
import EditProduct from './pages/EditProduct'
import ModifyPrice from './pages/ModifyPrice'
import AdminLayout from './pages/admin/AdminLayout'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/chat/')
  const isAdminPage = location.pathname.startsWith('/admin')
  
  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      {!isChatPage && !isAdminPage && <Header />}
      <main className={`${isChatPage || isAdminPage ? '' : 'pt-4 px-1'} ${isAdminPage ? '' : 'max-w-3xl mx-auto'}`} style={{ paddingBottom: isAdminPage ? '0' : 'calc(env(safe-area-inset-bottom, 0px) + 68px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product/:id/detail" element={<PrivateRoute><ProductDetail /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/chat/:roomId" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/sell" element={<PrivateRoute><Sell /></PrivateRoute>} />
          <Route path="/edit-product/:id" element={<PrivateRoute><EditProduct /></PrivateRoute>} />
          <Route path="/modify-price/:id" element={<PrivateRoute><ModifyPrice /></PrivateRoute>} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="*" element={<div className="p-8">未找到页面 <Link className="text-indigo-600" to="/">返回首页</Link></div>} />
        </Routes>
      </main>
      {!isChatPage && !isAdminPage && <BottomNav />}
    </div>
  )
}


