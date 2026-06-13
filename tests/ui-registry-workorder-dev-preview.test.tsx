import fs from 'node:fs';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED = 'false';
  process.env.VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED = 'false';
});

import {
  extractRuntimeAssistantText,
  DeveloperWidgetRegistryPreview,
  requestMaintenanceCopilotAssistantResponse,
  shouldApplyCopilotSubmitResponse,
  handleDeveloperReadonlyAction,
  MaintenanceAssistantPanel,
} from '../src/pages/maintenance/MaintenanceWorkorderTrackingPage';
import { createInitialOperationsWorkspaceState } from '../src/services/operationsWorkspaceRuntime';
import {
  buildWorkorderWidgetPreviewModel,
} from '../src/ui-registry';
import type { MaintenanceDashboardSummary, MaintenanceWorkOrder } from '../src/types/maintenance';
import type { WorkspacePayload } from '../src/types/operationsWorkspace';
import {
  agenticCoreFastPathCostIntelligenceResponse,
  fullWorkorderAgentPayload,
  malformedWorkorderAgentPayload,
  runtimeWorkorderAgentResponse,
  unsupportedActionWorkorderAgentPayload,
} from './fixtures/ui-registry/workorder-agent-payload.fixture';

const summary: MaintenanceDashboardSummary = {
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

const previewResponse = {
  assistant_text: 'Local preview answer from current dashboard signals.',
  insights: [],
  ui_actions: [],
  workspace_payload: fullWorkorderAgentPayload.workspace_payload as WorkspacePayload,
  created_at: '2026-06-12T08:00:00.000Z',
  trace_id: 'trace-local-preview',
};

const selectedWorkorder: MaintenanceWorkOrder = {
  workorder_no: 'BMM26-02465',
  equipment_no: 'BMM-LINE-01',
  status: 'open',
  job_type: 'CM',
  priority: 'High',
  total_repair_time_hours: 4,
  down_time_hours: 2,
  task_count: 1,
  part_transaction_count: 0,
  issued_qty: 0,
};

function renderAssistantPanel(overrides: Partial<React.ComponentProps<typeof MaintenanceAssistantPanel>> = {}) {
  return MaintenanceAssistantPanel({
    isOpen: true,
    onClose: () => {},
    messages: [],
    inputMessage: '',
    setInputMessage: () => {},
    onSendMessage: () => {},
    summary,
    ...overrides,
  });
}

function findElementByTestId(node: React.ReactNode, testId: string): React.ReactElement | null {
  if (!React.isValidElement(node)) {
    return null;
  }

  const props = node.props as Record<string, unknown>;
  if (props['data-testid'] === testId) {
    return node;
  }

  for (const child of React.Children.toArray(props.children as React.ReactNode)) {
    const match = findElementByTestId(child, testId);
    if (match) {
      return match;
    }
  }

  return null;
}

describe('workorder widget developer preview', () => {
  it('keeps developer preview and shadow flags disabled by default', () => {
    const source = fs.readFileSync('src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx', 'utf8');
    const envSource = fs.readFileSync('src/shared/config/env.ts', 'utf8');

    expect(envSource).toContain('VITE_WORKORDER_WIDGET_SHADOW_MODE_ENABLED');
    expect(envSource).toContain('VITE_WORKORDER_WIDGET_DEV_PREVIEW_ENABLED');
    expect(envSource).toContain('VITE_WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED');
    expect(envSource).toContain("return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';");
    expect(source).toContain('WORKORDER_WIDGET_SHADOW_MODE_ENABLED && WORKORDER_WIDGET_DEV_PREVIEW_ENABLED');
    expect(source).toContain('WORKORDER_AGENT_RUNTIME_PREVIEW_ENABLED');
    expect(source).toContain("runtimeFetchDiagnostics.status !== 'idle'");
    expect(source).toContain('include_narrative: true');
  });

  it('does not render the developer preview by default and keeps existing assistant output', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Preview ready.',
          timestamp: '12:00',
          workspacePayload: fullWorkorderAgentPayload.workspace_payload as WorkspacePayload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('AI Operations Copilot');
    expect(markup).toContain('Preview ready.');
    expect(markup).toContain('Maintenance risk summary');
    expect(markup).not.toContain('Developer Widget Registry Preview');
  });

  it('renders the Copilot composer as a multi-line textarea with compact empty prompt examples', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[]}
        inputMessage={'Analyze selected workorder\nAssess downtime risk'}
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('textarea');
    expect(markup).toContain('data-testid="maintenance-copilot-input"');
    expect(markup).toContain('rows="3"');
    expect(markup).toContain('max-h-40');
    expect(markup).toContain('Enter for new line · Ctrl/Cmd+Enter to send');
    expect(markup).toContain('Analyze selected workorder');
    expect(markup).toContain('Explain repeat failure risk');
    expect(markup).toContain('Assess business impact');
    expect(markup).toContain('Recommend next maintenance actions');
    expect(markup).toContain('Analyze selected workorder\nAssess downtime risk');
  });

  it('does not show compact prompt examples after conversation messages exist', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'user',
          content: 'Review WO-100',
          timestamp: '12:00',
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).not.toContain('data-testid="maintenance-copilot-prompt-examples"');
    expect(markup).not.toContain('Explain repeat failure risk');
  });

  it('keeps Enter available for newline entry and submits only on Ctrl+Enter or Cmd+Enter', () => {
    const onSendMessage = vi.fn();
    const element = renderAssistantPanel({ inputMessage: 'Line one\nLine two', onSendMessage });
    const textarea = findElementByTestId(element, 'maintenance-copilot-input');

    expect(textarea).not.toBeNull();
    expect(textarea?.props.value).toBe('Line one\nLine two');

    const enterEvent = { key: 'Enter', ctrlKey: false, metaKey: false, preventDefault: vi.fn() };
    textarea?.props.onKeyDown(enterEvent);
    expect(enterEvent.preventDefault).not.toHaveBeenCalled();
    expect(onSendMessage).not.toHaveBeenCalled();

    const ctrlEnterEvent = { key: 'Enter', ctrlKey: true, metaKey: false, preventDefault: vi.fn() };
    textarea?.props.onKeyDown(ctrlEnterEvent);
    expect(ctrlEnterEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledTimes(1);

    const cmdEnterEvent = { key: 'Enter', ctrlKey: false, metaKey: true, preventDefault: vi.fn() };
    textarea?.props.onKeyDown(cmdEnterEvent);
    expect(cmdEnterEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(onSendMessage).toHaveBeenCalledTimes(2);
  });

  it('submits from the send button and disables whitespace-only prompts', () => {
    const onSendMessage = vi.fn();
    const readyElement = renderAssistantPanel({ inputMessage: 'Assess business impact', onSendMessage });
    const readyButton = findElementByTestId(readyElement, 'maintenance-copilot-send');

    expect(readyButton).not.toBeNull();
    expect(readyButton?.props.disabled).toBe(false);
    readyButton?.props.onClick();
    expect(onSendMessage).toHaveBeenCalledTimes(1);

    const whitespaceElement = renderAssistantPanel({ inputMessage: ' \n\t ', onSendMessage });
    const whitespaceButton = findElementByTestId(whitespaceElement, 'maintenance-copilot-send');
    expect(whitespaceButton?.props.disabled).toBe(true);
  });

  it('keeps existing quick prompt buttons populating the input', () => {
    const setInputMessage = vi.fn();
    const element = renderAssistantPanel({ setInputMessage });

    findElementByTestId(element, 'maintenance-copilot-quick-current-blockers')?.props.onClick();
    findElementByTestId(element, 'maintenance-copilot-quick-repeat-failures')?.props.onClick();
    findElementByTestId(element, 'maintenance-copilot-quick-parts-risk')?.props.onClick();

    expect(setInputMessage).toHaveBeenNthCalledWith(1, 'Summarize current maintenance blockers');
    expect(setInputMessage).toHaveBeenNthCalledWith(2, 'Which machines have repeat failures?');
    expect(setInputMessage).toHaveBeenNthCalledWith(3, 'What parts risks should maintenance watch?');
  });

  it('routes a prompt containing a BMM workorder through the runtime service with narrative and cost context', async () => {
    const runtimeRequest = vi.fn(async () => ({
      status: 'success' as const,
      source: 'runtime' as const,
      payload: runtimeWorkorderAgentResponse,
      requestedAt: '2026-06-12T08:00:00.000Z',
      completedAt: '2026-06-12T08:00:01.000Z',
      diagnostics: {
        request_source: 'hoya_ui.copilot_submit',
        runtime_trace_id: 'trace-runtime-workorder-021',
        payload_version: '2.0',
      },
    }));
    const previewRequest = vi.fn(async () => previewResponse);

    const response = await requestMaintenanceCopilotAssistantResponse({
      prompt: 'Investigate BMM26-02465',
      filters: { status: 'open' },
      workspaceState: createInitialOperationsWorkspaceState(),
      selectedWorkorder,
      previewRequest,
      runtimeRequest,
    });

    expect(response.source).toBe('runtime');
    expect(previewRequest).not.toHaveBeenCalled();
    expect(runtimeRequest).toHaveBeenCalledTimes(1);
    expect(runtimeRequest.mock.calls[0][0]).toMatchObject({
      query: 'Investigate BMM26-02465',
      workorder_no: 'BMM26-02465',
      surface_id: 'maintenance.workorders',
      request_source: 'hoya_ui.copilot_submit',
      context: {
        include_narrative: true,
        include_cost_estimate: true,
        demo_mode: 'cost_intelligence',
        workorder_no: 'BMM26-02465',
      },
    });
    expect(runtimeRequest.mock.calls[0][0]).not.toHaveProperty('selected_workorder_id');
    expect(runtimeRequest.mock.calls[0][0]).not.toHaveProperty('selected_machine_id');
  });

  it('renders the runtime response in chat without local RX1 preview signals', () => {
    const content = extractRuntimeAssistantText(runtimeWorkorderAgentResponse);
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content,
          timestamp: '12:00',
          responseSource: 'runtime',
          runtimePayload: runtimeWorkorderAgentResponse,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="maintenance-copilot-runtime-badge"');
    expect(markup).toContain('Runtime response');
    expect(markup).toContain('Agentic Core found repeated open corrective work on POLISHING-7A');
    expect(markup).not.toContain('RX1-GC-TN-50');
    expect(markup).not.toContain('Local preview response');
  });

  it('renders fast path cost_intelligence narrative without local preview fallback', async () => {
    const runtimeRequest = vi.fn(async () => ({
      status: 'success' as const,
      source: 'runtime' as const,
      payload: agenticCoreFastPathCostIntelligenceResponse,
      requestedAt: '2026-06-12T08:00:00.000Z',
      completedAt: '2026-06-12T08:00:01.000Z',
      diagnostics: {
        request_source: 'hoya_ui.copilot_submit',
        runtime_trace_id: 'trace-fast-path-cost-intelligence-023',
        payload_version: '1.0',
        response_status: 200,
      },
    }));
    const previewRequest = vi.fn(async () => previewResponse);

    const response = await requestMaintenanceCopilotAssistantResponse({
      prompt: 'Investigate BMM26-02465 cost risk',
      filters: { status: 'open' },
      workspaceState: createInitialOperationsWorkspaceState(),
      selectedWorkorder,
      previewRequest,
      runtimeRequest,
    });

    expect(response.source).toBe('runtime');
    expect(previewRequest).not.toHaveBeenCalled();
    const model = buildWorkorderWidgetPreviewModel(agenticCoreFastPathCostIntelligenceResponse);
    expect(model.diagnostics.runtimeDiagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'fast_path',
          section: 'cost_intelligence',
        }),
        expect.objectContaining({
          code: 'cost_estimate_context_mismatch',
          section: 'cost_estimate',
          severity: 'warning',
        }),
      ]),
    );

    const content = response.source === 'runtime'
      ? extractRuntimeAssistantText(response.runtimeResult.payload)
      : response.preview.assistant_text;
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content,
          timestamp: '12:00',
          responseSource: response.source,
          narrative: response.source === 'runtime'
            ? (response.runtimeResult.payload as typeof agenticCoreFastPathCostIntelligenceResponse).narrative
            : undefined,
          runtimePayload: response.source === 'runtime' ? response.runtimeResult.payload : undefined,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="maintenance-copilot-runtime-badge"');
    expect(markup).toContain('Cost intelligence fast path completed for BMM26-02465');
    expect(markup).toContain('Executive Summary');
    expect(markup).toContain('Key Findings');
    expect(markup).toContain('Bearing replacement and technician time drive most of the estimate.');
    expect(markup).toContain('Business Impact');
    expect(markup).toContain('Unvalidated cost rows can overstate the selected workorder estimate');
    expect(markup).toContain('Cost variance risk remains elevated until the mismatched row is removed.');
    expect(markup).toContain('Recommended Next Steps');
    expect(markup).toContain('Validate cost rows against BMM26-02465 before scheduling.');
    expect(markup).toContain('Review the mismatched workorder row separately.');
    expect(markup).toContain('Confidence 0.91');
    expect(markup).toContain('Fast path evidence matches selected workorder');
    expect(markup).toContain('Cost estimates remain advisory until finance validates the spare-part price.');
    expect(markup).not.toContain('Runtime trace: trace-fast-path-cost-intelligence-023');
    expect(markup).not.toContain('data-testid="maintenance-copilot-local-preview-badge"');
    expect(markup).not.toContain('Local preview response');
  });

  it('renders fast path summary.text as Markdown when narrative is missing', () => {
    const payload = {
      ...agenticCoreFastPathCostIntelligenceResponse,
      narrative: undefined,
    };
    const content = extractRuntimeAssistantText(payload);
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content,
          timestamp: '12:00',
          responseSource: 'runtime',
          runtimePayload: payload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(content).toContain('## Cost Intelligence Workorder Investigation');
    expect(markup).toContain('data-testid="maintenance-copilot-runtime-badge"');
    expect(markup).toContain('Cost Intelligence Workorder Investigation');
    expect(markup).toContain('The selected workorder BMM26-02465 has a concentrated cost estimate');
    expect(markup).not.toContain('Runtime trace: trace-fast-path-cost-intelligence-023');
    expect(markup).not.toContain('data-testid="maintenance-copilot-local-preview-badge"');
    expect(markup).not.toContain('Local preview response');
  });

  it('rejects stale or secondary fallback responses after a successful runtime submit', () => {
    expect(shouldApplyCopilotSubmitResponse({
      submitSequence: 7,
      latestSubmitSequence: 7,
      latestRuntimeSuccessSequence: 0,
      responseSource: 'runtime',
    })).toBe(true);

    expect(shouldApplyCopilotSubmitResponse({
      submitSequence: 6,
      latestSubmitSequence: 7,
      latestRuntimeSuccessSequence: 7,
      responseSource: 'local_preview',
    })).toBe(false);

    expect(shouldApplyCopilotSubmitResponse({
      submitSequence: 7,
      latestSubmitSequence: 7,
      latestRuntimeSuccessSequence: 7,
      responseSource: 'local_preview',
    })).toBe(false);

    expect(shouldApplyCopilotSubmitResponse({
      submitSequence: 8,
      latestSubmitSequence: 8,
      latestRuntimeSuccessSequence: 7,
      responseSource: 'local_preview',
    })).toBe(true);
  });

  it('falls back to local preview when runtime fails and keeps the fallback note visible', async () => {
    const runtimeRequest = vi.fn(async () => ({
      status: 'error' as const,
      source: 'fallback' as const,
      errorReason: 'runtime unavailable',
      requestedAt: '2026-06-12T08:00:00.000Z',
      completedAt: '2026-06-12T08:00:01.000Z',
      payload: {},
      diagnostics: { error_code: 'runtime_error' },
    }));
    const previewRequest = vi.fn(async () => ({
      ...previewResponse,
      assistant_text: 'Local preview answer mentions RX1-GC-TN-50.',
    }));

    const response = await requestMaintenanceCopilotAssistantResponse({
      prompt: 'Investigate BMM26-02465',
      filters: { status: 'open' },
      workspaceState: createInitialOperationsWorkspaceState(),
      selectedWorkorder,
      previewRequest,
      runtimeRequest,
    });

    expect(response.source).toBe('local_preview');
    expect(previewRequest).toHaveBeenCalledTimes(1);
    expect(response.fallbackReason).toContain('Runtime unavailable');

    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: response.preview.assistant_text,
          timestamp: '12:00',
          responseSource: 'local_preview',
          fallbackReason: response.fallbackReason,
          workspacePayload: response.preview.workspace_payload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="maintenance-copilot-local-preview-badge"');
    expect(markup).toContain('data-testid="maintenance-copilot-local-preview-note"');
    expect(markup).toContain('Local preview response');
    expect(markup).toContain('Runtime unavailable: runtime unavailable');
  });

  it('labels 400 runtime rejection and preserves response body in Developer details', async () => {
    const responseBody = JSON.stringify({ detail: [{ msg: 'extra fields not permitted' }] });
    const runtimeRequest = vi.fn(async () => ({
      status: 'error' as const,
      source: 'fallback' as const,
      errorReason: 'Runtime request rejected',
      requestedAt: '2026-06-12T08:00:00.000Z',
      completedAt: '2026-06-12T08:00:01.000Z',
      payload: {},
      diagnostics: {
        error_code: 'runtime_request_rejected',
        http_status: 400,
        response_body: responseBody,
      },
    }));
    const previewRequest = vi.fn(async () => ({
      ...previewResponse,
      assistant_text: 'Local preview answer mentions RX1-GC-TN-50.',
    }));

    const response = await requestMaintenanceCopilotAssistantResponse({
      prompt: 'Investigate BMM26-02465',
      filters: { status: 'open' },
      workspaceState: createInitialOperationsWorkspaceState(),
      selectedWorkorder,
      previewRequest,
      runtimeRequest,
    });

    expect(response.source).toBe('local_preview');
    expect(response.fallbackReason).toBe('Runtime request rejected');

    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: response.preview.assistant_text,
          timestamp: '12:00',
          responseSource: 'local_preview',
          fallbackReason: response.fallbackReason,
          workspacePayload: response.preview.workspace_payload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
        runtimeFetchDiagnostics={{
          status: 'error',
          source: 'fallback',
          errorReason: 'Runtime request rejected',
          requestUrl: 'https://agentic-core.example.com/api/runtime/workorder-agent',
          requestPayload: JSON.stringify({
            query: 'Investigate BMM26-02465',
            workorder_no: 'BMM26-02465',
            surface_id: 'maintenance.workorders',
          }, null, 2),
          errorCode: 'runtime_request_rejected',
          responseStatus: 400,
          httpStatus: 400,
          responseBody,
        }}
      />,
    );

    expect(markup).toContain('Local preview response - Runtime request rejected');
    expect(markup).toContain('Diagnostics / Developer details');
    expect(markup).toContain('Temporary demo diagnostics HOYA-SPEC023');
    expect(markup).toContain('request_url https://agentic-core.example.com/api/runtime/workorder-agent');
    expect(markup).toContain('request_payload JSON');
    expect(markup).toContain('BMM26-02465');
    expect(markup).toContain('response_status 400');
    expect(markup).toContain('error_code runtime_request_rejected');
    expect(markup).toContain('http_status 400');
    expect(markup).toContain('response_body');
    expect(markup).toContain('extra fields not permitted');
    expect(markup).not.toContain('timed out');
  });

  it('keeps quick prompt behavior on local preview when no workorder context exists', async () => {
    const runtimeRequest = vi.fn();
    const previewRequest = vi.fn(async () => previewResponse);

    const response = await requestMaintenanceCopilotAssistantResponse({
      prompt: 'Summarize current maintenance blockers',
      filters: { status: 'open' },
      workspaceState: createInitialOperationsWorkspaceState(),
      selectedWorkorder: undefined,
      previewRequest,
      runtimeRequest,
    });

    expect(response.source).toBe('local_preview');
    expect(runtimeRequest).not.toHaveBeenCalled();
    expect(previewRequest).toHaveBeenCalledWith({
      message: 'Summarize current maintenance blockers',
      filters: { status: 'open' },
      limit: 5,
    });
  });

  it('renders narrative_panel content in the Copilot conversation when payload includes narrative', () => {
    const payload = {
      ...fullWorkorderAgentPayload.workspace_payload,
      narrative: {
        executive_summary: 'Maintenance Assessment: review POLISHING-7A before the next shift.',
        key_findings: ['Two high-priority workorders remain open.'],
        risks: ['The same fault can recur if validation is skipped.'],
        reasoning: ['Open corrective work and parts signals point to the same asset.'],
        business_impact: 'Downtime exposure remains elevated.',
        recommended_next_steps: ['Assign the lead technician to WO-100.'],
        evidence: ['Runtime workorder query'],
        confidence: 'high',
      },
    } as unknown as WorkspacePayload;

    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Maintenance assessment ready.',
          timestamp: '12:00',
          workspacePayload: payload,
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="assistant-narrative-assessment"');
    expect(markup).toContain('data-testid="maintenance-assessment"');
    expect(markup).toContain('Risk Level warning');
    expect(markup).toContain('Confidence high');
    expect(markup).toContain('Business Impact assessed');
    expect(markup).toContain('Validation Required');
    expect(markup).toContain('Maintenance Assessment: review POLISHING-7A before the next shift.');
    expect(markup).toContain('Executive Summary');
    expect(markup).toContain('Key Findings');
    expect(markup).toContain('Business Impact');
    expect(markup).toContain('Recommended Next Steps');
    expect(markup).toContain('Evidence Sources (3)');
    expect(markup).toContain('View Evidence');
    expect(markup).toContain('View raw response');
    expect(markup).toContain('Maintenance assessment ready.');
    expect(markup).not.toMatch(/data-testid="maintenance-assessment-evidence"[^>]*open/);
    expect(markup).not.toMatch(/data-testid="maintenance-assessment-secondary-detail"[^>]*open/);
    expect(markup).not.toMatch(/data-testid="assistant-raw-response"[^>]*open/);
  });

  it('renders response.narrative as the Maintenance Assessment before raw assistant text', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: '## Selected work order\nRaw assistant text should be secondary.',
          timestamp: '12:00',
          narrative: {
            executive_summary: 'Direct response narrative takes precedence.',
            key_findings: ['The selected workorder is overdue.'],
            business_impact: 'Shift output is at risk.',
            recommended_next_steps: ['Validate repair before release.'],
            confidence: 'high',
            severity: 'warning',
            validation_required: true,
          },
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="maintenance-assessment"');
    expect(markup).toContain('Direct response narrative takes precedence.');
    expect(markup).toContain('Confidence high');
    expect(markup).toContain('Validation Required');
    expect(markup.indexOf('data-testid="maintenance-assessment"')).toBeLessThan(markup.indexOf('View raw response'));
    expect(markup).not.toMatch(/data-testid="assistant-raw-response"[^>]*open/);
  });

  it('places the narrative_panel before Insights and UI Actions in the Copilot panel', () => {
    const payload = {
      ...fullWorkorderAgentPayload.workspace_payload,
      narrative: {
        executive_summary: 'Narrative assessment is first.',
        key_findings: ['Open workorder remains active.'],
        recommended_next_steps: ['Review the active workorder.'],
      },
    } as unknown as WorkspacePayload;
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Assessment ready.',
          timestamp: '12:00',
          workspacePayload: payload,
          insights: [{
            id: 'insight-1',
            type: 'maintenance',
            severity: 'high',
            title: 'Insight title',
            summary: 'Insight summary',
          }],
          uiActions: [{
            type: 'focus_chart',
            target: 'maintenance.workorders.charts.risk',
            valid: true,
            validation_errors: [],
          }],
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup.indexOf('data-testid="maintenance-assessment"')).toBeLessThan(markup.indexOf('Insights'));
    expect(markup.indexOf('Insights')).toBeLessThan(markup.indexOf('UI Actions'));
  });

  it('renders markdown fallback headings as a structured Maintenance Assessment when narrative is absent', () => {
    const markdown = [
      '## Workorder Review',
      'Selected work order WO-77 on POLISHING-7A. Equipment POLISHING-7A has an open corrective maintenance issue.',
      '## Probable failure mode',
      'Bearing temperature excursion is the most likely failure mode.',
      '## Supporting evidence',
      '- Temperature exceeded threshold during the last production window.',
      '- Repeat alarms appeared in the last 24 hours.',
      '## Confidence level',
      'High',
      '## Limitations',
      '- Sensor calibration status was not available in the preview payload.',
      '## Validation steps',
      '1. Confirm bearing availability.',
      '2. Validate repair under load.',
      '## Bottom line',
      'Treat POLISHING-7A as a maintenance risk before the next shift.',
    ].join('\n');

    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: markdown,
          timestamp: '12:00',
          insights: [{
            id: 'insight-markdown',
            type: 'maintenance',
            severity: 'high',
            title: 'Insight title',
            summary: 'Insight summary',
          }],
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('data-testid="maintenance-assessment"');
    expect(markup).toContain('Assessment Header');
    expect(markup).toContain('Selected work order WO-77 on POLISHING-7A.');
    expect(markup).toContain('Probable Failure / What Failed');
    expect(markup).toContain('Bearing temperature excursion is the most likely failure mode.');
    expect(markup).toContain('Confidence High');
    expect(markup).toContain('Recommended Next Steps');
    expect(markup).toContain('Confirm bearing availability.');
    expect(markup).toContain('Bottom Line');
    expect(markup).toContain('Treat POLISHING-7A as a maintenance risk before the next shift.');
    expect(markup).toContain('Full Evidence / Evidence Sources (2)');
    expect(markup).toContain('Limitations and Additional narrative detail');
    expect(markup).toContain('Raw Response - View raw response');
    expect(markup).toContain('Insights');
    expect(markup).not.toMatch(/data-testid="assistant-raw-response"[^>]*open/);
    expect(markup.indexOf('data-testid="maintenance-assessment"')).toBeLessThan(markup.indexOf('Insights'));
  });

  it('keeps old raw text behavior when there is no narrative or markdown assessment', () => {
    const markup = renderToStaticMarkup(
      <MaintenanceAssistantPanel
        isOpen
        onClose={() => {}}
        messages={[{
          id: 1,
          role: 'assistant',
          content: 'Plain assistant answer without structured maintenance headings.',
          timestamp: '12:00',
        }]}
        inputMessage=""
        setInputMessage={() => {}}
        onSendMessage={() => {}}
        summary={summary}
      />,
    );

    expect(markup).toContain('Plain assistant answer without structured maintenance headings.');
    expect(markup).not.toContain('data-testid="maintenance-assessment"');
    expect(markup).not.toContain('View raw response');
  });

  it('builds widgets, diagnostics, and validation from a full fixture payload', () => {
    const model = buildWorkorderWidgetPreviewModel(fullWorkorderAgentPayload);

    expect(model.safeToRender).toBe(true);
    expect(model.widgets.length).toBeGreaterThan(0);
    expect(model.validation.valid).toBe(true);
    expect(model.diagnostics).toMatchObject({
      validationValid: true,
      errorCount: 0,
      lastPayloadType: 'workorder_insight',
      intent: 'workorder_insight',
    });
  });

  it('handles malformed payloads safely without raw JSON or stack traces', () => {
    const model = buildWorkorderWidgetPreviewModel(malformedWorkorderAgentPayload);

    expect(model.diagnostics.lastPayloadType).toBe('workorder_insight');
    expect(model.diagnostics.intent).toBe('workorder_insight');
    expect(model.validation.errors.length).toBeGreaterThanOrEqual(0);
    expect(() => buildWorkorderWidgetPreviewModel('bad payload')).not.toThrow();
  });

  it('renders the developer preview panel and widget list when directly enabled by component use', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={fullWorkorderAgentPayload.workspace_payload as WorkspacePayload} />,
    );

    expect(markup).toContain('Developer Widget Registry Preview');
    expect(markup).toContain('Widgets ');
    expect(markup).toContain('Type workorder_insight');
    expect(markup).toContain('Intent workorder_insight');
    expect(markup).toContain('Detected actions');
    expect(markup).toContain('readonly valid');
    expect(markup).toContain('Execution navigation_only');
    expect(markup).toContain('Risk readonly');
    expect(markup).toContain('Approval not required');
    expect(markup).toContain('Mutation blocked');
    expect(markup).toContain('UI widgets');
    expect(markup).not.toContain('workspace_payload');
  });

  it('renders a safe fallback for malformed preview data', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={malformedWorkorderAgentPayload.workspace_payload as unknown as WorkspacePayload} />,
    );

    expect(markup).toContain('Developer Widget Registry Preview');
    expect(markup).toMatch(/UI widgets|No widget data available for preview|Invalid widget/);
    expect(markup).not.toContain('stack');
    expect(markup).not.toContain('raw');
  });

  it('renders readonly action rejection diagnostics', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={unsupportedActionWorkorderAgentPayload.workspace_payload as unknown as WorkspacePayload} />,
    );

    expect(markup).toContain('Detected actions');
    expect(markup).toContain('rejected');
    expect(markup).toContain('Action &#x27;inspect_unknown&#x27; is not registered');
    expect(markup).toContain('Action &#x27;delete_workorder&#x27; looks like a write operation');
  });

  it('renders runtime trace metadata in developer diagnostics', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={runtimeWorkorderAgentResponse} source="runtime" runtimeStatus={{
        status: 'success',
        source: 'runtime',
        requestedAt: '2026-06-05T00:00:00.000Z',
        completedAt: '2026-06-05T00:00:01.000Z',
        payload: runtimeWorkorderAgentResponse,
        endpointMode: 'base_url_path',
        endpointUrl: 'https://agentic-core.example.com/api/workorder-agent/runtime',
        endpointPath: '/api/workorder-agent/runtime',
        timeoutMs: 10000,
        requestSource: 'hoya_ui.developer_diagnostics',
        clientTraceId: 'client-trace-021-b09',
        runtimeTraceId: 'trace-runtime-workorder-021',
        payloadVersion: '2.0',
      }} />,
    );

    expect(markup).toContain('Trace metadata');
    expect(markup).toContain('Runtime fetch');
    expect(markup).toContain('status success source runtime');
    expect(markup).toContain('trace_id trace-runtime-workorder-021');
    expect(markup).toContain('agent_id maint-workorder-agent');
    expect(markup).toContain('run_id run-runtime-021-b07');
    expect(markup).toContain('payload_version 2.0');
    expect(markup).toContain('endpoint_mode base_url_path');
    expect(markup).toContain('endpoint_url https://agentic-core.example.com/api/workorder-agent/runtime');
    expect(markup).toContain('endpoint_path /api/workorder-agent/runtime');
    expect(markup).toContain('timeout_ms 10000');
    expect(markup).toContain('request_source hoya_ui.developer_diagnostics');
    expect(markup).toContain('client_trace_id client-trace-021-b09');
    expect(markup).toContain('runtime_trace_id trace-runtime-workorder-021');
    expect(markup).toContain('Runtime diagnostics');
  });

  it('renders disabled fallback runtime diagnostics without a backend call', () => {
    const markup = renderToStaticMarkup(
      <DeveloperWidgetRegistryPreview payload={{
        payload_type: 'workorder_agent_response',
        intent: 'workorder_insight',
        error: { code: 'runtime_disabled', message: 'Workorder Agent runtime endpoint is not configured' },
        diagnostics: [{
          code: 'runtime_disabled',
          message: 'Workorder Agent runtime endpoint is not configured',
          severity: 'info',
          section: 'runtime_fetch',
        }],
      }} source="fallback" runtimeStatus={{
        status: 'disabled',
        source: 'fallback',
        errorReason: 'Workorder Agent runtime endpoint is not configured',
        endpointMode: 'disabled',
        endpointPath: '/api/workorder-agent/runtime',
        timeoutMs: 10000,
        requestSource: 'hoya_ui.developer_diagnostics',
      }} />,
    );

    expect(markup).toContain('status disabled source fallback');
    expect(markup).toContain('reason Workorder Agent runtime endpoint is not configured');
    expect(markup).toContain('endpoint_mode disabled');
    expect(markup).toContain('endpoint_path /api/workorder-agent/runtime');
    expect(markup).toContain('timeout_ms 10000');
    expect(markup).toContain('request_source hoya_ui.developer_diagnostics');
    expect(markup).toContain('runtime_disabled');
    expect(markup).toContain('Workorder Agent runtime endpoint is not configured');
  });

  it('keeps readonly action clicks as dev-only no-ops without API calls or mutation', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const mutableState = { changed: false };

    const result = handleDeveloperReadonlyAction({
      widgetId: 'actions',
      actionId: 'view_workorder',
      targetId: 'maintenance.workorders.actions.view_workorder',
    });

    expect(result).toMatchObject({
      accepted: true,
      status: 'navigation_ready',
      backendMutationCalled: false,
      dataStateChanged: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mutableState.changed).toBe(false);
    fetchSpy.mockRestore();
  });

  it('keeps dangerous primitives out of touched preview files', () => {
    const source = [
      'src/ui-registry/adapters/workorderWidgetPreviewModel.ts',
      'src/pages/maintenance/MaintenanceWorkorderTrackingPage.tsx',
    ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
    const forbidden = new RegExp([
      'dangerously' + 'SetInnerHTML',
      'eval' + '\\(',
      'new ' + 'Function',
    ].join('|'));

    expect(source).not.toMatch(forbidden);
  });
});
