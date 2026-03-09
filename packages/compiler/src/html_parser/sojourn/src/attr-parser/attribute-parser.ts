import {Attribute} from "../types/types";

export class AttributeParser {

    private ignores = [" ", "", "\n", "\p"]
    private ignoresList = [" ", "\n", "\p"]

    constructor(private readonly attributesString: string) {}

    start() {

        const attributes = [] as Attribute[];

        const attributesString = this.attributesString
            .split("=")
            .map(char => char.trim())
            .join("=")

        let name = "";
        let isValue = false;

        for (let i = 0; i < attributesString.length; i++) {

            const char = attributesString[i];

            if(char === "=") {

                const {
                    value,
                    stopIndex
                } = this.findClosingEnd(i, attributesString)

                const attribute = {
                    name,
                    value
                } as Attribute

                attributes.push(attribute)

                i = stopIndex;
                name = ""
                continue

            }

            if(this.ignores.includes(char)) {
                attributes.push({ name })
                name = ""
                continue
            }

            name += char

        }

        return attributes;

    }

    findClosingEnd(currentIndex: number, attributesString: string) {

        let mainChar

        let value = "";
        let stopIndex: number ;

        let lookForValueAfterCurrentIndex;

        for (let i = 0; i < attributesString.length; i++) {

            const char = attributesString[i];
            const nextChar = attributesString[i + 1];

            if (i <= currentIndex) {
                if (i === currentIndex) {
                    lookForValueAfterCurrentIndex = true
                }
                continue;
            }

            if(lookForValueAfterCurrentIndex) {
                if(!this.ignores.includes(char)) {

                    mainChar = char;

                    lookForValueAfterCurrentIndex = false;

                }
                continue;
            }

            if (mainChar === char) {
                stopIndex = i;
                break
            } else {
                value += char;
            }

        }

        return {
            value,
            // @ts-ignore
            stopIndex
        }

    }

}