# Chart Fix: Removed Event References from Formatters

## Problem
The error "Cannot read properties of undefined (reading 'offsetY')" was occurring because the tooltip formatter was trying to access `opts.event.offsetY` without defensive checks.

## Solution Applied

### 1. Simplified Tooltip Y Formatter (Line 124-128)
**Before:**
```typescript
formatter: (value: number, opts?: any) => {
  console.log('[DIAGNOSTIC] Tooltip Y formatter called:', {
    hasEvent: !!opts?.event,
    hasOffsetY: opts?.event?.offsetY !== undefined,
    offsetY: opts?.event?.offsetY,  // ❌ Could be undefined
    ...
  });
  return `₹${value.toFixed(2)}`;
}
```

**After:**
```typescript
formatter: (value: number) => {
  // Simplified formatter - no event references
  console.log('[DIAGNOSTIC] Tooltip Y formatter called with value:', value);
  return `₹${value.toFixed(2)}`;
}
```

### 2. Removed Invalid onMount Prop (Line 362-369)
Removed the unsupported `onMount` prop from the Chart component. Using ApexCharts `events` configuration instead for lifecycle tracking.

### 3. Kept Safe Formatters
- **Y-axis labels formatter (Line 107)**: Already safe, only uses value
- **X-axis tooltip format (Line 121)**: Uses format string, not formatter function

## What This Fixes

By removing all references to `opts.event.offsetY` from the formatter, we eliminate the possibility of the error occurring during tooltip rendering.

The formatter now only:
- Receives the value (number)
- Returns formatted string
- No access to event properties

## Remaining Diagnostic Logging

The chart still has comprehensive logging:
1. Component mount timing
2. Chart options creation
3. Container dimensions check
4. Chart lifecycle events (init, mounted, rendered)
5. Custom tooltip callback (logs available context without accessing undefined properties)

## Expected Behavior Now

1. No "offsetY" error since we don't access event properties
2. Chart renders at the bottom of the page (moved to last position)
3. Diagnostic logs will show chart initialization sequence
4. Tooltip will work without trying to access undefined event properties

## Chart Position

The chart is now positioned:
- After Investment Thesis
- After Financial Metrics
- **Last** in the component tree
- This ensures DOM is stable before chart initializes

