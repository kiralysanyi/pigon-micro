import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import IndexPage from './pages/IndexPage'
import TestPage from './pages/TestPage'

const router = createBrowserRouter([
  {
    index: true,
    path: "/",
    Component: IndexPage
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
