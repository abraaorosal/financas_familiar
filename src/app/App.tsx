import { AppBootstrap } from './providers/AppBootstrap';
import { AppRouter } from './router';

export default function App() {
  return (
    <AppBootstrap>
      <AppRouter />
    </AppBootstrap>
  );
}
