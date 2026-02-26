"use client";

export default function AppLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 group cursor-pointer transition-transform hover:scale-105 ${className || ''}`}>
      {/* Logo Icon */}
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow">
        💬
      </div>
      
      {/* App Name */}
      <div className="hidden sm:flex flex-col">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ChatHub
        </span>
        <span className="text-xs text-gray-500 leading-none">Connect & Share</span>
      </div>
    </div>
  );
}
