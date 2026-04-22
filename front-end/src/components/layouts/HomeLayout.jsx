import {Outlet} from "react-router-dom";
import Footer from "../ui/common/Footer.jsx";
import Header from "../ui/common/Header.jsx";

const HomeLayout = () => {
    return (
        <div>
            <Header/>

            <main>
                <Outlet/>
            </main>

            <Footer/>
        </div>
    );
}

export default HomeLayout;