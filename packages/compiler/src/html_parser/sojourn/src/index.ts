import {Sojourn as Sojourner} from './sojourn/sojourn';
import {Tokenizer} from "./tokenizer/tokenizer";


export const sojourn = (html: string) => {

    const tokens = new Tokenizer(html).start();

    const sojourner = new Sojourner(tokens)
    const nodes = sojourner.start()

    return nodes

}