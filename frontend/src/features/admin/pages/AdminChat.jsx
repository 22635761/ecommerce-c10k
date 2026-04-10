import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../auth/hooks/useAuth';
import { UserCircleIcon, PaperAirplaneIcon, EnvelopeIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';

const AdminChat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser?.messages]);

  useEffect(() => {
    const newSocket = io('http://localhost:3007');

    newSocket.on('connect', () => {
      console.log('Admin connected to chat');
      newSocket.emit('join_admin');
    });

    newSocket.on('admin_init_chats', (allChats) => {
      setChats(allChats);
    });

    newSocket.on('admin_new_chat', (chatInfo) => {
      setChats(prev => {
        const exists = prev.find(c => c.userId === chatInfo.userId);
        if (exists) return prev;
        return [...prev, chatInfo];
      });
    });

    newSocket.on('admin_receive_message', ({ userId, message }) => {
      setChats(prev => {
        return prev.map(chat => {
          if (chat.userId === userId) {
            return {
              ...chat,
              messages: [...chat.messages, message],
              // Nếu admin đang xem tin nhắn này thì không hiện unread
              hasUnreadAdmin: true
            };
          }
          return chat;
        });
      });
      
      // Update selectedUser if currently viewing them
      setSelectedUser(prev => {
        if (prev && prev.userId === userId) {
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        }
        return prev;
      });
    });

    newSocket.on('admin_chats_updated', (allChats) => {
      setChats(allChats);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const handleSelectUser = (chatItem) => {
    setSelectedUser(chatItem);
    // Xoá nhãn chưa đọc
    if (socket && chatItem.hasUnreadAdmin) {
      socket.emit('admin_mark_read', { userId: chatItem.userId });
    }
    setChats(prev => prev.map(c => c.userId === chatItem.userId ? { ...c, hasUnreadAdmin: false } : c));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !selectedUser) return;

    socket.emit('admin_send_message', {
      userId: selectedUser.userId,
      text: text.trim()
    });
    setText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex h-[600px] overflow-hidden">
      
      {/* Sidebar - Danh sách khách hàng */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="px-4 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
          <h2 className="font-bold text-gray-800 text-lg">Danh sách Hỗ trợ</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">Chưa có khách hàng nào kết nối.</div>
          ) : (
            chats.map(chat => (
              <div 
                key={chat.userId} 
                onClick={() => handleSelectUser(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition flex items-center justify-between ${selectedUser?.userId === chat.userId ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-100 bg-white border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2 text-blue-600">
                    <UserCircleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{chat.userName}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "Đang chờ hỗ trợ..."}
                    </p>
                  </div>
                </div>
                {chat.hasUnreadAdmin && (
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-white">
        {selectedUser ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-full p-2 text-blue-600">
                  <UserCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedUser.userName}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full block"></span> Trực tuyến
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
              {selectedUser.messages.map((msg, idx) => {
                const isMyResponse = msg.sender === 'admin';
                return (
                  <div key={idx} className={`flex ${isMyResponse ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMyResponse ? 'bg-blue-600 text-white rounded-br-sm shadow-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <span className={`text-[10px] mt-1 block ${isMyResponse ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-3">
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn hỗ trợ khách hàng..." 
                className="flex-1 bg-gray-100 border border-transparent rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white focus:border-blue-300 transition"
              />
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition shadow-lg"
              >
                <PaperAirplaneIcon className="w-6 h-6 -ml-1" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <EnvelopeOpenIcon className="w-20 h-20 text-gray-200 mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Hỗ trợ trực tuyến</h3>
            <p className="text-sm">Chọn một cuộc hội thoại bên trái để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
