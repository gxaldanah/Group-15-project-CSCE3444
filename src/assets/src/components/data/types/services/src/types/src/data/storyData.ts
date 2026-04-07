
export const story: any = {
    start: {
        text: "You've been traveling alone for days and in then distance you see a small village. Do you want to go there?",
        choices: [
            {
                text: "Yes, go to the village.",
                next: "village",
                effect: { intelligence: +1 }
            },
            {
                text: "No, keep a close eye on the surroundings and proceed with caution.",
                next: "proceed",
                effect: { intelligence: +2 }
            },
        ],
    },
    village: {
        text: "You arrive at the village and see a group of people gathered around a fire. They seem to be in distress. Do you approach them?",
        choices: [
            {
                text: "Yes, approach the group.",
                next: "group",
                effect: { charisma: +1 }
            },
            {
                text: "No, stay back and observe from a distance.",
                next: "observe",
                effect: { intelligence: +1 }
            },
        ],
    },
    proceed: {
        text: "You stayed in the woods and you hear a creature approaching.",
        choices: [
            {
                text: "Prepare to fight.",
                next: "fight",
                effect: { strength: +2, agility: -1 }
            },
            {
                text: "Try to hide and avoid confrontation.",
                next: "hide",
                effect: { agility: +2, strength: -2 }
            },
        ],
    },
};