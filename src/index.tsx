import { ReactComponent as DiscSVG } from "./disc-11.svg";
import PermsCalculator from "./permscalculator";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import Script from "./script";
import "./index.css";
import { HashRouter, Route, Switch } from "react-router-dom";
import ReactDOM from "react-dom";

function Index() {
    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <div className="grid grid-cols-1 grid-rows-2 gap-3 text-center">
                <DiscSVG className="flex justify-self-center h-32 md:h-48 w-auto rounded-full" />
                <p className="text-sm font-bold dark:text-white m-5">Welcome to Disc 11 website. We haven't added anything for this page. For now, you can use the tools made by us to help you develop your own Disc 11 discord bot.</p>
            </div>
        </div>
    );
}

const routes = (
    <HashRouter>
        <Navbar/>
        <Switch>
            <Route exact path="/" component={Index}/>
            <Route path="/script" component={Script}/>
            <Route path="/permscalculator" component={PermsCalculator}/>
        </Switch>
        <Footer/>
    </HashRouter>
)

ReactDOM.render(routes, document.getElementById("root"));
