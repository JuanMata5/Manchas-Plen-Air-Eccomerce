"use client"

import { useEffect, useState } from "react";
import { useUser } from "@/components/user-provider";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PerfilPage() {
  const { user, isLoading } = useUser();
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.dni) {
      setDni(user.user_metadata.dni);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{7,10}$/.test(dni)) {
      toast.error("DNI inválido. Debe tener entre 7 y 10 dígitos numéricos.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { dni } });
    setLoading(false);
    if (error) {
      toast.error("Error al guardar DNI");
    } else {
      toast.success("DNI actualizado correctamente");
    }
  };

  if (isLoading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="font-serif text-2xl font-bold mb-6">Mi perfil</h1>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label htmlFor="dni" className="block mb-1 font-medium">DNI</label>
          <Input
            id="dni"
            value={dni}
            onChange={e => setDni(e.target.value)}
            placeholder="Ej: 12345678"
            inputMode="numeric"
            pattern="[0-9]*"
            minLength={7}
            maxLength={10}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
      </form>
      <div className="mt-6 text-sm text-muted-foreground">
        Si tu cuenta fue creada antes del 2026, por favor completa tu DNI para poder comprar y recibir tus tickets correctamente.
      </div>
    </div>
  );
}
