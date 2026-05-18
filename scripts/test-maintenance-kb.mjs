import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  appType: 'custom',
  server: {
    host: '127.0.0.1',
    hmr: {
      host: '127.0.0.1',
      port: 24701,
    },
    middlewareMode: true,
  },
  ssr: {
    external: ['react', 'react-dom'],
  },
});

try {
  const { MaintenanceKnowledgeBasePage } = await server.ssrLoadModule('/src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx');
  const { FilterPanel } = await server.ssrLoadModule('/src/components/maintenance/FilterPanel.tsx');
  const { DocumentResultList } = await server.ssrLoadModule('/src/components/maintenance/DocumentResultList.tsx');
  const { AssistantPanel } = await server.ssrLoadModule('/src/components/maintenance/AssistantPanel.tsx');
  const {
    getMaintenanceKbContext,
    searchMaintenanceKbDocuments,
    askMaintenanceKbAssistant,
  } = await server.ssrLoadModule('/src/services/maintenanceKbApi.ts');

  const context = await getMaintenanceKbContext();
  const filters = context.selected;
  const searchResponse = await searchMaintenanceKbDocuments(filters);
  const chatResponse = await askMaintenanceKbAssistant({
    question: 'How should we replace the CURVE-GEN-3B spindle bearing?',
    context: filters,
  });

  assert.equal(searchResponse.items[0].kb_id, 'KB-MNT-045');
  assert.equal(searchResponse.items[0].match_score, 98);
  assert.equal(typeof chatResponse.answer, 'string');
  assert.ok(chatResponse.sources.length >= 1);
  assert.ok(chatResponse.confidence > 0);

  const pageHtml = renderToStaticMarkup(React.createElement(MaintenanceKnowledgeBasePage, { sidebarCollapsed: true }));
  assert.match(pageHtml, /Maintenance Knowledge Base/);
  assert.match(pageHtml, /AI-powered knowledge hub/);

  const filterHtml = renderToStaticMarkup(React.createElement(FilterPanel, {
    context,
    filters,
    onFiltersChange: () => {},
  }));
  for (const label of ['Production Line', 'Station / Process', 'Machine', 'Failure Type', 'Document Type']) {
    assert.match(filterHtml, new RegExp(label.replace('/', '\\/')));
  }

  const documentsHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: searchResponse.items,
    isLoading: false,
    error: null,
  }));
  assert.match(documentsHtml, /KB-MNT-045/);
  assert.match(documentsHtml, /Precision Bearing Replacement Protocol/);
  assert.match(documentsHtml, /98%/);

  const assistantHtml = renderToStaticMarkup(React.createElement(AssistantPanel, {
    context,
    filters,
    response: chatResponse,
    question: 'How should we replace the CURVE-GEN-3B spindle bearing?',
    isLoading: false,
    error: null,
    relatedHistory: [],
    onQuestionChange: () => {},
    onSendQuestion: () => {},
    onSelectQuestion: () => {},
  }));
  assert.match(assistantHtml, /AI Maintenance Knowledge Assistant/);
  assert.match(assistantHtml, /Chat Answer/);
  assert.match(assistantHtml, /Source References/);
  assert.match(assistantHtml, /Confidence Score/);

  console.log('maintenance-kb tests passed');
} finally {
  await server.close();
}
