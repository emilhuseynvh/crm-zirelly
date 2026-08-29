"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import {
  useCreateContactMutation,
  useLazyCheckContactPhoneQuery,
  useUpdateContactMutation
} from "@/lib/api/crm";
import type { Channel, Contact } from "@/lib/api/types";
import { CHANNEL_LABELS } from "@/lib/crm";

interface DuplicateInfo {
  id: number;
  name: string;
  phone: string;
}

interface ContactFormDialogProps {
  contact?: Contact;
  trigger: React.ReactNode;
  onSaved?: (contact: Contact) => void;
}

export function ContactFormDialog({ contact, trigger, onSaved }: ContactFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [channel, setChannel] = useState<Channel>("instagram");
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);

  const [createContact, { isLoading: creating }] = useCreateContactMutation();
  const [updateContact, { isLoading: updating }] = useUpdateContactMutation();
  const [checkPhone, { isLoading: checking }] = useLazyCheckContactPhoneQuery();

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? "");
    setSurname(contact?.surname ?? "");
    setPhone(contact?.phone ?? "");
    setEmail(contact?.email ?? "");
    setBirthDate(contact?.birth_date?.slice(0, 10) ?? "");
    setAddress(contact?.address ?? "");
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
      address: address.trim() || null,
      channel
    };

    if (payload.phone) {
      try {
        const result = await checkPhone({
          phone: payload.phone,
          except: contact?.id
        }).unwrap();

        if (result.data) {
          setDuplicate(result.data);
          return;
        }
      } catch {
        // yoxlama alınmasa, son sədd backend-dəki dublikat qorumasıdır
      }
    }

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
              placeholder="+994512522410"
            />
          </div>

          <div className="space-y-1.5">
            <Label>E-poçt</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Çatdırılma ünvanı</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Şəhər, küçə, bina, mənzil..."
            />
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

          <Button type="submit" className="w-full" disabled={creating || updating || checking}>
            {creating || updating || checking ? "Yadda saxlanır..." : "Yadda saxla"}
          </Button>
        </form>
      </DialogContent>

      <AlertDialog open={duplicate !== null} onOpenChange={(v) => !v && setDuplicate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu nömrə ilə müştəri artıq mövcuddur</AlertDialogTitle>
            <AlertDialogDescription>
              <b>
                #{duplicate?.id} — {duplicate?.name}
              </b>{" "}
              ({duplicate?.phone}) eyni telefon nömrəsi ilə qeydiyyatdadır. Dublikat
              yaratmamaq üçün mövcud müştəri kartından istifadə edin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bağla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDuplicate(null);
                setOpen(false);
                router.push(`/dashboard/contacts/${duplicate?.id}`);
              }}>
              Müştəriyə keç
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
