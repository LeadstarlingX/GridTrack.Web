#!/usr/bin/env npx tsx
//
// Scans the frontend codebase for all API calls and generates
// an endpoints reference from the actual code — not documentation.
//
// Usage: npx tsx scripts/extract-endpoints.ts
//

import { Project, SyntaxKind, type CallExpression, type InterfaceDeclaration, type TypeAliasDeclaration } from 'ts-morph'
import * as fs from 'fs'
import * as path from 'path'

// ─── Config ────────────────────────────────────────────────────────────────
const SCAN_PATTERNS = [
    'src/api/**/*.ts',
    'src/hooks/**/*.ts',
    'src/services/**/*.ts',
    'src/lib/**/*.ts',
]
const TYPES_FILE = 'src/types/api.ts'
const OUTPUT_FILE = 'endpoints-generated.md'
const API_CLIENT_NAMES = new Set(['api', 'client', 'instance'])
const HTTP_METHODS = new Set(['get', 'post', 'patch', 'put', 'delete'])

// ─── Types ─────────────────────────────────────────────────────────────────
interface ExtractedCall {
    method: string
    url: string
    urlDisplay: string       // human-friendly version of template literals
    responseType: string | null
    requestType: string | null
    file: string
    line: number
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
    const project = new Project({
        tsConfigFilePath: './tsconfig.json',
        skipAddingFilesFromTsConfig: true,
    })

    // Add source files to scan (not types file)
    const sourceFiles = project.addSourceFilesAtPaths(SCAN_PATTERNS)
        .filter(sf => !sf.getFilePath().includes('/types/'))

    // Add types file for resolution
    const typesFile = project.getSourceFile(TYPES_FILE)

    // ── Extract all API calls ──
    const calls: ExtractedCall[] = []

    for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath()
        const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)

        for (const call of callExprs) {
            const extracted = extractApiCall(call)
            if (extracted) {
                calls.push({
                    ...extracted,
                    file: path.relative(process.cwd(), filePath),
                    line: call.getStartLineNumber(),
                })
            }
        }
    }

    // ── Deduplicate by method + normalized URL ──
    const seen = new Set<string>()
    const unique: ExtractedCall[] = []
    for (const call of calls) {
        const key = `${call.method} ${call.url}`
        if (!seen.has(key)) {
            seen.add(key)
            unique.push(call)
        }
    }

    // Sort: static URLs first (alphabetical), then dynamic URLs
    unique.sort((a, b) => {
        const aDynamic = a.url.includes('${')
        const bDynamic = b.url.includes('${')
        if (aDynamic !== bDynamic) return aDynamic ? 1 : -1
        return a.url.localeCompare(b.url) || a.method.localeCompare(b.method)
    })

    // ── Resolve type definitions ──
    const typeDefinitions = new Map<string, string>()
    if (typesFile) {
        const allTypeNames = new Set<string>()
        for (const call of unique) {
            if (call.responseType) allTypeNames.add(call.responseType)
            if (call.requestType) allTypeNames.add(call.requestType)
        }
        for (const name of allTypeNames) {
            const resolved = resolveTypeDefinition(typesFile, name)
            if (resolved) typeDefinitions.set(name, resolved)
        }
    }

    // ── Generate markdown ──
    const md = generateMarkdown(unique, typeDefinitions)
    const outputPath = path.join(process.cwd(), OUTPUT_FILE)
    fs.writeFileSync(outputPath, md, 'utf-8')

    // ── Console output ──
    console.log(`\n✅ Extracted ${unique.length} endpoints → ${OUTPUT_FILE}\n`)
    console.log('─'.repeat(100))
    for (const call of unique) {
        const resp = call.responseType ?? '(untyped)'
        const req = call.requestType ? `[${call.requestType}]` : ''
        console.log(
            `  ${call.method.padEnd(6)} ${call.urlDisplay.padEnd(50)} ${req.padEnd(45)} → ${resp}`
        )
    }
    console.log('─'.repeat(100))

    if (typeDefinitions.size > 0) {
        console.log(`\n📦 Resolved ${typeDefinitions.size} type definitions from ${TYPES_FILE}\n`)
    }

    // Warn about untyped calls
    const untyped = unique.filter(c => !c.responseType)
    if (untyped.length > 0) {
        console.log(`\n⚠️  ${untyped.length} call(s) have no response type — add generic to axios call:`)
        for (const c of untyped) {
            console.log(`   ${c.file}:${c.line}  ${c.method} ${c.urlDisplay}`)
        }
        console.log()
    }
}

// ─── Extract a single API call from a CallExpression ───────────────────────
function extractApiCall(call: CallExpression): ExtractedCall | null {
    const expr = call.getExpression()
    if (!expr.isPropertyAccessExpression()) return null

    const methodName = expr.getName()
    if (!HTTP_METHODS.has(methodName)) return null

    // Check the object is a known API client name
    const objectExpr = expr.getExpression()
    const objectName = objectExpr.getText()
    if (!API_CLIENT_NAMES.has(objectName)) return null

    // ── URL ──
    const args = call.getArguments()
    if (args.length === 0) return null

    const urlArg = args[0]
    let url: string
    let urlDisplay: string

    if (urlArg.isStringLiteral()) {
        url = urlArg.getLiteralValue()
        urlDisplay = url
    } else if (urlArg.isKind(SyntaxKind.TemplateExpression) || urlArg.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        // Template literal: `/api/drivers/${id}/availability`
        url = urlArg.getText()
        urlDisplay = url
            .replace(/`/g, '')
            .replace(/\$\{[^}]+\}/g, '{id}')
            .replace(/\n/g, '')
            .replace(/\s+/g, ' ')
    } else {
        // Dynamic — can't extract
        url = urlArg.getText().slice(0, 80)
        urlDisplay = url
    }

    // ── Response type from generic: api.get<Response>(...) ──
    const typeArgs = call.getTypeArguments()
    const responseType = typeArgs.length > 0 ? cleanTypeName(typeArgs[0].getText()) : null

    // ── Request type from second argument ──
    let requestType: string | null = null
    if (args.length > 1) {
        const optionsArg = args[1]
        requestType = extractRequestType(optionsArg)
    }

    return { method: methodName.toUpperCase(), url, urlDisplay, responseType, requestType }
}

// ─── Extract request type from the options argument ────────────────────────
function extractRequestType(arg: any): string | null {
    // Case 1: { params: typedVar } or { data: typedVar }
    if (arg.isObjectLiteralExpression()) {
        for (const prop of arg.getProperties()) {
            const name = prop.getName()
            if (name === 'params' || name === 'data') {
                const init = prop.getInitializer()
                if (!init) continue
                const symbol = init.getSymbol()
                if (symbol) {
                    const declaredType = symbol.getDeclaredType()
                    const text = cleanTypeName(declaredType.getText())
                    if (text && text !== 'any' && text !== 'object' && !text.startsWith('{')) {
                        return text
                    }
                }
            }
        }
        return null
    }

    // Case 2: Direct variable with a type: fetchDeliveries(params) where params: DeliveriesQueryParams
    const symbol = arg.getSymbol()
    if (symbol) {
        const declaredType = symbol.getDeclaredType()
        const text = cleanTypeName(declaredType.getText())
        if (text && text !== 'any' && text !== 'object' && !text.startsWith('{')) {
            return text
        }
    }

    return null
}

// ─── Resolve a type name to its full definition ───────────────────────────
function resolveTypeDefinition(
    typesFile: any,
    typeName: string
): string | null {
    // Strip generic args for lookup: PagedResponse<DeliveryListItemDto> → PagedResponse
    const baseName = typeName.replace(/<.*>$/, '').trim()

    // Try interface
    const iface = typesFile.getInterface(baseName)
    if (iface) return formatDeclaration(iface)

    // Try type alias
    const alias = typesFile.getTypeAlias(baseName)
    if (alias) return formatDeclaration(alias)

    return null
}

function formatDeclaration(decl: InterfaceDeclaration | TypeAliasDeclaration): string {
    const lines: string[] = []
    const name = decl.getName()
    const kind = decl.getKindName() === 'InterfaceDeclaration' ? 'interface' : 'type'

    // Get the type text directly — ts-morph handles nested types
    const typeNode = (decl as any).getTypeNode?.() ?? (decl as any).getNode()
    const typeText = decl.getText().replace(/^export\s+/, '')

    // Build a cleaner version
    lines.push(`\`\`\`ts`)
    lines.push(typeText)
    lines.push(`\`\`\``)
    return lines.join('\n')
}

// ─── Clean up type names from ts-morph output ─────────────────────────────
function cleanTypeName(raw: string): string | null {
    if (!raw || raw === 'any' || raw === 'void' || raw === 'unknown') return null
    // ts-morph sometimes outputs import paths: import("...").Type
    const cleaned = raw
        .replace(/import\("[^"]+"\)\./g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    return cleaned || null
}

// ─── Generate the markdown document ────────────────────────────────────────
function generateMarkdown(
    calls: ExtractedCall[],
    typeDefinitions: Map<string, string>
): string {
    const lines: string[] = []

    lines.push('# GridTrack API — Extracted from Frontend Code')
    lines.push('')
    lines.push(`> **Generated:** ${new Date().toISOString().split('T')[0]}`)
    lines.push(`> **Source:** \`scripts/extract-endpoints.ts\``)
    lines.push(`> **Types file:** \`${TYPES_FILE}\``)
    lines.push('')
    lines.push('---')
    lines.push('')

    // ── Group by controller ──
    const groups = new Map<string, ExtractedCall[]>()
    for (const call of calls) {
        const segments = call.url.split('/').filter(Boolean)
        const controller = segments[1] || 'root'
        const groupName = controller.charAt(0).toUpperCase() + controller.slice(1)
        if (!groups.has(groupName)) groups.set(groupName, [])
        groups.get(groupName)!.push(call)
    }

    // ── Per-controller sections ──
    for (const [groupName, groupCalls] of groups) {
        lines.push(`## ${groupName}`)
        lines.push('')

        for (const call of groupCalls) {
            lines.push(`### ${call.method} \`${call.urlDisplay}\``)
            lines.push('')
            lines.push(`**Source:** \`${call.file}:${call.line}\``)
            lines.push('')

            if (call.requestType) {
                lines.push(`**Request:** \`${call.requestType}\``)
                const reqDef = typeDefinitions.get(call.requestType.replace(/<.*>$/, '').trim())
                if (reqDef) {
                    lines.push('')
                    lines.push(reqDef)
                }
                lines.push('')
            }

            if (call.responseType) {
                lines.push(`**Response:** \`${call.responseType}\``)
                const respDef = typeDefinitions.get(call.responseType.replace(/<.*>$/, '').trim())
                if (respDef) {
                    lines.push('')
                    lines.push(respDef)
                }
                lines.push('')
            }

            lines.push('---')
            lines.push('')
        }
    }

    // ── Summary table ──
    lines.push('## Summary Table')
    lines.push('')
    lines.push('| Method | URL | Request | Response | Location |')
    lines.push('|--------|-----|---------|----------|----------|')
    for (const call of calls) {
        lines.push(
            `| ${call.method} | \`${call.urlDisplay}\` | ${call.requestType ?? '—'} | ${call.responseType ?? '—'} | \`${call.file}:${call.line}\` |`
        )
    }
    lines.push('')

    // ── Full type definitions appendix ──
    if (typeDefinitions.size > 0) {
        lines.push('---')
        lines.push('')
        lines.push('## Type Definitions (from `src/types/api.ts`)')
        lines.push('')
        for (const [name, def] of typeDefinitions) {
            lines.push(`### ${name}`)
            lines.push('')
            lines.push(def)
            lines.push('')
        }
    }

    return lines.join('\n')
}

main()