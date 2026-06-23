import TelehealthCallRoom from '@/screens/TelehealthCallRoom';

// 1:1 telehealth call room (auth enforced by the API; non-participants get 403).
export const metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return <TelehealthCallRoom />;
}
