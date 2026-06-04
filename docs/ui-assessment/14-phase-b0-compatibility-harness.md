# Phase B0.5 Compatibility Harness

## Purpose

Phase B0.5 adds test-only coverage for the maintenance workorders pilot surface. The harness proves that the current workorder agent payload can move through the widget registry chain without page integration:

payload -> adaptWorkorderAgentPayloadToWidgets -> validate widgets -> renderUiWidgetList

No runtime route, page, backend, API contract, write-back action, or dependency change is introduced.

## Covered Payload Shapes

- Full workorder payload with summary, KPI cards, recommendations, insights, evidence, sources, citations, read-only actions, filters, workorder rows, and chart data.
- Minimal workorder payload with summary and otherwise empty collections.
- Error payload that must prefer an operator-safe error_state.
- Unsupported action payload with a mix of allowed read-only targets and dropped write-back or unknown targets.
- Malformed payload with invalid field shapes that must still adapt into safe renderable widgets.
- HTML/script-like payload content used as a security regression fixture.

## Compatibility Chain

The test adapts each fixture with `adaptWorkorderAgentPayloadToWidgets`, validates every emitted widget against `maintenanceWorkordersSurface`, and renders the resulting list with `renderUiWidgetList`.

The harness also checks that emitted widgets stay within the `maintenance.workorders` regions and use only widget types supported by the surface definition.

## Safety Guarantees

- Valid adapted widgets render without unsupported or invalid fallback output.
- Error payloads render as `error_state` with `role="alert"`.
- Unsupported action targets are dropped before rendering.
- Read-only action callbacks are available only for allowed action targets.
- Script-like strings are escaped as text by React static rendering.
- Registry renderer source and the compatibility test stay free of raw HTML or dynamic-code primitives.

## Remaining Gap Before Page Integration

The harness does not connect widgets to `MaintenanceWorkorderTrackingPage.tsx`, routing, sidebar state, backend calls, or operator write-back actions. It proves compatibility only at the registry boundary and renderer boundary.

Before page integration, the UI should still define where registry widgets mount, how local read-only preview callbacks interact with existing page state, and how fallback/error states appear in the real workorder layout.

## Recommended B0.6/B1 Path

- B0.6: add a test-only page-level adapter contract or view-model boundary without changing runtime behavior.
- B0.6: define read-only callback handling for preview, filter, and copilot-context targets.
- B1: integrate the registry renderer behind a guarded pilot path or feature flag after page-level compatibility tests exist.
- B1: keep write-back actions out of the registry flow until explicit action contracts and operator confirmation paths are implemented.
