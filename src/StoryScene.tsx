import { Choice } from "./Choice";

export class StoryScene {
    id: string;
    text: string;
    choices: Choice[];
        
    constructor(id: string, text: string, choices: Choice[]) {
        this.id = id;
        this.text = text;
        this.choices = choices;
    }
}