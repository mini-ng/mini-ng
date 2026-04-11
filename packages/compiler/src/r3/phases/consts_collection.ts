import {CompilationJob} from "../../ir/compilation";

export function constCollection(job: CompilationJob) {
    for (const unit of job.units) {
        for (const op of unit.update) {
        }
    }
}
