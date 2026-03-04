import {Directive, Input} from "../core";
import {TemplateRef} from "./TemplateRef";
import {ViewContainerRef} from "./ViewContainerRef";

@Directive({
    selector: '[ngIf]'
})
export class NgIf {

    private hasView = false;

    constructor(
        private vcr: ViewContainerRef,
        private tpl: TemplateRef<any>
    ) {}

    @Input()
    set myIf(condition: boolean) {
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
