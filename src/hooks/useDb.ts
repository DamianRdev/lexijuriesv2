import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { type Causa, type Cliente, type Tarea, type Vencimiento } from "@/lib/mockData";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useCausas() {
  return useQuery({
    queryKey: ["causas"],
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
      const causas = db.getCausas();
      db.setCausas([...causas, nuevaCausa]);
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
      const causas = db.getCausas();
      const updated = causas.map((c) => (c.id === causaActualizada.id ? causaActualizada : c));
      db.setCausas(updated);
      return causaActualizada;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["causas"] });
      queryClient.invalidateQueries({ queryKey: ["causa", variables.id] });
    },
  });
}

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
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
      const clientes = db.getClientes();
      db.setClientes([...clientes, nuevoCliente]);
      return nuevoCliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useTareas() {
  return useQuery({
    queryKey: ["tareas"],
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
      const tareas = db.getTareas();
      db.setTareas([...tareas, nuevaTarea]);
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
      const tareas = db.getTareas();
      const updated = tareas.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t));
      db.setTareas(updated);
      return tareaActualizada;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tareas"] });
    },
  });
}

export function useVencimientos() {
  return useQuery({
    queryKey: ["vencimientos"],
    queryFn: async () => {
      await delay(150);
      return db.getVencimientos();
    },
  });
}

export function useCausa(id: string) {
  return useQuery({
    queryKey: ["causa", id],
    queryFn: async () => {
      await delay(100);
      const causas = db.getCausas();
      return causas.find((c) => c.id === id) || null;
    },
  });
}
