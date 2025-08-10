import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import RichTextEditor from '../components/RichTextEditor'
import Toast from '../components/Toast'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const showToast = (message, type = 'error') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'error', isVisible: false })
  
  // 表单状态
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('网盘发货')
  const [stock, setStock] = useState('1')
  const [image, setImage] = useState('')
  const [subImages, setSubImages] = useState([])

  useEffect(() => {
    loadProduct()
  }, [id])

  const loadProduct = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/products/${id}`)
      const product = res.data.data.item
      
      setTitle(product.title || '')
      setSubtitle(product.subtitle || '')
      setDescription(product.description || '')
      setCategory(product.category || '')
      setDeliveryMethod(product.deliveryMethod || '网盘发货')
      setStock(String(product.stock || '1'))
      setImage(product.images?.[0] || '')
      setSubImages(product.images?.slice(1) || [])
    } catch (error) {
      console.error('加载商品失败:', error)
      showToast('加载商品失败', 'error')
      setTimeout(() => {
        navigate('/orders')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      showToast('请输入商品标题', 'error')
      return
    }

    try {
      setSubmitting(true)
      
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

      const allImages = image ? [image, ...subImages] : subImages
      
      await api.put(`/products/${id}`, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: fullDescription,
        category: category.trim(),
        deliveryMethod,
        stock: parseInt(stock || '1', 10),
        images: allImages
      })

      showToast('商品更新成功！', 'success')
      setTimeout(() => {
        navigate(`/product/${id}`)
      }, 1500)
    } catch (error) {
      console.error('更新商品失败:', error)
      const errorMessage = error.response?.data?.message || '更新商品失败，请重试'
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageUpload = (e, isMain = false) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      showToast('图片大小不能超过3MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (isMain) {
        setImage(e.target.result)
      } else {
        setSubImages(prev => [...prev, e.target.result])
      }
    }
    reader.readAsDataURL(file)
  }

  const removeSubImage = (index) => {
    setSubImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">编辑商品</h1>
        <button
          onClick={() => navigate(`/product/${id}`)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          返回
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 商品标题 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">商品标题 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="请输入商品标题..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
            required
          />
        </div>

        {/* 商品副标题 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">商品副标题</label>
          <input
            type="text"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="请输入商品副标题..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          />
        </div>

        {/* 商品分类 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">商品分类</label>
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="请输入商品分类..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          />
        </div>

        {/* 发货方式 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">发货方式</label>
          <select
            value={deliveryMethod}
            onChange={e => setDeliveryMethod(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          >
            <option value="网盘发货">网盘发货</option>
            <option value="邮箱发货">邮箱发货</option>
            <option value="QQ发货">QQ发货</option>
            <option value="微信发货">微信发货</option>
            <option value="其他方式">其他方式</option>
          </select>
        </div>

        {/* 库存数量 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">库存数量</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={e => setStock(e.target.value.replace(/[^0-9]/g,''))}
            placeholder="请输入库存数量"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
          />
          <div className="text-xs text-gray-500">
            库存为0时商品将自动下架，可通过修改库存来控制商品状态
          </div>
        </div>

        {/* 主图上传 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">主图</label>
          <div className="space-y-3">
            {image && (
              <div className="relative">
                <img src={image} alt="主图" className="w-32 h-32 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={e => handleImageUpload(e, true)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
            />
          </div>
        </div>

        {/* 副图上传 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">副图</label>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {subImages.map((img, index) => (
                <div key={index} className="relative">
                  <img src={img} alt={`副图${index + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => removeSubImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
            />
          </div>
        </div>

        {/* 商品描述 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">商品描述</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="请详细描述商品的特点、规格、使用说明等信息..."
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/product/${id}`)}
            className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>

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
