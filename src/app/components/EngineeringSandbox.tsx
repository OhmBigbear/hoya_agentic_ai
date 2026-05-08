import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  BarChart3,
  LineChart,
  ScatterChart,
  TrendingUp,
  Download,
  Maximize2,
  Trash2,
  Play,
  Bot,
  User,
  Database,
  Activity,
  AlertTriangle,
  ChevronDown,
  Code,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface EngineeringSandboxProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// Sample data for visualizations
const productionRateData = [
  { day: 'Jan 05', rate: 245, downtime: 45, target: 280 },
  { day: 'Jan 06', rate: 268, downtime: 28, target: 280 },
  { day: 'Jan 07', rate: 255, downtime: 38, target: 280 },
  { day: 'Jan 08', rate: 242, downtime: 52, target: 280 },
  { day: 'Jan 09', rate: 272, downtime: 22, target: 280 },
  { day: 'Jan 10', rate: 265, downtime: 30, target: 280 },
  { day: 'Jan 11', rate: 258, downtime: 35, target: 280 },
];

const correlationData = [
  { mttr: 2.1, scrapRate: 3.2 },
  { mttr: 1.8, scrapRate: 2.8 },
  { mttr: 3.5, scrapRate: 5.1 },
  { mttr: 2.9, scrapRate: 4.2 },
  { mttr: 1.5, scrapRate: 2.3 },
  { mttr: 4.2, scrapRate: 6.5 },
  { mttr: 2.6, scrapRate: 3.8 },
  { mttr: 3.1, scrapRate: 4.5 },
  { mttr: 1.9, scrapRate: 2.9 },
  { mttr: 3.8, scrapRate: 5.8 },
];

const cycleTimeVariance = [
  { station: 'AUTO TAPING', mean: 32.5, variance: 2.8, cv: 8.6 },
  { station: 'ALLOY BLOCKING', mean: 45.2, variance: 3.1, cv: 6.9 },
  { station: 'CURVE GEN', mean: 68.8, variance: 12.4, cv: 18.0 },
  { station: 'POLISHING', mean: 52.3, variance: 4.2, cv: 8.0 },
  { station: 'LASER ENGR', mean: 28.7, variance: 1.9, cv: 6.6 },
  { station: 'UNBLOCKING', mean: 18.4, variance: 1.2, cv: 6.5 },
];

const beforeAfterData = [
  { metric: 'OEE %', before: 72.3, after: 81.5 },
  { metric: 'MTBF (hrs)', before: 45.2, after: 68.7 },
  { metric: 'Scrap Rate %', before: 4.8, after: 2.9 },
  { metric: 'Avg Cycle Time', before: 48.5, after: 42.1 },
];

// AI chat messages
const sampleChatMessages = [
  {
    id: 1,
    role: 'user',
    content: 'Compare production rate vs downtime for last 7 days',
    timestamp: '10:15',
  },
  {
    id: 2,
    role: 'assistant',
    content: `**Analysis Complete: Production Rate vs Downtime Correlation**

I've generated a time-series comparison showing the inverse relationship between production rate and downtime over the past 7 days.

**Key Findings:**
• **Negative correlation coefficient: -0.87** (strong inverse relationship)
• Days with higher downtime (52 min on Jan 08) show 13% lower production rates
• Production target of 280 units/hr was only met on Jan 09 (22 min downtime)
• Average production rate: 258 units/hr (7.9% below target)
• Total downtime: 250 minutes across 7 days

**Statistical Insights:**
• Standard deviation in production rate: 10.4 units/hr
• Downtime shows high variability (CV = 32.1%)
• Recommend root cause analysis for Jan 08 spike

The visualization has been added to your canvas.`,
    timestamp: '10:15',
    analysisType: 'Time Series Comparison',
    resultId: 'result-1',
  },
  {
    id: 3,
    role: 'user',
    content: 'Show correlation between MTTR and scrap rate',
    timestamp: '10:18',
  },
  {
    id: 4,
    role: 'assistant',
    content: `**Analysis Complete: MTTR vs Scrap Rate Correlation**

I've created a scatter plot analysis examining the relationship between Mean Time To Repair (MTTR) and scrap rate across maintenance events.

**Statistical Results:**
• **Pearson correlation: r = 0.94** (very strong positive correlation)
• **R² = 0.88** (88% of scrap variance explained by MTTR)
• **Linear regression: Scrap Rate = 1.52 × MTTR + 0.11**

**Engineering Interpretation:**
• Each additional hour of MTTR correlates with 1.52% increase in scrap rate
• Longer repair times significantly impact quality performance
• Quick repairs (MTTR < 2 hrs) keep scrap below 3%
• Extended repairs (MTTR > 3.5 hrs) correlate with 5%+ scrap rates

**Recommendation:**
• Focus on reducing MTTR through better spare parts availability
• Implement predictive maintenance to avoid emergency repairs
• Target MTTR < 2 hours to maintain quality standards

Scatter plot visualization added to canvas.`,
    timestamp: '10:18',
    analysisType: 'Correlation Analysis',
    resultId: 'result-2',
  },
];

interface AnalysisResult {
  id: string;
  title: string;
  dataSource: string;
  type: 'chart' | 'table' | 'both';
  chartType?: 'line' | 'bar' | 'scatter';
  timestamp: string;
  insight: string;
}

const analysisResults: AnalysisResult[] = [
  {
    id: 'result-1',
    title: 'Production Rate vs Downtime - 7 Day Trend Analysis',
    dataSource: 'Production • Jan 05-11, 2026',
    type: 'chart',
    chartType: 'line',
    timestamp: '10:15 AM',
    insight: 'Strong inverse correlation (-0.87) detected. Downtime reduction of 10 minutes correlates with ~8% production increase.',
  },
  {
    id: 'result-2',
    title: 'MTTR vs Scrap Rate - Correlation Analysis',
    dataSource: 'Combined: Production & Maintenance • Last 30 days',
    type: 'chart',
    chartType: 'scatter',
    timestamp: '10:18 AM',
    insight: 'Very strong positive correlation (r = 0.94). Each hour increase in MTTR correlates with 1.52% scrap rate increase.',
  },
];

export function EngineeringSandbox({ sidebarCollapsed, onNavigate }: EngineeringSandboxProps) {
  const [selectedLine, setSelectedLine] = useState('rx1-surfacing');
  const [selectedStation, setSelectedStation] = useState('all');
  const [selectedDataDomain, setSelectedDataDomain] = useState('combined');
  const [timeRange, setTimeRange] = useState('7d');
  const [messages, setMessages] = useState(sampleChatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [results, setResults] = useState(analysisResults);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        role: 'user' as const,
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setMessages([...messages, newMessage]);
      setInputMessage('');
    }
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-hidden transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex flex-col">
        {/* Page Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Engineering Sandbox</h2>
              <p className="text-sm text-slate-400">
                Advanced analytical workspace for exploratory data analysis and hypothesis testing
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <Code className="w-4 h-4 mr-1" />
                Export Analysis
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear Canvas
              </Button>
            </div>
          </div>

          {/* Analysis Control Area */}
          <Card className="bg-[#141b2e] border-white/10">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {/* Production Line */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Production Line
                  </label>
                  <Select value={selectedLine} onValueChange={setSelectedLine}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="rx1-surfacing" className="text-white">Rx1 Surfacing</SelectItem>
                      <SelectItem value="rx2-coating" className="text-white">Rx2 Coating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Station / Process */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Station / Process
                  </label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all" className="text-white">All Stations</SelectItem>
                      <SelectItem value="curve-gen" className="text-white">CURVE GENERATING</SelectItem>
                      <SelectItem value="polishing" className="text-white">POLISHING</SelectItem>
                      <SelectItem value="laser-engr" className="text-white">LASER ENGRAVING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Machine */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Machine
                  </label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="all" className="text-white">All Machines</SelectItem>
                      <SelectItem value="curve-gen-3b" className="text-white">CURVE-GEN-3B</SelectItem>
                      <SelectItem value="polishing-7a" className="text-white">POLISHING-7A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Range */}
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Time Range
                  </label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="bg-[#1e293b] border-white/10 text-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                      <SelectItem value="24h" className="text-white">Last 24 Hours</SelectItem>
                      <SelectItem value="7d" className="text-white">Last 7 Days</SelectItem>
                      <SelectItem value="30d" className="text-white">Last 30 Days</SelectItem>
                      <SelectItem value="90d" className="text-white">Last 90 Days</SelectItem>
                      <SelectItem value="custom" className="text-white">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Domain */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                    Data Domain
                  </label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedDataDomain === 'production' ? 'default' : 'outline'}
                      onClick={() => setSelectedDataDomain('production')}
                      className={selectedDataDomain === 'production' 
                        ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] h-9 flex-1'
                        : 'border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white h-9 flex-1'
                      }
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      Production
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDataDomain === 'maintenance' ? 'default' : 'outline'}
                      onClick={() => setSelectedDataDomain('maintenance')}
                      className={selectedDataDomain === 'maintenance' 
                        ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] h-9 flex-1'
                        : 'border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white h-9 flex-1'
                      }
                    >
                      <Database className="w-3 h-3 mr-1" />
                      Maintenance
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDataDomain === 'combined' ? 'default' : 'outline'}
                      onClick={() => setSelectedDataDomain('combined')}
                      className={selectedDataDomain === 'combined' 
                        ? 'bg-[#00d4ff] hover:bg-[#00b8e6] text-[#0a0f1e] h-9 flex-1'
                        : 'border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white h-9 flex-1'
                      }
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Combined
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Analysis Context */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-400 font-medium">Analysis Context:</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                      Rx1 Surfacing
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                      All Stations
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                      7 Days
                    </Badge>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                      Combined Data
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {results.length} analysis result(s) in canvas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Data & Visualization Canvas */}
          <div className="flex-1 overflow-auto p-6 bg-[#0a0f1e]">
            {results.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analysis Canvas Ready</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Ask the AI Engineering Analyst questions to generate visualizations and insights.
                  </p>
                  <div className="text-xs text-slate-500">
                    Try: "Compare production rate trends" or "Show cycle time distribution"
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Result Block 1: Line Chart */}
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <LineChart className="w-4 h-4 text-cyan-400" />
                          <CardTitle className="text-base font-semibold text-white">
                            Production Rate vs Downtime - 7 Day Trend Analysis
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                          Production • Jan 05-11, 2026 • Generated at 10:15 AM
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsLineChart data={productionRateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="day" 
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                          label={{ value: 'Production Rate (units/hr)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '11px' } }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                          label={{ value: 'Downtime (min)', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: '11px' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="rate" 
                          stroke="#00d4ff" 
                          strokeWidth={2}
                          name="Production Rate"
                          dot={{ fill: '#00d4ff', r: 4 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="downtime" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Downtime"
                          dot={{ fill: '#ef4444', r: 4 }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="target" 
                          stroke="#fbbf24" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Target"
                          dot={false}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>

                    {/* Insight Summary */}
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-cyan-300 mb-1">AI Insight</p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Strong inverse correlation (-0.87) detected. Downtime reduction of 10 minutes correlates with ~8% production increase. 
                            Target achievement requires maintaining downtime below 25 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Result Block 2: Scatter Plot */}
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <ScatterChart className="w-4 h-4 text-purple-400" />
                          <CardTitle className="text-base font-semibold text-white">
                            MTTR vs Scrap Rate - Correlation Analysis
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                          Combined: Production & Maintenance • Last 30 days • Generated at 10:18 AM
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          type="number" 
                          dataKey="mttr" 
                          name="MTTR"
                          unit=" hrs"
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                          label={{ value: 'MTTR (hours)', position: 'insideBottom', offset: -5, style: { fill: '#64748b', fontSize: '11px' } }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="scrapRate" 
                          name="Scrap Rate"
                          unit="%"
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                          label={{ value: 'Scrap Rate (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '11px' } }}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Scatter 
                          name="Data Points" 
                          data={correlationData} 
                          fill="#a855f7"
                        />
                      </RechartsScatterChart>
                    </ResponsiveContainer>

                    {/* Statistical Summary */}
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Correlation (r)</p>
                        <p className="text-lg font-semibold text-purple-400">0.94</p>
                      </div>
                      <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">R² Value</p>
                        <p className="text-lg font-semibold text-purple-400">0.88</p>
                      </div>
                      <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Slope</p>
                        <p className="text-lg font-semibold text-purple-400">1.52</p>
                      </div>
                      <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Intercept</p>
                        <p className="text-lg font-semibold text-purple-400">0.11</p>
                      </div>
                    </div>

                    {/* Insight Summary */}
                    <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-purple-300 mb-1">AI Insight</p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Very strong positive correlation (r = 0.94). Each hour increase in MTTR correlates with 1.52% scrap rate increase. 
                            Recommend targeting MTTR {'<'} 2 hours to maintain quality standards below 3% scrap.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Result Block 3: Table + Bar Chart Combination */}
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-amber-400" />
                          <CardTitle className="text-base font-semibold text-white">
                            Cycle Time Variance by Station - Process Stability Analysis
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                          Production • All Machines • Last 30 days • Generated at 10:22 AM
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Data Table */}
                    <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
                      <table className="w-full text-xs">
                        <thead className="bg-[#1e293b]">
                          <tr>
                            <th className="px-4 py-3 text-left text-slate-400 font-medium">Station</th>
                            <th className="px-4 py-3 text-right text-slate-400 font-medium">Mean (sec)</th>
                            <th className="px-4 py-3 text-right text-slate-400 font-medium">Variance (σ²)</th>
                            <th className="px-4 py-3 text-right text-slate-400 font-medium">CV (%)</th>
                            <th className="px-4 py-3 text-center text-slate-400 font-medium">Stability</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[#141b2e]">
                          {cycleTimeVariance.map((row, idx) => (
                            <tr key={idx} className="border-t border-white/10">
                              <td className="px-4 py-3 text-white font-medium">{row.station}</td>
                              <td className="px-4 py-3 text-right text-slate-300">{row.mean}</td>
                              <td className="px-4 py-3 text-right text-slate-300">{row.variance}</td>
                              <td className="px-4 py-3 text-right text-slate-300">{row.cv}</td>
                              <td className="px-4 py-3 text-center">
                                {row.cv < 10 ? (
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                    Stable
                                  </Badge>
                                ) : row.cv < 15 ? (
                                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                    Moderate
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                                    High Variance
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={cycleTimeVariance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis 
                          dataKey="station" 
                          stroke="#64748b"
                          style={{ fontSize: '10px' }}
                          angle={-15}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '11px' }}
                          label={{ value: 'Coefficient of Variation (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: '11px' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="cv" name="CV (%)">
                          {cycleTimeVariance.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.cv < 10 ? '#10b981' : entry.cv < 15 ? '#fbbf24' : '#ef4444'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Insight Summary */}
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-300 mb-1">AI Insight</p>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            CURVE GENERATING shows highest process variability (CV = 18.0%). Recommend investigation of parameter drift 
                            and operator technique variation. All other stations maintain acceptable stability (CV {'<'} 10%).
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Panel - AI Engineering Analyst */}
          <div className="w-96 border-l border-white/10 bg-[#0f1623] flex flex-col">
            {/* Analyst Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Engineering Analyst</h3>
                  <p className="text-xs text-slate-400">
                    Advanced data analysis assistant
                  </p>
                </div>
              </div>

              {/* Analysis Type Selector */}
              <div className="p-2 bg-[#141b2e] border border-white/10 rounded-lg">
                <p className="text-xs text-slate-400 mb-2">Analysis Capabilities:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    Trend Analysis
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    Correlation
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    Outlier Detection
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                    Comparison
                  </Badge>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                    Variance
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-2">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                      message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-3 h-3 text-slate-300" />
                      ) : (
                        <Bot className="w-3 h-3 text-cyan-400" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">
                          {message.role === 'user' ? 'You' : 'Analyst'}
                        </span>
                        <span className="text-xs text-slate-500">{message.timestamp}</span>
                      </div>

                      {/* User Message */}
                      {message.role === 'user' && (
                        <div className="text-xs text-slate-300 bg-[#1e293b] p-2 rounded-lg">
                          {message.content}
                        </div>
                      )}

                      {/* Assistant Message */}
                      {message.role === 'assistant' && (
                        <div className="text-xs text-slate-300 bg-[#141b2e] border border-white/10 p-3 rounded-lg">
                          <div className="whitespace-pre-line leading-relaxed">
                            {message.content}
                          </div>
                          {message.analysisType && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                                {message.analysisType}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-white/10">
              {/* Suggested Questions */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-2">Quick analyses:</p>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('Which station has highest variance?')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Station variance comparison
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('Before/after maintenance comparison')}
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Before/after analysis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7"
                    onClick={() => setInputMessage('Detect outliers in production data')}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Outlier detection
                  </Button>
                </div>
              </div>

              {/* Input Field */}
              <div className="flex items-end gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask analytical question..."
                  className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-xs h-9"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-3"
                  size="sm"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-2">
                Statistical analysis powered by AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
