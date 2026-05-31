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
      },
      {
        path: "/chat/:id/call",
        Component: CallUI
      }
    ]
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
  return <RouterProvider router={router}></RouterProvider>
}

export default App
