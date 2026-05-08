import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gauge,
  Package,
  Activity,
  ThermometerSun,
  Zap,
  Wind,
  Droplets,
  Target,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, Cell } from 'recharts';

interface ScrapAnalysisProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// Mock data for parameter trends
const temperatureData = [
  { time: '00:00', value: 68, normal: 70, scrap: 0 },
  { time: '02:00', value: 72, normal: 70, scrap: 1 },
  { time: '04:00', value: 71, normal: 70, scrap: 0 },
  { time: '06:00', value: 75, normal: 70, scrap: 3 },
  { time: '08:00', value: 78, normal: 70, scrap: 5 },
  { time: '10:00', value: 76, normal: 70, scrap: 4 },
  { time: '12:00', value: 73, normal: 70, scrap: 2 },
  { time: '14:00', value: 71, normal: 70, scrap: 1 },
];

const spindleSpeedData = [
  { time: '00:00', value: 2200, normal: 2100, scrap: 0 },
  { time: '02:00', value: 2150, normal: 2100, scrap: 1 },
  { time: '04:00', value: 2100, normal: 2100, scrap: 0 },
  { time: '06:00', value: 2250, normal: 2100, scrap: 3 },
  { time: '08:00', value: 2350, normal: 2100, scrap: 5 },
  { time: '10:00', value: 2300, normal: 2100, scrap: 4 },
  { time: '12:00', value: 2180, normal: 2100, scrap: 2 },
  { time: '14:00', value: 2120, normal: 2100, scrap: 1 },
];

const parameterSensitivityData = [
  { parameter: 'Temperature', impact: 85, risk: 'High' },
  { parameter: 'Spindle Speed', impact: 78, risk: 'High' },
  { parameter: 'Feed Rate', impact: 62, risk: 'Medium' },
  { parameter: 'Pressure', impact: 48, risk: 'Medium' },
  { parameter: 'Chemical Conc.', impact: 35, risk: 'Low' },
  { parameter: 'Material Thick.', impact: 28, risk: 'Low' },
];

const scrapByProcessData = [
  { process: 'AUTO TAPING', scrap: 12, total: 2400, rate: 0.5 },
  { process: 'ALLOY BLOCKING', scrap: 8, total: 2388, rate: 0.33 },
  { process: 'CURVE GEN', scrap: 45, total: 2380, rate: 1.89 },
  { process: 'POLISHING', scrap: 28, total: 2335, rate: 1.2 },
  { process: 'LASER ENGR', scrap: 15, total: 2307, rate: 0.65 },
  { process: 'UNBLOCKING', scrap: 6, total: 2292, rate: 0.26 },
];

const scrapTrendData = [
  { shift: 'Day-3', scrap: 2.1, target: 1.5 },
  { shift: 'Night-3', scrap: 1.8, target: 1.5 },
  { shift: 'Day-2', scrap: 2.4, target: 1.5 },
  { shift: 'Night-2', scrap: 2.2, target: 1.5 },
  { shift: 'Day-1', scrap: 2.8, target: 1.5 },
  { shift: 'Night-1', scrap: 2.5, target: 1.5 },
  { shift: 'Day-Now', scrap: 3.2, target: 1.5 },
];

const parameterScatterData = [
  { temp: 68, speed: 2050, scrap: 0 },
  { temp: 70, speed: 2100, scrap: 0 },
  { temp: 72, speed: 2150, scrap: 1 },
  { temp: 71, speed: 2120, scrap: 0 },
  { temp: 75, speed: 2250, scrap: 3 },
  { temp: 78, speed: 2350, scrap: 5 },
  { temp: 76, speed: 2300, scrap: 4 },
  { temp: 73, speed: 2180, scrap: 2 },
  { temp: 77, speed: 2320, scrap: 4 },
  { temp: 74, speed: 2220, scrap: 2 },
  { temp: 69, speed: 2080, scrap: 0 },
  { temp: 71, speed: 2130, scrap: 1 },
];

export function ScrapAnalysis({ sidebarCollapsed, onNavigate }: ScrapAnalysisProps) {
  const [selectedProcess, setSelectedProcess] = useState('curve-gen');
  const [selectedMachine, setSelectedMachine] = useState('curve-gen-3b');
  const [selectedParameter, setSelectedParameter] = useState('temperature');

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Scrap Analysis</h2>
              <p className="text-sm text-slate-400">
                AI-assisted machine parameter analysis and scrap risk reduction
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                Current Shift
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                Last 24h
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* KPI Snapshot - Scrap Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Scrap Rate */}
            <Card className="bg-gradient-to-br from-red-900/40 to-red-950/40 border-red-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-red-300/80 uppercase">
                  Scrap Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">3.2%</div>
                <p className="text-xs text-red-300/60">Current Shift</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+0.8% vs prev shift</span>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Quantity */}
            <Card className="bg-gradient-to-br from-orange-900/40 to-orange-950/40 border-orange-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-orange-300/80 uppercase">
                  Scrap Quantity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">114</div>
                <p className="text-xs text-orange-300/60">units</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+28 units vs target</span>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Risk Index */}
            <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-amber-300/80 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Scrap Risk Index
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">78</div>
                <p className="text-xs text-amber-300/60">AI-derived / 100</p>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs mt-2">
                  High Risk
                </Badge>
              </CardContent>
            </Card>

            {/* High-Risk Machines */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  High-Risk Machines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">5</div>
                <p className="text-xs text-purple-300/60">out of 18 machines</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Action required</span>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Trend */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-blue-300/80 uppercase">
                  24h Trend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">+0.6%</div>
                <p className="text-xs text-blue-300/60">vs previous day</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Worsening</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Machine & Process Context */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Process Stage */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Process Stage
                  </label>
                  <Select value={selectedProcess} onValueChange={setSelectedProcess}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="auto-taping" className="text-white">AUTO TAPING</SelectItem>
                      <SelectItem value="alloy-blocking" className="text-white">ALLOY BLOCKING</SelectItem>
                      <SelectItem value="curve-gen" className="text-white">CURVE GENERATING</SelectItem>
                      <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                      <SelectItem value="laser-engr" className="text-white">LASER ENGRAVING</SelectItem>
                      <SelectItem value="unblocking" className="text-white">UNBLOCKING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Machine / Station */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Machine / Station
                  </label>
                  <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="curve-gen-3b" className="text-white">CURVE-GEN-3B</SelectItem>
                      <SelectItem value="curve-gen-4a" className="text-white">CURVE-GEN-4A</SelectItem>
                      <SelectItem value="curve-gen-5c" className="text-white">CURVE-GEN-5C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Parameter Focus */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Parameter Focus
                  </label>
                  <Select value={selectedParameter} onValueChange={setSelectedParameter}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="temperature" className="text-white">Temperature</SelectItem>
                      <SelectItem value="spindle-speed" className="text-white">Spindle Speed</SelectItem>
                      <SelectItem value="feed-rate" className="text-white">Feed Rate</SelectItem>
                      <SelectItem value="pressure" className="text-white">Pressure</SelectItem>
                      <SelectItem value="chemical-conc" className="text-white">Chemical Concentration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Current Status */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Machine Status
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      Running
                    </Badge>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      High Scrap Risk
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Machine Parameter Analysis - Main Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Temperature vs Scrap */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <ThermometerSun className="w-5 h-5 text-orange-400" />
                      Temperature Trend
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-1">
                      Temperature vs scrap correlation (Last 12 hours)
                    </CardDescription>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Above Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={temperatureData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="normalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} domain={[65, 80]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="normal"
                      stroke="#22c55e"
                      fill="url(#normalGradient)"
                      name="Normal Range"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      fill="url(#tempGradient)"
                      name="Actual Temp (°C)"
                      strokeWidth={2}
                      dot={{ fill: '#f97316', r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Current: </span>
                    <span className="text-orange-400 font-semibold">78°C</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Normal Range: </span>
                    <span className="text-green-400 font-semibold">68-72°C</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Deviation: </span>
                    <span className="text-red-400 font-semibold">+8.6%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spindle Speed vs Scrap */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-cyan-400" />
                      Spindle Speed Trend
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs mt-1">
                      RPM vs scrap correlation (Last 12 hours)
                    </CardDescription>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Above Normal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={spindleSpeedData}>
                    <defs>
                      <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="normalSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} domain={[2000, 2400]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="normal"
                      stroke="#22c55e"
                      fill="url(#normalSpeedGradient)"
                      name="Normal Range"
                      strokeWidth={1}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#06b6d4"
                      fill="url(#speedGradient)"
                      name="Actual RPM"
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Current: </span>
                    <span className="text-cyan-400 font-semibold">2,350 RPM</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Normal Range: </span>
                    <span className="text-green-400 font-semibold">2,000-2,150 RPM</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Deviation: </span>
                    <span className="text-red-400 font-semibold">+11.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parameter Correlation & Risk Model */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Parameter Correlation Scatter */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Parameter Correlation Analysis</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Temperature vs Spindle Speed – Scrap occurrence mapping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      type="number"
                      dataKey="temp"
                      name="Temperature"
                      unit="°C"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px' }}
                      domain={[65, 80]}
                    />
                    <YAxis
                      type="number"
                      dataKey="speed"
                      name="Spindle Speed"
                      unit=" RPM"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px' }}
                      domain={[2000, 2400]}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'scrap') return [`${value} units`, 'Scrap'];
                        return value;
                      }}
                    />
                    <Scatter name="Scrap Events" data={parameterScatterData} fill="#ef4444">
                      {parameterScatterData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.scrap > 3 ? '#ef4444' : entry.scrap > 0 ? '#f97316' : '#22c55e'}
                          opacity={entry.scrap > 0 ? 0.8 : 0.3}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-slate-400">High Scrap (3+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-slate-400">Low Scrap (1-2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 opacity-30"></div>
                    <span className="text-slate-400">No Scrap</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scrap Probability & Risk Model */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  AI Scrap Probability Model
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Current parameter settings vs optimal range
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Risk Level Indicator */}
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 font-medium">Scrap Probability</span>
                    <span className="text-3xl font-bold text-red-400">78%</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    High Risk - Immediate Action Required
                  </Badge>
                </div>

                {/* Parameter Comparison */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-slate-400">Temperature</span>
                      <span className="text-red-400 font-semibold">78°C (Target: 68-72°C)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-xs text-red-400">+8.6%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-slate-400">Spindle Speed</span>
                      <span className="text-red-400 font-semibold">2,350 RPM (Target: 2,000-2,150 RPM)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '93%' }}></div>
                      </div>
                      <span className="text-xs text-red-400">+11.9%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-slate-400">Feed Rate</span>
                      <span className="text-yellow-400 font-semibold">145 mm/min (Target: 120-140 mm/min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: '72%' }}></div>
                      </div>
                      <span className="text-xs text-yellow-400">+3.6%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <span className="text-slate-400">Pressure</span>
                      <span className="text-green-400 font-semibold">4.2 bar (Target: 4.0-4.5 bar)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '52%' }}></div>
                      </div>
                      <span className="text-xs text-green-400">Normal</span>
                    </div>
                  </div>
                </div>

                {/* Expected Impact */}
                <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-medium text-cyan-300">Optimization Potential</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Adjusting to optimal parameters could reduce scrap probability to <span className="text-green-400 font-semibold">18-22%</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics & Comparison Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Parameter Sensitivity Ranking */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Parameter Sensitivity Ranking
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Impact of each parameter on scrap probability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={parameterSensitivityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis type="category" dataKey="parameter" stroke="#94a3b8" style={{ fontSize: '11px' }} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="impact" fill="#a855f7" radius={[0, 4, 4, 0]}>
                      {parameterSensitivityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.risk === 'High' ? '#ef4444' :
                            entry.risk === 'Medium' ? '#f59e0b' :
                            '#22c55e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scrap by Process */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Scrap by Process Stage</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Current shift breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scrapByProcessData.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">{item.process}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{item.scrap} / {item.total} units</span>
                          <Badge
                            className={
                              item.rate > 1.5
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : item.rate > 0.8
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                : 'bg-green-500/20 text-green-300 border-green-500/30'
                            }
                          >
                            {item.rate.toFixed(2)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={
                            item.rate > 1.5
                              ? 'h-full bg-red-500'
                              : item.rate > 0.8
                              ? 'h-full bg-yellow-500'
                              : 'h-full bg-green-500'
                          }
                          style={{ width: `${Math.min((item.rate / 2) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scrap Trend Over Time */}
          <Card className="bg-[#141b2e] border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Scrap Rate Trend
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Last 7 shifts – Scrap % vs Target
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scrapTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="shift" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="scrap" fill="#ef4444" name="Scrap %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#22c55e" name="Target %" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - AI Copilot */}
        <div className="w-96 border-l border-white/10 bg-[#0f1623] p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Parameter Adjustment Advisor</h3>
              <p className="text-xs text-slate-400">AI-assisted scrap reduction</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4 mb-6">
            {/* Critical Alert */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-300 mb-2">Critical Parameter Combination</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Elevated temperature (78°C) combined with high spindle speed (2,350 RPM) significantly increases scrap risk for CURVE GENERATING operations.
                  </p>
                  <div className="text-xs text-red-400 font-medium">
                    Risk Level: High (78% scrap probability)
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation 1 */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <ThermometerSun className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">Temperature Adjustment</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Reduce operating temperature from <span className="text-orange-400 font-semibold">78°C</span> to optimal range <span className="text-green-400 font-semibold">68-72°C</span>.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expected Impact:</span>
                      <span className="text-green-400 font-semibold">-25% scrap probability</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        92%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation 2 */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">Spindle Speed Optimization</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Reduce spindle speed from <span className="text-cyan-400 font-semibold">2,350 RPM</span> to optimal range <span className="text-green-400 font-semibold">2,000-2,150 RPM</span>.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expected Impact:</span>
                      <span className="text-green-400 font-semibold">-18% scrap probability</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        88%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation 3 */}
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Gauge className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">Feed Rate Fine-Tuning</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Minor adjustment to feed rate from <span className="text-yellow-400 font-semibold">145 mm/min</span> to <span className="text-green-400 font-semibold">135-140 mm/min</span> recommended.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expected Impact:</span>
                      <span className="text-green-400 font-semibold">-8% scrap probability</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                        75%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Impact Summary */}
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-green-300 mb-2">Combined Optimization Impact</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Implementing all recommended adjustments could reduce scrap probability from <span className="text-red-400 font-semibold">78%</span> to <span className="text-green-400 font-semibold">18-22%</span>.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Estimated Scrap Reduction:</span>
                      <span className="text-green-400 font-semibold">~60 units/shift</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cost Savings:</span>
                      <span className="text-green-400 font-semibold">~$4,200/shift</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Context */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Historical Pattern Analysis</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Similar parameter combinations on CURVE-GEN-4A (2 weeks ago) resulted in scrap rate increase from 1.2% to 3.8%. Parameter adjustment reduced scrap back to 1.1% within 4 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/10 pt-4">
            <label className="text-xs text-slate-400 uppercase mb-2 block">
              Ask AI Copilot
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g., What if I reduce temperature to 70°C?"
                className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-sm"
              />
              <Button
                size="sm"
                className="bg-cyan-500 hover:bg-cyan-600 text-white flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Ask for parameter scenarios, root cause analysis, or optimization strategies
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
