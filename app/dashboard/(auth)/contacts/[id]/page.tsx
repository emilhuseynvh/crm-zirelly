"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ArrowLeftIcon, CheckIcon, PencilIcon, SendIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ContactFormDialog } from "@/components/crm/contact-form-dialog";
import {
  useAddContactNoteMutation,
  useDeleteContactMutation,
  useDeleteContactNoteMutation,
  useGetContactQuery,
  useUpdateContactNoteMutation
} from "@/lib/api/crm";
import {
  CHANNEL_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatMoney,
  getStoredUser
} from "@/lib/crm";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const contactId = Number(id);
  const router = useRouter();

  const { data, isLoading } = useGetContactQuery(contactId, { skip: Number.isNaN(contactId) });
  const [addNote, { isLoading: addingNote }] = useAddContactNoteMutation();
  const [updateNote, { isLoading: updatingNote }] = useUpdateContactNoteMutation();
  const [deleteNote] = useDeleteContactNoteMutation();
  const [deleteContact] = useDeleteContactMutation();

  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    setIsSuperadmin(user?.role === "superadmin");
    setMyId(user?.id ?? null);
  }, []);

  if (isLoading) return <p className="text-muted-foreground">Yüklənir...</p>;

  const contact = data?.data;

  if (!contact) return <p className="text-muted-foreground">Müştəri tapılmadı.</p>;

  const handleAddNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!noteBody.trim()) return;

    try {
      await addNote({ id: contact.id, body: noteBody.trim() }).unwrap();
      setNoteBody("");
      toast.success("Qeyd əlavə olundu.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Qeyd əlavə olunmadı.");
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editingBody.trim()) return;

    try {
      await updateNote({ id: contact.id, noteId, body: editingBody.trim() }).unwrap();
      setEditingNoteId(null);
      toast.success("Qeyd yeniləndi.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Qeyd yenilənmədi.");
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNote({ id: contact.id, noteId }).unwrap();
      toast.success("Qeyd silindi.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Qeyd silinmədi.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact(contact.id).unwrap();
      toast.success("Müştəri arxivləşdirildi.");
      router.push("/dashboard/contacts");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={`${contact.name} ${contact.surname ?? ""}`}
          description={`Müştəri #${contact.id} · ${CHANNEL_LABELS[contact.channel]}`}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/contacts">
              <ArrowLeftIcon />
              Geri
            </Link>
          </Button>
          <ContactFormDialog
            contact={contact}
            trigger={
              <Button variant="outline">
                <PencilIcon />
                Redaktə
              </Button>
            }
          />
          {isSuperadmin && (
            <ConfirmDelete
              onConfirm={handleDelete}
              title="Müştərini arxivləşdirmək istəyirsiniz?"
              description="Müştəri siyahıdan çıxarılacaq (soft delete). Sifarişləri bazada qalır."
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Məlumatlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Telefon" value={contact.phone} />
            <InfoRow label="E-poçt" value={contact.email} />
            <InfoRow label="Ünvan" value={contact.address} />
            <InfoRow
              label="E-poçt təsdiqi"
              value={
                contact.email_verified === null
                  ? "—"
                  : contact.email_verified
                    ? "Təsdiqlənib"
                    : "Təsdiqlənməyib"
              }
            />
            <InfoRow label="Doğum tarixi" value={formatDate(contact.birth_date)} />
            <InfoRow label="Mənbə" value={CHANNEL_LABELS[contact.channel]} />
            <InfoRow label="İlk sifariş" value={formatDate(contact.first_order_at)} />
            <InfoRow label="Son sifariş" value={formatDate(contact.last_order_at)} />
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Ümumi sifariş</span>
              <b>{contact.orders_count}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ümumi alış</span>
              <b>{formatMoney(contact.orders_total)}</b>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daxili qeydlər</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleAddNote} className="flex items-start gap-2">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Müştəri haqqında qeyd yazın..."
                rows={2}
              />
              <Button type="submit" size="icon" disabled={addingNote}>
                <SendIcon />
              </Button>
            </form>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {contact.notes?.map((note) => {
                const canManage = isSuperadmin || (myId !== null && note.author_id === myId);

                return (
                  <div key={note.id} className="rounded-md border px-3 py-2 text-sm">
                    {editingNoteId === note.id ? (
                      <div className="flex items-start gap-2">
                        <Textarea
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
                          rows={2}
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            className="size-7"
                            disabled={updatingNote}
                            onClick={() => handleUpdateNote(note.id)}>
                            <CheckIcon />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => setEditingNoteId(null)}>
                            <XIcon />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 whitespace-pre-wrap">{note.body}</p>
                          {canManage && (
                            <div className="flex shrink-0 items-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingBody(note.body);
                                }}>
                                <PencilIcon />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive size-7"
                                onClick={() => handleDeleteNote(note.id)}>
                                <Trash2Icon />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {note.author ?? "—"} · {formatDateTime(note.created_at)}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
              {(contact.notes?.length ?? 0) === 0 && (
                <p className="text-muted-foreground text-sm">Hələ qeyd yoxdur.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sifariş tarixçəsi</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead className="text-right">Məhsul</TableHead>
                  <TableHead className="text-right">Yekun</TableHead>
                  <TableHead>Tarix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contact.orders?.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-sm">
                        <span className={`size-2 rounded-full ${STATUS_DOT[order.status]}`} />
                        {STATUS_LABELS[order.status]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{CHANNEL_LABELS[order.channel]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{order.items_count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(order.grand_total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(order.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {(contact.orders?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground py-6 text-center">
                      Hələ sifariş yoxdur.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? "—"}</span>
    </div>
  );
}
