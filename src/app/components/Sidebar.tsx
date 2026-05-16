import { useState } from 'react';
import {
  LayoutDashboard,
  Factory,
  ClipboardList,
  BarChart3,
  Wrench,
  FileText,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Package,
  Boxes,
  TrendingUp,
  Users,
  AlertCircle,
  BookOpen,
  Cog,
  Database,
} from 'lucide-react';
import { cn } from '../components/ui/utils';

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  adminOnly?: boolean;
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Overview Dashboard', icon: LayoutDashboard, href: '#overview' },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Production Performance', icon: Factory, href: '#production-performance' },
      { label: 'Workorder Tracking', icon: ClipboardList, href: '#workorder-tracking' },
      { label: 'Station Analysis', icon: Activity, href: '#station-analysis' },
      { label: 'Shift / Operator Analysis', icon: Users, href: '#shift-operator-analysis' },
      { label: 'Scrap Analysis', icon: AlertCircle, href: '#scrap-analysis' },
    ],
  },
  {
    title: 'Maintenance',
    items: [
      { label: 'Station Maintenance Tracking', icon: Package, href: '#station-maintenance-tracking' },
      { label: 'Station Maintenance Analysis', icon: TrendingUp, href: '#station-maintenance-analysis' },
      { label: 'Cost & Spare Parts', icon: Boxes, href: '#maintenance-cost-spare-parts' },
      { label: 'Maintenance Knowledge Base', icon: BookOpen, href: '#maintenance-kb' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Production Performance Report', icon: FileText, href: '#production-report' },
      { label: 'Workorder Performance Report', icon: BarChart3, href: '#workorder-report' },
      { label: 'Maintenance Performance Report', icon: FileText, href: '#maintenance-report' },
    ],
  },
  {
    title: 'Engineering',
    items: [
      { label: 'Engineering Sandbox', icon: FlaskConical, href: '#engineering-sandbox' },
      { label: 'Raw Data Explorer', icon: Database, href: '#raw-data-explorer' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'System Configuration', icon: Settings, href: '#system-config' },
      { label: 'Agents Configuration', icon: Cog, href: '#agents-config' },
      { label: 'Production Flow Configuration', icon: Factory, href: '#production-flow-config' },
      { label: 'Agents Debug Log', icon: FileText, href: '#agents-debug-log' },
    ],
    adminOnly: true,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activePage: string;
  onNavigate: (href: string) => void;
}

export function Sidebar({ collapsed, onToggleCollapse, activePage, onNavigate }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('#overview');

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="text-sm font-semibold text-slate-100">Hoya Agentic AI</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors ml-auto"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Menu Groups */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/60 hover:scrollbar-thumb-slate-600/80 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/60 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
            {/* Group Title */}
            {!collapsed && (
              <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {group.title}
                </h3>
                {group.adminOnly && (
                  <span className="text-xs text-amber-400">(Admin only)</span>
                )}
              </div>
            )}

            {/* Group Items */}
            <ul className="space-y-1 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.href;

                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveItem(item.href);
                        onNavigate(item.href);
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm truncate">{item.label}</span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
