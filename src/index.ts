import * as fs from 'fs'
import { parse } from 'fast-xml-parser'

export class CoverageParserResult {
  assemblyIncluded: string[] = []
  assemblyExcluded: string[] = []
  lineCoverage!: number
  branchCoverage!: number
  files: CoverageParserResultFile[] = []

  getTotalCoveredLines(): number {
    return this.files.map((c) => c.coveredLines).reduce((p, c) => p + c, 0)
  }

  getTotalCoverableLines(): number {
    return this.files.map((c) => c.coverableLines).reduce((p, c) => p + c, 0)
  }

  getTotatlCoveredBranches(): number {
    return this.files.map((c) => c.coveredBranches).reduce((p, c) => p + c, 0)
  }

  getTotalBranches(): number {
    return this.files.map((c) => c.branches).reduce((p, c) => p + c, 0)
  }

  getCoverageSummary(): string {
    const rows: string[] = [
      '| Summary | |',
      '|-|-',
      `Line coverage|${this.lineCoverage}% (${this.getTotalCoveredLines()} of ${this.getTotalCoverableLines()})`,
      `Branch coverage|${this.branchCoverage}% (${this.getTotatlCoveredBranches()} of ${this.getTotalBranches()})`,
    ]

    if (this.assemblyIncluded.length > 0) {
      rows.push(`Assemblies|${this.assemblyIncluded.join(', ')}`)
    }

    if (this.assemblyExcluded.length > 0) {
      rows.push(`Assemblies excluded|${this.assemblyExcluded.join(', ')}`)
    }

    return rows.join('\n')
  }

  getCoverageDetails(): string {
    const folders: Map<string, CoverageParserResultFile[]> = new Map()
    for (const fileItem of this.files) {
      if (folders.has(fileItem.folderPath)) {
        const folder = folders.get(fileItem.folderPath)
        if (folder) {
          folder.push(fileItem)
        }
      } else {
        folders.set(fileItem.folderPath, [fileItem])
      }
    }

    const rows: string[] = []
    for (const [folderPath, fileItems] of folders) {
      rows.push(`<tr><td colspan="5">${folderPath}</tr>`)
      for (const fileItem of fileItems.sort((a, b) => (a.fileName > b.fileName ? 1 : -1))) {
        const lineCoverage = fileItem.getLineCoverage()
        const branchCoverage = fileItem.getBranchCoverage()
        const uncoveredLineNumbers = getLineSpans(fileItem.uncoveredLineNumbers)
        const uncoveredBrancLineNumbers = getLineSpans(fileItem.uncoveredBranchLineNumbers)

        const cells: string[] = [
          `<td>&nbsp;&nbsp;${fileItem.fileName}`,
          `<td>${lineCoverage !== undefined ? `${lineCoverage}%` : ''}`,
          `<td>${
            fileItem.uncoveredLines > 0
              ? `<details><summary>${fileItem.uncoveredLines}</summary>${uncoveredLineNumbers}`
              : ''
          }`,
          `<td>${branchCoverage !== undefined ? `${branchCoverage}%` : ''}`,
          `<td>${
            fileItem.uncoveredBranches > 0
              ? `<details><summary>${fileItem.uncoveredBranches}</summary>${uncoveredBrancLineNumbers}`
              : ''
          }`,
        ]
        rows.push(`<tr>${cells.join('')}`)
      }
    }

    return `<table>
<thead><tr><td>Name<td>Line coverage<td>Uncovered<td>Branch coverage<td>Uncovered
<tbody>${rows.join('')}</table>`
  }
}

export class CoverageParserResultFile {
  folderPath!: string
  fileName!: string
  coverableLines = 0
  coveredLines = 0
  uncoveredLines = 0
  uncoveredLineNumbers: number[] = []
  branches = 0
  coveredBranches = 0
  uncoveredBranches = 0
  uncoveredBranchLineNumbers: number[] = []

  getLineCoverage(): number | undefined {
    return this.coverableLines ? Math.round((this.coveredLines / this.coverableLines) * 100) : undefined
  }

  getBranchCoverage(): number | undefined {
    return this.branches > 0 ? Math.round((this.coveredBranches / this.branches) * 100) : undefined
  }
}

export class CoverageParser {
  private readonly assemblyInclude: string[] = []
  private readonly assemblyExclude: string[] = []

  constructor(assemblyInclude: string[], assemblyExclude: string[]) {
    this.assemblyInclude = assemblyInclude
    this.assemblyExclude = assemblyExclude
  }

  async parseFile(xmlFilePath: string): Promise<CoverageParserResult> {
    const xmlData = fs.readFileSync(xmlFilePath, 'utf8')
    return await this.parseString(xmlData)
  }

  async parseString(xmlData: string): Promise<CoverageParserResult> {
    const xmlDataParsed: IXml = parse(xmlData, {
      attributeNamePrefix: '',
      ignoreAttributes: false,
      arrayMode: new RegExp(/^(package|class|line)$/),
    })

    // Filter assemblies.
    const packages = xmlDataParsed.coverage.packages.package.filter(
      (p) =>
        (this.assemblyInclude.length === 0 || this.assemblyInclude.includes(p.name)) &&
        (this.assemblyExclude.length === 0 || !this.assemblyExclude.includes(p.name)),
    )

    // Map files
    const filesMap: Map<string, IXmlClass> = new Map()
    for (const packageItem of packages) {
      for (const classItem of packageItem.classes.class) {
        const classFilePath = classItem.filename.split('\\').join('/')
        const file = filesMap.get(classFilePath)
        if (file) {
          if (classItem.lines.line) {
            file.lines.line.push(...classItem.lines.line)
          }
        } else {
          filesMap.set(classFilePath, classItem)
        }
      }
    }

    const result = new CoverageParserResult()
    result.assemblyIncluded = this.assemblyInclude
    result.assemblyExcluded = this.assemblyExclude
    result.lineCoverage =
      Math.round(packages.map((p) => Number.parseFloat(p['line-rate'])).reduce((p, c) => p + c, 0) * 100 * 1e2) / 1e2

    result.branchCoverage =
      Math.round(packages.map((p) => Number.parseFloat(p['branch-rate'])).reduce((p, c) => p + c, 0) * 100 * 1e2) / 1e2

    for (const [filePath, fileItem] of filesMap) {
      const fileResult = new CoverageParserResultFile()
      fileResult.fileName = filePath.split('/').pop() || 'unknown'
      fileResult.folderPath = filePath.split('/').slice(0, -1).join('/')

      for (const line of fileItem.lines.line) {
        fileResult.coverableLines++

        if (line.hits === '0') {
          fileResult.uncoveredLines++
          fileResult.uncoveredLineNumbers.push(+line.number)
        } else {
          fileResult.coveredLines++
        }

        if (line.branch === 'True') {
          const branchStats = line['condition-coverage'].match(/\d+/g) // condition-coverage="50% (1/2)"
          if (branchStats) {
            fileResult.coveredBranches += +branchStats[1]
            fileResult.branches += +branchStats[2]
            fileResult.uncoveredBranches += +branchStats[2] - +branchStats[1]
            fileResult.uncoveredBranchLineNumbers.push(+line.number)
          }
        }
      }

      result.files.push(fileResult)
    }
    result.files.reverse()

    return result
  }
}

interface IXml {
  coverage: IXmlCoverage
}

interface IXmlCoverage {
  packages: IXmlPackages
}

interface IXmlPackages {
  package: IXmlPackage[]
}

interface IXmlPackage {
  name: string
  'line-rate': string
  'branch-rate': string
  classes: IXmlClasses
}

interface IXmlClasses {
  class: IXmlClass[]
}

interface IXmlClass {
  name: string
  filename: string
  lines: IXmlLines
}

interface IXmlLines {
  line: IXmlLine[]
}

interface IXmlLine {
  hits: string
  number: string
  branch: 'True' | 'False'
  'condition-coverage': string
}

function getLineSpans(lines: number[]): string {
  const groups = lines
    .sort((a, b) => a - b)
    .reduce((acc: number[][], line) => {
      const lastGroup = acc[acc.length - 1]

      if (!lastGroup || lastGroup[lastGroup.length - 1] !== line - 1) {
        acc.push([])
      }

      acc[acc.length - 1].push(line)

      return acc
    }, [])
  return groups
    .map(function (group) {
      const firstLine = group[0]
      const lastLine = group[group.length - 1]
      return firstLine !== lastLine ? `${firstLine}-${lastLine}` : `${firstLine}`
    })
    .join(', ')
}
