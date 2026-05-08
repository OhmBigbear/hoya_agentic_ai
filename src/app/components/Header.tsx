import { Bell, ChevronDown, Settings, User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 h-16 bg-[#0f1623] border-b border-white/10 flex items-center justify-between px-6 transition-all duration-300 z-10"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-semibold text-white">
            Hoya MES – <span className="text-[#00d4ff]">Agentic AI</span>
          </h1>
        </div>
        <div className="h-6 w-px bg-white/10" />
        <Select defaultValue="rx1">
          <SelectTrigger className="w-64 bg-[#1e293b] border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="rx1" className="text-white">Rx1 Surfacing Automation Line</SelectItem>
            <SelectItem value="rx2" className="text-white">Rx2 Coating Line</SelectItem>
            <SelectItem value="rx3" className="text-white">Rx3 Assembly Line</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-md border border-white/10">
          <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
          <span className="text-xs text-slate-300">Live: Jan 7, 2026 • 14:32</span>
        </div>

        {/* Notification */}
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-[#1e293b]">
          <Bell className="w-5 h-5" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-[#1e293b]">
          <Settings className="w-5 h-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-[#1e293b]">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#00d4ff] text-[#0a0f1e] font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">John Doe</div>
                  <div className="text-xs text-slate-400">Production Engineer</div>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#1e293b] border-white/10">
            <DropdownMenuItem className="text-white hover:bg-[#334155]">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="text-white hover:bg-[#334155]">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}