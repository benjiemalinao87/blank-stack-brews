
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx'; // Make sure we're importing the correct file
import './index.css';

createRoot(document.getElementById("root")).render(React.createElement(App));
