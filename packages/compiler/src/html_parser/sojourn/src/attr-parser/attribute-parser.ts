import {Attribute} from "../types/types";

export class AttributeParser {

    constructor(private readonly input: string) {}

    start() {

        const attributes: Attribute[] = [];

        let i = 0;

        while (i < this.input.length) {

            while (this.isSpace(this.input[i])) i++;

            let name = "";

            while (i < this.input.length &&
            !this.isSpace(this.input[i]) &&
            this.input[i] !== "=") {
                name += this.input[i++];
            }

            if (!name) {
                i++;
                continue;
            }

            while (this.isSpace(this.input[i])) i++;

            let value = "";

            if (this.input[i] === "=") {

                i++;

                while (this.isSpace(this.input[i])) i++;

                const quote = this.input[i];

                if (quote === '"' || quote === "'") {

                    i++;

                    while (i < this.input.length && this.input[i] !== quote) {
                        value += this.input[i++];
                    }

                    i++;

                } else {

                    while (i < this.input.length && !this.isSpace(this.input[i])) {
                        value += this.input[i++];
                    }

                }
            }

            attributes.push({ name, value });

        }

        return attributes;
    }

    private isSpace(char?: string) {
        return char === " " || char === "\n" || char === "\t";
    }

}
