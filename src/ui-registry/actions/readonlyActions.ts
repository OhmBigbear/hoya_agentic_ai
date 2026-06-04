import type { UiActionTargetId } from '../types';

export type AgentReadonlyActionId =
  | 'view_workorder'
  | 'view_machine'
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

export function isWriteLikeActionId(value: string | undefined): boolean {
  return Boolean(value && writeLikePattern.test(value));
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
