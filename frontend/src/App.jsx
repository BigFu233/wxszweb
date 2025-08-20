import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import UserManagement from './pages/UserManagement';
import TaskManagement from './pages/TaskManagement';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import AdminSettings from './pages/AdminSettings';
import AssetManagement from './pages/AssetManagement';
import WorkDetail from './pages/WorkDetail';
import AdminWorkDetail from './pages/AdminWorkDetail';
import ChangePassword from './pages/ChangePassword';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/tasks" element={<TaskManagement />} />
            <Route path="/admin/assets" element={<AssetManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/works/:id" element={<AdminWorkDetail />} />
            <Route path="/works/:id" element={<WorkDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
