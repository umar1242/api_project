import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RegistrationForm } from './pages/RegistrationForm';

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/register/:refLink" element={<RegistrationForm />} />
          <Route path="*" element={<Navigate to="/register/invalid" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
