import "codemirror/lib/codemirror.css";
import './index.css';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import CodeMirror from "codemirror";
require("codemirror/mode/javascript/javascript");

function Script() {
    const [state, change] = useState<{
        text: string;items: string[]; notices: { text: string; id: string; show: boolean; }[];
    }>({
        text: "",
        items: [],
        notices: []
    });
    let incremental = 0;

    useEffect(() => {
        document.getElementById("code")!.innerHTML = "";
        CodeMirror(document.getElementById("code")!, {
            lineNumbers: true,
            mode: "javascript",
            readOnly: true,
            value: `function trigger() {
    var url = [
${state.items.map(x => `        "${x}"`).join(",\n")}
    ];
    for (var x = 0; x < url.length; x++) {
        var uri = url[x];
        try {
            UrlFetchApp.fetch(uri);
        } catch (err) {
            Logger.log(err.message)
        }
    }
}`
        })
    });

    function onChange(data: ChangeEvent<HTMLInputElement>) {
        change({
            items: state.items,
            text: data.target.value,
            notices: state.notices
        });
    }

    function onSubmit() {
        if (state.text === "") return;

        try {
            new URL(state.text);
        } catch (err) {
            change({
                items: state.items,
                text: state.text,
                notices: [
                    ...state.notices,
                    {
                        text: "Invalid URL",
                        id: `notice-${incremental++}`,
                        show: true
                    }
                ]
            });
            return;
        }

        change({
            items: state.items.concat([state.text]),
            text: "",
            notices: state.notices
        });
    }

    function onKeyDown(data: KeyboardEvent<HTMLInputElement>) {
        if (data.code === "Enter") {
            onSubmit();
        }
    }

    return (
        <>
            <div className="absolute flex w-full">
                <div className="block w-full m-3 max-w-xs">
                    {state.notices.slice(0, 2).map(x => {
                        return (
                            <Transition
                                key={x.id}
                                appear={true}
                                show={x.show}
                                enter="transition duration-200"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="delay-5000 duration-200 ease-in-out"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                                afterEnter={() => {
                                    change({
                                        items: state.items,
                                        text: state.text,
                                        notices: [...state.notices.map(y => {
                                            if (y.id !== x.id) return y;

                                            return {
                                                text: y.text,
                                                id: y.id,
                                                show: false
                                            }
                                        })]
                                    })
                                }}
                                afterLeave={() => {
                                    change({
                                        items: state.items,
                                        text: state.text,
                                        notices: state.notices.filter(y => y.id !== x.id)
                                    })
                                }}>
                                    <div className="w-full m-3 bg-red-300 border border-red-400 rounded-lg">
                                        <p className="m-2">{x.text}</p>
                                    </div>
                            </Transition>
                        )
                    })}
                </div>
            </div>
            <div className="flex items-center justify-center h-screen dark:bg-gray-900">
                <div className="grid grid-cols-1 grid-rows-2">
                    <div className="m-20">
                        <p className="text-base md:text-xl font-bold dark:text-white">Script Generator</p>
                        <br />
                        <input id="url-textbox" onKeyDown={onKeyDown} onChange={onChange} value={state.text}
                            placeholder="Put the URL here" className="focus:outline-none" />
                        <br />
                        <button
                            className="p-2 mt-2 transition-colors border rounded border-black hover:bg-black hover:text-white dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                            onClick={onSubmit}>
                            Add URL
                        </button>
                    </div>
                    <div id="code" className="text-sm"></div>
                </div>
            </div>
        </>
    )
}

export default Script;
