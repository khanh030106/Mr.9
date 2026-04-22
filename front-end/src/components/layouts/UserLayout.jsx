import Header from "../ui/common/Header.jsx";
import {Outlet} from "react-router-dom";
import Footer from "../ui/common/Footer.jsx";
import {useEffect} from "react";


const UserLayout = () => {

    useEffect(() => {
        document.title = "BookStore";
    }, []);

 return (
     <>
         <Header/>

         <main>
             <Outlet/>
         </main>

         <Footer/>
     </>
 );
}

export default UserLayout;