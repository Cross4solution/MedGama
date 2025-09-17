import React, { useState } from 'react';
import {
  Award,
  Calendar,
  Stethoscope,
  Activity,
  Brain,
  Scissors,
  ChevronRight,
  CheckCircle,
  Star,
  Shield,
  Users,
  Plus,
  Trash2,
  Link as LinkIcon,
  Image as ImageIcon,
  MapPin
} from 'lucide-react';
import { Header } from '../components/layout';
import Badge from '../components/Badge';
import ClinicHero from 'components/clinic/ClinicHero';
import Tabs from 'components/tabs/Tabs';
import ServiceCard from 'components/clinic/ServiceCard';
import ReviewItem from 'components/reviews/ReviewItem';
import ContactActions from 'components/clinic/ContactActions';
import PriceRangeList from 'components/pricing/PriceRangeList';
import QuickContactCard from 'components/clinic/QuickContactCard';
import { useAuth } from '../context/AuthContext';

const ClinicDetailPage = () => {
  const { user } = useAuth();
  const isClinic = Boolean(user && user.role === 'clinic');

  const [activeTab, setActiveTab] = useState('genel-bakis');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Editable fields (demo state). In a real app these would be fetched/saved via API.
  const [clinicName, setClinicName] = useState('Anadolu Health Center');
  const [clinicLocation, setClinicLocation] = useState('Istanbul, Turkey');
  const [heroImage, setHeroImage] = useState('/images/petr-magera-huwm7malj18-unsplash_720.jpg');

  const [aboutTitle, setAboutTitle] = useState('About Us');
  const [aboutP1, setAboutP1] = useState("Anadolu Health Center is one of Turkey's leading healthcare institutions with 15 years of experience.\nOur JCI-accredited hospital provides healthcare services at international standards.");
  const [aboutP2, setAboutP2] = useState('With over 50 specialist doctors and state-of-the-art medical equipment, we offer services in\ncardiac surgery, oncology, neurology, and plastic surgery.');

  const [services, setServices] = useState([
    { name: 'Kalp Cerrahisi', icon: 'Activity', description: 'Bypass, kapak replasmanı, arytoplasti' },
    { name: 'Onkoloji', icon: 'Stethoscope', description: 'Kanser tanısı, kemoterapi, radyoterapi' },
    { name: 'Nöroloji', icon: 'Brain', description: 'Beyin cerrahisi, epilepsi tedavisi' },
    { name: 'Plastik Cerrahi', icon: 'Scissors', description: 'Estetik ve rekonstrüktif cerrahi' },
  ]);

  const [doctorsText, setDoctorsText] = useState('Our expert doctors provide comprehensive care across multiple specialties, focusing on patient safety and outcomes.');

  const [gallery, setGallery] = useState([
    '/images/portrait-candid-male-doctor_720.jpg',
    '/images/deliberate-directions-wlhbykk2y4k-unsplash_720.jpg',
    '/images/gautam-arora-gufqybn_cvg-unsplash_720.jpg'
  ]);

  const [locationAddress, setLocationAddress] = useState('Cumhuriyet Mah., Sağlık Cad. No: 12, Istanbul');
  const [locationMapUrl, setLocationMapUrl] = useState('https://maps.google.com/?q=Istanbul+Turkey');

  const tabs = [
    { id: 'genel-bakis', label: 'Overview' },
    { id: 'hizmetler', label: 'Services' },
    { id: 'doktorlar', label: 'Doctors' },
    { id: 'degerlendirmeler', label: 'Reviews' },
    { id: 'galeri', label: 'Gallery' },
    { id: 'konum', label: 'Location' }
  ];

  const reviews = [
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

  const priceRanges = [
    { service: 'Konsültasyon', range: '₺200 - ₺500' },
    { service: 'Kalp Cerrahisi', range: '₺50K - ₺150K' },
    { service: 'Onkoloji Tedavi', range: '₺30K - ₺200K' }
  ];

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Edit toolbar: only for clinic role */}
        {isClinic && (
          <div className="mb-4 p-3 rounded-xl border bg-white shadow-sm flex items-center justify-between">
            <div className="text-sm text-gray-700">You are logged in as <span className="font-semibold">Clinic</span>. Enable edit mode to update your page.</div>
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg border ${editMode ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
              </button>
              {editMode && (
                <button
                  className="px-3 py-1.5 text-sm rounded-lg border bg-white text-gray-700 hover:bg-gray-50"
                  onClick={() => { /* placeholder: could open a modal for advanced settings */ }}
                >
                  Page Settings
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Hero Section */}
            <ClinicHero
              image={heroImage}
              name={clinicName}
              location={clinicLocation}
              rating={4.8}
              reviews={342}
              badgeNode={(
                <Badge
                  label="JCI Accredited"
                  variant="green"
                  size="sm"
                  rounded="full"
                  icon={<CheckCircle className="w-4 h-4" />}
                />
              )}
              isFavorite={isFavorite}
              onToggleFavorite={() => setIsFavorite(!isFavorite)}
              isFollowing={isFollowing}
              onToggleFollow={() => setIsFollowing((v) => !v)}
              onFollow={() => {}}
            />

            {/* Hero inline edit (only when clinic + edit mode) */}
            {isClinic && editMode && (
              <div className="mt-3 mb-4 p-4 border rounded-xl bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hero Image URL</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setHeroImage(url);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <img src={heroImage} alt="Hero preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Clinic Name</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Location</label>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={clinicLocation}
                      onChange={(e) => setClinicLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
              <div className="p-6">
                {activeTab === 'genel-bakis' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{aboutTitle}</h3>
                      {!editMode && (
                        <>
                          <p className="text-gray-600 leading-relaxed mb-4" style={{ whiteSpace: 'pre-line' }}>
                            {aboutP1}
                          </p>
                          <p className="text-gray-600 leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
                            {aboutP2}
                          </p>
                        </>
                      )}
                      {editMode && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={aboutTitle}
                            onChange={(e) => setAboutTitle(e.target.value)}
                          />
                          <textarea
                            rows={4}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={aboutP1}
                            onChange={(e) => setAboutP1(e.target.value)}
                          />
                          <textarea
                            rows={4}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            value={aboutP2}
                            onChange={(e) => setAboutP2(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm"
                              onClick={() => setEditMode(false)}
                            >
                              Save
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm"
                              onClick={() => setEditMode(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">JCI Accredited</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                        <Shield className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">ISO 9001</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Ministry of Health</span>
                      </div>
                      <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg">
                        <Users className="w-6 h-6 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">Health Tourism</span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge label="PRO Review" variant="purple" size="sm" rounded="full" icon={<Award className="w-4 h-4" />} />
                      </div>
                      <p className="text-purple-700 text-sm">
                        By MediTravel Expert Team: "The clinic provides services at international standards. The medical staff and technological infrastructure are very strong. Patient satisfaction is at a high level."
                      </p>
                    </div>
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewItem key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'galeri' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Gallery</h3>
                    {!editMode && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {gallery.map((src, idx)=> (
                          <div key={`g-${idx}`} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <img src={src} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {editMode && (
                      <div className="space-y-3">
                        {/* Add multiple images */}
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm cursor-pointer">
                            <Plus className="w-4 h-4" /> Add Images
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length) {
                                  const urls = files.map((f) => URL.createObjectURL(f));
                                  setGallery((prev) => [...prev, ...urls]);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>

                        {/* Existing images: preview + replace + delete */}
                        {gallery.map((src, idx) => (
                          <div key={`gi-${idx}`} className="flex items-center gap-3">
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                              <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
                              <ImageIcon className="w-4 h-4 text-gray-600" /> Replace
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files && e.target.files[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    setGallery((prev) => prev.map((it, i) => (i === idx ? url : it)));
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            <button
                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                              onClick={() => setGallery((prev) => prev.filter((_, i) => i !== idx))}
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'konum' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Location</h3>
                    {!editMode && (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 text-gray-700"><MapPin className="w-5 h-5 mt-0.5 text-teal-600" /> <span>{locationAddress}</span></div>
                        <a href={locationMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 hover:underline">
                          <LinkIcon className="w-4 h-4" /> View on Map
                        </a>
                      </div>
                    )}
                    {editMode && (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500">Address</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={locationAddress} onChange={(e)=> setLocationAddress(e.target.value)} />
                        <label className="text-xs text-gray-500">Map URL</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={locationMapUrl} onChange={(e)=> setLocationMapUrl(e.target.value)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Contact Actions */}
            <ContactActions onTelehealth={() => {}} onBook={() => {}} onMessage={() => {}} />

            {/* Health Tourism Package */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Health Tourism Package</h3>
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Treatment + Accommodation + Transfer</span>
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white py-1.5 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Create Package</span>
              </button>
            </div>

            {/* Price Range */}
            <PriceRangeList items={priceRanges} />

            {/* Quick Contact removed as requested */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetailPage; 