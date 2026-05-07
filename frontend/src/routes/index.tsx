import { createBrowserRouter, createRoutesFromElements } from "react-router";
import { clientRoutes } from "./clientRoute";
import { adminRoutes } from "./adminRoute";
import { RouterProvider } from "react-router-dom";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {clientRoutes}
      {adminRoutes}
    </>
  )
);
export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
