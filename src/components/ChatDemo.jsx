import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';

// Scrollbar gizleme CSS'i
const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const ChatDemo = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentTypingMessage, setCurrentTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  const chatMessages = useMemo(() => [
    {
      id: 1,
      sender: 'user',
      text: 'Nefes alırken ciğerlerim acıyor, neden olabilir?',
      avatar: null
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Bu durumu daha iyi anlamak için birkaç sorum var:\n\n1. Her zaman mı, yoksa derin nefes aldığım da mı ağrıyor?\n2. Batma şeklinde mi yanma şeklinde mi?\n3. Ne kadar süredir devam ediyor?',
      avatar: <MessageCircle className="w-4 h-4 text-white" />
    },
    {
      id: 3,
      sender: 'user',
      text: 'Derin nefes aldığımda batma şeklinde, 3 gündür devam ediyor.',
      avatar: null
    },
    {
      id: 4,
      sender: 'ai',
      text: 'Bu semptomlar akciğer zarı iltihapı veya kas gerginliği ile ilişkili olabilir. Hangi şehirde tedavi olmak istersiniz? Size uygun göğüs hastalıkları uzmanlarını listeliyorum.',
      avatar: <MessageCircle className="w-4 h-4 text-white" />
    }
  ], []);

  // Otomatik scroll için ref
  const chatContainerRef = React.useRef(null);

  // Yeni mesaj geldiğinde otomatik scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleMessages, currentTypingMessage]);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let currentText = '';
    let isRunning = false;

    const startChat = () => {
      if (isRunning) return;
      isRunning = true;
      const processMessage = () => {
        if (messageIndex >= chatMessages.length) {
          // Chat bitti, başa dön
          setTimeout(() => {
            setVisibleMessages([]);
            setCurrentTypingMessage(null);
            setIsTyping(false);
            setShowTypingIndicator(false);
            messageIndex = 0;
            charIndex = 0;
            currentText = '';
            isRunning = false;
            startChat();
          }, 3000);
          return;
        }

        const message = chatMessages[messageIndex];

        if (message.sender === 'user') {
          // User mesajı - direkt göster
          setVisibleMessages(prev => [...prev, { 
            ...message, 
            fullText: message.text,
            uniqueId: `${message.id}-${Date.now()}-${Math.random()}`
          }]);
          messageIndex++;
          setTimeout(processMessage, 2000);
        } else {
          // AI mesajı - typing efekti
          setShowTypingIndicator(true);
          setCurrentTypingMessage({ ...message, currentText: '' });

          setTimeout(() => {
            setShowTypingIndicator(false);
            setIsTyping(true);
            charIndex = 0;
            currentText = '';

            const typeInterval = setInterval(() => {
              if (charIndex < message.text.length) {
                currentText += message.text[charIndex];
                setCurrentTypingMessage({ ...message, currentText });
                charIndex++;
              } else {
                clearInterval(typeInterval);
                setIsTyping(false);
                setVisibleMessages(prev => [...prev, { 
                  ...message, 
                  fullText: message.text,
                  uniqueId: `${message.id}-${Date.now()}-${Math.random()}`
                }]);
                setCurrentTypingMessage(null);
                messageIndex++;
                setTimeout(processMessage, 1000);
              }
            }, 30);
          }, 1500);
        }
      };

      // İlk mesajı başlat
      setTimeout(processMessage, 2000);
    };

    startChat();
  }, []);

  return (
    <>
      <style>{scrollbarHideStyles}</style>
      
      {/* Ana container - arka plan resmi burada */}
      <div className="relative w-full h-full rounded-lg overflow-hidden flex flex-col bg-transparent max-h-full">

        
        {/* Scroll container */}
        <div 
          ref={chatContainerRef} 
          className="relative z-10 flex-1 overflow-y-auto pr-2 scrollbar-hide pb-6 min-h-0"
        >
          {/* Chat mesajları container */}
          <div className="space-y-4">
            {/* Tamamlanmış mesajlar */}
            {visibleMessages.map((message) => (
              <div key={message.uniqueId || message.id} className="flex items-start space-x-2">
                {message.sender === 'user' ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex-shrink-0 shadow-sm"></div>
                    <div className="bg-white bg-opacity-80 p-4 rounded-2xl shadow-lg border border-gray-100 max-w-xs">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{message.fullText}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {message.avatar}
                    </div>
                    <div className="bg-white bg-opacity-80 p-4 rounded-2xl shadow-lg border border-blue-100 max-w-xs">
                      <p className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-line">{message.fullText}</p>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Şu anki typing mesajı */}
            {currentTypingMessage && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {currentTypingMessage.avatar}
                </div>
                <div className="bg-white bg-opacity-80 p-4 rounded-2xl shadow-lg border border-blue-100 max-w-xs">
                  {showTypingIndicator ? (
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 ml-2 font-medium">Yazıyor...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                      {currentTypingMessage.currentText}
                      {isTyping && <span className="animate-pulse text-blue-500">|</span>}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatDemo;