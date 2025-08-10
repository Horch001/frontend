import { useState, useRef } from 'react'
import { api } from '../api'
import RichTextEditor from '../components/RichTextEditor'
import Toast from '../components/Toast'

const POINTS_PER_PI = Number(import.meta.env.VITE_POINTS_PER_PI) || 1

export default function Sell() {
  const [title, setTitle] = useState('示例商品 ' + Math.floor(Math.random()*1000))
  const [subtitle, setSubtitle] = useState('')
  const [pricePi, setPricePi] = useState('1')
  const [stock, setStock] = useState('1')
  const [category, setCategory] = useState('账号')
  const [image, setImage] = useState('')
  const [subImages, setSubImages] = useState([])
  const [description, setDescription] = useState('这是一段商品描述')
  const [deliveryMethod, setDeliveryMethod] = useState('网盘发货')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error', isVisible: false })
  const fileInputRef = useRef(null)
  const subImagesInputRef = useRef(null)

  const showToast = (message, type = 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // 检查文件大小
      if (file.size > 5 * 1024 * 1024) { // 5MB
        showToast('图片文件过大，请选择小于5MB的图片', 'error')
        return
      }
      
      try {
        const compressedImage = await compressImage(file)
        setImage(compressedImage)
      } catch (error) {
        console.error('图片压缩失败:', error)
        // 如果压缩失败，使用原图
        const reader = new FileReader()
        reader.onload = (e) => {
          setImage(e.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSubImagesUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      // 限制最多5张副图
      const newFiles = files.slice(0, 5 - subImages.length)
      
      for (const file of newFiles) {
        // 检查文件大小
        if (file.size > 5 * 1024 * 1024) { // 5MB
          showToast(`图片 ${file.name} 过大，请选择小于5MB的图片`, 'error')
          continue
        }
        
        try {
          const compressedImage = await compressImage(file)
          setSubImages(prev => [...prev, compressedImage])
        } catch (error) {
          console.error('图片压缩失败:', error)
          // 如果压缩失败，使用原图
          const reader = new FileReader()
          reader.onload = (e) => {
            setSubImages(prev => [...prev, e.target.result])
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  const removeSubImage = (index) => {
    setSubImages(prev => prev.filter((_, i) => i !== index))
  }

  const submit = async () => {
    setLoading(true); setMsg('')
    try {
      const pricePoints = (parseInt(pricePi || '0', 10)) * POINTS_PER_PI
      const allImages = image ? [image, ...subImages] : subImages
      
      // 获取完整的描述文本（包含图片数据）
      let fullDescription = description
      if (description) {
        const imageRegex = /\[图片:([^\]]+)\]/g
        let match
        while ((match = imageRegex.exec(description)) !== null) {
          const imageId = match[1]
          // 从localStorage获取图片数据
          const imageData = localStorage.getItem(`product_image_${imageId}`)
          if (imageData) {
            fullDescription = fullDescription.replace(match[0], `\n[图片]${imageData}[/图片]\n`)
          }
        }
      }
      
      const productData = { 
        title, 
        subtitle,
        description: fullDescription, 
        pricePoints, 
        stock: parseInt(stock || '1', 10),
        images: allImages, 
        category,
        deliveryMethod
      }
      
      console.log('提交的商品数据:', productData) // 调试信息
      
      const res = await api.post('/products', productData)
      console.log('服务器响应:', res.data) // 调试信息
      showToast(`提交成功，商品ID：${res.data.data.item._id}（需管理员审核后上架）`, 'success')
      setMsg(`提交成功，商品ID：${res.data.data.item._id}（需管理员审核后上架）`)
    } catch (e) {
      console.error('提交失败:', e) // 调试信息
      const errorMessage = e?.response?.data?.message || '提交失败，可能需要先缴纳押金（前往"我的"页）'
      showToast(errorMessage, 'error')
      setMsg(errorMessage)
    } finally { setLoading(false) }
  }

    return (
    <div className="space-y-6 p-2">
      <div className="text-xl font-semibold text-gray-800 px-2">发布商品</div>
      <div className="bg-purple-100 rounded-2xl p-6 shadow-lg border border-purple-300 mx-auto" style={{ width: '95%' }}>
        
                {/* 商品标题 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品标题 *</label>
          <input 
            value={title} 
            onChange={e=>setTitle(e.target.value)} 
            placeholder="请输入商品标题，如：iPhone 15 Pro Max 256GB" 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200" 
          />
        </div>

        {/* 商品副标题 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品副标题 *</label>
          <input 
            value={subtitle} 
            onChange={e=>setSubtitle(e.target.value)} 
            placeholder="请输入商品副标题，如：全新未拆封，支持验货" 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200" 
          />
          <div className="text-xs text-gray-500">
            副标题将显示在主页商品标题下方，用于简要介绍商品特点
          </div>
        </div>

        {/* 商品描述 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品描述 *</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="请详细描述商品的特点、规格、使用说明等信息..."
          />
        </div>

                      {/* 商品分类 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品分类 *</label>
          <select 
            value={category} 
            onChange={e=>setCategory(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          >
            <option value="账号">账号</option>
            <option value="视频">视频</option>
            <option value="音频">音频</option>
            <option value="图片">图片</option>
            <option value="文档">文档</option>
            <option value="网址">网址</option>
            <option value="远程服务">远程服务</option>
            <option value="线上交流">线上交流</option>
          </select>
          <div className="text-xs text-gray-500">
            选择商品所属分类，便于买家查找
          </div>
        </div>

        {/* 发货方式 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">发货方式 *</label>
          <select 
            value={deliveryMethod} 
            onChange={e=>setDeliveryMethod(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          >
            <option value="网盘发货">网盘发货</option>
            <option value="邮箱发货">邮箱发货</option>
            <option value="图片发货">图片发货</option>
            <option value="链接发货">链接发货</option>
            <option value="QQ发货">QQ发货</option>
            <option value="微信发货">微信发货</option>
            <option value="其他方式">其他方式</option>
          </select>
          <div className="text-xs text-gray-500">
            选择商品发货方式，买家购买后将按此方式发货
          </div>
        </div>

              {/* 商品售价 */}
        <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-gray-700">商品售价 *</label>
        <div className="relative">
          <input 
            value={pricePi} 
            onChange={e=>setPricePi(e.target.value.replace(/[^0-9]/g,''))} 
            placeholder="请输入售价，如：100" 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 pr-16" 
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            π币
          </div>
        </div>
        <div className="text-xs text-gray-500">
          当前售价：{pricePi || 0} π币 = {parseInt(pricePi || '0', 10) * POINTS_PER_PI} 积分
        </div>
      </div>

      {/* 商品库存 */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-gray-700">商品库存 *</label>
        <div className="relative">
          <input 
            value={stock} 
            onChange={e=>setStock(e.target.value.replace(/[^0-9]/g,''))} 
            placeholder="请输入库存数量，如：10" 
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 pr-16" 
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            件
          </div>
        </div>
        <div className="text-xs text-gray-500">
          库存为0时商品将自动下架，可通过修改库存来控制商品状态
        </div>
      </div>

                      {/* 商品主图 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品主图 *</label>
          <div className="space-y-3">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 transition-all duration-200 text-gray-500 hover:text-purple-600"
            >
              {image ? '更换主图' : '点击上传商品主图'}
            </button>
            {image && (
              <div className="relative">
                <img src={image} alt="商品主图" className="w-full h-32 object-cover rounded-xl" />
                <button 
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            主图将显示在主页商品列表中，建议尺寸 800x600 像素以上，文件大小不超过5MB
          </div>
        </div>

        {/* 商品副图 */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-gray-700">商品副图</label>
          <div className="space-y-3">
            <input 
              ref={subImagesInputRef}
              type="file" 
              accept="image/*"
              multiple
              onChange={handleSubImagesUpload}
              className="hidden"
            />
            <button 
              onClick={() => subImagesInputRef.current?.click()}
              disabled={subImages.length >= 5}
              className={`w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all duration-200 ${
                subImages.length >= 5 
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600'
              }`}
            >
              {subImages.length >= 5 ? '最多5张副图' : '点击上传商品副图（最多5张）'}
            </button>
            {subImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {subImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt={`副图${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                    <button 
                      onClick={() => removeSubImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            副图将在商品详情页展示，帮助买家更好地了解商品，每张图片不超过5MB
          </div>
        </div>

      {/* 提交按钮 */}
      <button 
        disabled={loading || !title.trim() || !subtitle.trim() || !pricePi || !stock || !category || !deliveryMethod || !description.trim() || !image} 
        onClick={submit} 
        className={`w-full py-4 rounded-xl font-medium transition-all duration-200 ${
          (title.trim() && subtitle.trim() && pricePi && stock && category && deliveryMethod && description.trim() && image) 
            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? '提交中...' : '提交审核'}
      </button>

      {/* 消息提示 */}
      {msg && (
        <div className={`text-sm p-3 rounded-xl ${
          msg.includes('成功') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg}
        </div>
      )}

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <div className="text-blue-700 text-sm">
          <div className="font-medium mb-1">💡 发布提示：</div>
          <div>• 首次发布商品需要缴纳押金，请前往"个人中心"缴纳</div>
          <div>• 商品提交后需要管理员审核，审核通过后自动上架</div>
          <div>• 请确保商品信息真实准确，虚假信息将被下架</div>
        </div>
      </div>
      </div>

      {/* Toast提示 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}


