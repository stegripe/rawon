import { IPerm } from "../typings";
import { ChangeEvent, useState } from "react";

const perms: IPerm[] = [
    {
        name: "CREATE_INSTANT_INVITE",
        num: 0
    },
    {
        name: "KICK_MEMBERS",
        num: 1
    },
    {
        name: "BAN_MEMBERS",
        num: 2
    },
    {
        name: "ADMINISTRATOR",
        num: 3
    },
    {
        name: "MANAGE_CHANNELS",
        num: 4
    },
    {
        name: "MANAGE_GUILD",
        num: 5
    },
    {
        name: "ADD_REACTIONS",
        num: 6
    },
    {
        name: "VIEW_AUDIT_LOG",
        num: 7
    },
    {
        name: "PRIORITY_SPEAKER",
        num: 8
    },
    {
        name: "STREAM",
        num: 9
    },
    {
        name: "VIEW_CHANNEL",
        num: 10
    },
    {
        name: "SEND_MESSAGES",
        num: 11
    },
    {
        name: "SEND_TTS_MESSAGES",
        num: 12
    },
    {
        name: "MANAGE_MESSAGES",
        num: 13
    },
    {
        name: "EMBED_LINKS",
        num: 14
    },
    {
        name: "ATTACH_FILES",
        num: 15
    },
    {
        name: "READ_MESSAGE_HISTORY",
        num: 16
    },
    {
        name: "MENTION_EVERYONE",
        num: 17
    },
    {
        name: "USE_EXTERNAL_EMOJIS",
        num: 18
    },
    {
        name: "VIEW_GUILD_INSIGHTS",
        num: 19
    },
    {
        name: "CONNECT",
        num: 20
    },
    {
        name: "SPEAK",
        num: 21
    },
    {
        name: "MUTE_MEMBERS",
        num: 22
    },
    {
        name: "DEAFEN_MEMBERS",
        num: 23
    },
    {
        name: "MOVE_MEMBERS",
        num: 24
    },
    {
        name: "USE_VAD",
        num: 25
    },
    {
        name: "CHANGE_NICKNAME",
        num: 26
    },
    {
        name: "MANAGE_NICKNAMES",
        num: 27
    },
    {
        name: "MANAGE_ROLES",
        num: 28
    },
    {
        name: "MANAGE_WEBHOOKS",
        num: 29
    },
    {
        name: "MANAGE_EMOJIS_AND_STICKERS",
        num: 30
    },
    {
        name: "USE_APPLICATION_COMMANDS",
        num: 31
    },
    {
        name: "REQUEST_TO_SPEAK",
        num: 32
    },
    {
        name: "MANAGE_THREADS",
        num: 34
    },
    {
        name: "CREATE_PUBLIC_THREADS",
        num: 35
    },
    {
        name: "CREATE_PRIVATE_THREADS",
        num: 36
    },
    {
        name: "USE_EXTERNAL_STICKERS",
        num: 37
    },
    {
        name: "SEND_MESSAGES_IN_THREADS",
        num: 38
    },
    {
        name: "START_EMBEDDED_ACTIVITIES",
        num: 39
    }
]

function PermsCalculator() {
    const [state, update] = useState<{clientId: string; perms: string[]}>({clientId: "", perms: []});

    function onCheckboxChange(data: ChangeEvent<HTMLInputElement>) {
        update({ clientId: state.clientId, perms: data.target.checked ? state.perms.concat([data.target.name]).filter((x, i, a) => a.indexOf(x) === i) : state.perms.filter(x => x !== data.target.name) });
    }

    function onCIDChange(data: ChangeEvent<HTMLInputElement>) {
        update({ clientId: data.target.value, perms: state.perms });
    }

    return (
        <div className="flex min-w-full h-full dark:bg-gray-900">
            <div className="m-10 w-full">
                <p className="text-base md:text-xl font-bold dark:text-white">Perms Calculator</p>
                <div className="my-4">
                    <p className="dark:text-white">Client ID</p>
                    <input className="focus:outline-none" id="client-id" onChange={onCIDChange}/>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">Permissions</p>
                    <div className="bg-black bg-opacity-25 w-full grid grid-cols-3">
                        {perms.map(x => (
                            <div key={x.name} className="m-1">
                                <input type="checkbox" id={x.name} name={x.name} onChange={onCheckboxChange}/>
                                <label htmlFor={x.name} className="dark:text-white ml-2">{x.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="my-4 w-full">
                    <p className="dark:text-white">URL</p>
                    <input className="w-full" disabled value={`https://discord.com/oauth2/authorize?client_id=${state.clientId || "<CLIENT_ID_HERE>"}&scope=bot&permissions=${state.perms.length ? state.perms.map(x => 1 << (perms.find(y => y.name === x)!.num)).reduce((p, c) => p + c) : 0}`}/>
                </div>
            </div>
        </div>
    )
}

export default PermsCalculator;