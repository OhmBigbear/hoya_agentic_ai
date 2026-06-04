import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle,
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
import { useOperationsWorkspaceRuntime } from '../../hooks/useOperationsWorkspaceRuntime';
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
import { requestOperationsWorkspacePreview } from '../../services/operationsWorkspaceCopilotApi';
import {
  buildWorkorderWidgetPreviewModel,
  buildWorkorderWidgetShadowDiagnostics,
  executeReadonlyActionNoop,
  maintenanceWorkordersSurface,
  renderUiWidgetList,
  readonlyActionExecutionPolicy,
  type ActionExecutionResult,
  type UiReadonlyActionEvent,
  type WorkorderWidgetShadowDiagnostics,
} from '../../ui-registry';
import type {
  MaintenanceDashboardSummary,
  MaintenanceHoldHistory,
  MaintenancePartUsage,
  MaintenanceRiskMachine,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderDetail,
  MaintenanceQueryFilters,
} from '../../types/maintenance';
import type {
  Insight,
  OperationsWorkspacePreviewRequest,
  OperationsWorkspacePreviewResponse,
  UiAction,
  UiActionPreview,
  WorkspacePayload,
  WorkspacePayloadChart,
} from '../../types/operationsWorkspace';

interface MaintenanceWorkorderTrackingPageProps {
  sidebarCollapsed: boolean;
  services?: MaintenanceWorkorderTrackingServices;
}

interface MaintenanceWorkorderTrackingServices {
  requestOperationsWorkspacePreview?: (request: OperationsWorkspacePreviewRequest) => Promise<OperationsWorkspacePreviewResponse>;
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
  insights?: Insight[];
  uiActions?: UiActionPreview[];
  workspacePayload?: WorkspacePayload;
  actionResults?: ActionResult[];
}

interface ActionResult {
  action: UiActionPreview;
  status: 'applied' | 'rejected' | 'ignored';
  reason?: string;
}

export interface WorkorderFilters {
  search: string;
  status: string;
  machine: string;
  workType: string;
  priority: string;
  overdueOnly: boolean;
  waitingPartsOnly: boolean;
}

const defaultFilters: WorkorderFilters = {
  search: '',
  status: '',
  machine: '',
  workType: '',
  priority: '',
  overdueOnly: false,
  waitingPartsOnly: false,
};

const pageSize = 12;
const WORKORDER_WIDGET_SHADOW_MODE_ENABLED = false;
const WORKORDER_WIDGET_DEV_PREVIEW_ENABLED = false;

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

export function MaintenanceWorkorderTrackingPage({ sidebarCollapsed, services = {} }: MaintenanceWorkorderTrackingPageProps) {
  const [workorders, setWorkorders] = useState<MaintenanceWorkOrder[]>([]);
  const [summary, setSummary] = useState<MaintenanceDashboardSummary>(emptySummary);
  const [holdReasons, setHoldReasons] = useState<MaintenanceHoldHistory[]>([]);
  const [repeatFailures, setRepeatFailures] = useState<MaintenanceRiskMachine[]>([]);
  const [stockRisk, setStockRisk] = useState<MaintenanceRiskMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WorkorderFilters>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<WorkorderFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [totalWorkorders, setTotalWorkorders] = useState(0);
  const [selectedWorkorderNo, setSelectedWorkorderNo] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<Record<string, DetailState>>({});
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isCopilotSending, setIsCopilotSending] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const operationsWorkspace = useOperationsWorkspaceRuntime();
  const previewRequest = services.requestOperationsWorkspacePreview ?? requestOperationsWorkspacePreview;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setWorkorderWidgetShadowDiagnostics] = useState<WorkorderWidgetShadowDiagnostics | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilters(filters);
      setPage(0);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setLoading(true);
      setError(null);
      const query = buildWorkorderQuery(debouncedFilters, page);
      const summaryQuery = buildWorkorderQuery(debouncedFilters);

      try {
        const [workordersResult, summaryResult, holdsResult, repeatsResult, stockResult] = await Promise.allSettled([
          getWorkorderTracking(query),
          getMaintenanceDashboardSummary(summaryQuery),
          getHoldReasonSummary({ limit: 10, department: summaryQuery.department }),
          getRepeatFailureCandidates({ limit: 10, equipment_no: summaryQuery.equipment_no }),
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
          setTotalWorkorders(workordersResult.value.total ?? workordersResult.value.data.length);
        } else {
          setWorkorders([]);
          setTotalWorkorders(0);
        }

        if (summaryResult.status === 'fulfilled') {
          setSummary({ ...emptySummary, ...summaryResult.value.data });
        } else {
          setSummary(emptySummary);
        }

        setHoldReasons(holdsResult.status === 'fulfilled' ? holdsResult.value.data : []);
        setRepeatFailures(repeatsResult.status === 'fulfilled' ? repeatsResult.value.data : []);
        setStockRisk(stockResult.status === 'fulfilled' ? stockResult.value.data : []);
        setError(buildMaintenanceApiErrorMessage(failures, 5));
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
  }, [debouncedFilters, page]);

  const kpis = useMemo(() => buildKpis(summary, workorders, stockRisk), [summary, workorders, stockRisk]);
  const mttrTrend = useMemo(() => buildMttrTrend(summary), [summary]);
  const frequencyData = useMemo(() => buildFrequencyData(workorders, repeatFailures), [workorders, repeatFailures]);
  const sortedWorkorders = useMemo(
    () => sortWorkorders(workorders, operationsWorkspace.state.tableSorts.workorder_table),
    [workorders, operationsWorkspace.state.tableSorts.workorder_table],
  );
  const selectedWorkorder = selectedWorkorderNo ? workorders.find((workorder) => workorder.workorder_no === selectedWorkorderNo) || detailState[selectedWorkorderNo]?.detail : undefined;
  const totalPages = Math.max(1, Math.ceil(totalWorkorders / pageSize));

  useEffect(() => {
    if (!selectedWorkorderNo) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedWorkorderNo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWorkorderNo]);

  const openWorkorderDrawer = async (workorder: MaintenanceWorkOrder, synchronize = true) => {
    const workorderNo = workorder.workorder_no;
    setSelectedWorkorderNo(workorderNo);
    if (synchronize) {
      operationsWorkspace.applyAction(buildWorkorderSelectionAction(workorder, 'table'));
    }

    if (detailState[workorderNo]?.detail || detailState[workorderNo]?.loading) {
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

  const applyLiveUiActions = useCallback((actions: UiActionPreview[]): ActionResult[] => {
    const results: ActionResult[] = [];
    const appliedActions: UiAction[] = [];

    actions.forEach((action) => {
      if (!action.valid) {
        results.push({ action, status: 'rejected', reason: action.validation_errors.join('; ') || 'Invalid action' });
        operationsWorkspace.applyAction(action);
        return;
      }

      const target = action.target?.trim();
      if (!isKnownOperationsWorkspaceTarget(target, action.type)) {
        results.push({ action, status: 'ignored', reason: `Unknown target '${target || 'none'}'` });
        operationsWorkspace.applyAction(action);
        return;
      }

      const result = applyHoyaUiAction(action, {
        workorders,
        setFilters,
        openWorkorderDrawer,
      });
      results.push(result);

      if (result.status === 'applied') {
        appliedActions.push(action);
      }
    });

    if (appliedActions.length > 0) {
      operationsWorkspace.applyActions(appliedActions);
    }

    return results;
  }, [openWorkorderDrawer, operationsWorkspace, workorders]);

  const handleInsightSelected = useCallback((insight: Insight) => {
    const synchronization = buildInsightSynchronizationActions(insight, workorders);
    operationsWorkspace.applyActions(synchronization.actions);

    if (synchronization.workorderToOpen) {
      void openWorkorderDrawer(synchronization.workorderToOpen, false);
    }
  }, [openWorkorderDrawer, operationsWorkspace, workorders]);

  const handleChartFocus = useCallback((chartId: string) => {
    if (!isKnownOperationsWorkspaceTarget(chartId, 'focus_chart')) {
      operationsWorkspace.applyAction({
        type: 'focus_chart',
        target: chartId,
        action_id: `local-chart-focus-rejected-${Date.now()}`,
      });
      return;
    }

    operationsWorkspace.applyAction({
      type: 'focus_chart',
      target: chartId,
      entity_ids: getChartRelatedEntityIds(chartId, workorders, repeatFailures, stockRisk),
      action_id: `local-chart-focus-${chartId}-${Date.now()}`,
    });
  }, [operationsWorkspace, repeatFailures, stockRisk, workorders]);

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || isCopilotSending) {
      return;
    }

    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setInputMessage('');
    setIsCopilotSending(true);
    setCopilotError(null);
    setMessages((current) => [
      ...current,
      { id: current.length + 1, role: 'user', content: trimmedMessage, timestamp },
    ]);

    try {
      const preview = await previewRequest({
        message: trimmedMessage,
        filters: buildOperationsWorkspacePreviewFilters(filters, operationsWorkspace.state, selectedWorkorder),
        limit: 5,
      });
      if (WORKORDER_WIDGET_SHADOW_MODE_ENABLED) {
        setWorkorderWidgetShadowDiagnostics(buildWorkorderWidgetShadowDiagnostics(preview.workspace_payload, {
          onError: (shadowError) => {
            if (import.meta.env.DEV) {
              console.warn('Workorder widget shadow diagnostics failed', shadowError);
            }
          },
        }));
      }
      const actionResults = applyLiveUiActions(preview.ui_actions);

      setMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          role: 'assistant',
          content: preview.assistant_text || 'No assistant summary was returned by Agentic Core.',
          timestamp,
          insights: preview.insights,
          uiActions: preview.ui_actions,
          workspacePayload: preview.workspace_payload,
          actionResults,
        },
      ]);
    } catch (previewError) {
      const errorMessage = previewError instanceof Error ? previewError.message : 'Agentic Core preview request failed.';
      setCopilotError(errorMessage);
      setMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          role: 'assistant',
          content: `Agentic Core preview unavailable: ${errorMessage}`,
          timestamp,
        },
      ]);
    } finally {
      setIsCopilotSending(false);
    }
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
                {error}
              </div>
            )}

            <MaintenanceKpiCards loading={loading} kpis={kpis} />

            <MaintenanceWorkorderTable
              workorders={sortedWorkorders}
              loading={loading}
              filters={filters}
              total={totalWorkorders}
              page={page}
              totalPages={totalPages}
              onFiltersChange={setFilters}
              onPageChange={setPage}
              onOpenWorkorder={openWorkorderDrawer}
              highlightedEntityIds={operationsWorkspace.state.highlightedEntities.workorder_table ?? []}
              selectedWorkorderId={operationsWorkspace.state.selectedWorkorderId}
              selectedMachineId={operationsWorkspace.state.selectedMachineId}
            />

            <MaintenanceAnalyticsSection
              loading={loading}
              mttrTrend={mttrTrend}
              holdReasons={holdReasons}
              frequencyData={frequencyData}
              stockRisk={stockRisk}
              focusedChartId={operationsWorkspace.state.focusedChartId}
              highlightedEntityIds={operationsWorkspace.state.highlightedEntities.workorder_table ?? []}
              onChartFocus={handleChartFocus}
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
          isSending={isCopilotSending}
          copilotError={copilotError}
          workspaceState={operationsWorkspace.state}
          onInsightSelected={handleInsightSelected}
        />

        <WorkorderDetailDrawer
          workorder={selectedWorkorder}
          detail={selectedWorkorderNo ? detailState[selectedWorkorderNo] : undefined}
          isOpen={Boolean(selectedWorkorderNo)}
          onClose={() => setSelectedWorkorderNo(null)}
        />
      </div>
    </main>
  );
}

export function buildMaintenanceApiErrorMessage(failures: string[], requestCount: number): string | null {
  if (failures.length === 0) {
    return null;
  }

  if (failures.length >= requestCount) {
    return `Maintenance API unavailable. Start the Maintenance Runtime API or check VITE_MAINTENANCE_API_BASE_URL. ${failures.join(' ')}`;
  }

  return `Some maintenance data could not be loaded. Showing available API results. ${failures.join(' ')}`;
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
  filters = defaultFilters,
  total = workorders.length,
  page = 0,
  totalPages = Math.max(1, Math.ceil(workorders.length / pageSize)),
  onFiltersChange = () => {},
  onPageChange = () => {},
  onOpenWorkorder = () => {},
  highlightedEntityIds = [],
  selectedWorkorderId = null,
  selectedMachineId = null,
}: {
  workorders: MaintenanceWorkOrder[];
  loading: boolean;
  filters?: WorkorderFilters;
  total?: number;
  page?: number;
  totalPages?: number;
  onFiltersChange?: (filters: WorkorderFilters) => void;
  onPageChange?: (page: number) => void;
  onOpenWorkorder?: (workorder: MaintenanceWorkOrder) => void;
  highlightedEntityIds?: string[];
  selectedWorkorderId?: string | null;
  selectedMachineId?: string | null;
}) {
  const updateFilter = (key: keyof WorkorderFilters, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-[#141b2e] border-white/10 mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-cyan-400" />
              Maintenance Workorder Tracking
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Open and recent maintenance jobs with API-backed operational context
            </CardDescription>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div className="text-slate-200 font-medium">{total} matched</div>
            <div>Showing {workorders.length} rows</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-2">
          <Input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search workorder, machine, issue"
            className="h-9 bg-[#0f1623] border-white/10 text-white placeholder:text-slate-500 text-xs"
            aria-label="Search workorders"
          />
          <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="h-9 rounded-md bg-[#0f1623] border border-white/10 px-3 text-xs text-slate-200">
            <option value="">All status</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
          <Input
            value={filters.machine}
            onChange={(event) => updateFilter('machine', event.target.value)}
            placeholder="Machine"
            className="h-9 bg-[#0f1623] border-white/10 text-white placeholder:text-slate-500 text-xs"
            aria-label="Machine filter"
          />
          <select value={filters.workType} onChange={(event) => updateFilter('workType', event.target.value)} className="h-9 rounded-md bg-[#0f1623] border border-white/10 px-3 text-xs text-slate-200">
            <option value="">All work types</option>
            <option value="CM">Corrective</option>
            <option value="PM">Preventive</option>
            <option value="PDM">Predictive</option>
          </select>
          <select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)} className="h-9 rounded-md bg-[#0f1623] border border-white/10 px-3 text-xs text-slate-200">
            <option value="">All priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-[#0f1623] px-3 h-9">
            <label className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
              <input type="checkbox" checked={filters.overdueOnly} onChange={(event) => updateFilter('overdueOnly', event.target.checked)} className="accent-cyan-500" />
              Overdue
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap">
              <input type="checkbox" checked={filters.waitingPartsOnly} onChange={(event) => updateFilter('waitingPartsOnly', event.target.checked)} className="accent-cyan-500" />
              Parts
            </label>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="h-11 rounded bg-[#1e293b] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : workorders.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#1e293b] p-6 text-center">
            <p className="text-sm font-medium text-white">No maintenance workorders returned</p>
            <p className="mt-1 text-xs text-slate-400">The runtime API responded successfully but no rows matched the current query.</p>
          </div>
        ) : (
          <div className="max-h-[640px] overflow-auto border border-white/10 rounded-lg">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[#141b2e]">
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Workorder</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Machine</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Type</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Technician</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Elapsed</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">ETA</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Parts</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Priority</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase py-3 px-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {workorders.map((workorder) => {
                  const progress = getProgress(workorder);
                  return (
                    <WorkorderTableRow
                      key={workorder.workorder_no}
                      workorder={workorder}
                      progress={progress}
                      onOpenWorkorder={onOpenWorkorder}
                      highlighted={isWorkorderHighlighted(workorder, highlightedEntityIds)}
                      selected={isWorkorderSelected(workorder, selectedWorkorderId, selectedMachineId)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white" disabled={loading || page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>
              Previous
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-white/20 text-slate-300 hover:bg-[#1e293b] hover:text-white" disabled={loading || page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkorderTableRow({
  workorder,
  progress,
  onOpenWorkorder,
  highlighted = false,
  selected = false,
}: {
  workorder: MaintenanceWorkOrder;
  progress: number;
  onOpenWorkorder: (workorder: MaintenanceWorkOrder) => void;
  highlighted?: boolean;
  selected?: boolean;
}) {
  return (
      <tr className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${highlighted ? 'outline outline-1 outline-cyan-400/70 bg-cyan-500/10' : ''} ${selected ? 'bg-cyan-500/15' : ''}`} onClick={() => onOpenWorkorder(workorder)} tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && onOpenWorkorder(workorder)}>
        <td className="py-2.5 px-3 min-w-36">
          <span className="text-sm text-cyan-400 font-medium">{workorder.workorder_no}</span>
          <p className="text-xs text-slate-500 truncate max-w-48">{truncateText(workorder.failure_description || workorder.reason || 'No issue text', 52)}</p>
        </td>
        <td className="py-2.5 px-3 min-w-44">
          <span className="text-sm text-white font-medium">{workorder.equipment_no || 'Unassigned'}</span>
          <p className="text-xs text-slate-400 truncate max-w-52">{truncateText(workorder.equipment_desc || workorder.location || 'No machine description', 48)}</p>
        </td>
        <td className="py-2.5 px-3">
          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50 text-xs">{formatWorkType(workorder.job_type)}</Badge>
        </td>
        <td className="py-2.5 px-3">
          <Badge className={getStatusBadgeClass(workorder.status)}>{formatStatus(workorder.status)}</Badge>
        </td>
        <td className="py-2.5 px-3 min-w-36">
          <span className="text-sm text-white">{getTechnician(workorder)}</span>
          <p className="text-xs text-slate-400">{workorder.department || workorder.site || 'Maintenance'}</p>
        </td>
        <td className="py-2.5 px-3 whitespace-nowrap">
          <span className="text-sm text-slate-300">{formatHours(workorder.total_repair_time_hours || workorder.down_time_hours)}</span>
        </td>
        <td className="py-2.5 px-3 whitespace-nowrap">
          <span className="text-sm text-slate-300">{formatDateTime(workorder.plan_finish)}</span>
        </td>
        <td className="py-2.5 px-3">
          <Badge className={getPartsBadgeClass(workorder)}>{getPartsStatus(workorder)}</Badge>
        </td>
        <td className="py-2.5 px-3">
          <Badge className={getPriorityBadgeClass(workorder.priority)}>{workorder.priority || 'Normal'}</Badge>
        </td>
        <td className="py-2.5 px-3">
          <div className="flex items-center gap-2">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden w-20">
              <div className={progress >= 100 ? 'h-full bg-green-500' : progress > 50 ? 'h-full bg-blue-500' : 'h-full bg-yellow-500'} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-slate-400 w-10">{progress}%</span>
          </div>
        </td>
      </tr>
  );
}

export function WorkorderDetailDrawer({ workorder, detail, isOpen, onClose }: { workorder?: MaintenanceWorkOrder; detail?: DetailState; isOpen: boolean; onClose: () => void }) {
  return (
    <div className={`absolute inset-y-0 right-0 z-30 h-full max-h-full w-[34rem] max-w-[calc(100vw-2rem)] overflow-hidden border-l border-white/10 bg-[#0f1623] shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`} aria-hidden={!isOpen}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="text-xs uppercase text-slate-500">Workorder Detail</p>
            <h3 className="text-lg font-semibold text-white truncate">{workorder?.workorder_no ?? 'Loading workorder'}</h3>
            <p className="text-xs text-slate-400 truncate">{workorder?.equipment_no ?? 'Machine pending'} · {formatStatus(workorder?.status)}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-slate-400 hover:bg-[#1e293b] hover:text-white" aria-label="Close workorder detail">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="min-h-0 flex-1 overflow-y-auto" aria-label="Workorder detail content">
          <div className="p-4">
            {workorder ? <WorkorderDetailPanel workorder={workorder} detail={detail} /> : <div className="h-32 rounded bg-[#1e293b] border border-white/5 animate-pulse" />}
          </div>
        </ScrollArea>
      </div>
    </div>
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
        <p className="text-sm text-slate-300 leading-relaxed">{workorder.failure_description || workorder.reason || detailRecord?.action_description || 'No issue description provided by API.'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <DetailList
          title="Workorder Summary"
          emptyText="No workorder summary returned"
          rows={[
            { key: 'status', primary: `${formatStatus(workorder.status)} · ${formatWorkType(workorder.job_type)}`, secondary: `${workorder.priority || 'Normal'} priority · ${formatHours(workorder.total_repair_time_hours || workorder.down_time_hours)} elapsed` },
            { key: 'window', primary: `ETA ${formatDateTime(workorder.plan_finish)}`, secondary: `Started ${formatDateTime(workorder.act_work_start)} · Finished ${formatDateTime(workorder.act_work_end)}` },
          ]}
        />
        <DetailList
          title="Technician Info"
          emptyText="No technician data returned"
          rows={[
            { key: 'technician', primary: getTechnician(workorder), secondary: workorder.department || workorder.site || detailRecord?.equipment?.department || 'Maintenance team' },
          ]}
        />
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
        <DetailList
          title="Operational Notes"
          emptyText="No operational notes returned"
          rows={[
            { key: 'action', primary: 'Action', secondary: workorder.action_description || detailRecord?.action_description || 'No action notes recorded' },
            { key: 'solution', primary: 'Solution', secondary: workorder.solution || 'No solution recorded' },
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
  focusedChartId,
  highlightedEntityIds = [],
  onChartFocus = () => {},
}: {
  loading: boolean;
  mttrTrend: Array<{ label: string; mttr: number; downtime: number }>;
  holdReasons: MaintenanceHoldHistory[];
  frequencyData: Array<{ machine: string; count: number }>;
  stockRisk: MaintenanceRiskMachine[];
  focusedChartId?: string | null;
  highlightedEntityIds?: string[];
  onChartFocus?: (chartId: string) => void;
}) {
  const delayReasons = holdReasons.slice(0, 5).map((reason, index) => ({
    reason: reason.hold_reason_description || 'Unspecified',
    value: reason.hold_count ?? reason.affected_workorder_count ?? 0,
    color: chartColors[index % chartColors.length],
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card className={`bg-[#141b2e] border-white/10 lg:col-span-2 cursor-pointer ${focusedChartId === 'mttr_trend_chart' ? 'ring-1 ring-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : ''}`} onClick={() => onChartFocus('mttr_trend_chart')}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-400" />
            MTTR Trend
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Equipment-level MTTR from dashboard summary</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : mttrTrend.length === 0 ? <EmptyAnalytics text="No MTTR rows returned" /> : (
            <ResponsiveContainer width="100%" height={200}>
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

      <Card className={`bg-[#141b2e] border-white/10 cursor-pointer ${focusedChartId === 'delay_reasons_chart' ? 'ring-1 ring-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : ''}`} onClick={() => onChartFocus('delay_reasons_chart')}>
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

      <Card className={`bg-[#141b2e] border-white/10 cursor-pointer ${focusedChartId === 'maintenance_frequency_chart' ? 'ring-1 ring-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : ''}`} onClick={() => onChartFocus('maintenance_frequency_chart')}>
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Maintenance Frequency
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">Most active machines from workorder and repeat failure APIs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <ChartLoading /> : frequencyData.length === 0 ? <EmptyAnalytics text="No machine frequency data returned" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={frequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                <YAxis type="category" dataKey="machine" stroke="#94a3b8" style={{ fontSize: '11px' }} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Workorders" fill="#8b5cf6">
                  {frequencyData.map((entry) => (
                    <Cell key={entry.machine} fill={highlightedEntityIds.includes(entry.machine) ? '#06b6d4' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className={`bg-[#141b2e] border-white/10 cursor-pointer ${focusedChartId === 'maintenance_history_signals' ? 'ring-1 ring-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : ''}`} onClick={() => onChartFocus('maintenance_history_signals')}>
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
  isSending = false,
  copilotError = null,
  workspaceState,
  onInsightSelected = () => {},
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (value: string) => void;
  onSendMessage: () => void;
  summary: MaintenanceDashboardSummary;
  selectedWorkorder?: MaintenanceWorkOrder;
  isSending?: boolean;
  copilotError?: string | null;
  workspaceState?: ReturnType<typeof useOperationsWorkspaceRuntime>['state'];
  onInsightSelected?: (insight: Insight) => void;
}) {
  return (
    <div
      className={`absolute inset-y-0 right-0 z-20 w-96 max-w-[calc(100vw-2rem)] border-l border-white/10 bg-[#0f1623] flex flex-col shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex-shrink-0 p-4 border-b border-white/10">
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
          <p className="text-xs font-medium text-slate-400 mb-2">Existing operational signal snapshot:</p>
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

      <ScrollArea className="min-h-0 flex-1 overflow-hidden p-4" data-testid="maintenance-copilot-scroll-area" aria-label="Maintenance Copilot conversation">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-[#141b2e] p-3 text-xs leading-relaxed text-slate-300" data-testid="maintenance-copilot-empty-state">
              Ask for maintenance blockers, repeat failures, parts risk, or actions for the selected workorder.
            </div>
          )}
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
                  {message.role === 'assistant' && (
                    <AssistantStructuredBlocks
                      message={message}
                      activeInsightIds={workspaceState?.activeInsightIds ?? []}
                      onInsightSelected={onInsightSelected}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="text-xs text-slate-400 bg-[#141b2e] border border-white/10 rounded-lg p-3">
              Requesting Agentic Core preview...
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-4 border-t border-white/10">
        {copilotError && (
          <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
            {copilotError}
          </div>
        )}
        {workspaceState && (
          <div className="mb-3 rounded border border-white/10 bg-[#141b2e] p-2 text-xs text-slate-400" data-testid="workspace-synchronization-diagnostics">
            <details>
              <summary className="cursor-pointer text-slate-300">Workspace synchronization</summary>
              <div className="mt-2 space-y-1">
                <div>{workspaceState.synchronizedTimeRange ? `Time range ${workspaceState.synchronizedTimeRange.value}` : 'Current API snapshot'}</div>
                <div>Selected {workspaceState.selectedWorkorderId ?? workspaceState.selectedMachineId ?? 'none'}</div>
                <div>Focused chart {workspaceState.focusedChartId ? formatWorkspaceLabel(workspaceState.focusedChartId) : 'none'}</div>
                <div>Active insights {workspaceState.activeInsightIds.length}</div>
                <div>Highlighted {countHighlightedEntities(workspaceState.highlightedEntities)}</div>
              </div>
            </details>
          </div>
        )}
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
          <Button onClick={onSendMessage} disabled={!inputMessage.trim() || isSending} className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-3" size="sm" aria-label="Send maintenance assistant query">
            <Send className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">Agentic Core preview is read-only; UI actions only change local visualization state</p>
      </div>
    </div>
  );
}

function AssistantStructuredBlocks({
  message,
  activeInsightIds = [],
  onInsightSelected = () => {},
}: {
  message: ChatMessage;
  activeInsightIds?: string[];
  onInsightSelected?: (insight: Insight) => void;
}) {
  const hasInsights = Boolean(message.insights?.length);
  const hasActions = Boolean(message.uiActions?.length);
  const hasWorkspacePayload = Boolean(message.workspacePayload);

  if (!hasInsights && !hasActions && !hasWorkspacePayload) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      {message.workspacePayload && <WorkspacePayloadInsight payload={message.workspacePayload} />}
      {WORKORDER_WIDGET_SHADOW_MODE_ENABLED && WORKORDER_WIDGET_DEV_PREVIEW_ENABLED && message.workspacePayload && (
        <DeveloperWidgetRegistryPreview payload={message.workspacePayload} />
      )}
      {hasInsights && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase text-slate-500">Insights</p>
          {message.insights?.map((insight) => (
            <button
              key={insight.id || insight.title}
              type="button"
              onClick={() => onInsightSelected(insight)}
              className={`w-full rounded border bg-[#0f1623] p-2 text-left ${activeInsightIds.includes(insight.id) ? 'border-cyan-400/70 bg-cyan-500/10' : 'border-white/10'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white">{insight.title || 'Insight'}</span>
                <Badge className={getInsightBadgeClass(insight.severity)}>{insight.severity}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">{insight.summary}</p>
            </button>
          ))}
        </div>
      )}
      {hasActions && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase text-slate-500">UI Actions</p>
          {message.uiActions?.map((action, index) => {
            const result = message.actionResults?.[index];
            return (
              <div key={`${action.action_id ?? action.type}-${index}`} className="rounded border border-white/10 bg-[#0f1623] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-200">{action.type} - {action.target || 'no target'}</span>
                  <Badge className={getActionResultBadgeClass(result?.status ?? (action.valid ? 'applied' : 'rejected'))}>
                    {result?.status ?? (action.valid ? 'valid' : 'rejected')}
                  </Badge>
                </div>
                {result?.reason && <p className="mt-1 text-[11px] text-slate-500">{result.reason}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DeveloperWidgetRegistryPreview({ payload }: { payload?: WorkspacePayload }) {
  const model = useMemo(() => (payload ? buildWorkorderWidgetPreviewModel(payload) : null), [payload]);

  if (!model) {
    return (
      <div className="rounded border border-dashed border-cyan-400/30 bg-[#0f1623] p-2" data-testid="developer-widget-registry-preview">
        <p className="text-[11px] uppercase text-cyan-300/80">Developer Widget Registry Preview</p>
        <p className="mt-1 text-xs text-slate-400">No workspace payload available for widget preview.</p>
      </div>
    );
  }

  const diagnostics = model.diagnostics;

  return (
    <div className="rounded border border-cyan-400/30 bg-[#0f1623] p-2" data-testid="developer-widget-registry-preview">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase text-cyan-300/80">Developer Widget Registry Preview</p>
          <p className="mt-1 text-xs text-slate-400">Read-only registry rendering from the assistant workspace payload.</p>
        </div>
        <Badge className={diagnostics.validationValid ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' : 'bg-amber-500/15 text-amber-200 border-amber-400/30'}>
          {diagnostics.validationValid ? 'valid' : 'review'}
        </Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div>Widgets {diagnostics.adaptedWidgetCount}</div>
        <div>Errors {diagnostics.errorCount}</div>
        <div>Warnings {diagnostics.warningCount}</div>
        <div>Type {diagnostics.lastPayloadType ?? 'unknown'}</div>
        <div className="col-span-2">Intent {diagnostics.intent ?? 'unknown'}</div>
      </div>
      <div className="mt-2 rounded border border-white/10 bg-[#101827] p-2 text-[11px] text-slate-300">
        <div className="mb-2 grid grid-cols-2 gap-1 text-slate-400">
          <div>Execution {diagnostics.executionPolicy.executionMode}</div>
          <div>Risk {diagnostics.executionPolicy.riskClass}</div>
          <div>Approval {diagnostics.executionPolicy.requiresApproval ? 'required' : 'not required'}</div>
          <div>Mutation {diagnostics.executionPolicy.mutationAllowed ? 'allowed' : 'blocked'}</div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Detected actions {diagnostics.detectedActions.length}</span>
          <span className={diagnostics.actionValidationValid ? 'text-emerald-200' : 'text-amber-200'}>
            {diagnostics.actionValidationValid ? 'readonly valid' : `${diagnostics.rejectedActionCount} rejected`}
          </span>
        </div>
        {diagnostics.detectedActions.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {diagnostics.detectedActions.map((action, index) => (
              <li key={`${action.actionId ?? 'action'}-${index}`} className="break-words">
                <span className={action.valid ? 'text-emerald-200' : 'text-amber-200'}>{action.valid ? 'accepted' : 'rejected'}</span>
                <span> {action.actionId ?? 'unknown'}</span>
                <span> mode {action.mode ?? 'unknown'}</span>
                <span> execution {action.executionPolicy.executionMode}</span>
                {action.rejectionReason ? <span> Reason {action.rejectionReason}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-500">No actions detected.</p>
        )}
      </div>
      <div className="mt-3 rounded border border-white/10 bg-[#141b2e] p-2 text-xs text-slate-300">
        {model.safeToRender ? renderUiWidgetList(model.widgets, {
          surface: maintenanceWorkordersSurface,
          fallbackMode: 'compact',
          onReadonlyAction: handleDeveloperReadonlyAction,
        }) : <p>No widget data available for preview.</p>}
      </div>
    </div>
  );
}

export function handleDeveloperReadonlyAction(event: UiReadonlyActionEvent): ActionExecutionResult {
  const result = executeReadonlyActionNoop({
    action: {
      id: event.actionId,
      mode: 'readonly',
      targetId: event.targetId,
      metadata: event.metadata,
    },
    executionMode: readonlyActionExecutionPolicy.executionMode,
  });

  if (import.meta.env.DEV) {
    console.debug('Developer widget registry preview action ignored', {
      widgetId: event.widgetId,
      actionId: event.actionId,
      targetId: event.targetId,
      status: result.status,
      executionPolicy: result.executionPolicy,
    });
  }

  return result;
}

function WorkspacePayloadInsight({ payload }: { payload: WorkspacePayload }) {
  const { summary } = payload;

  return (
    <div className="space-y-3" data-testid="workspace-payload-section">
      <div className="rounded border border-cyan-400/20 bg-[#0f1623] p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] uppercase text-cyan-300/80">Workspace Insight</p>
            <h4 className="mt-1 text-xs font-semibold text-white">{summary.title}</h4>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            <Badge className={getWorkspacePayloadSeverityBadgeClass(summary.severity)}>{summary.severity}</Badge>
            <Badge className="bg-slate-700/70 text-slate-200 border-slate-500/30">{summary.confidence}</Badge>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{summary.headline}</p>
        {summary.time_range?.label && <p className="mt-1 text-[11px] text-slate-500">{summary.time_range.label}</p>}
      </div>

      {payload.kpi_cards.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {payload.kpi_cards.map((card) => (
            <div key={card.id} className="rounded border border-white/10 bg-[#0f1623] p-2">
              <p className="text-[11px] text-slate-500">{card.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-semibold text-white">{card.value}</span>
                {card.unit && <span className="text-[11px] text-slate-400">{card.unit}</span>}
              </div>
              {card.description && <p className="mt-1 text-[11px] leading-snug text-slate-500">{card.description}</p>}
            </div>
          ))}
        </div>
      )}

      {payload.charts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase text-slate-500">Charts / Tables</p>
          {payload.charts.map((chart) => (
            <WorkspacePayloadChartBlock key={chart.id} chart={chart} />
          ))}
        </div>
      )}

      {payload.recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase text-slate-500">Recommendations</p>
          {payload.recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded border border-white/10 bg-[#0f1623] p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-white">{recommendation.title}</span>
                <Badge className={getRecommendationBadgeClass(recommendation.priority)}>{recommendation.priority}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-400">{recommendation.rationale}</p>
              <p className="mt-1 text-xs text-slate-300">{recommendation.suggested_action}</p>
            </div>
          ))}
        </div>
      )}

      {payload.evidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase text-slate-500">Evidence</p>
          {payload.evidence.map((item, index) => (
            <div key={`${item.source_name}-${index}`} className="rounded border border-white/10 bg-[#0f1623] p-2">
              <p className="text-xs font-medium text-slate-200">{item.source_name}</p>
              {item.description && <p className="mt-1 text-xs text-slate-400">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {summary.limitations.length > 0 && (
        <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2">
          <p className="text-[11px] uppercase text-amber-200/80">Limitations</p>
          <ul className="mt-1 space-y-1">
            {summary.limitations.map((limitation, index) => (
              <li key={`${limitation}-${index}`} className="text-xs text-amber-100/80">{limitation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WorkspacePayloadChartBlock({ chart }: { chart: WorkspacePayloadChart }) {
  const rows = chart.data.slice(0, 5);
  const columns = getWorkspacePayloadChartColumns(chart, rows);

  return (
    <div className="rounded border border-white/10 bg-[#0f1623] p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white">{chart.title}</span>
        <Badge className="bg-slate-700/70 text-slate-200 border-slate-500/30">{chart.type}</Badge>
      </div>
      {chart.description && <p className="mt-1 text-[11px] text-slate-500">{chart.description}</p>}
      {rows.length > 0 && columns.length > 0 ? (
        <div className="mt-2 overflow-hidden rounded border border-white/10">
          {rows.map((row, rowIndex) => (
            <div key={`${chart.id}-${rowIndex}`} className="grid grid-cols-2 gap-2 border-t border-white/5 px-2 py-1 first:border-t-0">
              {columns.map((column) => (
                <div key={column} className="min-w-0">
                  <span className="block truncate text-[10px] uppercase text-slate-500">{formatWorkspaceLabel(column)}</span>
                  <span className="block truncate text-xs text-slate-300">{formatWorkspaceValue(row[column])}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">No chart rows returned.</p>
      )}
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
  return <div className="h-[200px] rounded bg-[#1e293b] border border-white/5 animate-pulse" />;
}

function EmptyAnalytics({ text }: { text: string }) {
  return <div className="h-[200px] rounded border border-white/10 bg-[#1e293b] flex items-center justify-center text-sm text-slate-400">{text}</div>;
}

export function buildKpis(summary: MaintenanceDashboardSummary, workorders: MaintenanceWorkOrder[], stockRisk: MaintenanceRiskMachine[]) {
  const inProgress = workorders.filter((workorder) => isInProgress(workorder.status)).length;
  const waitingParts = summary.on_hold_workorder_count;
  const avgMttr = average(summary.mtbf_mttr.map((row) => row.mttr_hours).filter(isNumber));

  return [
    {
      label: 'Open Workorders',
      value: summary.open_workorder_count,
      caption: 'Open, active, or on hold',
      detail: `${summary.completed_workorder_count} closed`,
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
      detail: `${workorders.length} rows visible`,
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
      caption: 'On hold / parts wait',
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

export function buildWorkorderQuery(filters: WorkorderFilters, page = 0): MaintenanceQueryFilters {
  return {
    q: filters.search.trim() || undefined,
    status: filters.status || undefined,
    equipment_no: filters.machine.trim() || undefined,
    job_type: filters.workType || undefined,
    priority: filters.priority || undefined,
    overdue: filters.overdueOnly || undefined,
    waiting_parts: filters.waitingPartsOnly || undefined,
    limit: pageSize,
    offset: page * pageSize,
  };
}

export function buildOperationsWorkspacePreviewFilters(
  filters: WorkorderFilters,
  workspaceState: ReturnType<typeof useOperationsWorkspaceRuntime>['state'],
  selectedWorkorder?: MaintenanceWorkOrder,
) {
  return {
    workorder_table: {
      search: filters.search,
      status: filters.status,
      machine: filters.machine,
      workType: filters.workType,
      priority: filters.priority,
      overdueOnly: filters.overdueOnly,
      waitingPartsOnly: filters.waitingPartsOnly,
    },
    time_range: workspaceState.synchronizedTimeRange?.value ?? workspaceState.timeRange,
    selected_workorder: workspaceState.selectedWorkorderId ?? selectedWorkorder?.workorder_no,
    selected_machine: workspaceState.selectedMachineId ?? selectedWorkorder?.equipment_no,
    selected_insight: workspaceState.selectedInsightId,
    focused_chart: workspaceState.focusedChartId,
    highlighted_entities: workspaceState.highlightedEntities,
  };
}

function buildWorkorderSelectionAction(workorder: MaintenanceWorkOrder, source: 'table' | 'drawer'): UiAction {
  return {
    type: 'open_detail_panel',
    target: 'workorder_drawer',
    entity_id: workorder.workorder_no,
    entity_ids: [workorder.workorder_no, workorder.equipment_no].filter(isNonEmptyText),
    metadata: {
      entity_type: 'workorder',
      workorder_id: workorder.workorder_no,
      machine_id: workorder.equipment_no,
      source,
    },
    action_id: `local-${source}-selection-${workorder.workorder_no}-${Date.now()}`,
  };
}

export function buildInsightSynchronizationActions(insight: Insight, workorders: MaintenanceWorkOrder[]) {
  const relatedEntityIds = normalizeRelatedEntityIds(insight);
  const chartId = getInsightChartId(insight);
  const workorderToOpen = findRelatedWorkorder(relatedEntityIds, workorders);
  const actions: UiAction[] = [
    {
      type: 'highlight_entities',
      target: 'workorder_table',
      entity_ids: relatedEntityIds,
      metadata: {
        insight_id: insight.id,
        source: 'insight',
      },
      action_id: `local-insight-highlight-${insight.id}`,
    },
    {
      type: 'focus_chart',
      target: chartId,
      entity_ids: relatedEntityIds,
      metadata: {
        insight_id: insight.id,
        entity_ids: relatedEntityIds,
      },
      action_id: `local-insight-focus-${insight.id}`,
    },
  ];

  if (workorderToOpen) {
    actions.push({
      type: 'open_detail_panel',
      target: 'workorder_drawer',
      entity_id: workorderToOpen.workorder_no,
      entity_ids: [workorderToOpen.workorder_no, workorderToOpen.equipment_no].filter(isNonEmptyText),
      metadata: {
        insight_id: insight.id,
        entity_type: 'workorder',
        workorder_id: workorderToOpen.workorder_no,
        machine_id: workorderToOpen.equipment_no,
        source: 'insight',
      },
      action_id: `local-insight-open-${insight.id}`,
    });
  }

  return { actions, workorderToOpen };
}

function getInsightChartId(insight: Insight) {
  const metadataChart = getStringValue(
    insight.metadata?.chart_id ??
      insight.metadata?.chartId ??
      insight.metadata?.focus_chart ??
      insight.metadata?.target_chart,
  );

  if (metadataChart && isKnownOperationsWorkspaceTarget(metadataChart, 'focus_chart')) {
    return metadataChart;
  }

  const type = insight.type.toLowerCase();
  if (type.includes('delay') || type.includes('hold')) {
    return 'delay_reasons_chart';
  }
  if (type.includes('history') || type.includes('part') || type.includes('stock')) {
    return 'maintenance_history_signals';
  }
  if (type.includes('mttr') || type.includes('downtime')) {
    return 'mttr_trend_chart';
  }
  return 'maintenance_frequency_chart';
}

function normalizeRelatedEntityIds(insight: Insight) {
  const related = (insight.related_entities ?? []).map((entity) => entity.entity_id).filter(isNonEmptyText);
  const metadataEntityIds = Array.isArray(insight.metadata?.entity_ids) ? insight.metadata.entity_ids.filter(isNonEmptyText) : [];
  return uniqueStrings([...related, ...metadataEntityIds]);
}

function findRelatedWorkorder(entityIds: string[], workorders: MaintenanceWorkOrder[]) {
  return workorders.find((workorder) => isWorkorderHighlighted(workorder, entityIds));
}

function getChartRelatedEntityIds(
  chartId: string,
  workorders: MaintenanceWorkOrder[],
  repeatFailures: MaintenanceRiskMachine[],
  stockRisk: MaintenanceRiskMachine[],
) {
  switch (chartId) {
    case 'maintenance_frequency_chart':
      return uniqueStrings([
        ...workorders.map((workorder) => workorder.equipment_no).filter(isNonEmptyText),
        ...repeatFailures.map((machine) => machine.equipment_no).filter(isNonEmptyText),
      ]).slice(0, 8);
    case 'maintenance_history_signals':
      return uniqueStrings([
        ...stockRisk.map((item) => item.equipment_no ?? item.catalogue_no).filter(isNonEmptyText),
        ...workorders.filter((workorder) => workorder.part_transaction_count > 0).map((workorder) => workorder.workorder_no),
      ]).slice(0, 8);
    case 'mttr_trend_chart':
      return uniqueStrings(workorders.map((workorder) => workorder.equipment_no).filter(isNonEmptyText)).slice(0, 8);
    case 'delay_reasons_chart':
      return uniqueStrings(workorders.filter((workorder) => isOnHold(workorder.status)).map((workorder) => workorder.workorder_no)).slice(0, 8);
    default:
      return [];
  }
}

function applyHoyaUiAction(
  action: UiActionPreview,
  context: {
    workorders: MaintenanceWorkOrder[];
    setFilters: Dispatch<SetStateAction<WorkorderFilters>>;
    openWorkorderDrawer: (workorder: MaintenanceWorkOrder, synchronize?: boolean) => Promise<void>;
  },
): ActionResult {
  switch (action.type) {
    case 'set_filter':
      context.setFilters((current) => ({ ...current, ...toWorkorderFilters(action.filters ?? {}) }));
      return { action, status: 'applied' };
    case 'clear_filter':
      context.setFilters(defaultFilters);
      return { action, status: 'applied' };
    case 'open_detail_panel': {
      const workorder = context.workorders.find((item) => item.workorder_no === action.entity_id);
      if (!workorder) {
        return { action, status: 'ignored', reason: `Workorder '${action.entity_id}' is not in the current result set` };
      }
      void context.openWorkorderDrawer(workorder, false);
      return { action, status: 'applied' };
    }
    case 'focus_chart':
    case 'set_time_range':
    case 'highlight_entities':
    case 'sort_table':
      return { action, status: 'applied' };
    default:
      return { action, status: 'rejected', reason: `Unsupported action '${String(action.type)}'` };
  }
}

function toWorkorderFilters(actionFilters: Record<string, unknown>): Partial<WorkorderFilters> {
  const next: Partial<WorkorderFilters> = {};
  const search = getStringFilter(actionFilters.search ?? actionFilters.q ?? actionFilters.workorder_no);
  const status = getStringFilter(actionFilters.status);
  const machine = getStringFilter(actionFilters.machine ?? actionFilters.equipment_no ?? actionFilters.entity_id);
  const workType = getStringFilter(actionFilters.workType ?? actionFilters.work_type ?? actionFilters.job_type);
  const priority = getStringFilter(actionFilters.priority);

  if (search !== undefined) next.search = search;
  if (status !== undefined) next.status = status;
  if (machine !== undefined) next.machine = machine;
  if (workType !== undefined) next.workType = workType;
  if (priority !== undefined) next.priority = priority;
  if (typeof actionFilters.overdueOnly === 'boolean') next.overdueOnly = actionFilters.overdueOnly;
  if (typeof actionFilters.overdue === 'boolean') next.overdueOnly = actionFilters.overdue;
  if (typeof actionFilters.waitingPartsOnly === 'boolean') next.waitingPartsOnly = actionFilters.waitingPartsOnly;
  if (typeof actionFilters.waiting_parts === 'boolean') next.waitingPartsOnly = actionFilters.waiting_parts;

  return next;
}

function sortWorkorders(workorders: MaintenanceWorkOrder[], sort?: { field: string; direction: 'asc' | 'desc' }) {
  if (!sort) {
    return workorders;
  }

  const sorted = [...workorders].sort((left, right) => {
    const leftValue = getSortableWorkorderValue(left, sort.field);
    const rightValue = getSortableWorkorderValue(right, sort.field);
    if (leftValue < rightValue) return sort.direction === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

function getSortableWorkorderValue(workorder: MaintenanceWorkOrder, field: string): string | number {
  switch (field) {
    case 'workorder_no':
    case 'workorder':
      return workorder.workorder_no;
    case 'machine':
    case 'equipment_no':
      return workorder.equipment_no ?? '';
    case 'status':
      return workorder.status ?? '';
    case 'priority':
      return priorityRank(workorder.priority);
    case 'elapsed':
    case 'total_repair_time_hours':
      return workorder.total_repair_time_hours ?? 0;
    case 'downtime':
    case 'down_time_hours':
      return workorder.down_time_hours ?? 0;
    case 'progress':
      return getProgress(workorder);
    case 'eta':
    case 'plan_finish':
      return timestamp(workorder.plan_finish);
    default:
      return String((workorder as unknown as Record<string, unknown>)[field] ?? '');
  }
}

function isKnownOperationsWorkspaceTarget(target: string | undefined, type: string): boolean {
  if (type === 'clear_filter' && !target) {
    return true;
  }

  return new Set([
    'workorder_table',
    'workorder_drawer',
    'maintenance_dashboard',
    'mttr_trend_chart',
    'delay_reasons_chart',
    'maintenance_frequency_chart',
    'maintenance_history_signals',
  ]).has(target ?? '');
}

function isWorkorderHighlighted(workorder: MaintenanceWorkOrder, entityIds: string[]) {
  return entityIds.some((entityId) => (
    entityId === workorder.workorder_no ||
    entityId === workorder.equipment_no ||
    entityId === workorder.work_order_id
  ));
}

function isWorkorderSelected(workorder: MaintenanceWorkOrder, selectedWorkorderId?: string | null, selectedMachineId?: string | null) {
  return Boolean(
    (selectedWorkorderId && selectedWorkorderId === workorder.workorder_no) ||
      (selectedMachineId && selectedMachineId === workorder.equipment_no),
  );
}

function countHighlightedEntities(highlightedEntities: Record<string, string[]>) {
  return uniqueStrings(Object.values(highlightedEntities).flat()).length;
}

function getStringFilter(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
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

function getInsightBadgeClass(severity?: string) {
  const normalized = severity?.toLowerCase() ?? '';
  if (normalized === 'critical' || normalized === 'high') {
    return 'bg-red-500/20 text-red-300 border-red-500/30 text-[10px]';
  }
  if (normalized === 'medium') {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]';
  }
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]';
}

function getWorkspacePayloadSeverityBadgeClass(severity?: string) {
  if (severity === 'critical') {
    return 'bg-red-500/20 text-red-300 border-red-500/30 text-[10px]';
  }
  if (severity === 'warning') {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]';
  }
  if (severity === 'normal') {
    return 'bg-green-500/20 text-green-300 border-green-500/30 text-[10px]';
  }
  return 'bg-slate-500/20 text-slate-300 border-slate-500/30 text-[10px]';
}

function getRecommendationBadgeClass(priority?: string) {
  if (priority === 'high') {
    return 'bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]';
  }
  if (priority === 'low') {
    return 'bg-green-500/20 text-green-300 border-green-500/30 text-[10px]';
  }
  return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px]';
}

function getActionResultBadgeClass(status: ActionResult['status'] | 'applied' | 'valid') {
  if (status === 'applied' || status === 'valid') {
    return 'bg-green-500/20 text-green-300 border-green-500/30 text-[10px]';
  }
  if (status === 'ignored') {
    return 'bg-slate-500/20 text-slate-300 border-slate-500/30 text-[10px]';
  }
  return 'bg-red-500/20 text-red-300 border-red-500/30 text-[10px]';
}

function formatWorkspaceLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getWorkspacePayloadChartColumns(chart: WorkspacePayloadChart, rows: Record<string, unknown>[]) {
  const preferred = [chart.x_key, chart.y_key].filter(isNonEmptyText);
  const discovered = rows.flatMap((row) => Object.keys(row));
  return uniqueStrings([...preferred, ...discovered]).slice(0, 4);
}

function formatWorkspaceValue(value: unknown) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

function priorityRank(priority?: string) {
  const normalized = priority?.toLowerCase() ?? '';
  if (normalized.includes('critical') || normalized.includes('urgent')) return 4;
  if (normalized.includes('high')) return 3;
  if (normalized.includes('normal') || normalized.includes('medium')) return 2;
  if (normalized.includes('low')) return 1;
  return 0;
}

function timestamp(value?: string) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
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
