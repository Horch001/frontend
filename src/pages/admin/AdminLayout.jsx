import { Layout, Menu } from 'antd'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Login from './Login'
import Dashboard from './Dashboard'
import ProductsAudit from './ProductsAudit'
import PriceModifications from './PriceModifications'
import Withdrawals from './Withdrawals'
import Deposits from './Deposits'
import Complaints from './Complaints'
import Users from './Users'
import Settlements from './Settlements'
import { useState } from 'react'

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const login = (t) => { setToken(t); localStorage.setItem('admin_token', t) }
  const logout = () => { setToken(''); localStorage.removeItem('admin_token') }
  return { token, login, logout }
}

function Private({ children }) { 
  return localStorage.getItem('admin_token') ? children : <Navigate to="/admin/login" replace /> 
}

export default function AdminLayout() {
  const loc = useLocation()
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <Private>
          <Layout style={{ minHeight: '100vh' }}>
            <Layout.Sider theme="light">
              <Menu mode="inline" selectedKeys={[loc.pathname]}>
                <Menu.Item key="/admin"><Link to="/admin">仪表盘</Link></Menu.Item>
                <Menu.Item key="/admin/audit"><Link to="/admin/audit">商品审核</Link></Menu.Item>
                <Menu.Item key="/admin/price-modifications"><Link to="/admin/price-modifications">价格修改审核</Link></Menu.Item>
                <Menu.Item key="/admin/withdrawals"><Link to="/admin/withdrawals">提现审核</Link></Menu.Item>
                <Menu.Item key="/admin/deposits"><Link to="/admin/deposits">押金管理</Link></Menu.Item>
                <Menu.Item key="/admin/complaints"><Link to="/admin/complaints">仲裁处理</Link></Menu.Item>
                <Menu.Item key="/admin/users"><Link to="/admin/users">用户管理</Link></Menu.Item>
                <Menu.Item key="/admin/settlements"><Link to="/admin/settlements">结算</Link></Menu.Item>
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
