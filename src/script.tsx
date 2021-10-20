import './index.css';
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import { useEffect } from "react";
require("codemirror/mode/javascript/javascript");

function Script() {
    useEffect(() => {
        const value = `function trigger() {
    var url = [
        "Project link",
        "Project link",
        "Project link"
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

        CodeMirror(document.getElementById("code")!, {
            lineNumbers: true,
            mode: "javascript",
            readOnly: true,
            value
        })
    })

    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <div id="code"></div>
        </div>
    )
}

export default Script;