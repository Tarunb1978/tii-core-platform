# Diagnostic Plan: ApexCharts offsetY Error

## Problem Statement
The error "Cannot read properties of undefined (reading 'offsetY')" occurs on IdeaDetailsPage but not on yahoo-finance-chart page.

## Hypothesis
The error is likely in the **tooltip configuration** where ApexCharts tries to access `event.offsetY` but the event object is undefined when the formatter is called during chart initialization or tooltip rendering.

## Enhanced Diagnostic Logging Added

### 1. Tooltip Y Formatter (Line 115-132)
```typescript
formatter: (value: number, opts?: any) => {
  console.log('[DIAGNOSTIC] Tooltip Y formatter called:', {
    value,
    hasOpts: !!opts,
    optsKeys: opts ? Object.keys(opts) : 'null',
    hasEvent: !!opts?.event,
    hasOffsetY: opts?.event?.offsetY !== undefined,  // KEY CHECK
    offsetY: opts?.event?.offsetY,                  // KEY CHECK
    ...
  });
}
```
**Purpose**: Identify if `opts.event.offsetY` is undefined when formatter is called.

### 2. Custom Tooltip Callback (Line 135-146)
```typescript
custom: (opt: any) => {
  console.log('[DIAGNOSTIC] Custom tooltip callback:', {
    cursorOffsetY: opt.w?.cursorOffsetY,  // Alternative offsetY source
    chartY: opt.w?.chartY,
    ...
  });
}
```
**Purpose**: Capture alternative positioning properties from ApexCharts context.

### 3. Chart Events (Line 171-191)
```typescript
events: {
  mounted: (chartContext, config) => { ... },
  init: (chartContext, config) => { ... },
  rendered: () => { ... }
}
```
**Purpose**: Track chart lifecycle to see when DOM is ready vs when error occurs.

### 4. Chart Options Creation (Line 40-47)
```typescript
const getChartOptions = (...) => {
  console.log('[DIAGNOSTIC] Creating chart options:', {
    hasChartData: !!chartData,
    dataLength: chartData?.series?.length,
    ...
  });
  return { ... };
};
```
**Purpose**: Verify data is available when chart options are created.

## Expected Log Sequence

When the error occurs, you should see:
```
[DIAGNOSTIC] showChart set to true
[DIAGNOSTIC] YahooFinanceChart mounting, symbol: RELIANCE.NS
[DIAGNOSTIC] isMounted set to true
[DIAGNOSTIC] Creating chart options: { hasChartData: true, dataLength: 250, ... }
[CHART DEBUG] Attempting to render Chart: { ... }
[DIAGNOSTIC] ApexCharts init event
[DIAGNOSTIC] ApexCharts mounted event
[DIAGNOSTIC] Tooltip Y formatter called: { hasEvent: ?, hasOffsetY: ?, offsetY: ? }
[Cannot read properties of undefined (reading 'offsetY')]  ← ERROR HERE
```

## Key Questions to Answer

1. **Does the error occur before or after "[DIAGNOSTIC] ApexCharts mounted event"?**
   - If before: Chart initialization issue
   - If after: Tooltip/event handler issue

2. **Does "[DIAGNOSTIC] Tooltip Y formatter called" appear in logs?**
   - If yes: Check `hasOffsetY: false` and `offsetY: undefined`
   - If no: Error occurs before formatter is called (initialization issue)

3. **What is the value of `opts?.event?.offsetY`?**
   - If undefined: This confirms the bug
   - If number: Error is elsewhere

## Next Action
Navigate to IdeaDetailsPage and check browser console for the diagnostic logs. Look specifically for the tooltip formatter logs and whether `offsetY` is undefined.
