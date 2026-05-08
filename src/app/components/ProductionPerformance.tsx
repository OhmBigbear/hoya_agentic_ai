import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Send, Gauge, Package, ArrowRight, Activity } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProductionPerformanceProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function ProductionPerformance({ sidebarCollapsed, onNavigate }: ProductionPerformanceProps) {
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
              <h2 className="text-2xl font-semibold text-white mb-1">Production Performance</h2>
              <p className="text-sm text-slate-400">
                Rx1 Surfacing Automation Line – Real-time Line Performance
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium"
              >
                Today
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                Current Shift
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Calendar className="w-4 h-4 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* KPI Summary Cards - Line Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Production Rate */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                  Production Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">182</div>
                <p className="text-xs text-cyan-300/60">units/hr</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-8% vs prev shift</span>
                </div>
              </CardContent>
            </Card>

            {/* OEE */}
            <Card className="bg-gradient-to-br from-teal-900/40 to-teal-950/40 border-teal-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-teal-300/80 uppercase">
                  OEE
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">72.4%</div>
                <p className="text-xs text-teal-300/60">Overall Equipment</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+3.2% vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-gradient-to-br from-amber-900/40 to-amber-950/40 border-amber-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-amber-300/80 uppercase">
                  Availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">86.5%</div>
                <p className="text-xs text-amber-300/60">Uptime</p>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-1.8% vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* Quality Rate */}
            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-green-300/80 uppercase">
                  Quality Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">91.8%</div>
                <p className="text-xs text-green-300/60">FPY</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+1.2% vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* WIP Level */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  WIP Level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">247</div>
                <p className="text-xs text-purple-300/60">units in process</p>
                <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>+12% vs target</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Status & Bottleneck Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Production Status Overview */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Status Overview</CardTitle>
                <CardDescription className="text-xs text-slate-400">Active workorders and throughput reducers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Running Workorders */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Running</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
                        12 workorders
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between p-3 bg-[#1e293b] rounded border border-white/10 hover:bg-[#2a3650] cursor-pointer transition-colors"
                        onClick={() => onNavigate('#workorder-tracking')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <div className="text-sm font-medium text-white">WO-2025-0124</div>
                            <div className="text-xs text-slate-400">POLISHING • 78% complete</div>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <div
                        className="flex items-center justify-between p-3 bg-[#1e293b] rounded border border-white/10 hover:bg-[#2a3650] cursor-pointer transition-colors"
                        onClick={() => onNavigate('#workorder-tracking')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div>
                            <div className="text-sm font-medium text-white">WO-2025-0122</div>
                            <div className="text-xs text-slate-400">LASER ENGRAVING • 45% complete</div>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* Delayed / Bottleneck Causing */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">Delayed / Bottleneck</span>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20">
                        3 workorders
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div
                        className="flex items-center justify-between p-3 bg-red-950/30 rounded border border-red-800/30 hover:bg-red-950/50 cursor-pointer transition-colors"
                        onClick={() => onNavigate('#station-analysis')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div>
                            <div className="text-sm font-medium text-white">WO-2025-0118</div>
                            <div className="text-xs text-red-400">AUTO TAPING • 2.5 hrs delayed</div>
                          </div>
                        </div>
                        <div className="text-xs text-red-400 font-medium">-45 u/hr</div>
                      </div>
                      <div
                        className="flex items-center justify-between p-3 bg-orange-950/30 rounded border border-orange-800/30 hover:bg-orange-950/50 cursor-pointer transition-colors"
                        onClick={() => onNavigate('#station-analysis')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <div>
                            <div className="text-sm font-medium text-white">WO-2025-0115</div>
                            <div className="text-xs text-orange-400">CURVE GENERATING • 1.2 hrs delayed</div>
                          </div>
                        </div>
                        <div className="text-xs text-orange-400 font-medium">-18 u/hr</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                    onClick={() => onNavigate('#workorder-tracking')}
                  >
                    View All Workorders
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Process Flow & Bottleneck Indicator */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Process Flow & Bottleneck</CardTitle>
                <CardDescription className="text-xs text-slate-400">Current dominant bottleneck on production line</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Process Flow */}
                  <div className="space-y-2">
                    <div
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">AUTO TAPING</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>
                      </div>
                      <div className="text-xs text-slate-400">195 units/hr • 98% efficiency</div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">ALLOY BLOCKING</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>
                      </div>
                      <div className="text-xs text-slate-400">192 units/hr • 96% efficiency</div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-red-500/20 border-2 border-red-500 ring-2 ring-red-500/30 cursor-pointer hover:bg-red-500/30 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-medium text-white">CURVE GENERATING</span>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">BOTTLENECK</Badge>
                      </div>
                      <div className="text-xs text-red-400 font-medium">182 units/hr • 72% efficiency • -28 u/hr loss</div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">POLISHING</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>
                      </div>
                      <div className="text-xs text-slate-400">188 units/hr • 94% efficiency</div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">LASER ENGRAVING</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>
                      </div>
                      <div className="text-xs text-slate-400">190 units/hr • 95% efficiency</div>
                    </div>

                    <div
                      className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 cursor-pointer hover:bg-green-500/20 transition-colors"
                      onClick={() => onNavigate('#station-analysis')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">UNBLOCKING</span>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>
                      </div>
                      <div className="text-xs text-slate-400">194 units/hr • 97% efficiency</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Production Rate Trend */}
            <Card className="bg-[#141b2e] border-white/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Rate Trend</CardTitle>
                <CardDescription className="text-xs text-slate-400">Hourly production rate with bottleneck events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-16">06:00</span>
                    <div className="flex-1 mx-3 h-8 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '95%' }}></div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">198 u/hr</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-16">08:00</span>
                    <div className="flex-1 mx-3 h-8 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '76%' }}></div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">152 u/hr</span>
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-red-300">AUTO TAPING down</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-16">10:00</span>
                    <div className="flex-1 mx-3 h-8 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '88%' }}></div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">176 u/hr</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-16">12:00</span>
                    <div className="flex-1 mx-3 h-8 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: '97%' }}></div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">195 u/hr</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 w-16">14:00</span>
                    <div className="flex-1 mx-3 h-8 bg-[#1e293b] rounded relative overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '91%' }}></div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">182 u/hr</span>
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-orange-300">CURVE GEN bottleneck</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production Loss by Process (Pareto) */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Production Loss (Pareto)</CardTitle>
                <CardDescription className="text-xs text-slate-400">By process stage (today)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">CURVE GENERATING</span>
                      <span className="text-xs text-red-400 font-medium">-28 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">AUTO TAPING</span>
                      <span className="text-xs text-orange-400 font-medium">-18 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: '64%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">POLISHING</span>
                      <span className="text-xs text-amber-400 font-medium">-12 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '43%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">LASER ENGRAVING</span>
                      <span className="text-xs text-yellow-400 font-medium">-5 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">ALLOY BLOCKING</span>
                      <span className="text-xs text-green-400 font-medium">-3 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '11%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">UNBLOCKING</span>
                      <span className="text-xs text-green-400 font-medium">-2 u/hr</span>
                    </div>
                    <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '7%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottleneck Frequency */}
          <div className="mt-6">
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Bottleneck Frequency by Process</CardTitle>
                <CardDescription className="text-xs text-slate-400">Number of bottleneck occurrences (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div
                    className="bg-red-950/30 rounded-lg p-4 border border-red-800/30 cursor-pointer hover:bg-red-950/50 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">CURVE GENERATING</span>
                    <p className="text-2xl font-bold text-red-400 mt-1">24</p>
                    <p className="text-xs text-red-300">events</p>
                  </div>
                  <div
                    className="bg-orange-950/30 rounded-lg p-4 border border-orange-800/30 cursor-pointer hover:bg-orange-950/50 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">AUTO TAPING</span>
                    <p className="text-2xl font-bold text-orange-400 mt-1">18</p>
                    <p className="text-xs text-orange-300">events</p>
                  </div>
                  <div
                    className="bg-amber-950/30 rounded-lg p-4 border border-amber-800/30 cursor-pointer hover:bg-amber-950/50 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">POLISHING</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">12</p>
                    <p className="text-xs text-amber-300">events</p>
                  </div>
                  <div
                    className="bg-green-950/30 rounded-lg p-4 border border-green-800/30 cursor-pointer hover:bg-green-950/50 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">LASER ENGRAVING</span>
                    <p className="text-2xl font-bold text-green-400 mt-1">5</p>
                    <p className="text-xs text-green-300">events</p>
                  </div>
                  <div
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">ALLOY BLOCKING</span>
                    <p className="text-2xl font-bold text-slate-400 mt-1">3</p>
                    <p className="text-xs text-slate-500">events</p>
                  </div>
                  <div
                    className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 cursor-pointer hover:bg-slate-800 transition-colors"
                    onClick={() => onNavigate('#station-analysis')}
                  >
                    <span className="text-xs text-slate-400">UNBLOCKING</span>
                    <p className="text-2xl font-bold text-slate-400 mt-1">2</p>
                    <p className="text-xs text-slate-500">events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right AI Copilot Panel */}
        <div className="w-96 bg-[#0f1623] border-l border-white/10 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">AI Production Copilot</h3>
            </div>
            <p className="text-xs text-slate-400">Line-level performance insights and recommendations</p>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="bg-[#1e293b] rounded-lg p-3 border border-white/10">
                  <p className="text-sm text-slate-200">
                    Production rate is currently 8% below target (182 vs 198 units/hr). CURVE GENERATING is the dominant bottleneck, reducing throughput by 28 units/hr.
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">3 minutes ago</span>
              </div>
            </div>

            {/* AI Insight Card */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Root Cause Analysis</CardTitle>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Critical</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-purple-300 font-medium">Bottleneck Process</span>
                  <p className="text-sm text-slate-200 mt-1">CURVE GENERATING is operating at 72% efficiency. Tool wear detected on Station 3-B, causing 18% cycle time increase.</p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Recommended Action</span>
                  <p className="text-sm text-slate-200 mt-1">Schedule tool replacement during next shift change. Estimated recovery: +25 units/hr within 45 minutes.</p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Secondary Impact</span>
                  <p className="text-sm text-slate-200 mt-1">WIP level is 12% above target due to upstream queue buildup at CURVE GENERATING.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300">Confidence</span>
                  <div className="flex-1 h-2 bg-[#1e293b] rounded overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '89%' }}></div>
                  </div>
                  <span className="text-xs text-white">89%</span>
                </div>
              </CardContent>
            </Card>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-[80%]">
                <div className="bg-[#00d4ff]/20 rounded-lg p-3 border border-[#00d4ff]/30">
                  <p className="text-sm text-slate-200">
                    How can we recover production rate to target?
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block text-right">Just now</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <p className="text-xs text-slate-400 mb-2">Quick Actions</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Why is production rate below target?
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Gauge className="w-4 h-4 mr-2" />
              Identify next bottleneck
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Recovery action plan
            </Button>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about production performance..."
                className="flex-1 bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500"
              />
              <Button size="icon" className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e]">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
