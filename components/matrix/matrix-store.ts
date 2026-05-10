// components/matrix/matrix-store.ts
import { create } from "zustand";

interface MatrixState {
  selectedNodeId: string | null;
  setSelectedNode: (id: string | null) => void;
}

export const useMatrixStore = create<MatrixState>((set) => ({
  selectedNodeId: null,
  setSelectedNode: (id) => set({ selectedNodeId: id }),
}));