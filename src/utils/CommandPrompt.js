export class CommandPrompt {
    constructor() {
        this.commands = {
            "help": { description: "Show available commands", args: [] },
            "tp": { description: "Teleport player", args: ["x", "y"] },
            "give": { description: "Give item", args: ["item_id", "amount"] },
        };
    }

    getSuggestions(input, itemIds = []) {
        if (!input.startsWith('/')) return [];
        const content = input.substring(1);
        const parts = content.split(' ');
        const currentPart = parts[parts.length - 1];

        // Command suggestions
        if (parts.length === 1) {
            return Object.keys(this.commands)
                .filter(cmd => cmd.startsWith(currentPart.toLowerCase()))
                .map(cmd => ({
                    text: '/' + cmd,
                    description: this.commands[cmd].description
                }));
        }

        // Arg suggestions
        const commandName = parts[0].toLowerCase();
        const command = this.commands[commandName];
        if (command) {
            const argIndex = parts.length - 2; // -1 for cmd, -1 for current typing
            if (argIndex >= command.args.length) return [];

            const argName = command.args[argIndex];
            let suggestions = [];

            if (argName === 'item_id') suggestions = itemIds;
            else if (argName === 'amount') suggestions = ["1", "10", "100", "999"];
            else if (argName === 'x') suggestions = ["0", "10", "20", "30"];
            else if (argName === 'y') suggestions = ["0", "10", "20", "30"];

            return suggestions
                .filter(s => s.toLowerCase().startsWith(currentPart.toLowerCase()))
                .map(s => ({
                    text: '/' + commandName + ' ' + parts.slice(1, -1).concat(s).join(' '),
                    description: `${argName}: ${s}`
                }));
        }

        return [];
    }
}
