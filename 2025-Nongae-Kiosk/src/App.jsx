import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Photo from './pages/Photo';
import Generation from './pages/Generation';
import Result from './pages/Result';
import PrintResult from './pages/PrintResult';
import socketService from './services/socketService';
import ImagePreloader from './components/ImagePreloader';

function App() {
  useEffect(() => {
    const connectSocket = async () => {
      await socketService.connect();
    }

    connectSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);
  return (
    <div className="app">
      <ImagePreloader />
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