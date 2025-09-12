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

const longClinic = 'We recently introduced enhanced patient navigation, multidisciplinary boards, and improved discharge planning. Outcomes indicate shorter hospital stays and higher satisfaction. Our new minimally invasive protocols reduced recovery time while maintaining safety. Clinicians share best practices weekly to keep consistency across departments.';
const longReview = 'I am very satisfied with the overall process. The staff was kind and professional, and communication was clear at every step. The pre-op guidance eased my concerns and post-op follow-up was timely. Facilities were clean and modern, and cost transparency helped me plan confidently.';

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
    const isDoctor = idx % 5 === 0;
    const isClinic = !isDoctor && (idx % 3 === 0);
    const mediaCount = 1 + (idx % 4);
    const media = mediaPool.slice(0, mediaCount);
    const actor = {
      id: isDoctor ? `doc-${(idx%20)+1}` : (isClinic ? `clinic-${(idx%20)+1}` : `pat-${(idx%20)+1}`),
      role: isDoctor ? 'doctor' : (isClinic ? 'clinic' : 'patient'),
      name: isDoctor ? (`Dr. ${['Ahmet','Ayşe','Mehmet','Elif','Can'][idx%5]}`) : (isClinic ? cl : 'Patient'),
      title: isDoctor ? sp : (isClinic ? sp : 'Shared experience'),
      avatarUrl: '/images/portrait-candid-male-doctor_720.jpg',
    };
    items.push({
      id: `gen-${idx+1}`,
      text: idx % 3 === 0 ? longClinic : longReview,
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
