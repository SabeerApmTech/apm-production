import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import ts from "typescript"
import { configureStore } from "@reduxjs/toolkit"
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

// Exercise the real endpoint module and RTK Query lifecycle with an in-memory HTTP
// transport. No backend records or credentials are used by these tests.
const source = readFileSync(new URL("../src/store/services/productionItemApi.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function setup(t, respond = () => ({ success: true, message: "OK", data: [] })) {
  const requests = []
  const api = createApi({
    baseQuery: fetchBaseQuery({
      baseUrl: "https://test.invalid/api",
      fetchFn: async (request) => {
        const url = new URL(request.url)
        const body = await request.text()
        const captured = { method: request.method, path: url.pathname, params: Object.fromEntries(url.searchParams), body: body ? JSON.parse(body) : undefined }
        requests.push(captured)
        const response = respond(captured)
        return Response.json(response.body ?? response, { status: response.status ?? 200 })
      },
    }),
    tagTypes: ["ProductionItem", "ProductionItemOperations"],
    endpoints: () => ({}),
  })
  const exports = {}
  const imports = {
    "../api": { api, unwrap: (response) => response.data },
    "@/utils/auth": { getCurrentEmployeeId: () => "EMP & 42" },
  }
  new Function("require", "exports", compiled)((name) => {
    assert.ok(imports[name], `Unexpected import: ${name}`)
    return imports[name]
  }, exports)
  const store = configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) })
  t.after(() => store.dispatch(api.util.resetApiState()))
  return { requests, api, store, run: (name, arg) => store.dispatch(api.endpoints[name].initiate(arg)) }
}

test("all eight API contracts use the specified paths, fields, and employee ID placement", async (t) => {
  const op = { productionOperationId: 5, productionItemId: 1, operationCode: "LCD", operationName: "Assembly", processTeamName: "Assembly", isQrApplicable: true }
  const item = { productionItemId: 1, productionCode: "001", itemName: "AIS-140", identifierTypeId: 1, uniqueIdentifierName: "IMEI", operations: [op] }
  const { requests, run } = setup(t, (request) => ({ success: true, message: "OK", data: request.path.endsWith("/operations") ? [op] : [item] }))
  assert.deepEqual(await run("getProductionItems").unwrap(), [item])
  assert.deepEqual(await run("getProductionItemOperations", 1).unwrap(), [op])
  // A separate store keeps mutation contract checks independent of query refetches.
  const { run: mutate, requests: mutations } = setup(t)
  const itemBody = { productionCode: "001", itemName: "AIS-140", identifierTypeId: 1 }
  const operationBody = { operationCode: "LCD", operationName: "Assembly", processTeamName: "Assembly", isQrApplicable: false }
  await mutate("createProductionItem", itemBody).unwrap()
  await mutate("updateProductionItem", { productionItemId: 1, body: itemBody }).unwrap()
  await mutate("deleteProductionItems", [1, 2]).unwrap()
  await mutate("addProductionItemOperation", { productionItemId: 1, body: operationBody }).unwrap()
  await mutate("editProductionItemOperation", { productionItemId: 1, operationId: 5, body: operationBody }).unwrap()
  await mutate("deleteProductionItemOperations", { productionItemId: 1, productionOperationIds: [5, 6] }).unwrap()
  const base = "/api/master/production-item"
  const params = { employeeId: "EMP & 42" }
  assert.deepEqual(requests, [
    { method: "GET", path: base, params: {}, body: undefined },
    { method: "GET", path: `${base}/1/operations`, params: {}, body: undefined },
  ])
  assert.deepEqual(mutations, [
    { method: "POST", path: base, params, body: itemBody },
    { method: "PUT", path: `${base}/1`, params, body: itemBody },
    { method: "DELETE", path: `${base}/1`, params, body: undefined },
    { method: "DELETE", path: `${base}/2`, params, body: undefined },
    { method: "POST", path: `${base}/1/operations`, params, body: operationBody },
    { method: "PUT", path: `${base}/1/operations/5`, params, body: operationBody },
    { method: "DELETE", path: `${base}/operation`, params: {}, body: { employeeId: "EMP & 42", productionOperationIds: [5, 6] } },
  ])
})

test("operation changes refetch item counts and the affected operation list only", async (t) => {
  const { api, store, requests, run } = setup(t)
  await run("getProductionItems").unwrap()
  await run("getProductionItemOperations", 1).unwrap()
  await run("getProductionItemOperations", 2).unwrap()
  requests.length = 0
  await run("editProductionItemOperation", { productionItemId: 1, operationId: 5, body: { operationCode: "LED", operationName: "Inspect", processTeamName: "Assembly", isQrApplicable: true } }).unwrap()
  await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()))
  assert.deepEqual(requests.filter((r) => r.method === "GET").map((r) => r.path).sort(), [
    "/api/master/production-item", "/api/master/production-item/1/operations",
  ])
})

test("partial item deletion failures refresh the list and do not report success", async (t) => {
  const { api, store, requests, run } = setup(t, (request) => request.method === "DELETE" && request.path.endsWith("/2")
    ? { status: 409, body: { success: false, message: "Item is in use", data: null } }
    : { success: true, message: "OK", data: [] })
  await run("getProductionItems").unwrap()
  requests.length = 0
  await assert.rejects(run("deleteProductionItems", [1, 2, 3]).unwrap(), (error) => error.status === 409)
  await Promise.all(store.dispatch(api.util.getRunningQueriesThunk()))
  assert.deepEqual(requests.map((r) => `${r.method} ${r.path}`), [
    "DELETE /api/master/production-item/1", "DELETE /api/master/production-item/2", "GET /api/master/production-item",
  ])
})
