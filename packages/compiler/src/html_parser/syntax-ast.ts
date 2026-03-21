import {ChildNode, ElementType, NodeWithChildren, Node} from "./nodes";
import {ASTWithSource} from "./ast/ast";
import {Variable} from "./sojourn/src/types/types";
import {HtmlAstVisitor} from "./ast/html-ast";

export class IfBlock extends NodeWithChildren {

    constructor(
        public expression: ASTWithSource | null,
        public branches: ElseIfBlock[],
        public elseBranch: ElseBlock,
        public children: ChildNode[] = [],
    ) {
        super(children);
    }

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    accept(visitor: HtmlAstVisitor) {
        visitor.visitIfBlock(this)
    }

}

export class ElseIfBlock extends NodeWithChildren {
    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    constructor(
        public expression: ASTWithSource | null,
        public children: ChildNode[] = [],
    ) {
        super(children);
    }

    accept(visitor: HtmlAstVisitor) {
        return visitor.visitElseIfBlock(this)
    }

}

export class ElseBlock extends NodeWithChildren {
    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    constructor(
        public expression: ASTWithSource | null,
        public children: ChildNode[] = [],
    ) {
        super(children);
    }

    accept(visitor: HtmlAstVisitor) {
        return visitor.visitElseBlock(this)
    }

}

export class ForLoopBlock extends NodeWithChildren {
    constructor(
        public item: Variable,
        public expression: ASTWithSource,
        public trackBy: ASTWithSource,
        public contextVariables: Variable[],
        public children: ChildNode[] = [],
        public empty: ForLoopBlockEmpty | null,
    ) {
        super(children);
    }

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    accept(visitor: HtmlAstVisitor) {
    }

}

export class ForLoopBlockEmpty extends NodeWithChildren {
    constructor(
        public children: ChildNode[] = [],
    ) {
        super(children);
    }

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

}

export class SwitchNode extends NodeWithChildren {

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    constructor(
        public children: ChildNode[] = [],
        public expression: ASTWithSource | null,
        public cases: CaseNode[] = [],
        public defaultNode: DefaultNode,
    ) {
        super(children);
    }

    accept(visitor: HtmlAstVisitor) {
    }

}

export class CaseNode extends NodeWithChildren {

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    constructor(
        public children: ChildNode[] = [],
        public expression: ASTWithSource,
    ) {
        super(children);
    }

}

export class DefaultNode extends NodeWithChildren {

    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    constructor(
        public children: ChildNode[] = [],
    ) {
        super(children);
    }

}

// this represent ng-content
export class Content extends Node {
    readonly nodeType: number = 1;
    readonly type: ElementType = ElementType.Tag;

    accept(visitor: HtmlAstVisitor) {
    }
}
