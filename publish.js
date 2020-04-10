#!/usr/bin/env node
/* Publish.js, publish a new version of the npm package as found in the current directory */
/* Run this file from the root of the repository */

const path = require("path")
const shell = require("shelljs")
const fs = require("fs")
const prompts = require("prompts")
const semver = require("semver")

function run(command, options) {
    const continueOnErrors = options && options.continueOnErrors
    const ret = shell.exec(command, options)
    if (!continueOnErrors && ret.code !== 0) {
        exit(1)
    }
    return ret
}

function exit(code, msg) {
    console.error(msg)
    shell.exit(code)
}

function writeJSON(path, obj) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, JSON.stringify(obj, null, 2), err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

async function main() {
    const status = run("git status --porcelain -uno", { silent: true })
    if (status.stdout.length > 0) {
        exit(0, "You have uncommited local changes. Aborting...")
    }

    if (!process.env.npm_config_registry || process.env.npm_config_registry.includes("yarn")) {
        exit(0, "Make sure to do npm run release, Yarn is broken.")
    }

    const rootPath = path.resolve(__dirname)
    const rootPkgFile = path.join(rootPath, "package.json")
    const rootPkg = require(rootPkgFile)

    const nextPatch = semver.inc(rootPkg.version, "patch")
    const nextMinor = semver.inc(rootPkg.version, "minor")
    const nextMajor = semver.inc(rootPkg.version, "major")

    const resp = await prompts(
        [
            {
                type: "select",
                name: "action",
                message: "What do you want to publish?",
                choices: [
                    { title: "Nothing, abort this", value: null },
                    { title: `Patch version (${nextPatch})`, value: nextPatch },
                    { title: `Minor version (${nextMinor})`, value: nextMinor },
                    { title: `Major version (${nextMajor})`, value: nextMajor }
                ],
                initial: null
            }
        ],
        { onCancel: () => exit(0) }
    )

    if (resp.action === null) {
        return
    }

    const nextVersion = resp.action

    console.log("Starting build...")
    run("npm run build")
    console.log("Build is done")

    await writeJSON(rootPkgFile, { ...rootPkg, version: nextVersion })
    await executePublish()

    run(`git add ${rootPkgFile}`)
    run(`git commit --no-verify -m "Published version ${nextVersion}"`)
    run("git push")
    run(`git tag ${nextVersion}`)
    run("git push --tags")

    console.log("Pushed updated version & tags to git")

    exit(0)

    async function executePublish() {
        // Check registry data
        const npmInfoRet = run(`npm info ${rootPkg.name} --json`, {
            continueOnErrors: true,
            silent: true
        })

        const publishedPackageInfo = JSON.parse(npmInfoRet.stdout)
        if (publishedPackageInfo.versions.includes(nextVersion)) {
            throw new Error(`Version ${nextVersion} is already published in NPM`)
        }

        console.log(`Starting publish of ${nextVersion}...`)
        run(`npm publish`)
        console.log(`Published ${nextVersion} to NPM`)
    }
}

main().catch(e => {
    console.error(e)
})
