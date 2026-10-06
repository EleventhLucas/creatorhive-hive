export const markup = `
        <div class="arena-top garden-only">
          <div class="world-title"><span class="live-dot"></span> GARDEN_01<small>ROUND <span id="round">01</span></small></div>
          <div class="mission-status"><div><span>HIVE</span><strong id="honey">0</strong><span>/ 300</span><span id="percent">0%</span></div><div class="progress-track"><i id="honey-progress"></i></div></div>
          <div class="round-clock"><span id="phase">READY</span><strong id="timer">3:00</strong></div>
          <div class="arena-actions"><button id="sound" title="Toggle sound" aria-label="Enable sound" aria-pressed="false">♪ <span>Sound off</span></button><button id="pause" title="Pause game" aria-label="Pause game" disabled>Ⅱ</button></div>
        </div>
        <div class="scene-label garden-only">HIVE<span>nectar drop-off</span></div>
        <div class="intro garden-only" id="intro"><div><h1>Collect. Return. Repeat.</h1><p>300 nectar. 3 minutes. You + 6 AI scouts.</p></div><button id="start" class="primary play-button" aria-label="Start flight" title="Start flight">▶</button></div>
        <div class="flight-hud garden-only" id="flight-hud" hidden><div><span>YOUR NECTAR</span><div id="bag" class="bag"></div></div><div class="boost"><span id="boost-label">BOOST READY</span><div><i id="boost-meter"></i></div></div><button id="home" title="Point to hive">⌂ <span>Return to hive</span></button></div>
        <div class="mobile-controls garden-only" id="touch-controls"><div class="dpad"><button data-key="KeyW" aria-label="Fly forward">↑</button><button data-key="KeyA" aria-label="Fly left">←</button><button data-key="KeyS" aria-label="Fly backward">↓</button><button data-key="KeyD" aria-label="Fly right">→</button></div><div><button data-key="Space" aria-label="Fly up">↥</button><button data-key="ControlLeft" aria-label="Fly down">↧</button><button data-key="ShiftLeft">Boost</button></div></div>
        `;
