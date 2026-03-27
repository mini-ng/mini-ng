import {Attribute, Input, Output, Reference, TemplateAttr, Variable} from "../types/types";

export class AttributeParser {

    constructor(private readonly input: string) {}

    start() {

        const attributes: Attribute[] = [];
        const inputs: Input[] = [];
        const outputs: Output[] = [];
        const references: Reference[] = [];
        const templateAttrs: TemplateAttr[] = [];
        const variables: Variable[] = [];

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

            if (name.startsWith("[(") && name.endsWith(")]")) {

                // we have a banana-in-a-box
                name = name.slice(2, -2);
                inputs.push({ name, value });
                outputs.push({ name: name, value: value + "Change" });

            } else if (name.startsWith("(") && name.endsWith(")")) {

                // we have an output
                name = name.slice(1, -1);
                outputs.push({ name, value })

            } else if (name.startsWith("[") && name.endsWith("]")) {

                // we have an input
                name = name.slice(1, -1);
                // get type
                const type = this.getInputType(name)
                inputs.push({ name, value, type });

            } else if (name.startsWith("#")) {

                name = name.slice(1);
                references.push({ name, value })

            } else if (name.startsWith("*")) {

                name = name.slice(1);
                const type = this.getInputType(name)
                templateAttrs.push({name, value, type});

            } else if (name.startsWith("let-")) {

                name = name.slice(4);
                variables.push({ name, value });

            } else {

                attributes.push({ name, value });

            }

        }

        return {
            attributes,
            inputs,
            outputs,
            references,
            templateAttrs,
            variables,
        }
    }

    private isSpace(char?: string) {
        return char === " " || char === "\n" || char === "\t";
    }

    getInputType(input: string) {

        if (input === "class") {
            return "Class"
        }

        if (input === "style") {
            return "Style"
        }

        return "Attribute"

    }

}
