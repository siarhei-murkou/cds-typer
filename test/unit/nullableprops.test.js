'use strict'

const { describe, before, it } = require('node:test')
const assert = require('assert')
const { locations, prepareUnitTest } = require('../util')
const { check } = require('../ast')

// This test suite validates the recent behavior for nullable properties:
// - For CDS types only, nullable properties (incl. arrays) are emitted with '?:' and include '| null'.
// - Entities remain required (':') but types still include '| null' where applicable.
// - Nested inline objects within types propagate the optional marker for nullable properties.

describe('Nullable properties in CDS types vs entities', () => {
    let astw

    before(async () => {
        astw = (await prepareUnitTest('nullableprops/model.cds', locations.testOutput('nullable_props_test'))).astw
    })

    describe('CDS type (T) optional markers and nullability', () => {
        let aspect
        before(() => {
            aspect = astw.tree.find(n => n.name === '_TAspect').body[0]
        })

        it('should mark nullable scalar as optional and include | null', async () => {
            const a = aspect.members.find(m => m.name === 'a')
            assert.ok(a, 'type T.a not found')
            assert.strictEqual(a.optional, true, 'type T.a should be optional')
            assert.ok(check.isNullable(a.type, [check.isNumber]), 'type T.a should be number | null')
        })

        it('should keep not null/@mandatory scalars required and without | null', async () => {
            const b = aspect.members.find(m => m.name === 'b')
            const c = aspect.members.find(m => m.name === 'c')
            assert.ok(b && c, 'type T.b or T.c not found')
            assert.strictEqual(b.optional, false)
            assert.strictEqual(c.optional, false)
            assert.ok(check.isNumber(b.type) && !check.isNullable(b.type))
            assert.ok(check.isNumber(c.type) && !check.isNullable(c.type))
        })

        it('should propagate optional markers to nested struct nullable members', async () => {
            const s = aspect.members.find(m => m.name === 's')
            assert.ok(s, 'type T.s not found')
            // s has inline type literal with members
            const members = s.type.members
            const x = members.find(m => m.name === 'x')
            const y = members.find(m => m.name === 'y')
            const z = members.find(m => m.name === 'z')
            assert.ok(x && y && z, 'nested members x/y/z not found')
            assert.strictEqual(x.optional, true, 'nested x should be optional')
            assert.ok(check.isNullable(x.type, [check.isString]), 'nested x should be string | null')
            assert.strictEqual(y.optional, false, 'nested y should be required')
            assert.ok(check.isString(y.type) && !check.isNullable(y.type), 'nested y should be string (non-null)')
            assert.strictEqual(z.optional, false, 'nested z should be required')
            assert.ok(check.isString(z.type) && !check.isNullable(z.type), 'nested z should be string (non-null)')
        })

        it('should mark array-typed nullable properties as optional and include | null', async () => {
            const d = aspect.members.find(m => m.name === 'd')
            assert.ok(d, 'type T.d not found')
            assert.strictEqual(d.optional, true, 'type T.d should be optional')
            // Array<...> | null
            assert.ok(check.isNullable(d.type, [t => t?.full === 'Array' && check.isNumber(t.args[0])]), 'type T.d should be Array<number> | null')
        })

        it('should keep @mandatory array property required', async () => {
            const e = aspect.members.find(m => m.name === 'e')
            assert.ok(e, 'type T.e not found')
            assert.strictEqual(e.optional, false, 'type T.e should be required')
            // Array<...> without | null
            assert.ok(e.type?.full === 'Array' && check.isNumber(e.type.args[0]) && !check.isNullable(e.type), 'type T.e should be Array<number> (non-null)')
        })

        it('should apply same array optionality rules to nested arrays', async () => {
            const s = aspect.members.find(m => m.name === 's')
            const members = s.type.members
            const arr = members.find(m => m.name === 'arr')
            const arrM = members.find(m => m.name === 'arrM')
            assert.ok(arr && arrM, 'nested arrays not found')
            assert.strictEqual(arr.optional, true, 'nested s.arr should be optional')
            assert.ok(check.isNullable(arr.type, [t => t?.full === 'Array' && check.isString(t.args[0])]), 'nested s.arr should be Array<string> | null')
            assert.strictEqual(arrM.optional, false, 'nested s.arrM should be required')
            assert.ok(arrM.type?.full === 'Array' && check.isString(arrM.type.args[0]) && !check.isNullable(arrM.type), 'nested s.arrM should be Array<string> (non-null)')
        })
    })

    describe('CDS entity (E) remains required but still nullable where applicable', () => {
        let aspect
        before(() => {
            aspect = astw.tree.find(n => n.name === '_EAspect').body[0]
        })

        it('should keep nullable scalar required with : and include | null', async () => {
            const a = aspect.members.find(m => m.name === 'a')
            assert.ok(a)
            assert.strictEqual(a.optional, false, 'entity E.a should be required')
            assert.ok(check.isNullable(a.type, [check.isNumber]), 'entity E.a should be number | null')
        })

        it('should keep arrays required and type without | null for non-null arrays', async () => {
            const d = aspect.members.find(m => m.name === 'd')
            assert.ok(d)
            assert.strictEqual(d.optional, false, 'entity E.d should be required')
            // For entities array properties are required. The type itself in current implementation is non-null.
            assert.ok(d.type?.full === 'Array' && check.isNumber(d.type.args[0]) && !check.isNullable(d.type), 'entity E.d should be Array<number> (non-null)')
        })

        it('should keep nested scalar in entities required but allow | null where applicable', async () => {
            const s = aspect.members.find(m => m.name === 's')
            const members = s.type.members
            const x = members.find(m => m.name === 'x')
            assert.ok(x)
            assert.strictEqual(x.optional, false, 'entity E.s.x should be required')
            assert.ok(check.isNullable(x.type, [check.isString]), 'entity E.s.x should be string | null')
        })
    })
})
