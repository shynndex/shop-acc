import { BrowserRouter, Route, Routes } from "react-router";
import SigninPage from "./pages/SigninPage";
import SignUpPage from "./pages/SignUpPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/*public routes */}
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<HomePage />} />
          {/*protected routes */}
          <Route path="/" element={<ChatAppPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
//1;20;35
export default App;
