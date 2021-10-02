import './index.css';
import CodeMirror from "codemirror";
import { useEffect } from "react";

function Script() {
    useEffect(() => {
        CodeMirror(document.getElementById("code")!, {
            lineNumbers: true,
            mode: "javascript",
            readOnly: true,
            theme: "midnight"
        })
    })

    return (
        <div className="flex items-center justify-center min-w-full h-screen dark:bg-gray-900">
            <div id="code"></div>
        </div>
    )
}

export default Script;