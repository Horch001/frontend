import { useState, useEffect } from 'react'

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [debugInfo, setDebugInfo] = useState({
    piSDK: 'unknown',
    currentUser: 'unknown',
    errors: [],
    logs: []
  })
  
  // 清除日志的函数
  const clearLogs = () => {
    setDebugInfo(prev => ({
      ...prev,
      errors: [],
      logs: []
    }))
  }

  useEffect(() => {
    // 检查Pi SDK状态
    const checkPiSDK = () => {
      const info = {
        piSDK: typeof window !== 'undefined' && window.Pi ? 'loaded' : 'not loaded',
        currentUser: typeof window !== 'undefined' && window.Pi && window.Pi.currentUser ? 'authenticated' : 'not authenticated',
        errors: debugInfo.errors,
        logs: debugInfo.logs
      }
      setDebugInfo(info)
    }

    // 监听Pi SDK状态变化
    const interval = setInterval(checkPiSDK, 1000)
    
    // 重写console.error来捕获错误
    const originalError = console.error
    console.error = (...args) => {
      originalError.apply(console, args)
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, { time: new Date().toLocaleTimeString(), message: args.join(' ') }]
      }))
    }

    // 重写console.log来捕获日志
    const originalLog = console.log
    console.log = (...args) => {
      originalLog.apply(console, args)
      if (args[0]?.includes('Pi') || args[0]?.includes('🔧') || args[0]?.includes('✅') || args[0]?.includes('❌') || args[0]?.includes('🔐')) {
        setDebugInfo(prev => ({
          ...prev,
          logs: [...prev.logs, { time: new Date().toLocaleTimeString(), message: args.join(' ') }]
        }))
      }
    }

    checkPiSDK()

    return () => {
      clearInterval(interval)
      console.error = originalError
      console.log = originalLog
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
        style={{ fontSize: '12px' }}
      >
        🐛
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm max-h-96 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold">调试面板</span>
        <div className="flex space-x-2">
          <button
            onClick={clearLogs}
            className="text-gray-400 hover:text-white text-xs"
            title="清除日志"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="space-y-3 text-xs overflow-y-auto max-h-80">
        <div>
          <span className="text-gray-400">Pi SDK:</span>
          <span className={`ml-1 ${debugInfo.piSDK === 'loaded' ? 'text-green-400' : 'text-red-400'}`}>
            {debugInfo.piSDK}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">用户状态:</span>
          <span className={`ml-1 ${debugInfo.currentUser === 'authenticated' ? 'text-green-400' : 'text-yellow-400'}`}>
            {debugInfo.currentUser}
          </span>
        </div>
        
        {debugInfo.errors.length > 0 && (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">错误 ({debugInfo.errors.length}):</span>
            </div>
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto bg-red-900/20 p-2 rounded">
              {debugInfo.errors.map((error, index) => (
                <div key={index} className="text-red-400 text-xs break-words border-b border-red-800/30 pb-1">
                  <div className="font-mono">{error.time}</div>
                  <div>{error.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {debugInfo.logs.length > 0 && (
          <div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">日志 ({debugInfo.logs.length}):</span>
            </div>
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto bg-blue-900/20 p-2 rounded">
              {debugInfo.logs.map((log, index) => (
                <div key={index} className="text-blue-400 text-xs break-words border-b border-blue-800/30 pb-1">
                  <div className="font-mono">{log.time}</div>
                  <div>{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
