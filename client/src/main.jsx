import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import SignInPage from "./pages/SignInPage.jsx";
import SignupPage from "./pages/SignUpPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";
import CodingSpacePage from "./pages/CodingSpacePage.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store/store.js";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <SignInPage /> },
      { path: "/signup", element: <SignupPage /> },
      { path: "/workspaces", element: <WorkspacePage /> },
      { path: "/workspace/:workspaceId", element: <CodingSpacePage /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
    <Provider store={store}>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      >
        <RouterProvider router={router} />
      </ClerkProvider>
    </Provider>
);
