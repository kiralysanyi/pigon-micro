import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import IndexPage from './pages/IndexPage'
import TestPage from './pages/TestPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

const router = createBrowserRouter([
  {
    index: true,
    path: "/",
    Component: IndexPage
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
    path: "/test",
    Component: TestPage
  }
])

function App() {
  return <RouterProvider router={router}></RouterProvider>
}

export default App
