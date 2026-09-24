import { Link, useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, Clock, MessageSquareWarning, Building, FileText } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import WelcomeBanner from '../components/ui/WelcomeBanner.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import ProgressRing from '../components/ui/ProgressRing.jsx'
import TicketCard from '../components/ui/TicketCard.jsx'
import MiniRow from '../components/ui/MiniRow.jsx'
import {
  currentUser,
  activityLog,
  openComplaints,
  ownedUnits,
} from '../mockData.js'

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function PortalDashboard() {
  const navigate = useNavigate()
  const owned = ownedUnits()
  const verified = owned.filter((u) => u.status === 'verified').length
  const review = owned.filter((u) => u.status === 'review').length
  const open = openComplaints().length
  const pct = owned.length ? Math.round((verified / owned.length) * 100) : 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const activity = [...activityLog].sort((a, b) => b.date.localeCompare(a.date))
  const actIcon = {
    verified: <CheckCircle2 size={15} className="text-green" />,
    review: <Clock size={15} className="text-amber" />,
    info: <FileText size={15} className="text-blue" />,
  }

  return (
    <div className="max-w-[1080px]">
      <Breadcrumb current="Dashboard" />
      <WelcomeBanner
        eyebrow={greeting}
        title={`Welcome, ${currentUser.name.split(' ')[0]}`}
        subtitle={
          open
            ? `You have ${open} open report${open > 1 ? 's' : ''} being processed by the registry.`
            : 'All your records are verified and up to date.'
        }
        ctaLabel="View property records"
        onCta={() => navigate('/portal/records')}
      />

      <div className="grid grid-cols-2 min-[760px]:grid-cols-4 gap-3 mt-4">
        <StatCard
          icon={<Building2 size={18} />}
          variant="blue"
          value={owned.length}
          label="Total properties"
          trend="Updated today"
          trendTone="green"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          variant="green"
          value={verified}
          label="Verified"
          trend="No change"
        />
        <StatCard
          icon={<Clock size={18} />}
          variant="amber"
          value={review}
          label="Under review"
          trend={review ? '1 since last week' : 'No change'}
          trendTone={review ? 'red' : 'muted'}
        />
        <StatCard
          icon={<MessageSquareWarning size={18} />}
          variant="red"
          value={open}
          label="Open reports"
          trend={open ? 'Response within 7 days' : 'Nothing pending'}
        />
      </div>

      <div className="bg-surface border border-line rounded-[14px] p-4 mt-4">
        <ProgressRing percentage={pct}>
          <div className="text-sm font-bold text-ink">Verification progress</div>
          <div className="text-xs text-ink-mid mt-1 max-w-[240px]">
            {pct}% of your properties are fully verified against the national 3D registry.
            {review > 0 && ' The rest are under surveyor review.'}
          </div>
        </ProgressRing>
      </div>

      <div className="flex items-center justify-between mt-6 mb-3">
        <h2 className="text-base font-bold text-ink">My Properties</h2>
        <Link to="/portal/records" className="text-xs font-semibold text-accent hover:underline">
          View Records
        </Link>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {owned.map((u) => (
          <TicketCard
            key={u.id}
            illustration={
              <div className="w-10 h-10 rounded-[10px] bg-bluebg text-blue grid place-items-center shrink-0">
                <Building size={18} />
              </div>
            }
            badgeVariant={u.status}
            badgeLabel={u.status}
            buildingName={u.building.name}
            unitLabel={`${u.unitLabel}, ${ordinal(u.floor)} floor`}
            metaText={`Updated · ${fmtDate(u.lastUpdated)}`}
            statusVariant={u.status}
            statusLabel={u.rightsType}
            accentColor={u.status === 'verified' ? '#3A9B6A' : '#E8A93A'}
            onClick={() => navigate(`/portal/passport/${u.id}`)}
          />
        ))}
      </div>

      <div className="bg-surface border border-line rounded-[14px] p-4 mt-4">
        <h3 className="text-sm font-bold text-ink mb-1">Recent Activity</h3>
        {activity.map((a, i) => (
          <MiniRow
            key={a.id}
            icon={actIcon[a.type] || actIcon.info}
            title={a.text}
            subtitle={fmtDate(a.date)}
            last={i === activity.length - 1}
          />
        ))}
      </div>
    </div>
  )
}