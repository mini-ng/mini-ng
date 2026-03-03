let helpText = `
mngc - Minimal MiniNg Compiler CLI

Commands:
  new <name>        Create new project
  build             Build project
  serve --port <n>  Serve project
    `

export function help() {
    return helpText
}

export function helpAction() {
    const helpText = help()

    console.log(helpText)
}
