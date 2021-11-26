import { IPerm } from "../typings";
import { ChangeEvent, useState } from "react";

const perms: IPerm[] = [{
        name: "CREATE_INSTANT_INVITE",
        value: 0x1
    },
    {
        name: "KICK_MEMBERS",
        value: 0x2
    },
    {
        name: "BAN_MEMBERS",
        value: 0x4
    },
    {
        name: "ADMINISTRATOR",
        value: 0x8
    },
    {
        name: "MANAGE_CHANNELS",
        value: 0x10
    },
    {
        name: "MANAGE_GUILD",
        value: 0x20
    },
    {
        name: "ADD_REACTIONS",
        value: 0x40
    },
    {
        name: "VIEW_AUDIT_LOG",
        value: 0x80
    },
    {
        name: "PRIORITY_SPEAKER",
        value: 0x100
    },
    {
        name: "STREAM",
        value: 0x200
    },
    {
        name: "VIEW_CHANNEL",
        value: 0x400
    },
    {
        name: "SEND_MESSAGES",
        value: 0x800
    },
    {
        name: "SEND_TTS_MESSAGES",
        value: 0x1000
    },
    {
        name: "MANAGE_MESSAGES",
        value: 0x2000
    },
    {
        name: "EMBED_LINKS",
        value: 0x4000
    },
    {
        name: "ATTACH_FILES",
        value: 0x8000
    },
    {
        name: "READ_MESSAGE_HISTORY",
        value: 0x10000
    },
    {
        name: "MENTION_EVERYONE",
        value: 0x20000
    },
    {
        name: "USE_EXTERNAL_EMOJIS",
        value: 0x40000
    },
    {
        name: "VIEW_GUILD_INSIGHTS",
        value: 0x80000
    },
    {
        name: "CONNECT",
        value: 0x100000
    },
    {
        name: "SPEAK",
        value: 0x200000
    },
    {
        name: "MUTE_MEMBERS",
        value: 0x400000
    },
    {
        name: "DEAFEN_MEMBERS",
        value: 0x800000
    },
    {
        name: "MOVE_MEMBERS",
        value: 0x1000000
    },
    {
        name: "USE_VAD",
        value: 0x2000000
    },
    {
        name: "CHANGE_NICKNAME",
        value: 0x4000000
    },
    {
        name: "MANAGE_NICKNAMES",
        value: 0x8000000
    },
    {
        name: "MANAGE_ROLES",
        value: 0x10000000
    },
    {
        name: "MANAGE_WEBHOOKS",
        value: 0x20000000
    },
    {
        name: "MANAGE_EMOJIS_AND_STICKERS",
        value: 0x40000000
    },
    {
        name: "USE_APPLICATION_COMMANDS",
        value: 0x80000000
    },
    {
        name: "REQUEST_TO_SPEAK",
        value: 0x100000000
    },
    {
        name: "MANAGE_THREADS",
        value: 0x400000000
    },
    {
        name: "CREATE_PUBLIC_THREADS",
        value: 0x800000000
    },
    {
        name: "CREATE_PRIVATE_THREADS",
        value: 0x1000000000
    },
    {
        name: "USE_EXTERNAL_STICKERS",
        value: 0x2000000000
    },
    {
        name: "SEND_MESSAGES_IN_THREADS",
        value: 0x4000000000
    },
    {
        name: "START_EMBEDDED_ACTIVITIES",
        value: 0x8000000000
    }
]

function PermsCalculator() {
    const [state, update] = useState<{
        clientId: string;perms: string[];scope: string;redirectUri: string
    }>({
        clientId: "",
        perms: [],
        scope: "",
        redirectUri: ""
    });

    function onCheckboxChange(data: ChangeEvent<HTMLInputElement>) {
        update({
            clientId: state.clientId,
            scope: state.scope,
            redirectUri: state.redirectUri,
            perms: data.target.checked ? state.perms.concat([data.target.name]).filter((x, i, a) => a.indexOf(x) === i) : state.perms.filter(x => x !== data.target.name)
        });
    }

    function onChange(data: ChangeEvent<HTMLInputElement>) {
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

    function getEquation() {
        return state.perms.length ? state.perms.map(x => perms.find(y => y.name === x) !.value).reduce((p, c) => p + c) : 0;
    }

    return (
        <div className="flex min-w-full h-full dark:bg-gray-900 text-sm">
            <div className="m-10 w-full">
                <p className="text-base md:text-xl font-bold dark:text-white">Permissions Calculator</p>
                <div className="my-4 grid grid-cols-1 md:grid-cols-3">
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Client ID</p>
                        <input className="focus:outline-none" id="client-id" onChange={onChange}
                            value={state.clientId} />
                    </div>
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Scope</p>
                        <input className="focus:outline-none" id="scope" onChange={onChange} value={state.scope} />
                    </div>
                    <div className="my-2 md:my-0">
                        <p className="dark:text-white">Redirect URI</p>
                        <input className="focus:outline-none" id="redirect-uri" onChange={onChange}
                            value={state.redirectUri} />
                    </div>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">Permissions</p>
                    <div className="bg-black bg-opacity-25 w-full break-words">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full">
                            {perms.map(x => (
                            <div key={x.name} className="m-1">
                                <input type="checkbox" id={x.name} name={x.name} onChange={onCheckboxChange} className="form-checkbox rounded hover:bg-indigo-400 hover:text-indigo-400 focus:text-indigo-800 text-black checked:bg-indigo-800 focus:ring-transparent focus:outline-none"/>
                                <label htmlFor={x.name} className="dark:text-white ml-2">{x.name}</label>
                            </div>
                            ))}
                        </div>
                        <p className="dark:text-white m-3">{getEquation()} = {state.perms.map(x =>
                            `0x${perms.find(y => y.name === x)!.value.toString(16)}`).join(" | ")}</p>
                    </div>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">URL</p>
                    <input className="w-full" disabled
                        value={`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(state.clientId) || "<CLIENT_ID_HERE>"
                        }&scope=${encodeURIComponent(state.scope) || "bot"}&permissions=${getEquation()}${state.redirectUri.length ?
                        `&redirect_uri=${encodeURIComponent(state.redirectUri)}`: "" }`} />
                </div>
            </div>
        </div>
    )
}

export default PermsCalculator;
