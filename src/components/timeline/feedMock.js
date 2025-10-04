// Shared Explore-style mock generator for TimelineCard-compatible items
// Produces items with fields used by TimelineCard: id, text, media, likes, comments, specialty, actor, timeAgo, visibility

const SPECIALTIES = [
  'Cardiology','Cardiac Surgery','Pediatric Cardiology','Oncology','Medical Oncology','Radiation Oncology','Hematology',
  'Orthopedics','Sports Medicine','Rheumatology','Neurology','Neurosurgery','Psychiatry','Psychology','Dermatology',
  'Endocrinology','Gastroenterology','General Surgery','Plastic Surgery','Reconstructive Surgery','OB/GYN','Urology',
  'Nephrology','Pulmonology','ENT','Ophthalmology','Dentistry','Maxillofacial Surgery',
  'Pediatrics','Geriatrics','Infectious Diseases','Allergy & Immunology','Anesthesiology','Emergency Medicine',
  'Radiology','Interventional Radiology','Pathology','Physiotherapy','Nutrition & Dietetics','Speech Therapy'
];

const CLINICS = ['Anadolu Health Center','Memorial','Ege University','Acibadem','Medicana','Florence Nightingale'];
const CITIES = ['Istanbul, TR','Ankara, TR','Izmir, TR','Berlin, DE','Munich, DE','London, GB','New York, US'];

const doctorUpdates = [
  'We are pleased to announce that our clinic has successfully performed over 500 minimally invasive cardiac procedures this year with a 99% success rate.',
  'Our research team has published a new study on advanced treatment methods in the Journal of Medical Innovation.',
  'We are proud to introduce our new state-of-the-art cardiac catheterization lab for more accurate diagnoses.'
];

const clinicUpdates = [
  'We are excited to announce the opening of our new cardiology wing with cutting-edge technology.',
  'Our hospital has been recognized as a Center of Excellence for Cardiac Care.',
  'We are proud to introduce our new patient-centered care program for personalized treatment plans.'
];

const mediaPool = [
  { url: '/images/petr-magera-huwm7malj18-unsplash_720.jpg' },
  { url: '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg' },
  { url: '/images/care-team-with-patient_720.jpg' },
  { url: '/images/doctor-explaining_720.jpg' },
];

export function generateExploreStyleItems(count = 12, offset = 0) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const idx = i + offset;
    const sp = SPECIALTIES[idx % SPECIALTIES.length];
    const cl = CLINICS[idx % CLINICS.length];
    const ct = CITIES[idx % CITIES.length];
    // Tüm postları doktor veya klinik güncellemesi yapıyoruz
    const isDoctor = idx % 2 === 0; // Yarısı doktor, yarısı klinik güncellemesi
    const isClinic = !isDoctor;
    const mediaCount = 1 + (idx % 4);
    const media = mediaPool.slice(0, mediaCount);
    const doctorName = ['Ahmet', 'Ayşe', 'Mehmet', 'Elif', 'Can'][idx % 5];
    
    const actor = {
      id: isDoctor ? `doc-${(idx%20)+1}` : `clinic-${(idx%20)+1}`,
      role: isDoctor ? 'doctor' : 'clinic',
      name: isDoctor ? `Dr. ${doctorName}` : cl,
      title: sp,
      avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
    };
    
    // Rastgele güncelleme metni seç
    const updateText = isDoctor 
      ? doctorUpdates[idx % doctorUpdates.length]
      : clinicUpdates[idx % clinicUpdates.length];
    
    items.push({
      id: `gen-${idx+1}`,
      text: updateText,
      media,
      likes: 20 + (idx % 100),
      comments: 2 + (idx % 15),
      specialty: sp,
      actor,
      timeAgo: (1 + (idx % 6)) + ' gün',
      visibility: 'public',
    });
  }
  return items;
}
