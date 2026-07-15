"use server";

import { createServerClient } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

export async function handleUpdateSwapStatus(swapId: string, newStatus: "accepted" | "declined") {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: swap, error: fetchError } = await supabase
    .from("mutual_swaps")
    .select("proposer_id, receiver_id, proposer_skill_id, receiver_skill_id")
    .eq("id", swapId)
    .eq("receiver_id", user.id)
    .single();

  if (fetchError || !swap) {
    return { success: false, error: "Swap not found or you are not authorized" };
  }

  const { error } = await supabase
    .from("mutual_swaps")
    .update({ status: newStatus })
    .eq("id", swapId)
    .eq("receiver_id", user.id);

  if (error) return { success: false, error: error.message };

  let conversationId: string | undefined;

  if (newStatus === "accepted") {
    const { data: existingConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", swap.receiver_skill_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingConversations && existingConversations.length > 0) {
      conversationId = existingConversations[0].id;
    } else {
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          listing_id: swap.receiver_skill_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (conversationError) {
        console.error("Error creating conversation:", conversationError);
      } else {
        conversationId = conversation.id;
      }
    }

    if (conversationId) {
      const participantInserts = [
        { conversation_id: conversationId, user_id: swap.proposer_id },
        { conversation_id: conversationId, user_id: swap.receiver_id },
      ];

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert(participantInserts);

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
      }
    }
  }

  revalidatePath("/sessions");
  revalidatePath("/messages");

  return {
    success: true,
    conversationId,
  };
}
