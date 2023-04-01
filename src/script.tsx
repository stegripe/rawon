/* eslint-disable @typescript-eslint/unbound-method */
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { Transition } from "@headlessui/react";
import CloseIcon from "@heroicons/react/solid/XIcon";
import { ChangeEvent, Component, KeyboardEvent } from "react";
import "./index.css";

class Script extends Component<
Record<string, never>,
{
    text: string;
    incremental: number;
    items: string[];
    notices: { text: string; id: string; show: boolean }[];
}
> {
    private view?: EditorView;

    public constructor() {
        super({});

        this.state = {
            text: "",
            incremental: 0,
            items: [],
            notices: []
        };
        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    // eslint-disable-next-line class-methods-use-this
    public generateScript(items: string[]): string {
        return `function trigger() {
    var url = [
${items.map(x => `        "${x}"`).join(",\n")}
    ];
    for (var x = 0; x < url.length; x++) {
        var uri = url[x];
        try {
            UrlFetchApp.fetch(uri);
        } catch (err) {
            Logger.log(err.message);
        }
    }
}`;
    }

    public componentDidMount(): void {
        this.view = new EditorView({
            parent: document.getElementById("code")!,
            state: EditorState.create({
                doc: this.generateScript([]),
                extensions: [
                    javascript(),
                    EditorState.readOnly.of(true),
                    oneDark
                ]
            })
        });
    }

    public onChange(data: ChangeEvent<HTMLInputElement>): void {
        this.setState({
            items: this.state.items,
            text: data.target.value,
            notices: this.state.notices
        });
    }

    public onSubmit(): void {
        if (this.state.text === "") return;

        const num = this.state.incremental + 1;
        try {
            new URL(this.state.text);
        } catch {
            this.setState({
                incremental: num,
                items: this.state.items,
                text: this.state.text,
                notices: [
                    ...this.state.notices,
                    {
                        text: "Invalid URL",
                        id: `notice-${num}`,
                        show: true
                    }
                ]
            });
            return;
        }

        const toAdd = this.state.items.concat([this.state.text]);

        this.view?.dispatch({
            changes: {
                from: 0,
                to: this.view.state.doc.length,
                insert: this.generateScript(toAdd)
            },
            scrollIntoView: false
        });

        this.setState({
            incremental: this.state.incremental,
            items: toAdd,
            text: "",
            notices: this.state.notices
        });
    }

    public onKeyDown(data: KeyboardEvent<HTMLInputElement>): void {
        if (data.code === "Enter") {
            this.onSubmit();
        }
    }

    public render(): JSX.Element {
        return (
            <>
                <div className="absolute flex w-full">
                    <div className="block w-full m-3 max-w-xs">
                        {this.state.notices.slice(0, 2).map(x => <Transition
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
                                this.setState({
                                    incremental: this.state.incremental,
                                    items: this.state.items,
                                    text: this.state.text,
                                    notices: [
                                        ...this.state.notices.map(y => {
                                            if (y.id !== x.id) return y;

                                            return {
                                                text: y.text,
                                                id: y.id,
                                                show: false
                                            };
                                        })
                                    ]
                                });
                            }}
                            afterLeave={() => {
                                this.setState({
                                    items: this.state.items,
                                    text: this.state.text,
                                    notices: this.state.notices.filter(
                                        y => y.id !== x.id
                                    )
                                });
                            }}
                        >
                            <div className="w-full m-3 bg-red-300 border border-red-400 rounded-lg">
                                <p className="m-2">{x.text}</p>
                            </div>
                        </Transition>)}
                    </div>
                </div>
                <div className="flex flex-col gap-3 p-8 h-screen dark:bg-gray-900">
                    <div className="flex w-full gap-3 items-center">
                        <a href="/">
                            <CloseIcon className="w-8 h-8" />
                        </a>
                        <p className="text-xl font-bold">
                                Script Generator
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <input
                            id="url-textbox"
                            onKeyDown={this.onKeyDown}
                            onChange={this.onChange}
                            value={this.state.text}
                            placeholder="Put the URL here"
                            className="focus:outline-none border border-black rounded-md dark:border-transparent px-3 py-2"
                        />
                        <button
                            className="p-2 transition-colors border rounded border-black hover:bg-black hover:text-white dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
                            onClick={this.onSubmit}
                        >
                            Add URL
                        </button>
                    </div>
                    <div id="code" className=""></div>
                </div>
            </>
        );
    }
}

export default Script;
