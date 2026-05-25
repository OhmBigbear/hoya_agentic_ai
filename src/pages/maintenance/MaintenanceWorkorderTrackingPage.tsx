import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  History,
  Package,
  Send,
  Sparkles,
  Timer,
  User,
  Wrench,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../../app/components/ui/badge';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Input } from '../../app/components/ui/input';
import { ScrollArea } from '../../app/components/ui/scroll-area';
import {
  getHoldReasonSummary,
  getMachineMaintenanceHistory,
  getMaintenanceDashboardSummary,
  getRepeatFailureCandidates,
  getSparePartUsageByWorkorder,
  getStockRiskSummary,
  getWorkorderDetail,
  getWorkorderTracking,
} from '../../services/maintenanceWorkorderApi';
import type {
  MaintenanceDashboardSummary,
  MaintenanceHoldHistory,
  MaintenancePartUsage,
  MaintenanceRiskMachine,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderDetail,
} from '../../types/maintenance';

interface MaintenanceWorkorderTrackingPageProps {
  sidebarCollapsed: boolean;
}

interface DetailState {
  detail?: MaintenanceWorkOrderDetail;
  history: MaintenanceWorkOrder[];
  parts: MaintenancePartUsage[];
  loading: boolean;
  error?: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const emptySummary: MaintenanceDashboardSummary = {
  open_workorder_count: 0,
  overdue_workorder_count: 0,
  on_hold_workorder_count: 0,
  completed_workorder_count: 0,
  total_downtime_hours: 0,
  repeat_failure_candidate_count: 0,
  stock_risk_item_count: 0,
  mtbf_mttr: [],
  top_risk_machines: [],
  top_hold_reasons: [],
};

const chartColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'];

export function MaintenanceWorkorderTrackingPage({ sidebarCollapsed }: MaintenanceWorkorderTrackingPageProps) {
  const [workorders, setWorkorders] = useState<MaintenanceWorkOrder[]>([]);
  const [summary, setSummary] = useState<MaintenanceDashboardSummary>(emptySummary);
  const [holdReasons, setHoldReasons] = useState<MaintenanceHoldHistory[]>([]);
  const [repeatFailures, setRepeatFailures] = useState<MaintenanceRiskMachine[]>([]);
  const [stockRisk, setStockRisk] = useState<MaintenanceRiskMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<Record<string, DetailState>>({});
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'Maintenance workorder visibility is online. I can summarize open jobs, parts risk, repeat failure candidates, and likely blockers from the current API snapshot.',
      timestamp: 'Now',
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setLoading(true);
      setError(null);

      try {
        const [workordersResult, summaryResult, holdsResult, repeatsResult, stockResult] = await Promise.allSettled([
          getWorkorderTracking({ limit: 100 }),
          getMaintenanceDashboardSummary(),
          getHoldReasonSummary({ limit: 10 }),
          getRepeatFailureCandidates({ limit: 10 }),
          getStockRiskSummary({ limit: 10 }),
        ]);

        if (cancelled) {
          return;
        }

        const failures = [workordersResult, summaryResult, holdsResult, repeatsResult, stockResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => (result as PromiseRejectedResult).reason?.message ?? 'Maintenance API request failed');

        if (workordersResult.status === 'fulfilled') {
          setWorkorders(workordersResult.value.data);
        } else {
          setWorkorders([]);
        }

        if (summaryResult.status === 'fulfilled') {
          setSummary({ ...emptySummary, ...summaryResult.value.data });
        } else {
          setSummary(emptySummary);
        }

        setHoldReasons(holdsResult.status === 'fulfilled' ? holdsResult.value.data : []);
        setRepeatFailures(repeatsResult.status === 'fulfilled' ? repeatsResult.value.data : []);
        setStockRisk(stockResult.status === 'fulfilled' ? stockResult.value.data : []);
        setError(failures.length ? failures.join(' ') : null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(() => buildKpis(summary, workorders, stockRisk), [summary, workorders, stockRisk]);
  const mttrTrend = useMemo(() => buildMttrTrend(summary), [summary]);
  const frequencyData = useMemo(() => buildFrequencyData(workorders, repeatFailures), [workorders, repeatFailures]);
  const selectedWorkorder = expandedRow ? workorders.find((workorder) => workorder.workorder_no === expandedRow) : undefined;

  const toggleRowExpansion = async (workorder: MaintenanceWorkOrder) => {
    const workorderNo = workorder.workorder_no;
    const nextExpandedRow = expandedRow === workorderNo ? null : workorderNo;
    setExpandedRow(nextExpandedRow);

    if (!nextExpandedRow || detailState[workorderNo]?.detail || detailState[workorderNo]?.loading) {
      return;
    }

    setDetailState((current) => ({
      ...current,
      [workorderNo]: { history: [], parts: [], loading: true },
    }));

    const equipmentNo = workorder.equipment_no;
    const [detailResult, partsResult, historyResult] = await Promise.allSettled([
      getWorkorderDetail(workorderNo),
      getSparePartUsageByWorkorder(workorderNo),
      equipmentNo ? getMachineMaintenanceHistory(equipmentNo, { limit: 5 }) : Promise.resolve({ data: [] }),
    ]);

    setDetailState((current) => ({
      ...current,
      [workorderNo]: {
        detail: detailResult.status === 'fulfilled' ? detailResult.value.data : undefined,
        parts: partsResult.status === 'fulfilled' ? partsResult.value.data : [],
        history: historyResult.status === 'fulfilled' ? historyResult.value.data : [],
        loading: false,
        error: [detailResult, partsResult, historyResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => (result as PromiseRejectedResult).reason?.message ?? 'Detail API request failed')
          .join(' '),
      },
    }));
  };

  const handleSendMessage = () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const assistantMessage = buildAssistantResponse(trimmedMessage, summary, workorders, selectedWorkorder);
    setMessages((current) => [
      ...current,
      { id: current.length + 1, role: 'user', content: trimmedMessage, timestamp },
      { id: current.length + 2, role: 'assistant', content: assistantMessage, timestamp },
    ]);
    setInputMessage('');
  };

  return (
    <main
      className="fixed top-16 right-0 bottom-0 bg-[#0a0f1e] overflow-hidden transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      <div className="h-full flex">
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">Station Maintenance Tracking</h2>
                <p className="text-sm text-slate-400">
                  Read-only maintenance workorder visibility from the Maintenance Runtime API
                </p>
              </div>
              <Button onClick={() => setIsCopilotOpen(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Copilot
              </Button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Some maintenance data could not be loaded. Showing available API results. {error}
              </div>
            )}

            <MaintenanceKpiCards loading={loading} kpis={kpis} />

            <MaintenanceWorkorderTable
              workorders={workorders}
              loading={loading}
              expandedRow={expandedRow}
              detailState={detailState}
              onToggleRow={toggleRowExpansion}
            />

            <MaintenanceAnalyticsSection
              loading={loading}
              mttrTrend={mttrTrend}
              holdReasons={holdReasons}
              frequencyData={frequencyData}
              stockRisk={stockRisk}
            />
          </div>
        </div>

        <MaintenanceAssistantPanel
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          onSendMessage={handleSendMessage}
          summary={summary}
          selectedWorkorder={selectedWorkorder}
        />
      </div>
    </main>
  );
}

export function MaintenanceKpiCards({ loading, kpis }: { loading: boolean; kpis: ReturnType<typeof buildKpis> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const DetailIcon = kpi.detailIcon;
        return (
          <Card key={kpi.label} className={`bg-gradient-to-br ${kpi.className}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className={`text-xs font-medium uppercase ${kpi.labelClassName}`}>
                  {kpi.label}
                </CardDescription>
                <Icon className={`w-4 h-4 ${kpi.iconClassName}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-1">{loading ? '...' : kpi.value}</div>
              <p className={`text-xs ${kpi.captionClassName}`}>{kpi.caption}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${kpi.detailClassName}`}>
                <DetailIcon className="w-3 h-3" />
                <span>{kpi.detail}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function MaintenanceWorkorderTable({
  workorders,
  loading,
  expandedRow,
  detailState,
  onToggleRow,
}: {
  workorders: MaintenanceWorkOrder[];
  loading: boolean;
  expandedRow: string | null;
  detailState: Record<string, DetailState>;
  onToggleRow: (workorder: MaintenanceWorkOrder) => void;
}) {
  return (
    <Card className="bg-[#141b2e] border-white/10 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          Maintenance Workorder Tracking
        </CardTitle>
        <CardDescription className="text-slate-400 text-xs">
          Open and recent maintenance jobs with API-backed operational context
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-12 rounded bg-[#1e293b] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : workorders.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#1e293b] p-6 text-center">
            <p className="text-sm font-medium text-white">No maintenance workorders returned</p>
            <p className="mt-1 text-xs text-slate-400">The runtime API responded successfully but no rows matched the current query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4"></th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Workorder No</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Machine</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Work Type</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Technician</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Elapsed</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">ETA</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Parts Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Priority</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase pb-3 pr-4">Progress</th>
                </tr>
              </thead>
              <tbody>
                {workorders.map((workorder) => {
                  const progress = getProgress(workorder);
                  const isExpanded = expandedRow === workorder.workorder_no;
                  const detail = detailState[workorder.workorder_no];

                  return (
                    <FragmentRow
                      key={workorder.workorder_no}
                      workorder={workorder}
                      progress={progress}
                      isExpanded={isExpanded}
                      detail={detail}
                      onToggleRow={onToggleRow}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FragmentRow({
  workorder,
  progress,
  isExpanded,
  detail,
  onToggleRow,
}: {
  workorder: MaintenanceWorkOrder;
  progress: number;
  isExpanded: boolean;
  detail?: DetailState;
  onToggleRow: (workorder: MaintenanceWorkOrder) => void;
}) {
  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => onToggleRow(workorder)}>
        <td className="py-3 pr-4">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-cyan-400 font-medium">{workorder.workorder_no}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-white font-medium">{workorder.equipment_no || 'Unassigned'}</span>
          <p className="text-xs text-slate-400">{workorder.equipment_desc || workorder.location || 'No machine description'}</p>
        </td>
        <td className="py-3 pr-4">
          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">{formatWorkType(workorder.job_type)}</Badge>
        </td>
        <td className="py-3 pr-4">
          <Badge className={getStatusBadgeClass(workorder.status)}>{formatStatus(workorder.status)}</Badge>
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-white">{getTechnician(workorder)}</span>
          <p className="text-xs text-slate-400">{workorder.department || workorder.site || 'Maintenance'}</p>
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-slate-300">{formatHours(workorder.total_repair_time_hours || workorder.down_time_hours)}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="text-sm text-slate-300">{formatDateTime(workorder.plan_finish)}</span>
        </td>
        <td className="py-3 pr-4">
          <Badge className={getPartsBadgeClass(workorder)}>{getPartsStatus(workorder)}</Badge>
        </td>
        <td className="py-3 pr-4">
          <Badge className={getPriorityBadgeClass(workorder.priority)}>{workorder.priority || 'Normal'}</Badge>
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden w-20">
              <div className={progress >= 100 ? 'h-full bg-green-500' : progress > 50 ? 'h-full bg-blue-500' : 'h-full bg-yellow-500'} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-400 w-10">{progress}%</span>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-[#1e293b]/30">
          <td colSpan={11} className="py-4 px-6">
            <WorkorderDetailPanel workorder={workorder} detail={detail} />
          </td>
        </tr>
      )}
    </>
  );
}

function WorkorderDetailPanel({ workorder, detail }: { workorder: MaintenanceWorkOrder; detail?: DetailState }) {
  if (detail?.loading) {
    return <div className="text-sm text-slate-300">Loading workorder details...</div>;
  }

  const detailRecord = detail?.detail;
  const parts = detail?.parts.length ? detail.parts : detailRecord?.parts ?? [];
  const history = detail?.history ?? [];
  const timelineItems = buildTimeline(workorder, detailRecord);

  return (
    <div className="space-y-4">
      {detail?.error && (
        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          Some detail sections could not be loaded. {detail.error}
        </div>
      )}
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Issue Description</h4>
        <p className="text-sm text-slate-300">{workorder.failure_description || workorder.reason || detailRecord?.action_description || 'No issue description provided by API.'}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <MaintenanceTimeline items={timelineItems} />
        <DetailList
          title="Parts Usage"
          emptyText="No parts transactions returned"
          rows={parts.map((part) => ({
            key: `${part.catalogue_no}-${part.part_name}`,
            primary: part.catalogue_no || part.part_name || 'Uncatalogued part',
            secondary: `${part.part_name || 'No part description'} - Qty ${part.issued_qty || part.movement_qty || 0} ${part.uom || ''}`,
          }))}
        />
        <DetailList
          title="Maintenance History"
          emptyText="No equipment history returned"
          rows={history.map((item) => ({
            key: item.workorder_no,
            primary: item.workorder_no,
            secondary: `${formatWorkType(item.job_type)} - ${formatHours(item.total_repair_time_hours || item.down_time_hours)}`,
          }))}
        />
        <DetailList
          title="Downtime Context"
          emptyText="No downtime context returned"
          rows={[
            { key: 'downtime', primary: `${formatHours(workorder.down_time_hours)} downtime`, secondary: workorder.solution || 'No corrective action recorded' },
            { key: 'tasks', primary: `${detailRecord?.tasks?.length ?? workorder.task_count ?? 0} task records`, secondary: `${workorder.part_transaction_count ?? 0} part transactions` },
          ]}
        />
      </div>
    </div>
  );
}

export function MaintenanceTimeline({ items }: { items: Array<{ label: string; value: string; status: 'completed' | 'active' | 'pending' }> }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-white mb-3">Timeline</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 ${item.status === 'completed' ? 'bg-green-500 border-green-500' : item.status === 'active' ? 'bg-blue-500 border-blue-500' : 'bg-slate-700 border-slate-600'}`} />
              {index < items.length - 1 && <div className="w-0.5 h-7 bg-slate-700" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-200">{item.label}</span>
                <span className="text-xs text-slate-400">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailList({ title, emptyText, rows }: { title: string; emptyText: string; rows: Array<{ key: string; primary: string; secondary: string }> }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400">{emptyText}</p>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="rounded border border-white/10 bg-[#141b2e] p-2">
              <p className="text-xs font-medium text-slate-200">{row.primary}</p>
              <p className="mt-1 text-xs text-slate-400">{row.secondary}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function MaintenanceAnalyticsSection({
  loading,
  mttrTrend,
  holdReasons,
  frequencyData,
  stockRisk,
}: {
  loading: boolean;
  mttrTrend: Array<{ label: string; mttr: number; downtime: number }>;
  holdReasons: MaintenanceHoldHistory[];
  frequencyData: Array<{ machine: string; count: number }>;
  stockRisk: MaintenanceRiskMachine[];
}) {
  const delayReasons = holdReasons.slice(0, 5).map((reason, index) => ({
    reason: reason.hold_reason_description || 'Unspecified',
    value: reason.hold_count ?? reason.affected_workorder_count ?? 0,
    color: chartColors[index % chartColors.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className="bg-[#141b2e] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-400" />
            MTTR Trend
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Equipment-level MTTR from dashboard summary</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : mttrTrend.length === 0 ? <EmptyAnalytics text="No MTTR rows returned" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mttrTrend}>
                <defs>
                  <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="label" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="mttr" stroke="#06b6d4" fill="url(#mttrGradient)" name="MTTR (hr)" strokeWidth={2} />
                <Line type="monotone" dataKey="downtime" stroke="#f59e0b" name="Downtime (hr)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#141b2e] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Delay Reasons
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Hold reason distribution from maintenance analytics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : delayReasons.length === 0 ? <EmptyAnalytics text="No hold reasons returned" /> : (
            <div className="flex items-center justify-between gap-4">
              <ResponsiveContainer width="50%" height={190}>
                <PieChart>
                  <Pie data={delayReasons} dataKey="value" nameKey="reason" cx="50%" cy="50%" outerRadius={70} label={false}>
                    {delayReasons.map((entry) => <Cell key={entry.reason} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {delayReasons.map((entry) => (
                  <div key={entry.reason} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-slate-300 truncate">{entry.reason}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#141b2e] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Maintenance Frequency
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Most active machines from workorder and repeat failure APIs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : frequencyData.length === 0 ? <EmptyAnalytics text="No machine frequency data returned" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={frequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <YAxis type="category" dataKey="machine" stroke="#94a3b8" style={{ fontSize: '11px' }} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Workorders" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#141b2e] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-green-400" />
            Maintenance History Signals
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Inventory risk and recent maintenance context</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : stockRisk.length === 0 ? <EmptyAnalytics text="No stock risk records returned" /> : (
            <div className="space-y-3">
              {stockRisk.slice(0, 5).map((item) => (
                <div key={`${item.catalogue_no}-${item.part_name}`} className="p-3 bg-[#1e293b] rounded-lg border border-white/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.catalogue_no || 'Uncatalogued part'}</p>
                      <p className="text-xs text-slate-400 truncate">{item.part_name || item.equipment_desc || 'No description'}</p>
                    </div>
                    <Badge className={getStockRiskBadgeClass(item.stock_risk)}>{formatStatus(item.stock_risk)}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                    <span>On hand: {item.on_hand ?? 0}</span>
                    <span>Reorder: {item.reorder_point ?? '-'}</span>
                    <span>Bin: {item.bin_location || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MaintenanceAssistantPanel({
  isOpen,
  onClose,
  messages,
  inputMessage,
  setInputMessage,
  onSendMessage,
  summary,
  selectedWorkorder,
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  onSendMessage: () => void;
  summary: MaintenanceDashboardSummary;
  selectedWorkorder?: MaintenanceWorkOrder;
}) {
  return (
    <div
      className={`absolute inset-y-0 right-0 z-20 w-96 max-w-[calc(100vw-2rem)] border-l border-white/10 bg-[#0f1623] flex flex-col shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Operations Copilot</h3>
              <p className="text-xs text-slate-400">Maintenance operational assistant</p>
            </div>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-slate-400 hover:bg-[#1e293b] hover:text-white" aria-label="Close AI Copilot">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 bg-[#141b2e] border border-white/10 rounded-lg">
          <p className="text-xs font-medium text-slate-400 mb-2">Quick Insights:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">{summary.overdue_workorder_count} overdue maintenance jobs require review</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Package className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">{summary.stock_risk_item_count} spare part risk items may block workorders</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Activity className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">{selectedWorkorder ? `${selectedWorkorder.workorder_no} selected for context` : `${summary.repeat_failure_candidate_count} repeat failure candidates detected`}</span>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-2">
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${message.role === 'user' ? 'bg-slate-700' : 'bg-cyan-500/20'}`}>
                {message.role === 'user' ? <User className="w-3 h-3 text-slate-300" /> : <Bot className="w-3 h-3 text-cyan-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-white">{message.role === 'user' ? 'You' : 'Copilot'}</span>
                  <span className="text-xs text-slate-500">{message.timestamp}</span>
                </div>
                <div className={`text-xs text-slate-300 p-3 rounded-lg whitespace-pre-line leading-relaxed ${message.role === 'user' ? 'bg-[#1e293b]' : 'bg-[#141b2e] border border-white/10'}`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-xs text-slate-400 mb-2">Ask the Copilot:</p>
          <div className="space-y-1">
            <Button size="sm" variant="outline" className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7" onClick={() => setInputMessage('Summarize current maintenance blockers')}>
              <AlertTriangle className="w-3 h-3 mr-1" />
              Current blockers
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7" onClick={() => setInputMessage('Which machines have repeat failures?')}>
              <Activity className="w-3 h-3 mr-1" />
              Repeat failures
            </Button>
            <Button size="sm" variant="outline" className="w-full justify-start border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white text-xs h-7" onClick={() => setInputMessage('What parts risks should maintenance watch?')}>
              <Package className="w-3 h-3 mr-1" />
              Parts risk
            </Button>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <Input
            value={inputMessage}
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Ask about maintenance issues..."
            className="bg-[#1e293b] border-white/10 text-white placeholder:text-slate-500 text-xs h-9"
          />
          <Button onClick={onSendMessage} disabled={!inputMessage.trim()} className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-3" size="sm">
            <Send className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Prepared for future Agentic Core integration</p>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  fontSize: '12px',
};

function ChartLoading() {
  return <div className="h-[220px] rounded bg-[#1e293b] border border-white/5 animate-pulse" />;
}

function EmptyAnalytics({ text }: { text: string }) {
  return <div className="h-[220px] rounded border border-white/10 bg-[#1e293b] flex items-center justify-center text-sm text-slate-400">{text}</div>;
}

export function buildKpis(summary: MaintenanceDashboardSummary, workorders: MaintenanceWorkOrder[], stockRisk: MaintenanceRiskMachine[]) {
  const inProgress = workorders.filter((workorder) => isInProgress(workorder.status)).length;
  const waitingParts = Math.max(summary.on_hold_workorder_count, stockRisk.filter((item) => item.stock_risk && item.stock_risk !== 'ok').length);
  const avgMttr = average(summary.mtbf_mttr.map((row) => row.mttr_hours).filter(isNumber));

  return [
    {
      label: 'Open Workorders',
      value: summary.open_workorder_count,
      caption: 'Active jobs',
      detail: `${summary.completed_workorder_count} completed`,
      icon: Wrench,
      detailIcon: CheckCircle,
      className: 'from-purple-900/40 to-purple-950/40 border-purple-800/30',
      labelClassName: 'text-purple-300/80',
      iconClassName: 'text-purple-400',
      captionClassName: 'text-purple-300/60',
      detailClassName: 'text-green-400',
    },
    {
      label: 'In Progress',
      value: inProgress,
      caption: 'Active repairs',
      detail: `${workorders.length} API rows`,
      icon: Activity,
      detailIcon: Activity,
      className: 'from-blue-900/40 to-blue-950/40 border-blue-800/30',
      labelClassName: 'text-blue-300/80',
      iconClassName: 'text-blue-400',
      captionClassName: 'text-blue-300/60',
      detailClassName: 'text-blue-400',
    },
    {
      label: 'Avg MTTR',
      value: avgMttr === undefined ? 'N/A' : `${avgMttr.toFixed(1)}h`,
      caption: 'Mean Time To Repair',
      detail: `${summary.total_downtime_hours.toFixed(1)}h downtime`,
      icon: Clock,
      detailIcon: Timer,
      className: 'from-cyan-900/40 to-cyan-950/40 border-cyan-800/30',
      labelClassName: 'text-cyan-300/80',
      iconClassName: 'text-cyan-400',
      captionClassName: 'text-cyan-300/60',
      detailClassName: 'text-cyan-400',
    },
    {
      label: 'Overdue Jobs',
      value: summary.overdue_workorder_count,
      caption: 'Past deadline',
      detail: summary.overdue_workorder_count > 0 ? 'Action required' : 'No overdue jobs',
      icon: AlertTriangle,
      detailIcon: AlertTriangle,
      className: 'from-red-900/40 to-red-950/40 border-red-800/30',
      labelClassName: 'text-red-300/80',
      iconClassName: 'text-red-400',
      captionClassName: 'text-red-300/60',
      detailClassName: summary.overdue_workorder_count > 0 ? 'text-red-400' : 'text-green-400',
    },
    {
      label: 'Waiting Parts',
      value: waitingParts,
      caption: 'Blocked or at risk',
      detail: `${summary.stock_risk_item_count} stock risks`,
      icon: Package,
      detailIcon: Package,
      className: 'from-orange-900/40 to-orange-950/40 border-orange-800/30',
      labelClassName: 'text-orange-300/80',
      iconClassName: 'text-orange-400',
      captionClassName: 'text-orange-300/60',
      detailClassName: 'text-orange-400',
    },
  ];
}

export function buildMttrTrend(summary: MaintenanceDashboardSummary) {
  return summary.mtbf_mttr.slice(0, 8).map((row) => ({
    label: row.equipment_no || 'Unknown',
    mttr: row.mttr_hours ?? 0,
    downtime: row.total_downtime_hours ?? 0,
  }));
}

export function buildFrequencyData(workorders: MaintenanceWorkOrder[], repeatFailures: MaintenanceRiskMachine[]) {
  const counts = new Map<string, number>();

  workorders.forEach((workorder) => {
    const machine = workorder.equipment_no || 'Unassigned';
    counts.set(machine, (counts.get(machine) ?? 0) + 1);
  });

  repeatFailures.forEach((machine) => {
    const key = machine.equipment_no || machine.equipment_desc || 'Repeat failure';
    counts.set(key, Math.max(counts.get(key) ?? 0, machine.workorder_count ?? 0));
  });

  return Array.from(counts.entries())
    .map(([machine, count]) => ({ machine, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);
}

function buildTimeline(workorder: MaintenanceWorkOrder, detail?: MaintenanceWorkOrderDetail) {
  const isCompleted = isClosed(workorder.status);

  return [
    { label: 'Planned Start', value: formatDateTime(workorder.plan_start), status: workorder.plan_start ? 'completed' : 'pending' },
    { label: 'Work Started', value: formatDateTime(workorder.act_work_start), status: workorder.act_work_start ? 'completed' : isCompleted ? 'pending' : 'active' },
    { label: 'Tasks Logged', value: `${detail?.tasks?.length ?? workorder.task_count ?? 0} tasks`, status: (detail?.tasks?.length ?? workorder.task_count ?? 0) > 0 ? 'completed' : 'pending' },
    { label: 'Work Finished', value: formatDateTime(workorder.act_work_end), status: workorder.act_work_end || isCompleted ? 'completed' : 'pending' },
  ] as Array<{ label: string; value: string; status: 'completed' | 'active' | 'pending' }>;
}

function buildAssistantResponse(message: string, summary: MaintenanceDashboardSummary, workorders: MaintenanceWorkOrder[], selectedWorkorder?: MaintenanceWorkOrder) {
  const normalized = message.toLowerCase();
  const selectedLine = selectedWorkorder
    ? `\n\nSelected context: ${selectedWorkorder.workorder_no} on ${selectedWorkorder.equipment_no || 'unknown equipment'} is ${formatStatus(selectedWorkorder.status)} with ${formatHours(selectedWorkorder.down_time_hours)} downtime.`
    : '';

  if (normalized.includes('part') || normalized.includes('stock')) {
    return `Parts risk summary: ${summary.stock_risk_item_count} stock risk items are reported by the runtime API. Prioritize open workorders with on-hold status and verify parts linked to high-priority equipment.${selectedLine}`;
  }

  if (normalized.includes('repeat') || normalized.includes('machine')) {
    return `Repeat failure summary: ${summary.repeat_failure_candidate_count} candidate machines are flagged. Review machines with multiple open workorders or recurring failure descriptions before releasing repair capacity.${selectedLine}`;
  }

  return `Current maintenance summary: ${summary.open_workorder_count} open workorders, ${summary.overdue_workorder_count} overdue jobs, ${summary.on_hold_workorder_count} on-hold jobs, and ${workorders.length} workorder rows loaded. Recommended next step is to clear overdue and parts-blocked jobs first.${selectedLine}`;
}

function getProgress(workorder: MaintenanceWorkOrder) {
  if (isClosed(workorder.status)) {
    return 100;
  }

  if (isInProgress(workorder.status)) {
    return workorder.task_count > 0 ? 60 : 45;
  }

  if (isOnHold(workorder.status)) {
    return 35;
  }

  return workorder.act_work_start ? 25 : 10;
}

function getTechnician(workorder: MaintenanceWorkOrder) {
  return workorder.action_description?.match(/(?:by|technician)\s+([A-Z][\w -]+)/i)?.[1] || 'Unassigned';
}

function getPartsStatus(workorder: MaintenanceWorkOrder) {
  if (isOnHold(workorder.status)) {
    return 'Blocked';
  }
  if (workorder.part_transaction_count > 0 || workorder.issued_qty > 0) {
    return 'Issued';
  }
  return 'No parts';
}

function getStatusBadgeClass(status?: string) {
  if (isInProgress(status)) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }
  if (isOnHold(status)) {
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  }
  if (isClosed(status)) {
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  }
  if (formatStatus(status).toLowerCase().includes('open')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  }
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

function getPriorityBadgeClass(priority?: string) {
  const normalized = priority?.toLowerCase() ?? '';
  if (normalized.includes('critical') || normalized.includes('urgent')) {
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  }
  if (normalized.includes('high')) {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  }
  if (normalized.includes('low')) {
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  }
  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
}

function getPartsBadgeClass(workorder: MaintenanceWorkOrder) {
  const status = getPartsStatus(workorder);
  if (status === 'Blocked') {
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  }
  if (status === 'Issued') {
    return 'bg-green-500/20 text-green-300 border-green-500/30';
  }
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
}

function getStockRiskBadgeClass(risk?: string) {
  const normalized = risk?.toLowerCase() ?? '';
  if (normalized.includes('zero') || normalized.includes('below')) {
    return 'bg-red-500/20 text-red-300 border-red-500/30';
  }
  return 'bg-green-500/20 text-green-300 border-green-500/30';
}

function formatWorkType(type?: string) {
  const normalized = type?.trim();
  if (!normalized) {
    return 'Maintenance';
  }
  if (normalized.toLowerCase() === 'pm') {
    return 'Preventive';
  }
  if (normalized.toLowerCase() === 'cm') {
    return 'Corrective';
  }
  if (normalized.toLowerCase() === 'pdm') {
    return 'Predictive';
  }
  return normalized;
}

function formatStatus(value?: string) {
  if (!value) {
    return 'Unknown';
  }
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHours(value?: number) {
  if (!value || Number.isNaN(value)) {
    return '-';
  }
  if (value < 1) {
    return `${Math.round(value * 60)}m`;
  }
  return `${value.toFixed(1)}h`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function average(values: number[]) {
  if (!values.length) {
    return undefined;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isInProgress(status?: string) {
  return (status ?? '').toLowerCase().replace(/[_-]+/g, ' ').includes('progress');
}

function isOnHold(status?: string) {
  const normalized = (status ?? '').toLowerCase().replace(/[_-]+/g, ' ');
  return normalized.includes('hold') || normalized.includes('waiting');
}

function isClosed(status?: string) {
  const normalized = (status ?? '').toLowerCase();
  return normalized.includes('complete') || normalized.includes('closed') || normalized.includes('cancel');
}
