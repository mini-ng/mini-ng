import {sojourn} from "../html_parser/sojourn";
import {ingestComponent} from "./ingest";
import {ComponentCompilationJob} from "../ir/compilation";

export function compileComponentFromMetadata(html: string) {
    const ast = sojourn(html);
    const job = new ComponentCompilationJob("", [])
    const tpl = ingestComponent(job, ast.childNodes)

    transform(tpl)
}

function transform(tpl) {

}
