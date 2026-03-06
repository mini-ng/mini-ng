import {Directive, Input} from "../core/component";

@Directive({
    selector: '[miniNgFor][miniNgForOf]'
})
export class MiniNgFor {
    @Input()
    set miniNgForOf(ngForOf) {
        console.log(ngForOf);
    }
}
