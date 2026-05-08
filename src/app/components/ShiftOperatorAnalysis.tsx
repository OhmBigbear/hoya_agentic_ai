import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Gauge,
  Target,
  Award,
  AlertTriangle,
  Calendar,
  User,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';

interface ShiftOperatorAnalysisProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

export function ShiftOperatorAnalysis({ sidebarCollapsed, onNavigate }: ShiftOperatorAnalysisProps) {
  const [selectedShift, setSelectedShift] = useState('shift-a');
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [comparisonMode, setComparisonMode] = useState<'operator' | 'shift' | 'trend'>('operator');

  const operators = [
    { id: 'mike-chen', name: 'Mike Chen', output: 245, utilization: 94, cycleTime: 118, impact: '+12', rating: 'top' },
    { id: 'sarah-johnson', name: 'Sarah Johnson', output: 238, utilization: 91, cycleTime: 122, impact: '+8', rating: 'top' },
    { id: 'tom-wilson', name: 'Tom Wilson', output: 215, utilization: 88, cycleTime: 128, impact: '-2', rating: 'average' },
    { id: 'lisa-park', name: 'Lisa Park', output: 232, utilization: 90, cycleTime: 124, impact: '+5', rating: 'average' },
    { id: 'john-davis', name: 'John Davis', output: 198, utilization: 82, cycleTime: 135, impact: '-8', rating: 'below' },
    { id: 'emma-rodriguez', name: 'Emma Rodriguez', output: 242, utilization: 93, cycleTime: 120, impact: '+10', rating: 'top' },
  ];

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">Shift / Operator Analysis</h2>
            <p className="text-sm text-slate-400">
              Performance analysis by shift and operator with skill balancing insights
            </p>
          </div>

          {/* Shift & Operator Filter */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Shift Selection */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Shift
                  </label>
                  <Select value={selectedShift} onValueChange={setSelectedShift}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all-shifts" className="text-white">All Shifts</SelectItem>
                      <SelectItem value="shift-a" className="text-white">Shift A (06:00 - 14:00)</SelectItem>
                      <SelectItem value="shift-b" className="text-white">Shift B (14:00 - 22:00)</SelectItem>
                      <SelectItem value="shift-c" className="text-white">Shift C (22:00 - 06:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Operator Selection */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Operator
                  </label>
                  <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all" className="text-white">All Operators</SelectItem>
                      <SelectItem value="mike-chen" className="text-white">Mike Chen</SelectItem>
                      <SelectItem value="sarah-johnson" className="text-white">Sarah Johnson</SelectItem>
                      <SelectItem value="tom-wilson" className="text-white">Tom Wilson</SelectItem>
                      <SelectItem value="lisa-park" className="text-white">Lisa Park</SelectItem>
                      <SelectItem value="john-davis" className="text-white">John Davis</SelectItem>
                      <SelectItem value="emma-rodriguez" className="text-white">Emma Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Date Range
                  </label>
                  <Select defaultValue="today">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="today" className="text-white">Today</SelectItem>
                      <SelectItem value="yesterday" className="text-white">Yesterday</SelectItem>
                      <SelectItem value="last-7-days" className="text-white">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days" className="text-white">Last 30 Days</SelectItem>
                      <SelectItem value="custom" className="text-white">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Process Stage */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Process Stage
                  </label>
                  <Select defaultValue="all-processes">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all-processes" className="text-white">All Processes</SelectItem>
                      <SelectItem value="auto-taping" className="text-white">AUTO TAPING</SelectItem>
                      <SelectItem value="alloy-blocking" className="text-white">ALLOY BLOCKING</SelectItem>
                      <SelectItem value="curve-generating" className="text-white">CURVE GENERATING</SelectItem>
                      <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                      <SelectItem value="laser-engraving" className="text-white">LASER ENGRAVING</SelectItem>
                      <SelectItem value="unblocking" className="text-white">UNBLOCKING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Comparison Mode */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Comparison Mode
                  </label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className={comparisonMode === 'operator' ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] text-xs px-2' : 'bg-[#1e293b] hover:bg-[#2a3650] text-slate-300 text-xs px-2'}
                      onClick={() => setComparisonMode('operator')}
                    >
                      Operators
                    </Button>
                    <Button
                      size="sm"
                      className={comparisonMode === 'shift' ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] text-xs px-2' : 'bg-[#1e293b] hover:bg-[#2a3650] text-slate-300 text-xs px-2'}
                      onClick={() => setComparisonMode('shift')}
                    >
                      Shifts
                    </Button>
                    <Button
                      size="sm"
                      className={comparisonMode === 'trend' ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] text-xs px-2' : 'bg-[#1e293b] hover:bg-[#2a3650] text-slate-300 text-xs px-2'}
                      onClick={() => setComparisonMode('trend')}
                    >
                      Trend
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operator Performance Metrics - Shift A Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Average Output */}
            <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-cyan-300/80 uppercase">
                  Avg Output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">228</div>
                <p className="text-xs text-cyan-300/60">units/shift • Shift A</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+5% vs shift avg</span>
                </div>
              </CardContent>
            </Card>

            {/* Avg Operator Utilization */}
            <Card className="bg-gradient-to-br from-teal-900/40 to-teal-950/40 border-teal-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-teal-300/80 uppercase">
                  Operator Util.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">90%</div>
                <p className="text-xs text-teal-300/60">Active time</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2% vs yesterday</span>
                </div>
              </CardContent>
            </Card>

            {/* Avg Cycle Time */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-purple-300/80 uppercase">
                  Avg Cycle Time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">125s</div>
                <p className="text-xs text-purple-300/60">Target: 120s</p>
                <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+4% variance</span>
                </div>
              </CardContent>
            </Card>

            {/* Production Impact */}
            <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 border-green-800/30">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium text-green-300/80 uppercase">
                  Production Impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-white mb-1">+35</div>
                <p className="text-xs text-green-300/60">units/hr vs baseline</p>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <Award className="w-3 h-3" />
                  <span>Top shift performance</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operator Performance Table */}
          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">Operator Performance Ranking</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Shift A • Sorted by output (today)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Rank</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Operator</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Output</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Utilization</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Avg Cycle Time</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Impact</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase px-4 py-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operators.map((op, index) => (
                      <tr
                        key={op.id}
                        className={`border-b border-white/5 hover:bg-[#1e293b] cursor-pointer transition-colors ${
                          op.rating === 'top' ? 'bg-green-950/20' : op.rating === 'below' ? 'bg-red-950/20' : ''
                        }`}
                        onClick={() => setSelectedOperator(op.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">#{index + 1}</span>
                            {index === 0 && <Award className="w-4 h-4 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-white">{op.name}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-white font-medium">{op.output}</span>
                          <span className="text-xs text-slate-400 ml-1">units</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#1e293b] rounded overflow-hidden w-20">
                              <div
                                className={`h-full ${
                                  op.utilization >= 90 ? 'bg-green-500' : op.utilization >= 85 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${op.utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-white">{op.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${
                            op.cycleTime <= 120 ? 'text-green-400' : 
                            op.cycleTime <= 130 ? 'text-amber-400' : 
                            'text-red-400'
                          }`}>
                            {op.cycleTime}s
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-sm font-medium ${
                            op.impact.startsWith('+') ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {op.impact} u/hr
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={
                            op.rating === 'top' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            op.rating === 'below' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                            'bg-slate-500/20 text-slate-400 border-slate-500/30'
                          }>
                            {op.rating === 'top' ? 'Top Performer' : op.rating === 'below' ? 'Below Average' : 'Average'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Comparison & Variance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Operator vs Operator Comparison */}
            {comparisonMode === 'operator' && (
              <>
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Output by Operator</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Units produced (Shift A - Today)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {operators.map((op) => (
                        <div key={op.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">{op.name}</span>
                            <span className={`text-xs font-medium ${
                              op.output >= 240 ? 'text-green-400' : 
                              op.output >= 220 ? 'text-white' : 
                              'text-red-400'
                            }`}>
                              {op.output} units
                            </span>
                          </div>
                          <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                op.output >= 240 ? 'bg-green-500' : 
                                op.output >= 220 ? 'bg-cyan-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${(op.output / 245) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Efficiency Distribution</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Operator efficiency ranges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">High Performers (≥90% util)</span>
                          <span className="text-xs text-green-400 font-medium">3 operators</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Average Performers (85-89%)</span>
                          <span className="text-xs text-amber-400 font-medium">2 operators</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '33%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Below Target (&lt;85%)</span>
                          <span className="text-xs text-red-400 font-medium">1 operator</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: '17%' }}></div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Performance Variance</span>
                          <span className="text-sm font-medium text-white">12%</span>
                        </div>
                        <p className="text-xs text-amber-400 mt-1">Moderate variance - skill balancing recommended</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Shift vs Shift Comparison */}
            {comparisonMode === 'shift' && (
              <>
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Production by Shift</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Total units produced (last 7 days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift A (06:00-14:00)</span>
                          <span className="text-xs text-green-400 font-medium">1,595 units</span>
                        </div>
                        <div className="h-3 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift B (14:00-22:00)</span>
                          <span className="text-xs text-cyan-400 font-medium">1,522 units</span>
                        </div>
                        <div className="h-3 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift C (22:00-06:00)</span>
                          <span className="text-xs text-amber-400 font-medium">1,385 units</span>
                        </div>
                        <div className="h-3 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Production Loss by Shift</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Units/hr lost vs target</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift A</span>
                          <span className="text-xs text-green-400 font-medium">-5 u/hr</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift B</span>
                          <span className="text-xs text-amber-400 font-medium">-12 u/hr</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">Shift C</span>
                          <span className="text-xs text-red-400 font-medium">-20 u/hr</span>
                        </div>
                        <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs text-amber-400">
                          Shift C shows significant production loss - investigate staffing levels and equipment availability
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Trend over Time */}
            {comparisonMode === 'trend' && (
              <>
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Output Trend (Last 7 Days)</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Daily production by shift</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <div key={day} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-12">{day}</span>
                          <div className="flex-1 h-6 bg-[#1e293b] rounded relative overflow-hidden">
                            <div className="h-full bg-green-500/60" style={{ width: `${85 + idx * 2}%` }}></div>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white">
                              {1480 + idx * 15} units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Operator Utilization Trend</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Average utilization % by day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <div key={day}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">{day}</span>
                            <span className="text-xs text-white">{86 + idx}%</span>
                          </div>
                          <div className="h-2 bg-[#1e293b] rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                86 + idx >= 90 ? 'bg-green-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${86 + idx}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Best Practice Operators */}
          <Card className="bg-[#141b2e] border-white/10">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">Top Performer Insights</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Best-practice operators with exceptional performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-950/30 to-green-950/10 rounded-lg p-4 border border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-white">Mike Chen</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mb-1">245 units</p>
                  <p className="text-xs text-slate-400 mb-2">94% utilization • 118s cycle time</p>
                  <p className="text-xs text-green-300">Exceptional efficiency in CURVE GENERATING process</p>
                </div>

                <div className="bg-gradient-to-br from-green-950/30 to-green-950/10 rounded-lg p-4 border border-green-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-white">Emma Rodriguez</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400 mb-1">242 units</p>
                  <p className="text-xs text-slate-400 mb-2">93% utilization • 120s cycle time</p>
                  <p className="text-xs text-green-300">Consistent quality output with minimal rework</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-950/30 to-cyan-950/10 rounded-lg p-4 border border-cyan-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Sarah Johnson</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-400 mb-1">238 units</p>
                  <p className="text-xs text-slate-400 mb-2">91% utilization • 122s cycle time</p>
                  <p className="text-xs text-cyan-300">Strong multi-process capability and adaptability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right AI Copilot Panel - Human Factor Insight */}
        <div className="w-96 bg-[#0f1623] border-l border-white/10 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-semibold text-white">AI Human Factor Insight</h3>
            </div>
            <p className="text-xs text-slate-400">Performance variance analysis and skill balancing recommendations</p>
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
                    Performance variance detected: 12% difference between top performer (Mike Chen: 245 units) and bottom performer (John Davis: 198 units).
                  </p>
                </div>
                <span className="text-xs text-slate-500 mt-1 block">2 minutes ago</span>
              </div>
            </div>

            {/* AI Insight Card - Performance Variance */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Performance Variance Analysis</CardTitle>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Medium Risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-purple-300 font-medium">Root Cause</span>
                  <p className="text-sm text-slate-200 mt-1">
                    John Davis shows 18% longer cycle time (135s vs 118s) and 12% lower utilization. Primary gap: CURVE GENERATING setup time is 40% longer than Mike Chen.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Skill Balancing Recommendation</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Pair John Davis with Mike Chen for 2-day shadowing on CURVE GENERATING setup procedures. Expected improvement: +15 units/shift, -12s cycle time.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-purple-300 font-medium">Best Practice Sharing</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Mike Chen's tool preparation workflow reduces changeover time by 35%. Recommend documentation and training session for all Shift A operators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-300">Impact Confidence</span>
                  <div className="flex-1 h-2 bg-[#1e293b] rounded overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '87%' }}></div>
                  </div>
                  <span className="text-xs text-white">87%</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Reassignment Suggestion */}
            <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 border-cyan-800/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white">Reassignment Opportunity</CardTitle>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">Optimize</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-xs text-cyan-300 font-medium">Cross-Training Potential</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Emma Rodriguez shows strong adaptability across multiple processes. Consider cross-training to POLISHING to provide backup for peak demand periods.
                  </p>
                </div>
                <div>
                  <span className="text-xs text-cyan-300 font-medium">Shift Balancing</span>
                  <p className="text-sm text-slate-200 mt-1">
                    Shift C has 20 units/hr production loss. Recommend rotating 1 top performer from Shift A to Shift C for 1 week to stabilize performance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Message */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-[80%]">
                <div className="bg-[#00d4ff]/20 rounded-lg p-3 border border-[#00d4ff]/30">
                  <p className="text-sm text-slate-200">
                    What training would help John Davis improve?
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
              <Users className="w-4 h-4 mr-2" />
              Identify skill gaps
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Award className="w-4 h-4 mr-2" />
              Best practice analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-left border-white/10 text-slate-300 hover:bg-[#1e293b] hover:text-white"
            >
              <Activity className="w-4 h-4 mr-2" />
              Suggest reassignments
            </Button>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about operator performance..."
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
