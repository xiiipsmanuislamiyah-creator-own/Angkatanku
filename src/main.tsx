import {StrictMode, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {MotionConfig} from 'motion/react';
import './index.css';
import './styles/community.css';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';

function SessionBoundary(){const {user}=useAuth();const previous=useRef<string|null>(null),epoch=useRef(0);if(previous.current&&previous.current!==user?.uid)epoch.current++;previous.current=user?.uid||null;return <App key={epoch.current}/>;}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MotionConfig reducedMotion="user"><SessionBoundary /></MotionConfig>
    </AuthProvider>
  </StrictMode>,
);
