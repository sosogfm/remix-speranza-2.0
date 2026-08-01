import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Aba "Acessos": concede e remove acesso de administração por e-mail */
export const AdminAccess = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin-access"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_admins");
      if (error) throw error;
      return data ?? [];
    },
  });

  const grant = async () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("grant_admin_by_email", { _email: value });
    setSaving(false);
    if (error) {
      toast({ title: "Não foi possível liberar", description: error.message, variant: "destructive" });
      return;
    }
    setEmail("");
    qc.invalidateQueries({ queryKey: ["admin-access"] });
    toast({ title: "Acesso liberado" });
  };

  const revoke = async (userId: string) => {
    const { error } = await supabase.rpc("revoke_admin", { _user_id: userId });
    if (error) {
      toast({ title: "Não foi possível remover", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-access"] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 max-w-xl">
        <h2 className="font-serif text-2xl">Liberar acesso de administração</h2>
        <p className="text-sm text-muted-foreground">
          A pessoa precisa já ter criado uma conta no site com este e-mail.
        </p>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-none h-11"
          />
          <Button onClick={grant} disabled={saving} className="rounded-none h-11 px-6">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Liberar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a: any) => (
              <TableRow key={a.user_id}>
                <TableCell>{a.email}</TableCell>
                <TableCell>
                  {a.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-none text-destructive"
                      onClick={() => revoke(a.user_id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Remover
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
