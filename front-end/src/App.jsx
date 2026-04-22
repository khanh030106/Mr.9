import AppRoutes from './routes/AppRoutes.jsx'
import {Toaster} from "react-hot-toast";

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={12}
                containerStyle={{top: 80}}
                toastOptions={{
                    duration: 2500,
                    style: {
                        borderRadius: "12px",
                        background: "#fff",
                        color: "#1f2937",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        padding: "12px 16px",
                        fontSize: "14px"
                    }
                }}
            />
            <AppRoutes/>
        </>
    );
}

export default App