import { CoverageParser, CoverageParserResult, CoverageParserResultFile } from '../index'

describe('Coverage', function () {
  it('Should parse', async () => {
    const coverage = new CoverageParser(['Repo.Service'], [])
    const coverageResult = await coverage.parseString(testReport)
    expect(coverageResult.lineCoverage).toBe(69.0)
    expect(coverageResult.branchCoverage).toBe(53.49)
    expect(coverageResult.files.length).toBe(1)
    expect(coverageResult.files[0].getLineCoverage()).toBe(50)
  })

  it('Should render summary', async () => {
    const result = new CoverageParserResult()
    result.assemblyIncluded = ['Repo.Service']
    result.assemblyExcluded = ['Repo.Utilities']
    result.lineCoverage = 64.01
    result.branchCoverage = 50
    result.files.push(new CoverageParserResultFile())
    result.files[0].coverableLines = 11
    result.files[0].coveredLines = 6
    result.files[0].branches = 2
    result.files[0].coveredBranches = 1
    expect(result.getCoverageSummary()).toBe(`| Summary | |
|-|-
Line coverage|64.01% (6 of 11)
Branch coverage|50% (1 of 2)
Assemblies|Repo.Service
Assemblies excluded|Repo.Utilities`)
  })

  it('Should render details', async () => {
    const result = new CoverageParserResult()
    result.lineCoverage = 64.01
    result.branchCoverage = 50
    result.files.push(new CoverageParserResultFile())
    result.files[0].fileName = 'test.cs'
    result.files[0].folderPath = 'Test/Folder'
    result.files[0].coverableLines = 11
    result.files[0].coveredLines = 6
    result.files[0].uncoveredLines = 5
    result.files[0].branches = 2
    result.files[0].coveredBranches = 1
    result.files[0].uncoveredLineNumbers = [1, 2, 3, 6, 7]
    result.files.push(new CoverageParserResultFile())
    result.files[1].fileName = 'test2.cs'
    result.files[1].folderPath = 'Test/Folder'
    result.files[1].coverableLines = 12
    result.files[1].coveredLines = 1
    result.files[1].branches = 4
    result.files[1].coveredBranches = 2
    result.files[1].uncoveredBranchLineNumbers = [8, 9, 11]
    result.files.push(new CoverageParserResultFile())
    result.files[2].fileName = 'test3.cs'
    result.files[2].folderPath = 'Test/Another/Folder'
    expect(result.getCoverageDetails()).toBe(
      `<table>
<thead><tr><td>Name<td>Line coverage<td>Uncovered<td>Branch coverage<td>Uncovered
<tbody><tr><td colspan="5">Test/Folder</tr><tr><td>&nbsp;&nbsp;test.cs<td>55%<td><details><summary>5</summary>1-3, 6-7<td>50%<td><tr><td>&nbsp;&nbsp;test2.cs<td>8%<td><td>50%<td><tr><td colspan="5">Test/Another/Folder</tr><tr><td>&nbsp;&nbsp;test3.cs<td><td><td><td></table>`,
    )
  })
})

const testReport = `
<?xml version="1.0" encoding="utf-8"?>
<coverage line-rate="0.1378" branch-rate="0.0861" version="1.9" timestamp="1628600845" lines-covered="7698" lines-valid="55826" branches-covered="1231" branches-valid="14285">
  <packages>
    <package name="Repo.Utilities" line-rate="0.3281" branch-rate="0.22949999999999998" complexity="145">
      <classes>
        <class name="Repo.Utilities.Auth.PrincipalExtensions" filename="Repo.Utilities.Auth.PrincipalExtensions.cs" line-rate="0.3936" branch-rate="0.2812" complexity="64">
          <lines>
            <line number="12" hits="65" branch="False" />
            <line number="13" hits="65" branch="True" condition-coverage="50% (2/4)">
              <conditions>
                <condition number="2" type="jump" coverage="50%" />
                <condition number="23" type="jump" coverage="50%" />
              </conditions>
            </line>
            <line number="22" hits="0" branch="False" />
            <line number="23" hits="0" branch="True" condition-coverage="0% (0/4)">
              <conditions>
                <condition number="2" type="jump" coverage="0%" />
                <condition number="23" type="jump" coverage="0%" />
              </conditions>
            </line>
            <line number="31" hits="511" branch="False" />
            <line number="32" hits="511" branch="True" condition-coverage="50% (2/4)">
              <conditions>
                <condition number="2" type="jump" coverage="50%" />
                <condition number="23" type="jump" coverage="50%" />
              </conditions>
            </line>
            <line number="33" hits="0" branch="False" />
            <line number="34" hits="0" branch="False" />
            <line number="36" hits="511" branch="True" condition-coverage="50% (1/2)">
              <conditions>
                <condition number="52" type="jump" coverage="50%" />
              </conditions>
            </line>
            <line number="37" hits="511" branch="False" />
            <line number="40" hits="0" branch="False" />
            <line number="41" hits="0" branch="True" condition-coverage="0% (0/6)">
              <conditions>
                <condition number="2" type="jump" coverage="0%" />
                <condition number="15" type="jump" coverage="0%" />
                <condition number="31" type="jump" coverage="0%" />
              </conditions>
            </line>
            <line number="42" hits="0" branch="False" />
            <line number="43" hits="0" branch="False" />
            <line number="46" hits="0" branch="True" condition-coverage="0% (0/2)">
              <conditions>
                <condition number="91" type="jump" coverage="0%" />
              </conditions>
            </line>
            <line number="147" hits="0" branch="False" />
            <line number="148" hits="0" branch="False" />
            <line number="151" hits="0" branch="False" />
            <line number="152" hits="0" branch="False" />
          </lines>
        </class>
      </classes>
    </package>
    <package name="Repo.Service" line-rate="0.69" branch-rate="0.5349" complexity="1545">
      <classes>
        <class name="Repo.Service.Get" filename="Repo.Service.cs" line-rate="1" branch-rate="1" complexity="1">
          <lines>
            <line number="294" hits="1" branch="False" />
            <line number="295" hits="1" branch="False" />
            <line number="297" hits="1" branch="False" />
            <line number="298" hits="1" branch="False" />
          </lines>
        </class>
        <class name="Repo.Service.Create" filename="Repo.Service.cs" line-rate="0" branch-rate="0" complexity="2">
            <lines>
            <line number="70" hits="0" branch="False" />
            <line number="71" hits="0" branch="False" />
            <line number="73" hits="0" branch="True" condition-coverage="0% (0/2)">
              <conditions>
                <condition number="205" type="jump" coverage="0%" />
              </conditions>
            </line>
            <line number="74" hits="0" branch="False" />
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`
