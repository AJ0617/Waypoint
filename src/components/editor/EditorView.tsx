import { AUTON_WINDOW_SEC, fmtDist, stepDuration } from '../../lib/pathSim';
import type { useFieldView } from '../../hooks/useFieldView';
import type { usePlayback } from '../../hooks/usePlayback';
import type { usePathState } from '../../hooks/usePathState';
import type { SelectedPoint, SimResult } from '../../types';
import { FieldCanvas } from './FieldCanvas';
import { PlaybackBar } from './PlaybackBar';
import { CommandList } from './CommandList';

interface EditorViewProps {
  pathApi: ReturnType<typeof usePathState>;
  sim: SimResult;
  playback: ReturnType<typeof usePlayback>;
  fieldView: ReturnType<typeof useFieldView>;
  selectedPoint: SelectedPoint;
  onSelectPoint: (p: SelectedPoint) => void;
}

export function EditorView({ pathApi, sim, playback, fieldView, selectedPoint, onSelectPoint }: EditorViewProps) {
  const { path } = pathApi;
  const { units, allianceColor, startPose, commands } = path;

  const totalDistanceIn = commands.filter((c) => c.action === 'drive').reduce((a, c) => a + c.value, 0);
  const totalDistanceLabel = `TOTAL ${fmtDist(totalDistanceIn, units)} ${units === 'cm' ? 'CM' : 'IN'}`;
  const totalTimeSec = commands.reduce((a, c) => a + stepDuration(c), 0) / 1000;
  const overTime = totalTimeSec > AUTON_WINDOW_SEC;

  return (
    <div className="view">
      <div className="editor-main">
        <div className="editor-toolbar">
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="alliance" checked={allianceColor === 'red'} onChange={() => pathApi.setAlliance('red')} />
              <span className="dot" />RED
            </label>
            <label className="seg-opt">
              <input type="radio" name="alliance" checked={allianceColor === 'blue'} onChange={() => pathApi.setAlliance('blue')} />
              <span className="dot" />BLUE
            </label>
          </div>
          <div className="seg">
            <label className="seg-opt">
              <input type="radio" name="units" checked={units === 'in'} onChange={() => pathApi.setUnits('in')} />
              <span className="dot" />IN
            </label>
            <label className="seg-opt">
              <input type="radio" name="units" checked={units === 'cm'} onChange={() => pathApi.setUnits('cm')} />
              <span className="dot" />CM
            </label>
          </div>
          <span className="tag tag-accent" style={{ marginLeft: 'auto' }}>{totalDistanceLabel}</span>
          <span className="tag tag-neutral">{commands.length} STEPS</span>
          <span
            className={`tag ${overTime ? 'tag-warning' : 'tag-neutral'}`}
            title={overTime ? `Exceeds the ${AUTON_WINDOW_SEC}s autonomous window` : undefined}
          >
            ~{totalTimeSec.toFixed(1)}S{overTime ? ` / ${AUTON_WINDOW_SEC}S` : ''}
          </span>
        </div>

        <PlaybackBar
          currentStep={playback.currentStep}
          stepCount={commands.length}
          playProgress={playback.playProgress}
          isPlaying={playback.isPlaying}
          noPrev={playback.noPrev}
          noNext={playback.noNext}
          currentCommand={commands[playback.currentStep]}
          units={units}
          onToggle={playback.toggle}
          onReset={playback.reset}
          onPrev={playback.prevStep}
          onNext={playback.nextStep}
        />

        <FieldCanvas
          sim={sim}
          startPose={startPose}
          robotWidth={path.robotWidth}
          robotLength={path.robotLength}
          currentStep={playback.currentStep}
          playProgress={playback.playProgress}
          fieldView={fieldView}
          onDragPreview={pathApi.previewDragWaypoint}
          onDragCommit={pathApi.commitDragWaypoint}
          onDragStartPreview={pathApi.previewDragStart}
          onDragStartCommit={pathApi.commitDragStart}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
        />
      </div>

      <CommandList
        commands={commands}
        currentStep={playback.currentStep}
        units={units}
        startPose={startPose}
        onSetStartX={pathApi.setStartX}
        onSetStartY={pathApi.setStartY}
        onSetStartHeading={pathApi.setStartHeading}
        onGoTo={playback.goToStep}
        onToggleDir={pathApi.toggleCommandDir}
        onDelete={pathApi.deleteCommand}
        onChangeValue={pathApi.changeCommandValue}
        onChangeNote={pathApi.changeCommandNote}
        onChangeSpeed={pathApi.changeCommandSpeed}
        onAddDrive={() => pathApi.addCommand('drive')}
        onAddTurn={() => pathApi.addCommand('turn')}
      />
    </div>
  );
}
