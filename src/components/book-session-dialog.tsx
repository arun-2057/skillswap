"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2, RefreshCw, BookOpen, Clock, ArrowRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { swapProposalSchema, type SwapProposalInput } from "@/lib/validators";
import { handleProposeSwap } from "@/app/actions/propose-swap";
import { supabase } from "@/lib/supabase";

interface BookSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetTeacherId: string;
  targetListingId: string;
  targetListingTitle: string;
}

interface UserListingOption {
  id: string;
  title: string;
}

export function BookSessionDialog({
  isOpen,
  onClose,
  targetTeacherId,
  targetListingId,
  targetListingTitle,
}: BookSessionDialogProps) {
  const [myListings, setMyListings] = useState<UserListingOption[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<SwapProposalInput>({
    resolver: zodResolver(swapProposalSchema),
    defaultValues: {
      receiverId: targetTeacherId,
      receiverSkillId: targetListingId,
      duration: 60,
    },
  });

  const selectedDate = useWatch({ control, name: "proposedTime" });
  const selectedProposerSkillId = useWatch({ control, name: "proposerSkillId" });

  useEffect(() => {
    if (!isOpen) return;

    async function fetchMyListings() {
      setIsLoadingListings(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("listings")
          .select("id, title")
          .eq("user_id", user.id)
          .eq("status", "active");

        if (error) throw error;
        setMyListings(data || []);
      } catch (err) {
        console.error("Error fetching user options for barter exchange:", err);
        toast.error("Failed to load your skills. Please refresh.");
      } finally {
        setIsLoadingListings(false);
      }
    }

    fetchMyListings();
  }, [isOpen]);

  const onSubmit = async (data: SwapProposalInput) => {
    setIsSubmitting(true);

    const result = await handleProposeSwap({
      receiverId: data.receiverId,
      receiverSkillId: data.receiverSkillId,
      proposerSkillId: data.proposerSkillId,
      proposedTime: data.proposedTime,
      duration: Number(data.duration),
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Proposal Sent!", {
        description: "Your barter request has been sent to the instructor.",
      });
      reset();
      onClose();
    } else {
      toast.error("Proposal Failed", {
        description: result.error || "Something went wrong creating the match.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <div className="flex items-center justify-between p-6 pb-0">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Propose a Skill Swap
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              You are requesting to learn <strong className="text-foreground">{targetListingTitle}</strong>.
              Trade your expertise in return.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ArrowRight className="size-4 rotate-180" />
            </Button>
          </DialogClose>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">

          <div className="space-y-2">
            <Label htmlFor="proposerSkillId" className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              Your Skill to Offer
            </Label>
            {isLoadingListings ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg bg-muted/20">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading your available skills...</span>
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-sm text-destructive bg-destructive/5 p-4 rounded-lg border border-destructive/20 flex gap-3">
                <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">No skills listed yet</p>
                  <p className="text-xs">Create a skill listing on your profile before proposing a swap.</p>
                </div>
              </div>
            ) : (
              <Select
                onValueChange={(value) => setValue("proposerSkillId", value, { shouldValidate: true })}
                value={selectedProposerSkillId}
              >
                <SelectTrigger className={cn("w-full h-10", errors.proposerSkillId && "border-destructive")}>
                  <SelectValue placeholder="Select a skill to barter with..." />
                </SelectTrigger>
                <SelectContent>
                  {myListings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.proposerSkillId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.proposerSkillId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              Preferred Date & Time
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !selectedDate && "text-muted-foreground",
                    errors.proposedTime && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("proposedTime", date.toISOString(), { shouldValidate: true });
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.proposedTime && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.proposedTime.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Session Duration
            </Label>
            <Select
              defaultValue="60"
              onValueChange={(value) => setValue("duration", Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Minutes</SelectItem>
                <SelectItem value="60">1 Hour</SelectItem>
                <SelectItem value="90">1.5 Hours</SelectItem>
                <SelectItem value="120">2 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <div className="flex gap-3 w-full">
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || myListings.length === 0}
                className="flex-1 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Proposal"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}