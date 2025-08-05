import React, { useState } from 'react';
import Header from '../components/Header';

const DoctorChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'patient',
      text: 'Merhaba! Size nasıl yardımcı olabilirim? Sağlık durumunuz hakkında sorularınızı paylaşabilirsiniz.',
      time: '10:30'
    },
    {
      id: 2,
      sender: 'doctor',
      text: 'Merhaba doktor. Son birkaç gündür göğsümde ağrı hissediyorum. Özellikle derin nefes aldığımda artıyor. Bu normal mi?',
      time: '10:32'
    },
    {
      id: 3,
      sender: 'patient',
      text: 'Bu semptomlar çeşitli nedenlerle olabilir. Daha detaylı bilgi verebilir misiniz:\n\n• Ağrı ne zaman başladı?\n• Sürekli mi yoksa aralıklı mı?\n• Başka semptomlarınız var mı?',
      time: '10:35'
    }
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'patient',
        text: message,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">Ana Sayfa</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-gray-700">Klinikler</a>
            <span className="mx-2">›</span>
            <a href="#" className="hover:text-gray-700">Anadolu Sağlık Merkezi</a>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Mesaj</span>
          </nav>
        </div>
      </div>

      {/* Doctor Info Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
                         <div className="w-14 h-14 rounded-full mr-4 overflow-hidden bg-gray-100">
               <img 
                 src="/images/portrait-candid-male-doctor_720.jpg" 
                 alt="Dr. Mehmet Özkan" 
                 className="w-full h-full object-cover"
                 style={{ objectPosition: 'center 20%' }}
               />
             </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dr. Mehmet Özkan</h1>
              <div className="flex items-center text-sm text-gray-600">
                <span>Kardiyoloji Uzmanı</span>
                <span className="mx-2">•</span>
                <span>Anadolu Sağlık Merkezi</span>
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Çevrimiçi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center">
                                     <div className="w-12 h-12 rounded-full mr-3 overflow-hidden bg-gray-100">
                     <img 
                       src="/images/portrait-candid-male-doctor_720.jpg" 
                       alt="Dr. Mehmet Özkan" 
                       className="w-full h-full object-cover"
                       style={{ objectPosition: 'center 20%' }}
                     />
                   </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Dr. Mehmet Özkan</h3>
                    <p className="text-sm text-gray-500">Genellikle 2 saat içinde yanıtlar</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 flex items-center shadow-sm hover:shadow-md transition-all duration-200">
                    <span className="mr-2">📹</span>
                    Video Görüşme
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    📞
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start max-w-xs lg:max-w-md">
                      {msg.sender === 'patient' && (
                                                 <div className="w-10 h-10 rounded-full mr-2 flex-shrink-0 overflow-hidden bg-gray-100">
                           <img 
                             src="/images/portrait-candid-male-doctor_720.jpg" 
                             alt="Doctor" 
                             className="w-full h-full object-cover"
                             style={{ objectPosition: 'center 20%' }}
                           />
                         </div>
                      )}
                      <div className={`rounded-lg px-4 py-2 ${
                        msg.sender === 'doctor' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender === 'doctor' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600">
                    📎
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    🖼️
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    📤
                  </button>
                </div>
                <div className="flex items-center space-x-4 mt-3">
                  <button className="text-blue-600 text-sm hover:text-blue-700">
                    Randevu Talep Et
                  </button>
                  <button className="text-blue-600 text-sm hover:text-blue-700">
                    Dosya Paylaş
                  </button>
                  <button className="text-blue-600 text-sm hover:text-blue-700">
                    Video Görüşme
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Doctor Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="text-center">
                                 <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-100">
                   <img 
                     src="/images/portrait-candid-male-doctor_720.jpg" 
                     alt="Dr. Mehmet Özkan" 
                     className="w-full h-full object-cover"
                     style={{ objectPosition: 'center 20%' }}
                   />
                 </div>
                <h3 className="text-lg font-bold text-gray-900">Dr. Mehmet Özkan</h3>
                <p className="text-gray-600 text-sm">Kardiyoloji Uzmanı</p>
                <div className="flex items-center justify-center mt-2">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(5)}
                  </div>
                  <span className="text-sm text-gray-600 ml-1">(4.9)</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🏥</span>
                  <span className="ml-2">15 yıl tecrübe</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🏢</span>
                  <span className="ml-2">Anadolu Sağlık Merkezi</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500">🗣️</span>
                  <span className="ml-2">Türkçe, İngilizce</span>
                </div>
              </div>

                              <button className="w-full bg-blue-600 text-white py-2 rounded-xl mt-6 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
                Profili Görüntüle
              </button>
            </div>

            {/* File Share */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Dosya Paylaş</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-4xl mb-2">⬆️</div>
                <p className="text-sm text-gray-600">
                  Röntgen, tahlil sonucu veya diğer dosyalarınızı yükleyin
                </p>
                <button className="text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm mt-3 hover:bg-blue-100">
                  Dosya Seç
                </button>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Hızlı Bilgiler</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Konsültasyon Ücreti:</span>
                  <span className="font-medium">₺300</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Yanıt Süresi:</span>
                  <span className="font-medium">~2 saat</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Çalışma Saatleri:</span>
                  <span className="font-medium">09:00-18:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorChatPage; 