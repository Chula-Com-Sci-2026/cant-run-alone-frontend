import { BadgeCheck, CalendarClock, Languages, LogOut, MapPin, Pencil, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, Card } from '../components/ui'

const me = { name: 'Ray Attajak', initials: 'RA', color: '#ef6f4d' }
export default function ProfilePage() {
  const { i18n } = useTranslation(); const setLanguage = (language: string) => { localStorage.setItem('cra-locale', language); void i18n.changeLanguage(language) }
  return <div className="page narrow"><header className="page-title"><div><span className="kicker">YOUR RUNNING IDENTITY</span><h1>Profile</h1></div><Button variant="secondary"><Pencil size={17} /> Edit profile</Button></header><Card className="profile-hero"><Avatar runner={me} large /><div><h2>{me.name} <BadgeCheck size={22} /></h2><p>Intermediate runner · 6:00–6:30 min/km</p><div className="pill-row"><span><MapPin size={14} /> Lumphini area</span><span><CalendarClock size={14} /> Tue & Thu evenings</span></div></div></Card><div className="settings"><Card><h3><ShieldCheck /> Privacy & safety</h3><div className="setting-row"><span><strong>Approximate discovery area</strong><small>Other runners see a 1–2 km area.</small></span><span className="status status--success">On</span></div><div className="setting-row"><span><strong>Phone verification</strong><small>Your number is never public.</small></span><span className="status status--success">Verified</span></div></Card><Card><h3><Languages /> Language</h3><div className="language-options"><button className={i18n.language.startsWith('en') ? 'selected' : ''} onClick={() => setLanguage('en')}>English</button><button className={i18n.language.startsWith('th') ? 'selected' : ''} onClick={() => setLanguage('th')}>ภาษาไทย</button></div></Card><Card className="logout"><Link to="/login"><LogOut size={18} /> Sign out</Link></Card></div></div>
}
