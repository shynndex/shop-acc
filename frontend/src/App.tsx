import { BrowserRouter, Route, Routes } from "react-router-dom";
import SigninPage from "./pages/SigninPage";
import SignUpPage from "./pages/SignUpPage";
import { Toaster } from "sonner";
import HomePage from "./pages/HomePage";
import AppLayout from "./components/layout/AppLayout";
function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          {/*public routes */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="signin" element={<SigninPage />} />
            <Route path="signup" element={<SignUpPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
export default App;
