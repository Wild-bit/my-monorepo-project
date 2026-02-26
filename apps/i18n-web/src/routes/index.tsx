import {
  createBrowserRouter,
} from "react-router-dom";
import { MainLayout } from "../components/layouts/MainLayout";
import { HomePage } from "../modules/home/pages/HomePage";
import { LoginPage } from "../modules/login/pages/LoginPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);

export default router;