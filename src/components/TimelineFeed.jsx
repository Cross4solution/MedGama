import React from 'react';
import { Heart, MessageCircle, Share2, Image, Folder, Star, Clock, User } from 'lucide-react';
import { posts as sharedPosts, professionalReview as sharedPro } from './timelineData';

// This component renders ONLY the main timeline content (share box + posts + professional review)
// It is reused in both the full Timeline page and the PatientHome preview.
export default function TimelineFeed() {
  const posts = sharedPosts;
  const professionalReview = sharedPro;

  const userProfile = {
    name: 'Ayşe Yılmaz',
    role: 'Hasta',
    avatar:
      '/images/stylish-good-looking-ambitious-smiling-brunette-woman-with-curly-hairstyle-cross-hands-chest-confident-professional-pose-smiling-standing-casually-summer-outfit-talking-friend-white-wall_720.jpg'
  };

  return (
    <div className="space-y-6">
      {/* Share Box */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <img
              src={userProfile.avatar}
              alt="User"
              className="w-full h-full object-cover object-center scale-110"
              style={{ objectPosition: '25% 50%' }}
            />
          </div>
          <input
            type="text"
            placeholder="Doktora soru sor veya deneyimini paylaş..."
            className="flex-1 p-3 bg-gray-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <Image className="w-5 h-5" />
              <span>Görsel</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <Folder className="w-5 h-5" />
              <span>Dosya</span>
            </button>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
            Paylaş
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Post Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={post.clinic?.avatar || post.patient?.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-800">{post.clinic?.name || post.patient?.name}</h4>
                    {post.patient?.isPatient && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Hasta</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
              {post.clinic?.specialty && (
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm">{post.clinic.specialty}</span>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6 pt-4">
            {post.rating && (
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < post.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
            )}
            <p className="text-gray-700 mb-4">{post.content}</p>
            {post.hashtags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {post.image && <img src={post.image} alt="Post content" className="w-full h-64 object-cover" />}

          {/* Post Actions */}
          <div className="p-6 pt-4 border-top border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                  <Heart className="w-5 h-5" />
                  <span>{post.engagement.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.engagement.comments}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500">
                  <Share2 className="w-5 h-5" />
                  <span>Paylaş</span>
                </button>
              </div>
              {post.hasAppointmentButton && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200">
                  Randevu Al
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Professional Review */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-800">MediTravel Profesyonel Değerlendirme</h4>
                  <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">PRO Review</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Uzman Ekip</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>1 gün önce</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 pt-4">
          <h3 className="font-semibold text-gray-800 mb-3">Ege Üniversitesi Tıp Fakültesi Profesyonel İnceleme</h3>
          <p className="text-gray-700 mb-4">
            Uzman ekibimiz Ege Üniversitesi Tıp Fakültesi'ni detaylı olarak inceledi. Akademik kadro, teknolojik altyapı ve hasta memnuniyeti açısından
            değerlendirmemiz...
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['https://placehold.co/150x100', 'https://placehold.co/150x100', 'https://placehold.co/150x100'].map((img, i) => (
              <img key={i} src={img} alt={`Review ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Teknoloji</p>
              <p className="text-lg font-semibold text-purple-600">9.2/10</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Personel</p>
              <p className="text-lg font-semibold text-purple-600">9.2/10</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Genel</p>
              <p className="text-lg font-semibold text-purple-600">9.5/10</p>
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500">
                <Heart className="w-5 h-5" />
                <span>156</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500">
                <MessageCircle className="w-5 h-5" />
                <span>24</span>
              </button>
            </div>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Detayları Gör</button>
          </div>
        </div>
      </div>
    </div>
  );
}
