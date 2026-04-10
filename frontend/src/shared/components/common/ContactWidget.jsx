import React, { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const ContactWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [hasUnreadAdmin, setHasUnreadAdmin] = useState(false);
  const [showAdminChatList, setShowAdminChatList] = useState(false);
  const [adminChats, setAdminChats] = useState([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  
  const { user, isAdmin } = useAuth();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const amIAdmin = isAdmin();

  // Admin Notification Socket
  useEffect(() => {
    if (amIAdmin) {
      const adminSocket = io('http://localhost:3007');
      adminSocket.on('connect', () => {
        adminSocket.emit('join_admin');
      });
      adminSocket.on('admin_init_chats', (chats) => {
        setAdminChats(chats);
        setHasUnreadAdmin(chats.some(c => c.hasUnreadAdmin));
      });
      adminSocket.on('admin_new_chat', (chatInfo) => {
        setAdminChats(prev => {
          if (prev.find(c => c.userId === chatInfo.userId)) return prev;
          return [...prev, chatInfo];
        });
        setHasUnreadAdmin(true);
      });
      adminSocket.on('admin_receive_message', ({ userId, message }) => {
        setAdminChats(prev => prev.map(c => {
          if (c.userId === userId) {
            return { ...c, messages: [...c.messages, message], hasUnreadAdmin: true };
          }
          return c;
        }));
        setHasUnreadAdmin(true);
      });
      adminSocket.on('admin_chats_updated', (chats) => {
        setAdminChats(chats);
        setHasUnreadAdmin(chats.some(c => c.hasUnreadAdmin));
      });
      setSocket(adminSocket);
      return () => adminSocket.disconnect();
    }
  }, [amIAdmin]);

  // Normal User Chat Socket
  useEffect(() => {
    if (showChat && user && !amIAdmin) {
      // Direct connection to avoid gateway restart issues
      const newSocket = io('http://localhost:3007');
      
      newSocket.on('connect', () => {
        newSocket.emit('join_chat', {
          userId: user.id,
          userName: user.name || user.email
        });
      });

      newSocket.on('chat_history', (history) => {
        setMessages(history);
      });

      newSocket.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [showChat, user, amIAdmin]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, adminChats]);

  const handleOpenChat = () => {
    setShowOptions(false);
    setShowChat(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    
    socket.emit('send_message', {
      userId: user.id,
      text: text.trim()
    });
    setText('');
  };

  const handleAdminSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket || !selectedAdminUser) return;
    socket.emit('admin_send_message', {
      userId: selectedAdminUser.userId,
      text: text.trim()
    });
    setText('');
  };

  const handleSelectAdminUser = (chatItem) => {
    setSelectedAdminUser(chatItem);
    if (socket && chatItem.hasUnreadAdmin) {
      socket.emit('admin_mark_read', { userId: chatItem.userId });
    }
  };

  // If user is ADMIN, render a mini Admin Chat Interface
  if (amIAdmin) {
    const currentAdminChat = selectedAdminUser ? adminChats.find(c => c.userId === selectedAdminUser.userId) : null;
    
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Khung chat Admin */}
        {showAdminChatList && !selectedAdminUser && (
          <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 border border-gray-100" style={{ height: '500px' }}>
            <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <h3 className="font-semibold text-sm">Tin nhắn Khách hàng</h3>
              </div>
              <button onClick={() => setShowAdminChatList(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {adminChats.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">Chưa có khách hàng nào nhắn tin.</div>
              ) : (
                adminChats.map(chat => (
                  <div 
                    key={chat.userId} 
                    onClick={() => handleSelectAdminUser(chat)}
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between bg-white"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm">{chat.userName}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "Đang chờ..."}
                      </p>
                    </div>
                    {chat.hasUnreadAdmin && (
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedAdminUser && currentAdminChat && (
          <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 border border-gray-100" style={{ height: '500px' }}>
            <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedAdminUser(null)}>
                <span className="text-xl leading-none">&larr;</span>
                <div>
                  <h3 className="font-semibold text-sm">{currentAdminChat.userName}</h3>
                  <p className="text-xs text-green-400">Đang hoạt động</p>
                </div>
              </div>
              <button onClick={() => { setSelectedAdminUser(null); setShowAdminChatList(false); }} className="text-white/80 hover:text-white p-1 rounded-full transition">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
              {currentAdminChat.messages.map((msg, idx) => {
                const isMyResponse = msg.sender === 'admin';
                return (
                  <div key={idx} className={`flex ${isMyResponse ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMyResponse ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
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

            <form onSubmit={handleAdminSend} className="bg-white border-t border-gray-100 p-3 flex gap-2">
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Trả lời khách..." 
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
              />
              <button type="submit" disabled={!text.trim()} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50">
                <PaperAirplaneIcon className="w-5 h-5 -ml-0.5" />
              </button>
            </form>
          </div>
        )}

        {!showAdminChatList && !selectedAdminUser && (
          <button
            onClick={() => setShowAdminChatList(true)}
            className="bg-gray-800 hover:bg-gray-900 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110 flex items-center justify-center group relative cursor-pointer"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {hasUnreadAdmin && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Khung Chat Chính cúa User */}
      {showChat && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 border border-gray-100" style={{ height: '500px' }}>
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Hỗ trợ trực tuyến</h3>
                <p className="text-xs text-blue-100">Chúng tôi trả lời ngay lập tức</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3 relative">
            {!user ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">Vui lòng đăng nhập</h4>
                <p className="text-sm text-gray-500 mb-6">Bạn cần đăng nhập để trò chuyện với bộ phận hỗ trợ khách hàng.</p>
                <button 
                  onClick={() => {
                    setShowChat(false);
                    window.dispatchEvent(new Event('openLoginModal'));
                  }}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 shadow-md transition"
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : (
              <>
                <div className="text-center text-xs text-gray-400 my-2">Bắt đầu cuộc trò chuyện. Các tin nhắn được mã hoá đầu cuối.</div>
                {messages.map((msg, idx) => {
                  const isMine = msg.sender === 'user';
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <span className={`text-[10px] mt-1 block ${isMine ? 'text-blue-200 text-right' : 'text-gray-400 text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Footer Input */}
          {user && (
            <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-3 flex gap-2">
              <input 
                type="text" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn..." 
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition"
              />
              <button 
                type="submit" 
                disabled={!text.trim()}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition shadow-md"
              >
                <PaperAirplaneIcon className="w-5 h-5 -ml-0.5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Menu Options (Zalo / Chat) */}
      {showOptions && !showChat && (
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 mb-4 overflow-hidden w-64 animate-fade-in-up">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Liên hệ với chúng tôi</h3>
          </div>
          <div className="flex flex-col">
            <button 
              onClick={handleOpenChat}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition border-b border-gray-50 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex flex-shrink-0 items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Chat với Nhân viên</p>
                <p className="text-xs text-gray-500">Phản hồi ngay lập tức</p>
              </div>
            </button>
            <a 
              href="https://zalo.me/0123456789" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex flex-shrink-0 items-center justify-center">
                <span className="text-white font-bold text-xs">Zalo</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Liên hệ qua Zalo</p>
                <p className="text-xs text-gray-500">Gọi điện hoặc nhắn tin</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Floating Button cúa User */}
      {!showChat && (
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl shadow-blue-600/30 transition-transform hover:scale-110 flex items-center justify-center group relative cursor-pointer"
        >
          {showOptions ? (
            <XMarkIcon className="w-6 h-6 animate-spin-once" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-6 h-6 animate-bounce-slight" />
          )}
          
          {/* Tooltip */}
          {!showOptions && (
            <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Cần hỗ trợ?
            </span>
          )}
        </button>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ContactWidget;
