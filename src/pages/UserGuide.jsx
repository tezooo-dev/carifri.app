import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, LayoutDashboard, LayoutGrid, PlusCircle,
  Truck, Building2, MapPin, DollarSign, BarChart2, Bot, Settings,
  Users, ShieldCheck, UserCog, Search, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Zap, Globe, FileText, LifeBuoy,
} from 'lucide-react';

const CHAPTERS = [
  {
    id: 'getting-started',
    icon: Zap,
    color: 'bg-blue-50 text-blue-600',
    title: 'Getting Started',
    sections: [
      {
        title: 'Logging In',
        body: `Navigate to your FreightLink TMS URL and enter your email and password. Your session lasts 8 hours; use "Remember Me" (refresh token) to stay signed in for up to 30 days without re-entering credentials.\n\nDemo credentials:\n• Admin: admin@freightlink.co.ke / admin123\n• Operations: ops@freightlink.co.ke / ops123`,
      },
      {
        title: 'Understanding the Dashboard',
        body: `The Dashboard gives you a live snapshot of your brokerage:\n\n• KPI cards — active loads, carriers, monthly revenue, pending commissions\n• Load status breakdown — bar chart of Available / Booked / In Transit / Delivered\n• Recent loads table — last 10 loads with status badges\n• Quick-action buttons — Post Load, View Carriers, Open Tracking\n\nAll numbers are scoped to your current market (Kenya, India, Canada, US).`,
      },
      {
        title: 'Switching Markets',
        body: `FreightLink supports 4 markets, each with its own currency, cities, and carrier pool:\n\n🇰🇪 Kenya (KES)  🇮🇳 India (INR)  🇨🇦 Canada (CAD)  🇺🇸 USA (USD)\n\nTo switch: Settings → Market → select your market → Save. The entire platform — loads, carriers, shippers, reports — refreshes to show only that market's data.`,
      },
      {
        title: 'First-Time Setup Checklist',
        body: `Before going live, complete these steps:\n\n1. Settings → update company name, email, phone, commission rate\n2. Carriers → add your core carrier network\n3. Shippers → add your regular shippers\n4. Post Load → create your first test load\n5. User Management → invite your team and assign roles`,
      },
    ],
  },
  {
    id: 'load-board',
    icon: LayoutGrid,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Load Board',
    sections: [
      {
        title: 'Posting a Load',
        body: `Click Post Load in the sidebar or the top-right button.\n\nRequired fields:\n• Origin & Destination — city names in your market\n• Commodity — what's being shipped\n• Weight — in kg or lbs depending on market\n• Truck Type — Flatbed, Dry Van, Reefer, Tanker, etc.\n• Freight Amount — total rate for the haul\n\nOptional:\n• Shipper — link to an existing shipper record\n• Pickup & Delivery dates\n• Special instructions\n• Cargo insurance toggle`,
      },
      {
        title: 'Load Status Lifecycle',
        body: `Every load moves through these statuses:\n\nAvailable → (carrier bids or direct assign) → Booked → (mark pickup) → In Transit → (mark delivered) → Delivered\n\nSpecial statuses:\n• Bidding — one or more carriers have submitted bids, waiting for acceptance\n• Cancelled — load was cancelled before completion\n\nTransitions are triggered by action buttons on each load card.`,
      },
      {
        title: 'Carrier Bidding System',
        body: `FreightLink includes a built-in bidding system inspired by DAT, Truckstop, and uShip:\n\n1. When a carrier submits a bid, the load status changes to "Bidding" (violet badge)\n2. All bids are shown sorted lowest-first — the cheapest bid is highlighted in green\n3. Click Accept Bid to assign that carrier and reject all other bids automatically\n4. The load immediately moves to "Booked"\n\nCarriers can also withdraw their own bids before acceptance.`,
      },
      {
        title: 'Direct Carrier Assignment',
        body: `Skip bidding and assign a carrier directly:\n\n1. On an Available load card, click Assign Carrier\n2. Choose a carrier from the dropdown (filtered by your market)\n3. Click Confirm — load moves to Booked immediately\n\nThis is ideal when you have a preferred carrier for a lane or a negotiated rate.`,
      },
      {
        title: 'Filtering Loads',
        body: `Use the status tab pills at the top of the Load Board to filter:\n\nAll · Available · Bidding · Booked · In Transit · Delivered · Cancelled\n\nEach tab shows a count badge. Click any tab to show only those loads.`,
      },
    ],
  },
  {
    id: 'carriers',
    icon: Truck,
    color: 'bg-amber-50 text-amber-600',
    title: 'Carrier Management',
    sections: [
      {
        title: 'Adding a Carrier (Admin only)',
        body: `Go to Carriers → Add Carrier.\n\nRequired: Name, primary contact name, phone number.\nOptional: Email, location/city, truck types (multi-select), truck count, initial rating.\n\nThe carrier is saved to your current market and appears in the carrier list immediately.`,
      },
      {
        title: 'Carrier Detail Drawer — 5 Tabs',
        body: `Click Manage on any carrier card to open the full detail drawer:\n\n1. Overview — basic profile, truck types, ratings, performance stats, load history\n2. Contacts — add multiple contacts with name, role, phone, and email\n3. Contracts — add/edit contracts with start/end dates, rate details, and terms\n4. Insurance — track insurance policies with provider, policy number, coverage amount, expiry\n5. EDI — EDI partner ID, ISA qualifier, sender/receiver codes, version (X12/EDIFACT), test mode toggle`,
      },
      {
        title: 'Verifying Carriers',
        body: `Admin users can toggle carrier verification status by clicking the Verify/Unverify button on a carrier card.\n\nVerified carriers:\n• Display a green "Verified" badge\n• Are prioritised in AI Dispatch recommendations\n• Appear first in assignment dropdowns\n\nVerify a carrier after checking their insurance, licence, and safety records.`,
      },
      {
        title: 'Carrier Performance',
        body: `The Overview tab of the carrier drawer shows:\n• Total loads completed\n• Star rating (1–5)\n• Load history filtered to that carrier\n\nRatings are manually set when adding or editing the carrier. Future versions will support automatic rating based on on-time delivery percentage.`,
      },
    ],
  },
  {
    id: 'tracking',
    icon: MapPin,
    color: 'bg-violet-50 text-violet-600',
    title: 'Live Tracking',
    sections: [
      {
        title: 'The Tracking Map',
        body: `The Tracking page shows all In Transit loads on an interactive OpenStreetMap.\n\n• Blue markers = origin cities\n• Red markers = destination cities  \n• Orange truck markers = estimated current truck position\n\nClick any marker to see a popup with load ID, route, carrier, commodity, and pickup date.`,
      },
      {
        title: 'How Position is Calculated',
        body: `FreightLink interpolates the truck's position between origin and destination based on elapsed time since the pickup date.\n\nIf a load was picked up 2 days ago and the expected delivery is in 4 days total, the truck is shown at roughly 50% of the route.\n\nThis is an estimated position — for real-time GPS accuracy, integrate your carrier's GPS provider via the API.`,
      },
      {
        title: 'FitBounds and Navigation',
        body: `When you load the Tracking page, the map automatically fits to show all active load markers.\n\nUse the Show/Hide Map toggle to switch between map view and a compact list view of all In Transit loads. The list view shows load ID, route, carrier, and estimated position percentage.`,
      },
    ],
  },
  {
    id: 'finance',
    icon: DollarSign,
    color: 'bg-teal-50 text-teal-600',
    title: 'Finance',
    sections: [
      {
        title: 'Commission Tracking',
        body: `FreightLink tracks broker commissions automatically.\n\nFor each load:\n• Freight Amount — the full rate paid by the shipper\n• Commission — calculated as commission_rate% × freight_amount (set in Settings)\n• Advance — any advance paid to the carrier\n• Net — freight amount minus advance\n\nToggle "Commission Received" on a delivered load to mark the commission as collected.`,
      },
      {
        title: 'Finance Dashboard',
        body: `The Finance page shows:\n• Total revenue (all delivered loads)\n• Commissions earned (received) vs pending (not yet received)\n• Advances paid to carriers\n• Monthly trend charts\n• Per-load financial breakdown table`,
      },
      {
        title: 'Currency by Market',
        body: `Each market uses its own currency:\n• 🇰🇪 Kenya — KES (Kenyan Shilling)\n• 🇮🇳 India — INR (Indian Rupee)\n• 🇨🇦 Canada — CAD (Canadian Dollar)\n• 🇺🇸 USA — USD (US Dollar)\n\nAll amounts are displayed and exported in the market's local currency.`,
      },
    ],
  },
  {
    id: 'reports',
    icon: BarChart2,
    color: 'bg-rose-50 text-rose-600',
    title: 'Reports',
    sections: [
      {
        title: 'Available Report Sections',
        body: `The Reports page contains multiple sections:\n\n• Summary KPIs — total loads, revenue, commissions, active carriers\n• Load Status Breakdown — counts and percentages per status\n• Weekly Load Volume — bar chart of loads created per week\n• Carrier Performance Rankings — loads completed per carrier\n• Commodity Breakdown — top commodities by load count\n• Full Load Table — every load with all details`,
      },
      {
        title: 'Filtering Reports',
        body: `Use the filter panel at the top of Reports:\n\n• Status — filter by load status\n• Carrier — filter by specific carrier\n• Commodity — filter by commodity type\n• Date Range — from/to date picker\n\nAll report sections update simultaneously when filters are applied.`,
      },
      {
        title: 'Exporting Reports',
        body: `Each report section has an Export menu (⬇ button):\n\n• CSV — downloads a .csv file instantly\n• Excel — downloads a .xlsx file (requires xlsx package installed)\n• Email — opens your default email client with the report data pre-populated in the email body\n\nExports are filtered by your current filter selection.`,
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart2,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Analytics',
    sections: [
      {
        title: 'What Gets Tracked',
        body: `FreightLink automatically tracks user activity within the platform:\n\n• Page views — every time a user navigates to a page\n• Feature usage — loads posted, carriers added, bids submitted, reports exported\n• User actions — login, logout, settings changes\n\nAll data is stored internally in your database. No data is sent to third-party analytics services.`,
      },
      {
        title: 'Analytics Dashboard',
        body: `Admin users can view usage analytics from the Dashboard.\n\nMetrics shown:\n• Active users in the last 30 days\n• Total events fired\n• Daily active user trend chart\n• Top pages by view count\n• Feature usage breakdown by category\n• Recent event log`,
      },
      {
        title: 'Privacy & Data Retention',
        body: `Analytics events are retained for 90 days rolling, then automatically deleted.\n\nNo personal data beyond user ID is stored in analytics events. All analytics data is scoped to your market and only accessible to admin users.`,
      },
    ],
  },
  {
    id: 'users',
    icon: Users,
    color: 'bg-orange-50 text-orange-600',
    title: 'User Management',
    sections: [
      {
        title: 'Two Roles Explained',
        body: `FreightLink has two roles:\n\n🔵 Admin — full access:\n• Create, edit, delete users\n• Add / remove / verify carriers\n• Edit company settings\n• All pages and features\n\n🟢 Operations — day-to-day access:\n• Load board (post, bid, assign, track)\n• Carrier view + contracts, insurance, EDI editing\n• Shippers (view only)\n• Reports, Finance, Tracking, AI Dispatch, Help\n• Cannot add/remove carriers or manage users`,
      },
      {
        title: 'Creating a User (Admin only)',
        body: `Go to User Management → Add User.\n\n1. Enter full name and email address\n2. Set a temporary password (user should change on first login)\n3. Select role: Admin or Operations\n4. Select market\n5. Click Create User\n\nThe user can log in immediately with the credentials you set.`,
      },
      {
        title: 'Editing and Removing Users',
        body: `Click the pencil icon on any user row to edit:\n• Name, email, role, market\n• Reset password by entering a new one (leave blank to keep existing)\n\nClick the trash icon to delete a user. Deleting a user:\n• Removes their account permanently\n• Revokes all active sessions immediately\n• Cannot be undone\n\nYou cannot delete your own account.`,
      },
    ],
  },
  {
    id: 'ai',
    icon: Bot,
    color: 'bg-pink-50 text-pink-600',
    title: 'AI Dispatch',
    sections: [
      {
        title: 'What AI Dispatch Does',
        body: `The AI Dispatch assistant helps you make smarter decisions faster:\n\n• Load matching — suggests the best available carriers for a new load based on truck type, location, rating, and availability\n• Rate guidance — provides benchmark freight rates for common lanes in your market\n• Route optimisation — identifies multi-stop or return-load opportunities\n• Anomaly detection — flags loads that are overdue for pickup or delivery`,
      },
      {
        title: 'Using the AI Assistant',
        body: `Navigate to AI Dispatch in the sidebar.\n\nType your question in natural language, for example:\n• "Which carriers are best for a Nairobi → Mombasa reefer load?"\n• "What's the typical rate for Mumbai → Delhi dry van, 20 tonnes?"\n• "Show me all loads that are overdue for delivery"\n\nThe assistant responds with data-driven recommendations based on your carrier network and load history.`,
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    color: 'bg-slate-100 text-slate-600',
    title: 'Settings',
    sections: [
      {
        title: 'Company Settings (Admin only)',
        body: `Settings → Company tab:\n\n• Company Name — appears in reports, exports, and the sidebar\n• Phone & Email — used in exported documents\n• Commission Rate (%) — default broker commission applied to new loads\n\nClick Save to apply changes.`,
      },
      {
        title: 'Market Settings',
        body: `Settings → Market tab:\n\nSelect your active market from the 4 flag cards (Kenya, India, Canada, USA).\n\nChanging market will:\n• Update the currency and country displayed throughout the platform\n• Show only loads, carriers, and shippers for that market\n• Update commission calculations to the new market's rates\n\nNote: Changing market does not delete any data — all market data is preserved.`,
      },
    ],
  },
  {
    id: 'faq',
    icon: LifeBuoy,
    color: 'bg-cyan-50 text-cyan-600',
    title: 'FAQ & Troubleshooting',
    sections: [
      {
        title: 'I cannot see the Add Carrier button',
        body: `The Add Carrier button is only visible to Admin users. If you are logged in as an Operations user, you can view carriers and edit their details (contracts, insurance, EDI) but cannot add or remove carriers.\n\nAsk your admin to add the carrier, or ask them to upgrade your role to Admin.`,
      },
      {
        title: 'The map is not showing trucks',
        body: `Trucks only appear on the tracking map when loads are in "In Transit" status.\n\nIf you see no trucks:\n1. Check that you have loads with "In Transit" status\n2. Ensure the load has a valid origin and destination (must match known city names)\n3. Try clicking the "Fit All" button to re-centre the map\n4. Toggle Show/Hide Map to refresh the map view`,
      },
      {
        title: 'Exports are not working',
        body: `For CSV exports — these work in all browsers and require no setup.\n\nFor Excel (.xlsx) exports — requires the xlsx package to be installed on the server:\n  npm install xlsx\n\nFor Email exports — the email opens in your default email client. If nothing opens, check that you have a default email application set on your device.`,
      },
      {
        title: 'Session keeps expiring',
        body: `FreightLink access tokens expire after 8 hours. The app automatically refreshes your session silently in the background using a 30-day refresh token stored in your browser's localStorage.\n\nIf you are repeatedly logged out:\n1. Check that your browser allows localStorage (not in private/incognito mode)\n2. Clear your browser cache and log in again\n3. Check that your system clock is correct (token validation is time-sensitive)`,
      },
      {
        title: 'How do I add a second market?',
        body: `Each user account is tied to one market at a time. To operate in multiple markets:\n\n1. Create separate user accounts for each market (Admin → User Management)\n2. Or use the market switcher in Settings to switch between markets as needed\n\nAll data is market-scoped. Switching markets changes your view without affecting other markets' data.`,
      },
    ],
  },
];

function ChapterNav({ chapters, activeId, onSelect }) {
  return (
    <nav className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-0.5">
        {chapters.map(c => {
          const Icon = c.icon;
          const active = c.id === activeId;
          return (
            <button key={c.id} onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}>
              <Icon size={15}/>{c.title}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AccordionSection({ section, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-800 text-sm">{section.title}</span>
        {open ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white border-t border-slate-100">
          <div className="mt-3 text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.body}</div>
        </div>
      )}
    </div>
  );
}

export default function UserGuide() {
  const [activeChapter, setActiveChapter] = useState('getting-started');
  const [search, setSearch] = useState('');

  const chapter = CHAPTERS.find(c => c.id === activeChapter) || CHAPTERS[0];
  const Icon = chapter.icon;

  const filteredChapters = search.trim()
    ? CHAPTERS.map(c => ({
        ...c,
        sections: c.sections.filter(s =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.body.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(c => c.sections.length > 0)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors shrink-0">
            <ArrowLeft size={16}/> Back
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">FL</div>
            <span className="font-bold text-slate-800 text-sm hidden sm:block">FreightLink TMS</span>
            <span className="text-slate-300 hidden sm:block">·</span>
            <span className="text-slate-500 text-sm hidden sm:block">User Guide</span>
          </div>
          {/* Search */}
          <div className="flex-1 max-w-sm relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search the guide…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"/>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-4">
            <BookOpen size={12}/> Complete User Guide
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">FreightLink TMS Documentation</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Everything you need to master every feature of the platform — from posting your first load to enterprise carrier contracts.
          </p>
        </div>

        {/* Search results */}
        {search.trim() && filteredChapters ? (
          <div className="space-y-8">
            {filteredChapters.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Search size={32} className="mx-auto mb-3 opacity-30"/>
                <p>No results for "{search}"</p>
              </div>
            ) : filteredChapters.map(c => {
              const CIcon = c.icon;
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.color}`}><CIcon size={14}/></div>
                    <h2 className="font-bold text-slate-800">{c.title}</h2>
                  </div>
                  <div className="space-y-2">
                    {c.sections.map(s => <AccordionSection key={s.title} section={s} defaultOpen/>)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Normal chapter view */
          <div className="flex gap-8">
            <ChapterNav chapters={CHAPTERS} activeId={activeChapter} onSelect={setActiveChapter}/>

            <div className="flex-1 min-w-0">
              {/* Mobile chapter select */}
              <div className="lg:hidden mb-4">
                <select value={activeChapter} onChange={e => setActiveChapter(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CHAPTERS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* Chapter header */}
              <div className={`rounded-2xl p-6 mb-6 flex items-center gap-4 ${chapter.color.replace('text-','bg-').split(' ')[0]} bg-opacity-30`}
                style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${chapter.color}`}>
                  <Icon size={22}/>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{chapter.title}</h2>
                  <p className="text-slate-500 text-sm mt-0.5">{chapter.sections.length} section{chapter.sections.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-2">
                {chapter.sections.map((s, i) => (
                  <AccordionSection key={s.title} section={s} defaultOpen={i === 0}/>
                ))}
              </div>

              {/* Chapter navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                {(() => {
                  const idx = CHAPTERS.findIndex(c => c.id === activeChapter);
                  const prev = CHAPTERS[idx - 1];
                  const next = CHAPTERS[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => setActiveChapter(prev.id)}
                          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
                          ← {prev.title}
                        </button>
                      ) : <div/>}
                      {next && (
                        <button onClick={() => setActiveChapter(next.id)}
                          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
                          {next.title} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-xs text-slate-400 border-t border-slate-200 mt-6">
        © {new Date().getFullYear()} FreightLink TMS ·&nbsp;
        <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
        &nbsp;·&nbsp;
        <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
        &nbsp;·&nbsp;
        <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
      </footer>
    </div>
  );
}
