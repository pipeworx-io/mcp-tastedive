interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * TasteDive MCP — cross-media recommendations (free with key)
 *
 * "Things like X" across music, movies, shows, books, authors, games,
 * podcasts. Single endpoint with a `type` filter.
 *
 * API: https://tastedive.com/read/api
 * Auth: ?k= query. Free, register at tastedive.com/profile/api.
 *
 * Tools:
 * - get_recommendations: "like Blade Runner" → ranked items in chosen category
 */


const BASE_URL = 'https://tastedive.com/api/similar';

const TYPES = ['music', 'movies', 'shows', 'books', 'authors', 'games', 'podcasts'] as const;

const tools: McpToolExport['tools'] = [
  {
    name: 'get_recommendations',
    description:
      'Get "similar to X" recommendations from TasteDive. type narrows the category (music | movies | shows | books | authors | games | podcasts). info=true also returns short descriptions and Wikipedia URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Seed — one or more titles, comma-separated. Prefix with `<type>:` to disambiguate (e.g., "movie:Inception").',
        },
        type: {
          type: 'string',
          description: 'Restrict to one category',
          enum: ['music', 'movies', 'shows', 'books', 'authors', 'games', 'podcasts'],
        },
        limit: { type: 'number', description: '1-50 (default 20)' },
        include_info: { type: 'boolean', description: 'Add description + Wikipedia URL (default false)' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'TasteDive requires an API key. Contact the operator about platform credentials, or BYO via ?_apiKey=<key> after registering at https://tastedive.com/profile/api.',
    );
  }
  switch (name) {
    case 'get_recommendations':
      return getRecommendations(apiKey, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

interface TastediveResp {
  similar?: {
    info?: { name?: string; type?: string; wTeaser?: string; wUrl?: string; yUrl?: string }[];
    results?: { name?: string; type?: string; wTeaser?: string; wUrl?: string; yUrl?: string }[];
  };
}

async function getRecommendations(apiKey: string, args: Record<string, unknown>) {
  const params = new URLSearchParams({
    q: String(args.query),
    k: apiKey,
    limit: String(Math.min(50, Math.max(1, (args.limit as number) ?? 20))),
  });
  if (args.type) {
    const t = String(args.type);
    if (!(TYPES as readonly string[]).includes(t)) {
      throw new Error(`Unknown type "${t}". Expected one of: ${TYPES.join(', ')}.`);
    }
    params.set('type', t);
  }
  if (args.include_info) {
    params.set('info', '1');
    params.set('description', '1');
  }

  const res = await fetch(`${BASE_URL}?${params}`);
  if (res.status === 401 || res.status === 403) throw new Error('TasteDive: unauthorized — check the API key');
  if (res.status === 429) throw new Error('TasteDive: rate-limit (HTTP 429)');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TasteDive error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as TastediveResp;
  const results = data.similar?.results ?? [];
  const info = data.similar?.info ?? [];
  return {
    query: args.query,
    type: args.type ?? 'mixed',
    seed_resolved: info.map((i) => ({ name: i.name ?? null, type: i.type ?? null })),
    count: results.length,
    recommendations: results.map((r) => ({
      name: r.name ?? null,
      type: r.type ?? null,
      teaser: r.wTeaser ?? null,
      wikipedia: r.wUrl ?? null,
      youtube: r.yUrl ?? null,
    })),
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
