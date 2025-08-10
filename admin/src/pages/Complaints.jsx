import { Button, Card, Input, List, message } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Complaints() {
  const [list, setList] = useState([])
  const load = async () => { const r = await api.get('/admin/complaints'); setList(r.data.data.list || []) }
  useEffect(() => { load() }, [])
  const decide = async (id, decision, penaltyPoints = 0) => {
    await api.post(`/admin/complaints/${id}/decide`, { decision, penaltyPoints })
    message.success('已处理')
    load()
  }
  return (
    <Card title="仲裁处理">
      <List dataSource={list} renderItem={(c) => (
        <List.Item actions={[
          <Button onClick={() => decide(c._id, 'refund_and_penalty', 1000)}>退款+扣押金</Button>,
          <Button onClick={() => decide(c._id, 'reject', 0)}>驳回</Button>
        ]}>
          <List.Item.Meta title={`订单: ${c.order}`} description={`原因: ${c.reason}，状态: ${c.status}`} />
        </List.Item>
      )} />
    </Card>
  )
}


