import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { GuestRoute } from '@/components/GuestRoute'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { MapPage } from '@/pages/MapPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { NearbyPage } from '@/pages/NearbyPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { TypesPage } from '@/pages/TypesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ActivityAddPage } from '@/pages/ActivityAddPage'
import { ActivityEditPage } from '@/pages/ActivityEditPage'
import { ActivityDetailPage } from '@/pages/ActivityDetailPage'
import { useAuthStore } from '@/stores/authStore'

let authBootstrapStarted = false

function App() {
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!authBootstrapStarted) {
      authBootstrapStarted = true
      void useAuthStore.getState().init()
    }
  }, [])

  if (!initialized) {
    return (
      <div className="boot-screen">
        <div className="boot-panel">
          <p className="eyebrow">TasteSpot Web</p>
          <h1>Sto preparando la sessione.</h1>
          <p className="muted">Verifico il token Laravel e carico la shell dell'app.</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MapPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="nearby" element={<NearbyPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="private/types" element={<TypesPage />} />
          <Route path="activity/add" element={<ActivityAddPage />} />
          <Route path="activity/:id" element={<ActivityDetailPage />} />
          <Route path="activity/:id/edit" element={<ActivityEditPage />} />
        </Route>
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
