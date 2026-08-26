import { useRef, useState } from 'react';
import { fmtDist, metrics, toPx } from '../../lib/pathSim';
import { exportPdf, exportPng } from '../../lib/exportSheet';
import { exportPathFile, parsePathFile } from '../../lib/pathFile';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { usePathState } from '../../hooks/usePathState';
import type { SimResult } from '../../types';
import { FieldSvg } from '../editor/FieldSvg';

interface ExportViewProps {
  pathApi: ReturnType<typeof usePathState>;
  sim: SimResult;
}

export function ExportView({ pathApi, sim }: ExportViewProps) {
  const { path } = pathApi;
  const { ref, width } = useElementWidth(220, 456, 456);
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const m = metrics(width);
  const waypoints = sim.points.slice(1).map((p, i) => {
    const q = toPx(p.x, p.y, m);
    return { px: q.px, py: q.py, num: i + 1, cmdIdx: p.cmdIdx };
  });
  const mainPts = sim.points.map((p) => { const q = toPx(p.x, p.y, m); return `${q.px.toFixed(1)},${q.py.toFixed(1)}`; }).join(' ');

  const totalDistanceIn = path.commands.filter((c) => c.action === 'drive').reduce((a, c) => a + c.value, 0);
  const drivetrainLabel = path.drivetrain === 'tank' ? 'TANK DRIVE' : path.drivetrain === 'mecanum' ? 'MECANUM' : 'X-DRIVE';
  const noneSelected = !path.includeField && !path.includeSteps;
  const onlySteps = path.includeSteps && !path.includeField;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (path.exportFormat === 'pdf') await exportPdf(path);
      else await exportPng(path);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    setImportError(null);
    exportPathFile(path);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parsePathFile(text);
      pathApi.importPath(imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "That doesn't look like a Waypoint path file.");
    }
  };

  return (
    <div className="view export-view">
      <div className="export-preview-wrap">
        <div className="export-sheet">
          <div className="export-sheet-header">
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22 }}>{path.pathName}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: 'var(--color-accent)' }}>{path.teamNumber}</div>
          </div>
          <div className="export-sheet-meta">
            <span>{path.allianceColor.toUpperCase()} ALLIANCE</span><span>·</span>
            <span>{drivetrainLabel}</span><span>·</span>
            <span>TOTAL {fmtDist(totalDistanceIn, path.units)} {path.units === 'cm' ? 'CM' : 'IN'}</span><span>·</span>
            <span>{path.commands.length} STEPS</span>
          </div>
          {path.includeField && (
            <div ref={ref} style={{ position: 'relative', width: '100%', height: m.dispH, margin: '0 0 16px', border: '1px solid #ccc', overflow: 'hidden' }}>
              <FieldSvg m={m} mainPts={mainPts} waypoints={waypoints} />
            </div>
          )}
          <div className="hr" style={{ background: '#141312', margin: '10px 0' }} />
          {noneSelected && (
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Select "include field diagram" and/or "include steps" to build the sheet.</p>
          )}
          {path.includeSteps &&
            path.commands.map((cmd, idx) => {
              const isTurn = cmd.action === 'turn';
              const dirLabel = isTurn ? (cmd.dir === 'left' ? 'LEFT' : 'RIGHT') : cmd.dir === 'forward' ? 'FORWARD' : 'REVERSE';
              const actionLabel = isTurn ? 'TURN' : 'DRIVE';
              const valueDisplay = isTurn ? cmd.value.toFixed(0) : fmtDist(cmd.value, path.units);
              const unit = isTurn ? '°' : path.units;
              return (
                <div key={cmd.id} style={{ display: 'flex', gap: 10, padding: onlySteps ? '14px 0' : '7px 0', borderBottom: '1px solid #ddd', alignItems: 'baseline' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: onlySteps ? 20 : 14 }}>{idx + 1}.</span>
                  <span style={{ fontSize: onlySteps ? 20 : 14, flex: 1, fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{actionLabel} {dirLabel}</span>
                  <span style={{ fontSize: onlySteps ? 20 : 14, fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{valueDisplay} {unit}</span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="export-controls">
        <h6 style={{ margin: 0 }}>PATH DATA</h6>
        <div className="btn-row">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExportJson}>
            EXPORT .JSON
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleImportClick}>
            IMPORT .JSON
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
        {importError ? (
          <p style={{ fontSize: 12, margin: 0, color: 'var(--color-accent)' }}>{importError}</p>
        ) : (
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
            Back up this path to a file, or load one from a teammate. Stored only on this device — importing replaces the current path (undo with Ctrl+Z).
          </p>
        )}
        <div className="hr" />
        <h6 style={{ margin: 0 }}>EXPORT PIT SHEET</h6>
        <div className="field">
          <label>FORMAT</label>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="fmt" checked={path.exportFormat === 'pdf'} onChange={() => pathApi.setExportFormat('pdf')} />
              <span className="dot" />PDF
            </label>
            <label className="seg-opt">
              <input type="radio" name="fmt" checked={path.exportFormat === 'png'} onChange={() => pathApi.setExportFormat('png')} />
              <span className="dot" />PNG
            </label>
          </div>
        </div>
        <div className="field">
          <label>PAPER SIZE</label>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="paper" checked={path.paperSize === 'letter'} onChange={() => pathApi.setPaperSize('letter')} disabled={path.exportFormat === 'png'} />
              <span className="dot" />LETTER
            </label>
            <label className="seg-opt">
              <input type="radio" name="paper" checked={path.paperSize === 'a4'} onChange={() => pathApi.setPaperSize('a4')} disabled={path.exportFormat === 'png'} />
              <span className="dot" />A4
            </label>
          </div>
        </div>
        <label className="radio">
          <input type="checkbox" checked={path.includeField} onChange={pathApi.toggleIncludeField} />
          <span className="dot" />Include field diagram
        </label>
        <label className="radio">
          <input type="checkbox" checked={path.includeSteps} onChange={pathApi.toggleIncludeSteps} />
          <span className="dot" />Include steps
        </label>
        <div className="hr" />
        <button className="btn btn-primary btn-block" onClick={handleDownload} disabled={isExporting || noneSelected}>
          {isExporting ? 'GENERATING…' : 'DOWNLOAD SHEET'}
        </button>
        <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
          One page per path, sized for the pit table binder — large-print steps read at arm's length.
        </p>
      </div>
    </div>
  );
}
