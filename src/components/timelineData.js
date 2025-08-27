// Shared demo data for timeline-like components
// Used by TimelineFeed and TimelinePreview to ensure consistency

export const posts = [
  {
    id: 1,
    type: 'clinic_update',
    clinic: {
      name: 'Anadolu Sağlık Merkezi',
      location: 'İstanbul',
      avatar: 'https://placehold.co/40x40',
      verified: true,
      specialty: 'Kalp Cerrahisi',
    },
    timestamp: '2 saat önce',
    content:
      "🔬 Yeni teknoloji ile minimal invaziv kalp ameliyatlarımızda başarı oranımız %98'e ulaştı! Hastalarımızın iyileşme süreleri yarıya indi.",
    hashtags: ['#KalpCerrahisi', '#MinimalInvaziv'],
    image: 'https://placehold.co/600x300',
    engagement: {
      likes: 124,
      comments: 18,
      shares: 12,
    },
    hasAppointmentButton: true,
  },
  {
    id: 2,
    type: 'patient_review',
    patient: {
      name: 'Mehmet Kaya',
      avatar: 'https://placehold.co/40x40',
      isPatient: true,
    },
    timestamp: '4 saat önce',
    rating: 5,
    content:
      "Memorial Hastanesi'nde estetik operasyonum çok başarılı geçti! Dr. Ahmet Yılmaz ve ekibine çok teşekkür ederim. Hem öncesi hem sonrası süreçte çok ilgili davrandılar. Kesinlikle tavsiye ederim! 🔬",
    verificationBadge: {
      text: 'Onaylanmış Değerlendirme',
      description:
        'Bu değerlendirme sistem üzerinden randevu alan gerçek bir hasta tarafından yapılmıştır.',
    },
    engagement: {
      likes: 89,
      comments: 12,
      shares: 5,
    },
  },
];

export const professionalReview = {
  id: 'pro-review-1',
  reviewer: {
    name: 'MediTravel Profesyonel Değerlendirme',
    team: 'Uzman Ekip',
    badge: 'PRO Review',
    avatar: 'https://placehold.co/40x40',
  },
  timestamp: '1 gün önce',
  clinic: 'Ege Üniversitesi Tıp Fakültesi Profesyonel İnceleme',
  content:
    "Uzman ekibimiz Ege Üniversitesi Tıp Fakültesi'ni detaylı olarak inceledi. Akademik kadro, teknolojik altyapı ve hasta memnuniyeti açısından değerlendirmemiz...",
  images: ['https://placehold.co/150x100', 'https://placehold.co/150x100', 'https://placehold.co/150x100'],
  scores: {
    technology: 9.2,
    cleanliness: 9.5,
    staff: 9.2,
  },
  engagement: {
    likes: 156,
    comments: 24,
  },
};
