import { Button, Card, List, message, Modal, Input, Space } from 'antd'
import { useEffect, useState } from 'react'
import { api } from '../api'

const { TextArea } = Input

export default function PriceModifications() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentModification, setCurrentModification] = useState(null)
  const [reviewNote, setReviewNote] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const r = await api.get('/admin/price-modifications/pending')
      setList(r.data.data.modifications)
    } catch (error) {
      console.error('加载价格修改申请失败:', error)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleReview = (modification, approved) => {
    setCurrentModification(modification)
    setReviewNote('')
    setReviewModalVisible(true)
  }

  const submitReview = async () => {
    if (!currentModification) return

    try {
      await api.post(`/admin/price-modifications/${currentModification._id}/review`, {
        approved: true,
        note: reviewNote
      })
      message.success('审核完成')
      setReviewModalVisible(false)
      setCurrentModification(null)
      setReviewNote('')
      load()
    } catch (error) {
      console.error('审核失败:', error)
      message.error('审核失败')
    }
  }

  const rejectModification = async () => {
    if (!currentModification) return

    try {
      await api.post(`/admin/price-modifications/${currentModification._id}/review`, {
        approved: false,
        note: reviewNote
      })
      message.success('已拒绝')
      setReviewModalVisible(false)
      setCurrentModification(null)
      setReviewNote('')
      load()
    } catch (error) {
      console.error('拒绝失败:', error)
      message.error('操作失败')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-blue-600'
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      <Card title="价格修改申请审核">
        <List
          loading={loading}
          dataSource={list}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handleReview(item, true)}
                >
                  通过
                </Button>,
                <Button 
                  danger 
                  size="small"
                  onClick={() => handleReview(item, false)}
                >
                  拒绝
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div className="flex items-center gap-2">
                    <span>{item.product?.title || '商品已删除'}</span>
                    <span className={`text-sm ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <div>卖家: {item.seller?.username || item.seller?.email || '-'}</div>
                    <div className="flex items-center gap-4">
                      <span>原价格: {item.oldPrice} 积分</span>
                      <span>新价格: {item.newPrice} 积分</span>
                      <span className="text-sm text-gray-500">
                        {item.newPrice > item.oldPrice ? '+' : ''}
                        {item.newPrice - item.oldPrice} 积分
                        ({((item.newPrice - item.oldPrice) / item.oldPrice * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div>修改原因: {item.reason}</div>
                    <div className="text-xs text-gray-500">
                      申请时间: {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="审核价格修改申请"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
            取消
          </Button>,
          <Button key="reject" danger onClick={rejectModification}>
            拒绝
          </Button>,
          <Button key="approve" type="primary" onClick={submitReview}>
            通过
          </Button>
        ]}
      >
        {currentModification && (
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">申请详情:</div>
              <div className="text-sm space-y-1">
                <div>商品: {currentModification.product?.title || '商品已删除'}</div>
                <div>卖家: {currentModification.seller?.username || currentModification.seller?.email || '-'}</div>
                <div>价格变化: {currentModification.oldPrice} → {currentModification.newPrice} 积分</div>
                <div>修改原因: {currentModification.reason}</div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">审核备注 (可选):</div>
              <TextArea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="请输入审核备注..."
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
