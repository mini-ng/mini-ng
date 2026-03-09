// const { Command } = require("commander");
// const webpack = require("webpack");
// const fs = require("fs");
// const glob = require("glob");
// const ts = require("typescript");
// const { transformToIvy } = require("./transformer");

// function transformFileToJS(filePath) {
//   const sourceCode = fs.readFileSync(filePath, "utf-8");

//   const result = ts.transpileModule(sourceCode, {
//     compilerOptions: {
//       target: ts.ScriptTarget.ES2015,
//       module: ts.ModuleKind.CommonJS,
//     },
//   });

//   return result.outputText;
// }

// const buildCommand = new Command("build")
//   .description("Transform and bundle TypeScript files")
//   .action(() => {
//     // Use glob to match TypeScript files in the project directory
//     const tsFiles = glob.sync("src/**/*.ts");

//     // Transform each TypeScript file
//     tsFiles.forEach((tsFile) => {
//       const isComponentFile = fs
//         .readFileSync(tsFile, "utf-8")
//         .includes("@Component");

//       if (isComponentFile) {
//         // Handle Angular components using transformToIvy
//         const componentCode = transformToIvy(
//           require(tsFile.replace(".ts", ""))
//         );
//         const componentName = tsFile.match(/([^\/]+)\.ts$/)[1];
//         fs.writeFileSync(`temp/${componentName}.js`, componentCode);
//       } else {
//         // Handle normal TypeScript code using transpileModule
//         const jsCode = transformFileToJS(tsFile);
//         const fileName = tsFile.match(/([^\/]+)\.ts$/)[1];
//         fs.writeFileSync(`temp/${fileName}.js`, jsCode);
//       }
//     });

//     // Implement webpack configuration
//     const entry = {};
//     tsFiles.forEach((tsFile) => {
//       const fileName = tsFile.match(/([^\/]+)\.ts$/)[1];
//       entry[fileName] = `./temp/${fileName}.js`;
//     });

//     const webpackConfig = {
//       entry,
//       output: {
//         filename: "[name].bundle.js",
//         path: __dirname + "/dist",
//       },
//     };

//     // Run webpack
//     webpack(webpackConfig, (err, stats) => {
//       if (err || stats.hasErrors()) {
//         console.error(err || stats.toString());
//       } else {
//         console.log("Build successful!");
//       }
//     });
//   });

// module.exports = buildCommand;

const { Command } = require("commander");
const webpack = require("webpack");
const fs = require("fs");
const glob = require("glob");
const ts = require("typescript");
const { transformToIvy } = require("./index");

// Function to recursively find dependencies of a TypeScript file
// function findDependencies(filePath, visited = new Set()) {
//   if (visited.has(filePath)) {
//     return [];
//   }

//   visited.add(filePath);

//   const sourceCode = fs.readFileSync(filePath, "utf-8");
//   const sourceFile = ts.createSourceFile(
//     filePath,
//     sourceCode,
//     ts.ScriptTarget.ES2015
//   );

//   const dependencies = [];
//   ts.forEachChild(sourceFile, (node) => {
//     if (node.kind === ts.SyntaxKind.ImportDeclaration) {
//       const importPath = node.moduleSpecifier.text;
//       const importFilePath = importPath.endsWith(".ts")
//         ? importPath
//         : importPath + ".ts";
//       const absoluteImportPath = ts.resolveModuleName(
//         importFilePath,
//         filePath,
//         {},
//         ts.sys
//       ).resolvedModule.resolvedFileName;

//       if (absoluteImportPath && fs.existsSync(absoluteImportPath)) {
//         dependencies.push(absoluteImportPath);
//         dependencies.push(...findDependencies(absoluteImportPath, visited));
//       }
//     }
//   });

//   return dependencies;
// }

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

      // Check if resolveModuleName returns a defined value
      const resolvedModule = ts.resolveModuleName(
        importFilePath,
        filePath,
        {},
        ts.sys
      ).resolvedModule;

      if (resolvedModule && resolvedModule.resolvedFileName) {
        const absoluteImportPath = resolvedModule.resolvedFileName;

        if (fs.existsSync(absoluteImportPath)) {
          dependencies.push(absoluteImportPath);
          dependencies.push(...findDependencies(absoluteImportPath, visited));
        }
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

    // Use glob to match TypeScript files in the project directory
    const tsFiles = glob.sync("src/**/*.ts");

    console.log("tsFiles:", tsFiles);

    // Find all dependencies for each TypeScript file
    const fileDependencies = {};
    tsFiles.forEach((tsFile) => {
      const dependencies = findDependencies(tsFile);
      fileDependencies[tsFile] = dependencies;
    });

    // Transform each TypeScript file
    tsFiles.forEach((tsFile) => {
      const isComponentFile = fs
        .readFileSync(tsFile, "utf-8")
        .includes("@Component");

      if (isComponentFile) {
        // Handle Angular components using transformToIvy
        const componentCode = transformToIvy(
          require(tsFile.replace(".ts", ""))
        );
        const componentName = tsFile.match(/([^\/]+)\.ts$/)[1];
        fs.writeFileSync(`temp/${componentName}.js`, componentCode);
      } else {
        // Handle normal TypeScript code using transpileModule
        const jsCode = transformFileToJS(tsFile);
        const fileName = tsFile.match(/([^\/]+)\.ts$/)[1];
        fs.writeFileSync(`temp/${fileName}.js`, jsCode);
      }
    });

    // Implement webpack configuration
    const entry = {};
    tsFiles.forEach((tsFile) => {
      const fileName = tsFile.match(/([^\/]+)\.ts$/)[1];
      entry[fileName] = `./temp/${fileName}.js`;
    });

    const webpackConfig = {
      entry,
      output: {
        filename: "[name].bundle.js",
        path: __dirname + "/dist",
      },
    };

    // Run webpack
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        console.error(err || stats.toString());
      } else {
        console.log("Build successful!");
      }
    });
  });

buildCommand.parse(process.argv);
