"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function FeedbackWidget() {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedbackDialog(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 bg-zinc-600 hover:bg-zinc-700 text-white rounded-l-full px-5 py-1 shadow-lg hover:shadow-xl transition-all duration-200 group origin-right"
        style={{ writingMode: 'sideways-lr', textOrientation: 'mixed' }}
        title="Share Feedback"
      >
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
            <DialogDescription>
              Help us improve CountdownStack! Your feedback and suggestions are valuable to us.
              Click below to open our feedback board where you can share your thoughts,
              report issues, or suggest new features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                window.open("https://insigh.to/b/countdownstack", "_blank");
                setShowFeedbackDialog(false);
              }}
            >
              Open Feedback Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}