import { Button, Card, List, message } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function ProductsAudit() {
  const [list, setList] = useState([])
  const load = async () => { const r = await api.get('/admin/products/pending'); setList(r.data.data.list) }
  useEffect(() => { load() }, [])
  const approve = async (id) => { await api.post(`/admin/products/${id}/approve`); message.success('已通过'); load() }
  return (
    <Card title="待审核商品">
      <List dataSource={list} renderItem={(item) => (
        <List.Item actions={[<Button type="link" onClick={() => approve(item._id)}>通过</Button>]}> 
          <List.Item.Meta 
            title={item.title} 
            description={
              <div>
                <div>{item.subtitle && `副标题: ${item.subtitle}`}</div>
                <div>价格: {item.pricePoints} 积分</div>
                <div>分类: {item.category}</div>
                <div>发货方式: {item.deliveryMethod}</div>
              </div>
            } 
          />
        </List.Item>
      )} />
    </Card>
  )
}


