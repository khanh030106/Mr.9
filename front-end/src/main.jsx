import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/Global.css"
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import App from './App.jsx'
import {AuthProvider} from "./contexts/AuthContext.jsx";
import {CartProvider} from "./contexts/CartContext.jsx";

const queryClient = new QueryClient({
    defaultOptions: {
        queries:{
            retry:1,
            staleTime:30_000,
            refetchOnWindowFocus:false
        },
    },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <QueryClientProvider client={queryClient}>
          <AuthProvider>
              <CartProvider>
                  <App/>
              </CartProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false}/>
      </QueryClientProvider>
  </StrictMode>,
)
