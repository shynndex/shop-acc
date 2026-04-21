import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import { clientRoutes } from "./routes/clientRoute";
import { adminRoutes } from "./routes/adminRoute";

const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen text-gray-500">
    Đang tải trang...
  </div>
);

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {clientRoutes}
            {adminRoutes}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;
