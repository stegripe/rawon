import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "./index.css";
import { ReactComponent as Spinner } from "./spinner.svg";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy, ComponentProps } from "react";
import ReactDOM from "react-dom";

const Index = lazy(() => import("./mainpage"));
const Script = lazy(() => import("./script"));
const PermsCalculator = lazy(() => import("./permscalculator"));

function SUS_PENSE(props: ComponentProps<"div">) {
    return (
        <Suspense fallback={<div className="flex justify-center items-center min-w-full h-screen text-base md:text-xl font-bold dark:bg-gray-900 dark:text-white"><div className="m-2"><Spinner /></div><p>Loading...</p></div>}>
            {props.children}
        </Suspense>
    )
}

const routes = (
    <HashRouter>
        <Navbar/>
        <Routes>
            <Route path="/" element={<SUS_PENSE><Index /></SUS_PENSE>}/>
            <Route path="/script" element={<SUS_PENSE><Script /></SUS_PENSE>}/>
            <Route path="/permscalculator" element={<SUS_PENSE><PermsCalculator /></SUS_PENSE>}/>
        </Routes>
        <Footer/>
    </HashRouter>
)

ReactDOM.render(routes, document.getElementById("root"));
