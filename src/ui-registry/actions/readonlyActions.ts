import type { UiActionTargetId } from '../types';

export type AgentReadonlyActionId =
  | 'view_workorder'
  | 'view_machine'
  | 'view_history'
  | 'show_details'
  | 'view_workorder_history'
  | 'view_delay_analysis'
  | 'view_bottleneck'
  | 'view_related_workorders';

export interface AgentReadonlyAction {
  id: AgentReadonlyActionId;
  mode: 'readonly';
  label?: string;
  target?: string;
  params?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AgentReadonlyActionDefinition {
  id: AgentReadonlyActionId;
  label: string;
  targetId: UiActionTargetId;
  navigation: 'inspect_workorder' | 'inspect_machine' | 'inspect_history' | 'inspect_analysis';
}

export interface AgentReadonlyActionValidation {
  actionId?: string;
  label?: string;
  mode?: string;
  targetId?: UiActionTargetId;
  valid: boolean;
  status: 'accepted' | 'rejected';
  rejectionReason?: string;
  rejectionCode?: string;
  action?: AgentReadonlyAction;
}

export type ActionExecutionMode = 'navigation_only';
export type ActionRiskClass = 'readonly';

export interface ActionExecutionPolicyMetadata {
  executionMode: ActionExecutionMode;
  riskClass: ActionRiskClass;
  requiresApproval: false;
  mutationAllowed: false;
}

export interface ActionExecutionRequest {
  requestId?: string;
  action: unknown;
  executionMode?: string;
  mutationIntent?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ActionExecutionResult {
  requestId?: string;
  actionId?: string;
  targetId?: UiActionTargetId;
  accepted: boolean;
  status: 'navigation_ready' | 'rejected';
  executionPolicy: ActionExecutionPolicyMetadata;
  navigation?: {
    targetId: UiActionTargetId;
    intent: AgentReadonlyActionDefinition['navigation'];
    target?: string;
    params?: Record<string, unknown>;
  };
  rejectionCode?: string;
  rejectionReason?: string;
  backendMutationCalled: false;
  dataStateChanged: false;
}

export const readonlyActionExecutionPolicy = {
  executionMode: 'navigation_only',
  riskClass: 'readonly',
  requiresApproval: false,
  mutationAllowed: false,
} as const satisfies ActionExecutionPolicyMetadata;

const readonlyActionDefinitions = [
  {
    id: 'view_workorder',
    label: 'View workorder',
    targetId: 'maintenance.workorders.actions.view_workorder',
    navigation: 'inspect_workorder',
  },
  {
    id: 'view_machine',
    label: 'View machine',
    targetId: 'maintenance.workorders.actions.view_machine',
    navigation: 'inspect_machine',
  },
  {
    id: 'view_history',
    label: 'View history',
    targetId: 'maintenance.workorders.actions.view_history',
    navigation: 'inspect_history',
  },
  {
    id: 'show_details',
    label: 'Show details',
    targetId: 'maintenance.workorders.actions.show_details',
    navigation: 'inspect_workorder',
  },
  {
    id: 'view_workorder_history',
    label: 'View workorder history',
    targetId: 'maintenance.workorders.actions.view_workorder_history',
    navigation: 'inspect_history',
  },
  {
    id: 'view_delay_analysis',
    label: 'View delay analysis',
    targetId: 'maintenance.workorders.actions.view_delay_analysis',
    navigation: 'inspect_analysis',
  },
  {
    id: 'view_bottleneck',
    label: 'View bottleneck',
    targetId: 'maintenance.workorders.actions.view_bottleneck',
    navigation: 'inspect_analysis',
  },
  {
    id: 'view_related_workorders',
    label: 'View related workorders',
    targetId: 'maintenance.workorders.actions.view_related_workorders',
    navigation: 'inspect_workorder',
  },
] as const satisfies readonly AgentReadonlyActionDefinition[];

export const agentReadonlyActionRegistry = readonlyActionDefinitions.reduce((registry, definition) => {
  registry[definition.id] = definition;
  return registry;
}, {} as Record<AgentReadonlyActionId, AgentReadonlyActionDefinition>);

export const agentReadonlyActionIds = readonlyActionDefinitions.map((definition) => definition.id);
export const agentReadonlyActionTargetIds = readonlyActionDefinitions.map((definition) => definition.targetId);

const allowedActionIds = new Set<string>(agentReadonlyActionIds);
const writeLikePattern = /(^|[_:.-])(create|update|delete|remove|execute|exec|run|mutate|write|save|submit|approve|close|cancel|assign|dispatch|complete|resolve|insert|upsert|patch|post|put)([_:.-]|$)/i;

export function getAgentReadonlyActionDefinition(
  actionId: AgentReadonlyActionId,
): AgentReadonlyActionDefinition {
  return agentReadonlyActionRegistry[actionId];
}

export function validateAgentReadonlyAction(rawAction: unknown): AgentReadonlyActionValidation {
  const record = getRecord(rawAction);
  const actionId = getText(record?.id ?? record?.action_id ?? record?.actionId);
  const mode = getText(record?.mode);
  const label = getText(record?.label);
  const type = getText(record?.type ?? record?.action_type ?? record?.operation);
  const writeLikeCandidate = [actionId, type].filter(Boolean).join(' ');

  if (!record || !actionId) {
    return rejected(actionId, label, mode, 'missing_action_id', 'Action id is required');
  }

  if (isWriteLikeActionId(writeLikeCandidate)) {
    return rejected(actionId, label, mode, 'write_like_action_id', `Action '${actionId}' looks like a write operation`);
  }

  if (mode !== 'readonly') {
    return rejected(actionId, label, mode, 'non_readonly_mode', `Action '${actionId}' must use mode readonly`);
  }

  if (!allowedActionIds.has(actionId)) {
    return rejected(actionId, label, mode, 'unknown_action_id', `Action '${actionId}' is not registered`);
  }

  const definition = getAgentReadonlyActionDefinition(actionId as AgentReadonlyActionId);
  const action: AgentReadonlyAction = {
    id: actionId as AgentReadonlyActionId,
    mode: 'readonly',
    label,
    target: getText(record.target ?? record.entity_id ?? record.targetId),
    params: getRecord(record.params ?? record.parameters),
    metadata: getRecord(record.metadata),
  };

  return {
    actionId,
    label: action.label ?? definition.label,
    mode,
    targetId: definition.targetId,
    valid: true,
    status: 'accepted',
    action,
  };
}

export function validateAgentReadonlyActions(rawActions: unknown[]): AgentReadonlyActionValidation[] {
  return rawActions.map(validateAgentReadonlyAction);
}

export function guardReadonlyActionExecution(request: ActionExecutionRequest): ActionExecutionResult {
  if (request.executionMode !== undefined && request.executionMode !== readonlyActionExecutionPolicy.executionMode) {
    return rejectedExecution(request, undefined, 'non_readonly_execution_mode', 'Readonly actions only support navigation_only execution');
  }

  if (hasMutationIntent(request) || hasMutationIntent(request.action)) {
    const actionId = getText(getRecord(request.action)?.id ?? getRecord(request.action)?.action_id ?? getRecord(request.action)?.actionId);
    return rejectedExecution(request, actionId, 'mutation_intent_rejected', 'Readonly action execution cannot carry mutation intent');
  }

  const validation = validateAgentReadonlyAction(request.action);
  if (!validation.valid || !validation.action || !validation.targetId) {
    return rejectedExecution(request, validation.actionId, validation.rejectionCode ?? 'invalid_readonly_action', validation.rejectionReason ?? 'Readonly action validation failed');
  }

  const definition = getAgentReadonlyActionDefinition(validation.action.id);
  return {
    requestId: request.requestId,
    actionId: validation.action.id,
    targetId: definition.targetId,
    accepted: true,
    status: 'navigation_ready',
    executionPolicy: readonlyActionExecutionPolicy,
    navigation: {
      targetId: definition.targetId,
      intent: definition.navigation,
      target: validation.action.target,
      params: validation.action.params,
    },
    backendMutationCalled: false,
    dataStateChanged: false,
  };
}

export function executeReadonlyActionNoop(request: ActionExecutionRequest): ActionExecutionResult {
  return guardReadonlyActionExecution(request);
}

export function isWriteLikeActionId(value: string | undefined): boolean {
  return Boolean(value && writeLikePattern.test(value));
}

function hasMutationIntent(value: unknown): boolean {
  const record = getRecord(value);
  if (!record) {
    return false;
  }

  if (record.mutationIntent === true || record.mutation_intent === true || record.mutationAllowed === true || record.mutation_allowed === true) {
    return true;
  }

  const intent = getText(record.intent);
  if (intent && isWriteLikeActionId(intent)) {
    return true;
  }

  return hasMutationIntent(record.metadata) || hasMutationIntent(record.params) || hasMutationIntent(record.parameters);
}

function rejectedExecution(
  request: ActionExecutionRequest,
  actionId: string | undefined,
  rejectionCode: string,
  rejectionReason: string,
): ActionExecutionResult {
  return {
    requestId: request.requestId,
    actionId,
    accepted: false,
    status: 'rejected',
    executionPolicy: readonlyActionExecutionPolicy,
    rejectionCode,
    rejectionReason,
    backendMutationCalled: false,
    dataStateChanged: false,
  };
}

function rejected(
  actionId: string | undefined,
  label: string | undefined,
  mode: string | undefined,
  rejectionCode: string,
  rejectionReason: string,
): AgentReadonlyActionValidation {
  return {
    actionId,
    label,
    mode,
    valid: false,
    status: 'rejected',
    rejectionCode,
    rejectionReason,
  };
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function getText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}
