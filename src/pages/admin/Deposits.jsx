import { Card, List } from 'antd'
import { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin'

export default function Deposits() {
  const [list, setList] = useState([])
  useEffect(() => { adminApi.get('/admin/deposits').then(r => setList(r.data.data.list)) }, [])
  return (
    <Card title="押金记录">
      <List dataSource={list} renderItem={(item) => (
        <List.Item>
          <List.Item.Meta title={`用户: ${item.user}`} description={`押金(积分): ${item.amountPoints}，状态: ${item.status}`} />
        </List.Item>
      )} />
    </Card>
  )
}


