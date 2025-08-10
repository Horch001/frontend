import { Layout, Menu } from 'antd'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductsAudit from './pages/ProductsAudit'
import PriceModifications from './pages/PriceModifications'
import Withdrawals from './pages/Withdrawals'
import Deposits from './pages/Deposits'
import Complaints from './pages/Complaints'
import Users from './pages/Users'
import Settlements from './pages/Settlements'
import { useState } from 'react'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const login = (t) => { setToken(t); localStorage.setItem('admin_token', t) }
  const logout = () => { setToken(''); localStorage.removeItem('admin_token') }
  return { token, login, logout }
}

function Private({ children }) { return localStorage.getItem('admin_token') ? children : <Navigate to="/login" replace /> }

export default function App() {
  const loc = useLocation()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <Private>
          <Layout style={{ minHeight: '100vh' }}>
            <Layout.Sider theme="light">
              <Menu mode="inline" selectedKeys={[loc.pathname]}>
                <Menu.Item key="/"><Link to="/">仪表盘</Link></Menu.Item>
                <Menu.Item key="/audit"><Link to="/audit">商品审核</Link></Menu.Item>
                <Menu.Item key="/price-modifications"><Link to="/price-modifications">价格修改审核</Link></Menu.Item>
                <Menu.Item key="/withdrawals"><Link to="/withdrawals">提现审核</Link></Menu.Item>
                <Menu.Item key="/deposits"><Link to="/deposits">押金管理</Link></Menu.Item>
                <Menu.Item key="/complaints"><Link to="/complaints">仲裁处理</Link></Menu.Item>
                <Menu.Item key="/users"><Link to="/users">用户管理</Link></Menu.Item>
                <Menu.Item key="/settlements"><Link to="/settlements">结算</Link></Menu.Item>
              </Menu>
            </Layout.Sider>
            <Layout.Content style={{ padding: 24 }}>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="audit" element={<ProductsAudit />} />
                <Route path="price-modifications" element={<PriceModifications />} />
                <Route path="withdrawals" element={<Withdrawals />} />
                <Route path="deposits" element={<Deposits />} />
                <Route path="complaints" element={<Complaints />} />
                <Route path="users" element={<Users />} />
                <Route path="settlements" element={<Settlements />} />
              </Routes>
            </Layout.Content>
          </Layout>
        </Private>
      } />
    </Routes>
  )
}


