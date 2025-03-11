import './styles/TemplateEditor.css';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Add your main application components here */}
      <div>Your main application content goes here</div>
    </AuthProvider>
  );
}

export default App;