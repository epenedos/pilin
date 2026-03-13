import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { IncomePage } from './pages/IncomePage';
import { RecurringPage } from './pages/RecurringPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SankeyPage } from './pages/SankeyPage';
import { ForecastPage } from './pages/ForecastPage';
import { CategoriesPage } from './pages/CategoriesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/recurring" element={<RecurringPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/sankey" element={<SankeyPage />} />
            <Route path="/forecast" element={<ForecastPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
