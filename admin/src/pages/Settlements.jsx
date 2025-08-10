import { Button, Card, Form, Input } from 'antd'
import { api } from '../api'

export default function Settlements() {
  const onFinish = async (v) => { await api.post(`/admin/orders/${v.orderId}/settle`); alert('已结算') }
  const onRefund = async (v) => { await api.post(`/admin/orders/${v.orderId}/refund`); alert('已退款') }
  return (
    <Card title="订单结算">
      <Form layout="inline" onFinish={onFinish}>
        <Form.Item name="orderId" rules={[{ required:true }]}>
          <Input placeholder="订单ID" />
        </Form.Item>
        <Button type="primary" htmlType="submit">结算</Button>
      </Form>
      <div style={{ height: 16 }} />
      <Card type="inner" title="退款（未结算订单）">
        <Form layout="inline" onFinish={onRefund}>
          <Form.Item name="orderId" rules={[{ required:true }]}>
            <Input placeholder="订单ID" />
          </Form.Item>
          <Button danger htmlType="submit">退款</Button>
        </Form>
      </Card>
    </Card>
  )
}


