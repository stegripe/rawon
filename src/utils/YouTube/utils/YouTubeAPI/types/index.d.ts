import { Duration } from "iso8601-duration";

export type privacyStatus = "public" | "private" | "unlisted";
export type uploadStatus = "deleted" | "failed" | "processed" | "rejected" | "uploaded";
export type failureReason = "codec" | "conversion" | "emptyFile" | "invalidFile" | "tooSmall" | "uploadAborted";
export type rejectionReason = "claim" | "copyright" | "duplicate" | "inappropriate" | "legal" | "length" | "termsOfUse" | "trademark" | "uploaderAccountClosed" | "uploaderAccountSuspended";

export interface IThumbnails {
    default: {
        url: string;
        width: 120;
        height: 90;
    };
    medium?: {
        url: "https://i.ytimg.com/vi/SlPhMPnQ58k/mqdefault.jpg";
        width: 320;
        height: 180;
    };
    high?: {
        url: "https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg";
        width: 480;
        height: 360;
    };
    standard?: {
        url: "https://i.ytimg.com/vi/SlPhMPnQ58k/sddefault.jpg";
        width: 640;
        height: 480;
    };
    maxres?: {
        url: "https://i.ytimg.com/vi/SlPhMPnQ58k/maxresdefault.jpg";
        width: 1280;
        height: 720;
    };
}

export interface IVideo {
    raw: {
        kind: string;
        etag: string;
        id: string;
        snippet: {
            publishedAt: Date;
            channelId: string;
            title: string;
            description: string;
            thumbnails: IThumbnails;
            channelTitle: string;
        };
        contentDetails?: {
            duration?: string;
        };
        status: {
            uploadStatus?: uploadStatus;
            failureReason?: failureReason;
            rejectionReason?: rejectionReason;
            privacyStatus: privacyStatus;
        };
    };
    id: string;
    url: string;
    title: string;
    description: string;
    channel: {
        id: string;
        name: string;
        url: string;
    };
    thumbnails: IThumbnails;
    duration: Duration | null;
    durationMS: number | null;
    status: {
        uploadStatus?: uploadStatus;
        failureReason?: failureReason;
        rejectionReason?: rejectionReason;
        privacyStatus: privacyStatus;
    };
    publishedAt: Date;
}

export interface IPlaylist {
    raw: {
        kind: string;
        etag: string;
        id: string;
        snippet: {
            publishedAt: Date;
            channelId: string;
            title: string;
            description: string;
            thumbnails: IThumbnails;
            channelTitle: string;
        };
        contentDetails: {
            itemCount: number;
        };
        status: { privacyStatus: privacyStatus };
    };
    id: string;
    url: string;
    title: string;
    description: string;
    channel: {
        id: string;
        name: string;
        url: string;
    };
    thumbnails: IThumbnails;
    itemCount: number;
    privacyStatus: privacyStatus;
    createdAt: Date;
}
