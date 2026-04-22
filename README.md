# gunma-chat-widget

Premium, humanoid AI chat widget for Gunma Halal Food. Supports multilingual interactions (English, Bengali, Japanese) and real-time shopping features.

## Features
- **Piku AI**: Empathetic, neighborhood-style AI assistant.
- **Smart Cart**: Add products directly to cart from chat.
- **Order Tracking**: Real-time order status and smart cancellation rules.
- **Claims & Tickets**: Formal claims (damage/missing items) and support tickets.
- **Echo/Pusher Support**: Real-time message broadcasting.
- **Auto-Auth**: Detects customer tokens from `localStorage` ('tk').

## Installation
```bash
npm install gunma-chat-widget
```

## Usage
```tsx
import { ChatWidget } from 'gunma-chat-widget';
import 'gunma-chat-widget/styles.css';

function App() {
  return (
    <ChatWidget 
      apiUrl="https://your-api-domain.com"
      apiToken="your-passport-token"
    />
  );
}
```

## License
MIT © Anwar
