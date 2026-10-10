import type { Metadata } from "next";

import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = {
  title: "Obrolan",
  description: "Ngobrol dengan Bolu-mu: balasan streaming, grafik, diagram, dan draf.",
};

export default function ChatPage() {
  return (
    <main className="h-[calc(100dvh-0px)]">
      <ChatView />
    </main>
  );
}
