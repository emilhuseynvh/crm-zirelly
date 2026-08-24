"use client";

import { useEffect, useState } from "react";
import { ArchiveRestoreIcon } from "lucide-react";

import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import {
  useForceDeleteContactMutation,
  useForceDeleteNoteMutation,
  useForceDeleteOrderMutation,
  useForceDeleteUserMutation,
  useGetTrashedContactsQuery,
  useGetTrashedNotesQuery,
  useGetTrashedOrdersQuery,
  useGetTrashedUsersQuery,
  useRestoreContactMutation,
  useRestoreNoteMutation,
  useRestoreOrderMutation,
  useRestoreUserMutation
} from "@/lib/api/crm";
import {
  CHANNEL_LABELS,
  STATUS_DOT,
  STATUS_LABELS,
  formatDateTime,
  formatMoney,
  getStoredUser
} from "@/lib/crm";

export default function TrashPage() {
  const [isSuperadmin, setIsSuperadmin] = useState<boolean | null>(null);
  const [contactsPage, setContactsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [notesPage, setNotesPage] = useState(1);

  useEffect(() => {
    setIsSuperadmin(getStoredUser()?.role === "superadmin");
  }, []);

  const { data: contacts, isLoading: contactsLoading } = useGetTrashedContactsQuery(
    { page: contactsPage },
    { skip: isSuperadmin !== true }
  );
  const { data: orders, isLoading: ordersLoading } = useGetTrashedOrdersQuery(
    { page: ordersPage },
    { skip: isSuperadmin !== true }
  );
  const { data: users, isLoading: usersLoading } = useGetTrashedUsersQuery(
    { page: usersPage },
    { skip: isSuperadmin !== true }
  );
  const { data: notes, isLoading: notesLoading } = useGetTrashedNotesQuery(
    { page: notesPage },
    { skip: isSuperadmin !== true }
  );

  const [restoreContact] = useRestoreContactMutation();
  const [restoreOrder] = useRestoreOrderMutation();
  const [forceDeleteContact] = useForceDeleteContactMutation();
  const [forceDeleteOrder] = useForceDeleteOrderMutation();
  const [restoreUser] = useRestoreUserMutation();
  const [forceDeleteUser] = useForceDeleteUserMutation();
  const [restoreNote] = useRestoreNoteMutation();
  const [forceDeleteNote] = useForceDeleteNoteMutation();

  const act = async (fn: () => Promise<unknown>, okMessage: string) => {
    try {
      await fn();
      toast.success(okMessage);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Əməliyyat alınmadı.");
    }
  };

  const handleForceDeleteContact = async (id: number) => {
    try {
      await forceDeleteContact(id).unwrap();
      toast.success(`Müştəri #${id} tam silindi.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  const handleForceDeleteOrder = async (id: number) => {
    try {
      await forceDeleteOrder(id).unwrap();
      toast.success(`Sifariş #${id} tam silindi.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  if (isSuperadmin === false) {
    return <p className="text-muted-foreground">Bu bölməyə yalnız superadmin daxil ola bilər.</p>;
  }

  const handleRestoreContact = async (id: number) => {
    try {
      await restoreContact(id).unwrap();
      toast.success(`Müştəri #${id} bərpa olundu.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Bərpa alınmadı.");
    }
  };

  const handleRestoreOrder = async (id: number) => {
    try {
      await restoreOrder(id).unwrap();
      toast.success(`Sifariş #${id} bərpa olundu.`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Bərpa alınmadı.");
    }
  };

  return (
    <>
      <PageHeader
        title="Zibil qutusu"
        description="Silinən müştəri və sifarişlər — buradan bərpa edə bilərsiniz"
      />

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">
            Müştərilər {contacts ? `(${contacts.meta.total})` : ""}
          </TabsTrigger>
          <TabsTrigger value="orders">
            Sifarişlər {orders ? `(${orders.meta.total})` : ""}
          </TabsTrigger>
          <TabsTrigger value="users">
            İstifadəçilər {users ? `(${users.meta.total})` : ""}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Qeydlər {notes ? `(${notes.meta.total})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-poçt</TableHead>
                    <TableHead>Mənbə</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        Yüklənir...
                      </TableCell>
                    </TableRow>
                  )}
                  {contacts?.data.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">#{contact.id}</TableCell>
                      <TableCell>
                        {contact.name} {contact.surname}
                      </TableCell>
                      <TableCell>{contact.phone ?? "—"}</TableCell>
                      <TableCell>{contact.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CHANNEL_LABELS[contact.channel]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreContact(contact.id)}>
                            <ArchiveRestoreIcon />
                            Bərpa et
                          </Button>
                          <ConfirmDelete
                            onConfirm={() => handleForceDeleteContact(contact.id)}
                            title={`Müştəri #${contact.id} TAM silinsin?`}
                            description="Bu əməliyyat geri qaytarıla bilməz — müştəri və qeydləri həmişəlik silinəcək."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {contacts && contacts.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                        Zibil qutusu boşdur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {contacts && contacts.meta.last_page > 1 && (
                <Pagination
                  page={contactsPage}
                  lastPage={contacts.meta.last_page}
                  onChange={setContactsPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Müştəri</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kanal</TableHead>
                    <TableHead className="text-right">Yekun</TableHead>
                    <TableHead>Tarix</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                        Yüklənir...
                      </TableCell>
                    </TableRow>
                  )}
                  {orders?.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>{order.customer ?? "—"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2 text-sm">
                          <span className={`size-2 rounded-full ${STATUS_DOT[order.status]}`} />
                          {STATUS_LABELS[order.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CHANNEL_LABELS[order.channel]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(order.grand_total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreOrder(order.id)}>
                            <ArchiveRestoreIcon />
                            Bərpa et
                          </Button>
                          <ConfirmDelete
                            onConfirm={() => handleForceDeleteOrder(order.id)}
                            title={`Sifariş #${order.id} TAM silinsin?`}
                            description="Bu əməliyyat geri qaytarıla bilməz — sifariş və məhsulları həmişəlik silinəcək."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders && orders.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                        Zibil qutusu boşdur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {orders && orders.meta.last_page > 1 && (
                <Pagination
                  page={ordersPage}
                  lastPage={orders.meta.last_page}
                  onChange={setOrdersPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Ad</TableHead>
                    <TableHead>E-poçt</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        Yüklənir...
                      </TableCell>
                    </TableRow>
                  )}
                  {users?.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">#{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.role === "superadmin" ? "Superadmin" : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              act(
                                () => restoreUser(user.id).unwrap(),
                                `İstifadəçi #${user.id} bərpa olundu.`
                              )
                            }>
                            <ArchiveRestoreIcon />
                            Bərpa et
                          </Button>
                          <ConfirmDelete
                            onConfirm={() =>
                              act(
                                () => forceDeleteUser(user.id).unwrap(),
                                `İstifadəçi #${user.id} tam silindi.`
                              )
                            }
                            title={`İstifadəçi #${user.id} TAM silinsin?`}
                            description="Bu əməliyyat geri qaytarıla bilməz."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users && users.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        Zibil qutusu boşdur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {users && users.meta.last_page > 1 && (
                <Pagination
                  page={usersPage}
                  lastPage={users.meta.last_page}
                  onChange={setUsersPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qeyd</TableHead>
                    <TableHead>Müştəri</TableHead>
                    <TableHead>Müəllif</TableHead>
                    <TableHead>Tarix</TableHead>
                    <TableHead className="w-44" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notesLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        Yüklənir...
                      </TableCell>
                    </TableRow>
                  )}
                  {notes?.data.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="max-w-72 truncate">{note.body}</TableCell>
                      <TableCell>{note.contact?.name ?? "—"}</TableCell>
                      <TableCell>{note.author ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(note.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              act(
                                () => restoreNote(note.id).unwrap(),
                                "Qeyd bərpa olundu."
                              )
                            }>
                            <ArchiveRestoreIcon />
                            Bərpa et
                          </Button>
                          <ConfirmDelete
                            onConfirm={() =>
                              act(
                                () => forceDeleteNote(note.id).unwrap(),
                                "Qeyd tam silindi."
                              )
                            }
                            title="Qeyd TAM silinsin?"
                            description="Bu əməliyyat geri qaytarıla bilməz."
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {notes && notes.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        Zibil qutusu boşdur.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {notes && notes.meta.last_page > 1 && (
                <Pagination
                  page={notesPage}
                  lastPage={notes.meta.last_page}
                  onChange={setNotesPage}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Pagination({
  page,
  lastPage,
  onChange
}: {
  page: number;
  lastPage: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Əvvəlki
      </Button>
      <span className="text-muted-foreground text-sm">
        {page} / {lastPage}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= lastPage}
        onClick={() => onChange(page + 1)}>
        Növbəti
      </Button>
    </div>
  );
}
