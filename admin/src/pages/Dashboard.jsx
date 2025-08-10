import { Card, Statistic } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Dashboard() {
  const [data, setData] = useState({ ordersToday: 0, amountPointsToday: 0, feePointsToday: 0 })
  useEffect(() => { api.get('/admin/dashboard').then(r => setData(r.data.data)) }, [])
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
      <Card><Statistic title="今日订单数" value={data.ordersToday} /></Card>
      <Card><Statistic title="今日交易额(积分)" value={data.amountPointsToday} /></Card>
      <Card><Statistic title="今日手续费(积分)" value={data.feePointsToday} /></Card>
    </div>
  )
}


