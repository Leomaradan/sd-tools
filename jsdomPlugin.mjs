import fs from "fs"
import module from "module"
import path from "path"

// Taken from https://github.com/evanw/esbuild/issues/1311#issuecomment-1386675175

function parse(data) {
  data = data.toString("utf-8")

  //
  // Remove a possible UTF-8 BOM (byte order marker) as this can lead to parse
  // values when passed in to the JSON.parse.
  //
  if (data.charCodeAt(0) === 0xfeff) data = data.slice(1)

  try {
    return JSON.parse(data)
  } catch (e) {
    return false
  }
}

var iteratorSymbol =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? Symbol.iterator
    : null

function addSymbolIterator(result) {
  if (!iteratorSymbol) {
    return result
  }
  result[iteratorSymbol] = function () {
    return this
  }
  return result
}

function findPackageJson(root) {
  root = root || process.cwd()
  if (typeof root !== "string") {
    if (typeof root === "object" && typeof root.filename === "string") {
      root = root.filename
    } else {
      throw new Error(
        "Must pass a filename string or a module object to finder"
      )
    }
  }
  return addSymbolIterator({
    /**
     * Return the parsed package.json that we find in a parent folder.
     *
     * @returns {Object} Value, filename and indication if the iteration is done.
     * @api public
     */
    next: function next() {
      if (root.match(/^(\w:\\|\/)$/))
        return addSymbolIterator({
          done: true,
          filename: undefined,
          value: undefined,
        })

      var file = path.join(root, "package.json"),
        data

      root = path.resolve(root, "..")

      if (fs.existsSync(file) && (data = parse(fs.readFileSync(file)))) {
        data.__path = file

        return addSymbolIterator({
          done: false,
          filename: file,
          value: data,
        })
      }

      return next()
    },
  })
}

const EXTENSIONS = {
  ".cjs": "dynamic",
  ".es": "module",
  ".es6": "module",
  ".json": "json",
  ".mjs": "module",
  ".node": "addon",
  ".wasm": "wasm",
}

async function requireResolve(specifier, parent, system) {
  try {
    // Let the default resolve algorithm try first
    let { format, url } = system(specifier, parent)

    // Resolve symlinks
    if (url.startsWith("file://")) {
      const realpath = await fs.promises.realpath(url.replace("file://", ""))
      url = `file://${realpath}`
    }

    return { format, url }
  } catch (error) {
    const base = parent
      ? path.dirname(parent.replace("file://", ""))
      : process.cwd()
    const require = module.createRequire(path.join(base, specifier))

    let modulePath
    try {
      modulePath = require.resolve(specifier)
    } catch (e) {
      // .cjs is apparently not part of the default resolution algorithm,
      // so check if .cjs file exists before bailing completely
      modulePath = require.resolve(`${specifier}.cjs`)
    }

    const ext = path.extname(modulePath)

    let format = EXTENSIONS[ext] || "module"

    // Mimic default behavior of treating .js[x]? as ESM iff
    // relevant package.json contains { "type": "module" }
    if (!ext || [".js", ".jsx"].includes(ext)) {
      const dir = path.dirname(modulePath)
      const pkgdef = findPackageJson(dir).next()
      const type = pkgdef && pkgdef.value && pkgdef.value.type
      format = type === "module" ? "module" : "dynamic"
    }

    modulePath = await fs.promises.realpath(modulePath)

    return { format, url: `file://${path}` }
  }
}

export const jsdomPatch = {
  name: "jsdom-patch",
  setup(build) {
    build.onLoad({ filter: /XMLHttpRequest-impl\.js$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, "utf8")
      contents = contents.replace(
        'const syncWorkerFile = require.resolve ? require.resolve("./xhr-sync-worker.js") : null;',
        `const syncWorkerFile = "${await requireResolve(
          "jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js"
        )}";`.replaceAll("\\", process.platform === "win32" ? "\\\\" : "\\")
      )
      return { contents, loader: "js" }
    })
  },
}