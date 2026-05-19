import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

process.env.VITE_AGENTIC_CORE_API_BASE_URL = 'http://agentic-core.test';
delete process.env.VITE_MAINTENANCE_KB_USE_MOCK;

const fetchCalls = [];
globalThis.fetch = async (url, init = {}) => {
  fetchCalls.push({ url: String(url), init });

  if (String(url).endsWith('/api/maintenance/kb/context')) {
    return jsonResponse({
      production_lines: [{ id: 'rx1-surfacing', label: 'Rx1 Surfacing' }],
      stations: [{ id: 'curve-generating', label: 'CURVE GENERATING' }],
      machines: [{ id: 'curve-gen-3b', label: 'CURVE-GEN-3B' }],
      failure_types: [{ id: 'mechanical', label: 'Mechanical' }],
      document_types: [{ id: 'all', label: 'All Documents' }, { id: 'sop', label: 'SOPs' }],
      selected: {
        production_line: 'rx1-surfacing',
        station: 'curve-generating',
        machine: 'curve-gen-3b',
        failure_type: 'mechanical',
        document_type: 'all',
      },
      trace_id: 'trace-context-1',
    });
  }

  if (String(url).endsWith('/api/maintenance/kb/documents/upload')) {
    assert.equal(init.method, 'POST');
    assert.ok(init.body instanceof FormData);
    return jsonResponse({
      document_id: 'doc-upload-1',
      status: 'uploaded',
      manifest: {
        document_id: 'doc-upload-1',
        title: 'Uploaded Bearing Procedure',
        filename: 'bearing-procedure.pdf',
        status: 'uploaded',
        document_type: 'troubleshooting',
        machine: 'curve-gen-3b',
        version: 'v1',
        uploaded_at: '2026-05-19T08:00:00Z',
        source_origin: 'uploaded',
        warnings: [],
      },
      trace_id: 'trace-upload-1',
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-upload-1/ingest')) {
    assert.equal(init.method, 'POST');
    return jsonResponse({
      document_id: 'doc-upload-1',
      status: 'active',
      steps: [
        { step: 'parse', status: 'completed' },
        { step: 'chunk', status: 'completed' },
        { step: 'index', status: 'completed' },
        { step: 'activate', status: 'completed' },
      ],
      trace_id: 'trace-ingest-1',
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-upload-1/diagnostics')) {
    assert.equal(init.method, 'GET');
    return jsonResponse({
      document_id: 'doc-upload-1',
      manifest_status: 'active',
      file_exists: true,
      parsed_exists: true,
      chunks_exists: true,
      indexed: true,
      active: true,
      checksum: 'sha256:abc',
      vector_count: 12,
      source_origin: 'uploaded',
      trace_id: 'trace-diagnostics-1',
      warnings: ['minor metadata warning'],
      indexing_metadata: { embedding_model: 'test-embedding', chunks: 12 },
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents')) {
    assert.equal(init.method, 'GET');
    return jsonResponse({
      documents: [
        {
          document_id: 'doc-upload-1',
          title: 'Uploaded Bearing Procedure',
          filename: 'bearing-procedure.pdf',
          status: 'active',
          document_type: 'troubleshooting',
          machine: 'curve-gen-3b',
          version: 'v1',
          uploaded_at: '2026-05-19T08:00:00Z',
          source_origin: 'uploaded',
          warnings: ['minor metadata warning'],
        },
      ],
    });
  }

  if (String(url).endsWith('/api/maintenance/kb/search')) {
    const body = init.body ? JSON.parse(init.body) : {};
    if (body.query === '__503__') {
      return new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
    }

    return jsonResponse({
      items: [
        {
          kb_id: 'KB-MNT-045',
          title: 'Precision Bearing Replacement Protocol',
          match_score: 0.98,
          document_type: 'sop',
          version: 'v2.3',
          updated_at: '2026-01-08',
          source_ref: 'SOP KB-MNT-045, steps 1-5',
          source_origin: 'uploaded',
          excerpt: 'Uploaded document excerpt about spindle bearing replacement.',
          metadata: { machine: 'curve-gen-3b' },
        },
      ],
      trace_id: 'trace-search-1',
      retrieval_metadata: { mode: 'hybrid', returned: 1, top_k: 5 },
    });
  }

  if (String(url).endsWith('/api/maintenance/kb/chat')) {
    return jsonResponse({
      answer: 'Use the approved bearing replacement procedure and verify LOTO before work.',
      confidence: 0.61,
      confidence_label: 'low',
      sources: [
        {
          source_id: 'src-kb-mnt-045-step-4',
          kb_id: 'KB-MNT-045',
          title: 'Precision Bearing Replacement Protocol',
          document_type: 'sop',
          version: 'v2.3',
          section: 'Installation and Verification',
          page: 8,
          updated_at: '2026-01-08',
          source_ref: 'SOP KB-MNT-045, step 4.2 and 5.1',
          source_origin: 'uploaded',
          excerpt: 'Uploaded evidence excerpt for installation and verification.',
          relevance_score: 0.96,
        },
      ],
      related_documents: [],
      suggested_questions: ['Show maintenance history'],
      warnings: ['Low confidence: evidence is limited.'],
      trace_id: 'trace-chat-1',
      conversation_id: 'conversation-1',
      retrieval_metadata: { mode: 'hybrid', sources: 0 },
      related_history: [
        {
          id: 'MWO-2401-032',
          title: 'Spindle bearing noise',
          date: '2026-01-10',
          machine: 'CURVE-GEN-3B',
          summary: 'Bearing replacement completed.',
          source_ref: 'MWO-2401-032 repair log',
        },
      ],
      similar_cases: [{ id: 'CASE-7', title: 'Similar spindle noise', machine: 'CURVE-GEN-3B', confidence: 81 }],
      safety_critical: true,
      safety_category: 'LOTO',
      governance_flags: ['requires_evidence'],
      evidence_required: true,
      evidence_satisfied: false,
      restricted_guidance: true,
      official_source_required: true,
    });
  }

  return new Response('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
};

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
  const { DocumentManagementPanel } = await server.ssrLoadModule('/src/components/maintenance/DocumentManagementPanel.tsx');
  const { AssistantPanel } = await server.ssrLoadModule('/src/components/maintenance/AssistantPanel.tsx');
  const {
    getMaintenanceKbContext,
    uploadDocument,
    listDocuments,
    ingestDocument,
    getDocumentDiagnostics,
    searchMaintenanceKbDocuments,
    askMaintenanceKbAssistant,
    toMaintenanceKbSearchApiRequest,
    toMaintenanceKbChatApiRequest,
  } = await server.ssrLoadModule('/src/services/maintenanceKbApi.ts');

  const context = await getMaintenanceKbContext();
  const filters = { ...context.selected, limit: 5 };
  const searchResponse = await searchMaintenanceKbDocuments(filters);
  const chatResponse = await askMaintenanceKbAssistant({
    question: 'How should we replace the CURVE-GEN-3B spindle bearing?',
    context: filters,
    conversation_id: 'conversation-existing',
    trace_id: 'trace-existing',
  });
  const uploadResponse = await uploadDocument(new File(['test'], 'bearing-procedure.pdf', { type: 'application/pdf' }), {
    title: 'Uploaded Bearing Procedure',
    document_type: 'troubleshooting',
    line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    failure_type: 'mechanical',
    knowledge_category: 'bearing',
    criticality: 'medium',
    language: 'en',
    version: 'v1',
    owner: 'maintenance',
    effective_date: '2026-05-19',
    tags: ['bearing', 'spindle'],
  });
  const manifests = await listDocuments(filters);
  const ingestResponse = await ingestDocument('doc-upload-1');
  const diagnosticsResponse = await getDocumentDiagnostics('doc-upload-1');

  assert.equal(fetchCalls[0].url, 'http://agentic-core.test/api/maintenance/kb/context');
  assert.equal(fetchCalls[1].url, 'http://agentic-core.test/api/maintenance/kb/search');
  assert.equal(fetchCalls[2].url, 'http://agentic-core.test/api/maintenance/kb/chat');
  assert.equal(fetchCalls[3].url, 'http://agentic-core.test/api/maintenance/kb/documents/upload');
  assert.match(fetchCalls[4].url, /\/api\/maintenance\/kb\/documents\?line=rx1-surfacing/);
  assert.equal(fetchCalls[5].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1/ingest');
  assert.equal(fetchCalls[6].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1/diagnostics');

  assert.deepEqual(toMaintenanceKbSearchApiRequest(filters), {
    query: undefined,
    filters: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
      document_type: undefined,
    },
    top_k: 5,
  });
  assert.deepEqual(JSON.parse(fetchCalls[1].init.body), {
    filters: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
    },
    top_k: 5,
  });
  assert.deepEqual(toMaintenanceKbChatApiRequest({
    question: 'Question',
    context: filters,
    conversation_id: 'conversation-existing',
    trace_id: 'trace-existing',
  }), {
    message: 'Question',
    context: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
      document_type: undefined,
    },
    conversation_id: 'conversation-existing',
    trace_id: 'trace-existing',
  });

  assert.equal(searchResponse.items[0].kb_id, 'KB-MNT-045');
  assert.equal(searchResponse.items[0].match_score, 98);
  assert.equal(searchResponse.items[0].source_origin, 'uploaded');
  assert.equal(searchResponse.trace_id, 'trace-search-1');
  assert.equal(chatResponse.trace_id, 'trace-chat-1');
  assert.equal(chatResponse.conversation_id, 'conversation-1');
  assert.equal(chatResponse.confidence, 61);
  assert.equal(chatResponse.sources[0].source_id, 'src-kb-mnt-045-step-4');
  assert.equal(chatResponse.sources[0].relevance_score, 96);
  assert.equal(chatResponse.sources[0].source_origin, 'uploaded');
  assert.equal(chatResponse.related_history?.[0].id, 'MWO-2401-032');
  assert.equal(chatResponse.safety_critical, true);
  assert.equal(chatResponse.restricted_guidance, true);
  assert.equal(uploadResponse.document_id, 'doc-upload-1');
  assert.equal(uploadResponse.manifest?.source_origin, 'uploaded');
  assert.equal(manifests[0].status, 'active');
  assert.equal(manifests[0].source_origin, 'uploaded');
  assert.equal(ingestResponse.steps.map((step) => step.step).join(','), 'parse,chunk,index,activate');
  assert.equal(diagnosticsResponse.active, true);
  assert.equal(diagnosticsResponse.vector_count, 12);
  assert.equal(diagnosticsResponse.trace_id, 'trace-diagnostics-1');
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__503__' }),
    /safe backend error state/,
  );

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
  assert.match(documentsHtml, /Uploaded KB/);

  const emptyDocumentsHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: [],
    isLoading: false,
    error: null,
  }));
  assert.match(emptyDocumentsHtml, /Empty search result/);

  const errorDocumentsHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: [],
    isLoading: false,
    error: 'Maintenance KB backend returned 503.',
  }));
  assert.match(errorDocumentsHtml, /Maintenance KB backend returned 503/);

  const assistantHtml = renderToStaticMarkup(React.createElement(AssistantPanel, {
    context,
    filters,
    response: chatResponse,
    question: 'How should we replace the CURVE-GEN-3B spindle bearing?',
    isLoading: false,
    error: null,
    relatedHistory: chatResponse.related_history,
    onQuestionChange: () => {},
    onSendQuestion: () => {},
    onSelectQuestion: () => {},
  }));
  assert.match(assistantHtml, /AI Maintenance Knowledge Assistant/);
  assert.match(assistantHtml, /Use the approved bearing replacement procedure/);
  assert.match(assistantHtml, /61%/);
  assert.match(assistantHtml, /Source References/);
  assert.match(assistantHtml, /SOP KB-MNT-045, step 4\.2 and 5\.1/);
  assert.match(assistantHtml, /Uploaded evidence excerpt/);
  assert.match(assistantHtml, /Uploaded KB/);
  assert.match(assistantHtml, /Safety \/ Evidence Controls/);
  assert.match(assistantHtml, /Restricted guidance/);
  assert.match(assistantHtml, /Trace:/);
  assert.match(assistantHtml, /Spindle bearing noise/);
  assert.match(assistantHtml, /Similar spindle noise/);
  assert.match(assistantHtml, /No evidence is available/);
  assert.match(assistantHtml, /Low confidence/);

  const noEvidenceHtml = renderToStaticMarkup(React.createElement(AssistantPanel, {
    context,
    filters,
    response: { ...chatResponse, confidence: 0, confidence_label: 'no_evidence', sources: [] },
    question: 'Unknown issue',
    isLoading: false,
    error: null,
    relatedHistory: [],
    onQuestionChange: () => {},
    onSendQuestion: () => {},
    onSelectQuestion: () => {},
  }));
  assert.match(noEvidenceHtml, /No evidence found/);

  const managementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: manifests,
    diagnostics: diagnosticsResponse,
    ingestResult: ingestResponse,
    uploadResult: uploadResponse,
    isLoadingDocuments: false,
    isUploading: false,
    isIngesting: false,
    isLoadingDiagnostics: false,
    documentError: null,
    uploadError: null,
    ingestError: null,
    diagnosticsError: null,
    onUpload: async () => {},
    onIngest: async () => {},
    onDiagnostics: async () => {},
    onRefresh: async () => {},
    onSearchFiltersChange: () => {},
    searchFilters: filters,
  }));
  assert.match(managementHtml, /Upload Document/);
  assert.match(managementHtml, /Document Status/);
  assert.match(managementHtml, /Uploaded Bearing Procedure/);
  assert.match(managementHtml, /Ingest Steps/);
  assert.match(managementHtml, /parse/);
  assert.match(managementHtml, /Diagnostics/);
  assert.match(managementHtml, /trace-diagnostics-1/);

  const unavailable = await fetch('http://agentic-core.test/api/maintenance/kb/unavailable');
  assert.equal(unavailable.status, 503);
} finally {
  await server.close();
}

process.env.VITE_MAINTENANCE_KB_USE_MOCK = 'true';
const fetchCallCountBeforeMock = fetchCalls.length;
const mockServer = await createServer({
  appType: 'custom',
  server: {
    host: '127.0.0.1',
    middlewareMode: true,
  },
  ssr: {
    external: ['react', 'react-dom'],
  },
});

try {
  const {
    getMaintenanceKbContext,
    searchMaintenanceKbDocuments,
    askMaintenanceKbAssistant,
  } = await mockServer.ssrLoadModule('/src/services/maintenanceKbApi.ts?mock-fallback');

  const context = await getMaintenanceKbContext();
  const searchResponse = await searchMaintenanceKbDocuments(context.selected);
  const chatResponse = await askMaintenanceKbAssistant({
    question: 'How should we replace the CURVE-GEN-3B spindle bearing?',
    context: context.selected,
  });

  assert.equal(searchResponse.items[0].kb_id, 'KB-MNT-045');
  assert.equal(chatResponse.trace_id, 'mock-trace-chat');
  assert.equal(chatResponse.evidence_satisfied, true);
  assert.equal(fetchCalls.length, fetchCallCountBeforeMock);
} finally {
  await mockServer.close();
}

console.log('maintenance-kb tests passed');

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
