import { IPerm } from "../typings";
import { ChangeEvent, useState } from "react";

const perms: IPerm[] = [
    {
        name: "CREATE_INSTANT_INVITE",
        value: 0x1,
        type: "general"
    },
    {
        name: "KICK_MEMBERS",
        value: 0x2,
        type: "general",
        auth: true
    },
    {
        name: "BAN_MEMBERS",
        value: 0x4,
        type: "general",
        auth: true
    },
    {
        name: "ADMINISTRATOR",
        value: 0x8,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_CHANNELS",
        value: 0x10,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_GUILD",
        value: 0x20,
        type: "general",
        auth: true
    },
    {
        name: "ADD_REACTIONS",
        value: 0x40,
        type: "text"
    },
    {
        name: "VIEW_AUDIT_LOG",
        value: 0x80,
        type: "general"
    },
    {
        name: "PRIORITY_SPEAKER",
        value: 0x100,
        type: "voice"
    },
    {
        name: "STREAM",
        value: 0x200,
        type: "voice"
    },
    {
        name: "VIEW_CHANNEL",
        value: 0x400,
        type: "general"
    },
    {
        name: "SEND_MESSAGES",
        value: 0x800,
        type: "text"
    },
    {
        name: "SEND_TTS_MESSAGES",
        value: 0x1000,
        type: "text"
    },
    {
        name: "MANAGE_MESSAGES",
        value: 0x2000,
        type: "text",
        auth: true
    },
    {
        name: "EMBED_LINKS",
        value: 0x4000,
        type: "text"
    },
    {
        name: "ATTACH_FILES",
        value: 0x8000,
        type: "text"
    },
    {
        name: "READ_MESSAGE_HISTORY",
        value: 0x10000,
        type: "text"
    },
    {
        name: "MENTION_EVERYONE",
        value: 0x20000,
        type: "text"
    },
    {
        name: "USE_EXTERNAL_EMOJIS",
        value: 0x40000,
        type: "text"
    },
    {
        name: "VIEW_GUILD_INSIGHTS",
        value: 0x80000,
        type: "general"
    },
    {
        name: "CONNECT",
        value: 0x100000,
        type: "voice"
    },
    {
        name: "SPEAK",
        value: 0x200000,
        type: "voice"
    },
    {
        name: "MUTE_MEMBERS",
        value: 0x400000,
        type: "voice"
    },
    {
        name: "DEAFEN_MEMBERS",
        value: 0x800000,
        type: "voice"
    },
    {
        name: "MOVE_MEMBERS",
        value: 0x1000000,
        type: "voice"
    },
    {
        name: "USE_VAD",
        value: 0x2000000,
        type: "voice"
    },
    {
        name: "CHANGE_NICKNAME",
        value: 0x4000000,
        type: "general"
    },
    {
        name: "MANAGE_NICKNAMES",
        value: 0x8000000,
        type: "general"
    },
    {
        name: "MANAGE_ROLES",
        value: 0x10000000,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_WEBHOOKS",
        value: 0x20000000,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_EMOJIS_AND_STICKERS",
        value: 0x40000000,
        type: "general",
        auth: true
    },
    {
        name: "USE_APPLICATION_COMMANDS",
        value: 0x80000000,
        type: "text"
    },
    {
        name: "REQUEST_TO_SPEAK",
        value: 0x100000000,
        type: "voice"
    },
    {
        name: "MANAGE_EVENTS",
        value: 0x200000000,
        type: "general"
    },
    {
        name: "MANAGE_THREADS",
        value: 0x400000000,
        type: "text",
        auth: true
    },
    {
        name: "CREATE_PUBLIC_THREADS",
        value: 0x800000000,
        type: "text"
    },
    {
        name: "CREATE_PRIVATE_THREADS",
        value: 0x1000000000,
        type: "text"
    },
    {
        name: "USE_EXTERNAL_STICKERS",
        value: 0x2000000000,
        type: "text"
    },
    {
        name: "SEND_MESSAGES_IN_THREADS",
        value: 0x4000000000,
        type: "text"
    },
    {
        name: "START_EMBEDDED_ACTIVITIES",
        value: 0x8000000000,
        type: "voice"
    },
    {
        name: "MODERATE_MEMBERS",
        value: 0x10000000000,
        type: "general",
        auth: true
    }
];

function PermsCalculator(): JSX.Element {
    const [state, update] = useState<{ clientId: string; perms: string[]; scope: string; redirectUri: string }>({
        clientId: "",
        perms: [],
        scope: "",
        redirectUri: ""
    });

    function onCheckboxChange(data: ChangeEvent<HTMLInputElement>): void {
        update({
            clientId: state.clientId,
            scope: state.scope,
            redirectUri: state.redirectUri,
            perms: data.target.checked ? state.perms.concat([data.target.name]).filter((x, i, a) => a.indexOf(x) === i) : state.perms.filter(x => x !== data.target.name)
        });
    }

    function onChange(data: ChangeEvent<HTMLInputElement>): void {
        if (data.target.id === "client-id") {
            update({
                clientId: data.target.value,
                perms: state.perms,
                scope: state.scope,
                redirectUri: state.redirectUri
            });
        } else if (data.target.id === "scope") {
            update({
                clientId: state.clientId,
                perms: state.perms,
                scope: data.target.value,
                redirectUri: state.redirectUri
            });
        } else if (data.target.id === "redirect-uri") {
            update({
                clientId: state.clientId,
                perms: state.perms,
                scope: state.scope,
                redirectUri: data.target.value
            });
        }
    }

    function getEquation(): number {
        return state.perms.length ? state.perms.map(x => perms.find(y => y.name === x) !.value).reduce((p, c) => p + c) : 0;
    }

    function permsToElements(permsArr: IPerm[]): JSX.Element[] {
        return permsArr.map(x => (
            <div key={x.name} className="m-1">
                <input type="checkbox" id={x.name} name={x.name} onChange={onCheckboxChange} className="form-checkbox rounded border-transparent hover:bg-indigo-400 hover:text-indigo-400 checked:text-indigo-800 checked:hover:text-indigo-800 focus:border-transparent focus:ring-0 focus:outline-none"/>
                <label htmlFor={x.name} className={`${x.auth ? "text-orange-400" : "dark:text-white"} ml-2`}>{x.name}</label>
            </div>
        ));
    }

    return (
        <div className="flex min-w-full h-full dark:bg-gray-900 text-sm">
            <div className="m-10 w-full">
                <p className="text-base md:text-xl font-bold dark:text-white">Permissions Calculator</p>
                <div className="my-4 grid grid-cols-1 md:grid-cols-3">
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Client ID</p>
                        <input className="focus:outline-none border border-black rounded-md dark:border-transparent" id="client-id" onChange={onChange}
                            value={state.clientId} />
                    </div>
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Scope</p>
                        <input className="focus:outline-none border border-black rounded-md dark:border-transparent" id="scope" onChange={onChange} value={state.scope} />
                    </div>
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Redirect URI</p>
                        <input className="focus:outline-none border border-black rounded-md dark:border-transparent" id="redirect-uri" onChange={onChange}
                            value={state.redirectUri} />
                    </div>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">Permissions</p>
                    <div className="bg-black bg-opacity-25 w-full break-words">
                        <div className="grid grid-cols-1 grid-rows-3 md:grid-rows-2 md:grid-cols-2 lg:grid-cols-3 lg:grid-rows-1 w-full">
                            <div className="md:row-span-2 lg:row-span-1">
                                <p className="mt-2 lg:mt-1 ml-1 text-sm font-bold dark:text-white">General</p>
                                <div className="grid grid-cols-1">
                                    {permsToElements([...perms].filter(x => x.type === "general"))}
                                </div>
                            </div>
                            <div>
                                <p className="mt-3 lg:mt-1 ml-1 text-sm font-bold dark:text-white">Text</p>
                                <div className="grid grid-cols-1">
                                    {permsToElements([...perms].filter(x => x.type === "text"))}
                                </div>
                            </div>
                            <div>
                                <p className="mt-3 lg:mt-1 ml-1 text-sm font-bold dark:text-white">Voice</p>
                                <div className="grid grid-cols-1">
                                    {permsToElements([...perms].filter(x => x.type === "voice"))}
                                </div>
                            </div>
                        </div>
                        <p className="text-orange-400 mx-2 mt-1 text-xs">Colored means that the OAuth user needs to enable 2FA on their account if the server requires 2FA</p>
                        <p className="dark:text-white m-3">{getEquation()} = {state.perms.map(x => `0x${perms.find(y => y.name === x)!.value.toString(16)}`).join(" | ")}</p>
                    </div>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">URL</p>
                    <p className="w-full bg-gray-500 rounded-md p-2" children={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(state.clientId) || "<CLIENT_ID_HERE>"
                    }&scope=${encodeURIComponent(state.scope) || "bot"}&permissions=${getEquation()}${state.redirectUri.length
                        ? `&redirect_uri=${encodeURIComponent(state.redirectUri)}`
                        : ""}`} />
                </div>
            </div>
        </div>
    );
}

export default PermsCalculator;
