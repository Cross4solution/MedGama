import React from 'react';
import TimelineShareBox from './TimelineShareBox';
import TimelineCard from 'components/timeline/TimelineCard';
import { posts as sharedPosts } from '../timelineData';
import { useAuth } from '../../context/AuthContext';

// This component renders ONLY the main timeline content (share box + posts + professional review)
// It is reused in both the full Timeline page and the PatientHome preview.
export default function TimelineFeed() {
  const { user } = useAuth();
  const posts = sharedPosts;

  return (
    <div className="space-y-6">
      {/* Share Box (only for patients) */}
      {user?.role === 'patient' && (
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <TimelineShareBox />
        </div>
      )}

      {/* Posts rendered with updated TimelineCard (same as TimelinePage) */}
      {posts.map((p, idx) => {
        const isDoctor = p.type === 'doctor_update' && p.doctor;
        const isPatient = p.type === 'patient_review' && p.patient;
        const isClinic = p.type === 'clinic_update' && p.clinic;

        const specialty = p.clinic?.specialty || p.doctor?.specialty;
        const actor = isDoctor
          ? {
              id: p.doctor.id || `ph-${p.id || idx}`,
              role: 'doctor',
              name: p.doctor.name,
              title: p.doctor.specialty || 'Doctor',
              avatarUrl: p.doctor.avatar || '/images/portrait-candid-male-doctor_720.jpg',
            }
          : isPatient
          ? {
              id: `ph-${p.id || idx}`,
              role: 'patient',
              name: p.patient.name,
              title: 'Shared experience',
              avatarUrl: p.patient.avatar || '/images/portrait-candid-male-doctor_720.jpg',
            }
          : {
              id: `ph-${p.id || idx}`,
              role: 'clinic',
              name: p.clinic?.name || 'Update',
              title: specialty || 'Update',
              avatarUrl: p.clinic?.avatar || '/images/portrait-candid-male-doctor_720.jpg',
            };

        const item = {
          id: `ph-${p.id || idx}`,
          text: p.content,
          media: p.image ? [{ url: p.image }] : [],
          likes: p.engagement?.likes ?? 0,
          comments: p.engagement?.comments ?? 0,
          city: '',
          specialty,
          actor,
        };
        return <TimelineCard key={item.id} item={item} disabledActions={false} view={'list'} />;
      })}
    </div>
  );
}
