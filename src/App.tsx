import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import './App.css';
import { usePathState } from './hooks/usePathState';
import { usePlayback } from './hooks/usePlayback';
import { useFieldView } from './hooks/useFieldView';
import { useSimulation } from './hooks/useSimulation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { buildThemeVars } from './lib/theme';
import type { SelectedPoint, Tab } from './types';
import { TopNav } from './components/TopNav';
import { SideRail } from './components/SideRail';
import { EditorView } from './components/editor/EditorView';
import { ConfigView } from './components/config/ConfigView';
import { ExportView } from './components/export/ExportView';

export default function App() {
  const pathApi = usePathState();
  const { path } = pathApi;
  const [tab, setTab] = useState<Tab>('editor');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);

  const sim = useSimulation(path.commands, path.startPose);
  const playback = usePlayback(path.commands);
  const fieldView = useFieldView();

  // Adding/removing a step shifts command indices, which would leave a stale `cmdIdx` selected.
  useEffect(() => setSelectedPoint(null), [path.commands.length]);

  useKeyboardShortcuts({
    onPlayPause: playback.toggle,
    onPrevStep: playback.prevStep,
    onNextStep: playback.nextStep,
    onUndo: pathApi.undo,
    onRedo: pathApi.redo,
    hasSelection: tab === 'editor' && selectedPoint != null,
    onNudge: (dx, dy) => {
      if (!selectedPoint) return;
      if (selectedPoint.type === 'start') pathApi.nudgeStart(dx, dy);
      else pathApi.nudgeWaypoint(selectedPoint.cmdIdx, dx, dy);
    },
    onDeselect: () => setSelectedPoint(null),
  });

  const themeVars = buildThemeVars(darkMode, path.allianceColor);

  return (
    <div
      className="app-shell"
      data-waypoint-dark={darkMode ? 'true' : 'false'}
      style={themeVars as CSSProperties}
    >
      <TopNav
        pathName={path.pathName}
        teamNumber={path.teamNumber}
        darkMode={darkMode}
        canUndo={pathApi.canUndo}
        canRedo={pathApi.canRedo}
        onPathNameChange={pathApi.setPathName}
        onTeamNumberChange={pathApi.setTeamNumber}
        onToggleDark={() => setDarkMode((d) => !d)}
        onUndo={pathApi.undo}
        onRedo={pathApi.redo}
      />
      <div className="app-body">
        <SideRail tab={tab} onChange={setTab} />
        {tab === 'editor' && (
          <EditorView pathApi={pathApi} sim={sim} playback={playback} fieldView={fieldView} selectedPoint={selectedPoint} onSelectPoint={setSelectedPoint} />
        )}
        {tab === 'config' && <ConfigView pathApi={pathApi} />}
        {tab === 'export' && <ExportView pathApi={pathApi} sim={sim} />}
      </div>
    </div>
  );
}
