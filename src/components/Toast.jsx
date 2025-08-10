import React, { useEffect } from 'react'

export default function Toast({ message, type = 'error', isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500'
  const icon = type === 'error' ? '❌' : '✅'

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`${bgColor} text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 max-w-sm`}>
        <span>{icon}</span>
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}
