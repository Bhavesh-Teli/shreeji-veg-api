import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './components/auth/Login'
import Layout from './components/Layout'
import { ConfigProvider } from 'antd'
import Register from './components/auth/Register'
import UserListToApprove from './components/admin/UserListToApprove'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import AllVeges from './components/vegetable/AllVeges'
import AllFavorites from './components/vegetable/AllFavorites'
import i18n from './i18n';
import SelectLanguage from './components/auth/SelectLanguage'
import AllOrders from './components/orders/AllOrders'
import ViewOrders from './components/orders/ViewOrders'
import OrderPDF from './components/orders/OrderPDF'
import Notifications from './components/notification/Notifications'
import { I18nextProvider } from 'react-i18next';
import ForgotPassword from './components/auth/ForgotPassword'
import UserList from './components/admin/UserList'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [

      {
        path: "/",
        element: <ViewOrders />
      },
      {
        path: "/favourites",
        element: <AllFavorites />
      },
      {
        path: "/user/approve",
        element:
          (
            <ProtectedAdminRoute>
              <UserListToApprove />
            </ProtectedAdminRoute>
          )
      },
      {
        path: "/user/list",
        element:
          (
            <ProtectedAdminRoute>
              <UserList />
            </ProtectedAdminRoute>
          )
      },
      {
        path: "/all/veges",
        element: <AllVeges />
      },
      {
        path: "/select-language",
        element: <SelectLanguage />
      },
      {
        path: "/add-orders",
        element: <AllOrders />
      },
      {
        path: "/notification",
        element:
          (
            <ProtectedAdminRoute>
              <Notifications />
            </ProtectedAdminRoute>
          )
      },
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },
  {
    path: "/select-language1",
    element: <SelectLanguage />
  },
  {
    path: "/orderpdf",
    element: <OrderPDF orderData={{ /* Add appropriate data here */ }} />
  },


])

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#46cb4c',
            borderRadius: 16,
            fontFamily: "Rubik",
            colorPrimaryBg: "#ebf2ed",
            colorBgLayout: "White",
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </I18nextProvider>
  </Provider >
  // </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(
      registration => {
        console.log('✅ Service Worker registered:', registration);
      },
      err => {
        console.log('❌ Service Worker registration failed:', err);
      }
    );
  });
}
