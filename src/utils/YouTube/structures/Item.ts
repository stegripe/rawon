export class Item {
    public id: string;
    public title: string;
    public url: string;
    public thumbnailURL: string;
    public constructor(protected readonly rawData: any) {
        this.id = rawData.id;
        this.title = rawData.title;
        this.url = rawData.url;
        this.thumbnailURL = rawData.thumbnailURL;
    }
}
