import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { UsersIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const Footer = () => {
  const [online, setOnline] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Generate or fetch unique device signature
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('deviceId', deviceId);
    }

    // Hidden connection for tracking only
    const socket = io('http://localhost:3007', {
      reconnectionAttempts: 5,
      timeout: 10000,
      query: { deviceId } // Send to backend to unify tabs/sessions
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('visitor_stats', (data) => {
      if (data && typeof data.online === 'number') {
        setOnline(data.online);
        setTotalVisits(data.total);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <footer className="bg-white border-t border-gray-100 mt-12 py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left Info */}
        <div className="text-gray-500 text-sm">
          <p>© 2026 PhoneStore. Tất cả quyền được bảo lưu.</p>
          <p className="mt-1">Dự án hệ thống E-commerce Microservices.</p>
        </div>

        {/* Right Stats Tracking */}
        <div className="flex gap-4">
          {/* Online Users */}
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100 shadow-sm transition hover:shadow cursor-default">
            <span className="relative flex h-3 w-3">
              {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </span>
            <UsersIcon className="w-5 h-5 text-green-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-green-600 uppercase leading-none">Đang truy cập</span>
              <span className="text-sm font-bold text-gray-800 leading-tight">{online.toLocaleString('vi-VN')}</span>
            </div>
          </div>

          {/* Total Visits */}
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm transition hover:shadow cursor-default">
            <GlobeAltIcon className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-blue-600 uppercase leading-none">Tổng lượt truy cập</span>
              <span className="text-sm font-bold text-gray-800 leading-tight">{totalVisits.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
