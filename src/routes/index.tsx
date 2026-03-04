import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/layouts/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { AuthCallbackPage } from "@/pages/AuthCallbackPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { TransactionsPage } from "@/pages/TransactionsPage"
import { AccountsPage } from "@/pages/AccountsPage"
import { CategoriesPage } from "@/pages/CategoriesPage"
import { CounterpartiesPage } from "@/pages/CounterpartiesPage"
import { CalendarPage } from "@/pages/CalendarPage"
import { BudgetsPage } from "@/pages/BudgetsPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { AnalyticsPage } from "@/pages/AnalyticsPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { SettingsProfilePage } from "@/pages/settings/SettingsProfilePage"
import { SettingsGeneralPage } from "@/pages/settings/SettingsGeneralPage"
import { SettingsDataPage } from "@/pages/settings/SettingsDataPage"
import { SettingsUsersPage } from "@/pages/settings/SettingsUsersPage"
import { SettingsAboutPage } from "@/pages/settings/SettingsAboutPage"

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/auth", element: <AuthCallbackPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "counterparties", element: <CounterpartiesPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "budgets", element: <BudgetsPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "projects", element: <ProjectsPage /> },
      {
        path: "settings",
        element: <SettingsPage />,
        children: [
          { index: true, element: <Navigate to="/settings/profile" replace /> },
          { path: "profile", element: <SettingsProfilePage /> },
          { path: "general", element: <SettingsGeneralPage /> },
          { path: "data", element: <SettingsDataPage /> },
          { path: "users", element: <SettingsUsersPage /> },
          { path: "about", element: <SettingsAboutPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
])
