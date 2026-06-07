import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { store } from './store';
import App from './App';

import './styles/global.css';
import './styles/layouts/main-layout.css';
import './styles/components/chat.css';
import './styles/components/drawing-canvas.css';
import './styles/components/pallete.css';
import './styles/components/header.css';
import './styles/components/rooms-list.css';
import './styles/components/user-modal.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);