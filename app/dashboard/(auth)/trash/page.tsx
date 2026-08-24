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
  useForceDeleteOrderMutation,
  useGetTrashedContactsQuery,
  useGetTrashedOrdersQuery,
  useRestoreContactMutation,
  useRestoreOrderMutation
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

  const [restoreContact] = useRestoreContactMutation();
  const [restoreOrder] = useRestoreOrderMutation();
  const [forceDeleteContact] = useForceDeleteContactMutation();
  const [forceDeleteOrder] = useForceDeleteOrderMutation();

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
