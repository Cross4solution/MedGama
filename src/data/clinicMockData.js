import { Activity, Stethoscope, Brain, Scissors } from 'lucide-react';

export const clinicInfo = {
  name: 'Anadolu Health Center',
  location: 'Istanbul, Turkey',
  heroImage: '/images/petr-magera-huwm7malj18-unsplash_720.jpg',
  rating: 4.8,
  reviewCount: 342
};

export const aboutData = {
  title: 'About Us',
  paragraph1: "Anadolu Health Center is one of Turkey's leading healthcare institutions with 15 years of experience.\nOur JCI-accredited hospital provides healthcare services at international standards.",
  paragraph2: 'With over 50 specialist doctors and state-of-the-art medical equipment, we offer services in\ncardiac surgery, oncology, neurology, and plastic surgery.'
};

export const servicesData = [
  { 
    id: 'cardiac-surgery',
    name: 'Cardiac Surgery', 
    icon: Activity, 
    description: 'Bypass, valve replacement, arrhythmia surgery',
    prices: [
      { procedure: 'Coronary Artery Bypass (CABG)', range: '$15,000 - $25,000' },
      { procedure: 'Heart Valve Replacement', range: '$20,000 - $35,000' },
      { procedure: 'Angioplasty & Stenting', range: '$8,000 - $15,000' },
      { procedure: 'Pacemaker Implantation', range: '$10,000 - $18,000' }
    ]
  },
  { 
    id: 'oncology',
    name: 'Oncology', 
    icon: Stethoscope, 
    description: 'Cancer diagnosis, chemotherapy, radiation therapy',
    prices: [
      { procedure: 'Chemotherapy (per session)', range: '$1,500 - $3,000' },
      { procedure: 'Radiation Therapy (full course)', range: '$10,000 - $20,000' },
      { procedure: 'Immunotherapy (per session)', range: '$5,000 - $12,000' },
      { procedure: 'Cancer Surgery', range: '$15,000 - $40,000' }
    ]
  },
  { 
    id: 'neurology',
    name: 'Neurology', 
    icon: Brain, 
    description: 'Brain surgery, epilepsy treatment',
    prices: [
      { procedure: 'Brain Tumor Surgery', range: '$25,000 - $50,000' },
      { procedure: 'Epilepsy Surgery', range: '$20,000 - $35,000' },
      { procedure: 'Deep Brain Stimulation', range: '$30,000 - $50,000' },
      { procedure: 'Neurological Consultation', range: '$150 - $300' }
    ]
  },
  { 
    id: 'plastic-surgery',
    name: 'Plastic Surgery', 
    icon: Scissors, 
    description: 'Aesthetic and reconstructive surgery',
    prices: [
      { procedure: 'Rhinoplasty', range: '$3,500 - $7,000' },
      { procedure: 'Facelift', range: '$5,000 - $12,000' },
      { procedure: 'Breast Augmentation', range: '$4,500 - $8,000' },
      { procedure: 'Liposuction', range: '$3,000 - $7,000' }
    ]
  },
];

export const departmentsData = [
  {
    id: 'dep-neuro',
    name: 'Neurology',
    desc: 'Brain and Nervous System',
    doctors: [
      { id: 'n1', name: 'Dr. Ece Demir', title: 'Neurologist', avatar: '/images/portrait-candid-male-doctor_720.jpg' },
      { id: 'n2', name: 'Dr. Kerem Arı', title: 'Neurosurgeon', avatar: '/images/portrait-candid-male-doctor_720.jpg' },
    ],
  },
  {
    id: 'dep-cardio',
    name: 'Cardiology',
    desc: 'Heart & Vessels',
    doctors: [
      { id: 'c1', name: 'Dr. Ali Yılmaz', title: 'Cardiac Surgeon', avatar: '/images/portrait-candid-male-doctor_720.jpg' },
      { id: 'c2', name: 'Dr. Elif Kaya', title: 'Interventional Cardiologist', avatar: '/images/portrait-candid-male-doctor_720.jpg' },
    ],
  },
  {
    id: 'dep-onco',
    name: 'Oncology',
    desc: 'Medical & Radiation Oncology',
    doctors: [
      { id: 'o1', name: 'Dr. Mehmet Çalış', title: 'Medical Oncologist', avatar: '/images/portrait-candid-male-doctor_720.jpg' },
    ],
  },
];

export const reviewsData = [
  {
    id: 1,
    name: 'Ayşe K.',
    rating: 5,
    service: 'Kalp Cerrahisi',
    date: '2 hafta önce',
    comment: 'Doktorlar çok ilgili ve profesyonel. Ameliyat sürecini çok iyi yönettiler. Kesinlikle tavsiye ederim.',
    helpful: 15,
    verified: true
  },
  {
    id: 2,
    name: 'Mehmet S.',
    rating: 4,
    service: 'Onkoloji',
    date: '1 ay önce',
    comment: 'Tedavi süreci boyunca çok destek oldular. Modern cihazları ve deneyimli kadrosu var.',
    helpful: 8,
    verified: false
  }
];

export const galleryData = [
  '/images/portrait-candid-male-doctor_720.jpg',
  '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
  '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg'
];

export const beforeAfterData = [
  {
    id: 1,
    title: 'Rhinoplasty',
    before: '/images/portrait-candid-male-doctor_720.jpg',
    after: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
    description: 'Nose reshaping procedure'
  },
  {
    id: 2,
    title: 'Hair Transplant',
    before: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg',
    after: '/images/portrait-candid-male-doctor_720.jpg',
    description: 'FUE hair restoration'
  },
  {
    id: 3,
    title: 'Dental Veneers',
    before: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
    after: '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg',
    description: 'Smile makeover'
  }
];

export const priceRangesData = [
  { service: 'Konsültasyon', range: '₺200 - ₺500' },
  { service: 'Kalp Cerrahisi', range: '₺50K - ₺150K' },
  { service: 'Onkoloji Tedavi', range: '₺30K - ₺200K' }
];

export const certificatesData = [
  '/images/certificates/sample-cert-1.jpg',
  '/images/certificates/sample-cert-2.jpg',
  '/images/certificates/sample-cert-3.jpg'
];

export const publicationsData = [
  {
    id: 'pub-1',
    title: 'Outcomes of Cardiac Surgery in International Patients',
    journal: 'International Journal of Cardiology (2023)',
    url: 'https://example.com/publication-1'
  },
  {
    id: 'pub-2',
    title: 'Advances in Oncology Treatments at Anadolu Health Center',
    journal: 'Oncology Today (2022)',
    url: 'https://example.com/publication-2'
  }
];

export const tabsConfig = [
  { id: 'genel-bakis', label: 'Overview' },
  { id: 'prices', label: 'Prices' },
  { id: 'doktorlar', label: 'Doctors' },
  { id: 'degerlendirmeler', label: 'Reviews' },
  { id: 'galeri', label: 'Gallery' },
  { id: 'before-after', label: 'Before & After' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'publications', label: 'Publications' },
  { id: 'konum', label: 'Location' }
];
