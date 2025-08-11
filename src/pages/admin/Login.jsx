import { Button, Card, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/admin'

export default function Login() {
  const nav = useNavigate()
  const onFinish = async (v) => {
    if (!v.username || !v.password) return
    try {
      const r = await adminApi.post('/auth/admin/login', v)
      localStorage.setItem('admin_token', r.data.data.token)
      message.success('登录成功')
      nav('/admin')
    } catch (e) { message.error('登录失败') }
  }
  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'100vh' }}>
      <Card title="管理后台登录" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="用户名" name="username" rules={[{ required:true }]}>
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required:true }]}>
            <Input.Password placeholder="admin123" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>登录</Button>
        </Form>
      </Card>
    </div>
  )
}


