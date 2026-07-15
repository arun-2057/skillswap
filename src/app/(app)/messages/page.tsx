import { MessagesPage } from '@/views/messages-page';

export default async function MessagesRoute({
  searchParams,
}: {
  searchParams?: Promise<{ conversationId?: string }>;
}) {
  const { conversationId } = await (searchParams ?? {});
  return <MessagesPage initialConversationId={conversationId} />;
}
