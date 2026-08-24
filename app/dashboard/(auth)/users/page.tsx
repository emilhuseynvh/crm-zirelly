"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  useCreateCrmUserMutation,
  useDeleteCrmUserMutation,
  useGetCrmUsersQuery,
  useUpdateCrmUserMutation
} from "@/lib/api/crm";
import type { CrmSection, User } from "@/lib/api/types";
import { SECTION_LABELS, formatDateTime, getStoredUser } from "@/lib/crm";

const ALL_SECTIONS = Object.keys(SECTION_LABELS) as CrmSection[];

export default function UsersPage() {
  const { data, isLoading } = useGetCrmUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateCrmUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateCrmUserMutation();
  const [deleteUser] = useDeleteCrmUserMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<CrmSection[]>(["dashboard", "orders"]);
  const [isActive, setIsActive] = useState(true);
  const [myId, setMyId] = useState<number | null>(null);

  useEffect(() => {
    setMyId(getStoredUser()?.id ?? null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setEmail(editing?.email ?? "");
    setPassword("");
    setPermissions(editing?.permissions ?? ["dashboard", "orders"]);
    setIsActive(editing?.is_active ?? true);
  }, [open, editing]);

  const togglePermission = (section: CrmSection) => {
    setPermissions((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (editing) {
        await updateUser({
          id: editing.id,
          name,
          email,
          ...(password ? { password } : {}),
          permissions,
          is_active: isActive
        }).unwrap();
        toast.success("İstifadəçi yeniləndi.");
      } else {
        await createUser({ name, email, password, permissions }).unwrap();
        toast.success("İstifadəçi yaradıldı.");
      }

      setOpen(false);
      setEditing(null);
    } catch (err: any) {
      const firstError = err?.data?.errors
        ? (Object.values(err.data.errors)[0] as string[])?.[0]
        : null;
      toast.error(firstError ?? err?.data?.message ?? "Əməliyyat alınmadı.");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id).unwrap();
      toast.success("İstifadəçi silindi.");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Silinmə alınmadı.");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="İstifadəçilər"
          description="CRM istifadəçiləri, rollar və icazələr"
        />
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}>
          <PlusIcon />
          Yeni istifadəçi
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>E-poçt</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>İcazələr</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Son giriş</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "superadmin" ? "default" : "secondary"}>
                      {user.role === "superadmin" ? "Superadmin" : "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {user.role === "superadmin" ? (
                      <span className="text-muted-foreground text-sm">Tam giriş</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((section) => (
                          <Badge key={section} variant="outline">
                            {SECTION_LABELS[section]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="outline" className="text-green-600">
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Deaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(user.last_login_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(user);
                          setOpen(true);
                        }}>
                        <PencilIcon />
                      </Button>
                      {user.role !== "superadmin" && user.id !== myId && (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(user)}
                          title="İstifadəçini silmək istəyirsiniz?"
                          description="İstifadəçinin girişi dərhal bağlanacaq."
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "İstifadəçini redaktə et" : "Yeni istifadəçi"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Ad</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>E-poçt</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{editing ? "Yeni şifrə (dəyişmirsə boş saxlayın)" : "Şifrə"}</Label>
              <Input
                type="password"
                required={!editing}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 simvol, hərf və rəqəm"
              />
            </div>

            {editing?.role !== "superadmin" && (
            <div className="space-y-1.5">
              <Label>Bölmə icazələri</Label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                {ALL_SECTIONS.map((section) => (
                  <label key={section} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={permissions.includes(section)}
                      onCheckedChange={() => togglePermission(section)}
                    />
                    {SECTION_LABELS[section]}
                  </label>
                ))}
              </div>
            </div>
            )}

            {editing && editing.id !== myId && (
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Aktiv</Label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={creating || updating}>
              {creating || updating ? "Yadda saxlanır..." : "Yadda saxla"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
