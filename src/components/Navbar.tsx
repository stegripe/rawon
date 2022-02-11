import { useTheme } from "../hooks/useTheme";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/solid";
import { Listbox, Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";

const tools = [
    {
        name: "Script Generator",
        description: "Generate a script keep your bot online using Google Scripts.",
        href: "/#/script"
    },
    {
        name: "Permissions Calculator",
        description: "Generate an invite link for your bot using specific permissions",
        href: "/#/permscalculator"
    }
];

const themes = [
    {
        name: "Light",
        value: "light"
    },
    {
        name: "Dark",
        value: "dark"
    },
    {
        name: "System",
        value: "system"
    }
];

function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(" ");
}

export default function Navbar(): JSX.Element {
    const [theme, setTheme] = useTheme();

    return (
        <Popover className="bg-white border-b border-gray-400 dark:border-transparent dark:bg-black">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <a className="flex-shrink-0 dark:text-white text-lg font-bold" href="/#/">
                            <p>RB</p>
                        </a>
                        <Popover.Group as="div" className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <a href="/#/"
                                    className="text-gray-500 dark:text-white dark:hover:text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                    Home
                                </a>
                                <Popover className="relative">
                                    {({ open }) => (
                                        <>
                                            <Popover.Button className={classNames(open ? "text-gray-900" : "text-gray-500", "group bg-white dark:bg-black rounded-md inline-flex items-center text-sm font-medium focus:outline-none")}>
                                                <span className="dark:text-white hover:text-gray-900 dark:hover:text-gray-400">Tools</span>
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={classNames(open ? "text-gray-600" : "text-gray-400", "ml-2 h-5 w-5 group-hover:text-gray-500")} aria-hidden="true">
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z" fill="#4A5568" />
                                                </svg>
                                            </Popover.Button>

                                            <Transition as={Fragment} enter="transition ease-out duration-200"
                                                enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0"
                                                leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0"
                                                leaveTo="opacity-0 translate-y-1">
                                                <Popover.Panel className="absolute z-10 -ml-4 mt-3 transform px-2 w-screen max-w-md sm:px-0 lg:ml-0 lg:left-1/2 lg:-translate-x-1/2">
                                                    <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                                                        <div className="relative grid gap-6 bg-white dark:bg-black px-5 py-6 sm:gap-8 sm:p-8">
                                                            {tools.map(item => (
                                                                <a key={item.name} href={item.href}
                                                                    className="-m-3 p-3 flex items-start rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                                                                    <div className="ml-4">
                                                                        <p className="text-base font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                                        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </Popover.Panel>
                                            </Transition>
                                        </>
                                    )}
                                </Popover>
                                <a href="https://github.com/Rahagia/rawon"
                                    className="text-gray-500 dark:text-white dark:hover:text-gray-400 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                    GitHub
                                </a>
                            </div>
                        </Popover.Group>
                    </div>
                    <div className="block">
                        <div className="ml-4 flex items-center md:ml-6">
                            <Listbox value={theme} onChange={val => {
                                setTheme(val as "system");
                            }}>
                                <Listbox.Button className="flex items-center rounded bg-transparent py-2 px-3 text-sm duration-150 hover:bg-gray-300">
                                    <p className="dark:text-white">Theme</p>
                                    <ChevronDownIcon className="text-gray-500 w-5 h-auto ml-2"/>
                                </Listbox.Button>
                                <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0">
                                    <Listbox.Options className="absolute z-10 mt-10 transform translate-y-1/2 px-0 border border-gray-100 dark:border-gray-500 max-w-md sm:px-0 lg:ml-0 bg-white dark:bg-black focus:outline-none">
                                        {themes.map(them => (
                                            <Listbox.Option className={({ active }) => `${active ? "bg-black text-white dark:bg-white dark:text-black" : "text-black dark:text-white"} cursor-default select-none relative py-2`} value={them.value}>
                                                {({ selected }) => (
                                                    <>
                                                        <span className={`${selected ? "font-medium" : "font-normal"} text-sm md:text-base block truncate ml-2 mr-9`}>
                                                            {them.name}
                                                        </span>
                                                        {selected
                                                            ? (
                                                                <span className={`absolute inset-y-0 right-0 flex items-center ml-3 mr-1`}>
                                                                    <CheckIcon className="w-5 h-5" aria-hidden="true" />
                                                                </span>
                                                            )
                                                            : null}
                                                    </>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </Transition>
                            </Listbox>
                        </div>
                    </div>
                    <div className="-mr-2 flex md:hidden">
                        <Popover.Button className="bg-white dark:bg-black text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900 inline-flex items-center justify-center p-2 rounded-md focus:outline-none">
                            <span className="sr-only">Open menu</span>
                            <svg id="burger" className="w-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M23,13H1c-0.6,0-1-0.4-1-1s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,13,23,13z" />
                                <path fill="currentColor" d="M23,6H1C0.4,6,0,5.6,0,5s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,6,23,6z" />
                                <path fill="currentColor" d="M23,20H1c-0.6,0-1-0.4-1-1s0.4-1,1-1h22c0.6,0,1,0.4,1,1S23.6,20,23,20z" />
                            </svg>
                        </Popover.Button>
                    </div>
                </div>
            </div>

            <Transition as={Fragment} enter="duration-200 ease-out" enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100" leave="duration-100 ease-in" leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95">
                <Popover.Panel focus className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden">
                    <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white dark:bg-black divide-y-2 divide-gray-50">
                        <div className="pt-5 pb-6 px-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="dark:text-white font-bold text-lg">RB</p>
                                </div>
                                <div className="-mr-2">
                                    <Popover.Button className="bg-white dark:bg-black rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                                        <span className="sr-only">Close menu</span>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                                            <path d="M6 18L18 6M6 6L18 18" stroke="#4A5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </Popover.Button>
                                </div>
                            </div>
                            <div className="mt-6">
                                <nav className="grid gap-y-8">
                                    {tools.map(item => (
                                        <a key={item.name} href={item.href} className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-900">
                                            <span className="ml-3 text-base font-medium text-gray-900 dark:text-gray-50">{item.name}</span>
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </div>
                        <div className="py-6 px-5 space-y-6">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                <a href="/#/" className="text-base font-medium text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-200">
                                    Home
                                </a>
                                <a href="https://github.com/Rahagia/rawon" className="text-base font-medium text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-200">
                                    GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>
    );
}
