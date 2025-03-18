import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Topbar from './Topbar.jsx';
import Login from './Login.jsx';
import News from './News.jsx';
import UserPannel from './UserPannel.jsx'
function App() {
  return (
    <Router>
      <Topbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user-pannel" element={<UserPannel />} />
        <Route path="/news" element={<News />} />
      </Routes>
    </Router>
  );
}

export default App;
