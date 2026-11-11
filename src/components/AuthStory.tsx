import { BadgeCheck, CloudSun, Footprints, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

// The dark brand panel beside the sign-in and registration forms. Hidden below 900px, where the
// form's own mobile logo takes over.
export default function AuthStory() {
  return <section className="auth-story"><Link to="/login" className="brand brand--light"><span className="brand__mark"><Zap fill="currentColor" /></span><span>CAN'T RUN<br /><strong>ALONE</strong></span></Link><div><span className="kicker kicker--lime">RUN BANGKOK, TOGETHER</span><h1>Your best runs start with the right people.</h1><p>Match by pace and schedule. Meet in public. Know the weather before you go.</p><div className="auth-benefits"><span><Footprints /> Pace-matched buddies</span><span><CloudSun /> Weather-aware plans</span><span><BadgeCheck /> Phone-verified people</span></div></div><small>Bangkok · ICT (UTC+7)</small></section>
}
