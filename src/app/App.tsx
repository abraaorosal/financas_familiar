import { AppBootstrap } from './providers/AppBootstrap';
import { AppRouter } from './router';
import { CloudAuthProvider } from '@/sync/CloudAuthContext';

export default function App() {
  return (
    <CloudAuthProvider>
      <AppBootstrap>
        <AppRouter />
      </AppBootstrap>
    </CloudAuthProvider>
  );
}
