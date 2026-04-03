# Best Practices

## Use `<AgentAction>` when wrapping a visible element

The component pattern is for actions that have a single, visible UI element to spotlight:

```tsx
// Good — wraps the actual button
<AgentAction name="push_changes" description="Push pending changes">
  <PushButton />
</AgentAction>

// Bad — wraps nothing visible, renders a pointless display:contents div
<AgentAction name="sync_data" description="Sync data"
  onExecute={handleSync} />
```

## Wrap conditionally rendered elements with `<AgentAction>` on the outside

`<AgentAction>` always registers the action regardless of whether its children are rendered. Keep the wrapper always-rendered and put the condition inside — `onExecute` works even when there's nothing visible to spotlight:

```tsx
// Bad — conditionally rendering the AgentAction itself, action disappears when button is hidden
{selectedIds.size > 0 && (
  <AgentAction name="grant_access" description="Grant access" onExecute={() => handleGrant()}>
    <Button onClick={handleGrant}>Grant Access ({selectedIds.size})</Button>
  </AgentAction>
)}

// Good — AgentAction always registered, button conditionally rendered inside
<AgentAction name="grant_access" description="Grant access" onExecute={() => handleGrant()}>
  {selectedIds.size > 0 && (
    <Button onClick={handleGrant}>Grant Access ({selectedIds.size})</Button>
  )}
</AgentAction>
```

## Use `useAgentAction` hook for per-row and programmatic actions

When N rows each have their own button (sync, edit, navigate), you can't wrap each with `<AgentAction>` — same name would register N times, each overwriting the last. Use the hook + `<AgentTarget>` on each row's element:

```tsx
// Hook registers the action once
useAgentAction({
  name: 'sync_property',
  description: 'Sync a property',
  parameters: z.object({ property_id: z.number() }),
  onExecute: (p) => handleSync(p.property_id),
  steps: [{ label: 'Click Sync', fromParam: 'property_id' }],
});

// AgentTarget on each row's button (in a column renderer)
<AgentTarget action="sync_property" param="property_id" value={String(propertyId)}>
  <SyncButton />
</AgentTarget>
```

The hook also accepts an array to batch-register multiple actions in one call:

```tsx
useAgentAction([
  { name: 'navigate_to_property', ... },
  { name: 'sync_property', ... },
  { name: 'edit_markup', ... },
]);
```

## Never nest `AgentTarget` inside Radix `asChild` components

Radix primitives (`PopoverTrigger`, `DialogTrigger`, `TooltipTrigger`) with `asChild` need their direct child to forward refs. `AgentTarget` inserts a `<div style="display:contents">` wrapper that breaks this:

```tsx
// Bad — breaks ref forwarding, trigger won't work
<PopoverTrigger asChild>
  <AgentTarget name="my-btn">
    <Button>Open</Button>
  </AgentTarget>
</PopoverTrigger>

// Good — wrap outside the Popover entirely
<AgentTarget name="my-btn">
  <Popover>
    <PopoverTrigger asChild>
      <Button>Open</Button>
    </PopoverTrigger>
    <PopoverContent>...</PopoverContent>
  </Popover>
</AgentTarget>
```

Since `Popover.Root` renders no DOM element, `AgentTarget`'s `firstElementChild` resolves to the Button directly.

## Use shared targets for elements used by multiple actions

When two actions need the same trigger (e.g. both open the same overflow menu), omit the `action` prop to make a shared target:

```tsx
// Shared target — any action can resolve it by name
<AgentTarget name="overflow-menu-btn">
  <OverflowMenuPopover>
    <AgentTarget name="export-btn">
      <ExportButton />
    </AgentTarget>
    <AgentTarget name="freeze-btn">
      <FreezeButton />
    </AgentTarget>
  </OverflowMenuPopover>
</AgentTarget>

// Both actions find the same trigger
useAgentAction([
  { name: 'export_csv', steps: [
    { label: 'Open menu', fromTarget: 'overflow-menu-btn' },
    { label: 'Click Export', fromTarget: 'export-btn' },
  ]},
  { name: 'toggle_freeze', steps: [
    { label: 'Open menu', fromTarget: 'overflow-menu-btn' },
    { label: 'Click Freeze', fromTarget: 'freeze-btn' },
  ]},
]);
```

## Multi-step is required for dropdowns

With `onExecute`, the executor skips clicking the last step (to avoid double-firing). If your action has only one step, the click never happens — the dropdown won't open:

```tsx
// Bad — single step with onExecute, dropdown never opens
<AgentAction name="filter" onExecute={handleFilter}>
  <Select>...</Select>
</AgentAction>

// Good — two steps: click to open, then select option
<AgentAction name="filter" onExecute={handleFilter}>
  <AgentStep label="Open filter">
    <Select>
      <SelectTrigger>...</SelectTrigger>
      <SelectContent>
        <AgentTarget action="filter" param="status" value="active">
          <SelectItem value="active">Active</SelectItem>
        </AgentTarget>
      </SelectContent>
    </Select>
  </AgentStep>
  <AgentStep label="Select option" fromParam="status" />
</AgentAction>
```

## Don't deeply nest `<AgentAction>` wrappers

Each `<AgentAction>` renders a `<div style="display:contents">`. Nesting them creates a chain of `display:contents` divs. `getBoundingClientRect()` on these returns all zeros, causing spotlights to appear at (0,0):

```tsx
// Bad — nested wrappers, inner actions resolve to display:contents divs
<AgentAction name="action_a">
  <AgentAction name="action_b">
    <AgentAction name="action_c">
      <ActualContent />
    </AgentAction>
  </AgentAction>
</AgentAction>

// Good — flat siblings, each wrapping its own element (or use the hook)
<AgentAction name="action_a">
  <ButtonA />
</AgentAction>
<AgentAction name="action_b">
  <ButtonB />
</AgentAction>
```
