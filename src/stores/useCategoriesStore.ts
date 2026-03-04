import { create } from "zustand"
import type { Category } from "@/types"
import { mockCategories } from "@/data/mock"

function generateId(prefix: string) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

interface CategoriesState {
  categories: Category[]
  addCategory: (cat: Omit<Category, "id">) => Category
  updateCategory: (id: string, cat: Partial<Omit<Category, "id">>) => void
  deleteCategory: (id: string) => void
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: mockCategories,
  addCategory: (cat) => {
    const id = generateId("cat")
    const newCat = { ...cat, id }
    set((state) => ({ categories: [...state.categories, newCat] }))
    return newCat
  },
  updateCategory: (id, cat) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...cat } : c
      ),
    })),
  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}))
