import React from 'react';
import { createRoot } from 'react-dom/client';
import Game from '../app/learning-game';
import '../app/globals.css';
createRoot(document.getElementById('root')!).render(
  <Game basePath="/kebun-bahasa" />,
);
