'use server';

import { createServerClient } from '@/lib/auth-helpers';
import { revalidatePath } from 'next/cache';
import { swapProposalSchema, type SwapProposalInput } from '@/lib/validators';

type FormState = { ok: boolean; error?: string };

export async function proposeSwapAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: 'You must be signed in to propose a swap.' };
  }

  const parsed = swapProposalSchema.safeParse({
    receiverId: formData.get('receiverId'),
    proposerSkillId: formData.get('proposerSkillId'),
    receiverSkillId: formData.get('receiverSkillId'),
    proposedTime: formData.get('proposedTime'),
    duration: parseInt((formData.get('duration') as string) || '60', 10),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Validation failed.' };
  }

  const { receiverId, proposerSkillId, receiverSkillId, proposedTime, duration } = parsed.data;
  const message = (formData.get('message') as string | null)?.trim() || undefined;

  if (user.id === receiverId) {
    return { ok: false, error: 'You cannot propose a swap with yourself.' };
  }

  const { data: existingSwap, error: existingSwapError } = await supabase
    .from('mutual_swaps')
    .select('id')
    .or(`and(proposer_id.eq.${user.id},receiver_id.eq.${receiverId}),and(proposer_id.eq.${receiverId},receiver_id.eq.${user.id}))`)
    .in('status', ['pending', 'accepted'])
    .limit(1)
    .maybeSingle();

  if (existingSwapError) {
    console.error('Error checking existing swaps:', existingSwapError);
  }

  if (existingSwap) {
    return { ok: false, error: 'You already have an active swap request with this user.' };
  }

  const { error: swapError } = await supabase
    .from('mutual_swaps')
    .insert({
      proposer_id: user.id,
      receiver_id: receiverId,
      proposer_skill_id: proposerSkillId,
      receiver_skill_id: receiverSkillId,
      proposed_time: proposedTime,
      duration,
      status: 'pending',
      message: message || null,
    });

  if (swapError) {
    console.error('Error creating swap proposal:', swapError);
    return { ok: false, error: swapError.message };
  }

  await supabase.from('notifications').insert({
    user_id: receiverId,
    type: 'swap_request',
    title: 'New Swap Proposal!',
    message: 'Someone wants to trade skills with you!',
    metadata: {
      proposerId: user.id,
      proposerSkillId,
      receiverSkillId,
      proposedTime,
      duration,
    },
  });

  revalidatePath('/sessions');
  revalidatePath('/browse');

  return { ok: true };
}

export async function handleProposeSwap(input: SwapProposalInput) {
  const formData = new FormData();
  formData.append('receiverId', input.receiverId);
  formData.append('proposerSkillId', input.proposerSkillId);
  formData.append('receiverSkillId', input.receiverSkillId);
  formData.append('proposedTime', input.proposedTime);
  formData.append('duration', String(input.duration));

  const result = await proposeSwapAction({ ok: false }, formData);
  if (!result.ok) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const };
}
