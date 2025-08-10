import { useState, useRef } from 'react'

export default function RichTextEditor({ value, onChange, placeholder }) {
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const compressImage = (file, maxWidth = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (file.size > 3 * 1024 * 1024) {
      alert('图片文件过大，请选择小于3MB的图片')
      return
    }
    
    setIsUploading(true)
    
    try {
      const compressedImage = await compressImage(file)
      insertImage(compressedImage)
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setIsUploading(false)
      // 清空文件输入框，允许重复选择同一文件
      event.target.value = ''
    }
  }

  const insertImage = (imageData) => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = value || ''
    
    // 在光标位置插入图片标记
    const imageTag = `\n[图片]\n`
    const newText = text.substring(0, start) + imageTag + text.substring(end)
    
    // 保存图片数据到localStorage
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(`product_image_${imageId}`, imageData)
    
    // 在文本中插入图片ID
    const finalText = text.substring(0, start) + `\n[图片:${imageId}]\n` + text.substring(end)
    
    onChange(finalText)
    
    // 设置光标位置到图片后面
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + `\n[图片:${imageId}]\n`.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 100)
  }

  return (
    <div className="space-y-3">
      {/* 图片上传按钮 */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              处理中...
            </>
          ) : (
            <>
              <span className="text-lg">📷</span>
              插入图片
            </>
          )}
        </button>
        {isUploading && (
          <span className="text-xs text-gray-500">压缩中...</span>
        )}
      </div>

      {/* 文本编辑器 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 h-40 resize-none"
      />
      
      {/* 使用说明 */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="font-medium text-blue-800 mb-1">💡 使用提示：</div>
        <div>• 点击"插入图片"按钮选择本地图片</div>
        <div>• 图片会自动压缩并插入到光标位置</div>
        <div>• 支持JPG、PNG、GIF格式，文件大小不超过3MB</div>
        <div>• 在编辑器中显示为 [图片:id] 标记，详情页会显示实际图片</div>
      </div>
    </div>
  )
}
