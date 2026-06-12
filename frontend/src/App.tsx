import { useState, useEffect } from 'react';
import './App.css';
import { useAuthStore } from './store/useAuthStore';
import AuthPage from './pages/AuthPage';
import BoardPage from './pages/BoardPage';
import Navbar from './components/Navbar';

function App() {
  const { token, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    setIsLoading(false);
  }, [checkAuth]);

  if (isLoading) {
    return <div className="app-container flex-center">Loading...</div>;
  }

  return (
    <div className="app-container">
      {token && <Navbar />}
      <main className="main-content">
        {token ? <BoardPage /> : <AuthPage />}
      </main>
    </div>
  );
}

export default App;
