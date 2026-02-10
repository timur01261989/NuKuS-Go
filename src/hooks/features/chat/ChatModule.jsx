import React from 'react';
// Adapter to existing ChatComponent (if present)
let ChatComponent = null;
try { ChatComponent = require('../../shared/components/ChatComponent.jsx').default || require('../../shared/components/ChatComponent.jsx'); } catch {}

export function ChatModule(props) {
  if (ChatComponent) return <ChatComponent {...props} />;
  return <div className="p-4 text-sm text-gray-600">Chat module placeholder (connect when ready).</div>;
}
