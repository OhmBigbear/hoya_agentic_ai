import React from 'react';

import type { UiValidationIssue } from './types';

export type UiWidgetFallbackMode = 'compact' | 'verbose';

interface WidgetFallbackProps {
  fallbackMode?: UiWidgetFallbackMode;
}

interface UnsupportedWidgetFallbackProps extends WidgetFallbackProps {
  widgetType?: string;
}

interface InvalidWidgetFallbackProps extends WidgetFallbackProps {
  title?: string;
  messages?: UiValidationIssue[];
}

interface EmptyWidgetFallbackProps extends WidgetFallbackProps {
  title?: string;
  message?: string;
}

interface WidgetValidationMessagesProps {
  messages?: UiValidationIssue[];
}

export function UnsupportedWidgetFallback({
  fallbackMode = 'compact',
  widgetType,
}: UnsupportedWidgetFallbackProps): React.ReactElement {
  return (
    <section aria-label="Unsupported widget" role="status">
      <h3>Unsupported widget</h3>
      <p>This widget cannot be displayed safely.</p>
      {fallbackMode === 'verbose' && widgetType ? (
        <p>Widget type: {widgetType}</p>
      ) : null}
    </section>
  );
}

export function InvalidWidgetFallback({
  fallbackMode = 'compact',
  title = 'Invalid widget',
  messages,
}: InvalidWidgetFallbackProps): React.ReactElement {
  return (
    <section aria-label={title} role="status">
      <h3>{title}</h3>
      <p>This widget could not be displayed.</p>
      {fallbackMode === 'verbose' ? (
        <WidgetValidationMessages messages={messages} />
      ) : null}
    </section>
  );
}

export function EmptyWidgetFallback({
  title = 'No widget data',
  message = 'There is no widget data to display.',
}: EmptyWidgetFallbackProps): React.ReactElement {
  return (
    <section aria-label={title} role="status">
      <h3>{title}</h3>
      <p>{message}</p>
    </section>
  );
}

export function WidgetValidationMessages({
  messages = [],
}: WidgetValidationMessagesProps): React.ReactElement | null {
  if (messages.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Widget validation messages">
      {messages.map((message, index) => (
        <li key={`${message.code}-${message.path ?? 'root'}-${index}`}>
          <strong>{message.code}</strong>
          {message.path ? <span> at {message.path}</span> : null}
          <span>: {message.message}</span>
        </li>
      ))}
    </ul>
  );
}
