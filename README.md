# Gunma Chat Widget

A premium, real-time AI chat widget for the Gunma Halal Food storefront.

## Features
- **Streaming Responses**: Real-time message streaming via SSE.
- **Smart Actions**: Automatically handles redirects (e.g., to checkout) triggered by the AI.
- **Real-time Monitoring**: Integrates with Laravel Echo/Pusher for human-takeover support.
- **Halal Optimized**: Pre-configured system prompts for food and dietary support.

## Installation

```bash
npm install gunma-chat-widget
```

## Usage

```tsx
import { GunmaChatWidget } from 'gunma-chat-widget';

function App() {
  return (
    <GunmaChatWidget 
      apiUrl="https://your-api.com/api/chat"
      echoConfig={{
        key: 'your-pusher-key',
        cluster: 'mt1'
      }}
    />
  );
}
```

## Props
- `apiUrl`: The base URL for the chat API.
- `visitorId`: (Optional) Custom visitor ID for persistence.
- `initialMessage`: (Optional) Custom greeting.
