"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => void;
};

export function ConfusionDialog({ open, onOpenChange, onSubmit }: Props) {
  const [note, setNote] = useState("");

  const submit = () => {
    const t = note.trim();
    onSubmit(t || "I'm confused (no extra note)");
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confusion signal</DialogTitle>
          <DialogDescription>
            Briefly describe what is unclear (e.g. a term or step). Sent to the gateway and stored with the session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="confusion-note">Note (optional)</Label>
          <Textarea
            id="confusion-note"
            placeholder="e.g. I don't understand how learning rate affects overshoot…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">Ctrl+Enter to send quickly.</p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
