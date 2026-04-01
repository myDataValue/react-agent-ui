# react-agent-ui

Declarative React library for agent-driven UI control with visual guided execution.

The agent drives the **real UI** — it opens the actual dropdown, clicks the actual button, with the user watching. "Let me show you how" instead of "I did it for you." After seeing it twice, users do it themselves.

## Install

```bash
npm install react-agent-ui
# peer deps
npm install react react-dom zod
```

## Quick Start

Wrap your app (or a subtree) with the provider:

```tsx
import { AgentActionProvider } from 'react-agent-ui';

<AgentActionProvider mode="guided" stepDelay={600}>
  <App />
</AgentActionProvider>
```

### Single element — agent clicks a button

```tsx
import { AgentAction } from 'react-agent-ui';

<AgentAction name="export_csv" description="Export properties to CSV">
  <ExportButton />
</AgentAction>
```

When the agent calls `execute("export_csv")`, the library scrolls to the button, spotlights it with a dimmed overlay and pulsing ring, pauses so the user sees it, then clicks it.

### Multi-step — sequential UI interactions

```tsx
import { AgentAction, AgentStep } from 'react-agent-ui';

<AgentAction name="sync_data" description="Sync data from Booking.com">
  <AgentStep label="Open sync menu">
    <SyncDropdownTrigger />
  </AgentStep>
  <AgentStep label="Click sync">
    <SyncButton />
  </AgentStep>
</AgentAction>
```

Each step is spotlighted and clicked in sequence. The delay between steps lets animations complete (dropdowns opening, etc.).

### Parameterized — agent passes data, UI shows where

```tsx
import { AgentAction } from 'react-agent-ui';
import { z } from 'zod';

<AgentAction
  name="sync_properties"
  description="Sync specific properties"
  parameters={z.object({
    property_ids: z.array(z.number()).optional().describe("IDs to sync, omit for all")
  })}
  onExecute={(params) => triggerSync(params.property_ids)}
>
  <SyncButton />
</AgentAction>
```

The button is spotlighted (so the user sees *where* this action lives), then `onExecute` handles the logic with the agent's parameters. The element is the visual anchor, `onExecute` is the brain.

## Consuming — `useAgentActions()`

```tsx
import { useAgentActions } from 'react-agent-ui';

function AgentBackend() {
  const {
    schemas,         // ToolSchema[] — generic format
    openaiTools,     // OpenAI function calling format
    anthropicTools,  // Anthropic tool use format
    availableActions, // { name, description, disabled, hasParameters }[]
    execute,         // (name: string, params?: Record<string, unknown>) => Promise<ExecutionResult>
    isExecuting,     // boolean
  } = useAgentActions();

  // Send schemas to your agent backend
  // Call execute() when the agent responds with a tool call
}
```

`schemas`, `openaiTools`, and `anthropicTools` auto-update as `<AgentAction>` components mount/unmount. The agent always knows exactly what's available on the current screen.

## Execution Modes

| Mode | Behavior | Use case |
|------|----------|----------|
| `"guided"` | Scroll → spotlight → pause → click/execute | Teaching the user, first-time flows |
| `"instant"` | Execute immediately, no visual | Power users, repeat actions |

```tsx
<AgentActionProvider mode="guided" stepDelay={600}>
```

## Provider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `"guided" \| "instant"` | `"guided"` | Execution mode |
| `stepDelay` | `number` | `600` | Ms to hold spotlight before acting |
| `overlayOpacity` | `number` | `0.5` | Overlay dim opacity (0-1) |
| `spotlightPadding` | `number` | `8` | Px padding around spotlighted element |
| `tooltipEnabled` | `boolean` | `true` | Show label tooltip during spotlight |
| `onExecutionStart` | `(name: string) => void` | — | Callback when execution begins |
| `onExecutionComplete` | `(result: ExecutionResult) => void` | — | Callback when execution ends |

## WebSocket Adapter

For agent backends communicating via WebSocket:

```tsx
import { createWebSocketAdapter, useWebSocketAdapter } from 'react-agent-ui';

const adapter = createWebSocketAdapter({
  socket: existingWebSocket,
  parseToolCalls: (data) => {
    if (data.type === 'agent_ui_command') {
      return data.commands.map(cmd => ({
        name: cmd.action,
        arguments: cmd,
      }));
    }
    return null;
  },
});

// In your component:
useWebSocketAdapter(adapter, { autoSendState: true });
```

## Disabled Actions

```tsx
<AgentAction
  name="push_changes"
  description="Push pending changes"
  disabled={!hasPendingChanges}
  disabledReason="No pending changes to push"
>
  <PushButton />
</AgentAction>
```

Disabled actions appear in `availableActions` (so the agent knows they exist) but are excluded from `schemas` (so the agent won't try to call them). Calling `execute()` on a disabled action returns `{ success: false, error: "No pending changes to push" }`.

## CSS Customization

All injected overlay elements have class names for styling:

```css
.react-agent-ui-spotlight { /* box-shadow overlay with cutout */ }
.react-agent-ui-ring { /* pulsing border around target */ }
.react-agent-ui-tooltip { /* label tooltip */ }
```

## How It Works

1. `<AgentAction>` components register themselves in a React context registry on mount, deregister on unmount
2. The registry always reflects exactly what's on screen — auto-generates tool schemas from Zod parameter definitions
3. When `execute(name, params)` is called, the executor looks up the action, finds the DOM element via refs, and runs the visual sequence
4. A `<div style="display: contents">` wrapper provides DOM refs without affecting layout
5. Multi-step actions sort their steps by DOM position and execute sequentially

Zero runtime dependencies beyond React and Zod.

## License

MIT
