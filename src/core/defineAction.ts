/**
 * Define an action at import time so its schema is available before the component mounts.
 * Pass defined actions to `<AgentActionProvider registry={[...]}>` for single-roundtrip execution.
 *
 * @example
 * ```ts
 * export const updatePrice = defineAction({
 *   name: 'update_price',
 *   description: 'Update price markup on a property',
 *   parameters: z.object({ property_id: z.string(), markup: z.number() }),
 *   route: (p) => `/properties/${p.property_id}/pricing`,
 * });
 * ```
 */
export interface ActionDefinition<TParams = Record<string, unknown>> {
  readonly name: string;
  readonly description: string;
  /** Zod schema for action parameters. */
  readonly parameters?: unknown;
  /** Client-side route to navigate to before executing. */
  readonly route?: (params: TParams) => string;
  /** Handler for background execution (no UI component needed). */
  readonly onExecute?: (params: TParams) => void | Promise<void>;
}

export function defineAction<TParams = Record<string, unknown>>(config: {
  name: string;
  description: string;
  parameters?: unknown;
  route?: (params: TParams) => string;
  onExecute?: (params: TParams) => void | Promise<void>;
}): ActionDefinition<TParams> {
  return {
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    route: config.route,
    onExecute: config.onExecute,
  };
}
