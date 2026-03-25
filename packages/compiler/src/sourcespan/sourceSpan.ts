
export class SourcePosition {
    offset: number;
    line: number;
    column: number;
}

export class SourceSpan {
    start: SourcePosition
    end:   SourcePosition
    text: string

    constructor(start: SourcePosition, end: SourcePosition) {}

}
