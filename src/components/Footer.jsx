import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t bg-[#1C6A83] text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-sm">
        {/* Mobile: 2x2 (two groups) */}
        <div className="grid grid-cols-2 gap-8 md:hidden">
          {/* Left group: MedGama + Quick Links */}
          <div className="space-y-6">
            <div>
              <div className="text-white font-semibold mb-2">MedGama</div>
              <p className="text-slate-100/80">A global, end-to-end health portal for patients, doctors and clinics.</p>
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Quick Links</div>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-white/90">About MedGama</a></li>
                <li><a href="/for-patients" className="hover:text-white/90">For Patients</a></li>
                <li><a href="/for-clinics" className="hover:text-white/90">For Clinics</a></li>
                <li><a href="/vasco-ai" className="hover:text-white/90">Vasco AI</a></li>
              </ul>
            </div>
          </div>

          {/* Right group: Social Media + Legal */}
          <div className="space-y-6 justify-self-end text-right">
            <div>
              <div className="text-white font-semibold mb-2">Social Media</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white/90">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white/90">Twitter/X</a></li>
                <li><a href="#" className="hover:text-white/90">Instagram</a></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-2">Legal</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white/90">GDPR</a></li>
                <li><a href="#" className="hover:text-white/90">HIPAA</a></li>
                <li><a href="#" className="hover:text-white/90">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop: 4 columns (original) */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          <div>
            <div className="text-white font-semibold mb-2">MedGama</div>
            <p className="text-slate-100/80">A global, end-to-end health portal for patients, doctors and clinics.</p>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Quick Links</div>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-white/90">About MedGama</a></li>
              <li><a href="/for-patients" className="hover:text-white/90">For Patients</a></li>
              <li><a href="/for-clinics" className="hover:text-white/90">For Clinics</a></li>
              <li><a href="/vasco-ai" className="hover:text-white/90">Vasco AI</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Social Media</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white/90">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white/90">Twitter/X</a></li>
              <li><a href="#" className="hover:text-white/90">Instagram</a></li>
            </ul>
          </div>
          <div>
            <div className="text-white font-semibold mb-2">Legal</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white/90">GDPR</a></li>
              <li><a href="#" className="hover:text-white/90">HIPAA</a></li>
              <li><a href="#" className="hover:text-white/90">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-4 flex items-center justify-between flex-col md:flex-row gap-3">
          <div className="text-white/80">{new Date().getFullYear()} MedGama</div>
          <div className="text-white/70">All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
