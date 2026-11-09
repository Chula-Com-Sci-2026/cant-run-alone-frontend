import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: { home: 'Home', discover: 'Discover', runs: 'Runs', activity: 'Activity', profile: 'Profile', greeting: 'Good evening', findBuddy: 'Find your pace people.', subtitle: 'Compatible runners, safer meetups, and weather you can plan around.', viewRun: 'View run', seeAll: 'See all', suggested: 'Your strongest matches', nearbyRuns: 'Runs around Bangkok', createRun: 'Create a run', design: 'Design system' } },
  th: { translation: { home: 'หน้าหลัก', discover: 'ค้นหาเพื่อน', runs: 'กิจกรรมวิ่ง', activity: 'ความเคลื่อนไหว', profile: 'โปรไฟล์', greeting: 'สวัสดีตอนเย็น', findBuddy: 'หาเพื่อนที่วิ่งจังหวะเดียวกับคุณ', subtitle: 'นักวิ่งที่เข้ากันได้ จุดนัดพบที่ปลอดภัย และสภาพอากาศที่วางแผนได้', viewRun: 'ดูการวิ่ง', seeAll: 'ดูทั้งหมด', suggested: 'เพื่อนวิ่งที่เหมาะกับคุณ', nearbyRuns: 'งานวิ่งรอบกรุงเทพฯ', createRun: 'สร้างกิจกรรมวิ่ง', design: 'ระบบดีไซน์' } },
}

i18n.use(initReactI18next).init({ resources, lng: localStorage.getItem('cra-locale') ?? 'en', fallbackLng: 'en', interpolation: { escapeValue: false } })
export default i18n
