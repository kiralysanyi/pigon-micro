import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import IndexPage from './pages/IndexPage'
import TestPage from './pages/TestPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupPage from './pages/SetupPage'
import UnlockPage from './pages/UnlockPage'
import NewChat from './pages/NewChat'
import ChatPage from './pages/ChatPage'

// TODO: add some kind of auth middleware
const router = createBrowserRouter([
  {
    path: "/",
    Component: IndexPage,
    children: [
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
    path: "/test",
    Component: TestPage
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
