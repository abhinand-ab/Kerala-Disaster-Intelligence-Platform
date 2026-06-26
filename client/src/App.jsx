import HomePage from "./pages/Home/HomePage";
import useSocket from "./hooks/useSocket";

function App() {
  useSocket();

  return <HomePage />;
}

export default App;