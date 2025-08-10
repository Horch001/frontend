import { Button, Card, List, message, Select } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Withdrawals() {
  const [list, setList] = useState([])
  const load = async () => { const r = await api.get('/admin/withdrawals'); setList(r.data.data.list) }
  useEffect(() => { load() }, [])
  const review = async (id, action) => { await api.post(`/admin/withdrawals/${id}/review`, { action }); message.success('已处理'); load() }
  return (
    <Card title="提现审核">
      <List dataSource={list} renderItem={(item) => (
        <List.Item actions={[
          <Button onClick={() => review(item._id, 'approve')}>通过</Button>,
          <Button onClick={() => review(item._id, 'reject')}>拒绝</Button>,
          <Button onClick={() => review(item._id, 'paid')}>标记已打款</Button>
        ]}>
          <List.Item.Meta title={`用户: ${item.user}`} description={`金额(积分): ${item.amountPoints}，状态: ${item.status}`} />
        </List.Item>
      )} />
    </Card>
  )
}


