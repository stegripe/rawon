export interface IPerm {
    name: string;
    value: number;
    auth?: boolean;
    type: "general" | "text" | "voice";
}
