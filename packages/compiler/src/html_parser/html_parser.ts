import { Document } from "./nodes"
import {sojourn} from "./sojourn";

export function parseDocument(text: string) : Document {
    return sojourn(text)
}
