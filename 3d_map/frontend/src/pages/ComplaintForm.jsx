import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import Breadcrumb from '../components/ui/Breadcrumb.jsx'
import MiniRow from '../components/ui/MiniRow.jsx'
import StatusPill from '../components/ui/StatusPill.jsx'
import { addComplaint, complaints, getUnit } from '../mockData.js'

const ISSUE_TYPES = [
  'Boundary mismatch',
  'Area mismatch',
  'Wrong floor',
  'Ownership mismatch',
]

export default function ComplaintForm() {
  const { unitId } = useParams()
  const navigate = useNavigate()
  const unit = getUnit(unitId)
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState(null)

  if (!unit) {
    return (
      <div className="max-w-[640px]">
        <Breadcrumb current="Report Issue" />
        <div className="bg-surface border border-line rounded-[14px] p-6 text-sm text-ink-mid">
          Unit not found.{' '}
          <Link to="/portal/records" className="text-accent font-semibold">Back to records</Link>
        </div>
      </div>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please describe the issue before submitting.')
      return
    }
    const ticketId = addComplaint({ unitId: unit.id, issueType, description })
    navigate(`/portal/passport/${unit.id}`, {
      state: { toast: `Complaint ${ticketId} filed — the registry will respond within 7 days.` },
    })
  }

  return (
    <div className="max-w-[640px]">
      <Breadcrumb current="Report Issue" />
      <Link
        to={`/portal/passport/${unit.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mid hover:text-ink mb-2"
      >
        <ArrowLeft size={13} /> Back to passport
      </Link>
      <h1 className="text-xl font-extrabold text-ink">Report an Issue</h1>
      <p className="text-sm text-ink-mid mt-0.5 mb-4">
        {unit.unitLabel} · {unit.building.name} ·{' '}
        <span className="font-id">{unit.ulpin}</span>
      </p>

      <form onSubmit={submit} className="bg-surface border border-line rounded-[14px] p-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-ink-mid">Issue type</span>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="mt-1 w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block mt-3">
          <span className="text-[10px] uppercase tracking-wide text-ink-mid">Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setError(null)
            }}
            className="mt-1 w-full bg-page border border-line rounded-[10px] px-3 py-2.5 text-sm text-ink placeholder-ink-soft outline-none focus:border-accent resize-y"
            placeholder="Describe what does not match the record…"
          />
        </label>
        {error && <p className="text-xs text-accent mt-2">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full bg-accent text-white text-sm font-semibold rounded-[10px] px-4 py-2.5 hover:brightness-95"
        >
          Submit report
        </button>
      </form>

      <div className="bg-surface border border-line rounded-[14px] p-4 mt-4">
        <h3 className="text-sm font-bold text-ink mb-1">Your previous complaints</h3>
        {complaints.length === 0 && (
          <p className="text-sm text-ink-mid">Nothing reported yet.</p>
        )}
        {complaints.map((c, i) => {
          const u = getUnit(c.unitId)
          return (
            <MiniRow
              key={c.id}
              icon={
                c.status === 'resolved' ? (
                  <CheckCircle2 size={15} className="text-green" />
                ) : (
                  <Clock size={15} className="text-amber" />
                )
              }
              title={`${c.id} · ${c.issueType}`}
              subtitle={`${u ? u.unitLabel : c.unitId} · ${c.description}`}
              pill={
                <StatusPill variant={c.status === 'resolved' ? 'verified' : 'review'}>
                  {c.status}
                </StatusPill>
              }
              last={i === complaints.length - 1}
            />
          )
        })}
        <Link
          to="/portal/records"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          Browse records <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  )
}