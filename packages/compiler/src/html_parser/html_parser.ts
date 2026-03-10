import { Document } from "./nodes"
import {sojourn} from "./sojourn/src";

export function parseDocument(text: string) : Document {
    return sojourn(text)
}
