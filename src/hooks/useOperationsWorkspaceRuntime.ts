import { useCallback, useState } from 'react';

import {
  applyUiAction,
  applyUiActions,
  createInitialOperationsWorkspaceState,
} from '../services/operationsWorkspaceRuntime';
import type { OperationsWorkspaceState, UiAction } from '../types/operationsWorkspace';

export function useOperationsWorkspaceRuntime(initialState?: OperationsWorkspaceState) {
  const [state, setState] = useState<OperationsWorkspaceState>(
    () => initialState ?? createInitialOperationsWorkspaceState(),
  );

  const applyAction = useCallback((action: UiAction) => {
    setState((currentState) => applyUiAction(currentState, action));
  }, []);

  const applyActions = useCallback((actions: UiAction[]) => {
    setState((currentState) => applyUiActions(currentState, actions));
  }, []);

  const resetWorkspaceState = useCallback(() => {
    setState(createInitialOperationsWorkspaceState());
  }, []);

  return {
    state,
    applyAction,
    applyActions,
    resetWorkspaceState,
  };
}
