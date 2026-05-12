import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import {ThemeProvider} from './context/ThemeContext.tsx';
import {LanguageProvider} from './context/LanguageContext.tsx';
import {UserProvider} from './context/UserContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
