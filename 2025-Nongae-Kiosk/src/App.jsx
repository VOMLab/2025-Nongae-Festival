import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Photo from './pages/Photo';
import Generation from './pages/Generation';
import Result from './pages/Result';
import PrintResult from './pages/PrintResult';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/photo" element={<Photo />} />
        <Route path="/generation" element={<Generation />} />
        <Route path="/result" element={<Result />} />
        <Route path="/print-result" element={<PrintResult />} />
      </Routes>
    </div>
  );
}

export default App; 