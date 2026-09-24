import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from './Footer.jsx'

// Citizen portal shell: navy header + white sidebar + footer around <Outlet/>
export default function PortalLayout({ session, onLogout }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <Header session={session} />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-[calc(100vh-60px)]">
          <main className="flex-1 px-5 py-5 min-[900px]:px-8 min-[900px]:py-7">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}