import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Messages() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadConversations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/chat/user/conversations')
      setConversations(res.data.data.conversations || [])
    } catch (error) {
      console.error('获取聊天记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }

  const handleConversationClick = async (conversation) => {
    try {
      if (conversation.unreadCount > 0) {
        await api.post(`/chat/${conversation.roomId}/read`)
      }
      navigate(`/chat/${conversation.roomId}`)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">消息中心</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">管理您的所有聊天记录</p>
      </div>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">暂无聊天记录</div>
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              当有买家联系您时，消息会显示在这里
            </div>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.roomId}
              onClick={() => handleConversationClick(conversation)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(conversation.otherUser?.username || '用户').charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {conversation.otherUser?.username || '未知用户'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conversation.lastMessage.content}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
