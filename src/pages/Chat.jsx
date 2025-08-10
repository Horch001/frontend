import { useParams, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ChatWindow from '../components/ChatWindow'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

export default function Chat() {
  const { roomId } = useParams()
  const location = useLocation()
  const { token, user } = useAuth()
  const productInfo = location.state?.productInfo
  const [otherUser, setOtherUser] = useState(null)
  
  // 获取对方用户信息
  useEffect(() => {
    const getOtherUser = async () => {
      try {
        // roomId 就是对方的用户ID
        const res = await api.get(`/users/${roomId}`)
        setOtherUser(res.data.data.user)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
    
    if (roomId && roomId !== user?._id) {
      getOtherUser()
    }
  }, [roomId, user?._id])
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 全局标题 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => window.history.back()} 
            className="text-gray-600 dark:text-gray-300 text-xl"
          >
            ←
          </button>
          <div className="text-center font-extrabold tracking-tight text-yellow-500 text-xl">
            虚拟商品交易市场
          </div>
          <div className="w-6"></div> {/* 占位元素，保持标题居中 */}
        </div>
      </div>
             {/* 头部 */}
       <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
         <div className="flex items-center justify-center">
           <div className="font-medium text-gray-900 dark:text-gray-100">
             {otherUser ? (otherUser.username || otherUser.email) : '加载中...'}
           </div>
         </div>
       </div>
      
             {/* 聊天窗口 - 固定高度，避免输入框被遮挡 */}
       <div className="flex-1 overflow-hidden">
         <ChatWindow 
           roomId={roomId} 
           toUserId={user?.id} 
           token={token} 
           productInfo={productInfo}
         />
       </div>
    </div>
  )
}


