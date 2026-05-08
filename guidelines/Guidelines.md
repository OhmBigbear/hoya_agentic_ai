# Hoya Agentic AI – UI Design Guide

## 1. Project Overview
Hoya Agentic AI is an industrial AI system for manufacturing operations.
The system supports executives, production engineers, maintenance engineers, and administrators.

Primary goals:
- Real-time visibility of production, maintenance, and quality KPIs
- AI-assisted analysis (Agentic AI)
- Role-based dashboards and reports
- Human-in-the-loop decision support

This UI is NOT a consumer app.
Design must feel:
- Industrial
- Professional
- Data-driven
- Calm and trustworthy

## 2. Global Layout Structure

### 2.1 Main Layout
All authenticated pages use a **3-zone layout**:

1. Left Sidebar (Primary Navigation)
2. Top Header (Context & User)
3. Main Content Area

Do NOT redesign layout per page.
Pages must feel consistent across the system.

## 3. Left Sidebar (Primary Navigation)

Menu labels and grouping are structural definitions.
Visual style, icons, and ordering may evolve during design iterations.

Sidebar behavior:
- Fixed
- Collapsible (icon-only mode supported)
- Grouped by functional domain

### Menu Groups and Items

**Overview**
- Overview Dashboard

**Production**
- Production Performance
- Workorder Tracking
- Station Analysis
- Shift / Operator Analysis
- Scrap Analysis

**Maintenance**
- Maintenance Analysis
- Station Maintenance Tracking
- Station Maintenance Analysis
- Maintenance Knowledge Base

**Reports**
- Production Performance Report
- Workorder Performance Report
- Maintenance Performance Report

**Engineering**
- Engineering Sandbox

**Administration (Admin only)**
- System Configuration
- Agents Configuration
- Production Flow Configuration
- Agents Debug Log

## 4. Top Header

Top header must always show:

Left:
- Project Name: "Hoya Agentic AI"
- Current Plant / Line (dropdown placeholder)

Right:
- Notification icon (alerts, AI insights)
- User avatar
- User name
- User role (e.g. Engineer, Maintenance, Admin)
- Account menu (Profile, Sign out)

Header is informational, not crowded.

## 5. Design Language

Style:
- Clean industrial UI
- Neutral colors (gray, dark blue, white)
- Avoid playful gradients or illustrations

Typography:
- Clear hierarchy
- Numeric data must be easy to scan

Components:
- Cards for KPI
- Tables for operational data
- Charts only when they add insight
- Icons are functional, not decorative

## 6. Role-Based Awareness

The same page may behave differently by role:
- Executive: summary, trends, comparisons
- Engineer: drill-down, parameters, root cause
- Maintenance: faults, downtime, recommendations
- Admin: configuration and governance

Do NOT mix admin configuration with operational screens.

## 7. Page Creation Rules for Early Phase

For initial mockups:
- Create light mockups, not final visuals
- Focus on layout, structure, and information hierarchy
- Use placeholder data
- Avoid deep workflows at this stage

## 8. Out of Scope for UI Design Phase 1

- Final visual branding
- Exact KPI formulas
- Production data validation logic
- Approval workflows

These will be addressed in later design and implementation phases.

