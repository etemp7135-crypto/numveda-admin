'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CreditCard, Activity, Search, FileText, PieChart, LineChart, Target, Zap, Clock, Bell, HeartPulse, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Core Metrics', items: [
    { name: 'Executive Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Profit & Finance', path: '/finance', icon: PieChart },
  ]},
  { label: 'Analytics', items: [
    { name: 'Funnel Analytics', path: '/funnel', icon: Activity },
    { name: 'Q&A Analytics', path: '/questions', icon: Search },
    { name: 'Report Analytics', path: '/reports', icon: FileText },
    { name: 'Cohorts & Behavior', path: '/cohorts', icon: Target },
  ]},
  { label: 'Marketing & Traffic', items: [
    { name: 'Traffic & Attribution', path: '/traffic', icon: LineChart },
    { name: 'Meta Ads', path: '/meta-ads', icon: Zap },
  ]},
  { label: 'Operations', items: [
    { name: 'Razorpay Activity', path: '/razorpay', icon: CreditCard },
    { name: 'Order Explorer', path: '/orders', icon: Search },
  ]},
  { label: 'System', items: [
    { name: 'Live Activity', path: '/live', icon: Clock },
    { name: 'Reports & Alerts', path: '/alerts', icon: Bell },
    { name: 'Integration Health', path: '/health', icon: HeartPulse },
  ]}
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">N</div>
        <div>
          <div className="sidebar-logo-text">NumVeda Admin</div>
          <div className="sidebar-logo-sub">Business Intelligence</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 0' }}>
        {navItems.map((section, idx) => (
          <div key={idx} className="sidebar-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  <Icon className="icon" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <LogOut className="icon" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
