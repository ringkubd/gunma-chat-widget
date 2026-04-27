# gunma-chat-widget

Premium, humanoid AI chat widget for Gunma Halal Food. Supports multilingual interactions (English, Bengali, Japanese) and real-time shopping features.

## Features
- **Piku AI**: Empathetic, neighborhood-style AI assistant.
- **Smart Cart**: Add products directly to cart from chat.
- **Order Tracking**: Real-time order status and smart cancellation rules.
- **Claims & Tickets**: Formal claims (damage/missing items) and support tickets.
- **Echo/Pusher Support**: Real-time message broadcasting.
- **Auto-Auth**: Detects customer tokens from `localStorage` ('tk').

## Installation & Update

### Install
```bash
npm install gunma-chat-widget
```

### Update
```bash
npm install gunma-chat-widget@latest
```

## Configuration (.env.local)
The widget requires these Next.js public variables:
```env
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
NEXT_PUBLIC_PUSHER_HOST=localhost
NEXT_PUBLIC_PUSHER_PORT=6001
NEXT_PUBLIC_PUSHER_FORCE_TLS=false
```

## Development & Pushing to GitHub
If you are modifying the package locally in the `packages/` directory:
1. **Navigate to the package**: `cd packages/gunma-chat-widget`
2. **Build the package**: `npm run build`
3. **Commit changes**: `git add . && git commit -m "your message"`
4. **Push to GitHub**: `git push origin main`
5. **Update Host App**: Run `npm install` in your `front_entry` project.

## Usage
```tsx
import { ChatWidget } from 'gunma-chat-widget';
import 'gunma-chat-widget/styles.css';

function App() {
  return (
    <ChatWidget 
      apiUrl="https://your-api-domain.com"
      brandColor="#10b981"
      brandName="Piku"
    />
  );
}
```

## License
MIT © Anwar

