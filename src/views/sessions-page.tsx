import { createServerClient } from "@/lib/auth-helpers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SwapActions } from "@/components/swaps/swap-actions";

export async function SessionsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="p-8 text-center">Please sign in to view your swaps.</div>;

  const { data: incomingSwaps } = await supabase
    .from("mutual_swaps")
    .select(`
      id, status, proposed_time, duration,
      proposer:proposer_id ( name, avatar_url ),
      proposer_skill:proposer_skill_id ( title ),
      receiver_skill:receiver_skill_id ( title )
    `)
    .eq("receiver_id", user.id);

  const { data: outgoingSwaps } = await supabase
    .from("mutual_swaps")
    .select(`
      id, status, proposed_time, duration,
      receiver:receiver_id ( name, avatar_url ),
      proposer_skill:proposer_skill_id ( title ),
      receiver_skill:receiver_skill_id ( title )
    `)
    .eq("proposer_id", user.id);

  return (
    <div className="container max-w-5xl py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Skill Swaps</h1>
        <p className="text-muted-foreground">Manage your direct 1-to-1 barter trade agreements.</p>
      </div>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="incoming">Incoming Requests</TabsTrigger>
          <TabsTrigger value="outgoing">Sent Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4 mt-4">
          {incomingSwaps?.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center border rounded-lg border-dashed">No incoming proposals yet.</p>
          ) : (
            incomingSwaps?.map((swap: any) => (
              <Card key={swap.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{swap.proposer.name}</span>
                      <Badge variant={swap.status === "pending" ? "outline" : "default"}>
                        {swap.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>Offers: <strong>{swap.proposer_skill?.title}</strong></span>
                      <ArrowLeftRight className="h-3 w-3" />
                      <span>Wants: <strong>{swap.receiver_skill?.title}</strong></span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(swap.proposed_time), "PPP p")} ({swap.duration} mins)
                    </div>
                  </div>

                  {swap.status === "pending" && (
                    <SwapActions swapId={swap.id} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4 mt-4">
          {outgoingSwaps?.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center border rounded-lg border-dashed">You haven&apos;t proposed any swaps yet.</p>
          ) : (
            outgoingSwaps?.map((swap: any) => (
              <Card key={swap.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Proposal sent to <strong>{swap.receiver?.name}</strong></span>
                      <Badge>{swap.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      You offered: {swap.proposer_skill?.title} | Requested: {swap.receiver_skill?.title}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
