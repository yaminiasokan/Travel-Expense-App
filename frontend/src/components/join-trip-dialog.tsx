"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { tripsApi } from "@/lib/endpoints";
import { extractErrorMessage } from "@/lib/api";
import { notify } from "@/lib/toast";

export function JoinTripDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => tripsApi.join(code.trim().toUpperCase()),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      notify.success(`Joined "${trip.name}"`);
      setCode("");
      onClose();
      router.push(`/trips/${trip.id}`);
    },
    onError: (err) => {
      const message = extractErrorMessage(err);
      setError(message);
      notify.error(message);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Join a trip">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="code">Invite code</Label>
          <Input
            id="code"
            className="mt-1.5 font-ledger uppercase tracking-widest"
            placeholder="ABCD1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-rust">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Join trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
