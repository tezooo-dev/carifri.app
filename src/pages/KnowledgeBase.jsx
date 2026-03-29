import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen, Truck, DollarSign,
  BarChart2, Settings, Bot, Globe, Shield, Package, MapPin, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MARKETS } from '../data/markets';

const KB = [
  {
    id: 'getting-started',
    icon: BookOpen,
    color: 'blue',
    title: 'Getting Started',
    articles: [
      {
        title: 'Platform overview',
        body: `FreightLink is a multi-market freight brokerage platform supporting Kenya, India, Canada, and the United States. You can manage the full freight lifecycle — posting loads, assigning carriers, live tracking, and commission collection — from a single dashboard.

Key concepts:
• Market — your active region (Kenya 🇰🇪 / India 🇮🇳 / Canada 🇨🇦 / US 🇺🇸). All data is scoped to your selected market.
• Load — a freight order from shipper to destination, with commodity, weight, and truck type.
• Carrier — the trucking company that transports the load.
• Commission — FreightLink earns a percentage of the freight amount (configurable in Settings).`,
      },
      {
        title: 'Logging in',
        body: `Use one of the demo accounts to log in:

🇰🇪 Kenya Admin:   admin@freightlink.co.ke  /  admin123
🇮🇳 India Admin:   admin@freightlink.in     /  admin123
🇨🇦 Canada Admin:  admin@freightlink.ca     /  admin123
🇺🇸 US Admin:      admin@freightlink.us     /  admin123

Dispatcher role:  dispatcher@freightlink.co.ke  /  dispatch123
Finance role:     finance@freightlink.co.ke     /  finance123

Sessions are restored automatically via a 30-day refresh token — you stay logged in across browser restarts.`,
      },
      {
        title: 'Switching markets',
        body: `Navigate to Settings → Market. Click any market card to switch. The platform will immediately reload all loads, carriers, and shippers for that market, with market-specific currencies, city lists, and truck types.

Each market has its own:
• Currency and symbol (KES / INR / CAD / USD)
• Cities and freight routes
• Truck type catalog
• Regulatory context
• Payment method (M-Pesa, UPI, EFT, ACH)`,
      },
    ],
  },
  {
    id: 'loads',
    icon: Package,
    color: 'emerald',
    title: 'Managing Loads',
    articles: [
      {
        title: 'Posting a new load',
        body: `Go to Post Load from the sidebar or the + Post Load button in the header.

Fill in:
1. Origin & Destination — city names from your active market
2. Commodity & Truck Type — select from the market's catalog
3. Weight (kg) and Pickup / Delivery dates
4. Freight Amount — the rate agreed with the shipper
5. Commission is auto-calculated at your configured rate (default 8%)
6. Advance payment amount (optional)
7. Cargo Insurance toggle
8. Special Instructions — visible to dispatchers and carriers

The load is created in Available status. You can search for it immediately in the Load Board.`,
      },
      {
        title: 'Load lifecycle',
        body: `Every load moves through these statuses:

Available → a carrier hasn't been assigned yet
Booked    → a carrier is assigned; awaiting pickup
In Transit → cargo picked up, en route
Delivered  → cargo delivered at destination
Cancelled  → load cancelled before delivery

Transitions:
• Assign Carrier    — Load Board → Assign button
• Mark Picked Up    — Tracking page or Load Board
• Mark Delivered    — Tracking page or Load Board
• Cancel Load       — Load Board → Cancel button`,
      },
      {
        title: 'Assigning carriers',
        body: `From the Load Board, click Assign on any Available load. A carrier selection dialog appears showing verified carriers in your market. You can filter by truck type compatibility.

Once assigned:
• Load status changes to Booked
• A notification is fired
• The carrier appears in Live Tracking`,
      },
    ],
  },
  {
    id: 'carriers',
    icon: Truck,
    color: 'amber',
    title: 'Carrier Management',
    articles: [
      {
        title: 'Adding a carrier',
        body: `Go to Carriers → Add Carrier. Provide:
• Company name, contact name, phone, email
• Base location (city in your market)
• Truck types they operate
• Fleet size (number of trucks)

Newly added carriers start as Unverified. Verify them once you've completed due diligence (insurance, licence checks).`,
      },
      {
        title: 'Verifying carriers',
        body: `Verification is a manual trust badge. Click the Verify toggle on any carrier card. Verified carriers show a ✓ badge and appear first in the assign-carrier dialog.

Best practice: only verify carriers after confirming:
• Valid operating licence
• Insurance certificate on file
• At least one completed load with no issues`,
      },
      {
        title: 'Carrier ratings',
        body: `Each carrier has a star rating (1–5). The seed data starts with historical ratings. Future versions will auto-calculate ratings from on-time delivery performance. For now, you can set the rating manually when adding or editing a carrier.`,
      },
    ],
  },
  {
    id: 'tracking',
    icon: MapPin,
    color: 'indigo',
    title: 'Live Tracking',
    articles: [
      {
        title: 'Using the tracking map',
        body: `The Tracking page uses OpenStreetMap (free, no API key required) via Leaflet.

The map shows:
• Blue pin  — origin city
• Green pin — destination city
• 🚛 icon   — truck's estimated position along the route

The truck position is interpolated based on how many timeline steps are complete. It's a straight-line approximation — in production this would use real GPS data from driver apps.

Toggle Show/Hide Map using the button in the top-right of the Tracking page.`,
      },
      {
        title: 'Updating shipment status',
        body: `From the Tracking page, select a load from the left panel.

Available actions appear at the bottom of the detail view:
• Mark Picked Up  — moves to In Transit, advances map truck position
• Mark Delivered  — completes the shipment
• WhatsApp Update — opens WhatsApp with a pre-filled message to the driver

You can also call the driver directly via the Call button.`,
      },
    ],
  },
  {
    id: 'finance',
    icon: DollarSign,
    color: 'green',
    title: 'Finance & Commissions',
    articles: [
      {
        title: 'Understanding commissions',
        body: `Commission = Freight Amount × Commission Rate (default 8%).

You can change the rate in Settings → Commission Rate. The change applies to new loads only; existing loads keep their original commission values.

Finance page shows:
• Total Freight — sum of all non-cancelled loads
• Total Commission — sum of all commissions
• Received — commissions marked as collected
• Pending — commissions not yet collected`,
      },
      {
        title: 'Collecting commissions (Kenya — M-Pesa)',
        body: `On the Finance page, click M-Pesa next to any Delivered load.

1. Enter the shipper's M-Pesa registered phone number
2. Click Send STK Push — an M-Pesa prompt is simulated
3. On success: commission is auto-marked as received and a notification fires

The M-Pesa integration is currently simulated (90% success rate). In production, wire it to the Safaricom Daraja API.`,
      },
      {
        title: 'Collecting commissions (India — UPI)',
        body: `India market uses UPI / NEFT / RTGS. The Manual button on the Finance page lets you mark commission as received after confirming payment outside the system.

Future integration: Razorpay or Cashfree payment gateway for automated UPI collection.`,
      },
      {
        title: 'Collecting commissions (Canada/US — Wire)',
        body: `Canada and US use EFT / ACH / Wire Transfer. Use the Manual button to mark commission received after the wire clears.

Future integration: Stripe or Plaid for ACH collection.`,
      },
      {
        title: 'Exporting to CSV',
        body: `Finance page → Export CSV. Downloads a spreadsheet with:
Load ID, Route, Commodity, Freight Amount, Commission, Status, Commission Received.

Use this for reconciliation with your accounting software (QuickBooks, Xero, Tally).`,
      },
    ],
  },
  {
    id: 'reports',
    icon: BarChart2,
    color: 'purple',
    title: 'Reports & Analytics',
    articles: [
      {
        title: 'Reports overview',
        body: `The Reports page provides analytics for the last 8 weeks:

Charts:
• Weekly Commission — bar chart of commission earned per week
• Weekly Load Volume — bar chart of loads posted per week

Rankings:
• Top Routes by volume
• Top Carriers by loads completed
• Revenue by Commodity

All data is scoped to your active market.`,
      },
      {
        title: 'Interpreting the data',
        body: `The 8-week charts use a rolling window ending today. They combine real loads from the database with synthetic historical data so the charts are never empty on a fresh install.

Top routes and carriers are ranked by count of delivered loads. Revenue by commodity sums freight amounts across all non-cancelled loads per commodity type.`,
      },
    ],
  },
  {
    id: 'ai',
    icon: Bot,
    color: 'violet',
    title: 'AI Dispatch Co-pilot',
    articles: [
      {
        title: 'Setting up the AI co-pilot',
        body: `The AI Dispatch page uses Claude (claude-opus-4-6) to help you make dispatch decisions.

Setup:
1. Get an API key from console.anthropic.com
2. Create a .env file in the project root:
   VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
3. Restart the dev server

⚠️ Note: this runs in the browser with dangerouslyAllowBrowser: true. For production, proxy requests through your backend server.`,
      },
      {
        title: 'Example AI prompts',
        body: `The AI has full context of your live loads and carriers. Try:

• "Which carrier should I assign to FL-004?"
• "Show me all loads that need attention today"
• "What's our commission collection rate this week?"
• "Suggest the best route for a 20T steel shipment from Mumbai to Delhi"
• "Which carriers haven't been used in the last 2 weeks?"
• "What's the average freight rate for Nairobi–Mombasa runs?"

The AI uses your real data to give contextual answers.`,
      },
    ],
  },
  {
    id: 'markets',
    icon: Globe,
    color: 'teal',
    title: 'Market Guides',
    articles: [
      {
        title: 'Kenya market guide 🇰🇪',
        body: `Currency: KES (Kenyan Shilling)
Payment: M-Pesa (STK Push) / Bank Transfer
Key cities: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret

Regulatory notes:
• NTSA (National Transport and Safety Authority) regulates all freight vehicles
• C-Force permits required for oversize loads
• Maximum axle loads enforced on A-class highways
• KEBS standards apply for cross-border commodities

Typical rates: Nairobi–Mombasa ~KES 120,000–200,000 for 20T+`,
      },
      {
        title: 'India market guide 🇮🇳',
        body: `Currency: INR (Indian Rupee)
Payment: UPI / NEFT / RTGS / Cheque
Key cities: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune

Regulatory notes:
• GST e-Invoice required for B2B freight above ₹5 Cr turnover
• e-Way Bill mandatory for goods movement >50km or >₹50,000 value
• Fastag mandatory on all national highways (toll collection)
• Overloading strictly penalised under MV Act
• Permit required for inter-state movement of some commodities

Typical rates: Delhi–Mumbai ~₹40,000–70,000 for a 16T HCV`,
      },
      {
        title: 'Canada market guide 🇨🇦',
        body: `Currency: CAD (Canadian Dollar)
Payment: EFT / Wire Transfer / Cheque
Key cities: Toronto, Montreal, Vancouver, Calgary, Edmonton

Regulatory notes:
• Hours of Service (HOS): max 13h driving, 14h on-duty in a 24h period
• Electronic Logging Device (ELD) mandate for commercial vehicles
• CVOR (Commercial Vehicle Operator's Registration) required in Ontario
• Oversize loads need MTO permits; pilot cars required >4.9m wide
• Cross-border Canada-US requires BOL, customs invoice, PARS/PAPS

Typical rates: Toronto–Montreal ~CA$700–1,200 for a 20T shipment`,
      },
      {
        title: 'United States market guide 🇺🇸',
        body: `Currency: USD (US Dollar)
Payment: ACH / Wire Transfer / Check / Credit Card / Factoring
Key cities: Chicago, Los Angeles, New York, Dallas, Houston, Atlanta

Regulatory notes:
• FMCSA (Federal Motor Carrier Safety Administration) governs all interstate freight
• ELD mandate: electronic logging devices required for all CDL drivers
• HOS (Hours of Service): 11h driving / 14h on-duty; 10h mandatory rest
• HAZMAT shipments: PHMSA placarding, CDL-H endorsement required
• Broker bond requirement: $75,000 BMC-84 or trust fund
• DAT / Truckstop load boards are widely used for spot rates

Typical rates (spot): LA–Chicago dry van ~$2,000–4,500 (rate/mile ~$1.80–2.50)`,
      },
    ],
  },
  {
    id: 'compliance',
    icon: Shield,
    color: 'rose',
    title: 'Compliance & Security',
    articles: [
      {
        title: 'Authentication & sessions',
        body: `FreightLink uses JWT (JSON Web Tokens) for authentication:
• Access token: 8-hour lifespan, stored in browser memory
• Refresh token: 30-day lifespan, stored in localStorage as fl_refresh

On every page load, the app silently exchanges the refresh token for a new access token. If the refresh token expires, you are redirected to /login.

User roles: Admin, Dispatcher, Finance. All roles currently have full access — role-based access control (RBAC) can be layered on top.`,
      },
      {
        title: 'Data storage',
        body: `All application data is stored in a SQLite database (server/data/freightlink.db). This is a file-based database suitable for development and small production deployments.

For production at scale, migrate to PostgreSQL or MySQL using the same schema. The backend uses raw SQL (no ORM) so migration is straightforward.

Backups: copy the .db file. For PostgreSQL, use pg_dump.`,
      },
    ],
  },
];

const COLORS = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200'   },
  emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-200'},
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200'  },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-200'   },
  rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   border: 'border-rose-200'   },
};

function ArticleItem({ article }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <span className="text-sm font-medium text-slate-800">{article.title}</span>
        {open ? <ChevronDown size={16} className="text-slate-400 shrink-0"/> : <ChevronRight size={16} className="text-slate-400 shrink-0"/>}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-line leading-relaxed border-t border-slate-100">
          <div className="pt-3">{article.body}</div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const { settings } = useApp();
  const [query,       setQuery]       = useState('');
  const [activeSection, setActiveSection] = useState(null);

  const mkt = MARKETS[settings.market] || MARKETS.kenya;

  const filtered = KB.map(section => ({
    ...section,
    articles: query
      ? section.articles.filter(a =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.body.toLowerCase().includes(query.toLowerCase()))
      : section.articles,
  })).filter(s => s.articles.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {mkt.flag} {mkt.name} · Guides, how-tos, and market-specific references
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search articles, topics, or market guides…"
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-4">
            {KB.map(section => {
              const c = COLORS[section.color];
              const Icon = section.icon;
              return (
                <button key={section.id}
                  onClick={() => {
                    setActiveSection(activeSection === section.id ? null : section.id);
                    document.getElementById(`kb-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium border-b border-slate-100 last:border-0 transition-colors
                    ${activeSection === section.id ? `${c.bg} ${c.text}` : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Icon size={15}/>
                  {section.title}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-8">
          {filtered.map(section => {
            const c = COLORS[section.color];
            const Icon = section.icon;
            return (
              <div key={section.id} id={`kb-${section.id}`}>
                <div className={`flex items-center gap-2.5 mb-4 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} ${c.text} border ${c.border}`}>
                    <Icon size={16}/>
                  </div>
                  <h2 className={`font-bold text-base ${c.text}`}>{section.title}</h2>
                  <span className="ml-auto text-xs text-slate-400">{section.articles.length} articles</span>
                </div>
                <div className="space-y-2">
                  {section.articles.map((a, i) => <ArticleItem key={i} article={a}/>)}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <BookOpen size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No articles found for "{query}"</p>
              <button onClick={() => setQuery('')} className="text-blue-600 text-sm mt-2 hover:underline">Clear search</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
