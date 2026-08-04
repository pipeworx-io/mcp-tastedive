# @pipeworx/tastedive

TasteDive MCP — cross-media "like X" recommendations.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `get_recommendations(query, type?, limit?, include_info?)` — music / movies / shows / books / authors / games / podcasts.

## Auth

- **Platform key:** gateway env `PLATFORM_TASTEDIVE_KEY`.
- **BYO:** `?_apiKey=<key>` after registering at https://tastedive.com/profile/api.

## Data source

`https://tastedive.com/api/similar` — `?k=` query param.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "tastedive": {
      "url": "https://gateway.pipeworx.io/tastedive/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Tastedive data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
