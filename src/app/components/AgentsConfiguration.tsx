import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Sparkles,
  Send,
  Settings,
  Code,
  Database,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Save,
  RotateCcw,
  Play,
  Pause,
  Trash2,
  Copy,
  Download,
  Upload,
  Filter,
  Search,
  TrendingUp,
  Bot,
  User,
  Terminal,
  FileCode,
  Wrench,
  Lock,
  Unlock,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle as AlertIcon,
  XCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';

interface AgentsConfigurationProps {
  sidebarCollapsed: boolean;
  onNavigate: (page: string) => void;
}

// Agent metadata
const agents = [
  { id: 'agent-overview', name: 'Overview Operations Agent', version: 'v2.4.1', status: 'active', lastUpdated: '2026-01-10 14:23' },
  { id: 'agent-production', name: 'Production Analysis Agent', version: 'v3.1.0', status: 'active', lastUpdated: '2026-01-09 09:15' },
  { id: 'agent-maintenance', name: 'Maintenance Knowledge Agent', version: 'v2.8.3', status: 'active', lastUpdated: '2026-01-08 16:42' },
  { id: 'agent-engineering', name: 'Engineering Analyst Agent', version: 'v1.9.2', status: 'active', lastUpdated: '2026-01-07 11:30' },
];

// Prompt versions
const promptVersions = [
  { version: 'v2.4.1', date: '2026-01-10 14:23', author: 'Admin', status: 'active', changes: 'Enhanced production context injection' },
  { version: 'v2.4.0', date: '2026-01-05 10:15', author: 'Admin', status: 'archived', changes: 'Updated safety guardrails' },
  { version: 'v2.3.8', date: '2025-12-28 08:45', author: 'Admin', status: 'archived', changes: 'Improved response formatting' },
];

// Agent tools
const agentTools = [
  { id: 'tool-search', name: 'Data Search & Query', category: 'Data Access', enabled: true, permissions: 'Read-only' },
  { id: 'tool-analytics', name: 'Statistical Analysis', category: 'Analytics', enabled: true, permissions: 'Compute' },
  { id: 'tool-kb', name: 'Knowledge Base Retrieval', category: 'Knowledge', enabled: true, permissions: 'Read-only' },
  { id: 'tool-sandbox', name: 'Sandbox Execution', category: 'Execution', enabled: false, permissions: 'Execute (Restricted)' },
  { id: 'tool-viz', name: 'Visualization Generator', category: 'Output', enabled: true, permissions: 'Create' },
  { id: 'tool-export', name: 'Data Export', category: 'Output', enabled: false, permissions: 'Export (Admin only)' },
];

// Agent logs
const agentLogs = [
  { id: 1, timestamp: '2026-01-12 13:24:15', user: 'Production Manager', query: 'Why is production rate lower?', status: 'success', latency: '2.3s', tools: ['Data Search', 'Analytics'] },
  { id: 2, timestamp: '2026-01-12 13:18:42', user: 'Executive', query: 'Show OEE breakdown', status: 'success', latency: '1.8s', tools: ['Data Search', 'Visualization'] },
  { id: 3, timestamp: '2026-01-12 13:12:08', user: 'Maintenance Eng', query: 'CURVE-GEN-3B maintenance history', status: 'success', latency: '1.5s', tools: ['Knowledge Base'] },
  { id: 4, timestamp: '2026-01-12 13:05:33', user: 'Engineer', query: 'Correlate MTTR and scrap rate', status: 'warning', latency: '4.2s', tools: ['Analytics', 'Data Search'] },
  { id: 5, timestamp: '2026-01-12 12:58:17', user: 'Operator', query: 'Machine status', status: 'error', latency: '0.9s', tools: ['Data Search'] },
];

// Performance metrics
const performanceMetrics = {
  successRate: 94.2,
  avgLatency: 2.1,
  userSatisfaction: 4.3,
  escalationRate: 2.8,
  hallucinations: 0.4,
  totalInteractions: 1847,
};

// Guardrails
const guardrails = [
  { id: 'gr-pii', name: 'PII Data Protection', category: 'Data Privacy', enabled: true, violations: 0 },
  { id: 'gr-auth', name: 'Authorization Enforcement', category: 'Security', enabled: true, violations: 0 },
  { id: 'gr-scope', name: 'Topic Scope Restriction', category: 'Behavior', enabled: true, violations: 3 },
  { id: 'gr-output', name: 'Output Length Limit', category: 'Performance', enabled: true, violations: 0 },
  { id: 'gr-toxic', name: 'Toxic Content Filter', category: 'Safety', enabled: true, violations: 0 },
];

const sampleSystemPrompt = `You are the Overview Operations Agent for Manufacturing Execution System (MES).

## Core Identity
- You are an AI operations assistant helping executives, production managers, and maintenance leaders understand operational performance
- You have access to real-time production and maintenance data
- You provide clear, data-driven insights with specific numbers and context

## Response Guidelines
1. Always reference specific data points (machines, times, metrics)
2. Explain root causes, not just symptoms
3. Provide actionable recommendations
4. Use technical manufacturing terminology appropriately
5. Maintain a professional, engineering-focused tone

## Data Access
- Production metrics: rate, OEE, quality, workorders
- Maintenance data: MTTR, downtime, active jobs, backlog
- Historical trends: 90 days of operational data

## Safety & Guardrails
- Never fabricate data or metrics
- Acknowledge uncertainty when data is incomplete
- Escalate to human experts for critical decisions
- Respect data access permissions by user role`;

// Debug chat messages
const debugChatMessages = [
  {
    id: 1,
    role: 'user',
    content: 'Test: Explain current OEE performance',
    timestamp: '13:45',
  },
  {
    id: 2,
    role: 'assistant',
    content: `**OEE Performance Analysis**

Current OEE: 72.4%

**Breakdown:**
• Availability: 85.2% (target: 90%)
• Performance: 92.1% (target: 95%)
• Quality: 97.8% (target: 98%)

**Root Cause Analysis:**
Availability loss primarily from CURVE-GEN-3B downtime (52 min). Performance gap due to reduced staffing (92% coverage).

**Recommendation:** Address bearing failure on CURVE-GEN-3B to recover 4+ OEE points.

---
**Debug Info:**
• Tools used: Data Search, Analytics
• Latency: 2.1s
• Confidence: 95%
• Data sources: Production DB (last 8 hours)`,
    timestamp: '13:45',
    debug: true,
  },
];

export function AgentsConfiguration({ sidebarCollapsed, onNavigate }: AgentsConfigurationProps) {
  const [selectedAgent, setSelectedAgent] = useState('agent-overview');
  const [environment, setEnvironment] = useState('production');
  const [isEditing, setIsEditing] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(sampleSystemPrompt);
  const [debugMessages, setDebugMessages] = useState(debugChatMessages);
  const [debugInput, setDebugInput] = useState('');

  const currentAgent = agents.find(a => a.id === selectedAgent) || agents[0];

  const handleSendDebugMessage = () => {
    if (debugInput.trim()) {
      const newMessage = {
        id: debugMessages.length + 1,
        role: 'user' as const,
        content: debugInput,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      setDebugMessages([...debugMessages, newMessage]);
      setDebugInput('');
    }
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-auto transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-semibold text-white">Agent Configuration</h2>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              Admin Only
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Configure, monitor, and govern Agentic AI behavior and performance
          </p>
        </div>

        {/* Agent Selection & Context */}
        <Card className="bg-[#141b2e] border-white/10 mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Agent Selection */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                  Select Agent
                </label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id} className="text-white">
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Environment */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                  Environment
                </label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="bg-[#1e293b] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    <SelectItem value="production" className="text-white">Production</SelectItem>
                    <SelectItem value="sandbox" className="text-white">Sandbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Version */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                  Version
                </label>
                <div className="h-10 px-3 bg-[#1e293b] border border-white/10 rounded-md flex items-center">
                  <span className="text-sm font-medium text-cyan-400">{currentAgent.version}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                  Status
                </label>
                <div className="h-10 px-3 bg-[#1e293b] border border-white/10 rounded-md flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-400 capitalize">{currentAgent.status}</span>
                </div>
              </div>
            </div>

            {/* Agent Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#1e293b] rounded-lg border border-white/10">
              <div>
                <p className="text-xs text-slate-400 mb-1">Agent ID</p>
                <p className="text-sm font-medium text-white">{currentAgent.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-white">{currentAgent.lastUpdated}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Health Status</p>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Healthy
                </Badge>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Response Rate</p>
                <p className="text-sm font-medium text-cyan-400">{performanceMetrics.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration Panels */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#141b2e] mb-4">
                <TabsTrigger value="prompt" className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                  <FileCode className="w-4 h-4 mr-1" />
                  Prompt
                </TabsTrigger>
                <TabsTrigger value="tools" className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                  <Wrench className="w-4 h-4 mr-1" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="memory" className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                  <Database className="w-4 h-4 mr-1" />
                  Memory
                </TabsTrigger>
                <TabsTrigger value="guardrails" className="data-[state=active]:bg-[#00d4ff] data-[state=active]:text-[#0a0f1e]">
                  <Shield className="w-4 h-4 mr-1" />
                  Guardrails
                </TabsTrigger>
              </TabsList>

              {/* Prompt Configuration Tab */}
              <TabsContent value="prompt" className="space-y-4">
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-white">System Prompt Configuration</CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                          Define agent behavior, capabilities, and constraints
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                            onClick={() => setIsEditing(true)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setIsEditing(false)}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white"
                              onClick={() => setIsEditing(false)}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        System Prompt
                      </label>
                      <div className={`p-4 bg-[#0a0f1e] border border-white/10 rounded-lg ${isEditing ? '' : 'cursor-not-allowed'}`}>
                        <textarea
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                          disabled={!isEditing}
                          className="w-full h-64 bg-transparent text-xs text-slate-300 font-mono resize-none focus:outline-none disabled:opacity-70"
                          style={{ lineHeight: '1.6' }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Characters: {systemPrompt.length}</span>
                        <span>•</span>
                        <span>Tokens: ~{Math.ceil(systemPrompt.length / 4)}</span>
                      </div>
                    </div>

                    {/* Prompt Version History */}
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Version History
                      </label>
                      <div className="space-y-2">
                        {promptVersions.map((ver) => (
                          <div key={ver.version} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{ver.version}</span>
                                {ver.status === 'active' ? (
                                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">
                                    Archived
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mb-1">{ver.changes}</p>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>{ver.date}</span>
                                <span>•</span>
                                <span>{ver.author}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tools Configuration Tab */}
              <TabsContent value="tools" className="space-y-4">
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Tool & Capability Configuration</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Enable and configure tools available to this agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {agentTools.map((tool) => (
                        <div key={tool.id} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Switch checked={tool.enabled} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-white">{tool.name}</p>
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  {tool.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">Permissions: {tool.permissions}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400 hover:text-white">
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-300 mb-1">Security Notice</p>
                          <p className="text-xs text-slate-300">
                            Tool changes affect agent capabilities immediately. Review security implications before enabling execution tools.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Memory Configuration Tab */}
              <TabsContent value="memory" className="space-y-4">
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Memory & Context Management</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Configure agent memory sources and retention policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Memory Usage */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Memory Usage
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <p className="text-xs text-slate-400 mb-1">Short-term</p>
                          <p className="text-lg font-semibold text-cyan-400">2.3 MB</p>
                        </div>
                        <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <p className="text-xs text-slate-400 mb-1">Long-term</p>
                          <p className="text-lg font-semibold text-purple-400">18.7 MB</p>
                        </div>
                        <div className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <p className="text-xs text-slate-400 mb-1">Total</p>
                          <p className="text-lg font-semibold text-white">21.0 MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Memory Sources */}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">
                        Memory Sources
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 text-cyan-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Production Database</p>
                              <p className="text-xs text-slate-400">Real-time production metrics</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 text-purple-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Maintenance Database</p>
                              <p className="text-xs text-slate-400">Maintenance history & records</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Connected
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 text-amber-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Knowledge Base</p>
                              <p className="text-xs text-slate-400">Manuals, SOPs, best practices</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            Connected
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Memory Controls */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Inspect Memory
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear Memory
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Guardrails Tab */}
              <TabsContent value="guardrails" className="space-y-4">
                <Card className="bg-[#141b2e] border-white/10">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-white">Guardrails & Safety Controls</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Configure safety boundaries and compliance rules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {guardrails.map((guardrail) => (
                        <div key={guardrail.id} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Switch checked={guardrail.enabled} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-white">{guardrail.name}</p>
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                  {guardrail.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>Violations: {guardrail.violations}</span>
                                {guardrail.violations > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-400">Last 24h</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400 hover:text-white">
                            <Settings className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-green-300 mb-1">Guardrails Status: Healthy</p>
                          <p className="text-xs text-slate-300">
                            All critical guardrails active. 3 scope violations detected (non-critical).
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Agent Logs & Observability */}
            <Card className="bg-[#141b2e] border-white/10 mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">Agent Logs & Observability</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Recent agent interactions and performance traces
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                      <Filter className="w-3 h-3 mr-1" />
                      Filter
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white">
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <table className="w-full text-xs">
                    <thead className="bg-[#1e293b]">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Timestamp</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">User</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Query</th>
                        <th className="px-3 py-2 text-left text-slate-400 font-medium">Tools Used</th>
                        <th className="px-3 py-2 text-center text-slate-400 font-medium">Latency</th>
                        <th className="px-3 py-2 text-center text-slate-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#141b2e]">
                      {agentLogs.map((log) => (
                        <tr key={log.id} className="border-t border-white/10 hover:bg-[#1e293b] cursor-pointer">
                          <td className="px-3 py-2 text-slate-400">{log.timestamp}</td>
                          <td className="px-3 py-2 text-slate-300">{log.user}</td>
                          <td className="px-3 py-2 text-white">{log.query}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {log.tools.map((tool, idx) => (
                                <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-300">{log.latency}</td>
                          <td className="px-3 py-2 text-center">
                            {log.status === 'success' && (
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                Success
                              </Badge>
                            )}
                            {log.status === 'warning' && (
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                Warning
                              </Badge>
                            )}
                            {log.status === 'error' && (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                Error
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Debug Chat & Metrics */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-white">Performance & Quality</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Agent effectiveness metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Success Rate</span>
                    <span className="text-sm font-semibold text-green-400">{performanceMetrics.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Avg Latency</span>
                    <span className="text-sm font-semibold text-cyan-400">{performanceMetrics.avgLatency}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">User Satisfaction</span>
                    <span className="text-sm font-semibold text-amber-400">{performanceMetrics.userSatisfaction}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Escalation Rate</span>
                    <span className="text-sm font-semibold text-purple-400">{performanceMetrics.escalationRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Hallucination Rate</span>
                    <span className="text-sm font-semibold text-red-400">{performanceMetrics.hallucinations}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-400">Total Interactions</span>
                    <span className="text-sm font-semibold text-white">{performanceMetrics.totalInteractions.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debug Chat */}
            <Card className="bg-[#141b2e] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">Agent Debug Mode</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Test agent behavior and responses
                    </CardDescription>
                  </div>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    Debug Only
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
                  <p className="text-xs text-amber-300">
                    ⚠️ Responses may differ from production. For testing only.
                  </p>
                </div>

                <ScrollArea className="h-64 mb-3 p-3 bg-[#0a0f1e] rounded-lg border border-white/10">
                  <div className="space-y-3">
                    {debugMessages.map((message) => (
                      <div key={message.id} className="flex gap-2">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'
                          }`}>
                          {message.role === 'user' ? (
                            <User className="w-3 h-3 text-slate-300" />
                          ) : (
                            <Bot className="w-3 h-3 text-cyan-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-white">
                              {message.role === 'user' ? 'Test' : 'Agent'}
                            </span>
                            <span className="text-xs text-slate-500">{message.timestamp}</span>
                          </div>
                          <div className="text-xs text-slate-300 bg-[#1e293b] p-2 rounded whitespace-pre-line">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-end gap-2">
                  <Input
                    value={debugInput}
                    onChange={(e) => setDebugInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendDebugMessage();
                      }
                    }}
                    placeholder="Test query..."
                    className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-xs"
                  />
                  <Button
                    onClick={handleSendDebugMessage}
                    disabled={!debugInput.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    size="sm"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
