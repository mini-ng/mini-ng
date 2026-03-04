import {Directive, Input} from "../core";
import {TemplateRef} from "./TemplateRef";
import {ViewContainerRef} from "./ViewContainerRef";

@Directive({
    selector: '[miniNgIf]'
})
export class MiniNgIf {

    private hasView = false;

    constructor(
        private vcr: ViewContainerRef,
        private tpl: TemplateRef<any>
    ) {}

    @Input()
    set miniNgIf(condition: boolean) {
        if (condition && !this.hasView) {
            this.vcr.createEmbeddedView(this.tpl);
            this.hasView = true;
        }
        else if (!condition && this.hasView) {
            this.vcr.clear();
            this.hasView = false;
        }
    }
}
