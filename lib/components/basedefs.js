const { SourceFile } = require('../file')
const fs = require('node:fs')
const path = require('node:path')
const { configuration } = require('../config')

/** @type {string} */
let tsBoilerplate
/** @type {SourceFile} */
let baseDefinitions

/**
 * @returns {string}
 */
function getTsBoilerplate () {
    if (!tsBoilerplate) {
        tsBoilerplate = fs.readFileSync(path.join(__filename, '..', '..', 'boilerplate/tsBoilerplate.ts'), 'utf8')
    }
    return tsBoilerplate
}

/**
 * @returns {SourceFile}
 */
function getBaseDefinitions () {
    if (!baseDefinitions) {
        baseDefinitions = new SourceFile('_')
        let boiler = getTsBoilerplate()
        if (configuration.outputDTsFiles) {
            // Transform boilerplate into ambient-safe declarations for .d.ts
            // 1) Drop default import of cds and convert other imports to type-only
            boiler = boiler
                .replace(/^import\s+cds\s+from\s+['"]@sap\/cds['"];?\s*$/m, '')
                .replace(/import\s*\{\s*type\s*\}\s*from\s*['"]@sap\/cds['"];?/m, 'import type { type } from "@sap/cds"')
            // 2) Rewrite Entity.data method to declaration (no body)
            boiler = boiler.replace(
                /export\s+class\s+Entity\s*\{[\s\S]*?static\s+data<[^>]+>\s*\(this:[^)]*\)\s*:[^\{]+\{[\s\S]*?\}\s*\}/m,
                'export declare class Entity { static data<T extends Entity>(this: T, _input: Object): T }'
            )
            // 3) Replace runtime symbol with unique symbol declaration
            boiler = boiler.replace(/const\s+key\s*=\s*Symbol\([^)]*\);?/m, 'declare const key: unique symbol')
            // 4) Replace createEntityProxy implementation with declaration
            boiler = boiler.replace(/export\s+const\s+createEntityProxy\s*=\s*function\b[\s\S]*?\}\)\s*\};?/m, '')
        }
        baseDefinitions.addPreamble(boiler)
    }
    return baseDefinitions
}

module.exports = { getBaseDefinitions }
