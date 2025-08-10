import React from 'react'

export default function RichTextRenderer({ content }) {
  if (!content) return null

  // 解析图片标签 [图片]base64[/图片] 或 [图片:id]
  const parseImages = (text) => {
    const parts = []
    let lastIndex = 0
    let match

    // 匹配 [图片]base64[/图片] 格式
    const imageBase64Regex = /\[图片\](.*?)\[\/图片\]/g
    while ((match = imageBase64Regex.exec(text)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        })
      }
      
      // 添加图片
      parts.push({
        type: 'image',
        url: match[1].trim()
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // 匹配 [图片:id] 格式
    const imageIdRegex = /\[图片:([^\]]+)\]/g
    while ((match = imageIdRegex.exec(text)) !== null) {
      // 添加图片前的文本
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        })
      }
      
      // 从localStorage获取图片数据
      const imageId = match[1]
      const imageData = localStorage.getItem(`product_image_${imageId}`)
      parts.push({
        type: 'image',
        url: imageData || ''
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // 添加剩余的文本
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      })
    }
    
    return parts
  }

  // 解析文本格式
  const parseTextFormat = (text) => {
    // 处理换行
    text = text.replace(/\n/g, '<br/>')
    
    return text
  }

  const parts = parseImages(content)

  return (
    <div className="space-y-4">
      {parts.map((part, index) => {
                 if (part.type === 'image') {
           return (
             <div key={index} className="my-4">
               <div className="relative">
                 <img 
                   src={part.url} 
                   alt="商品详情图片" 
                   className="w-full h-auto rounded-lg shadow-md border border-gray-200"
                   onError={(e) => {
                     e.target.style.display = 'none'
                     e.target.nextSibling.style.display = 'block'
                   }}
                 />
                 <div 
                   className="hidden bg-gray-100 text-gray-500 text-center p-4 rounded-lg border border-gray-200"
                   style={{ display: 'none' }}
                 >
                   <div className="text-xl mb-1">🖼️</div>
                   <div className="text-sm">图片加载失败</div>
                 </div>
               </div>
             </div>
           )
                 } else {
           return (
             <div 
               key={index}
               className="text-gray-700 leading-relaxed text-sm"
               dangerouslySetInnerHTML={{ 
                 __html: parseTextFormat(part.content) 
               }}
             />
           )
         }
      })}
    </div>
  )
}
