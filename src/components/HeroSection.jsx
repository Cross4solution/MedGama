import React, { useState, useEffect, useMemo } from 'react';
import { Send, Shield } from 'lucide-react';

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

const HeroSection = () => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentTypingMessage, setCurrentTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  const heroChatMessages = useMemo(() => [
    {
      id: 1,
      sender: 'user',
      text: 'Baş ağrım var, ne yapmalıyım?',
      avatar: null
    },
    {
      id: 2,
      sender: 'ai',
      text: 'Ağrının şiddeti ve süresi nedir? Size uygun nöroloji uzmanlarını buluyorum...',
      avatar: <Send className="w-3 h-3 text-white" />
    },
    {
      id: 3,
      sender: 'user',
      text: '3 gündür sürekli, şiddetli ağrı',
      avatar: null
    },
    {
      id: 4,
      sender: 'ai',
      text: 'Bu durum migren olabilir. Size en yakın nöroloji uzmanlarını listeliyorum...',
      avatar: <Send className="w-3 h-3 text-white" />
    }
  ], []);

  useEffect(() => {
    let messageIndex = 0;
    let charIndex = 0;
    let currentText = '';
    let isRunning = false;

    const startHeroChat = () => {
      if (isRunning) return;
      isRunning = true;
      
      const processMessage = () => {
        if (messageIndex >= heroChatMessages.length) {
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
            startHeroChat();
          }, 3000);
          return;
        }

        const message = heroChatMessages[messageIndex];

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
          setTimeout(() => {
            setShowTypingIndicator(false);
            setIsTyping(true);
            setCurrentTypingMessage({ ...message, currentText: '' });
            
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
                charIndex = 0;
                currentText = '';
                setTimeout(processMessage, 1500);
              }
            }, 30);
          }, 1000);
        }
      };

      // İlk mesajı başlat
      setTimeout(processMessage, 1000);
    };

    startHeroChat();
  }, []);

  return (
    <>
      <style>{scrollbarHideStyles}</style>
      <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Sağlık Hizmetlerinizi
                <span className="text-blue-600"> Dijital Platformda</span> Bulun
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Yapay zeka destekli asistanımız ile semptomlarınızı analiz edin, 
                size en uygun doktor ve klinikleri bulun. Güvenli, hızlı ve 
                kolay sağlık hizmeti erişimi.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2">
                <Send className="w-4 h-4" />
                <span>AI Asistanı ile Başla</span>
              </button>
            </div>
            
            {/* Küçük Chat Demo */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg max-w-sm h-48 overflow-hidden">
              <div className="space-y-3 overflow-y-auto h-full pr-2 scrollbar-hide">
                {/* Tamamlanmış mesajlar */}
                {visibleMessages.map((message) => (
                  <div key={message.uniqueId || message.id} className="flex items-start space-x-2">
                    {message.sender === 'user' ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div className="bg-gray-100 p-2 rounded-lg max-w-xs">
                          <p className="text-xs text-gray-700">{message.fullText}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          {message.avatar}
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg max-w-xs border border-blue-100">
                          <p className="text-xs text-gray-700">{message.fullText}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Şu anki typing mesajı */}
                {currentTypingMessage && (
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      {currentTypingMessage.avatar}
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg max-w-xs border border-blue-100">
                      {showTypingIndicator ? (
                        <div className="flex items-center space-x-1">
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-1">Yazıyor...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-700">
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
          
          {/* Right Side - Image */}
          <div className="relative">
            <div className="bg-gray-100 rounded-2xl relative overflow-hidden h-80">
              <img 
                src="/images/caroline-lm-uqved8dypum-unsplash_720.jpg" 
                alt="Doktor konsültasyonu - Modern klinik ortamında profesyonel sağlık hizmeti" 
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
              />
              <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg flex items-center space-x-2 z-10">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">GDPR & HIPAA Uyumlu</span>
                <span className="text-xs text-gray-500">Güvenli Veri Koruması</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default HeroSection; 