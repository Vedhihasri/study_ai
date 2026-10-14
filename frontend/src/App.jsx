import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicOnlyRoute from './components/layout/PublicOnlyRoute';
import AppLayout from './components/layout/AppLayout';
import Tutor from "./pages/Tutor";
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Documents from './pages/Documents';
import DocumentDetails from './pages/DocumentDetails';
import Notes from './pages/Notes';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import Exam from './pages/Exam';
import Analytics from './pages/Analytics';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>

          {/* Public Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AppLayout />}>

              <Route index element={<Dashboard />} />

              <Route path="chat" element={<Chat />} />

              <Route path="documents" element={<Documents />} />

              <Route
                path="documents/:documentId"
                element={<DocumentDetails />}
              />

              <Route path="notes" element={<Notes />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="quiz" element={<Quiz />} />
              <Route path="exam" element={<Exam />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="search" element={<Search />} />
              <Route path="settings" element={<Settings />} />
              <Route path="/tutor" element={<Tutor />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Login />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;