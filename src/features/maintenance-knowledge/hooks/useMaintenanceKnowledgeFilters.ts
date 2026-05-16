import { useState } from 'react';

export function useMaintenanceKnowledgeFilters() {
  const [selectedMachine, setSelectedMachine] = useState('curve-gen-3b');
  const [selectedDocType, setSelectedDocType] = useState('all');

  return {
    selectedMachine,
    selectedDocType,
    setSelectedMachine,
    setSelectedDocType,
  };
}
