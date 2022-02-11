import { ReactComponent as RawonSVG } from "./rawon.svg";

export default function Index(): JSX.Element {
    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <div className="grid grid-cols-1 grid-rows-2 gap-3 text-center">
                <RawonSVG className="flex justify-self-center h-32 md:h-40 w-auto" />
                <p className="text-sm font-bold dark:text-white m-5">Welcome to Rawon website. We haven't added anything for this page. For now, you can use the tools made by us to help you develop your own Rawon Discord bot.</p>
            </div>
        </div>
    );
}
