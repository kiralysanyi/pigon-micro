import { createBrowserRouter, RouterProvider } from 'react-router'
import IndexPage from './pages/IndexPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import UnlockPage from './pages/UnlockPage'
import NewChat from './pages/NewChat'
import ChatPage from './pages/ChatPage'
import ChatIndex from './pages/ChatIndex'
import AccountPage from './pages/AccountPage'
import ChatSettingsPage from './pages/ChatSettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import CallUI from './pages/CallUI'
import { useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify';

const router = createBrowserRouter([
  {
    path: "/",
    Component: IndexPage,
    children: [
      {
        path: "/",
        Component: ChatIndex,
        index: true
      },
      {
        path: "/chat/:id",
        Component: ChatPage
      }
    ]
  },
  {
    path: "/chat/:id/call",
    Component: CallUI
  },
  {
    path: "/settings/:id",
    Component: ChatSettingsPage
  },
  {
    path: "/account",
    Component: AccountPage
  },
  {
    path: "/login",
    Component: LoginPage
  },
  {
    path: "/register",
    Component: RegisterPage
  },
  {
    path: "/setup",
    Component: SetupPage
  },
  {
    path: "/unlock",
    Component: UnlockPage
  },
  {
    path: "/newchat",
    Component: NewChat
  },
  {
    path: "*",
    Component: NotFoundPage
  }
])

function App() {
  useEffect(() => {
    const handleNetworkError = () => toast.error("Check your internet connection");
    const handleServerError = () => toast.error("Server error - try again later");
    const handleForbidden = () => toast.error("You don't have permission");
    const handleErrorMessage = (e: Event) => {
      const event: CustomEvent = e as CustomEvent;
      toast.error(`Error: ${event.detail.message}`);
    };

    const handleInfoMessage = (e: Event) => {
      const event: CustomEvent = e as CustomEvent;
      toast.info(event.detail.message);
    }

    window.addEventListener("api:network-error", handleNetworkError);
    window.addEventListener("api:server-error", handleServerError);
    window.addEventListener("api:forbidden", handleForbidden);
    window.addEventListener("api:error", handleErrorMessage);
    window.addEventListener("api:info", handleInfoMessage);
    return () => {
      window.removeEventListener("api:network-error", handleNetworkError);
      window.removeEventListener("api:server-error", handleServerError);
      window.removeEventListener("api:forbidden", handleForbidden);
      window.removeEventListener("api:error", handleErrorMessage);
      window.removeEventListener("api:info", handleInfoMessage);
    };
  }, []);
  return <>
    <RouterProvider router={router}></RouterProvider>
    <ToastContainer
      position="bottom-left"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      toastClassName="toast"
    />
  </>
}

export default App
