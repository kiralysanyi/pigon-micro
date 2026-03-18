import { createBrowserRouter, RouterProvider } from 'react-router'
import IndexPage from './pages/IndexPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import UnlockPage from './pages/UnlockPage'
import NewChat from './pages/NewChat'
import ChatPage from './pages/ChatPage'
import ChatIndex from './pages/ChatIndex'

// TODO: add some kind of auth middleware
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
  }
])

function App() {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
