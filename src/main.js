
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Updated import path
import './index.css';

createRoot(document.getElementById("root")).render(React.createElement(App));
