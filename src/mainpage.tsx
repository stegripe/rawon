export default function Index(): JSX.Element {
    return (
        <div className="flex items-center justify-center min-w-full h-screen bg-primary mx-auto text-center">
            <div className="grid grid-cols-1 gap-3 text-center">
                <img
                    src="https://api.clytage.org/assets/images/rawon.jpg"
                    alt=""
                    className="flex justify-self-center h-80 md:h-96 w-auto rounded-full"
                />
                <h1 className="text-6xl md:text-7xl font-bold text-secondary items-center justify-center">
                    Rawon
                </h1>
                <h2 className="font-semibold text-2xl md:text-3xl my-5">
                    A simple powerful Discord music bot built to fulfill your
                    production desires.
                </h2>
                <div className="flex items-center justify-center flex-row gap-2 text-lg md:text-xl">
                    <a
                        className="btn"
                        href="https://discord.com/api/oauth2/authorize?client_id=999162626036740138&permissions=275183430727&scope=applications.commands%20bot"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Invite
                    </a>
                    <a
                        className="btn"
                        href="https://github.com/Clytage/rawon"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Support
                    </a>
                </div>
                <div
                    className="flex items-center justify-center flex-row gap-2 text-lg md:text-xl"
                    flex-row
                    gap-2
                >
                    <a className="btn" href="/#/permscalculator">
                        Permissions Calculator
                    </a>
                    <a className="btn" href="/#/script">
                        Script Generator
                    </a>
                </div>
            </div>
        </div>
    );
}
