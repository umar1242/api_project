import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RegistrationForm } from './pages/RegistrationForm';

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RegistrationForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
