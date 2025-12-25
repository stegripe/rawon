import { useLocale } from "@/contexts/LocaleContext";
import { IPerm } from "@/types";
import {
    ArrowBackRounded,
    CloseRounded,
    ExpandLessRounded,
    ExpandMoreRounded,
    FileCopyRounded
} from "@mui/icons-material";
import {
    Button,
    Collapse,
    Container,
    IconButton,
    Input,
    Typography
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

const GeneralPermissions: IPerm[] = [
    {
        name: "CREATE_INSTANT_INVITE",
        value: 1,
        type: "general"
    },
    {
        name: "KICK_MEMBERS",
        value: 2,
        type: "general",
        auth: true
    },
    {
        name: "BAN_MEMBERS",
        value: 4,
        type: "general",
        auth: true
    },
    {
        name: "ADMINISTRATOR",
        value: 8,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_CHANNELS",
        value: 16,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_GUILD",
        value: 32,
        type: "general",
        auth: true
    },
    {
        name: "VIEW_AUDIT_LOG",
        value: 128,
        type: "general"
    },
    {
        name: "VIEW_CHANNEL",
        value: 1024,
        type: "general"
    },
    {
        name: "VIEW_GUILD_INSIGHTS",
        value: 524288,
        type: "general"
    },
    {
        name: "CHANGE_NICKNAME",
        value: 67108864,
        type: "general"
    },
    {
        name: "MANAGE_NICKNAMES",
        value: 134217728,
        type: "general"
    },
    {
        name: "MANAGE_ROLES",
        value: 268435456,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_WEBHOOKS",
        value: 536870912,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_EMOJIS_AND_STICKERS",
        value: 1073741824,
        type: "general",
        auth: true
    },
    {
        name: "MANAGE_EVENTS",
        value: 8589934592,
        type: "general"
    },
    {
        name: "MODERATE_MEMBERS",
        value: 1099511627776,
        type: "general",
        auth: true
    }
];

const VoicePermissions: IPerm[] = [
    {
        name: "PRIORITY_SPEAKER",
        value: 256,
        type: "voice"
    },
    {
        name: "STREAM",
        value: 512,
        type: "voice"
    },
    {
        name: "CONNECT",
        value: 1048576,
        type: "voice"
    },
    {
        name: "SPEAK",
        value: 2097152,
        type: "voice"
    },
    {
        name: "MUTE_MEMBERS",
        value: 4194304,
        type: "voice"
    },
    {
        name: "DEAFEN_MEMBERS",
        value: 8388608,
        type: "voice"
    },
    {
        name: "MOVE_MEMBERS",
        value: 16777216,
        type: "voice"
    },
    {
        name: "USE_VAD",
        value: 33554432,
        type: "voice"
    },
    {
        name: "REQUEST_TO_SPEAK",
        value: 4294967296,
        type: "voice"
    },
    {
        name: "START_EMBEDDED_ACTIVITIES",
        value: 549755813888,
        type: "voice"
    }
];

const TextPermissions: IPerm[] = [
    {
        name: "ADD_REACTIONS",
        value: 64,
        type: "text"
    },
    {
        name: "SEND_MESSAGES",
        value: 2048,
        type: "text"
    },
    {
        name: "SEND_TTS_MESSAGES",
        value: 4096,
        type: "text"
    },
    {
        name: "MANAGE_MESSAGES",
        value: 8192,
        type: "text",
        auth: true
    },
    {
        name: "EMBED_LINKS",
        value: 16384,
        type: "text"
    },
    {
        name: "ATTACH_FILES",
        value: 32768,
        type: "text"
    },
    {
        name: "READ_MESSAGE_HISTORY",
        value: 65536,
        type: "text"
    },
    {
        name: "MENTION_EVERYONE",
        value: 131072,
        type: "text"
    },
    {
        name: "USE_EXTERNAL_EMOJIS",
        value: 262144,
        type: "text"
    },
    {
        name: "USE_APPLICATION_COMMANDS",
        value: 2147483648,
        type: "text"
    },
    {
        name: "MANAGE_THREADS",
        value: 17179869184,
        type: "text",
        auth: true
    },
    {
        name: "CREATE_PUBLIC_THREADS",
        value: 34359738368,
        type: "text"
    },
    {
        name: "CREATE_PRIVATE_THREADS",
        value: 68719476736,
        type: "text"
    },
    {
        name: "USE_EXTERNAL_STICKERS",
        value: 137438953472,
        type: "text"
    },
    {
        name: "SEND_MESSAGES_IN_THREADS",
        value: 274877906944,
        type: "text"
    }
];

export default function PermissionCalculatorPage() {
    const { t } = useLocale();
    const [state, update] = useState<{
        clientId: string;
        scope: string;
        redirectUri: string;
        perms: string[];
    }>({
        clientId: "",
        scope: "",
        redirectUri: "",
        perms: []
    });

    const [disclosure, updateDisclosure] = useState<{
        general: boolean;
        text: boolean;
        voice: boolean;
    }>({
        general: false,
        text: false,
        voice: false
    });

    const removeClientID = () => update({ ...state, clientId: "" });
    const removeScope = () => update({ ...state, scope: "" });
    const removeRedirectURI = () => update({ ...state, redirectUri: "" });

    const updateDisclose = (type: "general" | "text" | "voice") => {
        updateDisclosure({
            general: type === "general" ? !disclosure.general : false,
            text: type === "text" ? !disclosure.text : false,
            voice: type === "voice" ? !disclosure.voice : false
        });
    };

    const handleOnClick = (perm: IPerm) => {
        update({
            ...state,
            perms: state.perms.includes(perm.name)
                ? state.perms.filter(p => p !== perm.name)
                : [...state.perms, perm.name]
        });
    };

    const result = () => {
        const bitfield = state.perms
            .map(
                x =>
                    GeneralPermissions.find(y => y.name === x) ||
                    TextPermissions.find(y => y.name === x) ||
                    VoicePermissions.find(y => y.name === x) || { value: 0 }
            )
            .reduce((a, b) => a + b.value, 0);

        const url = new URL("https://discord.com/api/oauth2/authorize");
        url.searchParams.append(
            "client_id",
            state.clientId.length ? state.clientId : "CLIENT_ID"
        );
        url.searchParams.append(
            "scope",
            state.scope.length ? state.scope : "bot"
        );
        url.searchParams.append("permissions", bitfield.toString());

        if (state.redirectUri.length) {
            url.searchParams.append("redirect_uri", state.redirectUri);
        }

        return url.toString();
    };

    return (
        <>
            <Container
                fixed
                className="relative flex min-h-[calc(100vh-80px)] w-full px-5 py-3 pb-10 pt-0 text-third"
            >
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full items-center gap-3">
                        <Link href="/" className="text-inherit no-underline">
                            <IconButton className="p-0">
                                <ArrowBackRounded className="text-3xl text-third" />
                            </IconButton>
                        </Link>
                        <Typography className="font-sans text-xl font-medium">
                            {t.permissionCalculator.title}
                        </Typography>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-5">
                            <div className="flex w-full flex-col gap-1">
                                <Typography className="font-sans text-lg font-medium">
                                    {t.permissionCalculator.clientId}
                                </Typography>
                                <Input
                                    disableUnderline
                                    fullWidth
                                    value={state.clientId}
                                    onChange={e =>
                                        update({
                                            ...state,
                                            clientId: e.target.value
                                        })
                                    }
                                    endAdornment={
                                        <IconButton
                                            color="inherit"
                                            onClick={removeClientID}
                                        >
                                            <CloseRounded
                                                className={`text-xl ${
                                                    state.clientId.length
                                                        ? "block"
                                                        : "hidden"
                                                }`}
                                            />
                                        </IconButton>
                                    }
                                    className="h-10 rounded-lg border-1 border-solid pl-3"
                                />
                            </div>
                            <div className="flex w-full flex-col gap-1">
                                <Typography className="font-sans text-lg font-medium">
                                    {t.permissionCalculator.scope}
                                </Typography>
                                <Input
                                    disableUnderline
                                    fullWidth
                                    value={state.scope}
                                    onChange={e =>
                                        update({
                                            ...state,
                                            scope: e.target.value
                                        })
                                    }
                                    endAdornment={
                                        <IconButton
                                            color="inherit"
                                            onClick={removeScope}
                                        >
                                            <CloseRounded
                                                className={`text-xl ${
                                                    state.scope.length
                                                        ? "block"
                                                        : "hidden"
                                                }`}
                                            />
                                        </IconButton>
                                    }
                                    className="h-10 rounded-lg border-1 border-solid pl-3"
                                />
                            </div>
                            <div className="flex w-full flex-col gap-1">
                                <Typography className="font-sans text-lg font-medium">
                                    {t.permissionCalculator.redirectUri}
                                </Typography>
                                <Input
                                    disableUnderline
                                    fullWidth
                                    value={state.redirectUri}
                                    onChange={e =>
                                        update({
                                            ...state,
                                            redirectUri: e.target.value
                                        })
                                    }
                                    endAdornment={
                                        <IconButton
                                            color="inherit"
                                            onClick={removeRedirectURI}
                                        >
                                            <CloseRounded
                                                className={`text-xl ${
                                                    state.redirectUri.length
                                                        ? "block"
                                                        : "hidden"
                                                }`}
                                            />
                                        </IconButton>
                                    }
                                    className="h-10 rounded-lg border-1 border-solid pl-3"
                                />
                            </div>
                        </div>
                        <div className="flex w-full flex-col gap-1">
                            <Typography className="font-sans text-lg font-medium">
                                {t.permissionCalculator.permissions}
                            </Typography>
                            <Typography className="font-sans text-xs font-medium text-fourth">
                                {t.permissionCalculator.permissionsNote}
                            </Typography>
                            <div className="flex w-full flex-col gap-3">
                                <div className="flex w-full flex-col">
                                    <Button
                                        id="generalPermissionButton"
                                        color="inherit"
                                        endIcon={
                                            disclosure.general ? (
                                                <ExpandLessRounded className="text-third" />
                                            ) : (
                                                <ExpandMoreRounded className="text-third" />
                                            )
                                        }
                                        onClick={() =>
                                            updateDisclose("general")
                                        }
                                        className="h-10 w-full justify-between border-b-2 border-solid border-third font-sans text-base font-medium normal-case"
                                    >
                                        {t.permissionCalculator.general}
                                    </Button>
                                    <Collapse
                                        in={disclosure.general}
                                        className="px-3"
                                    >
                                        <div className="flex w-full grid-cols-3 flex-col gap-3 pt-3 md:grid">
                                            {GeneralPermissions.map(
                                                (permission, i) => (
                                                    <Button
                                                        key={i}
                                                        id={`generalPermission${i}`}
                                                        color="inherit"
                                                        onClick={() =>
                                                            handleOnClick(
                                                                permission
                                                            )
                                                        }
                                                        className={`h-10 w-full rounded-lg border-2 border-solid font-sans font-medium ${
                                                            state.perms.includes(
                                                                permission.name
                                                            )
                                                                ? permission.auth
                                                                    ? "bg-fourth text-white"
                                                                    : "bg-third text-white"
                                                                : permission.auth
                                                                ? "border-fourth text-fourth"
                                                                : "border-third text-third"
                                                        }`}
                                                    >
                                                        {permission.name}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="flex w-full flex-col">
                                    <Button
                                        id="voicePermissionButton"
                                        color="inherit"
                                        endIcon={
                                            disclosure.voice ? (
                                                <ExpandLessRounded className="text-third" />
                                            ) : (
                                                <ExpandMoreRounded className="text-third" />
                                            )
                                        }
                                        onClick={() => updateDisclose("voice")}
                                        className="h-10 w-full justify-between border-b-2 border-solid border-third font-sans text-base font-medium normal-case"
                                    >
                                        {t.permissionCalculator.voice}
                                    </Button>
                                    <Collapse
                                        in={disclosure.voice}
                                        className="px-3"
                                    >
                                        <div className="flex w-full grid-cols-3 flex-col gap-3 pt-3 md:grid">
                                            {VoicePermissions.map(
                                                (permission, i) => (
                                                    <Button
                                                        key={i}
                                                        id={`voicePermission${i}`}
                                                        color="inherit"
                                                        onClick={() =>
                                                            handleOnClick(
                                                                permission
                                                            )
                                                        }
                                                        className={`h-10 w-full rounded-lg border-2 border-solid font-sans font-medium ${
                                                            state.perms.includes(
                                                                permission.name
                                                            )
                                                                ? permission.auth
                                                                    ? "bg-fourth text-white"
                                                                    : "bg-third text-white"
                                                                : permission.auth
                                                                ? "border-fourth text-fourth"
                                                                : "border-third text-third"
                                                        }`}
                                                    >
                                                        {permission.name}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </Collapse>
                                </div>
                                <div className="flex w-full flex-col">
                                    <Button
                                        id="textPermissionButton"
                                        color="inherit"
                                        endIcon={
                                            disclosure.text ? (
                                                <ExpandLessRounded className="text-third" />
                                            ) : (
                                                <ExpandMoreRounded className="text-third" />
                                            )
                                        }
                                        onClick={() => updateDisclose("text")}
                                        className="h-10 w-full justify-between border-b-2 border-solid border-third font-sans text-base font-medium normal-case"
                                    >
                                        {t.permissionCalculator.text}
                                    </Button>
                                    <Collapse
                                        in={disclosure.text}
                                        className="px-3"
                                    >
                                        <div className="flex w-full grid-cols-3 flex-col gap-3 pt-3 md:grid">
                                            {TextPermissions.map(
                                                (permission, i) => (
                                                    <Button
                                                        key={i}
                                                        id={`textPermission${i}`}
                                                        color="inherit"
                                                        onClick={() =>
                                                            handleOnClick(
                                                                permission
                                                            )
                                                        }
                                                        className={`h-10 w-full rounded-lg border-2 border-solid font-sans font-medium ${
                                                            state.perms.includes(
                                                                permission.name
                                                            )
                                                                ? permission.auth
                                                                    ? "bg-fourth text-white"
                                                                    : "bg-third text-white"
                                                                : permission.auth
                                                                ? "border-fourth text-fourth"
                                                                : "border-third text-third"
                                                        }`}
                                                    >
                                                        {permission.name}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </Collapse>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-1">
                        <Typography className="font-sans text-lg font-medium">
                            {t.permissionCalculator.result}
                        </Typography>
                        <Typography className="font-sans text-xs font-medium text-fourth">
                            {t.permissionCalculator.resultNote}
                        </Typography>
                        <Input
                            value={result()}
                            readOnly
                            disableUnderline
                            fullWidth
                            startAdornment={
                                <IconButton
                                    color="inherit"
                                    onClick={() =>
                                        navigator.clipboard.writeText(result())
                                    }
                                >
                                    <FileCopyRounded className="text-third" />
                                </IconButton>
                            }
                            className="h-10 rounded-lg border-1 border-solid pr-3"
                        />
                    </div>
                </div>
            </Container>
        </>
    );
}
