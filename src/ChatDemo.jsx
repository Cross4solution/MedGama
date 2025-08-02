import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Tamamlanmış mesajlar */}
      {visibleMessages.map((message) => (
        <div key={message.uniqueId || message.id} className="flex items-start space-x-3">
          {message.sender === 'user' ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="bg-gray-100 p-3 rounded-lg flex-1">
                <p className="text-sm text-gray-700">{message.fullText}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                {message.avatar}
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex-1">
                <p className="text-sm text-gray-700 whitespace-pre-line">{message.fullText}</p>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Şu anki typing mesajı */}
      {currentTypingMessage && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            {currentTypingMessage.avatar}
          </div>
          <div className="bg-blue-50 p-3 rounded-lg flex-1">
            {showTypingIndicator ? (
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">Yazıyor...</span>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {currentTypingMessage.currentText}
                {isTyping && <span className="animate-pulse">|</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDemo;