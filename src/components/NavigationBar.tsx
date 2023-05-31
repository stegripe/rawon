import {
    ExpandLessRounded,
    ExpandMoreRounded,
    MenuRounded
} from "@mui/icons-material";
import {
    Button,
    Collapse,
    Container,
    Divider,
    Drawer,
    IconButton,
    Popover,
    Typography
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const NavigationItems = [
    {
        name: "Home",
        path: "/"
    },
    {
        name: "Permission Calculator",
        path: "/permission-calculator"
    },
    {
        name: "Script Generator",
        path: "/script-generator"
    }
];

const ExternalLinks = [
    {
        name: "Discord",
        path: "/discord"
    },
    {
        name: "Github",
        path: "/github"
    },
    {
        name: "Clytage",
        path: "/clytage"
    }
];

export const NavigationBar = () => {
    const router = useRouter();
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [isLinksOpen, setLinksOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const ToggleDrawer = () => {
        setDrawerOpen(open => !open);
    };

    const ToggleLinks = () => {
        setLinksOpen(open => !open);
    };

    return (
        <>
            <Container
                fixed
                className={`${
                    router.pathname === "/"
                        ? "fixed left-[50%] -translate-x-[50%]"
                        : "sticky"
                } top-0 z-50 flex h-20 w-full items-center justify-between bg-primary px-5 pt-0`}
            >
                <div className="flex items-center gap-1">
                    <div className="relative aspect-square h-auto w-12">
                        <Image
                            src="/icons/icon-512x512.png"
                            fill
                            alt="rawon.jpg"
                        />
                    </div>
                    <Typography className="text-center font-sans text-xl font-medium capitalize text-third">
                        rawon
                    </Typography>
                </div>
                <IconButton
                    id="drawerToggleButton"
                    onClick={ToggleDrawer}
                    className="p-0 md:hidden"
                >
                    <MenuRounded className="text-4xl" />
                </IconButton>
                <div className="hidden gap-1 md:flex">
                    <div className="flex gap-1">
                        {NavigationItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.path}
                                className="text-inherit no-underline"
                            >
                                <Button
                                    id={item.name}
                                    color="inherit"
                                    className="justify-start p-0 px-4 py-1 font-sans text-lg capitalize text-third"
                                >
                                    {item.name}
                                </Button>
                            </Link>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1">
                        <Button
                            id="links"
                            onClick={handleClick}
                            color="inherit"
                            className="justify-start p-0 px-4 py-1 font-sans text-lg capitalize text-third"
                        >
                            Links
                        </Button>
                        <Popover
                            id="__next"
                            open={open}
                            anchorEl={anchorEl}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center"
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "center"
                            }}
                            sx={{
                                "& .MuiPopover-paper": {
                                    backgroundColor: "#FFF3D1"
                                }
                            }}
                        >
                            <div className="flex flex-col p-2">
                                {ExternalLinks.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.path}
                                        passHref
                                        legacyBehavior
                                    >
                                        <a target="_blank" rel="noreferrer">
                                            <Button
                                                id={item.name}
                                                onClick={handleClose}
                                                color="inherit"
                                                className="w-full justify-start p-0 px-4 py-1 font-sans capitalize text-third"
                                            >
                                                {item.name}
                                            </Button>
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </Popover>
                    </div>
                </div>
            </Container>
            <Drawer
                id="__next"
                anchor="left"
                open={isDrawerOpen}
                onClose={ToggleDrawer}
                PaperProps={{
                    sx: {
                        backgroundColor: "#FFF3D1"
                    }
                }}
            >
                <Container
                    fixed
                    className="flex h-full w-full flex-col items-center p-0 text-third"
                >
                    <Link
                        href="/"
                        className="flex w-full p-3 text-inherit no-underline"
                    >
                        <div className="flex items-center gap-1">
                            <div className="relative aspect-square h-auto w-12">
                                <Image
                                    src="/icons/icon-512x512.png"
                                    fill
                                    alt="rawon.jpg"
                                />
                            </div>
                            <Typography className="mt-2 text-center font-sans text-xl font-medium capitalize text-third">
                                rawon
                            </Typography>
                        </div>
                    </Link>
                    <Divider className="mb-4 w-full" />
                    <div className="flex w-full flex-col gap-1">
                        {NavigationItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.path}
                                onClick={ToggleDrawer}
                                className="w-full text-inherit no-underline"
                            >
                                <Button
                                    id={item.name}
                                    color="inherit"
                                    className="w-full justify-start p-0 px-8 py-1 font-sans text-lg capitalize"
                                >
                                    {item.name}
                                </Button>
                            </Link>
                        ))}
                    </div>
                    <Divider className="m-4 w-full" />
                    <div className="flex w-full flex-col gap-1">
                        <Button
                            id="generalPermissionButton"
                            color="inherit"
                            endIcon={
                                isLinksOpen ? (
                                    <ExpandLessRounded className="text-xl text-third" />
                                ) : (
                                    <ExpandMoreRounded className="text-xl text-third" />
                                )
                            }
                            onClick={ToggleLinks}
                            className="w-full justify-between px-8 font-sans text-lg font-medium capitalize"
                        >
                            Links
                        </Button>
                        <Collapse in={isLinksOpen}>
                            <div className="flex w-full flex-col gap-1">
                                {ExternalLinks.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.path}
                                        passHref
                                        legacyBehavior
                                    >
                                        <a target="_blank" rel="noreferrer">
                                            <Button
                                                id={item.name}
                                                color="inherit"
                                                className="w-full justify-start p-0 px-8 py-1 font-sans capitalize text-third"
                                            >
                                                {item.name}
                                            </Button>
                                        </a>
                                    </Link>
                                ))}
                            </div>
                        </Collapse>
                    </div>
                </Container>
            </Drawer>
        </>
    );
};
