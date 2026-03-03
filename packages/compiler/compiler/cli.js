const { Command } = require("commander");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const ts = require("typescript");
const { transformToIvy } = require("./transformer");

function findDependencies(filePath, visited = new Set()) {
  if (visited.has(filePath)) {
    return [];
  }

  visited.add(filePath);

  const sourceCode = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.ES2015
  );

  const dependencies = [];
  ts.forEachChild(sourceFile, (node) => {
    if (node.kind === ts.SyntaxKind.ImportDeclaration) {
      const importPath = node.moduleSpecifier.text;
      const importFilePath = importPath.endsWith(".ts")
        ? importPath
        : importPath + ".ts";

      try {
        const resolvedModule = ts.resolveModuleName(
          importFilePath,
          filePath,
          {},
          ts.sys
        ).resolvedModule;

        if (
          resolvedModule &&
          !resolvedModule.isExternalLibraryImport &&
          resolvedModule.resolvedFileName
        ) {
          const absoluteImportPath = resolvedModule.resolvedFileName;

          if (fs.existsSync(absoluteImportPath)) {
            dependencies.push(absoluteImportPath);
            dependencies.push(...findDependencies(absoluteImportPath, visited));
          }
        }
      } catch (error) {
        console.error(
          `Error resolving module path for ${importFilePath}:`,
          error.message
        );
      }
    }
  });

  return dependencies;
}

function transformFileToJS(filePath) {
  const sourceCode = fs.readFileSync(filePath, "utf-8");

  const result = ts.transpileModule(sourceCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.CommonJS,
    },
  });

  return result.outputText;
}

const buildCommand = new Command("build")
  .description("Transform and bundle TypeScript files")
  .action(() => {
    process.chdir("/Users/chidumennamdi/Documents/developerse/my-angular/test");

    const currentDirectory = process.cwd();
    console.log("Current Directory:", currentDirectory);

    const outputDir = path.join(__dirname, "dist");
    fs.mkdirSync(outputDir, { recursive: true });

    const tsFiles = glob.sync("src/**/*.ts");

    const fileDependencies = {};
    tsFiles.forEach((tsFile) => {
      const dependencies = findDependencies(tsFile);
      fileDependencies[tsFile] = dependencies;
    });

    tsFiles.forEach((tsFile) => {
      const isComponentFile = fs
        .readFileSync(tsFile, "utf-8")
        .includes("@Component");

      const jsCode = isComponentFile
        ? transformToIvy(require(tsFile.replace(".ts", "")))
        : transformFileToJS(tsFile);

      const relativePath = path.relative(path.join(__dirname, "src"), tsFile);
      const outputPath = path.join(
        outputDir,
        relativePath.replace(".ts", ".js")
      );

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, jsCode);
    });

    // Implement webpack configuration
    const entry = {};
    tsFiles.forEach((tsFile) => {
      const relativePath = path.relative(path.join(__dirname, "src"), tsFile);
      const fileName = relativePath.replace(".ts", ".js");
      entry[fileName] = `./${fileName}`;
    });

    console.log("entry:", entry);

    const webpackConfig = {
      entry,
      output: {
        filename: "[name]",
        path: outputDir,
      },
    };

    // Run webpack to create the main.js entry point
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err || stats.toString());
      } else {
        console.log("Build successful!");

        // Start webpack-dev-server
        const serverConfig = {
          contentBase: outputDir,
          compress: true,
          port: 9000,
        };
        const server = new WebpackDevServer(
          webpack(webpackConfig),
          serverConfig
        );

        server.listen(9000, "localhost", (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Server is running at http://localhost:9000/");
          }
        });
      }
    });
  });

buildCommand.parse(process.argv);
