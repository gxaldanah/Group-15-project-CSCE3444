export class Choice {
    text: string;
    nextScene: string;
        
    constructor(text: string, nextScene: string) {
        this.text = text;
        this.nextScene = nextScene;
    }
}