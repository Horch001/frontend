import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE, api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function ChatWindow({ roomId, toUserId, token, productInfo }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const socketRef = useRef(null)
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get(`/chat/${roomId}`).then(res => setMessages(res.data.data.list))
  }, [roomId])

  useEffect(() => {
    const s = io(API_BASE, { auth: { token } })
    socketRef.current = s
    s.emit('join', roomId)
    s.on('message', (msg) => setMessages(prev => [...prev, msg]))
    return () => s.disconnect()
  }, [roomId, token])

  // 当消息列表更新时自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 进入聊天时标记消息为已读
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await api.post(`/chat/${roomId}/read`)
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
    
    if (roomId) {
      markAsRead()
    }
  }, [roomId])

  const send = () => {
    if (!text.trim() && !selectedFile) return
    
    let content = text.trim()
    if (selectedFile) {
      // 如果有文字和文件，图片在前，文字在后
      content = text.trim() ? `[${selectedFile.type}]${selectedFile.data}\n${text.trim()}` : `[${selectedFile.type}]${selectedFile.data}`
    }
    
    socketRef.current.emit('message', { 
      roomId, 
      to: toUserId, 
      content: content,
      product: productInfo // 包含商品信息
    })
    
    setText('')
    setSelectedFile(null)
    setFilePreview(null)
    
    // 发送消息后自动滚动到底部
    setTimeout(() => scrollToBottom(), 100)
  }

  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const messagesEndRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'video'
      const fileData = e.target.result
      
      // 保存选中的文件和预览
      setSelectedFile({ type: fileType, data: fileData })
      setFilePreview(fileData)
    }
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      reader.readAsDataURL(file)
    }
    
    // 清空文件输入
    event.target.value = ''
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 relative">
             {/* 商品卡片 */}
       {productInfo && (
         <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
           <div className="flex items-start gap-3">
             {productInfo.image && (
                                <img 
                   src={productInfo.image} 
                   alt={productInfo.title} 
                   className="w-14 h-14 object-cover rounded-lg border"
                 />
             )}
             <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-0.5">
                   {productInfo.title}
                 </div>
                 {productInfo.subtitle && (
                   <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
                     {productInfo.subtitle}
                   </div>
                 )}
               <div className="flex items-center justify-between">
                 <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                   {productInfo.price} π
                 </div>
                 <div className="text-xs text-gray-500 dark:text-gray-400">
                   库存: {productInfo.stock || 0} · 已售: {productInfo.soldCount || 0}
                 </div>
               </div>
                                {productInfo.category && (
                   <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                     分类: {productInfo.category}
                   </div>
                 )}
             </div>
           </div>
         </div>
       )}
      
                           <div className="flex-1 overflow-y-auto p-3 pb-32">
        {(() => {
          const groupedMessages = {}
          messages.forEach(m => {
            const date = new Date(m.createdAt).toLocaleDateString()
            if (!groupedMessages[date]) {
              groupedMessages[date] = []
            }
            groupedMessages[date].push(m)
          })
          
          return Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              {/* 日期分隔线 */}
              <div className="flex justify-center my-4">
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                  {date}
                </div>
              </div>
              
              {/* 当天的消息 */}
              <div className="space-y-2">
                                 {dayMessages.map((m) => {
                   const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null')
                   const currentUserId = currentUser?._id || currentUser?.id
                   const isOwnMessage = m.from === currentUserId
                   
                   return (
                     <div key={m._id || Math.random()} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                               <div className={`max-w-xs lg:max-w-md text-sm ${
                          isOwnMessage 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {(() => {
                            const parts = m.content.split('\n')
                            return (
                              <div className="space-y-2">
                                {parts.map((part, index) => {
                                                                     if (part.startsWith('[image]')) {
                                     return (
                                       <img 
                                         key={index}
                                         src={part.replace('[image]', '')} 
                                         alt="图片" 
                                         className="w-[100px] h-[100px] object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                         onClick={() => {
                                           const newWindow = window.open('', '_blank')
                                           newWindow.document.write(`
                                             <html>
                                               <head>
                                                 <title>查看大图</title>
                                                 <style>
                                                   body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                                   img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
                                                 </style>
                                               </head>
                                               <body>
                                                 <img src="${part.replace('[image]', '')}" alt="大图" />
                                               </body>
                                             </html>
                                           `)
                                         }}
                                       />
                                     )
                                                                     } else if (part.startsWith('[video]')) {
                                     return (
                                       <video 
                                         key={index}
                                         src={part.replace('[video]', '')} 
                                         controls 
                                         className="w-[100px] h-[100px] object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                         onClick={() => {
                                           const newWindow = window.open('', '_blank')
                                           newWindow.document.write(`
                                             <html>
                                               <head>
                                                 <title>查看大视频</title>
                                                 <style>
                                                   body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                                   video { max-width: 90vw; max-height: 90vh; object-fit: contain; }
                                                 </style>
                                               </head>
                                               <body>
                                                 <video src="${part.replace('[video]', '')}" controls autoplay />
                                               </body>
                                             </html>
                                           `)
                                         }}
                                       />
                                     )
                                  } else if (part.trim()) {
                                    return (
                                      <div key={index} className="text-right">{part}</div>
                                    )
                                  }
                                  return null
                                })}
                              </div>
                            )
                          })()}
                        </div>
                     </div>
                   )
                 })}
              </div>
            </div>
                     ))
         })()}
         {/* 滚动目标元素 */}
         <div ref={messagesEndRef} />
       </div>
                                                                                   <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* 隐藏的文件输入 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {/* 文件预览区域 */}
                {filePreview && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                    <div className="flex items-center gap-2">
                      {selectedFile?.type === 'image' ? (
                        <img 
                          src={filePreview} 
                          alt="预览" 
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <video 
                          src={filePreview} 
                          className="w-12 h-12 object-cover rounded border"
                        />
                      )}
                      <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                        已选择{selectedFile?.type === 'image' ? '图片' : '视频'}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          setFilePreview(null)
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 输入区域 */}
                <div className="flex gap-2">
                  {/* 文本输入框 */}
                  <input 
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200" 
                    value={text} 
                    onChange={e=>setText(e.target.value)} 
                    placeholder="输入消息" 
                    onKeyPress={(e) => e.key === 'Enter' && send()}
                  />
                  
                  {/* 文件选择按钮 */}
                  <button
                    onClick={triggerFileSelect}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                    title="插入图片或视频"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v8"/>
                      <path d="M8 12h8"/>
                    </svg>
                  </button>
                  
                  {/* 发送按钮 */}
                  <button 
                    onClick={send} 
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                  >
                    发送
                  </button>
                </div>
              </div>
    </div>
  )
}


