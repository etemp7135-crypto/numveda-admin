import Sidebar from '@/components/Sidebar';
import '@/app/globals.css';
import { Menu } from 'lucide-react';

import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="admin-layout">
      <input type="checkbox" id="sidebar-toggle" hidden />
      <label htmlFor="sidebar-toggle" className="sidebar-overlay"></label>
      <Sidebar />
      <main className="main-content">
        <div className="mobile-header">
          <label htmlFor="sidebar-toggle" className="mobile-menu-btn">
            <Menu size={24} />
          </label>
          <div className="mobile-logo">NumVeda Admin</div>
        </div>
        {children}
      </main>
    </div>
  );
}
