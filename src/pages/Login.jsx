import { useNavigate } from 'react-router-dom'
import { loginWithPi, setForceMock, getLoginMode, isDevelopment } from '../utils/pi'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [loginMode, setLoginMode] = useState('')
  const [isDev, setIsDev] = useState(false)

  useEffect(() => {
    setLoginMode(getLoginMode())
    setIsDev(isDevelopment())
  }, [])

  const handle = async () => {
    try {
      console.log('🔐 开始登录流程...')
      
      // 检查Pi SDK状态
      if (typeof window !== 'undefined' && window.Pi) {
        console.log('✅ Pi SDK 已加载')
      } else {
        throw new Error('Pi SDK 未加载，请刷新页面重试')
      }
      
      const { token, user } = await loginWithPi()
      console.log('✅ 登录成功，用户信息:', user)
      
      login(token, user)
      nav('/')
    } catch (error) {
      console.error('❌ 登录失败:', error)
      
      // 提供更详细的错误信息
      let errorMessage = '登录失败，请重试'
      
      if (error.message?.includes('Pi SDK 未加载')) {
        errorMessage = 'Pi SDK 未加载，请刷新页面重试'
      } else if (error.message?.includes('请在 Pi 浏览器中')) {
        errorMessage = '请在 Pi 浏览器中打开此页面进行登录'
      } else if (error.message?.includes('认证失败')) {
        errorMessage = 'Pi 认证失败，请确保已登录 Pi 账户'
      } else if (error.message?.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络后重试'
      } else if (error.message?.includes('操作失败')) {
        errorMessage = '登录操作失败，请重试或刷新页面'
      }
      
      alert(errorMessage)
    }
  }

  const toggleMockMode = () => {
    const currentMode = getLoginMode()
    if (currentMode === 'mock') {
      setForceMock(false)
      setLoginMode('pi-sdk')
    } else {
      setForceMock(true)
      setLoginMode('mock')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="text-lg font-semibold">使用 Pi 登录</div>
      
      {/* 登录模式显示 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">当前登录模式：</div>
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            loginMode === 'mock' 
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              : loginMode === 'pi-sdk'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {loginMode === 'mock' ? '🖥️ 模拟登录' : 
             loginMode === 'pi-sdk' ? '📱 Pi SDK' : 
             '🛡️ 兜底模式'}
          </div>
          {isDev && (
            <button 
              onClick={toggleMockMode}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              切换模式
            </button>
          )}
        </div>
      </div>

      <button onClick={handle} className="w-full py-3 bg-indigo-600 text-white rounded-lg">
        一键登录
      </button>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div>💡 提示：</div>
        <div>• Pi SDK 需在 Pi 浏览器内使用</div>
        <div>• 桌面环境自动启用本地 Mock</div>
        <div>• 开发环境可手动切换登录模式</div>
        <div>• 手机端访问时自动使用真实 SDK</div>
      </div>

      {/* 开发环境提示 */}
      {isDev && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <div className="font-medium mb-1">🛠️ 开发模式</div>
            <div>• 桌面端：默认使用模拟登录</div>
            <div>• 手机端：自动使用真实 Pi SDK</div>
            <div>• 可点击"切换模式"手动控制</div>
            <div>• 或访问 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">?mock=true</code> 强制模拟</div>
          </div>
        </div>
      )}
    </div>
  )
}


