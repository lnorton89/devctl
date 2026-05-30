# Phase 3 Discussion Log

**Date:** 2026-05-30
**Participants:** User, Claude

## Areas Discussed

### 1. Port + Health Check Approach

**Options presented:**
- Pre-start port occupancy: block with error vs warn and proceed
- Post-start checks: running only vs also during starting
- Timeout: 2s vs 5s

**Selected:**
- Block with error if port is occupied before start
- Post-start checks run while process is `running` (not during `starting`)
- 2s timeout for both TCP port and HTTP health checks

### 2. Unhealthy State Design

**Options presented:**
- Real enum variant vs display-only flag on `running`

**Selected:**
- Real variant in `processStateSchema`
- Auto-recovers back to `running` when checks pass
- Pulse animation, `error` color, `filled` variant

### 3. UI Placement of Port/Health Info

**Options presented:**
- Tooltip on Status chip vs Dedicated column vs Expanded log area

**Selected:**
- Dedicated "Port" column in desktop table
- Metadata row in mobile list
- Column collapses if no port is configured on any project
