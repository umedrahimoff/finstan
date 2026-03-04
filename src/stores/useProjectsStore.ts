import { create } from "zustand"
import type { Project } from "@/types"
import { mockProjects } from "@/data/mockProjects"

function generateId() {
  return "prj-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9)
}

interface ProjectsState {
  projects: Project[]
  addProject: (p: Omit<Project, "id">) => Project
  updateProject: (id: string, p: Partial<Omit<Project, "id">>) => void
  deleteProject: (id: string) => void
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: mockProjects,
  addProject: (p) => {
    const id = generateId()
    const newProject = { ...p, id }
    set((state) => ({ projects: [...state.projects, newProject] }))
    return newProject
  },
  updateProject: (id, p) =>
    set((state) => ({
      projects: state.projects.map((x) => (x.id === id ? { ...x, ...p } : x)),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((x) => x.id !== id),
    })),
}))
