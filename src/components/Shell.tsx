import { CalendarDays, Compass, Home, Languages, Palette, UserRound, Zap } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const nav = [
  { to: '/', icon: Home, label: 'home' },
  { to: '/discover', icon: Compass, label: 'discover' },
  { to: '/runs', icon: CalendarDays, label: 'runs' },
  { to: '/activity', icon: CalendarDays, label: 'activity' },
  { to: '/profile', icon: UserRound, label: 'profile' },
]

export default function Shell() {
  const { t, i18n } = useTranslation()
  const toggleLanguage = () => { const next = i18n.language.startsWith('en') ? 'th' : 'en'; localStorage.setItem('cra-locale', next); void i18n.changeLanguage(next) }
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand__mark"><Zap size={19} fill="currentColor" /></span><span>CAN'T RUN<br /><strong>ALONE</strong></span></NavLink>
      <nav>{nav.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={20} /><span>{t(label)}</span></NavLink>)}</nav>
      <div className="sidebar__foot">
        <NavLink to="/design-system"><Palette size={18} /><span>{t('design')}</span></NavLink>
        <button onClick={toggleLanguage}><Languages size={18} /><span>{i18n.language.startsWith('en') ? 'ไทย' : 'English'}</span></button>
      </div>
    </aside>
    <main className="main"><Outlet /></main>
    <nav className="bottom-nav">{nav.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end={to === '/'}><Icon size={21} /><span>{t(label)}</span></NavLink>)}</nav>
  </div>
}
