import './index.css';
import "codemirror/lib/codemirror.css";
import CodeMirror, { getMode, ModeSpec, ModeSpecOptions } from "codemirror";
import { useEffect } from "react";

function Script() {
    useEffect(() => {
        const mode = getMode({
            lineNumbers: true,
            readOnly: true
        }, "javascript") as ModeSpec<ModeSpecOptions>;

        CodeMirror(document.getElementById("code")!, {
            lineNumbers: true,
            mode,
            readOnly: true,
            value: "const a = {};"
        })
    })

    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <div id="code"></div>
        </div>
    )
}

export default Script;