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
      document_types: [
        { id: 'all', label: 'All Documents' },
        { id: 'maintenance', label: 'Maintenance Document' },
        { id: 'knowledge', label: 'Knowledge Document' },
        { id: 'other', label: 'Other Document' },
      ],
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
        document_type: 'maintenance',
        machine: 'curve-gen-3b',
        version: 'v1',
        uploaded_at: '2026-05-19T08:00:00Z',
        source_origin: 'uploaded',
        warnings: [],
      },
      trace_id: 'trace-upload-1',
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-upload-1/process')) {
    assert.equal(init.method, 'POST');
    return jsonResponse({
      document_id: 'doc-upload-1',
      status: 'ready',
      steps: [
        { step: 'ocr', status: 'ocr_completed' },
        { step: 'chunk', status: 'chunked' },
        { step: 'index', status: 'indexed' },
        { step: 'activate', status: 'ready' },
      ],
      trace_id: 'trace-process-1',
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-upload-400/process')) {
    assert.equal(init.method, 'POST');
    return jsonError({
      detail: {
        stage: 'ocr',
        error_code: 'OCR_FAILED',
        message: 'OCR worker failed while extracting text.',
        retryable: true,
        recoverable: true,
      },
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-indexing-400/process')) {
    assert.equal(init.method, 'POST');
    return jsonError({
      stage: 'indexing',
      error_code: 'INDEXING_FAILED',
      message: 'Vector index write failed.',
      retryable: true,
      recoverable: true,
    });
  }

  if (String(url).includes('/api/maintenance/kb/documents/doc-timeout/process')) {
    assert.equal(init.method, 'POST');
    return new Promise((_, reject) => {
      if (init.signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }

      init.signal?.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
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

  if (String(url).endsWith('/api/maintenance/kb/documents/doc-upload-1/archive')) {
    assert.equal(init.method, 'POST');
    return new Response(null, { status: 204 });
  }

  if (String(url).endsWith('/api/maintenance/kb/documents/doc-upload-1')) {
    assert.equal(init.method, 'DELETE');
    return new Response(null, { status: 204 });
  }

  if (String(url).includes('/api/maintenance/kb/documents')) {
    assert.equal(init.method, 'GET');
    return jsonResponse({
      documents: [
        {
          document_id: 'doc-upload-1',
          title: 'Uploaded Bearing Procedure',
          filename: 'bearing-procedure.pdf',
          status: 'ready',
          document_type: 'maintenance',
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
    if (body.query === '__ocr_failed__') {
      return jsonError({ error_code: 'OCR_FAILED', detail: 'OCR failed while extracting text.' });
    }
    if (body.query === '__chunking_failed__') {
      return jsonError({ error_code: 'CHUNKING_FAILED', detail: 'Chunking failed.' });
    }
    if (body.query === '__indexing_failed__') {
      return jsonError({ error_code: 'INDEXING_FAILED', detail: 'Indexing failed.' });
    }
    if (body.query === '__unsupported_file__') {
      return jsonError({ error_code: 'UNSUPPORTED_FILE', detail: 'Unsupported file.' });
    }
    if (body.query === '__structured_detail__') {
      return jsonError({
        detail: {
          message: 'Document metadata is missing a machine.',
          field: 'machine',
        },
      });
    }

    return jsonResponse({
      items: [
        {
          kb_id: 'KB-MNT-045',
          title: 'Precision Bearing Replacement Protocol',
          match_score: 0.98,
          document_type: 'maintenance',
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
    const body = init.body ? JSON.parse(init.body) : {};
    if (body.message === '__no_evidence_selected__') {
      return jsonResponse({
        answer: 'No grounded maintenance evidence was found in the selected document.',
        confidence: 0,
        confidence_label: 'no_evidence',
        sources: [],
        related_documents: [],
        suggested_questions: [],
        warnings: [],
        trace_id: 'trace-chat-no-evidence',
        conversation_id: 'conversation-1',
        retrieval_metadata: {
          retrieval_scope: 'selected_documents',
          selected_document_ids: body.document_ids ?? [],
          no_evidence_reason: 'selected_document_no_evidence',
        },
        evidence_required: true,
        evidence_satisfied: false,
        restricted_guidance: true,
      });
    }

    return jsonResponse({
      answer: 'Use the approved bearing replacement procedure and verify LOTO before work.',
      confidence: 0.61,
      confidence_label: 'low',
      sources: [
        {
          source_id: 'src-kb-mnt-045-step-4',
          kb_id: 'KB-MNT-045',
          title: 'Precision Bearing Replacement Protocol',
          filename: 'bearing-procedure.pdf',
          document_type: 'maintenance',
          version: 'v2.3',
          section: 'Installation and Verification',
          page: 8,
          updated_at: '2026-01-08',
          source_ref: 'SOP KB-MNT-045, step 4.2 and 5.1',
          source_origin: 'uploaded',
          excerpt: 'Uploaded evidence excerpt for installation and verification.',
          relevance_score: 0.96,
          confidence_label: 'low',
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
  const {
    MaintenanceKnowledgeBasePage,
    runDocumentLifecycleAction,
    shouldClearDocumentFocusForLifecycleAction,
  } = await server.ssrLoadModule('/src/pages/maintenance/MaintenanceKnowledgeBasePage.tsx');
  const { FilterPanel } = await server.ssrLoadModule('/src/components/maintenance/FilterPanel.tsx');
  const { DocumentResultList } = await server.ssrLoadModule('/src/components/maintenance/DocumentResultList.tsx');
  const { DocumentManagementPanel, DiagnosticsBlock, isDeleteConfirmationValid } = await server.ssrLoadModule('/src/components/maintenance/DocumentManagementPanel.tsx');
  const { AssistantPanel } = await server.ssrLoadModule('/src/components/maintenance/AssistantPanel.tsx');
  const {
    getMaintenanceKbContext,
    uploadDocument,
    listDocuments,
    processDocument,
    getDocumentDiagnostics,
    archiveDocument,
    deleteDocument,
    searchMaintenanceKbDocuments,
    askMaintenanceKbAssistant,
    toMaintenanceKbSearchApiRequest,
    toMaintenanceKbChatApiRequest,
    normalizeMaintenanceKbUploadMetadata,
    formatMaintenanceKbError,
    DOCUMENT_PROCESS_TIMEOUT_MS,
    DOCUMENT_PROCESS_TIMEOUT_MESSAGE,
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
    title: '  Uploaded Bearing Procedure  ',
    document_type: 'maintenance',
    line: ' rx1-surfacing ',
    station: ' curve-generating ',
    machine: ' curve-gen-3b ',
    failure_type: ' mechanical ',
    knowledge_category: '   ',
    criticality: 'medium',
    language: 'en',
    version: ' v1 ',
    owner: '',
    effective_date: '   ',
    tags: [' bearing ', '', 'spindle'],
  });
  const manifests = await listDocuments(filters);
  const processResponse = await processDocument('doc-upload-1');
  const diagnosticsResponse = await getDocumentDiagnostics('doc-upload-1');
  await archiveDocument('doc-upload-1');
  await deleteDocument('doc-upload-1');

  assert.equal(fetchCalls[0].url, 'http://agentic-core.test/api/maintenance/kb/context');
  assert.equal(fetchCalls[1].url, 'http://agentic-core.test/api/maintenance/kb/search');
  assert.equal(fetchCalls[2].url, 'http://agentic-core.test/api/maintenance/kb/chat');
  assert.equal(fetchCalls[3].url, 'http://agentic-core.test/api/maintenance/kb/documents/upload');
  assert.match(fetchCalls[4].url, /\/api\/maintenance\/kb\/documents\?line=rx1-surfacing/);
  assert.equal(fetchCalls[5].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1/process');
  assert.equal(fetchCalls[6].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1/diagnostics');
  assert.equal(fetchCalls[7].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1/archive');
  assert.equal(fetchCalls[7].init.method, 'POST');
  assert.equal(fetchCalls[8].url, 'http://agentic-core.test/api/maintenance/kb/documents/doc-upload-1');
  assert.equal(fetchCalls[8].init.method, 'DELETE');
  assert.equal(DOCUMENT_PROCESS_TIMEOUT_MS, 240000);
  assert.equal(isDeleteConfirmationValid('DELETE'), true);
  assert.equal(isDeleteConfirmationValid('delete'), false);
  assert.equal(isDeleteConfirmationValid(''), false);
  assert.equal(shouldClearDocumentFocusForLifecycleAction('doc-upload-1', ['doc-upload-1']), true);
  assert.equal(shouldClearDocumentFocusForLifecycleAction('doc-upload-1', ['doc-other-1']), false);

  const lifecycleEvents = [];
  const lifecycleMessage = await runDocumentLifecycleAction({
    documentId: 'doc-upload-1',
    action: 'archive',
    archive: async (documentId) => lifecycleEvents.push(`archive:${documentId}`),
    remove: async (documentId) => lifecycleEvents.push(`delete:${documentId}`),
    clearDocumentStateAfterHide: (documentId) => lifecycleEvents.push(`clear:${documentId}`),
    refreshDocuments: async () => lifecycleEvents.push('refresh-documents'),
    refreshSearchContext: () => lifecycleEvents.push('refresh-search'),
  });
  assert.equal(lifecycleMessage, 'Document archived. It is hidden from AI search and the default document list.');
  assert.deepEqual(lifecycleEvents, [
    'archive:doc-upload-1',
    'clear:doc-upload-1',
    'refresh-documents',
    'refresh-search',
  ]);

  const uploadFormData = fetchCalls[3].init.body;
  const uploadMetadata = JSON.parse(uploadFormData.get('metadata'));
  assert.deepEqual(uploadMetadata, {
    title: 'Uploaded Bearing Procedure',
    document_type: 'maintenance',
    line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    failure_type: 'mechanical',
    criticality: 'medium',
    language: 'en',
    version: 'v1',
    tags: ['bearing', 'spindle'],
  });
  assert.equal(uploadFormData.get('tags'), 'bearing,spindle');
  assert.equal(uploadFormData.get('document_type'), 'maintenance');
  assert.equal(uploadFormData.has('knowledge_category'), false);
  assert.equal(uploadFormData.has('owner'), false);
  assert.equal(uploadFormData.has('effective_date'), false);
  assert.deepEqual(normalizeMaintenanceKbUploadMetadata({
    title: ' Knowledge Note ',
    document_type: 'knowledge',
    line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    criticality: 'medium',
    language: 'en',
    tags: [' safety ', ''],
  }), {
    title: 'Knowledge Note',
    document_type: 'knowledge',
    line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    criticality: 'medium',
    language: 'en',
    tags: ['safety'],
  });
  assert.equal(normalizeMaintenanceKbUploadMetadata({
    title: 'Miscellaneous Note',
    document_type: 'other',
    line: 'rx1-surfacing',
    station: 'curve-generating',
    machine: 'curve-gen-3b',
    criticality: 'medium',
    language: 'en',
  }).document_type, 'other');

  assert.deepEqual(toMaintenanceKbSearchApiRequest(filters), {
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
  assert.deepEqual(toMaintenanceKbSearchApiRequest({ ...filters, retrieval_scope: 'auto' }), {
    filters: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
      document_type: undefined,
    },
    top_k: 5,
    retrieval_scope: 'auto',
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
  assert.deepEqual(toMaintenanceKbSearchApiRequest({
    ...filters,
    retrieval_scope: 'selected_documents',
    document_ids: ['doc-upload-1'],
    document_types: ['maintenance'],
  }), {
    filters: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
      document_type: undefined,
    },
    top_k: 5,
    retrieval_scope: 'selected_documents',
    document_ids: ['doc-upload-1'],
    document_types: ['maintenance'],
    prefer_selected_documents: true,
  });
  assert.deepEqual(toMaintenanceKbChatApiRequest({
    question: 'Question',
    context: {
      ...filters,
      retrieval_scope: 'selected_documents',
      document_ids: ['doc-upload-1'],
      document_types: ['maintenance'],
      max_sources: 3,
    },
  }), {
    message: 'Question',
    context: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
      document_type: undefined,
    },
    retrieval_scope: 'selected_documents',
    document_ids: ['doc-upload-1'],
    document_types: ['maintenance'],
    prefer_selected_documents: true,
    max_sources: 3,
  });

  const selectedChatResponse = await askMaintenanceKbAssistant({
    question: '__no_evidence_selected__',
    context: {
      ...filters,
      retrieval_scope: 'selected_documents',
      document_ids: ['doc-upload-1'],
      document_types: ['maintenance'],
    },
  });
  assert.deepEqual(JSON.parse(fetchCalls.at(-1).init.body), {
    message: '__no_evidence_selected__',
    context: {
      line: 'rx1-surfacing',
      station: 'curve-generating',
      machine: 'curve-gen-3b',
      failure_type: 'mechanical',
    },
    retrieval_scope: 'selected_documents',
    document_ids: ['doc-upload-1'],
    document_types: ['maintenance'],
    prefer_selected_documents: true,
  });
  assert.equal(selectedChatResponse.retrieval_metadata?.no_evidence_reason, 'selected_document_no_evidence');

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
  assert.equal(manifests[0].status, 'ready');
  assert.equal(manifests[0].source_origin, 'uploaded');
  assert.equal(processResponse.steps.map((step) => step.step).join(','), 'ocr,chunk,index,activate');
  assert.equal(diagnosticsResponse.active, true);
  assert.equal(diagnosticsResponse.vector_count, 12);
  assert.equal(diagnosticsResponse.trace_id, 'trace-diagnostics-1');

  const ocrDiagnosticsResponse = {
    ...diagnosticsResponse,
    status: 'failed',
    manifest_status: 'failed',
    requires_ocr: true,
    last_error: 'No reliable extractable text found. OCR is required.',
    active: false,
    indexed: false,
    vector_count: 0,
    warnings: ['OCR required: scanned PDF has no reliable text layer.'],
  };
  const ocrManifest = {
    ...manifests[0],
    status: 'failed',
    requires_ocr: true,
    warnings: ['OCR required: scanned PDF has no reliable text layer.'],
  };
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__503__' }),
    /safe backend error state/,
  );
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__ocr_failed__' }),
    /We could not read the document text\./,
  );
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__chunking_failed__' }),
    /We could not prepare this document for search\./,
  );
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__indexing_failed__' }),
    /We could not build the searchable index\./,
  );
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__unsupported_file__' }),
    /This file type is not supported yet\./,
  );
  await assert.rejects(
    () => searchMaintenanceKbDocuments({ ...filters, query: '__structured_detail__' }),
    (error) => {
      assert.match(error.message, /Document metadata is missing a machine\./);
      assert.doesNotMatch(error.message, /\[object Object\]/);
      return true;
    },
  );
  await assert.rejects(
    () => processDocument('doc-upload-400'),
    (error) => {
      assert.match(error.message, /We could not read the document text\./);
      assert.doesNotMatch(error.message, /\[object Object\]/);
      return true;
    },
  );
  await assert.rejects(
    () => processDocument('doc-indexing-400'),
    (error) => {
      assert.match(error.message, /We could not build the searchable index\./);
      assert.doesNotMatch(error.message, /\[object Object\]/);
      return true;
    },
  );
  const originalSetTimeout = globalThis.setTimeout;
  const timeoutDelays = [];
  globalThis.setTimeout = (callback, delay, ...args) => {
    timeoutDelays.push(delay);
    return originalSetTimeout(callback, delay === DOCUMENT_PROCESS_TIMEOUT_MS ? 0 : delay, ...args);
  };
  try {
    await assert.rejects(
      () => processDocument('doc-timeout'),
      (error) => {
        assert.equal(error.message, DOCUMENT_PROCESS_TIMEOUT_MESSAGE);
        assert.doesNotMatch(error.message, /Maintenance KB backend request timed out/);
        return true;
      },
    );
    assert.deepEqual(timeoutDelays, [DOCUMENT_PROCESS_TIMEOUT_MS]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
  assert.equal(formatMaintenanceKbError({ detail: { message: 'Readable detail message.' } }), 'Readable detail message.');
  assert.equal(formatMaintenanceKbError({ error: { message: 'Readable error message.' } }), 'Readable error message.');
  assert.equal(formatMaintenanceKbError({ message: 'Readable top-level message.' }), 'Readable top-level message.');
  assert.equal(formatMaintenanceKbError({ stage: 'chunking', error_code: 'CHUNKING_FAILED', message: 'Chunker failed.' }), 'We could not prepare this document for search.');
  assert.equal(formatMaintenanceKbError({ stage: 'unsupported_file', message: 'MIME type rejected.' }), 'This file type is not supported yet.');
  assert.notEqual(formatMaintenanceKbError({ detail: { field: 'machine' } }), '[object Object]');

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
  assert.doesNotMatch(documentsHtml, /98%/);
  assert.doesNotMatch(documentsHtml, /match/);
  assert.match(documentsHtml, /Uploaded KB/);

  const focusedDocumentsHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: searchResponse.items,
    isLoading: false,
    error: null,
    selectedDocuments: [manifests[0]],
  }));
  assert.match(focusedDocumentsHtml, /AI search is focusing on Uploaded Bearing Procedure/);

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
  assert.match(assistantHtml, /Maintenance Document/);
  assert.match(assistantHtml, /bearing-procedure\.pdf/);
  assert.match(assistantHtml, /Page 8/);
  assert.match(assistantHtml, /Installation and Verification/);
  assert.match(assistantHtml, /96% score/);
  assert.match(assistantHtml, /low confidence/);
  assert.match(assistantHtml, /Uploaded evidence excerpt/);
  assert.match(assistantHtml, /Uploaded KB/);
  assert.match(assistantHtml, /Safety \/ Evidence Controls/);
  assert.match(assistantHtml, /Restricted guidance/);
  assert.doesNotMatch(assistantHtml, /Trace:/);
  assert.doesNotMatch(assistantHtml, /trace-chat-1/);
  assert.doesNotMatch(assistantHtml, /SOP KB-MNT-045, step 4\.2 and 5\.1/);
  assert.match(assistantHtml, /Spindle bearing noise/);
  assert.match(assistantHtml, /Similar spindle noise/);
  assert.match(assistantHtml, /This answer has limited supporting evidence\. Please verify with the original document\./);

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
  assert.match(noEvidenceHtml, /Not enough indexed knowledge was found\./);

  const selectedNoEvidenceHtml = renderToStaticMarkup(React.createElement(AssistantPanel, {
    context,
    filters,
    response: selectedChatResponse,
    question: 'Unknown selected document issue',
    isLoading: false,
    error: null,
    relatedHistory: [],
    selectedDocuments: [manifests[0]],
    onQuestionChange: () => {},
    onSendQuestion: () => {},
    onSelectQuestion: () => {},
  }));
  assert.match(selectedNoEvidenceHtml, /Focusing on Uploaded Bearing Procedure/);
  assert.match(selectedNoEvidenceHtml, /No reliable evidence was found in the selected document\./);

  const managementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: [
      manifests[0],
      { ...manifests[0], document_id: 'doc-knowledge-1', title: 'Knowledge Note', document_type: 'knowledge' },
      { ...manifests[0], document_id: 'doc-other-1', title: 'Other Note', document_type: 'other' },
    ],
    diagnostics: diagnosticsResponse,
    ingestResult: processResponse,
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
    selectedDocumentIds: ['doc-upload-1'],
    onClearSelectedDocuments: () => {},
  }));
  assert.match(managementHtml, /Upload Document/);
  assert.match(managementHtml, /Document Status/);
  assert.match(managementHtml, /Maintenance Document/);
  assert.match(managementHtml, /Knowledge Document/);
  assert.match(managementHtml, /Other Document/);
  assert.match(managementHtml, /Uploaded Bearing Procedure/);
  assert.match(managementHtml, /AI is focusing on Uploaded Bearing Procedure/);
  assert.match(managementHtml, /Clear Focus/);
  assert.match(managementHtml, /Focused/);
  assert.match(managementHtml, /Processing Status/);
  assert.match(managementHtml, /Parsed/);
  assert.match(managementHtml, /Process Document/);
  assert.match(managementHtml, /aria-label="Details"/);
  assert.match(managementHtml, /title="Details"/);
  assert.match(managementHtml, /aria-label="Archive"/);
  assert.match(managementHtml, /title="Archive"/);
  assert.match(managementHtml, /aria-label="Delete"/);
  assert.match(managementHtml, /title="Delete"/);
  assert.match(managementHtml, /Ready for AI Search/);
  assert.doesNotMatch(managementHtml, /trace-diagnostics-1/);
  assert.doesNotMatch(managementHtml, /indexing_metadata/);
  assert.doesNotMatch(managementHtml, /vector_count/);
  assert.doesNotMatch(managementHtml, /test-embedding/);

  const ocrManagementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: [ocrManifest],
    diagnostics: ocrDiagnosticsResponse,
    ingestResult: null,
    uploadResult: null,
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
  assert.match(ocrManagementHtml, /OCR Required/);
  assert.match(ocrManagementHtml, /Processing Failed/);
  assert.match(ocrManagementHtml, /No reliable text layer found\. OCR is required before this document can be indexed\./);
  assert.match(ocrManagementHtml, /Processing is disabled until OCR creates a reliable text layer/);
  assert.match(ocrManagementHtml, /We could not read the document text\./);

  const normalizedSuccessManagementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: [{
      ...ocrManifest,
      final_status: 'indexed',
      processing_status: 'failed',
      retrieval_status: 'indexed',
      chunk_status: 'chunked',
      embedding_status: 'indexed',
      ocr_status: 'skipped',
      warnings: ['OCR required: scanned PDF has no reliable text layer.', 'retry required after OCR'],
    }],
    diagnostics: {
      ...ocrDiagnosticsResponse,
      final_status: 'indexed',
      processing_status: 'failed',
      retrieval_status: 'indexed',
      chunk_status: 'chunked',
      embedding_status: 'indexed',
      ocr_status: 'skipped',
      indexed: true,
      active: true,
      warnings: ['OCR required: scanned PDF has no reliable text layer.', 'retry required after OCR'],
    },
    ingestResult: null,
    uploadResult: null,
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
  assert.match(normalizedSuccessManagementHtml, /Ready for AI Search/);
  assert.doesNotMatch(normalizedSuccessManagementHtml, /OCR Required/);
  assert.doesNotMatch(normalizedSuccessManagementHtml, /Processing Failed/);
  assert.doesNotMatch(normalizedSuccessManagementHtml, /We could not read the document text\./);
  assert.doesNotMatch(normalizedSuccessManagementHtml, /retry required/);

  const indexedDiagnosticsHtml = renderToStaticMarkup(React.createElement(DiagnosticsBlock, {
    title: 'Uploaded Bearing Procedure',
    filename: 'bearing-procedure.pdf',
    diagnostics: {
      ...diagnosticsResponse,
      final_status: 'indexed',
      processing_status: 'failed',
      retrieval_status: 'indexed',
      chunk_status: 'chunked',
      embedding_status: 'indexed',
      parsed_exists: true,
      chunks_exists: false,
      indexed: false,
      active: false,
      warnings: ['-', '', null, 'OCR required: scanned PDF has no reliable text layer.', 'transient processing warning'],
    },
  }));
  assert.match(indexedDiagnosticsHtml, /Ready for AI Search/);
  assert.match(indexedDiagnosticsHtml, /Read document[\s\S]*?completed/);
  assert.match(indexedDiagnosticsHtml, /Prepare knowledge[\s\S]*?completed/);
  assert.match(indexedDiagnosticsHtml, /Build search index[\s\S]*?completed/);
  assert.match(indexedDiagnosticsHtml, /Ready to ask[\s\S]*?completed/);
  assert.doesNotMatch(indexedDiagnosticsHtml, /Warnings/);
  assert.doesNotMatch(indexedDiagnosticsHtml, /Processing Failed/);
  assert.doesNotMatch(indexedDiagnosticsHtml, /OCR Required/);
  assert.doesNotMatch(indexedDiagnosticsHtml, /Ready for AI Search[\s\S]{0,160}>no</);
  assert.doesNotMatch(indexedDiagnosticsHtml, /Ready for Indexing[\s\S]{0,160}>no</);

  const processErrorManagementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: [manifests[0]],
    diagnostics: null,
    ingestResult: null,
    uploadResult: null,
    isLoadingDocuments: false,
    isUploading: false,
    isIngesting: false,
    isLoadingDiagnostics: false,
    documentError: null,
    uploadError: null,
    ingestError: 'Maintenance KB backend request failed (400 Bad Request): We could not read the document text.',
    diagnosticsError: null,
    onUpload: async () => {},
    onIngest: async () => {},
    onDiagnostics: async () => {},
    onRefresh: async () => {},
    onSearchFiltersChange: () => {},
    searchFilters: filters,
  }));
  assert.match(processErrorManagementHtml, /We could not read the document text\./);
  assert.doesNotMatch(processErrorManagementHtml, /\[object Object\]/);

  const processingManagementHtml = renderToStaticMarkup(React.createElement(DocumentManagementPanel, {
    documents: [manifests[0]],
    diagnostics: null,
    ingestResult: null,
    uploadResult: null,
    isLoadingDocuments: false,
    isUploading: false,
    isIngesting: true,
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
  assert.match(processingManagementHtml, /Processing document\. This may take a few minutes for scanned PDFs\./);
  assert.match(processingManagementHtml, /<button[^>]*disabled=""[^>]*>[\s\S]*Process Document/);
  assert.doesNotMatch(processingManagementHtml, /Maintenance KB backend request timed out/);

  const ocrAssistantHtml = renderToStaticMarkup(React.createElement(AssistantPanel, {
    context,
    filters,
    response: null,
    question: 'Can I search this document?',
    isLoading: false,
    error: null,
    relatedHistory: [],
    selectedDocumentRequiresOcr: true,
    onQuestionChange: () => {},
    onSendQuestion: () => {},
    onSelectQuestion: () => {},
  }));
  assert.match(ocrAssistantHtml, /Selected document is not searchable yet because OCR is required/);

  const ocrSearchHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: [{ ...searchResponse.items[0], requires_ocr: true }],
    isLoading: false,
    error: null,
    selectedDocumentRequiresOcr: true,
  }));
  assert.match(ocrSearchHtml, /Selected document is not searchable yet because OCR is required/);
  assert.match(ocrSearchHtml, /OCR Required/);

  const normalizedSuccessSearchHtml = renderToStaticMarkup(React.createElement(DocumentResultList, {
    documents: [{
      ...searchResponse.items[0],
      requires_ocr: true,
      final_status: 'indexed',
      processing_status: 'failed',
      retrieval_status: 'indexed',
      chunk_status: 'chunked',
      embedding_status: 'indexed',
      ocr_status: 'completed',
    }],
    isLoading: false,
    error: null,
    selectedDocumentRequiresOcr: false,
  }));
  assert.match(normalizedSuccessSearchHtml, /Ready for AI Search/);
  assert.doesNotMatch(normalizedSuccessSearchHtml, /OCR Required/);
  assert.doesNotMatch(normalizedSuccessSearchHtml, /Processing Failed/);
  assert.doesNotMatch(normalizedSuccessSearchHtml, /Selected document is not searchable yet because OCR is required/);

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

function jsonError(body) {
  return new Response(JSON.stringify(body), {
    status: 400,
    statusText: 'Bad Request',
    headers: { 'Content-Type': 'application/json' },
  });
}
