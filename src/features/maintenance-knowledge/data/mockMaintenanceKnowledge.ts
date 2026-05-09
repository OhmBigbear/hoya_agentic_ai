import type {
  ChatMessage,
  HistoricalMaintenanceRecord,
  LessonLearned,
  MachineManual,
  MaintenanceProcedure,
} from '../types';

export const sampleChatMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'user',
    content: 'How do I repair spindle bearing failure on CURVE-GEN-3B?',
    timestamp: '11:24',
  },
  {
    id: 2,
    role: 'assistant',
    content: `Based on the machine manual and historical maintenance records, here's the recommended procedure for spindle bearing replacement on CURVE-GEN-3B:

**Standard Procedure: KB-MNT-045 - Precision Bearing Replacement**

**Prerequisites:**
• Machine must be in lockout/tagout state
• Temperature must be below 40°C
• Required tools: Bearing puller set, Torque wrench, Dial indicator

**Step-by-step procedure:**

1. **Preparation (15 min)**
   - Perform lockout/tagout procedure
   - Allow spindle to cool completely
   - Prepare clean workspace

2. **Disassembly (30 min)**
   - Remove spindle cover and guards
   - Disconnect cooling lines
   - Mark bearing orientation for reassembly
   
3. **Bearing Removal (20 min)**
   ⚠️ **CAUTION:** Do not damage spindle shaft surface
   - Use appropriate bearing puller
   - Apply even pressure during extraction
   - Inspect shaft for scoring or damage

4. **Installation (25 min)**
   - Clean mounting surface thoroughly
   - Heat new bearing to 80°C (no higher)
   - Install with proper alignment tools
   - Verify fit with dial indicator (tolerance: ±0.005mm)

5. **Testing & Verification (20 min)**
   - Reconnect all systems
   - Run spindle at low speed (500 RPM)
   - Check vibration levels
   - Gradually increase to operational speed
   - Final vibration check at 2,100 RPM

**Expected completion time:** 110 minutes
**Parts required:** Bearing assembly (PN: BRG-2145-A)

**Historical context:** This failure occurred 3 times in the past 60 days. Root cause analysis suggests excessive vibration. Recommend scheduling vibration analysis after repair.`,
    timestamp: '11:25',
    sources: [
      { type: 'Manual', title: 'CURVE-GEN-3B Service Manual', section: 'Ch. 7.2' },
      { type: 'SOP', title: 'KB-MNT-045: Bearing Replacement', version: 'v2.3' },
      { type: 'History', title: 'MWO-2401-032 Repair Log', date: '2026-01-10' },
    ],
    confidence: 95,
  },
  {
    id: 3,
    role: 'user',
    content: 'Are there any safety warnings I should know about?',
    timestamp: '11:26',
  },
  {
    id: 4,
    role: 'assistant',
    content: `**Critical Safety Warnings for Spindle Bearing Work:**

⚠️ **High Priority Warnings:**

1. **Lockout/Tagout Required**
   - All energy sources must be isolated
   - Verify zero energy state before work
   - Only authorized personnel may remove locks

2. **Thermal Hazard**
   - Spindle may remain hot for 2+ hours after shutdown
   - Wait for temperature below 40°C
   - Use heat-resistant gloves during bearing heating

3. **Rotating Equipment**
   - Never attempt adjustment while spindle is rotating
   - Ensure all guards are reinstalled before testing
   - Maintain safe distance during test run

4. **Precision Components**
   - Bearing damage from improper handling is costly ($4,500+)
   - Always use proper tools - never improvise
   - Follow torque specifications exactly (45 N⋅m ± 2 N⋅m)

5. **Contamination Control**
   - Keep work area clean - debris can cause immediate failure
   - Use only approved lubricants
   - Wear lint-free gloves

**From:** CURVE-GEN-3B Safety Manual, Section 4 (Last updated: 2025-11)`,
    timestamp: '11:26',
    sources: [
      { type: 'Manual', title: 'CURVE-GEN-3B Safety Manual', section: 'Section 4' },
    ],
    confidence: 98,
  },
];

export const machineManuals: MachineManual[] = [
  { id: 1, title: 'CURVE-GEN-3B Service Manual', version: 'v4.2', updated: '2025-11-15', pages: 248, category: 'Service Manual' },
  { id: 2, title: 'CURVE-GEN-3B Safety Guidelines', version: 'v3.1', updated: '2025-11-10', pages: 42, category: 'Safety' },
  { id: 3, title: 'POLISHING-7A Complete Manual', version: 'v5.0', updated: '2025-10-22', pages: 312, category: 'Service Manual' },
  { id: 4, title: 'LASER-ENGR-2C Operator Guide', version: 'v2.8', updated: '2025-09-18', pages: 156, category: 'Operation' },
];

export const maintenanceProcedures: MaintenanceProcedure[] = [
  { id: 1, code: 'KB-MNT-045', title: 'Precision Bearing Replacement Protocol', version: 'v2.3', updated: '2026-01-08', relevance: 98 },
  { id: 2, code: 'KB-MNT-012', title: 'Spindle Alignment Procedure', version: 'v1.9', updated: '2025-12-15', relevance: 85 },
  { id: 3, code: 'KB-MNT-078', title: 'Vibration Analysis & Diagnosis', version: 'v3.1', updated: '2025-12-01', relevance: 72 },
  { id: 4, code: 'KB-MNT-156', title: 'Hydraulic System Troubleshooting', version: 'v2.0', updated: '2025-11-20', relevance: 45 },
];

export const historicalRecords: HistoricalMaintenanceRecord[] = [
  { id: 1, jobId: 'MWO-2401-032', machine: 'CURVE-GEN-3B', issue: 'Spindle bearing noise', date: '2026-01-10', technician: 'Lee Min-ho', duration: '3h 20m' },
  { id: 2, jobId: 'MWO-2401-018', machine: 'CURVE-GEN-3B', issue: 'Scheduled PM', date: '2026-01-05', technician: 'Choi Da-eun', duration: '1h 50m' },
  { id: 3, jobId: 'MWO-2312-145', machine: 'CURVE-GEN-3B', issue: 'Control panel error', date: '2025-12-28', technician: 'Park Seo-jun', duration: '2h 10m' },
];

export const lessonsLearned: LessonLearned[] = [
  { id: 1, title: 'Spindle Bearing Failure Root Cause', date: '2026-01-11', author: 'Lee Min-ho', category: 'Mechanical', summary: 'Recurring bearing failures traced to excessive vibration from misaligned motor mount.' },
  { id: 2, title: 'Thermal Management Best Practice', date: '2025-12-20', author: 'Kim Ji-won', category: 'Best Practice', summary: 'Allow minimum 2 hours cooling time before bearing work to prevent thermal stress.' },
  { id: 3, title: 'Contamination Prevention Protocol', date: '2025-11-15', author: 'Park Seo-jun', category: 'Prevention', summary: 'Use dedicated clean room procedures for bearing installation to reduce early failures.' },
];
