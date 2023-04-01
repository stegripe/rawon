import "./index.css";
import Footer from "./components/Footer";
// import Navbar from "./components/Navbar";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy, ComponentProps } from "react";
import ReactDOM from "react-dom";
import Script from "./script";

const Index = lazy(() => import("./mainpage"));
const PermsCalculator = lazy(() => import("./permscalculator"));
const EmbedVisualizer = lazy(() => import("./embedvisualizer"));

// Amogus
function SusPense(props: ComponentProps<"div">): JSX.Element {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-w-full h-screen text-base md:text-xl font-bold">
                    <div className="m-2">
                        <svg
                            className="animate-spin mr-3 h-5 w-5 text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                    <p>Loading...</p>
                </div>
            }
        >
            {props.children}
        </Suspense>
    );
}

function RawonRoutes(): JSX.Element {
    return (
        <HashRouter>
            {/* <Navbar/> */}
            <Routes>
                <Route
                    path="/"
                    element={
                        <SusPense>
                            <Index />
                        </SusPense>
                    }
                />
                <Route
                    path="/permscalculator"
                    element={
                        <SusPense>
                            <PermsCalculator />
                        </SusPense>
                    }
                />
                <Route
                    path="/embedvisualizer"
                    element={
                        <SusPense>
                            <EmbedVisualizer />
                        </SusPense>
                    }
                />
                <Route
                    path="/script"
                    element={
                        <SusPense>
                            <Script />
                        </SusPense>
                    }
                />
            </Routes>
            <Footer />
        </HashRouter>
    );
}

ReactDOM.render(<RawonRoutes />, document.getElementById("root"));
