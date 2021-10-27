import "codemirror/lib/codemirror.css";
import './index.css';
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import CodeMirror from "codemirror";
require("codemirror/mode/javascript/javascript");

function Script() {
    const [state, change] = useState<{
        text: string;items: string[]
    }>({
        text: "",
        items: []
    });

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
            text: data.target.value
        });
    }

    function onSubmit() {
        if (state.text === "") return;

        change({
            items: state.items.concat([state.text]),
            text: ""
        });
    }

    function onKeyDown(data: KeyboardEvent<HTMLInputElement>) {
        if (data.code === "Enter") {
            onSubmit();
        }
    }

    return (
        <div className="flex items-center justify-center min-w-screen h-screen dark:bg-gray-900">
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
    )
}

export default Script;
