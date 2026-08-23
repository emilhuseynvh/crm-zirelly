"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useCreateContactMutation, useUpdateContactMutation } from "@/lib/api/crm";
import type { Channel, Contact } from "@/lib/api/types";
import { CHANNEL_LABELS } from "@/lib/crm";

interface ContactFormDialogProps {
  contact?: Contact;
  trigger: React.ReactNode;
  onSaved?: (contact: Contact) => void;
}

export function ContactFormDialog({ contact, trigger, onSaved }: ContactFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [channel, setChannel] = useState<Channel>("instagram");

  const [createContact, { isLoading: creating }] = useCreateContactMutation();
  const [updateContact, { isLoading: updating }] = useUpdateContactMutation();

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? "");
    setSurname(contact?.surname ?? "");
    setPhone(contact?.phone ?? "");
    setEmail(contact?.email ?? "");
    setBirthDate(contact?.birth_date?.slice(0, 10) ?? "");
    setChannel(contact?.channel ?? "instagram");
  }, [open, contact]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      surname: surname.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      birth_date: birthDate || null,
      channel
    };

    try {
      const result = contact
        ? await updateContact({ id: contact.id, ...payload }).unwrap()
        : await createContact(payload).unwrap();

      toast.success(contact ? "Müştəri yeniləndi." : "Müştəri yaradıldı.");
      setOpen(false);
      onSaved?.(result.data);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Əməliyyat alınmadı.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Müştərini redaktə et" : "Yeni müştəri"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ad</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Soyad</Label>
              <Input value={surname} onChange={(e) => setSurname(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Telefon</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+994775387707"
            />
          </div>

          <div className="space-y-1.5">
            <Label>E-poçt</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Doğum tarixi</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mənbə / kanal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHANNEL_LABELS) as Channel[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={creating || updating}>
            {creating || updating ? "Yadda saxlanır..." : "Yadda saxla"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
