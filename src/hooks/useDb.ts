import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { prefs } from "@/lib/prefs";
import { type Causa, type Cliente, type Tarea, type Vencimiento } from "@/lib/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AUTO_REFRESH_MS = 60_000;

// Reactive read of the "autoRefresh" preference → refetchInterval for queries.
function useAutoRefreshInterval(): number | false {
  const [on, setOn] = useState(() => prefs.get("autoRefresh"));
  useEffect(() => prefs.subscribe((p) => setOn(p.autoRefresh)), []);
  return on ? AUTO_REFRESH_MS : false;
}

export function useCausas() {
  return useQuery({
    queryKey: ["causas"],
    refetchInterval: useAutoRefreshInterval(),
    queryFn: async () => {
      await delay(150);
      return db.getCausas();
    },
  });
}

export function useAddCausa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaCausa: Causa) => {
      await delay(100);
      const causas = await db.getCausas();
      await db.setCausas([...causas, nuevaCausa]);
      return nuevaCausa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["causas"] });
    },
  });
}

export function useUpdateCausa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (causaActualizada: Causa) => {
      await delay(100);
      const causas = await db.getCausas();
      const updated = causas.map((c) => (c.id === causaActualizada.id ? causaActualizada : c));
      await db.setCausas(updated);
      return causaActualizada;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["causas"] });
      queryClient.invalidateQueries({ queryKey: ["causa", variables.id] });
    },
  });
}

export function useDeleteCausa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(100);
      await db.deleteCausa(id);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["causas"] });
      queryClient.removeQueries({ queryKey: ["causa", id] });
    },
  });
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    refetchInterval: useAutoRefreshInterval(),
    queryFn: async () => {
      await delay(150);
      return db.getClientes();
    },
  });
}

export function useAddCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevoCliente: Cliente) => {
      await delay(100);
      const clientes = await db.getClientes();
      await db.setClientes([...clientes, nuevoCliente]);
      return nuevoCliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clienteActualizado: Cliente) => {
      await delay(100);
      const clientes = await db.getClientes();
      const updated = clientes.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c));
      await db.setClientes(updated);
      return clienteActualizado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(100);
      await db.deleteCliente(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useTareas() {
  return useQuery({
    queryKey: ["tareas"],
    refetchInterval: useAutoRefreshInterval(),
    queryFn: async () => {
      await delay(100);
      return db.getTareas();
    },
  });
}

export function useAddTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevaTarea: Tarea) => {
      await delay(100);
      const tareas = await db.getTareas();
      await db.setTareas([...tareas, nuevaTarea]);
      return nuevaTarea;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      queryClient.invalidateQueries({ queryKey: ["causas"] });
    },
  });
}

export function useUpdateTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tareaActualizada: Tarea) => {
      await delay(100);
      const tareas = await db.getTareas();
      const updated = tareas.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t));
      await db.setTareas(updated);
      return tareaActualizada;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
    },
  });
}

export function useDeleteTarea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(100);
      await db.deleteTarea(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
      queryClient.invalidateQueries({ queryKey: ["causas"] });
    },
  });
}

export function useVencimientos() {
  return useQuery({
    queryKey: ["vencimientos"],
    refetchInterval: useAutoRefreshInterval(),
    queryFn: async () => {
      await delay(150);
      return db.getVencimientos();
    },
  });
}

export function useAddVencimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nuevoVencimiento: Vencimiento) => {
      await delay(100);
      const vencimientos = await db.getVencimientos();
      await db.setVencimientos([...vencimientos, nuevoVencimiento]);
      return nuevoVencimiento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
}

export function useDeleteVencimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(100);
      await db.deleteVencimiento(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vencimientos"] });
    },
  });
}

export function useCausa(id: string) {
  return useQuery({
    queryKey: ["causa", id],
    refetchInterval: useAutoRefreshInterval(),
    queryFn: async () => {
      await delay(100);
      const causas = await db.getCausas();
      return causas.find((c) => c.id === id) || null;
    },
  });
}

