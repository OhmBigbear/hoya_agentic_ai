import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Download,
  Package,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface MaintenanceCostSparePartsProps {
  sidebarCollapsed: boolean;
}

const kpis = [
  {
    label: 'Waiting for Parts',
    value: '8',
    unit: 'delayed workorders',
    note: '18 active week',
    icon: Package,
    cardClass: 'from-orange-900/40 to-orange-950/40 border-orange-800/30',
    labelClass: 'text-orange-300/80',
    noteClass: 'text-orange-300/60',
  },
  {
    label: 'Reorder Point Alerts',
    value: '5',
    unit: 'parts below ROP',
    note: '12 active week',
    icon: AlertTriangle,
    cardClass: 'from-red-900/40 to-red-950/40 border-red-800/30',
    labelClass: 'text-red-300/80',
    noteClass: 'text-red-300/60',
  },
  {
    label: 'Critical Class A Parts',
    value: '2',
    unit: 'critical items',
    note: 'Class A stock risk',
    icon: Wrench,
    cardClass: 'from-purple-900/40 to-purple-950/40 border-purple-800/30',
    labelClass: 'text-purple-300/80',
    noteClass: 'text-purple-300/60',
  },
  {
    label: 'Parts Cost Breakdown',
    value: '500.3K',
    unit: 'THB this month',
    note: '-400.4K THB vs last month',
    icon: TrendingDown,
    cardClass: 'from-cyan-900/40 to-cyan-950/40 border-cyan-800/30',
    labelClass: 'text-cyan-300/80',
    noteClass: 'text-green-400',
  },
  {
    label: 'PM Parts Cost',
    value: '12.3K',
    unit: 'THB this month',
    note: '+40.2K THB vs last month',
    icon: TrendingUp,
    cardClass: 'from-blue-900/40 to-blue-950/40 border-blue-800/30',
    labelClass: 'text-blue-300/80',
    noteClass: 'text-red-400',
  },
  {
    label: 'Hold Cost Impact',
    value: '74.5K',
    unit: 'THB estimated blocked cost',
    note: 'Waiting parts impact',
    icon: AlertTriangle,
    cardClass: 'from-amber-900/40 to-amber-950/40 border-amber-800/30',
    labelClass: 'text-amber-300/80',
    noteClass: 'text-amber-300/60',
  },
];

const spareParts = [
  {
    catalogueNo: 'VAC-TS-001',
    partName: 'Vacuum Tube Seal',
    onHand: 2,
    currentStock: 'Below ROP',
    leadTime: '14 days',
    usageRate: '9 / month',
    riskLevel: 'Critical',
    monthlyCost: '148.2K THB',
    poStatus: 'On Order',
    poNo: 'PO-2601-118',
    eta: 'Jan 18',
  },
  {
    catalogueNo: 'BRG-SP-220',
    partName: 'Replacement Bearings',
    onHand: 0,
    currentStock: 'Stockout',
    leadTime: '21 days',
    usageRate: '7 / month',
    riskLevel: 'Critical',
    monthlyCost: '176.5K THB',
    poStatus: 'No PO',
  },
  {
    catalogueNo: 'RNG-SP-011',
    partName: 'Spare Ring',
    onHand: 4,
    currentStock: 'Low Stock',
    leadTime: '10 days',
    usageRate: '12 / month',
    riskLevel: 'High',
    monthlyCost: '62.4K THB',
    poStatus: 'Low Stock',
  },
  {
    catalogueNo: 'CAL-SEN-014',
    partName: 'Calibration Sensor',
    onHand: 3,
    currentStock: 'Below ROP',
    leadTime: '18 days',
    usageRate: '4 / month',
    riskLevel: 'High',
    monthlyCost: '71.8K THB',
    poStatus: 'On Order',
    poNo: 'PO-2601-126',
    eta: 'Jan 22',
  },
  {
    catalogueNo: 'PMP-COL-007',
    partName: 'Coolant Pump Kit',
    onHand: 1,
    currentStock: 'Low Stock',
    leadTime: '12 days',
    usageRate: '3 / month',
    riskLevel: 'Medium',
    monthlyCost: '41.4K THB',
    poStatus: 'Low Stock',
  },
];

const machineUsage = [
  { machine: 'Curve-Gen-3B', station: 'CURVE GENERATING', cost: 190.1, usage: 38, jobs: 11 },
  { machine: 'Polish-200C', station: 'POLISHING', cost: 124.7, usage: 25, jobs: 8 },
  { machine: 'Alloy-RX8-SR', station: 'ALLOY BLOCKING', cost: 96.3, usage: 19, jobs: 6 },
  { machine: 'Laser-Engr-2C', station: 'LASER ENGRAVING', cost: 89.2, usage: 18, jobs: 5 },
];

const completedWorkorders = [
  { id: 'MWO-2601-045', machine: 'Curve-Gen-3B', type: 'CM', finalCost: '86.4K THB', parts: 'Replacement Bearings' },
  { id: 'MWO-2601-039', machine: 'Polish-200C', type: 'PM', finalCost: '12.3K THB', parts: 'Spare Ring, Seal Kit' },
  { id: 'MWO-2601-032', machine: 'Laser-Engr-2C', type: 'PM', finalCost: '18.7K THB', parts: 'Calibration Sensor' },
];

const inProgressWorkorders = [
  { id: 'MWO-2601-051', machine: 'Alloy-RX8-SR', type: 'CM', estimate: '44.8K THB', confidence: 'Medium' },
  { id: 'MWO-2601-053', machine: 'Curve-Gen-3B', type: 'PdM', estimate: '68.1K THB', confidence: 'High' },
  { id: 'MWO-2601-056', machine: 'Polish-200C', type: 'PM', estimate: '9.5K THB', confidence: 'High' },
];

const holdWorkorders = [
  { id: 'MWO-2601-042', machine: 'Curve-Gen-3B', reason: 'No stock available', requiredPart: 'BRG-SP-220 Replacement Bearings', blockedCost: '38.2K THB' },
  { id: 'MWO-2601-047', machine: 'Polish-200C', reason: 'Below reorder point', requiredPart: 'VAC-TS-001 Vacuum Tube Seal', blockedCost: '22.6K THB' },
  { id: 'MWO-2601-049', machine: 'Alloy-RX8-SR', reason: 'Supplier ETA pending', requiredPart: 'CAL-SEN-014 Calibration Sensor', blockedCost: '13.7K THB' },
];

const recommendedActions = [
  'Curve-Gen-3B drives 38% of current spare part cost.',
  'Replacement Bearings and Vacuum Tube Seal are responsible for most delayed maintenance jobs.',
  'Recommend reviewing reorder points for Class A critical parts.',
  'Check supplier lead time for BRG-SP-220.',
  'Consider PM frequency optimization for high-usage wear parts.',
];

function riskBadgeClass(riskLevel: string) {
  switch (riskLevel) {
    case 'Critical':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'High':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Medium':
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

function poStatusBadge(part: (typeof spareParts)[number]) {
  if (part.poStatus === 'On Order') {
    return (
      <div className="space-y-1">
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">On Order</Badge>
        <div className="text-xs text-slate-400">{part.poNo} - ETA {part.eta}</div>
      </div>
    );
  }

  if (part.poStatus === 'Low Stock') {
    return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">Low Stock Warning</Badge>;
  }

  return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Action Needed: No PO</Badge>;
}

function workorderTypeClass(type: string) {
  switch (type) {
    case 'PM':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'CM':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'PdM':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

export function MaintenanceCostSpareParts({ sidebarCollapsed }: MaintenanceCostSparePartsProps) {
  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Cost & Spare Parts Risk</h2>
              <p className="text-sm text-slate-400">
                Predictive view of maintenance cost, spare part risk, and workorder impact
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button size="sm" className="bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] font-medium">
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Production Line</label>
                  <Select defaultValue="rx1-surfacing">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="rx1-surfacing" className="text-white">Rx1 Surfacing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Section / Station</label>
                  <Select defaultValue="curve-generating">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="curve-generating" className="text-white">CURVE GENERATING</SelectItem>
                      <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                      <SelectItem value="alloy-blocking" className="text-white">ALLOY BLOCKING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Machine Type</label>
                  <Select defaultValue="all-machines">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all-machines" className="text-white">All Machines</SelectItem>
                      <SelectItem value="curve-gen" className="text-white">Curve-Gen-3B</SelectItem>
                      <SelectItem value="polish" className="text-white">Polish-200C</SelectItem>
                      <SelectItem value="alloy" className="text-white">Alloy-RX8-SR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Workorder Status</label>
                  <Select defaultValue="hold-waiting-parts">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="completed" className="text-white">Completed</SelectItem>
                      <SelectItem value="in-progress" className="text-white">In Progress</SelectItem>
                      <SelectItem value="hold-waiting-parts" className="text-white">Hold Waiting Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Time Range</label>
                  <Select defaultValue="this-month">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="this-month" className="text-white">This Month</SelectItem>
                      <SelectItem value="last-month" className="text-white">Last Month</SelectItem>
                      <SelectItem value="last-90-days" className="text-white">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.cardClass}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardDescription className={`text-xs font-medium uppercase ${kpi.labelClass}`}>
                        {kpi.label}
                      </CardDescription>
                      <Icon className="w-5 h-5 text-slate-300" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-1">{kpi.value}</div>
                    <p className="text-xs text-slate-300">{kpi.unit}</p>
                    <div className={`text-xs mt-1 ${kpi.noteClass}`}>{kpi.note}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-[1fr_24rem] gap-6 mb-6">
            <div className="space-y-6">
              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-cyan-400" />
                    High Risk Spare Parts Summary
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Inventory risk, reorder exposure, lead time, and purchasing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Catalogue No.</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Part Name</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">On Hand</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Current Stock</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Lead Time</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Usage Rate</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Risk Level</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Monthly Cost</th>
                          <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3">PO Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spareParts.map((part) => (
                          <tr key={part.catalogueNo} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-3 pr-4 text-sm font-medium text-white">{part.catalogueNo}</td>
                            <td className="py-3 pr-4 text-sm text-slate-300">{part.partName}</td>
                            <td className="py-3 pr-4 text-sm text-slate-300">{part.onHand}</td>
                            <td className="py-3 pr-4">
                              <span className="text-sm text-slate-300">{part.currentStock}</span>
                            </td>
                            <td className="py-3 pr-4 text-sm text-slate-300">{part.leadTime}</td>
                            <td className="py-3 pr-4 text-sm text-slate-300">{part.usageRate}</td>
                            <td className="py-3 pr-4">
                              <Badge className={riskBadgeClass(part.riskLevel)}>{part.riskLevel}</Badge>
                            </td>
                            <td className="py-3 pr-4 text-sm font-semibold text-white">{part.monthlyCost}</td>
                            <td className="py-3">{poStatusBadge(part)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#141b2e] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Cost & Usage by Machine Type
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    Mock spare part consumption and monthly part cost contribution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {machineUsage.map((item) => (
                    <div key={item.machine} className="rounded-lg border border-white/10 bg-[#0f1623] p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{item.machine}</div>
                          <div className="text-xs text-slate-400">{item.station} - {item.jobs} maintenance jobs</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-white">{item.cost.toFixed(1)}K THB</div>
                          <div className="text-xs text-cyan-300">{item.usage}% usage share</div>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-purple-500"
                          style={{ width: `${item.usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 border-purple-800/30 2xl:sticky 2xl:top-6 self-start">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-300" />
                    AI Insight / Recommended Actions
                  </CardTitle>
                  <Badge className="bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30">Mock AI</Badge>
                </div>
                <CardDescription className="text-slate-400 text-xs">
                  Cost drivers, root cause summary, and planning recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-[#0f1623]/80 border border-white/10 p-4">
                  <div className="text-xs font-medium text-slate-400 uppercase mb-2">Top Cost Drivers</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Curve-Gen-3B</span>
                      <span className="font-semibold text-white">38%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Replacement Bearings</span>
                      <span className="font-semibold text-white">176.5K THB</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Vacuum Tube Seal</span>
                      <span className="font-semibold text-white">148.2K THB</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#0f1623]/80 border border-white/10 p-4">
                  <div className="text-xs font-medium text-slate-400 uppercase mb-2">Root Cause Style Summary</div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Delays are concentrated around high-usage Class A wear parts with long supplier lead time and reorder points that no longer match current consumption.
                  </p>
                </div>

                <div className="space-y-3">
                  {recommendedActions.map((action) => (
                    <div key={action} className="flex gap-3 rounded-lg bg-[#0f1623]/80 border border-white/10 p-3">
                      <CheckCircle className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#141b2e] border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                Workorder Cost Status
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Completed final cost, in-progress estimates, and hold jobs blocked by required parts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="rounded-lg border border-green-500/20 bg-green-950/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Completed Workorders</h3>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Final Cost</Badge>
                  </div>
                  <div className="space-y-3">
                    {completedWorkorders.map((wo) => (
                      <div key={wo.id} className="rounded-md bg-[#0f1623] border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{wo.id}</span>
                          <Badge className={workorderTypeClass(wo.type)}>{wo.type}</Badge>
                        </div>
                        <div className="text-xs text-slate-400">{wo.machine}</div>
                        <div className="mt-2 text-sm text-slate-300">{wo.parts}</div>
                        <div className="mt-2 text-sm font-semibold text-white">{wo.finalCost}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">In-Progress Workorders</h3>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Estimated</Badge>
                  </div>
                  <div className="space-y-3">
                    {inProgressWorkorders.map((wo) => (
                      <div key={wo.id} className="rounded-md bg-[#0f1623] border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{wo.id}</span>
                          <Badge className={workorderTypeClass(wo.type)}>{wo.type}</Badge>
                        </div>
                        <div className="text-xs text-slate-400">{wo.machine}</div>
                        <div className="mt-2 text-sm font-semibold text-white">{wo.estimate}</div>
                        <div className="mt-1 text-xs text-cyan-300">Estimate confidence: {wo.confidence}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-red-500/20 bg-red-950/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Hold Waiting Parts</h3>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Blocked</Badge>
                  </div>
                  <div className="space-y-3">
                    {holdWorkorders.map((wo) => (
                      <div key={wo.id} className="rounded-md bg-[#0f1623] border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{wo.id}</span>
                          <span className="text-xs font-semibold text-red-300">{wo.blockedCost}</span>
                        </div>
                        <div className="text-xs text-slate-400">{wo.machine} - {wo.reason}</div>
                        <div className="mt-2 text-sm text-slate-300">{wo.requiredPart}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
