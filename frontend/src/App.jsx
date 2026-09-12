import './App.css';
import { Outlet } from 'react-router-dom';

function App() {
  return (
    <div className="app-glass-theme">
      <Outlet />
    </div>
  );
}

export default App;
