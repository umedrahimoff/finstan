import { createBrowserRouter, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppLayout } from "@/layouts/AppLayout"
import { LandingPage } from "@/pages/LandingPage"
import { TermsPage } from "@/pages/TermsPage"
import { PrivacyPage } from "@/pages/PrivacyPage"
import { LoginPage } from "@/pages/LoginPage"
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
import { SettingsUsersPage } from "@/pages/settings/SettingsUsersPage"
import { SettingsGeneralPage } from "@/pages/settings/SettingsGeneralPage"
import { SettingsDataPage } from "@/pages/settings/SettingsDataPage"
import { SettingsAboutPage } from "@/pages/settings/SettingsAboutPage"
import { SettingsTelegramPage } from "@/pages/settings/SettingsTelegramPage"
import { ManagementPage } from "@/pages/ManagementPage"

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "management", element: <ManagementPage /> },
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
          { index: true, element: <Navigate to="/app/settings/profile" replace /> },
          { path: "profile", element: <SettingsProfilePage /> },
          { path: "users", element: <SettingsUsersPage /> },
          { path: "telegram", element: <SettingsTelegramPage /> },
          { path: "general", element: <SettingsGeneralPage /> },
          { path: "data", element: <SettingsDataPage /> },
          { path: "about", element: <SettingsAboutPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/app" replace /> },
])
