import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export function createNewProject(projectName: string) {
    if (!projectName) {
        console.error("❌ Please provide a project name.");
        process.exit(1);
    }

    const projectPath = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        console.error("❌ Folder already exists.");
        process.exit(1);
    }

    console.log(`🚀 Creating project: ${projectName}`);

    createProjectStructure(projectPath, projectName);

    console.log("📦 Installing dependencies...");
    execSync("npm install", { cwd: projectPath, stdio: "inherit" });

    console.log("✅ Project created successfully!");

}

function createProjectStructure(projectPath: string, name: string) {
    fs.mkdirSync(projectPath);
    fs.mkdirSync(path.join(projectPath, "src"));
    fs.mkdirSync(path.join(projectPath, "src/app"), { recursive: true });

    createPackageJson(projectPath, name);
    createTsConfig(projectPath);
    createMainFile(projectPath);
    createAppComponent(projectPath);
    createIndexHTML(projectPath);
}

function createPackageJson(projectPath: string, name: string) {
    const pkg = {
        name,
        version: "1.0.0",
        scripts: {
            build: "mngc build",
            start: "mngc serve"
        },
        dependencies: {
            "@mini-ng/core": "latest",
        },
    };

    fs.writeFileSync(
        path.join(projectPath, "package.json"),
        JSON.stringify(pkg, null, 2)
    );
}

function createTsConfig(projectPath: string) {
    // const tsconfig = {
    //     compilerOptions: {
    //         target: "ES2020",
    //         module: "CommonJS",
    //         outDir: "dist",
    //         rootDir: "src",
    //         strict: true
    //     }
    // };

    const tsconfig = /* To learn more about this file see: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html. */
        {
            "compileOnSave": false,
            "compilerOptions": {
                "outDir": "./dist/out-tsc",
                "forceConsistentCasingInFileNames": true,
                "strict": true,
                "noImplicitOverride": true,
                "noPropertyAccessFromIndexSignature": true,
                "noImplicitReturns": true,
                "noFallthroughCasesInSwitch": true,
                "sourceMap": true,
                "declaration": false,
                "downlevelIteration": true,
                "experimentalDecorators": true,
                "moduleResolution": "node",
                "importHelpers": true,
                "target": "ES2022",
                "module": "ES2022",
                "useDefineForClassFields": false,
                "lib": ["ES2022", "dom"]
            }
        }


    fs.writeFileSync(
        path.join(projectPath, "tsconfig.json"),
        JSON.stringify(tsconfig, null, 2)
    );
}

function createMainFile(projectPath: string) {

    const packageRoot = path.resolve(__dirname, "");

    const mainTemplate = path.join(packageRoot, "template/main.template");

    const mainTemplateString = fs.readFileSync(mainTemplate, "utf-8");

    fs.writeFileSync(
        path.join(projectPath, "src/main.ts"),
        mainTemplateString
    );
}

function createAppComponent(projectPath: string) {

    const packageRoot = path.resolve(__dirname, "");

    const appComponentTemplate = path.join(packageRoot, "template/app.component.template");

    const templateHTMLDir = path.join(packageRoot, "template/template-html.html");
    const templateCSSDir = path.join(packageRoot, "template/template-css.css");

    let html = fs.readFileSync(templateHTMLDir, "utf8");

    let css = fs.readFileSync(templateCSSDir, "utf8");

    const appComponentString = fs.readFileSync(appComponentTemplate, "utf-8");

    fs.writeFileSync(
        path.join(projectPath, "src/app/app.component.ts"),
        appComponentString
    );

    fs.writeFileSync(
        path.join(projectPath, "src/app/app.component.html"),
        html
    );

    fs.writeFileSync(
        path.join(projectPath, "src/app/app.component.css"),
        css
    );

}

function createIndexHTML(projectPath: string) {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My MiniNg App</title>
</head>
<body>
  <div id="app"></div>
    <app-root></app-root>
</body>
</html>
    `

    fs.writeFileSync(
        path.join(projectPath, "index.html"),
        html
    );

}
